# Documentação — EasyDemo

> **Mapa de navegação da documentação do repositório.**
>
> 141 arquivos `.md` espalhados em 11 diretórios. Este arquivo diz **o que cada
> um é**, **quando abrir** e **quando NÃO mexer**. Ele é espelhado pelo
> `marketing/README.md` (mesmo padrão) e complementa o `AGENTS.md` (que é o
> bootstrap automático para agentes de IA).
>
> **Se você é uma IA lendo isto:** não tente ler tudo. Use a §2 para achar o
> arquivo certo, leia só ele, e siga o protocolo do `AGENTS.md`.
>
> **Data:** 2026-10-25 · **Owner:** tech lead EasyDemo

---

## 1. O que é o EasyDemo

Plataforma de demos interativas de produto: o creator captura telas pela
extensão Chrome, monta um passo a passo clicável no editor, publica um link
público, e o visitante interage, deixa o contato e cai no CTA.

**Status:** PR #24, #26, #27, #29, #30 e #31 mergeados na `main`. CI verde.
Documentação do MVP pronta. Fases F0–F10 do MVP **não iniciadas**.

---

## 2. Onde eu começo?

| Quero… | Abra | E **não** abra |
|---|---|---|
| Executar uma fase do MVP | `AGENTS.md` → `MVP-PLAN.md` §8 | o RFC |
| Saber o que já foi feito | `MVP-PROGRESS.md` §"Status atual" | — |
| Entender por que o sistema é assim | `RFC-Brazilian-Supademo.md` | — |
| Mudar pricing, limites ou fases | `specs/mvp-scope.json` + `MVP-PLAN.md` §5 | o RFC §4 |
| Entender uma decisão de arquitetura | `docs/ADRs/ADR-0NN-*.md` | o RFC |
| Usar a API REST | `docs/api/openapi.yaml` | — |
| Escrever, lançar ou vender | `marketing/README.md` | — |
| Dados de mercado / concorrência | `research/` (leitura) | — |
| Rodar o ambiente local | `scripts/README.md` | — |
| Deploy | `infra/` + `scripts/deploy.sh` | — |

---

## 3. Mapa dos arquivos

### Raiz

| Arquivo | O que é | Quando abrir | Quando **não** mexer |
|---|---|---|---|
| `AGENTS.md` | **Bootstrap para agentes de IA.** Protocolo de 7 passos, as 5 invariáveis inline, fluxo git por fase, comandos de validação | sempre, antes de qualquer trabalho | não edite as invariantes (só acrescente) |
| `README.md` | Front do repo: stack, quickstart, links | presenting o projeto | — |
| `CONTRIBUTING.md` | Como contribuir: convenções de commit, i18n, escopo das mudanças | abrindo PR | — |
| `CODE_OF_CONDUCT.md` | Código de conduta da comunidade | — | — |
| `LICENSE` | **Propriedade Reservada** (não é open source) | dúvida sobre uso do código | — |

### `docs/`

| Arquivo | O que é | Quando abrir | Quando **não** mexer |
|---|---|---|---|
| `MVP-PLAN.md` | **O plano canônico do MVP.** Evidências de mercado (§2), decisões D1–D12 (§3), escopo (§4), planos (§5), invariantes (§6), grafo (§7), **12 fases** (§8), **10 gates** (§9), alpha (§10), lead times (§11) | executando ou planejando uma fase | o escopo aqui é o que vale — o RFC já aponta pra cá |
| `MVP-PROGRESS.md` | **Log append-only de execução.** Status atual + uma entrada por fase concluída | registrando o que você fez; conferindo onde o projeto está | **nunca edite uma entrada antiga** — adicione no final |
| `RFC-Brazilian-Supademo.md` | Arquitetura (§2, 408 linhas: diagrama, DDL, stack justificada), diferenciação (§5), GTM (§6), riscos (§7), env vars (§8) | precisando entender **por que** algo é assim | §1 (escopo), §3 (roadmap) e §4 (pricing) são ponteiros pro MVP Plan |
| `ARCHITECTURE-decision-map.md` | Mapa das 12 decisões de arquitetura com custo e alternativas | entendendo o stack de uma vez | — |
| `SECURITY-MODEL.md` | Modelo de segurança: RLS, auth, secrets, isolamento multi-tenant | mexendo em auth ou RLS | — |
| `SLOs.md` | SLOs do MVP com error budget e janelas de medição | definindo metas de confiabilidade | — |
| `ADRs/ADR-001..013` | 13 Architecture Decision Records (monorepo, Next, Postgres, Drizzle, Clerk, R2, worker, Asaas, Hetzner, pgbackrest, observabilidade, i18n, versão do Postgres) | duvidando de uma decisão de stack | ADRs são registros — **não se reescrevem**, crie um novo que supersede |
| `api/openapi.yaml` | Especificação OpenAPI 3.1 da API REST | integrando com a API | ⚠️ **diverge do código** — a spec descreve endpoints que ainda não existem |
| `api/webhooks.md` | Spec dos webhooks de saída (EasyDemo → cliente) | implementando webhooks de saída | fora do MVP |
| `mcp/server.json` | Config do servidor MCP | — | ⚠️ **MCP está fora do MVP** (RFC §1.2) — não deixe isso te fazer implementar MCP |

### `specs/`

| Arquivo | O que é | Quando abrir | Quando **não** mexer |
|---|---|---|---|
| `mvp-scope.json` | Par machine-readable do MVP Plan: pricing, limites, 12 fases, 10 gates, out_of_scope | script de validação ou mudança de pricing | `plan_status` avisa que o pricing é **estado alvo**, não o do schema atual |
| `mvp-tasks.json` | **Checklist vivo, passo a passo.** 86 passos nas 12 fases, cada um com `status` (`pending` / `in_progress` / `done` / `blocked`), `done_at`, `commit` e `note` | **sempre**, antes de começar a próxima tarefa — é onde a execução está agora | nunca apague um passo; `note` é o que permite retomar depois sem ler o diff |

### `marketing/`

| Arquivo | O que é |
|---|---|
| `README.md` | **Índice do pacote de marketing** — comece por aqui |
| `LAUNCH-PLAN.md` | Plano de lançamento: T-14 → T+4, Product Hunt, soft launch, compare pages |
| `ICP-PERSONAS.md` | ICP macro + 3 personas (Pedro PMM · Carla CS · Rafael founder) |
| `BRAND.md` | Voz, tom, cores, tipografia, logo |
| `SEO-PILLAR-PAGES.md` | 5 pilares + 5 compare pages + 15 posts |
| `CONTENT-CALENDAR.md` | 12 semanas de conteúdo |
| `METRICS-DASHBOARD.md` | KPIs de 90 dias, funil, CAC, cohort |
| `COMPETITIVE-BATTLECARDS.md` | 4 concorrentes + objection handling |
| `SOCIAL-MEDIA-KIT.md` | Scripts LinkedIn/Twitter/IG/Reels |
| `TEMPLATES/` | 6 templates de e-mail (cold, follow-up, welcome, billing failed, reactivation, afiliados) |
| `CASE-STUDIES/` | 3 estudos de caso — ⚠️ **FICTÍCIOS**, bloquear lançamento público até substituir |

### `research/` (56 arquivos — leitura)

| Pasta | O que é |
|---|---|
| `demos/` | Deep dive por competidor (Supademo, Storylane, Navattic, Arcade, GuiaFlow, Loom, Scribe, Tango…) |
| `pricing/` | Pricing dos concorrentes, síntese, unit economics, canais GTM |
| `tech/` | Arquitetura, backend, analytics, payments BR, extensão MV3, public player |
| `live-2026/` | Dados coletados ao vivo em Out/2026 (G2/Capterra, Chrome Store, movimentos de mercado) |
| `sources.md` | Índice de fontes |

> **É registro histórico de pesquisa.** Não edite — se um dado mudou, escreva
> um arquivo novo em `live-2026/`.

### `scripts/` (17 arquivos)

| Arquivo | O que faz |
|---|---|
| `setup.sh` | Setup completo do ambiente de desenvolvimento |
| `init-db.sh` | Cria roles, aplica migrations, prepara o banco |
| `seed.ts` | Popula o banco com dados de demonstração |
| `check-dpo-missing.ts` | Valida placeholders de DPO nos docs legais (roda na CI) |
| `mvp-status.ts` | `pnpm scripts:mvp-status` — imprime a fase atual, o **próximo passo**, o gate e o placar das 12 fases. **Comece por aqui** | retomando o trabalho depois de uma pausa | — |
| `mvp-task.ts` | `pnpm scripts:mvp-task <PASSO> done "<nota>"` — marca um passo do checklist como concluído (ou `blocked`). Grava `status`, `done_at`, `commit` e `note` | marcando progresso, a cada passo | não edite `specs/mvp-tasks.json` na mão — use o comando |
| `health-check.sh` | Verifica os endpoints de saúde da stack |
| `pre-deploy.sh` / `deploy.sh` | Checklist e execução do deploy |
| `provision-hetzner.sh` / `setup-cloudflare.sh` | Provisionamento de infra |
| `db-snapshot.sh` / `restore-drill.sh` | Backup e teste de restore |
| `db/test-rls.ts` | 11 checks de isolamento multi-tenant (roda na CI) |
| `db/test-rls-admin.ts` | Variante admin dos checks de RLS (BYPASSRLS), pra diagnóstico |
| `README.md` | Índice dos scripts |

### `infra/` (11 arquivos)

| Arquivo | O que é |
|---|---|
| `docker-compose.yml` / `.prod.yml` | Stack local e de produção (web, worker, postgres) |
| `Caddyfile` + `observability/Caddyfile` | Reverse proxy e TLS |
| `postgres/postgresql.conf` | Tuning do Postgres (single-node, 8 GB) |
| `postgres/init-roles.sql` | Roles `app_user` / `app_owner` / `readonly` |
| `postgres/ROLES.md` | Documentação das roles do Postgres e por que cada uma existe |
| `postgres/pgbackrest.conf` | Backup cifrado pro R2 |
| `observability/otel-collector.yaml` | Coleta de traces e métricas |
| `hetzner/` | cloud-init e README de provisionamento do VPS |

### `setup-report/` (24 arquivos — histórico)

> **Registro de execução das sessões de setup do projeto.** São relatórios do
> que foi rodado e decidido na época (Playwright, E2E, Hetzner, RLS, DPO,
> porta do Postgres, cobertura). **Histórico — não edite.** Serve pra saber
> *o que já foi tentado* e *por que uma decisão foi tomada*.

| Arquivo | O que é |
|---|---|
| `PHASE-1..14-*` | Relatório por fase do setup (install, cobertura, E2E, RLS, Hetzner, legal, DPO, runtime) |
| `CONCLAVE-*.md` | Revisões por lente (dev, PM/legal, SRE, fix-priority, pr-checklist) |
| `INDEX.md` | Índice do pacote (quando existir) |

### `.github/`

| Arquivo | O que é |
|---|---|
| `workflows/ci.yml` | Jobs: lint, typecheck, test, build (docker), lighthouse-budget |
| `workflows/deploy.yml` | Deploy → Hetzner (push na `main`) |
| `dependabot.yml` | Atualizações automáticas de dependência |
| `PULL_REQUEST_TEMPLATE.md` | Template de PR |
| `copilot-instructions.md` | ⚠️ **não existe** — o Copilot lê `AGENTS.md` nativamente |

### `apps/` e `tests/` (4 arquivos)

| Arquivo | O que é |
|---|---|
| `apps/web/tests/setup-playwright.md` | Como instalar o Playwright e as deps de Linux no CI (linka os reports em `setup-report/`) |
| `apps/web/a11y/REPORT.md` | Resultado da auditoria de acessibilidade do player |
| `tests/COVERAGE-REPORT.md` | Relatório de cobertura de testes — histórico |

---

## 4. Visão geral das fases do MVP

```
                         ┌──────────────────────────────────┐
                         │ PR 1 — Rename EasyDemo           │
                         │ 195 arquivos, mecânico            │  → G0
                         └──────────────┬───────────────────┘
                                        │
                          ┌─────────────▼─────────────┐
                          │ F0 — Pricing flat          │  → (sem gate próprio)
                          │ 0004_flat_plans + lib/plans │
                          └─────────────┬─────────────┘
                                        │
                          ┌─────────────▼─────────────┐
                          │ F1 — Publicação real       │  → G1
                          │ /demos/new + publish       │
                          └──────┬───────────────┬──────┘
                                 │               │
              ┌──────────────────▼──┐         ┌──▼──────────────────┐
              │ F2 — Upload manual  │         │ F8 — Legal + go-live │
              │ ⚠️ BLOQUEADOR ALPHA │         │ (DPO + CNPJ)         │  → G7
              └──────────────────┬──┘         └──┬──────────────────┘
                                 │               │
    ┌────────────┬───────────────┼───────┐       │
    ▼            ▼               ▼       ▼       │
┌───────┐  ┌─────────┐     ┌─────────┐ ┌──────┐  │
│F3 Lead│  │F4 Billing│    │F5 Anal. │ │F6 Emb│  │
│ + CTA  │  │  Asaas   │    │         │ │+badge│  │
└───┬───┘  └────┬────┘     └────┬────┘ └──┬───┘  │
    │           │               │          │      │
    │      ┌────▼────┐          │     ┌────▼────┐ │
    │      │F7 Brand │          │     │F9 Ext.  │ │
    │      └─────────┘          │     │Chrome   │ │
    │                            │     └─────────┘ │
    └────────────┬───────────────┴───────┬───────┘
                 │                       │
            ┌────▼───────────────────────▼────┐
            │ F10 — E2E + alpha GTM            │  → G5, G6
            │ 5–10 empresas BR, funil medido    │
            └───────────────────────────────────┘
```

**10 gates:** G0 rename · **G0.5 pricing** · G1 publicação · **G1.5 upload manual** · G2 lead · G3
pagamento · G4 embed+badge · G5 E2E (cobre F5/F7/F9) · G6 alpha · G7 go-live público.

**G6 ≠ G7.** O alpha (grupo fechado de early users) pode rodar com o DPO
pendente. O **go-live público** exige DPO, CNPJ e legal revisado — num produto
que vende "LGPD by design", publicar com `placeholder@easydemo.io` destrói a
proposta de valor.

---

## 5. As 5 regras invioláveis

Detalhe em `AGENTS.md` §"Invariantes".

1. **`NODE_ENV` nunca no `.env`** — o Next gerencia. Se vazar `development` pro
   build, o prerender de `/404` aborta.
2. **YAML `run: |` não dobra escape** — `\\(` vira `\(` no shell e quebra o job.
   Escreva `\(`.
3. **`NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` placeholder derruba o dev server do
   Playwright** — o Clerk valida a key no middleware.
4. **Policy RLS pública só sem tenant no contexto** — precisa de
   `app.current_tenant_id() IS NULL`.
5. **`"type": "module"` + `import.meta.url` no alias do webpack** — quebra o
   alias `@/`.

---

## 6. Comandos

```bash
pnpm dev              # Next em :3000
pnpm worker           # graphile-worker
pnpm extension:dev    # extensão Chrome

pnpm lint             # Biome — 209 arquivos
pnpm typecheck        # tsc nos 4 pacotes
pnpm test             # Vitest — 152 testes
pnpm test:rls         # 11 checks de isolamento multi-tenant
pnpm test:e2e         # Playwright (precisa de dev server)

pnpm db:migrate       # aplica migrations
pnpm db:seed          # dados de demonstração
pnpm build            # build de todos os pacotes
```

> ⚠️ **`pnpm test` precisa de `.env` carregado**, senão 4 arquivos de teste de
> integração falham com `DATABASE_URL: Required`. **Não é regressão:**
> `set -a; source .env; set +a`

---

## 7. Armadilhas que já morderam

Todas aconteceram de verdade neste repo. Não repita.

| Armadilha | Sintoma | Prevenção |
|---|---|---|
| `NODE_ENV=development` no `.env` | `next build` aborta com `<Html> should not be imported outside of pages/_document` | `.env.example` não tem `NODE_ENV`; `Dockerfile` fixa `production` |
| `\\(` em `run: \|` do workflow | `syntax error near unexpected token '('` | use `\(` |
| `pk_test_ci_placeholder` no Clerk | dev server do Playwright não sobe | chave real no CI (F10) |
| `pnpm test` sem `.env` | 4 arquivos falham com `DATABASE_URL: Required` | `set -a; source .env; set +a` |
| Policy RLS pública sem `IS NULL` | tenants vazam demos publicadas uns dos outros | ver migration `0003` |
| Teste que assume seed no banco | passa local, falha na CI | teste cria os próprios dados |

---

## 8. Inconsistências conhecidas

Declaradas aqui porque uma IA pode tropeçar nelas e "consertar" errado.

| Inconsistência | Realidade | O que fazer |
|---|---|---|
| ~~**ADR-003 diz PostgreSQL 17**~~ | ✅ **Resolvido** em 2026-10-25 — a versão canônica é **16** (o que o compose usa desde o scaffold). Criado o [ADR-013](ADRs/ADR-013-postgres-16-canonical.md); ADR-003 e ADR-009 marcados como superseded | Não mexer no `docker-compose.yml`. **Não** implementar upgrade pra 17 no MVP |
| **Benchmarks de POC são de Postgres 17** | Os POCs em `research/pocs/` rodaram de verdade com 17. A produção é 16 | Re-rodar os POCs com `postgres:16-alpine` antes de usar os números como SLA. Notas no topo de cada POC |
| ~~**24 arquivos de doc ainda dizem "DemoBR"**~~ | ✅ **Resolvido** no PR 1 (branch `chore/rename-easydemo`) — a marca foi renomeada em 189 arquivos | — |
| ~~**`marketing/README.md` registra "Nome do produto: DemoBR (mantido)"**~~ | ✅ **Resolvido** no PR 1 | — |
| **`docs/api/openapi.yaml` descreve endpoints que não existem** (`/leads`, `/billing/checkout`, `/publish`) | A spec foi escrita antes da implementação | Não use a spec como contrato de código. Alinhar em fase própria |
| **`docs/mcp/server.json` existe** mas MCP está fora do MVP | RFC §1.2 | Não implemente MCP por causa do arquivo |
| **`marketing/CASE-STUDIES/` tem 3 casos fictícios** | O próprio `marketing/README.md` declara | Bloqueante de lançamento público (gate G7) |

---

## 9. Fora do escopo do MVP

14 itens adiados. Tabela completa e razões em `MVP-PLAN.md` §4.2.

| Categoria | Itens |
|---|---|
| **Upsell (Fase 2)** | Showcase `/c/[slug]` · versioning · branching · variáveis · blur/redaction · texto auto do hotspot · preset WhatsApp |
| **V2** | TTS voiceover · AI text generation · CRM BR · custom domain · HTML clone · sandbox · mobile demo · Figma · AI Command / MCP / AI Demo Agent · Route Hub / In-App Demo Hub · SSO / SOC 2 / multi-workspace · export MP4/GIF/SCORM/SOP |
| **Outros** | Stripe como gateway (Asaas é o checkout BR do MVP) · cobrança por creator seat adicional · pastas de biblioteca · multi-select de steps · tool grátis adjacente de topo de funil |

> **A regra:** MVP = paridade com o core do Supademo (Free + Scale) + 3 gaps de
> mercado BR (PIX/BRL, LGPD/DSR, PT-BR). **Zero feature inventada.** Tudo que o
> Supademo não tem **e** não é gap BR fica fora até os dados pedirem.
>
> ⚠️ **Dívida competitiva conhecida:** o Free do Supademo inclui "AI text
> personalization". O Free do EasyDemo não terá IA no MVP — o que faz o Pro
> ser mais fraco que o Scale deles. Fase 2 prioritária.

---

## Referências

| Preciso de… | Onde |
|---|---|
| Evidência de mercado (dados primários) | `MVP-PLAN.md` §2 |
| Decisões D1–D12 | `MVP-PLAN.md` §3 |
| Tarefas de cada fase | `MVP-PLAN.md` §8 |
| Gates go/no-go | `MVP-PLAN.md` §9 |
| Log de execução | `MVP-PROGRESS.md` |
| Protocolo para agentes de IA | `../AGENTS.md` |
| Arquitetura e stack | `RFC-Brazilian-Supademo.md` |
| Marketing e GTM | `../marketing/README.md` |
| Dados de mercado | `../research/` |
