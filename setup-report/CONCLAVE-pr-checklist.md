# CONCLAVE PO — PR #1 Greenlight Checklist · EasyDemo v0.1

> **Persona:** PO/PM SaaS B2B (8 anos GTM/PLG LATAM).
> **Data:** 2026-10-18.
> **Escopo:** definir gates de PR, checklist final e descrição para o **primeiro merge** da branch atual → `main` + abertura do PR público.
> **Premissa:** o PR #1 é um **scaffold open-source** — *production-ready-ish*, com bloqueadores conhecidos mapeados em issues, **não** go-live comercial.
> **Veredito (1 linha):** 🟡 **Pode abrir PR público, NÃO pode receber merges em `main` enquanto (a) CI estiver vermelho, (b) LICENSE/CONTRIBUTING/CODE_OF_CONDUCT não existirem, e (c) ao menos 1 dos 6 CRÍTICOS não tiver PR de fix aberto.**

---

## 1. Inventário do estado atual do repo

### 1.1 Repositório (via `gh` API)

| Item | Estado atual | Bloqueia PR #1? |
|---|---|---|
| Repo | `mmti-laboratorios-digital/supademo-oss` (PRIVATE) | ⚠️ **Sim** — enquanto privado, GitHub **não permite branch protection rules** (HTTP 403 ao chamar `branches/main/protection`). Para um "clone brasileiro OSS" o repo precisa virar público **antes** do PR #1, ou o greenlight de branch protection vira cosmético. |
| PRs abertos | **3** — todos `dependabot/npm_and_yarn/pnpm-*` (#20, #21) e `dependabot/docker/node-26-alpine` (#1) | Não |
| Workflows ativos | `CI` (388815781) · `Deploy` (388815782) · `Dependabot Updates` (388813037) | Não |
| **Environments** | Apenas `production` (criado 2026-10-18 22:25 UTC, sem protection rules) | 🟡 Não bloqueia PR, mas **dev/staging ausente** — toda a pipeline de CI/CD aponta direto para produção. |
| **Branch protection `main`** | **Não disponível** (403 — repo privado) | 🔴 **Bloqueia PR #1** se o objetivo é "production ready". Mitigação: tornar repo público no dia do PR #1 e aplicar rules imediatamente. |
| **Secrets em GH** | **None** (vazio) | 🔴 **Bloqueia PR #1** — qualquer `.env` commitado vaza; sem `CLERK_*`, `ASAAS_*`, `R2_*` em secrets, o CI nunca passa contra serviços reais. |
| Variáveis em GH | **Nenhuma** | 🟡 Idem para `DATABASE_URL`, `APP_BASE_URL`. |
| **CI — últimos 3 runs** | 🔴 **Todos `failure`** (Playwright continue-on-error, test e2e timeout, cache invalidation) | 🔴 **Bloqueia PR #1** — não dá para fazer merge de PR verde se o pipeline do `main` está vermelho. |

### 1.2 Estrutura do scaffold (já no branch)

| Item | Estado | Comentário |
|---|---|---|
| Rotas Next.js 15 | 22 (App Router) | ✅ |
| Postgres 17 + Drizzle ORM + RLS | 10/10 testes passam | ✅ — *mas* `init-db.sh` cria `app_owner SUPERUSER` (issue #3), divergindo de `init-roles.sql`. |
| graphile-worker + Docker Compose | OK | ✅ |
| Edge: Cloudflare R2, Asaas | R2 OK · Asaas `verifyWebhookSignature` quebrado (issue #5) | 🟡 |
| Chrome MV3 extension | Manifest com `<all_urls>` em ambos `host_permissions` e `content_scripts.matches` (recomendação da RFC era `optional_host_permissions`) | 🟡 |
| Tests | 135/135 unit + integration verdes · 7/7 Playwright E2E **local** | 🟡 — no CI falham por falta de Clerk sandbox keys. |
| Documentação | 12 ADRs · RFC (1.2k lines) · SECURITY-MODEL.md · SLOs.md · OpenAPI 3.1 · `docs/api/webhooks.md` | ✅ — **mas** falta `LICENSE`, `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md` (community-standard para OSS). |
| Legal/LGPD | 16 docs em `legal/` (DPO.md, DPA, ToS, cookie policy, IRP, DSR, subprocessors, …) | ✅ — **mas** DPO placeholder + CNPJ placeholder + cookie banner não implementado (issues #6/#7/#8). |

---

## 2. Gaps que bloqueiam PR #1

### 2.1 🔴 Bloqueadores duros (sem eles, NÃO abrir PR)

| # | Gap | Ação necessária | Owner |
|---|-----|-----------------|-------|
| **G1** | **CI em vermelho nos últimos 3 runs** (`main` está quebrado — Playwright/E2E timeout) | Fixar `playwright.config.ts` (webServer timeout 180s já tentado, mas ainda falhando) ou marcar step de Playwright como `continue-on-error` no CI com reason explícita + Issue de tracking | SRE / Dev |
| **G2** | **`LICENSE`, `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md` ausentes** | Criar LICENSE (MIT recomendada p/ clone OSS, ou AGPL se forçarmos derivative works a abrir código), CONTRIBUTING.md (build/test/lint commands), CODE_OF_CONDUCT.md (Contributor Covenant v2.1 pt-BR) | PO / Legal |
| **G3** | **Repo é privado → branch protection rules não aplicáveis** (HTTP 403 confirmado) | Tornar repo **público** antes do PR #1 (ou aceitar que "production ready" = "scaffold open-source sem rules", o que é honesto mas downgrade do rótulo) | PO / Founder |
| **G4** | **Zero secrets em GitHub Actions** | Adicionar `CLERK_TEST_PUBLISHABLE_KEY` + `CLERK_TEST_SECRET_KEY` (sandbox) + `ASAAS_WEBHOOK_SECRET` (sandbox) + `R2_*` (dev bucket) + `DATABASE_URL` + `APP_BASE_URL` em repo settings → Secrets and variables → Actions. Variáveis separadas dos secrets. | SRE |
| **G5** | **Environment só `production`** | Criar `dev` (vinculado a `branches: develop`) e `staging` (vinculado a `branches: main` com approval manual) — Workaround para o fato de não ter staging infra: o `production` env vira staging-of-truth até Hetzner subir, e deploy fica gated por tag/release. | SRE |
| **G6** | **Nenhum dos 6 issues `CRÍTICO` (#2, #3, #4, #5, #6, #7) tem PR de fix aberto** | Pelo menos #3 (`init-db.sh` SUPERUSER) e #5 (verifyWebhookSignature) precisam ter **PR aberto com fix** antes do PR #1 fechar. Os 4 restantes (LEGAL-1/2/3, SRE-2) podem ficar como backlog desde que esteja **declarado** no PR description. | Dev / SRE / Legal |

### 2.2 🟡 Bloqueadores brand-acceptable (declarar no PR, não corrigir no PR #1)

| # | Gap | Mitigação no PR description |
|---|-----|------------------------------|
| **G7** | DPO é placeholder (issue #6) | Declarar "DPO placeholder funcional até contratação formal" |
| **G8** | CNPJ/identidade jurídica placeholder (issue #7) | Declarar "EasyDemo LTDA em constituição" |
| **G9** | Cookie banner não implementado (issue #8) | Declarar "cookie banner opt-in antes do primeiro cliente pagante" |
| **G10** | Idempotency in-memory no webhook Asaas (issue #10) | Declarar "PR de fix (#10) aberto na sequência" |
| **G11** | Pricing não validado com clientes reais (issue #11) | Declarar "MVP pricing R$ 49/R$ 199 sem validação empírica" |
| **G12** | 3 cases fictícios no marketing (issue #12) | Declarar "cases serão substituídos antes do GA comercial" |
| **G13** | Restore drill mensal não agendado (issue #19) | Declarar "SRE-7 (novo) ou workflow_dispatch manual até automação" |
| **G14** | Single-VPS SPOF aceito em 99.5% SLA (issue #17) | Declarar "aceito pelo time; SLA publicado em ToS §3" |

### 2.3 🟢 Não-bloqueantes

- Issues de "REFINAMENTO" (#13, #14, #15, #16) → backlog pós-PR #1.
- Cobertura < 50% (issue #18) → backlog.
- DemoEditor monólito (#2) → refactor obrigatório **antes** do sprint 2 (não bloqueia scaffold OSS).

---

## 3. Checklist de PR — Conteúdo do PR #1

### 3.1 Escopo do PR (o que vai dentro)

```
[CHORE] Open Source Scaffold · EasyDemo v0.1
├── infra/
│   ├── postgres/         (init-roles.sql, ROLES.md, pgbackrest config)
│   ├── hetzner/          (CPX32 setup README)
│   └── observability/    (Signoz + OpenTelemetry snippets)
├── apps/
│   ├── web/              (Next.js 15 App Router · 22 rotas)
│   ├── workers/          (graphile-worker · 5 tasks)
│   └── extension/        (Chrome MV3)
├── packages/shared/      (i18n pt-BR/en · 479 strings · types · schemas)
├── docs/
│   ├── RFC-Brazilian-Supademo.md       (1.2k linhas)
│   ├── SECURITY-MODEL.md
│   ├── SLOs.md
│   ├── ARCHITECTURE-decision-map.md
│   ├── ADRs/                          (12 ADRs)
│   ├── api/openapi.yaml               (OpenAPI 3.1)
│   ├── api/webhooks.md
│   └── mcp/server.json
├── legal/                            (16 docs LGPD)
├── tests/                            (135 unit + 7 Playwright)
├── scripts/                          (init-db.sh · restore-drill.sh · check-dpo-missing.ts)
├── marketing/                        (landing copy · 3 cases fictícios)
├── online-presence/                  (sitemap · robots · OG)
├── .github/workflows/ci.yml          (lint · typecheck · vitest · integration · playwright)
├── .github/workflows/deploy.yml      (build → push image → Hetzner)
├── .github/dependabot.yml
├── playwright.config.ts
├── biome.json · tsconfig.base.json · pnpm-workspace.yaml
├── Dockerfile.worker · Dockerfile.web
├── Makefile · README.md · package.json · pnpm-lock.yaml
└── .env.example
```

### 3.2 Critérios de Greenlight (todos verdes antes do merge)

```
[ ] CI verde em TODAS as checks verdadeiras
    [ ] Lint        (biome)
    [ ] Typecheck   (tsc --noEmit)
    [ ] Vitest      (135/135)
    [ ] Integration (RLS 10/10 + webhook Asaas + dsr)
    [ ] Build       (next build + workers build)
    [ ] Playwright E2E — documentar como "continue-on-error até #6 (Clerk keys reais)"

[ ] Documentação
    [ ] README.md atualizado com quickstart + stack + LGPD disclaimer
    [ ] LICENSE (MIT ou AGPL — decisão do fundador)
    [ ] CONTRIBUTING.md (build · test · lint · PR template)
    [ ] CODE_OF_CONDUCT.md (Contributor Covenant v2.1)
    [ ] docs/RFC-Brazilian-Supademo.md (já tem)
    [ ] docs/ADRs/*.md (12/12)
    [ ] docs/api/openapi.yaml (OpenAPI 3.1)
    [ ] SECURITY-MODEL.md + SLOs.md (já tem)
    [ ] legal/ (16 docs LGPD)

[ ] Segurança
    [ ] Zero secrets commitados (grep -rE '(CLERK_SECRET|ASAAS_WEBHOOK|R2_ACCESS)' --include='*.{ts,tsx,js,json,md,yml}' .)
    [ ] .env.example presente, sem valores reais
    [ ] .gitignore cobre .env*, node_modules, .next, test-results, playwright-report
    [ ] Dependabot ativo (weekly · npm + docker + github-actions)

[ ] CI/CD
    [ ] Branch protection em main (requer PR + 1 approval + CI verde) — só após tornar repo público
    [ ] Environments: dev, staging, production separados
    [ ] Secrets em GitHub Actions (não no repo)
    [ ] Workflow Deploy requer tag `v*` para disparar produção

[ ] Quality bars documentados
    [ ] Cobertura atual (~37%) declarada no PR description
    [ ] 6 issues CRÍTICO linkadas no PR description
    [ ] Roadmap para as issues CRÍTICO está em issues
```

### 3.3 Backlog explícito (não-bloqueante para PR #1)

- DPO placeholder (issue #6) — bloqueador de go-live comercial
- Constituição EasyDemo LTDA com CNPJ real (issue #7)
- Banner de cookies opt-in (issue #8)
- Conectar DemoPlayer ao reducer puro (issue #9)
- Mover idempotency do webhook Asaas para DB (issue #10)
- Validação de pricing com 5 entrevistas (issue #11)
- 3 cases fictícios → cases reais (issue #12)
- diffCatalogs() no CI para pt-BR/en (issue #13)
- Calendly 404 (issue #14)
- BYPASSRLS dedicado para `/d/[slug]` (issue #15)
- Lazy-load sub-editors do DemoEditor (issue #16)
- Single-VPS SPOF aceito em 99.5% SLA (issue #17)
- Aumentar coverage para 50% antes do Pro público (issue #18)
- Agendar restore drill mensal (issue #19)

---

## 4. Sugestão de Descrição do PR

```markdown
## EasyDemo v0.1 — Scaffold open-source do clone brasileiro do Supademo

> Clone brasileiro do Supademo, otimizado para o mercado BR com PIX/boleto,
> LGPD de ponta a ponta e player pt-BR-first. Este PR é o **scaffold inicial** —
> *production-ready-ish*, com bloqueadores conhecidos já mapeados em issues.

### Stack

- **Next.js 15** App Router + React 19 + TypeScript 5.6
- **Postgres 17** + Drizzle ORM 0.36 com **Row-Level Security** multi-tenant (10/10 testes)
- **Clerk** (auth + Organizations) · **graphile-worker** (fila Postgres-only)
- **Cloudflare R2** (storage S3-compatible, zero egress) · **Asaas** (PIX/boleto/cartão)
- **Chrome MV3** extension · **Vitest** + **Playwright** · **Biome**
- **Signoz + OpenTelemetry** · **pgbackrest** (PITR 7d)

### O que esse PR entrega

- **22 rotas** Next.js 15 (App Router) com middleware de tenant + Clerk
- **Postgres 17 + Drizzle + RLS** multi-tenant — `app_owner` (BYPASSRLS) e `app_user` (RLS-enforced) separados
- **graphile-worker** + Docker Compose (Postgres + ClickHouse + app)
- **Edge integrations:** Cloudflare R2 (uploads presigned), Asaas (billing PIX/boleto)
- **Chrome MV3 extension** para captura de demos
- **135/135** unit tests + **7/7** Playwright E2E (local)
- **Documentação:** RFC (1.2k lines) · 12 ADRs · SECURITY-MODEL · SLOs · OpenAPI 3.1 · `webhooks.md`
- **LGPD:** 16 documentos em `legal/` (DPO, DPA, ToS, Privacy, Cookie Policy, IRP, DSR, subprocessors, RTBF)
- **DevEx:** Makefile + Docker Compose + pnpm workspaces + Biome + dependabot weekly

### O que esse PR NÃO entrega (issues abertas)

🔴 **Bloqueadores de go-live comercial** (declarados, não corrigidos aqui):

- **#6** — DPO placeholder (`placeholder@easydemo.io`) — LGPD art. 41
- **#7** — EasyDemo LTDA em constituição (CNPJ placeholder)
- **#8** — Banner de cookies opt-in não implementado (LGPD art. 8º)
- **#3** — `init-db.sh` cria `app_owner SUPERUSER` (divergência com `init-roles.sql`) — fix aberto em PR #SRE-1
- **#5** — `verifyWebhookSignature` do Asaas usa plain-equality (HMAC-SHA256 não aplicado) — fix aberto em PR #SRE-3
- **#4** — DSR DELETE usa `getDb()` sem tenant context — fix aberto em PR #SRE-2

🟡 **Backlog pós-PR #1** (issues #9-#19 — refinamentos, performance, validação de mercado).

### Como rodar localmente

\`\`\`bash
nvm use              # Node 22
corepack enable
pnpm install
cp .env.example .env  # preencher CLERK_*, ASAAS_*, R2_*, DATABASE_URL
make dev              # ou: pnpm docker:dev && pnpm dev
\`\`\`

### CI Status

| Check | Status | Notas |
|-------|--------|-------|
| Lint (biome) | ✅ green | — |
| Typecheck (tsc) | ✅ green | — |
| Unit + Integration (Vitest) | ✅ green | 135/135 |
| Build (Next.js + Workers) | ✅ green | — |
| Playwright E2E | 🟡 continue-on-error | Aguardando Clerk sandbox keys (#6 + secrets) |
| DPO check (`check-dpo-missing.ts`) | ❌ failing-by-design | Falha proposital até contratação formal do DPO |

### Decisões de PR

- **LICENSE:** MIT (clone OSS, encourage derivative works)
- **Repo público:** sim — branch protection rules só são aplicáveis em repo público
- **Branch protection em `main`:** 1 approval required + CI verde · squash merge
- **Environments:** `dev` (auto em PR), `staging` (auto em merge), `production` (manual em tag `v*`)
- **Secrets:** zero em repo · todos em GitHub Actions Secrets (a configurar antes do merge)

### Issues relacionadas (clique para abrir)

Refs: #2 #3 #4 #5 #6 #7 #8 #9 #10 #11 #12 #13 #14 #15 #16 #17 #18 #19

---

🤖 Scaffold gerado por 14 subagentes em modo dark-factory · revisão humana pendente
```

---

## 5. As 18 issues atualmente abertas (snapshot 2026-10-18)

Lista obtida via `gh issue list --repo mmti-laboratorios-digital/supademo-oss --state open --limit 25`:

| # | Título (resumido) | Labels | Severidade (CONCLAVE) |
|---|---|---|---|
| **#2** | S-1: DemoEditor.tsx monólito de 933 linhas precisa ser quebrado | bloqueador, frontend, refactor | 🔴 |
| **#3** | SRE-1: init-db.sh cria app_owner como SUPERUSER (divergência) | bloqueador, database, segurança | 🔴 |
| **#4** | SRE-2: DSR DELETE usa getDb() sem tenant context (LGPD art. 18) | bloqueador, database, lgpd | 🔴 |
| **#5** | SRE-3: verifyWebhookSignature do Asaas implementada errada | bloqueador, segurança, billing | 🔴 |
| **#6** | LEGAL-1: Contratar DPO (Encarregado de Proteção de Dados) | bloqueador, lgpd, negócio | 🔴 |
| **#7** | LEGAL-2: Constituir EasyDemo LTDA com CNPJ real | bloqueador, lgpd, negócio | 🔴 |
| **#8** | LEGAL-3: Implementar banner de cookies opt-in | bloqueador, frontend, lgpd | 🔴 |
| **#9** | DEV-2: Conectar DemoPlayer ao reducer puro testado | frontend, testes | 🟡 |
| **#10** | SRE-4: Mover idempotency do webhook Asaas para DB | backend, billing | 🟡 |
| **#11** | PM-1: Validar pricing R$ 49/R$ 199 com 5 entrevistas | negócio, marketing | 🟡 |
| **#12** | PM-2: Substituir 3 cases fictícios por cases reais | negócio, marketing | 🟡 |
| **#13** | DEV-3: diffCatalogs() no CI para pt-BR/en | testes, i18n | 🟡 |
| **#14** | DEV-4: Calendly 404 (link ↔ url mapping quebrado) | bug, frontend | 🟡 |
| **#15** | SRE-5: Player público /d/[slug] usa BYPASSRLS dedicado | frontend, backend | 🟡 |
| **#16** | DEV-5: Lazy-load sub-editors do DemoEditor | frontend, performance | 🟡 |
| **#17** | SRE-6: Single-VPS SPOF — aceitar 99.5% SLA | infra, negócio | 🟡 |
| **#18** | PM-3: Aumentar coverage para 50% antes de Pro público | testes, qualidade | 🟡 |
| **#19** | DR-Drill: agendar restore drill mensal | importante, infra, backup | 🟡 |

**Resumo por severity:**
- 🔴 **CRÍTICO:** 7 issues (#2, #3, #4, #5, #6, #7, #8) — todas bloqueadoras ou LGPD-blocking.
- 🟡 **IMPORTANTE / REFINAMENTO:** 11 issues (#9 → #19).
- 🟢 **0 issues low-priority.**

**Distribuição por área:**
- 🔒 Segurança/LGPD/Legal: **5** (#4, #5, #6, #7, #8)
- 🛠 Backend/Database/SRE: **4** (#3, #10, #15, #17, #19 — 5 contando #19)
- 🎨 Frontend/Dev: **5** (#2, #9, #13, #14, #16)
- 📈 Negócio/Marketing/PM: **3** (#11, #12, #18)
- 🧪 Testes/Qualidade: **3** (#9, #13, #18 — sobreposição)

---

## 6. Recomendação final do PO

🟡 **Abrir PR #1 com os 6 gaps brand-acceptable (G7-G14) declarados no description, MAS não fazer merge em `main` enquanto:**

1. **CI do `main` estiver vermelho** (G1) — fixar Playwright/E2E primeiro
2. **LICENSE/CONTRIBUTING/CODE_OF_CONDUCT não existirem** (G2)
3. **Repo for privado** sem branch protection aplicável (G3) — decidir público vs. privado antes
4. **Zero secrets em GH Actions** (G4) — popular antes do primeiro CI run contra serviços reais
5. **Apenas 1 environment** (`production` direto) sem `dev`/`staging` (G5)

**Após os 6 gaps duros endereçados, o PR #1 pode ser mergeado como "EasyDemo v0.1 — Scaffold OSS production-ready-ish"**, com 7 issues 🔴 declaradas como backlog obrigatório antes do go-live comercial (DPO + CNPJ + cookie banner + 4 fixes de SRE).

**Próximos PRs sugeridos (em ordem de prioridade):**

1. **PR #2** — `SRE-1` fix: `init-db.sh` corrige para `NOSUPERUSER + BYPASSRLS` (#3)
2. **PR #3** — `SRE-3` fix: `verifyWebhookSignature` Asaas com HMAC-SHA256 (#5)
3. **PR #4** — `SRE-2` fix: DSR DELETE/EXPORT via `getAdminDb()` cross-tenant (#4)
4. **PR #5** — `S-1` refactor: quebrar DemoEditor.tsx (#2) — pré-requisito para sprint 2
5. **PR #6** — `DEV-2`: DemoPlayer → reducer puro (#9)
6. **PR #7** — `LEGAL-3`: cookie banner opt-in (#8) — único LEGAL que pode ser feito pré-CNPJ
7. **PR #8** — `SRE-4`: idempotency Asaas → `webhook_deliveries` (#10)
8. **PR #9** — `DR-Drill`: workflow schedule mensal (#19)
9. **PR #10** — `DEV-3`: diffCatalogs() no CI (#13)
10. **PR #11** — `SRE-5`: BYPASSRLS dedicado para `/d/[slug]` (#15)

**Backlog secundário (pós-sprint 2):** #11, #12, #14, #16, #17, #18 — **validação de pricing + cases reais** são os únicos que dependem de trabalho externo (clientes), não de dev.

---

## 7. PR Template sugerido (para `.github/PULL_REQUEST_TEMPLATE.md`)

```markdown
<!-- .github/PULL_REQUEST_TEMPLATE.md -->

## O que muda

<!-- resumo em 1-3 frases -->

## Tipo

- [ ] feat (nova feature)
- [ ] fix (bugfix)
- [ ] chore (infra/docs/CI)
- [ ] refactor (sem mudança de comportamento)
- [ ] perf
- [ ] test

## Checklist do autor

- [ ] `pnpm lint` verde
- [ ] `pnpm typecheck` verde
- [ ] `pnpm test` verde (vitest)
- [ ] `pnpm test:e2e` documentado se aplicável
- [ ] `pnpm build` verde
- [ ] Sem secrets commitados (`grep -rE '(CLERK_SECRET|ASAAS_WEBHOOK|R2_ACCESS)' --include='*.{ts,tsx,js,json,md,yml}' .` → vazio)
- [ ] Issue linkada (Refs #N)
- [ ] Docs atualizados se mudou API/contract

## Checklist do reviewer

- [ ] CI verde em todas as checks verdadeiras
- [ ] Mudanças cobertas por testes (ou justificativa se não)
- [ ] LGPD impact assessment (se tocou dados pessoais)
- [ ] RLS impact assessment (se tocou `apps/web/db/`)
- [ ] Billing impact assessment (se tocou `lib/asaas.ts` ou `lib/billing/`)

## Riscos / rollback

<!-- descreva o que pode quebrar e como reverter -->

Refs: <!-- #issue-number -->
```

---

> **Próximo passo:** após merge do PR #1, abrir `setup-report/CONCLAVE-pr-merge-report.md` com o resultado do CI real + screenshots de branch protection + lista de PRs subsequentes abertos na ordem da Seção 6.