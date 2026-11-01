# Job de CI da extensão Chrome — aplicação manual

> **Por que este arquivo existe:** o token do ambiente de execução **não tem
> escopo `workflow`**, então o GitHub recusa qualquer push que toque em
> `.github/workflows/ci.yml`:
>
> ```
> ! [remote rejected] ... (refusing to allow a Personal Access Token to create
> or update workflow `.github/workflows/ci.yml` without `workflow` scope)
> ```
>
> A API do GitHub também retorna 403 (`Resource not accessible by personal
> access token`).
>
> O job está pronto e testado localmente. **Para aplicar:** copiar o bloco
> abaixo para `.github/workflows/ci.yml` (antes do job `lighthouse-budget`) e
> fazer push com um token que tenha o escopo `workflow` — ou abrir um PR pelo
> GitHub web, que usa a sessão do navegador em vez do token.
>
> Commit de referência: `d712e10` (branch `backup/with-workflow`).

---

## Bloco para inserir em `.github/workflows/ci.yml`

```yaml
  # ---------------------------------------------------------------------------
  # Build da extensão Chrome (MV3) + validação do pacote
  # ---------------------------------------------------------------------------
  # ⚠️ Este job NÃO existia até a F9.6. A extensão nunca foi buildada na CI
  # (o job de build é o Docker do apps/web), e por isso 2 bugs do scaffold
  # sobreviveram ~3 meses:
  #   1. os ícones eram ARQUIVOS DE TEXTO com placeholder — a CWS rejeita
  #      com "Invalid icon file";
  #   2. o manifest pedia host_permissions: ["<all_urls>"].
  #
  # `validate-package` é o portão: ele falha o CI se o pacote gerado não
  # estiver submissível (ícones PNG válidos, permissões mínimas, hosts
  # restritos, entrypoints presentes). A CWS demora dias a semanas para
  # revisar — pegar o erro aqui leva segundos.
  extension:
    name: Build extension (Chrome MV3)
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: 9.12.0
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - name: Generate icons (from brand favicon)
        run: pnpm --filter extension generate-icons
      - name: Typecheck extension
        run: pnpm --filter extension compile
      - name: Build extension
        run: pnpm --filter extension build
      - name: Validate package (manifest, icons, permissions)
        run: pnpm --filter extension validate-package
      - name: Zip for Chrome Web Store
        run: pnpm --filter extension zip
      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: extension-chrome-mv3
          path: apps/extension/.output/*.zip
```

---

## O que o job protege contra

| Verificação | O que ela pega |
|---|---|
| Ícones PNG válidos (checa a assinatura do arquivo) | `icon-48.png` sendo um `.txt` com placeholder — a CWS rejeita com "Invalid icon file" |
| `manifest.icons` presente | extensão submetida com o ícone default genérico |
| Permissões proibidas ausentes | `tabCapture`, `offscreen`, `webRequest`, `webRequestBlocking` |
| Permissões mínimas presentes | `activeTab`, `storage`, `scripting` |
| `host_permissions` restrito | `<all_urls>` ou host de terceiro |
| Service worker e popup no pacote | entrypoint quebrado no build |
| Tamanho do pacote | bundling acidental de arquivo indevido |

## Como verificar localmente

```bash
pnpm extension:build      # gera ícones + build
pnpm extension:validate   # valida o pacote (exit 1 se algo estiver errado)
pnpm extension:zip        # gera o ZIP para a CWS
```

## Referências

- Validador: `apps/extension/scripts/validate-package.ts`
- Geração de ícones: `apps/extension/scripts/generate-icons.ts`
- Config do manifest: `apps/extension/wxt.config.ts`
- Checklist de submissão: `apps/extension/CWS-SUBMISSION.md`
- Fase no plano: `docs/MVP-PLAN.md` §8 (F9, passo F9.6)
