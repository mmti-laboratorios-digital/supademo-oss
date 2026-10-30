# PHASE 12 — Asaas sandbox local + test e2e do webhook

> Status: ✅ mock server standalone · ✅ integration test (9/9 pass) · ✅ smoke script · ✅ doc

## TL;DR

Sem API key do Asaas sandbox oficial, criamos um **mock server local** que
imita o subset da API Asaas v3 que este projeto consome, e um
**integration test** que sobe o mock via `vitest globalSetup`, cria
fixtures pelo wrapper `lib/asaas.ts` (redirect via `vi.mock`, sem editar
o arquivo) e dispara webhooks contra o handler real. **9 testes verdes**.

| Arquivo | Função |
|---|---|
| `apps/web/scripts/mock-asaas.ts` | Mock server (porta 65500) + `startMockAsaas()` exportável |
| `apps/web/vitest.globalSetup.ts` | Sobe/desliga o mock antes/depois do run de tests |
| `apps/web/vitest.config.ts` | Wireado no `globalSetup` do vitest |
| `apps/web/app/api/__tests__/webhook-asaas.sandbox.integration.test.ts` | 9 testes cobrindo auth, idempotência, 4 eventos Asaas |
| `packages/shared/src/test-utils/asaas-payloads.ts` | Faker de webhook + HMAC signer (reutilizável) |
| `apps/web/scripts/fire-asaas-webhook.ts` | Smoke script manual contra o app real |

## Por que um mock local?

- Não temos `ASAAS_API_KEY` do sandbox oficial — bloqueador para qualquer
  test que toque a API real.
- O Asaas sandbox exige cadastro + sandbox separado por conta. Setup
  demorado para um ROI pequeno em test interno.
- Nosso handler já tem um contrato pequeno (`PAYMENT_RECEIVED/OVERDUE/REFUNDED/
  SUBSCRIPTION_INACTIVATED` + idempotência + HMAC). Mock cobre 100% desse
  contrato com fidelidade ao schema real.
- Mock não envia webhooks — o test dispara manualmente, o que dá controle
  total sobre ordem, timing e casos de borda (HMAC inválido, evento
  repetido, etc.).

## Cobertura de eventos Asaas

| Evento | Status no handler | Coberto pelo sandbox test? |
|---|---|---|
| `PAYMENT_RECEIVED` | `handlePaymentConfirmed` → status=`active` | ✅ happy path + idempotência |
| `PAYMENT_OVERDUE` | `handlePaymentOverdue` → status=`past_due` | ✅ |
| `PAYMENT_REFUNDED` | `handlePaymentRefunded` → status=`canceled`, workspace→`free` | ✅ |
| `SUBSCRIPTION_INACTIVATED` | `handleSubscriptionDeleted` → status=`canceled`, workspace→`free` | ✅ |
| `PAYMENT_CONFIRMED` | mesmo handler de `PAYMENT_RECEIVED` | ⚠️ implícito (mesmo switch case) |
| `PAYMENT_DELETED` | sem case → noop | ⚠️ implícito (handler aceita e ignora) |
| `SUBSCRIPTION_CREATED` / `UPDATED` | `handleSubscriptionUpdated` | ⚠️ exercitado indiretamente via faker |
| `SUBSCRIPTION_DELETED` | `handleSubscriptionDeleted` | ⚠️ implícito (mesmo handler de `_INACTIVATED`) |

Se quiser cobertura explícita de cada evento, é só adicionar um
`it()` block usando `asaasWebhookPayload({ event: "PAYMENT_DELETED" })` —
o faker já trata todos os 9 eventos.

## Como subir o mock (standalone)

```bash
cd apps/web
pnpm exec tsx scripts/mock-asaas.ts
# [mock-asaas] ✓ listening on http://127.0.0.1:65500
# [mock-asaas] ready — POST /v3/customers, /v3/subscriptions, /v3/payments
```

Endpoints disponíveis:

```
POST   /v3/customers          → 201 + { id, name, ... }
POST   /v3/subscriptions      → 201 + { id, status: "ACTIVE", billingType, cycle, ... }
POST   /v3/payments           → 201 + { id, status: "PENDING", invoiceUrl, pixQrCodeId (PIX), bankSlipUrl (BOLETO) }
GET    /v3/subscriptions/:id  → 200 (404 se não existe)
DELETE /v3/subscriptions/:id  → 200 (status vira INACTIVE)
```

Todos billing types são aceitos: `CREDIT_CARD | PIX | BOLETO`.

Env override:

```bash
PORT=65501 pnpm exec tsx scripts/mock-asaas.ts
# ou
MOCK_ASAAS_PORT=65501 pnpm exec tsx scripts/mock-asaas.ts
```

## Como rodar o integration test

O mock é levantado **automaticamente** via `vitest.globalSetup.ts` —
não precisa subir manualmente.

```bash
cd apps/web
pnpm exec vitest run app/api/__tests__/webhook-asaas.sandbox.integration.test.ts --reporter=verbose
```

Saída esperada:

```
✓ Asaas mock server > responds on MOCK_ASAAS_URL
✓ Asaas mock server > creates subscription via wrapper for all billing types
✓ /api/webhooks/asaas — auth > sem header → 401 MISSING_AUTH
✓ /api/webhooks/asaas — auth > assinatura HMAC inválida → 401 INVALID_SIGNATURE
✓ /api/webhooks/asaas — PAYMENT_RECEIVED > happy path → 200, status=active, workspace.planId=pro
✓ /api/webhooks/asaas — PAYMENT_RECEIVED > mesmo event_id 2x → 2ª chamada vem deduplicated=true
✓ /api/webhooks/asaas — PAYMENT_OVERDUE > → subscription.status muda para past_due
✓ /api/webhooks/asaas — PAYMENT_REFUNDED > → subscription.status=canceled, cancelAtPeriodEnd=true, workspace.planId=free
✓ /api/webhooks/asaas — SUBSCRIPTION_INACTIVATED > → subscription.status=canceled, workspace.planId=free

Test Files  1 passed (1)
     Tests  9 passed (9)
```

Pré-requisitos:
- Container postgres `supademo-test` rodando em `127.0.0.1:55432`
- `apps/web/.env.test` ou `/.env.test` no repo root com
  `DATABASE_URL=postgres://app_user:easydemo@127.0.0.1:55432/supademo`
  + `ASAAS_WEBHOOK_SECRET=...`

Smoke (subir mock + rodar test + cleanup) — equivalente ao que o CI faria:

```bash
cd /home/dan/saas/supademo-oss
tsx apps/web/scripts/mock-asaas.ts &
MOCK_PID=$!
sleep 2

cd apps/web
pnpm exec vitest run webhook-asaas.sandbox --reporter=verbose
TEST_RC=$?

kill $MOCK_PID 2>/dev/null
wait $MOCK_PID 2>/dev/null
exit $TEST_RC
```

## Como disparar webhook manual (smoke contra app real)

```bash
# 1) Subir mock (em outro terminal)
cd apps/web && pnpm exec tsx scripts/mock-asaas.ts

# 2) Subir app Next.js (em outro terminal)
cd apps/web && pnpm dev

# 3) Disparar webhook
cd apps/web
pnpm exec tsx scripts/fire-asaas-webhook.ts PAYMENT_RECEIVED
# ▶ Target: http://localhost:3000/api/webhooks/asaas
#   event:    PAYMENT_RECEIVED
#   sub:      sub_sandbox_default
#   sig:      cd815da37a30a996…
# ◀ status:  200
# ◀ body:    {"ok":true}

# Outros eventos:
EVENT=PAYMENT_OVERDUE pnpm exec tsx scripts/fire-asaas-webhook.ts
EVENT=PAYMENT_REFUNDED pnpm exec tsx scripts/fire-asaas-webhook.ts
EVENT=SUBSCRIPTION_INACTIVATED pnpm exec tsx scripts/fire-asaas-webhook.ts

# Com subscription específica:
SUBSCRIPTION_ID=asaas_sub_xxx CUSTOMER_ID=cus_xxx \
  pnpm exec tsx scripts/fire-asaas-webhook.ts PAYMENT_RECEIVED
```

## Arquitetura do mock

O mock é um **HTTP server standalone** (`node:http` puro) com:

- **In-memory store** (3 Maps: customers / subscriptions / payments)
- **Schema fiel ao Asaas v3** para o subset que usamos
- **Validation** dos campos obrigatórios + billingType whitelist
- **Cross-reference checks** (subscription precisa de customer existente)
- **CORS permissive** (só local dev)
- **Dual mode**: importável como lib (`startMockAsaas()`) ou executável
  direto (`tsx scripts/mock-asaas.ts`)

Quando `import.meta.url === file://${process.argv[1]}` o módulo se
auto-executa como CLI — caso contrário, só expõe as funções para o
test harness.

## Como `lib/asaas.ts` fala com o mock (sem editar o wrapper)

O wrapper `apps/web/lib/asaas.ts` usa a constante `BASE = { sandbox:
'https://sandbox.asaas.com/api/v3', ... }` — o mock não pode mexer
nisso sem editar o arquivo. Solução: **o test usa `vi.mock("@/lib/asaas")`
para redirecionar as funções wrapper para o mock**:

```ts
vi.mock("@/lib/asaas", async () => {
  const real = await vi.importActual<typeof import("@/lib/asaas")>("@/lib/asaas");
  async function mockAsaas<T>(path: string, init: RequestInit = {}) {
    const res = await fetch(`${MOCK_ASAAS_URL}${path}`, ...);
    return res.json() as T;
  }
  return {
    ...real,           // preserva types + verifyWebhookSignature
    createCustomer:    (a) => mockAsaas("/v3/customers", { ... }),
    createSubscription:(a) => mockAsaas("/v3/subscriptions", { ... }),
    getSubscription:   (id) => mockAsaas(`/v3/subscriptions/${id}`),
    cancelSubscription: async (id) => mockAsaas(`/v3/subscriptions/${id}`, { method: "DELETE" }),
  };
});
```

Resultado: o handler chama `createCustomer(...)` exatamente como em prod,
mas a implementação interna bate em `127.0.0.1:65500`. **Zero edits em
`lib/asaas.ts`.**

## Faker de payloads (test-utils)

`packages/shared/src/test-utils/asaas-payloads.ts` exporta:

```ts
asaasWebhookPayload({ event, subscriptionId, customerId, paymentId?, billingType?, value? })
// → { event, payment?, subscription? } matching the route handler's shape

asaasWebhookSignature(rawBody, secret)
// → HMAC-SHA256 hex

asaasSignedBody(opts, secret)
// → { rawBody, signature } convenience
```

Reutilizável por qualquer test (atual ou futuro) que precise disparar
webhook Asaas válido.

## Próximos passos (opcionais)

- Adicionar testes para `PAYMENT_CONFIRMED` e `PAYMENT_DELETED` (1 linha
  cada — copy/adapt dos blocos existentes).
- Subir o mock via docker-compose (atualmente é só Node http) — útil se
  o CI não tiver Node disponível.
- Adicionar stress test (1000 webhooks paralelos) para validar a
  idempotência in-memory Map (`IDEMPOTENCY`) sob carga.