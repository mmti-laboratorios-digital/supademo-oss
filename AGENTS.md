# AGENTS.md — EasyDemo

> Este arquivo é lido automaticamente por agentes de IA (Claude Code, Cursor,
> Codex, Copilot). Ele é o **bootstrap**: não contém o plano, aponta para ele.

## O que você está fazendo

Você vai executar **uma fase do MVP do EasyDemo**. O plano canônico é
[`docs/MVP-PLAN.md`](docs/MVP-PLAN.md).

O EasyDemo é uma plataforma de demos interativas de produto: o creator captura
telas pela extensão Chrome, monta um passo a passo clicável no editor, publica
um link público, e o visitante interage, deixa o contato e cai no CTA.

## Protocolo de execução (obrigatório, nesta ordem)

1. **Leia `docs/MVP-PLAN.md` §0** — TL;DR + o protocolo completo (~3 min).
2. **Leia `docs/MVP-PLAN.md` §6** — as invariantes. São 5 regras que, se violadas,
   quebram build, CI ou isolamento de dados (~3 min).
3. **Leia a §8 do plano, só a sua fase.** O prompt que te trouxer a fase vem com
   o identificador (ex.: "minha fase é F3").
4. **Leia os "Arquivos a ler antes" da sua fase.** É onde estão os padrões a
   copiar, os contratos existentes e **o que já está pronto e deve ser
   reaproveitado** em vez de reimplementado.
5. **Edite só os "Arquivos a tocar".** Depois rode os comandos de validação.
   Se algum check falhar, **não avance** — conserte e revalide.
6. **Registre o que foi feito** em `docs/MVP-PROGRESS.md` (passo 6 abaixo).

## Registro de execução (obrigatório)

> **Sem isso, o próximo dev — ou a próxima IA — perde o contexto.**

Ao terminar uma fase:

1. Abra `docs/MVP-PROGRESS.md`.
2. **Adicione uma entrada no FINAL do arquivo** (nunca edite entradas antigas).
3. Preencha o modelo da seção "Como registrar uma fase":
   - o que passou a funcionar (do ponto de vista de quem usa o produto)
   - arquivos criados e modificados
   - **decisões tomadas durante a execução** (e por quê)
   - **armadilhas** — o que parece óbvio mas não é, e o que custa tempo
   - a validação rodada (comandos + resultado)
   - o que ficou pra depois
4. Atualize a tabela **"Status atual"** no topo do arquivo (fase em andamento,
   última fase concluída, próxima fase, bloqueios, branch, commit, gate).

O histórico do git mostra *o que* mudou. O log registra *por quê* — e é o que não
pode ser redescoberto.

## Invariantes — nunca violar

1. **`NODE_ENV` nunca no `.env`.** O Next gerencia esse valor. Se `development`
   vazar para o `next build`, o prerender de `/404` aborta com
   `<Html> should not be imported outside of pages/_document`.
2. **YAML `run: |` não dobra escape.** `\\(` num workflow vira `\(` no shell e
   quebra com `syntax error near unexpected token '('`. Escreva `\(`.
3. **`NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` placeholder derruba o dev server do
   Playwright** — o Clerk valida a key no middleware e o servidor não sobe.
4. **Policy RLS pública só se aplica sem tenant no contexto** — precisa de
   `app.current_tenant_id() IS NULL`. Senão tenants autenticados vazam demos
   publicadas uns dos outros (já aconteceu; ver migration `0003`).
5. **`"type": "module"` + `import.meta.url` no alias do webpack** quebra o
   alias `@/` no build.

## Validação

Rode ao final de cada fase:

```bash
pnpm lint          # Biome — 209 arquivos
pnpm typecheck     # tsc nos 4 pacotes
pnpm test          # Vitest — 152 testes
```

> ⚠️ `pnpm test` precisa de `.env` carregado, senão 4 arquivos de teste de
> integração falham com `DATABASE_URL: Required` — **não é regressão**:
> `set -a; source .env; set +a`

## Contexto do repositório

- **Monorepo pnpm 9.12.0**, Node 22 (`.nvmrc`). Workspaces: `apps/*`,
  `packages/*`.
- `apps/web` = Next.js 15 App Router (o produto). `apps/workers` =
  graphile-worker. `apps/extension` = Chrome MV3.
  `packages/{shared,player,ui}` = bibliotecas.
- **Lint/format**: Biome (2 espaços, organize imports). **Não** use ESLint/Prettier.
- **Alias** `@/*` → `apps/web/*` via tsconfig paths.
- **Commits**: Conventional Commits em português (`fix(build):`, `feat:`).
- **Branch**: `main` é protegida (peer review obrigatório). Trabalhe em branch
  própria e abra PR.
- **Banco**: Postgres 16 com RLS. Duas conexões — `DATABASE_URL` (`app_user`,
  respeita RLS) e `DIRECT_URL` (`app_owner`, BYPASSRLS, só migrations).
- **Testes de RLS**: `pnpm test:rls` — 11 checks de isolamento multi-tenant.
  Rode depois de qualquer mudança em policy ou migration.

## Onde procurar o quê

| Preciso de… | Onde está |
|---|---|
| O que fazer, em que ordem, até quando | `docs/MVP-PLAN.md` §8 |
| **O que já foi feito e por quê** | **`docs/MVP-PROGRESS.md`** (log append-only) |
| Por que o sistema é assim (stack, arquitetura, env vars) | `docs/RFC-Brazilian-Supademo.md` §2 e §8 |
| Pricing e limites machine-readable | `specs/mvp-scope.json` |
| Evidência de mercado por trás das decisões | `docs/MVP-PLAN.md` §2 |
| Decisões D1–D12 | `docs/MVP-PLAN.md` §3 |
| Invariantes e anti-padrões | `docs/MVP-PLAN.md` §6 |
| Gates go/no-go | `docs/MVP-PLAN.md` §9 |
| ADRs (decisões de arquitetura) | `docs/ADRs/` |

## Escopo do MVP

O MVP entrega o core inteiro: captura (extensão **e** upload manual), editor,
publicação, player público, embed, lead form, CTA, analytics e billing via PIX.

**Regra:** MVP = paridade com o core do Supademo (Free + Scale) + 3 gaps de
mercado BR (PIX/BRL, LGPD/DSR, PT-BR). **Zero feature inventada.** Tudo que o
Supademo não tem **e** não é gap BR fica fora até os dados pedirem.
