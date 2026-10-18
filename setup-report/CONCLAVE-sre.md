# CONCLAVE SRE — Auditoria técnica fria do DemoBR

> **Persona:** Staff SRE/DevOps architect (20 anos). Foco: produção, multi-tenant, LGPD.
> **Data:** 2026-10-18.
> **Escopo:** revisão do código, da infra, dos ADRs e dos 14 phases do setup-report.
> **Tom:** técnico, sem floreio. Onde está ruim, digo. Onde está bom, confirmo. Onde não dá para afirmar, marco "precisa investigação".

---

## 1. VEREDICTO (uma linha)

**🟡 NÃO LANÇAR AINDA.** Em 14 clientes pagantes, aguenta; em 100+, o primeiro gargalo é RAM de Postgres+ClickHouse somados (8 GB), e 2 a 3 correções estruturais (RLS bypass via `init-db.sh`, DSR sem RLS context, restore drill sem agendamento) **vazam dados ou quebram compliance** antes da escala. Corrigíveis em ~2 semanas de dev focado. Após correções, **🟢 apto para MVP com 14-50 clientes**.

---

## 2. TOP 10 BLOQUEADORES

### 🔴 CRÍTICOS (bloqueiam produção / vazam dados / violam LGPD)

| # | Bloqueador | Evidência | Por que é crítico |
|---|---|---|---|
| **1** | **`scripts/init-db.sh` cria `app_owner` como `SUPERUSER`** — diverge de `infra/postgres/init-roles.sql` (que cria `NOSUPERUSER + BYPASSRLS`) e da `infra/postgres/ROLES.md` (canônica). | `scripts/init-db.sh` linha 39: `CREATE ROLE app_owner LOGIN PASSWORD '...' SUPERUSER`; comentário linha 73 diz "migrations, bypass RLS" — não documenta o SUPERUSER. | `ROLES.md` é a fonte canônica. Quem rodar `init-db.sh` (não `init-roles.sql`) instala um **superuser de runtime** com Bypass RLS e criação de role. Se esse valor vazar para `.env`, qualquer desvio de código bypassa todas as políticas LGPD. **Inconsistência perigosa**. |
| **2** | **DSR DELETE não respeita RLS** — usa `getDb()` (runtime/app_user) com `eq(leads.email, ...)`. Em produção multi-tenant, o **token de DSR de um titular NÃO tem `app.current_tenant_id` setado**, então o DELETE só apaga leads do "tenant padrão" — se a pessoa que pediu DSR for lead em outro workspace, não acontece nada. | `apps/web/app/api/dsr/route.ts` linhas 155–161 (`const db = getDb(); ... .where(eq(leads.email, ...))`). | Falha funcional + LGPD art. 18, V (eliminação) **não atendido**: titular pensa que foi apagado, mas dados seguem no banco. ANPD pode entender como cumprimento parcial. |
| **3** | **`app.demos` sem policy de SELECT público para o player** + o player usa `getDb()` (app_user) → em runtime, vai ver 0 demos sem tenant. A PHASE-6 §3.2 (recomendação) assume "Caminho B: rota dedicada com BYPASSRLS" **que não foi auditada**. | `apps/web/app/d/[slug]/page.tsx` linha 21: `const db = getDb();` é descrita como "sem tenant — usa role público (read-only)", mas RLS bloqueia. | O player público é o **produto inteiro**. Sem essa política resolvida, `/d/[slug]` retorna 0 rows em produção. (Os testes Playwright com seed mostram markup, mas em produção o lookup está quebrado.) |
| **4** | **Restore drill mensal NÃO está agendado em lugar nenhum** — `scripts/restore-drill.sh` existe, mas `grep -r "monthly\|cron" .github/workflows/` retorna apenas dependabot. Cron é mencionado só no ADR-007 ("cron nativo") e em `infra/hetzner/README.md` linha 270 ("agendar mensalmente") — sem implementação. Sem CI/schedule/workflow_dispatch para isso, a promessa do ADR-010 é letra morta. | Busca por `cron\|monthly\|schedule` em `.github/workflows/` retorna nada relativo a DR. `restore-drill.sh` só roda manual. | Um backup que nunca foi restaurado **não é backup**. Se o VPS falhar antes do primeiro drill, descobrimos a falta de backup no momento errado. |
| **5** | **DPO é placeholder em 23 ocorrências** (`legal/*`) e CI checa `check-dpo-missing.ts` — o CI literalmente **bloqueia merge** se houver placeholder, mas o código atual faz a verificação falhar **na primeira tentativa de merge de qualquer PR**. Isso é uma contradição operacional: ou o CI bloqueia agora e ninguém consegue mergar, ou o DPO é contratado **antes** do primeiro commit. | `setup-report/PHASE-13-dpo-placeholder.md` + `legal/DPO.md` (status PENDENTE, 90 dias). | LGPD art. 41: ausência de encarregado é infração administrativa. PHASE-5 marca como 🔴 bloqueador, mas DPO.md §9 é explícito sobre a afirmação: "NÃO afirma que a DemoBR já contratou um DPO." Pode-se comunicar a nomeação à ANPD em paralelo, mas o requisito legal vira ASAP. |

### 🟡 IMPORTANTES (alto valor / recomendado antes do GA)

| # | Item | Evidência | Por que importa |
|---|---|---|---|
| **6** | **Sem rate-limit em endpoints R2 presigned.** `@upstash/ratelimit` está em `package.json` mas **nunca é importado no código de aplicação** (grep mostra só nos `.next/standalone/`/build artifacts). Um Creator com 1000 uploads simultâneos satura o R2 e a fila. | `apps/web/lib/r2-presigned.ts` não tem rate-limit; `lib/ratelimit.ts` referenciado na RFC não existe. | Risco de billing blow-up no R2 e na fila graphile-worker. Pode transformar um cliente malicioso em denial-of-service self-inflicted. |
| **7** | **`extension/manifest.json` declara `<all_urls>` em `host_permissions` E em `content_scripts.matches`** — exatamente o oposto do que a RFC §2.5 recomendou ("sem `<all_urls>`"). Justificativa para Chrome Web Store Review vira mais longa e o risco de rejeção é maior. | `apps/extension/manifest.json` linhas 8 e 19: ambas com `"<all_urls>"`. | Atrasa o go-to-market (Chrome Web Store review rejeita manifestos amplos por padrão). CWS review mais lento de MV3 com `<all_urls>` exige justification extensa — adiar extensivamente fere o timeline H2 (semanas 7-12). |
| **8** | **Webhook Asaas `verifyWebhookSignature` é incorreto** — compara `signature === ASAAS_WEBHOOK_SECRET` em plain-equality (apenas timing-safe), mas Asaas envia HMAC-SHA256 do payload com o secret, não o secret puro. Está documentado como "comparação simples" — em produção equivale a **bypass de autenticação de webhook**. | `apps/web/lib/asaas.ts` linhas 103–113. | Webhooks Asaas controlam subscription status (= billing). Se qualquer pessoa descobre a URL `/api/webhooks/asaas`, pode forjar `payment.confirmed` e ganhar Pro de graça. |
| **9** | **`workspaces` records têm RLS SELECT `USING(true)`** — descoberta pública por design (slug lookup). Combinado com política `workspaces_modify USING(id = app.current_tenant_id())`, isso está OK em runtime normal, MAS não há **constraint de unicidade por clerk_org_id no policy de Modify** — bug futuro que faça um SELECT sem tenant + UPDATE com `clerk_org_id` pode ser cross-tenant via Clerk webhook se houver race condition. Não é explorável hoje (correções vêm via `upsertWorkspaceFromClerk` com `getDb()` + `eq`), mas é frágil. | `0000_init.sql` linhas 264–270 (workspaces_select sem contexto); `upsertWorkspaceFromClerk` em `lib/auth.ts` linha 60 usa `getDb()` com `eq(clerkOrgId, ...)`. | A `app_user` vê outros workspaces no `SELECT * FROM workspaces` — não diretamente perigoso (apenas `id`, `slug`, `name`), mas **vaza existência** e metadados. Em B2B com clientes sensíveis (concorrentes que não querem ser vistos), isso é problemático. |
| **10** | **Compliance ANPD × 1 pessoa técnica não é viável sem automação**: DSR SLAs de 15 dias corridos, ANPD reporting em 24h, IRP com 30+ placeholders — tudo isso pressupõe um(a) DPO + backup. PHASE-13 cronograma 90 dias é razoável, mas até lá o CTO+CEO são "DPO interino", e notificação ANPD em 24h com 1 SRE é optimistic. | `legal/incident-response-plan.md` §7.4. | Risco legal real para um dos primeiros incidentes (P0). A Mitigação atual é "DPO placeholder", o que está honesto, mas pressão sobre o time técnico. **Recomendação: contratar DPO PJ retainer como Caminho B do DPO.md (§4.2) ANTES do primeiro cliente pagante**. |

---

## 3. QUESTÕES TÉCNICAS ABERTAS (5 perguntas que faria ao time antes do greenlight)

> Para cada uma, listo por que vale perguntar e o tipo de resposta que eu aceitaria como greenlight.

### Q1 — Por que `scripts/init-db.sh` e `infra/postgres/init-roles.sql` criam `app_owner` com privilégios diferentes?
- **Por que vale:** são os dois únicos caminhos de init documentados. Se a divergência é intencional (init-db.sh é dev convenience, init-roles.sql é prod), precisa estar explícito; se foi esquizofrenia de copy-paste, é um **bloqueador real**.
- **Greenlight aceitável:** ou (a) `init-db.sh` corrigido para `NOSUPERUSER + BYPASSRLS` e comentário explicando, ou (b) `init-db.sh` descontinuado e movido para `scripts/legacy/init-db.sh` + Makefile apontando para `init-roles.sql`.

### Q2 — Como o player público resolve `slug → demo` em produção se `getDb()` (app_user) está RLS-enforced?
- **Por que vale:** TODO o produto (assistir demo, capturar lead, gerar receita). PHASE-6 §3.2 fala em "Caminho B" mas não há commit que confirme.
- **Greenlight aceitável:** link para o commit + teste E2E (`playwright test tests/e2e/player-public.spec.ts`) demonstrando acesso público a `/d/[slug]` em produção (sem token de tenant). Se isso ainda não roda 100% em E2E, é 🔴.

### Q3 — Quem deleta dados de **um único tenant** se um cliente cancelar? O cron `cleanup_expired` está atualmente em `apps/workers/src/tasks/cleanup_expired.ts` linhas 18–22 como **comentário** — não implementa o DELETE.
- **Por que vale:** LGPD art. 16 (eliminação após cessada finalidade). Se o produto depende disso e não há código, o que vai rodar de fato?
- **Greenlight aceitável:** PR com `DELETE FROM app.leads WHERE workspace_id IN (...)` e política de retenção cifrada nos backups.

### Q4 — O `restore-drill.sh` é executado por quem, em qual cadence, com qual alerta de falha? Slack notificado é "✅" mas e-mail ao fundador/IR?
- **Por que vale:** se o drill falhar (backup corrompido, R2 desconectado, replay de WAL quebrado), **ninguém além do canal Slack pega**. Para um SaaS B2B que promete "99,5%" nos ToS, isso vira quebra de SLA.
- **Greenlight aceitável:** GitHub Actions schedule semanal/mensal rodando o drill + notificação **PagerDuty/SMS pessoal** se falhar.

### Q5 — O extension manifest tem `<all_urls>` em `host_permissions` E `content_scripts.matches`. Isso é compatível com a recomendação "minimal permissions" da RFC? Por que não `optional_host_permissions`?
- **Por que vale:** CWS Review com `<all_urls>` é rejeitado em ~30% das submissões na primeira tentativa (benchmark interno Supademo, citado no §9.1 da RFC). Sem isso, o GTM #1 (Chrome Web Store) fica em hold.
- **Greenlight aceitável:** refatorar para `optional_host_permissions: ["<all_urls>"]` + manifesto enxuto, ou justificativa clara de por que `<all_urls>` é necessário.

---

## 4. RECOMENDAÇÕES (5 ações concretas com diff/pseudo-código)

### R1 — Consertar divergência entre `init-db.sh` e `init-roles.sql` (🔴, ~15 min)

```diff
# scripts/init-db.sh, linha 39
-  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'app_owner') THEN
-    CREATE ROLE app_owner LOGIN PASSWORD '$OWNER_PASS' SUPERUSER;
-  END IF;
+  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'app_owner') THEN
+    -- IMPORTANTE: NOSUPERUSER + BYPASSRLS mantém princípio do menor privilégio.
+    -- Para DDL, app_owner recebe GRANT CREATE ON SCHEMA app/analytics
+    -- no init-roles.sql. SUPERUSER seria desnecessário E perigoso se esta URL
+    -- vazasse em .env. Ver infra/postgres/ROLES.md para a política canônica.
+    CREATE ROLE app_owner LOGIN PASSWORD '$OWNER_PASS'
+      NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT BYPASSRLS;
+  END IF;
+  -- Garantir BYPASSRLS mesmo em DBs onde app_owner já existe como SUPERUSER
+  ALTER ROLE app_owner BYPASSRLS;
+  ALTER ROLE app_owner NOSUPERUSER;  -- rebaixa se vier de init-db.sh antigo
```

E adicionar `scripts/init-db.sh` link no Makefile apontando para `init-roles.sql` como canônico.

### R2 — Fix DSR DELETE/EXPORT para usar `app_owner` cross-tenant (🔴, ~30 min)

```diff
# apps/web/app/api/dsr/route.ts, linhas 123, 155
- const db = getDb();
+ // DSR é cross-tenant por design (titular não conhece workspace_id).
+ // Usamos getAdminDb() pois é o único caminho correto em LGPD art. 18:
+ // titular tem direito aos SEUS dados em TODOS os workspaces onde aparecem.
+ const db = getAdminDb();

// Mesmo ajuste em collectExport (linha 196) — leads.email é cross-workspace.
```

Adicionar teste em `tests/integration/dsr-cross-tenant.test.ts` que valide: titular X tem leads em 2 workspaces → DELETE remove de ambos.

### R3 — Implementar cron real do DR drill (🟡, ~1h)

Adicionar em `.github/workflows/drill.yml`:

```yaml
name: Monthly DR Drill

on:
  schedule:
    # 1º domingo de cada mês às 03:00 UTC (madrugada BR)
    - cron: "0 3 1-7 * 0"
  workflow_dispatch:

jobs:
  drill:
    runs-on: ubuntu-latest
    environment: production
    steps:
      - uses: actions/checkout@v4
      - name: Run restore drill
        env:
          HETZNER_TOKEN: ${{ secrets.HETZNER_TOKEN }}
          R2_ACCESS_KEY_ID: ${{ secrets.R2_ACCESS_KEY_ID }}
          R2_SECRET_ACCESS_KEY: ${{ secrets.R2_SECRET_ACCESS_KEY }}
          SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}
          PAGERDUTY_KEY: ${{ secrets.PAGERDUTY_KEY }}    # <-- ADICIONAR
        run: |
          ./scripts/restore-drill.sh
      - name: Alert on failure
        if: failure()
        run: |
          # PagerDuty trigger para telefone do IC
          curl -X POST https://events.pagerduty.com/v2/enqueue \
            -H 'Content-Type: application/json' \
            -d '{"routing_key":"'$PAGERDUTY_KEY'","event_action":"trigger","payload":{"summary":"DR drill FAILED","severity":"error","source":"demobr-ci"}}'
```

### R4 — Rate-limit em `/api/demos/[id]/steps` (R2 presigned PUT) (🟡, ~1h)

```ts
// apps/web/app/api/demos/[id]/steps/route.ts (adicionar no início do POST)
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(60, "1 m"), // 60 uploads/min por workspace
  analytics: true,
  prefix: "rl:steps",
});

// no handler:
const ctx = await auth();
const key = `org:${ctx.orgId}`;
const { success } = await ratelimit.limit(key);
if (!success) {
  return NextResponse.json({ error: "RATE_LIMITED" }, { status: 429 });
}
```

A RFC já cita `@upstash/ratelimit` mas o código não usa. Sem isso, um Creator Free com 1000 PUTs/min paga o pato (satura fila, gera custos).

### R5 — Validar Asaas webhook com HMAC real (🔴, ~30 min)

```diff
# apps/web/lib/asaas.ts, função verifyWebhookSignature — não está validando HMAC
- export function verifyWebhookSignature(rawBody: string, signature: string | null) {
-   const e = env();
-   if (!e.ASAAS_WEBHOOK_SECRET || !signature) return false;
-   return safeEqual(signature, e.ASAAS_WEBHOOK_SECRET);
- }
+ export async function verifyWebhookSignature(rawBody: string, signature: string | null) {
+   const e = env();
+   if (!e.ASAAS_WEBHOOK_SECRET || !signature) return false;
+   // Asaas envia HMAC-SHA256(rawBody, secret) — header `asaas-access-token` é o HMAC
+   // (não confundir com o access_token da API). Ver docs.asaas.com/webhooks.
+   const expected = await hmacSha256(rawBody, e.ASAAS_WEBHOOK_SECRET);
+   return safeEqual(expected, signature);
+ }
```

Sem isso, qualquer um que descobrir a URL `/api/webhooks/asaas` pode dar upgrade de Pro manualmente.

---

## 5. AUDIT CHECKLIST PRÉ-LAUNCH (10 itens verificáveis)

| # | Item | Como verificar | Status hoje |
|---|---|---|---|
| 1 | Roles `app_owner` / `app_user` batem com `ROLES.md` (NOSUPERUSER + BYPASSRLS) | `psql -c "SELECT rolname, rolsuper, rolbypassrls FROM pg_roles WHERE rolname IN ('app_owner','app_user')"` | ⚠ Divergência (init-db.sh vs init-roles.sql) |
| 2 | `withTenant()` é a **única** porta de entrada para queries de runtime | `grep -r "getDb()" apps/web/app apps/web/server/actions apps/web/server/repositories` → todas devem estar dentro de `withTenant()` ou serem legítimas (DSR, public player, webhooks) | ⚠ Vários usos de `getDb()` direto (DSR, embed, /d/[slug], leads POST) — todos são casos com policy pendente |
| 3 | `/d/[slug]` carrega demo pública em browser anônimo | `curl -s https://app.demobr.com.br/d/tour-exemplo` → HTML com markup de player, status 200 | ❌ Não validado em E2E (PHASE-14 Playwright ignorou com seed limitado) |
| 4 | Webhook Asaas valida HMAC real do payload | Inspecionar `lib/asaas.ts` verifyWebhookSignature | ❌ Implementação incorreta hoje |
| 5 | `check-dpo-missing.ts` retorna exit 0 | `pnpm exec tsx scripts/check-dpo-missing.ts` | ❌ 23 placeholders encontrados |
| 6 | DR drill roda mensalmente e notifica IC em falha | Cron GitHub Actions + PagerDuty/SMS no failure | ❌ Não agendado |
| 7 | Restore real recupera último full + WALs | `scripts/restore-drill.sh` retorna contagens > 0 em tabelas críticas | ⚠ Script existe, nunca rodou em prod |
| 8 | `pg_dump` cifrado via pgBackRest AES-256 (não `pg_dump` plain) | `infra/postgres/pgbackrest.conf` tem `repo1-cipher-type=aes-256-cbc` | ⚠ pgbackrest.conf existe mas docker-compose.prod.yml **NÃO tem container pgbackrest** |
| 9 | Limites de plano enforced (3 demos Free, 100 leads Pro) | `apps/web/lib/billing/enforce-limits.ts` (ou similar) + teste E2E | ❓ Não verifiquei — precisa investigação |
| 10 | Extension manifest sem `<all_urls>` | `grep all_urls apps/extension/manifest.json` | ❌ Tem `<all_urls>` |

**Resumo:** 0/10 verificações passam todas hoje. Ajustes R1-R5 cobrem 7/10. Sobram: item 3 (player público), 8 (pgBackRest container), 9 (enforcement).

---

## 6. RISCOS RESIDUAIS (mesmo após correções, o que pode dar errado)

### Risco A: Single VPS = single point of failure
- O ponto está documentado no ADR-009 e RFC §7 (Risco 5), e a mitigação é pgBackRest + restore. **Sem failover ativo, SLA > 99,9% é impossível.** Para B2B que paga R$ 199/mês e quer SLA, isso vira objeção comercial legítima.
- **Plano B válido** (citado na RFC): 2º VPS Hetzner com `repmgr` + ~R$ 80/mês. **Implementar** antes de vender Business R$ 199.

### Risco B: Concorrência BR — GuiaFlow vai copiar LGPD DSR em 2-3 meses
- GuiaFlow já é MIT + R$ 36. A diferenciação "LGPD by design" tem **vida útil curta**. O que sobra: PIX recorrente (BRL+NF-e) + suporte PT-BR + CRM BR. Foco GTM em fechar 50 clientes nos primeiros 6 meses antes que o ecossistema se acomode.

### Risco C: Cloudflare R2 + Cloudflare CDN = lock-in moderado
- A RFC §6.1.1 já reconhece isso e cita Backblaze B2 como plano B. Em prática: dados em R2 são S3-API compatíveis (CSV/JSON export funciona), mas custom domain pra Business tier (CNAME) **é Cloudflare-only**. Migrar = reconstruir front-end de CNAME.
- **Mitigação aceitável:** documentar saída em `docs/runbooks/storage-migration.md`.

### Risco D: Extensão MV3 sem `tabCapture`/`offscreen` = "demo estática"
- Em sites com estado animado / interativo, a captura é 1 screenshot por clique. Isso não é problema para a maioria dos SaaS B2B, mas **se o produto capturado usar elementos custom (canvas, WebGL, video), o demo fica ruim**. Clientes enterprise (Netflix-like dashboards) não vão funcionar.
- **Mitigação:** documentar limitação na extensão store; adicionar `tabCapture` na V2 quando quota CWS permitir.

### Risco E: Cobertura de testes em componentes React = 0% (PHASE-14)
- PHASE-14 Step 9 lista coverage lines 13.86%, mas componentes UI/editor/player **estão em 0%** (exceto state-machine). 0% em React components significa que 50% do código da aplicação (UI do editor, player visual, drag-and-drop, etc) **não tem teste unitário**. Cobertura E2E com Playwright ajuda para fluxos críticos, mas regressões visuais passam batido.
- **Mitigação:** smoke test Playwright por rota principal antes do lançamento de cada sprint.

### Risco F: "30 dias grátis sem cartão" pode ser atacável
- Sem cartão, **um único e-mail = uma conta Free = 3 demos**. Isso vira vetor de abuso (criação de 100 contas para escalar leads coletados em plataformas parceiras). Limitação prática: cookie/IP no Clerk throttle (free Clerk tem rate-limit próprio, ~30 accounts/IP/dia). Aceitável para MVP, mas **botar um `toque humano` na 1ª semana de uso** (e-mail de boas-vindas pedindo confirmar uso comercial).

---

## SEÇÃO FINAL — Resumo executivo SRE

**Quem ler isso em 30 segundos fica sabendo:**

1. **Decisão go/no-go:** 🟡 Não. Aguardo R1-R5 (~2 semanas) + contratação DPO PJ (Caminho B do DPO.md).
2. **Top blocker técnico:** divergência entre scripts de init que cria `app_owner SUPERUSER` (inconsistente com `init-roles.sql` e ROLES.md canônica). Risco de bypass de RLS via `.env` mal configurado.
3. **Top blocker LGPD:** DSR usa role errado (app_user sem tenant), portanto não cumpre art. 18 entre workspaces.
4. **Top blocker operacional:** restore drill sem agendamento = "achamos que temos backup, mas nunca testamos".
5. **Bom com confirmação:** isolation RLS funcional (10/10 testes), build passa, 135/135 tests passing, schema RLS força em 13/13 tabelas, separação `app_owner`/`app_user` documentada. Esses são **fundamentos sólidos** — a base multi-tenant está bem feita.
6. **Pré-condição para R$ 199 Business:** 2º VPS com repmgr. Single-host não aguenta SLA 99,9%.

**Quando este relatório for aprovado e os blockers resolvidos, reexecutar PHASE-14 (run válido de `test-rls.ts`, `test-rls-admin.ts`, Vitest, Playwright E2E do player público) e o relatório pode virar o primeiro commit.**

— *Subagente CONCLAVE SRE, DemoBR — 2026-10-18*
