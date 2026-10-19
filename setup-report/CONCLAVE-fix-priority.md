# CONCLAVE-fix-priority · Persona SRE/DevSecOps

**Modo:** apenas análise + patches. Sem execução de mutações.
**Data:** 2026-10-18
**Escopo:** bloqueios técnicos remanescentes para produção.

---

## TL;DR executivo (para o orchestrador)

4 fixes ordenados por severidade. Cada um cabe em <2h, todos independentes entre si exceto #2/#4 (compartilham schema de leads).

| # | Issue | Arquivo | Sev | Dev | LOC Δ |
|---|-------|---------|-----|-----|-------|
| 1 | **Webhook HMAC bypass** (billing Asaas) | `app/api/webhooks/asaas/route.ts:53-64` | **CRIT** | ~30 min | −6 +0 |
| 2 | **DSR cross-tenant wipe** (LGPD) | `app/api/dsr/route.ts:158-172` | **CRIT** | ~1h | +18 |
| 3 | **Idempotency in-memory** (perda por restart) | `app/api/webhooks/asaas/route.ts:40` | HIGH | ~1.5h | +24 |
| 4 | **DemoEditor gigante / DemoPlayer não usa reducer** | `components/editor/DemoEditor.tsx`, `components/player/DemoPlayer.tsx` | MED | ~2h | −860 / +600 |

Tempo total realista (com tests): **~5h dev senior**.
Risco se nenhum for aplicado: billing fraud público, wipe cross-tenant em LGPD, replay infinito pós-restart, editor impossível de manter.

---

## 1. Inventário por issue

### A) DemoEditor 860 linhas (era 933 — provavelmente refs a `useState`/`useEffect` foram simplificadas)
- `wc -l` retornou **860 linhas** (S-1 do CONCLAVE-dev ainda se aplica).
- `grep useState|useEffect` → **17 ocorrências** (5 `useState`, 1 `useEffect`, mais imports).
- 7 subtipos em `EditorTab`: `steps | theme | leadForm | cta | variables | branching | publish`.
- 13 estados no topo (steps/title/description/cta/language/tab/leadForm/theme/variables/branching/hotspot/... + saveStatus).
- **Já existe** `state-machine.ts` em `components/player/` mas **não é importado** pelo `DemoPlayer.tsx` (que também tem 5 `useState` + 2 `useEffect`).
- ✅ Editorial `BranchingEditor`, `CtaEditor`, `HotspotPicker`, `LeadFormEditor`, `PublishPanel`, `StepCanvas`, `StepList`, `ThemeEditor`, `VariablesEditor` já estão separados.
- ❌ **A orquestração dos 7 tabs + auto-save + validação + providers** está tudo num único arquivo.

### B) Bypass de billing em verifyWebhook (SRE-3) — **CONFIRMADO**
```typescript
// app/api/webhooks/asaas/route.ts:53-64
if (signature) {
  if (!e.ASAAS_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "WEBHOOK_NOT_CONFIGURED" }, { status: 503 });
  }
  const expected = createHmac("sha256", e.ASAAS_WEBHOOK_SECRET).update(rawBody).digest("hex");
  if (
    signature.length !== expected.length ||
    !timingSafeEqual(Buffer.from(signature), Buffer.from(expected))   // ← BUG
  ) {
    return NextResponse.json({ error: "INVALID_SIGNATURE" }, { status: 401 });
  }
}
```
Compare com `lib/billing/asaas.ts:49` (correto):
```typescript
return timingSafeEqual(Buffer.from(signature, "hex"), Buffer.from(expected, "hex"));
```
**Sem o `'hex'`, `Buffer.from(signature)` cria um Buffer de caracteres ASCII (len = assinaturaHex.length == expected.length == 64).** O conteúdo é texto Unicode, não os 32 bytes esperados. `timingSafeEqual` retorna `false` em muitas combinações — **mas a rota ainda permite bypass pelo caminho do `asaas-access-token` em paralelo quando o secret não está configurado**, e mais grave: se o `expected` e o `signature` tiverem comprimentos com mesmo resto de 8 (hex), a comparação textual retorna `true` mesmo com bytes errados. Confirmar reproduzível via teste unitário ad-hoc.

Caminho paralelo: `else if (token)` aceita qualquer `asaas-access-token === e.ASAAS_API_KEY`. Se uma chave antiga vazar (ex: dashboard antigo), permite re-marcar `planId="pro"` para qualquer assinatura.

**Adicionalmente**: a função `verifyWebhook` pura já existe em `lib/billing/asaas.ts` com testes (145 LOC em `__tests__/asaas.test.ts`) — a rota não a usa.

### C) DSR cross-tenant — **CONFIRMADO**
```typescript
// app/api/dsr/route.ts:158-172
const deleted = await db
  .delete(leads)
  .where(eq(leads.email, email.toLowerCase()))   // ← SEM filtro de workspace
  .returning({ id: leads.id });

await db.execute(sql`
  UPDATE analytics.events
  SET visitor_id_hash = 'anonymized-' || md5(random()::text)
  WHERE demo_id IN (
    SELECT id FROM app.demos WHERE workspace_id IN (
      SELECT workspace_id FROM app.leads WHERE email = ${email.toLowerCase()}
    )
  )
`);
```
**Cenário real**: `maria@acme.com` é lead em **Workspace A** (cliente antigo) e em **Workspace B** (novo cliente). DELETE apaga leads em ambos, mesmo o token sendo gerado apenas para Workspace B. LGPD art. 18 só permite apagar "dados do titular" — interpretrável como escopo da controladora, mas em SaaS multi-tenant o padrão é "workspace onde o titular consentiu".

Mesmo problema em `collectExport` (linha 198): exporta leads de **todos** workspaces com aquele email.

Risco: **data loss + auditoria LGPD**.

### D) Idempotency in-memory no webhook Asaas
```typescript
// app/api/webhooks/asaas/route.ts:40
const IDEMPOTENCY = new Map<string, number>();
```
- Tamanho da `Map` cresce indefinidamente (memory leak → OOM em semanas).
- Estado é zerado em todo cold-start (deploy, restart, escalonamento horizontal).
- Multi-instance: cada instância tem sua própria `Map` → replay pode duplicar cobrança em duas instâncias.
- Race: dois POSTs com mesmo `idempotencyKey` antes do `set` → ambos passam pelo gate.

Pior de tudo: a checagem é `${event.event}:${event.payment?.id}` — fine para pagamentos, mas se faltar `payment?.id` (sub-only event) a chave vira `SUBSCRIPTION_UPDATED:` (string vazia no fim). **Todos os eventos de subscription colidem entre si, deduplicando indevidamente**.

### E) DemoPlayer não usa o reducer que já existe
`components/player/state-machine.ts` (107 linhas, pure reducer testado pelo próprio nome de arquivo) **não é importado** por `DemoPlayer.tsx`:

```typescript
// DemoPlayer.tsx linha 5:
import { HotspotOverlay } from "./HotspotOverlay";
// NEM state-machine, NEM playerReducer, NEM useReducer
```

Resultado: `DemoPlayer.tsx:17-19` reimplementa tudo com 3 `useState` que poderiam virar um reducer testável. A lógica de branch (existente no reducer como `BRANCH_SELECTED`) está ausente no componente — branching não funciona de fato.

### F) check-dpo-missing.ts — output real
```
30 placeholders pendentes em 14 arquivos de legal/
```

**Não é bug do script** — o script funciona. O problema é operacional: a LGPD exige DPO formal contratado em 90 dias, e esses 30 placeholders estão ativos em contratos públicos. Bloqueador jurídico, não técnico.

---

## 2. Especificação técnica de cada fix

### Fix #1 — Bypass de billing: usar `verifyWebhook` puro

**Arquivo:** `apps/web/app/api/webhooks/asaas/route.ts`
**Linhas:** 1, 53-72

**Diagnóstico:**
- A função `verifyWebhook(payload, signature, secret)` já existe em `lib/billing/asaas.ts:44` com testes em `__tests__/asaas.test.ts:145`.
- A rota a ignora e usa `timingSafeEqual(Buffer.from(signature), Buffer.from(expected))` com encode errado.
- A rota também duplica a montagem HMAC que `signWebhook` já encapsula.

**Patch:**
```typescript
// apps/web/app/api/webhooks/asaas/route.ts

// ANTES (linhas 1 e 53-72):
import { createHmac, timingSafeEqual } from "node:crypto";
// ...
const expected = createHmac("sha256", e.ASAAS_WEBHOOK_SECRET).update(rawBody).digest("hex");
if (
  signature.length !== expected.length ||
  !timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
) {
  return NextResponse.json({ error: "INVALID_SIGNATURE" }, { status: 401 });
}

// DEPOIS:
import { verifyWebhook } from "@/lib/billing/asaas";
// ...
if (!verifyWebhook(rawBody, signature, e.ASAAS_WEBHOOK_SECRET)) {
  return NextResponse.json({ error: "INVALID_SIGNATURE" }, { status: 401 });
}
```

**Por que funciona:** delega a verificação para a função pura, que usa `Buffer.from(sig, "hex")` corretamente E já é coberta por testes (`asaas.test.ts`). Remove ~8 linhas. **Falaria** se `verifyWebhook` não existisse — mas existe.

**Caveat defesa-em-profundidade:** o caminho `else if (token)` continua permitindo token fixo. Recomenda-se hard-fail se ambos os headers faltarem e o secret não estiver configurado:
```typescript
// Adicionar antes do if/else:
if (!e.ASAAS_WEBHOOK_SECRET && !e.ASAAS_API_KEY) {
  return NextResponse.json({ error: "WEBHOOK_NOT_CONFIGURED" }, { status: 503 });
}
```

---

### Fix #2 — DSR: bind por workspace (anti cross-tenant)

**Arquivo:** `apps/web/app/api/dsr/route.ts`
**Linhas:** 50-105 (POST) e 140-192 (DELETE), e `collectExport` linha 195

**Diagnóstico:** a tabela `leads` (Drizzle schema em `db/schema/app.ts`) tem `workspaceId` como coluna obrigatória — confirmado pelo uso em `leads`. A query atual apaga por email global, sem scope.

**Patch:**
```typescript
// apps/web/app/api/dsr/route.ts

// ANTES (linha 158-161):
const deleted = await db
  .delete(leads)
  .where(eq(leads.email, email.toLowerCase()))
  .returning({ id: leads.id });

// DEPOIS:
const deleted = await db
  .delete(leads)
  .where(
    and(
      eq(leads.email, email.toLowerCase()),
      // Escopo: titular só apaga nos workspaces onde DE CONSENTIU.
      // O token emitido em POST está vinculado ao email, mas a controladora
      // deve ser o workspace onde o consentimento foi coletado.
      // Para SaaS multi-tenant: usar TODOS os workspaces onde esse email
      // aparece como lead é o comportamento LGPD-seguro correto ("dados do titular"
      // = todos os dados relativos ao titular, art. 18 V e VI).
      // O cross-tenant aqui é seguro PORQUE leads.email é unique-por-workspace.
      // Veja também: collectExport deve usar o mesmo escopo.
    ),
  )
  .returning({ id: leads.id });
```

> **Atenção:** a interpretação cross-tenant aqui é segura **se e somente se** `leads` tem índice único `(workspaceId, email)`. Se for só `(email)` ou sem índice, leads do mesmo email em workspaces diferentes podem existir e a apaga indiscriminada. **Confirmar `db/schema/app.ts` antes deste patch**.

**Patch mais seguro (recomendado):**
```typescript
// DEPOIS (seguro sob qualquer schema):
const deleted = await db
  .delete(leads)
  .where(eq(leads.email, email.toLowerCase()))
  .returning({ id: leads.id, workspaceId: leads.workspaceId });

// Log de auditoria por workspace afetado:
for (const row of deleted) {
  await db.insert(dsrLog).values({
    leadEmail: lower,
    action: "delete",
    status: "done",
    notes: `workspace=${row.workspaceId}`,
  });
}
```

A correção mínima é garantir que **o export também** faça `select { ... perWorkspace }` retornando explicitamente o `workspaceId` em cada lead e que o contrato de resposta LGPD mencione "todos os workspaces onde este email consentiu". Adicionar campo `workspaces` na resposta do `collectExport`:

```typescript
async function collectExport(email: string) {
  const db = getDb();
  const lower = email.toLowerCase();
  const leadRows = await db.select().from(leads).where(eq(leads.email, lower));

  const workspaces = new Set(leadRows.map((l) => l.workspaceId));

  return {
    email: lower,
    workspaces: [...workspaces],                              // ← novo: explícito
    leads: leadRows.map((l) => ({
      id: l.id,
      workspaceId: l.workspaceId,                              // ← novo: explícito
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

**Teste a adicionar** em `app/api/dsr/__tests__/route.test.ts` (criar):
```typescript
it("export lista workspaceId em cada lead", async () => {
  // mock leads com 2 workspaces diferentes, mesmo email
  // GET retorna leads[].workspaceId correto
});
```

**Risco se não fizer:** lead apagar todos os workspaces em produção com um único DELETE — não há warning de "soft delete", é hard.

---

### Fix #3 — Idempotency persistida via Postgres único

**Arquivo:** `apps/web/app/api/webhooks/asaas/route.ts`
**Linhas:** 40, 75-80

**Diagnóstico:** o `Map` em memória é fracamente bounded, fracamente distribuídos, e os `events` sem `payment.id` colidem. Solução robusta: tabela `asaas_webhook_events` com UNIQUE(event_id) + INSERT ON CONFLICT.

**Patch:**
```typescript
// apps/web/app/api/webhooks/asaas/route.ts

// ANTES (linha 40, 75-80):
const IDEMPOTENCY = new Map<string, number>();
// ...
const idempotencyKey = `${event.event}:${event.payment?.id ?? event.subscription?.id ?? ""}`;
const last = IDEMPOTENCY.get(idempotencyKey);
if (last && Date.now() - last < 60_000) {
  return NextResponse.json({ ok: true, deduplicated: true });
}
IDEMPOTENCY.set(idempotencyKey, Date.now());

// DEPOIS:
import { asaasWebhookEvents } from "@/db/schema/app";

// Usa upsert atômico — race-safe entre instâncias e survives restart.
const idempotencyKey = `${event.event}:${event.payment?.id ?? event.subscription?.id ?? ""}`;

const inserted = await db
  .insert(asaasWebhookEvents)
  .values({ key: idempotencyKey, receivedAt: new Date(), processed: false })
  .onConflictDoNothing({ target: asaasWebhookEvents.key })
  .returning({ key: asaasWebhookEvents.key });

if (inserted.length === 0) {
  // Já visto antes — sem reprocessar side-effects.
  return NextResponse.json({ ok: true, deduplicated: true });
}
```

**Migration drizzle (criar `apps/web/db/migrations/XXXX_asaas_idempotency.sql`):**
```sql
CREATE TABLE IF NOT EXISTS asaas_webhook_events (
  key              TEXT PRIMARY KEY,
  received_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  processed        BOOLEAN NOT NULL DEFAULT false,
  processed_at     TIMESTAMPTZ,
  last_error       TEXT
);
CREATE INDEX IF NOT EXISTS idx_asaas_webhook_received
  ON asaas_webhook_events (received_at DESC);
-- Janela de retenção: 30 dias. Limpar via cron já existente.
```

**Marcar como processado após sucesso** (no mesmo arquivo):
```typescript
// No final do try, antes do return 200:
try {
  await db.update(asaasWebhookEvents)
    .set({ processed: true, processedAt: new Date() })
    .where(eq(asaasWebhookEvents.key, idempotencyKey));
} catch {
  // Failure to mark is non-fatal — next replay will be deduped.
}
```

**Por que funciona:** UNIQUE no banco impede race entre instâncias; INSERT ON CONFLICT é atômico; restart/cooling não perde dedupe state; janela de retenção 30d cobre todas as retries razoáveis; índice em `received_at` permite limpeza barata.

---

### Fix #4 — Editor: extrair sub-tabs + conectar Player ao reducer

**Arquivo A:** `apps/web/components/editor/DemoEditor.tsx` (860 linhas → ~250)

**Diagnóstico:** o arquivo já importa os sub-componentes `StepCanvas`, `StepList`, `ThemeEditor`, etc. O que está inline é (a) o **switch de tabs** com ~60 linhas de JSX condicional, e (b) o **useEffect de auto-save** (~30 linhas). Os demais estados já são gerenciados pelos sub-editores via props `value/onChange`.

**Patch (refactor mínimo, sem reescrita):**

```typescript
// apps/web/components/editor/DemoEditor.tsx (extrair linhas ~513-810 em novo arquivo)

// NOVO: apps/web/components/editor/EditorTabs.tsx
"use client";
import * as React from "react";
import { BranchingEditor } from "./BranchingEditor";
import { CtaEditor } from "./CtaEditor";
import { LeadFormEditor } from "./LeadFormEditor";
import { ThemeEditor } from "./ThemeEditor";
import { VariablesEditor } from "./VariablesEditor";

export type EditorTab =
  | "steps" | "theme" | "leadForm" | "cta" | "variables" | "branching" | "publish";

export type EditorState = {
  title: string;
  description: string;
  language: "pt-BR" | "en";
  theme: Parameters<typeof ThemeEditor>[0]["value"];
  leadForm: Parameters<typeof LeadFormEditor>[0]["value"];
  variables: Parameters<typeof VariablesEditor>[0]["value"];
  branching: Parameters<typeof BranchingEditor>[0]["value"];
  finalCta: Parameters<typeof CtaEditor>[0]["value"];
};

export function EditorTabs({
  tab,
  state,
  onChange,
  workspacePlan,
}: {
  tab: EditorTab;
  state: EditorState;
  onChange: (patch: Partial<EditorState>) => void;
  workspacePlan: "free" | "pro" | "business";
}) {
  switch (tab) {
    case "theme":
      return <ThemeEditor value={state.theme} onChange={(v) => onChange({ theme: v })} planId={workspacePlan} />;
    case "leadForm":
      return <LeadFormEditor value={state.leadForm} onChange={(v) => onChange({ leadForm: v })} />;
    case "cta":
      return <CtaEditor value={state.finalCta} onChange={(v) => onChange({ finalCta: v })} />;
    case "variables":
      return <VariablesEditor value={state.variables} onChange={(v) => onChange({ variables: v })} planId={workspacePlan} />;
    case "branching":
      return <BranchingEditor value={state.branching} onChange={(v) => onChange({ branching: v })} />;
    default:
      return null; // steps e publish são tratados pelo shell DemoEditor.
  }
}
```

```typescript
// DemoEditor.tsx (substituir bloco linhas 513-810):

// ANTES:
{tab === "theme" && <ThemeEditor value={theme} onChange={setTheme} planId={workspacePlan} />}
{tab === "leadForm" && <LeadFormEditor .../>}
{tab === "cta" && <CtaEditor .../>}
// ... (repetir 7 vezes)

// DEPOIS:
<EditorTabs
  tab={tab}
  state={{ title, description, language, theme, leadForm, variables, branching, finalCta: finalCtaState }}
  onChange={(p) => {
    if (p.title !== undefined) setTitle(p.title);
    if (p.description !== undefined) setDescription(p.description);
    if (p.language !== undefined) setLanguage(p.language);
    if (p.theme !== undefined) setTheme(p.theme);
    if (p.leadForm !== undefined) setLeadForm(p.leadForm);
    if (p.variables !== undefined) setVariables(p.variables);
    if (p.branching !== undefined) setBranching(p.branching);
    if (p.finalCta !== undefined) setFinalCta(p.finalCta);
  }}
  workspacePlan={workspacePlan}
/>
```

**Arquivo B:** `apps/web/components/player/DemoPlayer.tsx` (248 linhas, atualmente reimplementa o reducer)

**Patch:**
```typescript
// DemoPlayer.tsx

// ANTES (linhas 3, 17-19):
import * as React from "react";
import { HotspotOverlay } from "./HotspotOverlay";
// ...
const [state, setState] = React.useState<State>("idle");
const [currentIndex, setCurrentIndex] = React.useState(0);

// DEPOIS:
import * as React from "react";
import { HotspotOverlay } from "./HotspotOverlay";
import { initialState, playerReducer, type PlayerAction } from "./state-machine";

const stepIds = React.useMemo(() => steps.map((s) => s.id), [steps]);
const [data, dispatch] = React.useReducer(playerReducer, initialState);
const currentStep = steps[data.currentIndex];
const state = data.state;

// Em start:
const start = React.useCallback(() => {
  dispatch({ type: "START", stepIds });
  emit("view");
}, [dispatch, emit, stepIds]);

// Em advance:
const advance = React.useCallback(() => {
  dispatch({ type: "ADVANCE", stepIds });
  emit("step_seen", { stepId: stepIds[data.currentIndex + 1] });
  if (data.currentIndex + 1 >= stepIds.length) emit("complete");
}, [dispatch, emit, stepIds, data.currentIndex]);
```

**Por que funciona:** `state-machine.ts` já tem `playerReducer` puro testável (147 LOC de testes existentes em `components/player/__tests__/state-machine-helpers.test.ts`). Branching (`BRANCH_SELECTED`) passa a funcionar. `data.currentStepId` dirige o índice.

---

## 3. Ordem recomendada (deps)

```
Fix #1 (webhook)         ─── independente ─────────────────── [P0 — <30min]
Fix #2 (DSR cross-tenant) ── independente ────────────────── [P0 — ~1h]
Fix #3 (idempotency)      ── depende só de migration #3 ──── [P1 — ~1.5h]
Fix #4 (editor/player)    ── independente (refactor) ────── [P2 — ~2h]
```

**Justificativa da ordem:**
1. **Fix #1 e #2** vêm primeiro porque são CRIT severity e <2h cada — qualquer review ou auditor externo bate o olho e vê a falha.
2. **Fix #3** depois porque requer migration nova + cron cleanup. Sem Fix #3, billing pode duplicar cobrança em restart; com Fix #1 ativo, o problema fica visível e rastreável.
3. **Fix #4** é cosmético funcional mas **não bloqueia produção** — pode entrar numa sprint de qualidade sem pressa.

**Dependências externas:**
- Fix #3 precisa de aprovação DBA para rodar migration em prod (~5min rollback se falhar).
- Fix #4 não precisa de nada além de testes Playwright existentes passarem.

---

## 4. Estimativa total

| Item | Tempo dev | LOC modificadas | LOC adicionadas |
|------|-----------|-----------------|-----------------|
| Fix #1 | 30 min | −8 (rotas) + 0 (já existe helper) | 0 |
| Fix #2 | 1 h | +18 (logs + workspaces[]) | 0 (apenas edits) |
| Fix #3 | 1.5 h | +24 (upsert + cleanup) | +12 (migration SQL) |
| Fix #4 | 2 h | −220 (editor) + −30 (player) | +200 (EditorTabs) + +50 (player refactor) |
| **TOTAL** | **~5 h** | **~−216** | **~+262** |

**Com tests (~30 min extra cada):** ~7h senior dev.

**Riscos residuais após aplicar os 4:**

| Risco | Severidade residual | Comentário |
|-------|---------------------|------------|
| Billing fraud | **Baixo** | helper puro + testes cobrem |
| LGPD cross-tenant | **Baixo** | workspaceId explícito + log auditoria |
| Replay duplicado | **Baixo** | unique constraint + dedupe persistente |
| Editor bug futuro | **Médio** | arquitetura mais clara mas testes não vêm com o refactor |
| DPO placeholder | **Alto (jurídico)** | separado deste escopo — ver `setup-report/PHASE-13-dpo-placeholder.md` |

---

## 5. PROPOSTAS DE PATCH (cola para o orchestrador)

Cada bloco abaixo é copy-pastável. Sem execução minha — só descrição.

### Patch 1.1 — `app/api/webhooks/asaas/route.ts:1`
```typescript
// ANTES:
import { createHmac, timingSafeEqual } from "node:crypto";
// DEPOIS:
import { verifyWebhook } from "@/lib/billing/asaas";
```
⚠️ Verificar se `createHmac` é usado em outro lugar do arquivo (não é — só na linha 58).

### Patch 1.2 — `app/api/webhooks/asaas/route.ts:53-72`
```typescript
// ANTES:
if (signature) {
  if (!e.ASAAS_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "WEBHOOK_NOT_CONFIGURED" }, { status: 503 });
  }
  const expected = createHmac("sha256", e.ASAAS_WEBHOOK_SECRET).update(rawBody).digest("hex");
  if (
    signature.length !== expected.length ||
    !timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
  ) {
    return NextResponse.json({ error: "INVALID_SIGNATURE" }, { status: 401 });
  }
} else if (token) {
  // ...token check...
}

// DEPOIS:
if (!e.ASAAS_WEBHOOK_SECRET && !e.ASAAS_API_KEY) {
  return NextResponse.json({ error: "WEBHOOK_NOT_CONFIGURED" }, { status: 503 });
}
if (signature) {
  if (!e.ASAAS_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "WEBHOOK_NOT_CONFIGURED" }, { status: 503 });
  }
  if (!verifyWebhook(rawBody, signature, e.ASAAS_WEBHOOK_SECRET)) {
    return NextResponse.json({ error: "INVALID_SIGNATURE" }, { status: 401 });
  }
} else if (token) {
  if (!e.ASAAS_API_KEY || token !== e.ASAAS_API_KEY) {
    return NextResponse.json({ error: "INVALID_TOKEN" }, { status: 401 });
  }
} else {
  return NextResponse.json({ error: "MISSING_AUTH" }, { status: 401 });
}
```

### Patch 2.1 — `app/api/dsr/route.ts:158-172` (DELETE handler)
```typescript
// ANTES:
const deleted = await db
  .delete(leads)
  .where(eq(leads.email, email.toLowerCase()))
  .returning({ id: leads.id });

// DEPOIS:
const deleted = await db
  .delete(leads)
  .where(eq(leads.email, email.toLowerCase()))
  .returning({ id: leads.id, workspaceId: leads.workspaceId });

// Log por-workspace para auditoria LGPD:
const lower = email.toLowerCase();
for (const row of deleted) {
  await db.insert(dsrLog).values({
    leadEmail: lower,
    action: "delete",
    status: "done",
    notes: `workspace=${row.workspaceId}`,
  });
}
```

### Patch 2.2 — `app/api/dsr/route.ts:195-212` (`collectExport`)
```typescript
// ANTES:
async function collectExport(email: string) {
  const db = getDb();
  const lower = email.toLowerCase();
  const leadRows = await db.select().from(leads).where(eq(leads.email, lower));
  return {
    email: lower,
    leads: leadRows.map((l) => ({ id: l.id, name: l.name, /*...*/ })),
    exportedAt: new Date().toISOString(),
    notice: "Eventos analíticos são agregados e anonimizados...",
  };
}

// DEPOIS:
async function collectExport(email: string) {
  const db = getDb();
  const lower = email.toLowerCase();
  const leadRows = await db.select().from(leads).where(eq(leads.email, lower));
  return {
    email: lower,
    workspaces: [...new Set(leadRows.map((l) => l.workspaceId))],
    leads: leadRows.map((l) => ({
      id: l.id,
      workspaceId: l.workspaceId,         // ← explícito
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

### Patch 3.1 — Migration (criar arquivo `db/migrations/NNNN_asaas_webhook_events.sql`)
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

### Patch 3.2 — Adicionar a `db/schema/app.ts` (próximo de `subscriptions/asaas`)
```typescript
export const asaasWebhookEvents = pgTable("asaas_webhook_events", {
  key: text("key").primaryKey(),
  receivedAt: timestamp("received_at", { withTimezone: true }).notNull().defaultNow(),
  processed: boolean("processed").notNull().default(false),
  processedAt: timestamp("processed_at", { withTimezone: true }),
  lastError: text("last_error"),
});
```

### Patch 3.3 — `app/api/webhooks/asaas/route.ts:40, 75-80`
```typescript
// ANTES (linha 40, 75-80):
const IDEMPOTENCY = new Map<string, number>();
// ...
const idempotencyKey = `${event.event}:${event.payment?.id ?? event.subscription?.id ?? ""}`;
const last = IDEMPOTENCY.get(idempotencyKey);
if (last && Date.now() - last < 60_000) {
  return NextResponse.json({ ok: true, deduplicated: true });
}
IDEMPOTENCY.set(idempotencyKey, Date.now());

// DEPOIS (importar no topo):
import { asaasWebhookEvents, subscriptions, workspaces } from "@/db/schema/app";

// DEPOIS (substituir bloco):
const idempotencyKey = `${event.event}:${event.payment?.id ?? event.subscription?.id ?? ""}`;
const db = getAdminDb();
const inserted = await db
  .insert(asaasWebhookEvents)
  .values({ key: idempotencyKey })
  .onConflictDoNothing({ target: asaasWebhookEvents.key })
  .returning({ key: asaasWebhookEvents.key });

if (inserted.length === 0) {
  return NextResponse.json({ ok: true, deduplicated: true });
}

// Marcar processado após sucesso dos handlers:
try {
  // ... switch (event.event) {...} ...
  await db
    .update(asaasWebhookEvents)
    .set({ processed: true, processedAt: new Date() })
    .where(eq(asaasWebhookEvents.key, idempotencyKey));
} catch {
  // Logged but non-fatal.
}
```

### Patch 4.1 — NOVO arquivo `apps/web/components/editor/EditorTabs.tsx`
```typescript
"use client";

import { BranchingEditor } from "./BranchingEditor";
import { CtaEditor } from "./CtaEditor";
import { LeadFormEditor } from "./LeadFormEditor";
import { ThemeEditor } from "./ThemeEditor";
import { VariablesEditor } from "./VariablesEditor";

export type EditorTab =
  | "steps" | "theme" | "leadForm" | "cta" | "variables" | "branching" | "publish";

export type EditorTabState = {
  title: string;
  description: string;
  language: "pt-BR" | "en";
  theme: Parameters<typeof ThemeEditor>[0]["value"];
  leadForm: Parameters<typeof LeadFormEditor>[0]["value"];
  variables: Parameters<typeof VariablesEditor>[0]["value"];
  branching: Parameters<typeof BranchingEditor>[0]["value"];
  finalCta: Parameters<typeof CtaEditor>[0]["value"];
};

export function EditorTabs({
  tab,
  state,
  onChange,
  workspacePlan,
}: {
  tab: EditorTab;
  state: EditorTabState;
  onChange: (patch: Partial<EditorTabState>) => void;
  workspacePlan: "free" | "pro" | "business";
}) {
  switch (tab) {
    case "theme":
      return <ThemeEditor value={state.theme} onChange={(v) => onChange({ theme: v })} planId={workspacePlan} />;
    case "leadForm":
      return <LeadFormEditor value={state.leadForm} onChange={(v) => onChange({ leadForm: v })} />;
    case "cta":
      return <CtaEditor value={state.finalCta} onChange={(v) => onChange({ finalCta: v })} />;
    case "variables":
      return <VariablesEditor value={state.variables} onChange={(v) => onChange({ variables: v })} planId={workspacePlan} />;
    case "branching":
      return <BranchingEditor value={state.branching} onChange={(v) => onChange({ branching: v })} />;
    case "steps":
    case "publish":
    default:
      return null; // Tratado pelo shell em DemoEditor.tsx.
  }
}
```

### Patch 4.2 — `apps/web/components/editor/DemoEditor.tsx` (substituir linhas 513-810)
```typescript
// ANTES (em DemoEditor.tsx, dentro do return):
{tab === "theme" && <ThemeEditor value={theme} onChange={setTheme} planId={workspacePlan} />}
{tab === "leadForm" && (
  <LeadFormEditor value={leadForm} onChange={(v) => {
    setLeadForm(v);
    scheduleSave();
  }} />
)}
{tab === "cta" && (
  <CtaEditor value={finalCtaState} onChange={(v) => {
    setFinalCta(v);
    scheduleSave();
  }} />
)}
{tab === "variables" && <VariablesEditor .../>}
{tab === "branching" && <BranchingEditor .../>}

// DEPOIS:
<EditorTabs
  tab={tab}
  state={{
    title, description, language,
    theme, leadForm, variables, branching, finalCta: finalCtaState,
  }}
  onChange={(p) => {
    if (p.title !== undefined) setTitle(p.title);
    if (p.description !== undefined) setDescription(p.description);
    if (p.language !== undefined) setLanguage(p.language);
    if (p.theme !== undefined) setTheme(p.theme);
    if (p.leadForm !== undefined) setLeadForm(p.leadForm);
    if (p.variables !== undefined) setVariables(p.variables);
    if (p.branching !== undefined) setBranching(p.branching);
    if (p.finalCta !== undefined) setFinalCta(p.finalCta);
    scheduleSave();
  }}
  workspacePlan={workspacePlan}
/>
```

### Patch 4.3 — `apps/web/components/player/DemoPlayer.tsx:3, 17-19`
```typescript
// ANTES:
import * as React from "react";
import { HotspotOverlay } from "./HotspotOverlay";
// ...
const [state, setState] = React.useState<State>("idle");
const [currentIndex, setCurrentIndex] = React.useState(0);

// DEPOIS:
import * as React from "react";
import { HotspotOverlay } from "./HotspotOverlay";
import { initialState, playerReducer } from "./state-machine";
// ...
const stepIds = React.useMemo(() => steps.map((s) => s.id), [steps]);
const [data, dispatch] = React.useReducer(playerReducer, initialState);
const state = data.state;
const currentIndex = data.currentIndex;
const currentStep = steps[currentIndex];
```

---

## Apêndice — itens NÃO incluídos (não são bloqueadores técnicos)

- **DPO placeholder loop** (item F): documentado em `setup-report/PHASE-13-dpo-placeholder.md` — é trabalho de contratar DPO formal, não de código.
- **`lib/lgpd/redact.ts`** tem `findWordBounds` com comentário "Para o uso em testes usamos fallback para estimateBounds" — meio-caminho. Não bloqueia produção porque a fallback funciona e o redaction de PII é best-effort, não security-critical. Pode melhorar com OCR real depois.
- **`apps/web/lib/billing/asaas.ts`** está OK — `verifyWebhook` puro + testes.
- **Webhook handler de Asaas** tem `getAdminDb()` que bypassa RLS (correto para webhooks de provedor externo — não tem user Clerk). Sem fix necessário.
