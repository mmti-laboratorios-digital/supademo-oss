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

1. **Rode `pnpm scripts:mvp-status`.** Ele imprime a fase atual, o **próximo
   passo**, o gate e o placar das 12 fases. É o comando que substitui ler o log
   inteiro — **comece sempre por ele**.
2. **Leia `docs/MVP-PLAN.md` §0.2** — o protocolo de execução da IA, o loop e as
   4 regras que não se negociam (~4 min).
3. **Leia `docs/MVP-PLAN.md` §6** — as invariantes. São 5 regras que, se violadas,
   quebram build, CI ou isolamento de dados (~3 min).
4. **Leia a §8 do plano, só a sua fase.** O prompt que te trouxer a fase vem com
   o identificador (ex.: "minha fase é F3"). Leia também a **§8.0 (Fluxo git por
   fase)**.
5. **Leia os "Arquivos a ler antes" da sua fase.** É onde estão os padrões a
   copiar, os contratos existentes e **o que já está pronto e deve ser
   reaproveitado** em vez de reimplementado.
6. **Execute UM passo por vez.** Cada fase tem passos numerados no
   `specs/mvp-tasks.json`. Edite só os "Arquivos a tocar" da fase.
7. **Marque o passo como concluído** — **no mesmo commit** em que você fez o
   passo:

   ```bash
   pnpm scripts:mvp-task F3.2 done "o que você fez, em uma frase"
   ```

   O script grava `status`, `done_at`, `commit` e `note` em
   `specs/mvp-tasks.json`. Para um passo travado por dependência externa:
   `pnpm scripts:mvp-task F8.1 blocked "o que falta e quem resolve"`.
8. **Rode os comandos de validação.** Se algum check falhar, **não avance** —
   conserte e revalide.
9. **Ao fim da fase,** registre em `docs/MVP-PROGRESS.md` (entrada nova no final)
   e marque a fase como `done` em `specs/mvp-tasks.json`.

### As 4 regras que não se negociam

1. **Não pare no meio de um passo.** Se um check falhar, corrija e reexecute.
2. **Não pare no meio de uma fase.** A única exceção: passo **bloqueado por
   dependência externa** (DPO, CNPJ, conta de sandbox, aprovação da Chrome Web
   Store). Aí marque `"status": "blocked"` com uma nota dizendo **o que falta e
   quem resolve**, siga para o próximo passo e registre no
   `docs/MVP-PROGRESS.md`.
3. **Só pare quando não sobrou nada** — todos os passos `done`, ou os que
   faltam `blocked` **e** registrados. Antes de encerrar, rode
   `pnpm scripts:mvp-status` e confirme que o checklist está consistente.
4. **Escreva o progresso sempre.** Passou um passo → marque no
   `specs/mvp-tasks.json`. Terminou a fase → escreva no `docs/MVP-PROGRESS.md`.

## Os 3 arquivos do MVP

| Arquivo | Papel | Quem escreve |
|---|---|---|
| **`docs/MVP-PLAN.md`** | **O quê** — escopo, passos de cada fase, gates | humano (raro) |
| **`specs/mvp-tasks.json`** | **Onde estou** — checklist vivo, passo a passo | **você, a cada passo** |
| **`docs/MVP-PROGRESS.md`** | **Por quê** — log narrativo append-only | você, ao fim da fase |

`specs/mvp-tasks.json` é a **fonte da verdade do progresso**. O
`MVP-PROGRESS.md` é o diário. O plano é o contrato. Não escreva progresso em
lugar nenhum além desses três.

## Fluxo git por fase

1 fase = 1 branch = 1 PR. Branch `feat/f<n>-<slug>`. Base `main`.
A fase só entra na `main` quando o **gate dela** (§9 do plano) passa e a CI
está verde. A entrada no `docs/MVP-PROGRESS.md` vai **no mesmo PR**.

**Depois do merge, delete a branch** — `git push origin --delete <branch>`.
Confirme antes que ela está 100% mergeada:
`git merge-base --is-ancestor origin/<branch> origin/main`.

Detalhes, paralelismo e agrupamento de fases: `docs/MVP-PLAN.md` §8.0.

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
5. Marque a fase como `done` em `specs/mvp-tasks.json` e atualize `current`.

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
| **Mapa de toda a documentação** | **`docs/README.md`** — o que cada arquivo é, quando abrir, quando não mexer |
| **Onde a execução está agora** | **`pnpm scripts:mvp-status`** (fase, próximo passo, gate, placar) |
| **Checklist vivo, passo a passo** | **`specs/mvp-tasks.json`** — o que está `done` / `pending` / `blocked` |
| O que fazer, em que ordem, até quando | `docs/MVP-PLAN.md` §8 |
| **O que já foi feito e por quê** | **`docs/MVP-PROGRESS.md`** (log append-only) |
| Por que o sistema é assim (stack, arquitetura, env vars) | `docs/RFC-Brazilian-Supademo.md` §2 e §8 |
| Pricing e limites machine-readable | `specs/mvp-scope.json` |
| Evidência de mercado por trás das decisões | `docs/MVP-PLAN.md` §2 |
| Decisões D1–D12 | `docs/MVP-PLAN.md` §3 |
| Invariantes e anti-padrões | `docs/MVP-PLAN.md` §6 |
| Fluxo git por fase | `docs/MVP-PLAN.md` §8.0 |
| Gates go/no-go | `docs/MVP-PLAN.md` §9 |
| ADRs (decisões de arquitetura) | `docs/ADRs/` |
| Marketing, GTM e lançamento | `marketing/README.md` |

## Escopo do MVP

O MVP entrega o core inteiro: captura (extensão **e** upload manual), editor,
publicação, player público, embed, lead form, CTA, analytics e billing via PIX.

**Regra:** MVP = paridade com o core do Supademo (Free + Scale) + 3 gaps de
mercado BR (PIX/BRL, LGPD/DSR, PT-BR). **Zero feature inventada.** Tudo que o
Supademo não tem **e** não é gap BR fica fora até os dados pedirem.
