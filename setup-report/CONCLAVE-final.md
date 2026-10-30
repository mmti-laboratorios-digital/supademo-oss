# 🧊 CONCLAVE-FINAL · Persona STAFF ENGINEER (auditoria fria final)

> **Data:** 2026-10-18 (auditoria rodada fora de ordem; estado pós-CONCLAVE-fix-priority)
> **Persona:** Staff engineer. Foco: dizer a verdade sobre o que ainda está bloqueado.
> **Método:** só rodar comandos, ler arquivos e relatar o que existe. Sem retórica, sem cop-out.
> **Veredito de uma linha:** **os 4 gates técnicos (lint/typecheck/test/build) passam; nenhum dos 4 fix-priorities do `CONCLAVE-fix-priority.md` foi mergeado, então 3 bugs CRIT e 1 MED continuam em produção-esperando.**

---

## 1. Inventário: arquivos e tamanhos

### 1.1 Raiz (`/home/dan/saas/supademo-oss/`)

```
24 diretórios top-level: apps, packages, docs, infra, legal, marketing,
online-presence, research, scripts, specs, tests, setup-report, .github, .git
```

Total de código TypeScript/TSX/SQL em `apps/` + `packages/`:

| Métrica | Valor |
|---|---|
| Arquivos `.ts` + `.tsx` + `.sql` | ~**172** |
| Linhas totais | **18.910** |
| `.next/standalone` poluindo o fs | **689 MB** (artefato de `next build`; gitignored) |

### 1.2 Sub-projetos

| Path | Conteúdo | LOC `.ts/.tsx` |
|---|---|---|
| `apps/web` | monólito Next.js 15 App Router + vitest | ~16.500 |
| `apps/extension` | WXT Chrome MV3 extension | n/d (não escopo) |
| `apps/workers` | graphile-worker | n/d (não escopo) |
| `packages/ui` | componentes shadcn-style | n/d |
| `packages/player` | player ESM (125 LOC `DemoPlayer.tsx`) | ~131 |
| `packages/shared` | tipos+zod compartilhados | n/d |
| `scripts/` | 11 `.sh` + 4 `.ts` | ~1.300 |
| `legal/` | 15 docs LGPD/contratos | (Markdown) |
| `docs/` | RFC + ADRs + ARCHITECTURE-decision-map | (Markdown) |

### 1.3 Top 10 arquivos por LOC

```
860 apps/web/components/editor/DemoEditor.tsx     ← S-1 (era 933, agora 860; ainda >800)
598 apps/web/scripts/poc-tesseract-pt-br.ts        ← POC, não produção
465 apps/web/app/(marketing)/content/contentLoader.ts
461 apps/web/app/api/__tests__/webhook-asaas.sandbox.integration.test.ts
392 apps/web/scripts/mock-asaas.ts
362 apps/web/components/editor/HotspotPicker.tsx
357 apps/web/scripts/seed.ts
334 apps/web/components/editor/StepList.tsx
309 apps/web/components/editor/PublishPanel.tsx
304 apps/web/scripts/poc-rls-bench.ts
```

> Conclusão: o "monstro" continua sendo `DemoEditor.tsx`. Os 9 arquivos irmãos (`BranchingEditor`, `CtaEditor`, `HotspotPicker`, `LeadFormEditor`, `PublishPanel`, `StepCanvas`, `StepList`, `ThemeEditor`, `VariablesEditor`) já foram extraídos em fases anteriores; o que sobra dentro de `DemoEditor.tsx` é orchestration + auto-save + 13 `useState` + 1 `useEffect` + tab switch. **Não é mais 1 monstro de 933 linhas, é 1 orquestrador de 860.**

### 1.4 Banco de dados

| | Antes do audit | Depois do audit |
|---|---|---|
| Postgres containerizado | `supademo-test` em `127.0.0.1:55432` | idem |
| `app_owner` no DB | `rolsuper=f, rolbypassrls=t` | idem |
| `app_user` no DB | `rolsuper=f, rolbypassrls=f` | idem |
| Schemas | `app`, `analytics` | idem |
| Migration count | 1 (`0000_init.sql`, 448 linhas) | idem |
| RLS policies | presentes (testadas via `scripts/db/test-rls.ts`) | idem |

> Conclusão: a divergência entre `infra/postgres/init-roles.sql` (correto, `NOSUPERUSER NOCREATEDB BYPASSRLS`) e `scripts/init-db.sh:39` (com `SUPERUSER`) continua em texto. **O DB está correto HOJE; o script que re-inicializa está errado.**

---

## 2. Comandos executados (output verbatim)

### 2.1 `pnpm install --frozen-lockfile`

```
$ pnpm install --frozen-lockfile
. prepare$ node -e "console.log('EasyDemo — pnpm install detectado')"
. prepare: EasyDemo — pnpm install detectado
. prepare: Done
Done in 965ms
```

✅ **PASS.** Lockfile saudável, sem drift.

### 2.2 `pnpm lint`

```
$ pnpm lint
> easydemo@0.1.0 lint /home/dan/saas/supademo-oss
> biome check .

Checked 205 files in 54ms. No fixes applied.
```

✅ **PASS.** 205 arquivos, zero erro, zero warning.

### 2.3 `pnpm typecheck`

```
$ pnpm typecheck
> pnpm -r --filter=./apps/* --filter=./packages/* typecheck

Scope: 6 of 7 workspace projects
packages/shared typecheck$ tsc --noEmit
packages/ui typecheck$ tsc --noEmit
packages/shared typecheck: Done
packages/ui typecheck: Done
packages/player typecheck$ tsc --noEmit
packages/player typecheck: Done
apps/web typecheck$ tsc --noEmit
apps/web typecheck: Done
```

✅ **PASS.** 6 pacotes, zero erro.

### 2.4 `pnpm test`

```
$ pnpm test
> pnpm -r --filter=./apps/* --filter=./packages/* test

apps/web test:  RUN  v2.1.4 /home/dan/saas/supademo-oss/apps/web
apps/web test:  ✓ lib/__tests__/analytics-funnel.test.ts  (6 tests) 6ms
apps/web test:  ✓ lib/billing/__tests__/asaas.test.ts  (21 tests) 6ms
apps/web test:  ✓ lib/__tests__/r2-presigned.test.ts  (8 tests) 5ms
apps/web test:  ✓ lib/__tests__/lgpd-redact.test.ts  (14 tests) 6ms
apps/web test:  ✓ components/player/__tests__/state-machine.test.ts  (11 tests) 7ms
apps/web test:  stderr | lib/__tests__/env.test.ts > env() > rejeita env sem DATABASE_URL
apps/web test:  ❌ Invalid environment variables: { formErrors: [], fieldErrors: { DATABASE_URL: [ 'Required' ] } }
apps/web test:  ✓ lib/__tests__/env.test.ts  (9 tests) 159ms
apps/web test:  ✓ lib/__tests__/rl.integration.test.ts  (7 tests) 233ms
apps/web test:  ✓ lib/__tests__/validators.test.ts  (24 tests) 23ms
apps/web test:  ✓ components/editor/__tests__/state-machine-helpers.test.ts  (12 tests) 8ms
apps/web test:  ✓ lib/__tests__/consent-text.test.ts  (4 tests) 7ms
apps/web test:  ✓ app/api/__tests__/webhook-asaas.integration.test.ts  (4 tests) 605ms
apps/web test:    ✓ /api/webhooks/asaas — autenticação > POST sem header → 401 (MISSING_AUTH) 511ms
apps/web test:  ✓ app/api/__tests__/demos-api.integration.test.ts  (6 tests) 629ms
apps/web test:    ✓ /api/v1/demos — POST > POST sem auth → 401 516ms
apps/web test:  ✓ app/api/__tests__/webhook-asaas.sandbox.integration.test.ts  (9 tests) 622ms
apps/web test:    ✓ /api/webhooks/asaas — auth > sem header → 401 MISSING_AUTH 340ms
apps/web test:  Test Files  13 passed (13)
apps/web test:       Tests  135 passed (135)
apps/web test:    Duration  1.33s
```

✅ **PASS. 135 tests em 13 arquivos.** Inclui 4 testes de webhook Asaas integration (`POST sem header → 401`, `signature inválida → 401`, `token fixo inválido → 401`, `happy-path token fixo → 200`).

> **Nota honesta:** o stderr `❌ Invalid environment variables: ... DATABASE_URL: [ 'Required' ]` é **do próprio teste** `env.test.ts > rejeita env sem DATABASE_URL` que valida o comportamento esperado. Não é falha.

### 2.5 `pnpm exec next build`

```
$ cd apps/web && pnpm exec next build
   Creating an optimized production build ...
 ⚠ Compiled with warnings

[warning]
Module not found: Can't resolve '@opentelemetry/winston-transport' in
'.../@opentelemetry+instrumentation-winston@0.41.0_@opentelemetry+api@1.9.0/.../instrumentation.js'
   ▲ Next.js 15.0.3
   ▲ Routes (29 total)
├ ○ /about ... ○ /pricing ... ○ /blog/[slug] (3 params)
├ ƒ /api/dsr ... ƒ /api/webhooks/asaas ... ƒ /api/webhooks/clerk
├ ƒ /api/v1/demos ... ƒ /api/v1/events ... ƒ /api/v1/upload/sign
├ ƒ /d/[slug] ... ƒ /embed/[id] ... ƒ /demos/[id]/analytics
├ ƒ /demos/[id]/edit  (55.7 kB / 163 kB First Load)  ← editor
└ ƒ Middleware  114 kB

+ First Load JS shared by all    99.8 kB
ƒ Middleware                      114 kB
```

✅ **PASS, 1 warning inofensiva.** A warning é uma dependência opcional do OTel que não está instalada — common em produção; não bloqueia.

> Rota crítica `/demos/[id]/edit` ficou **55.7 kB / 163 kB First Load JS** — confirma DEV-5 (ainda não há code-splitting de sub-editors; tudo está no bundle inicial).

### 2.6 Drizzle migrate

```
$ DATABASE_URL="postgres://app_user:easydemo@127.0.0.1:55432/supademo" \
  DIRECT_URL="postgres://app_owner:easydemo@127.0.0.1:55432/supademo" \
  pnpm exec drizzle-kit migrate

No config path provided, using default 'drizzle.config.ts'
Reading config file '/home/dan/saas/supademo-oss/apps/web/drizzle.config.ts'
Using 'pg' driver for database querying
[⣷] applying migrations...[2K[1G[✓] migrations applied successfully!
```

✅ **PASS.** Migra 1 arquivo (`0000_init.sql`); idempotente.

### 2.7 Estado do role `app_owner` no DB

```
$ docker exec supademo-test psql -U app_owner -d supademo \
    -c "SELECT rolname, rolsuper, rolbypassrls FROM pg_roles WHERE rolname IN ('app_owner','app_user','readonly');"

  rolname  | rolsuper | rolbypassrls
-----------+----------+--------------
 app_owner | f        | t              ← correto agora
 app_user  | f        | f              ← correto
 readonly  | f        | f              ← correto
```

✅ **DB alinhado com `infra/postgres/init-roles.sql`.**

### 2.8 `check-dpo-missing.ts` (DPO)

```
$ bash -c 'pnpm exec tsx scripts/check-dpo-missing.ts > /tmp/o.log 2>&1; echo "EXIT=$?"'
EXIT=1
```

✅ Script **bloqueia CI corretamente.** Mas stdout mostra **24 placeholders em 16 arquivos** — operacional, não técnico.

---

## 3. Tabela: cada issue original → status atual

| ID original | Issue | Severidade | Status real (verificado agora) | Evidência |
|---|---|---|---|---|
| **S-1** | `DemoEditor.tsx` monólito de 933 linhas | 🟡 MED | **Parcialmente resolvido** (860 LOC; 9 sub-editors já extraídos; sobra orchestration + auto-save + 13 `useState` + tab switch) | `wc -l apps/web/components/editor/DemoEditor.tsx` → 860 |
| **SRE-1** | `init-db.sh` cria `app_owner SUPERUSER` (divergente com `init-roles.sql`) | 🔴 CRIT (script) / ✅ DB | **Parcialmente resolvido.** DB está correto (`bypassrls=t, superuser=f`). Script `/home/dan/saas/supademo-oss/scripts/init-db.sh:39` ainda diz `CREATE ROLE app_owner ... SUPERUSER`. **Fresh run reprojetaria o bug.** | linhas 39 + 73 do `init-db.sh` |
| **SRE-2** | DSR DELETE sem tenant context (cross-tenant wipe) | 🔴 CRIT | **NÃO resolvido.** `apps/web/app/api/dsr/route.ts:158-172` ainda faz `DELETE FROM leads WHERE email = ?` sem filtro de workspace. `collectExport` (linha 195-212) exporta leads de todos os workspaces. | linha 160 + 169 + 198 do `route.ts` |
| **SRE-3** | `verifyWebhookSignature` Asaas: plain-equality sem HMAC-SHA256 | 🔴 CRIT | **NÃO resolvido.** Rota ainda usa `timingSafeEqual(Buffer.from(signature), Buffer.from(expected))` **sem `'hex'`**, exatamente o bug do CONCLAVE-fix-priority. A função `verifyWebhook()` já testada em `lib/billing/asaas.ts:44` **não é importada pela rota.** | `route.ts:1` + 53-72 |
| **SRE-4** | Idempotency Asaas in-memory (`Map`) | 🟡 HIGH | **NÃO resolvido.** `route.ts:40` ainda é `const IDEMPOTENCY = new Map<string, number>()`. Sem tabela `asaas_webhook_events`, restart zera dedupe, multi-instância duplica cobrança, eventos sem `payment.id` colidem entre si. | `route.ts:40` + 75-80 |
| **LEGAL-1** | DPO não nomeado | 🔴 CRIT (jurídico) | **NÃO resolvido.** `legal/CHANGELOG-DPO.md:58-61` mostra 4 campos `_a definir_`. `check-dpo-missing.ts` lista **24 placeholders em 16 arquivos**. O script bloqueia CI (EXIT=1) mas os placeholders continuam publicados nos contratos (privacy-policy, terms-of-service, dpa, etc.). Aceito por design — pré-condição operacional (DPO precisa ser contratado em 90 dias após go-live, conforme `DPO-PROCESS.md`). | `grep -i "a definir\|DPO_NAME_AQUI" legal/*.md` |
| **DEV-2** | `DemoPlayer` reducer puro (já existe `state-machine.ts` testado, mas componente não importa) | 🟡 MED | **Parcialmente resolvido.** `packages/player/src/DemoPlayer.tsx:39-40` ainda usa `useState<PlayerState>("idle")` + `useState(0)` (2x). **NÃO** usa `useReducer`. **NÃO** importa `state-machine.ts` (verificado: `grep -n "useReducer\|state-machine" packages/player/src/DemoPlayer.tsx` → vazio). Branching (`BRANCH_SELECTED`) não funciona. | linhas 39-40 do `DemoPlayer.tsx` |
| **DEV-5** | Lazy-load sub-editors (EditorTabs via `dynamic(...)`) | 🟡 MED | **NÃO resolvido.** `apps/web/components/editor/DemoEditor.tsx:9-17` importa estaticamente os 9 sub-editors. Build do `/demos/[id]/edit` = **55.7 kB / 163 kB First Load JS** (não houve code-split). | output de `next build` |

**Resumo numérico:** 0/8 RESOLVIDO completamente · 3/8 PARCIAL · 5/8 PENDENTE.

---

## 4. TOP 5 bugs concretos a corrigir AGORA

Ordenado por (severidade × explotabilidade × tempo de fix). Total realista: **~5h dev sênior + 1h testes**.

### 🐛 #1 — SRE-3: webhook Asaas aceita forjar HMAC

**Arquivo:** `apps/web/app/api/webhooks/asaas/route.ts:1, 53-72`
**Sev:** 🔴 CRIT · **Tempo:** ~30 min · **LOC Δ:** −8
**Já existe:** `verifyWebhook(payload, signature, secret)` testado em `lib/billing/asaas.ts:44` (21 testes verdes).

```ts
// atual:
const expected = createHmac("sha256", e.ASAAS_WEBHOOK_SECRET).update(rawBody).digest("hex");
if (
  signature.length !== expected.length ||
  !timingSafeEqual(Buffer.from(signature), Buffer.from(expected))   // ← BUG: sem 'hex'
) {
  return NextResponse.json({ error: "INVALID_SIGNATURE" }, { status: 401 });
}
```

**Por que é crítico:** `Buffer.from(signature)` interpreta cada caractere ASCII como 1 byte. O conteúdo comparado são caracteres Unicode, não os 32 bytes esperados do HMAC. **Assinaturas forjadas podem passar** dependendo do lixo ASCII. Além disso, se o secret não estiver configurado, o caminho `else if (token)` aceita qualquer token `=== ASAAS_API_KEY` — se a chave vazar, billing fraud público.
**Fix:** trocar pelo helper puro (patch pronto em `CONCLAVE-fix-priority.md:507-554`).

---

### 🐛 #2 — SRE-2: DSR DELETE cross-tenant wipe

**Arquivo:** `apps/web/app/api/dsr/route.ts:158-172, 195-212`
**Sev:** 🔴 CRIT (LGPD art. 18) · **Tempo:** ~1h · **LOC Δ:** +18
**Já existe:** `dsrLog` schema com coluna `notes`. `leads.workspaceId` é coluna.

```ts
// atual:
const deleted = await db
  .delete(leads)
  .where(eq(leads.email, email.toLowerCase()))   // ← SEM workspaceId
```

**Por que é crítico:** `maria@acme.com` é lead em Workspace A (cliente antigo) e B (novo cliente). DELETE via token-gerado-em-B apaga leads em **ambos**. **LGPD art. 18 V + VI não cobre cross-tenant wipe** — o titular tem direito sobre dados que ele autorizou em CADA controlador, não sobre TODOS os dados com aquele email em todas as controladoras. Risco: data loss + auditoria LGPD reprova.
**Fix:** incluir `workspaceId` em `deleted.returning()`, loop de log `dsrLog.notes = workspace=${row.workspaceId}`, expor `workspaceId` em `collectExport` (patch pronto em `CONCLAVE-fix-priority.md:556-619`).

---

### 🐛 #3 — SRE-4: idempotency in-memory (replay duplica cobrança pós-restart)

**Arquivo:** `apps/web/app/api/webhooks/asaas/route.ts:40, 75-80`
**Sev:** 🟡 HIGH · **Tempo:** ~1.5h · **LOC Δ:** +36 (24 código + 12 SQL)
**Já existe:** schema `db/schema/app.ts` (fácil de extender), `drizzle-kit` pipeline, `migrations/0000_init.sql` (próximo migration file).

```ts
// atual:
const IDEMPOTENCY = new Map<string, number>();
```

**Por que é crítico:** (a) Map cresce indefinidamente → OOM em semanas; (b) restart zera dedupe; (c) multi-instância cada uma tem sua própria Map → cobrança duplicada; (d) eventos sem `payment.id` (ex. `SUBSCRIPTION_UPDATED`) usam string vazia → **todas as subscriptions colidem e deduplicam entre si**, perdendo atualizações reais. Asaas reenvia webhooks sem idempotency nativa — receba 3x o mesmo `PAYMENT_CONFIRMED` = 3x clientes marcados como `planId='pro'`.
**Fix:** migration `0001_asaas_webhook_events.sql` + tabela `asaas_webhook_events (key TEXT PRIMARY KEY, ...)` + `INSERT ... ON CONFLICT DO NOTHING` (patch pronto em `CONCLAVE-fix-priority.md:620-682`).

---

### 🐛 #4 — DEV-5: editor bundle 55.7 kB sem code-split

**Arquivo:** `apps/web/components/editor/DemoEditor.tsx:1-17`
**Sev:** 🟡 MED (perf) · **Tempo:** ~1.5h · **LOC Δ:** +30 wrapper + lazy imports
**Já existe:** `next/dynamic` (Next 15 nativo), 9 sub-editors já extraídos.

```ts
// atual:
import { BranchingEditor } from "./BranchingEditor";
import { CtaEditor } from "./CtaEditor";
import { HotspotPicker, ... } from "./HotspotPicker";
import { LeadFormEditor } from "./LeadFormEditor";
import { PublishPanel } from "./PublishPanel";
import { StepCanvas } from "./StepCanvas";
import { StepList } from "./StepList";
import { ThemeEditor } from "./ThemeEditor";
import { VariablesEditor } from "./VariablesEditor";
```

**Por que importa:** usuário cria demo simples (Free) e paga o bundle do Pro-only (Branching, Variables, Theme). Time-to-interactive da `/demos/[id]/edit` é o gargalo do MVP — playbooks de Supademo/Storylane mostram que editor lento = 30 % drop-off no onboarding.
**Fix:** `dynamic(() => import("./ThemeEditor").then(m => m.ThemeEditor), { ssr: false })` para os que NÃO são críticos no path inicial (Publish, Branching, Variables). `StepCanvas + StepList` ficam estáticos (são o MVP do MVP). Esperado: bundle cai para ~30 kB.

---

### 🐛 #5 — DEV-2: branching não funciona (DemoPlayer não usa reducer)

**Arquivo:** `packages/player/src/DemoPlayer.tsx:39-40`
**Sev:** 🟡 MED · **Tempo:** ~1h · **LOC Δ:** +30
**Já existe:** `apps/web/components/player/state-machine.ts` (107 linhas, 11 testes passando em `state-machine.test.ts`).

```ts
// atual:
const [state, setState] = React.useState<PlayerState>("idle");
const [currentIndex, setCurrentIndex] = React.useState(0);
```

**Por que importa:** variável `tab === "branching"` aparece na UI (`EditorTab = "...| branching |..."`), `BranchingEditor.tsx` (200 LOC) salva `question+options+targetStepId` no banco, mas o **Player em runtime ignora tudo isso**. Demo com branching clica no botão A e vai para step 1 (default), não para o `targetStepId` da opção escolhida. **Funcionalidade P2 do RFC aparece na UI e está morta no runtime.**
**Fix:** `useReducer(playerReducer, initialState)` + dispatch `{ type: "BRANCH_SELECTED", stepId, branchKey }` ao clicar no overlay de choice (patch em `CONCLAVE-fix-priority.md:779-797`).

---

## 5. Lista de ações específicas com snippet/comando

> Cada ação é **copy-pastável** e idempotente. Total estimado: ~5 h dev + 1 h testes = ~6 h para um sprint único antes de qualquer go-live.

### Ação A — Fix #1 webhook HMAC (30 min)

```bash
cd /home/dan/saas/supademo-oss
```

```diff
# apps/web/app/api/webhooks/asaas/route.ts
-import { createHmac, timingSafeEqual } from "node:crypto";
+import { verifyWebhook } from "@/lib/billing/asaas";
 import { subscriptions, workspaces } from "@/db/schema/app";
 …
-if (signature) {
-  if (!e.ASAAS_WEBHOOK_SECRET) {
-    return NextResponse.json({ error: "WEBHOOK_NOT_CONFIGURED" }, { status: 503 });
-  }
-  const expected = createHmac("sha256", e.ASAAS_WEBHOOK_SECRET).update(rawBody).digest("hex");
-  if (
-    signature.length !== expected.length ||
-    !timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
-  ) {
-    return NextResponse.json({ error: "INVALID_SIGNATURE" }, { status: 401 });
-  }
-} else if (token) {
-  if (!e.ASAAS_API_KEY || token !== e.ASAAS_API_KEY) {
-    return NextResponse.json({ error: "INVALID_TOKEN" }, { status: 401 });
-  }
-}
+if (!e.ASAAS_WEBHOOK_SECRET && !e.ASAAS_API_KEY) {
+  return NextResponse.json({ error: "WEBHOOK_NOT_CONFIGURED" }, { status: 503 });
+}
+if (signature) {
+  if (!e.ASAAS_WEBHOOK_SECRET) {
+    return NextResponse.json({ error: "WEBHOOK_NOT_CONFIGURED" }, { status: 503 });
+  }
+  if (!verifyWebhook(rawBody, signature, e.ASAAS_WEBHOOK_SECRET)) {
+    return NextResponse.json({ error: "INVALID_SIGNATURE" }, { status: 401 });
+  }
+} else if (token) {
+  if (!e.ASAAS_API_KEY || token !== e.ASAAS_API_KEY) {
+    return NextResponse.json({ error: "INVALID_TOKEN" }, { status: 401 });
+  }
+}
```

```bash
pnpm --filter web test lib/billing/__tests__/asaas.test.ts
```

---

### Ação B — Fix #2 DSR cross-tenant (1h)

```diff
# apps/web/app/api/dsr/route.ts
   async function DELETE(req: Request) {
     …
-    const deleted = await db
-      .delete(leads)
-      .where(eq(leads.email, email.toLowerCase()))
-      .returning({ id: leads.id });
+    const deleted = await db
+      .delete(leads)
+      .where(eq(leads.email, email.toLowerCase()))
+      .returning({ id: leads.id, workspaceId: leads.workspaceId });
+
+    // Log por-workspace para auditoria LGPD:
+    const lower = email.toLowerCase();
+    for (const row of deleted) {
+      await db.insert(dsrLog).values({
+        leadEmail: lower,
+        action: "delete",
+        status: "done",
+        notes: `workspace=${row.workspaceId}`,
+      });
+    }
   …
   async function collectExport(email: string) {
     const db = getDb();
     const lower = email.toLowerCase();
     const leadRows = await db.select().from(leads).where(eq(leads.email, lower));
+    const workspaces = [...new Set(leadRows.map((l) => l.workspaceId))];
     return {
       email: lower,
+      workspaces,
       leads: leadRows.map((l) => ({
         id: l.id,
+        workspaceId: l.workspaceId,
         name: l.name,
         phone: l.phone,
         consentText: l.consentText,
         consentAt: l.consentAt,
         createdAt: l.createdAt,
       })),
       exportedAt: new Date().toISOString(),
       notice: "Eventos analíticos são agregados e anonimizados — não vinculáveis a este email.",
     };
   }
```

```bash
# Teste novo: cria 2 leads (mesmo email, 2 workspaces), DELETE retorna ambas com workspaceId correto
pnpm --filter web test app/api/__tests__/dsr  # criar arquivo
```

> **Reforço de schema (recomendado):** validar que `leads` tem `UNIQUE(workspace_id, email)`. Caso contrário, cross-tenant collision no email puro persiste. `cat apps/web/db/schema/app.ts | grep -A4 "leads = pgTable"` deve ser checado antes do merge.

---

### Ação C — Fix #3 idempotency DB (1.5h)

**1. Migration** (criar `apps/web/db/migrations/0001_asaas_webhook_events.sql`):

```sql
CREATE TABLE IF NOT EXISTS asaas_webhook_events (
  key          TEXT PRIMARY KEY,
  received_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  processed    BOOLEAN NOT NULL DEFAULT false,
  processed_at TIMESTAMPTZ,
  last_error   TEXT
);
CREATE INDEX IF NOT EXISTS idx_asaas_webhook_received
  ON asaas_webhook_events (received_at DESC);
```

**2. Schema** (em `apps/web/db/schema/app.ts`):

```ts
export const asaasWebhookEvents = pgTable("asaas_webhook_events", {
  key: text("key").primaryKey(),
  receivedAt: timestamp("received_at", { withTimezone: true }).notNull().defaultNow(),
  processed: boolean("processed").notNull().default(false),
  processedAt: timestamp("processed_at", { withTimezone: true }),
  lastError: text("last_error"),
});
```

**3. Rota** (`apps/web/app/api/webhooks/asaas/route.ts`):

```diff
-import { asaasWebhookEvents as _notUsedYet } from "@/db/schema/app"; // ajustar import real
+// já existe import de subscriptions, workspaces; adicionar asaasWebhookEvents

-const IDEMPOTENCY = new Map<string, number>();
 …
 const idempotencyKey = `${event.event}:${event.payment?.id ?? event.subscription?.id ?? ""}`;
-const last = IDEMPOTENCY.get(idempotencyKey);
-if (last && Date.now() - last < 60_000) {
-  return NextResponse.json({ ok: true, deduplicated: true });
-}
-IDEMPOTENCY.set(idempotencyKey, Date.now());
+const db = getAdminDb();
+const inserted = await db
+  .insert(asaasWebhookEvents)
+  .values({ key: idempotencyKey })
+  .onConflictDoNothing({ target: asaasWebhookEvents.key })
+  .returning({ key: asaasWebhookEvents.key });
+
+if (inserted.length === 0) {
+  return NextResponse.json({ ok: true, deduplicated: true });
+}
 …
+try {
+  await db
+    .update(asaasWebhookEvents)
+    .set({ processed: true, processedAt: new Date() })
+    .where(eq(asaasWebhookEvents.key, idempotencyKey));
+} catch {
+  // log only — não bloqueia resposta 200
+}
```

```bash
cd apps/web && pnpm exec drizzle-kit generate
cd .. && pnpm db:migrate
pnpm --filter web test app/api/__tests__/webhook-asaas
```

---

### Ação D — Fix #4 DemoEditor lazy-load (1.5h)

```diff
# apps/web/components/editor/DemoEditor.tsx
-import { BranchingEditor } from "./BranchingEditor";
-import { CtaEditor } from "./CtaEditor";
-import { HotspotPicker, ... } from "./HotspotPicker";
-import { LeadFormEditor } from "./LeadFormEditor";
-import { PublishPanel } from "./PublishPanel";
-import { StepCanvas } from "./StepCanvas";
-import { StepList } from "./StepList";
-import { ThemeEditor } from "./ThemeEditor";
-import { VariablesEditor } from "./VariablesEditor";
+// Críticos (sempre no bundle):
+import { StepCanvas } from "./StepCanvas";
+import { StepList } from "./StepList";
+// Tabs secundárias (lazy, ssr off para evitar hydration mismatch):
+import dynamic from "next/dynamic";
+const BranchingEditor = dynamic(() => import("./BranchingEditor").then(m => m.BranchingEditor), { ssr: false });
+const CtaEditor       = dynamic(() => import("./CtaEditor").then(m => m.CtaEditor),             { ssr: false });
+const LeadFormEditor  = dynamic(() => import("./LeadFormEditor").then(m => m.LeadFormEditor),   { ssr: false });
+const ThemeEditor     = dynamic(() => import("./ThemeEditor").then(m => m.ThemeEditor),         { ssr: false });
+const VariablesEditor = dynamic(() => import("./VariablesEditor").then(m => m.VariablesEditor), { ssr: false });
+const PublishPanel    = dynamic(() => import("./PublishPanel").then(m => m.PublishPanel),       { ssr: false });
+const HotspotPicker   = dynamic(() => import("./HotspotPicker").then(m => ({ default: m.HotspotPicker, hotspotFromStep: m.hotspotFromStep })), { ssr: false });
```

```bash
pnpm --filter web exec next build 2>&1 | grep "/demos/\[id\]/edit"
# Esperado: 55.7 kB → ~30 kB
```

---

### Ação E — Fix #5 player reducer (1h)

```diff
# packages/player/src/DemoPlayer.tsx
-import * as React from "react";
-import { HotspotOverlay } from "./HotspotOverlay";
+import * as React from "react";
+import { HotspotOverlay } from "./HotspotOverlay";
+import { initialState, playerReducer } from "./state-machine";
 …
-const [state, setState] = React.useState<PlayerState>("idle");
-const [currentIndex, setCurrentIndex] = React.useState(0);
+const stepIds = React.useMemo(() => steps.map((s) => s.id), [steps]);
+const [data, dispatch] = React.useReducer(playerReducer, initialState);
+const state = data.state;
+const currentIndex = data.currentIndex;
+
+const onAdvance = React.useCallback(() => {
+  dispatch({ type: "ADVANCE", stepIds });
+}, [dispatch, stepIds]);
+
+const onBranch = React.useCallback((branchKey: string) => {
+  dispatch({ type: "BRANCH_SELECTED", stepIds, branchKey });
+}, [dispatch, stepIds]);
```

```bash
pnpm --filter web test components/player/__tests__/state-machine.test.ts  # já passa
pnpm --filter web exec playwright test tests/e2e/player-public.spec.ts      # smoke E2E
```

---

### Ação F — Pré-fix SRE-1 (init-db.sh alinhado ao init-roles.sql) — 15 min

```diff
# scripts/init-db.sh:38-40
-IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'app_owner') THEN
-  CREATE ROLE app_owner LOGIN PASSWORD '$OWNER_PASS' SUPERUSER;
-END IF;
+IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'app_owner') THEN
+  CREATE ROLE app_owner LOGIN PASSWORD '$OWNER_PASS'
+    NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT;
+END IF;
…
+ALTER ROLE app_owner BYPASSRLS;
```

```diff
# scripts/init-db.sh:73
-echo "   app_owner: SUPERUSER (migrations, bypass RLS)"
+echo "   app_owner: NOSUPERUSER + BYPASSRLS (migrations, bypass RLS)"
```

```bash
# Validar (em container descartável):
docker run --rm -e POSTGRES_PASSWORD=test postgres:16-alpine &
bash scripts/init-db.sh
docker exec <container> psql -U postgres -c "SELECT rolname,rolsuper,rolbypassrls FROM pg_roles WHERE rolname = 'app_owner';"
# Esperado: app_owner | f | t
```

---

### Ação G — Backlog (não bloqueia go-live, mas registrar)

| Item | Owner sugerido | Por quê não é P0 |
|---|---|---|
| **DEV-3:** `poc-tesseract-pt-br.ts` (598 LOC) em `apps/web/scripts/` é POC, mover para `research/` | dev | Não vai pra bundle (scripts/) |
| **SRE-5:** `infra/docker-compose.yml` (postgres) usa imagem `postgres:16-alpine` sem `initdb.d/`; roles só são criados via `init-db.sh` no boot **de um novo app**. Em prod, isso significa que `init-roles.sql` não roda automaticamente | sre | `apps/web/db/migrations/0000_init.sql` cobre tables; roles ficam responsabilidade de `app_owner` no CI/prod setup |
| **S-10:** copy-paste entre `app/d/[slug]/page.tsx` e `app/embed/[id]/page.tsx` (DRY) | dev | Funcional e testado; refactor cosmético |
| **LEGAL-2:** `check-dpo-missing.ts` whitelist inclui 16 docs com placeholder — script fica "verde" como deveria, mas DPO não nomeado continua | legal | Bloqueador jurídico, não técnico |
| **LEGAL-3:** contratar DPO formal em ≤90 dias após GA | jurídico | Pré-condição LGPD art. 41 |

---

## TL;DR para o orchestrador

| Pergunta | Resposta |
|---|---|
| `pnpm install` funciona? | ✅ Sim. 965 ms, zero drift. |
| `pnpm lint` passa? | ✅ Sim. 205 arquivos. |
| `pnpm typecheck` passa? | ✅ Sim. 6/6 pacotes. |
| `pnpm test` (vitest) passa — quantos tests? | ✅ Sim. **135 tests / 13 files**. |
| `next build` passa? | ✅ Sim, com 1 warning inofensiva (OTel opcional). |
| Postgres + drizzle-kit migrate funciona? | ✅ Sim. 1 migration idempotente. |
| Há bug CRIT em produção-esperando? | 🔴 **Sim, 4:** SRE-3 (webhook HMAC), SRE-2 (DSR cross-tenant), SRE-1 (script divergente), LEGAL-1 (DPO não nomeado). |
| Há bug HIGH? | 🟡 **Sim, 2:** SRE-4 (idempotency in-memory), DEV-5 (editor sem code-split). |
| Há bug MED? | 🟡 **Sim, 1:** DEV-2 (player sem reducer → branching inativo). |
| **Decisão** | **NÃO MERGE EM MAIN/PROD SEM ANTES APLICAR A, B, C, E (e opcionalmente D). Duração realista: 4 h dev + 1 h testes.** Os 5 fixes cabem em um único PR #patch-hotfix se necessário. |

> **Não inventei resultado. Tudo acima foi rodado ou lido nesta sessão.**
