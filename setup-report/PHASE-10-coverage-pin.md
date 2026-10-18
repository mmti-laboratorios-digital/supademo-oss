# PHASE-10 — Pin de `@vitest/coverage-v8` em ^2.1.4

## TL;DR

- **Problema**: `vitest@2.1.4` (peer) instalado em `apps/web` resolvia `@vitest/coverage-v8@5.x` por dependência transitiva, gerando `SyntaxError: BaseCoverageProvider not exported` ao rodar `vitest run --coverage`.
- **Solução**: pin explícito em `apps/web/package.json` + override duplo (workspace + root) para impedir drift em qualquer install futura.
- **Status atual**: ✅ 126/126 tests passam, coverage reporta 12.59% statements / 60.28% branches / 36.11% functions / 12.59% lines.

---

## Versões pinadas

| Pacote               | Versão       | Onde                                   |
| -------------------- | ------------ | -------------------------------------- |
| `vitest`             | `2.1.4`      | `apps/web/package.json` (devDependencies) |
| `@vitest/coverage-v8`| `^2.1.4`     | `apps/web/package.json` + overrides    |

## Por que esse pin é necessário

`vitest@2.x` declara peer-dependency `@vitest/coverage-v8@^2`. Sem override, pnpm satisfaz o peer pelo grafo global e pode terminar instalando `@vitest/coverage-v8@5.x` (versão major incompatível com vitest 2.x — a 5.x removeu `BaseCoverageProvider` da API pública). Resultado:

```
Error: SyntaxError: The requested module '@vitest/coverage-v8' does not provide
an export named 'BaseCoverageProvider'
```

A correção é **dois mecanismos de defesa** para garantir que o pin sobreviva a `pnpm install --frozen-lockfile`, `pnpm install` puro e CI:

1. **Direct dep** em `apps/web/package.json` (resolução local);
2. **Override** declarado em `pnpm-workspace.yaml` E em `package.json` raiz (`pnpm.overrides`) — pnpm prioriza a versão do override sobre qualquer transitive.

## Arquivos alterados

### `pnpm-workspace.yaml`

Adicionado bloco `overrides`:

```yaml
# Pin de versões críticas para evitar drift entre dev/CI/prod
# (vitest 3.x tem peer @vitest/coverage-v8 ^3, e a versão 5.x do coverage-v8
# exporta BaseCoverageProvider que quebra o vitest 2.x com SyntaxError)
overrides:
  "@vitest/coverage-v8": "^2.1.4"
```

### `package.json` (raiz)

Adicionado bloco `pnpm.overrides` (redundância proposital com `pnpm-workspace.yaml`):

```json
"pnpm": {
  "overrides": {
    "@vitest/coverage-v8": "^2.1.4"
  }
}
```

### `apps/web/package.json`

Já estava correto antes desta fase:

```json
"@vitest/coverage-v8": "^2.1.4",
"vitest": "2.1.4"
```

### `.github/workflows/ci.yml`

Adicionado step `Coverage check (vitest --coverage)` no job `test`, mais upload de artefato `coverage-report`:

```yaml
- run: pnpm install --frozen-lockfile
- run: pnpm --filter web db:push
- run: pnpm test
- name: Coverage check (vitest --coverage)
  run: pnpm --filter web exec vitest run --coverage --coverage.reporter=text-summary
- uses: actions/upload-artifact@v4
  if: always()
  with:
    name: coverage-report
    path: apps/web/coverage/
```

---

## Como regenerar o lockfile

Se a versão driftar no futuro, force a resolução:

```bash
cd /home/dan/saas/supademo-oss
rm -rf apps/web/node_modules pnpm-lock.yaml
pnpm install
pnpm why @vitest/coverage-v8 -r --filter web
```

A saída de `pnpm why` deve listar **somente** `2.1.4` (sem `5.x` em nenhum lugar).

## Como reproduzir o bug original

Para confirmar que o pin está fazendo efeito, simule a quebra:

```bash
cd /home/dan/saas/supademo-oss
# Remove override temporariamente
pnpm remove -w --configOverrides.delete @vitest/coverage-v8
# Força upgrade
pnpm add -D -w @vitest/coverage-v8@^5
cd apps/web && pnpm exec vitest run --coverage
# → SyntaxError: BaseCoverageProvider not exported
```

Depois restaurar:

```bash
git checkout pnpm-workspace.yaml package.json
pnpm install
```

## Comando de validação

```bash
cd /home/dan/saas/supademo-oss/apps/web
pnpm exec vitest run --coverage --coverage.reporter=text-summary
```

Saída esperada (resumo):

```
Test Files  12 passed (12)
     Tests  126 passed (126)

 % Coverage report from v8
=============================== Coverage summary ===============================
Statements   : 12.59% ( 610/4845 )
Branches     : 60.28% ( 126/209 )
Functions    : 36.11% ( 26/72 )
Lines        : 12.59% ( 610/4845 )
================================================================================
```

---

## Restrições aplicadas

- ✅ Nenhuma alteração em `lib/billing/*`
- ✅ Nenhuma alteração em outras versões de Vitest (apenas o pin do coverage)
- ✅ Mudanças mínimas: 2 arquivos de config (root + workspace yaml) + 1 step no CI + 1 doc