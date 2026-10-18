# Pagamentos Brasil — Asaas, Mercado Pago, Pagar.me, Stripe

> Pesquisa sobre gateways brasileiros para SaaS recorrente (PIX/boleto/cartão recorrente), LGPD em webhooks e quando Stripe direto faz sentido.

---

## 1. Comparativo geral

| Gateway | PIX recorrente | Boleto | Cartão recorrente | Webhooks | SDK Node | Custo PIX | Custo cartão | API DX |
|---------|--------------|--------|-------------------|----------|----------|-----------|--------------|--------|
| **Asaas** | ✅ (recurring pix nativo) | ✅ | ✅ (subscriptions) | ✅ maduro | ✅ SDK oficial + REST | ~R$ 0,50-1,50 fixo + 0%? | ~R$ 0,49 + 1,99% | Boa (PT-BR, simples) |
| **Mercado Pago** | ✅ (recurring via Subscriptions API) | ✅ | ✅ | ✅ | ✅ SDK Node | 1,19% | 3,99% + 0,39 | Média (muda muito) |
| **Pagar.me** (Stone) | ✅ | ✅ | ✅ | ✅ | ✅ REST + SDK | ~0,99% | 2,99% ou 3,99% parcelado | Boa |
| **InfinitePay** | ✅ | ✅ | ✅ | ✅ | ✅ | grátis primeira tx | taxa flat | Boa |
| **Stripe Brasil** | ⚠️ (Stripe tem Pix Automático desde abr/2026, mas Asaas/Mercado Pago são mais maduros) | ✅ | ✅ | ✅ best-in-class | ✅ best | 1,19% | 3,99% + 0,39 | **Melhor DX do mercado** |

**Fontes principais:**
- Asaas Subscriptions: <https://docs.asaas.com/docs/subscriptions>
- Asaas Subscriptions via cartão: <https://docs.asaas.com/docs/subscriptions-via-credit-card>
- Asaas Pricing: <https://www.asaas.com/precos-e-taxas>
- Asaas Checkout Subscription: <https://docs.asaas.com/docs/checkout-com-assinatura-recorrente>
- Mercado Pago Subscriptions: <https://www.mercadopago.com.br/developers/en/reference/online-payments/subscriptions/overview>
- Stripe Brasil: <https://support.stripe.com/questions/accepted-payment-methods-in-brazil>
- Stripe BR options analisadas: <https://www.andersdev.com.br/blog/stripe-brasil-pagamento-internacional-saas>

---

## 2. Asaas — escolha recomendada

### 2.1 Por que Asaas para SaaS B2B pequeno no Brasil

1. **PIX recorrente nativo** — não precisa de gambiarra. Pix Automático virou padrão BACEN em 2025; Asaas já integra.
2. **Boleto e cartão** na mesma API de Subscription.
3. **Subscriptions endpoint dedicado** — `POST /v3/subscriptions` aceita `cycle` (WEEKLY/BIWEEKLY/MONTHLY/QUARTERLY/SEMIANNUALLY/YEARLY), `billingType` (BOLETO/CREDIT_CARD/PIX), `nextDueDate`, `value`.
4. **Webhooks estáveis** — eventos de `subscription` e `payment` bem definidos.
5. **Sandbox** — Asaas tem ambiente de teste (URL `sandbox.asaas.com`).
6. **Custo competitivo** — taxa PIX é uma das menores do mercado; cartão recorrente ~R$ 0,49 + 1,99%.

### 2.2 Criando uma subscription

```bash
POST https://api.asaas.com/v3/subscriptions
Authorization: Bearer $ASAAS_API_KEY
Content-Type: application/json

{
  "customer": "cus_0T1mdomVMi39",
  "billingType": "CREDIT_CARD",
  "nextDueDate": "2027-01-15",
  "value": 49.90,
  "cycle": "MONTHLY",
  "description": "Plano Pro - DemoBR"
}
```

Retorno:
```json
{
  "id": "sub_VXJBYgP2u0eO",
  "status": "ACTIVE",
  "cycle": "MONTHLY",
  ...
}
```

Armazenamos `sub_VXJBYgP2u0eO` como `externalId` na tabela `subscriptions` do nosso DB.

### 2.3 Fluxo recomendado

```
┌────────────────┐     ┌─────────────────────┐     ┌─────────────┐
│ User clica     │ ──> │ API nossa: cria     │ ──> │ Asaas:      │
│ "Subscribe"    │     │ customer + sub      │     │ subscription│
└────────────────┘     └─────────────────────┘     └──────┬──────┘
                                                          │
                                                          ▼  webhook
                                                   ┌─────────────────────┐
                                                   │ API nossa: atualiza │
                                                   │ subscriptions.status│
                                                   └─────────────────────┘
```

1. Usuário escolhe plano → POST `/api/v1/billing/subscribe` com `planId + paymentMethod`.
2. Backend cria (ou encontra) `customer` no Asaas.
3. Backend cria `subscription` no Asaas.
4. Se `billingType=CREDIT_CARD`, redireciona para **Asaas Checkout** ou coleta via iframe transparente.
5. Se `PIX` ou `BOLETO`, gera o primeiro pagamento (`POST /v3/payments`) e retorna QR/código.
6. Asaas envia webhooks: `PAYMENT_RECEIVED`, `PAYMENT_OVERDUE`, `SUBSCRIPTION_INACTIVATED`, etc.
7. Backend atualiza `subscriptions.status` e concede/bloqueia acesso.

### 2.4 Webhooks (essencial para LGPD/confiabilidade)

Asaas envia POST com eventos:

- `PAYMENT_CREATED`, `PAYMENT_AWAITING_RISK_ANALYSIS`, `PAYMENT_APPROVED_BY_RISK_ANALYSIS`, `PAYMENT_REPROVED_BY_RISK_ANALYSIS`
- `PAYMENT_CONFIRMED`, `PAYMENT_RECEIVED`, `PAYMENT_OVERDUE`, `PAYMENT_REFUNDED`, `PAYMENT_DELETED`
- `SUBSCRIPTION_CREATED`, `SUBSCRIPTION_UPDATED`, `SUBSCRIPTION_INACTIVATED`, `SUBSCRIPTION_DELETED`

Endpoint nosso: `/api/v1/webhooks/asaas`.

```ts
// app/api/v1/webhooks/asaas/route.ts
import crypto from 'node:crypto';
import { db } from '@/lib/db';

export async function POST(req: Request) {
  const raw = await req.text();
  const signature = req.headers.get('asaas-access-token');

  // Asaas usa um access token compartilhado por header (configurado no painel)
  if (signature !== process.env.ASAAS_WEBHOOK_TOKEN) {
    return new Response('Unauthorized', { status: 401 });
  }

  const body = JSON.parse(raw);
  const { event, payment, subscription } = body;

  // Idempotência via evento.id
  await db.insert(webhookEvents).values({
    provider: 'asaas',
    externalId: body.id,
    type: event,
    payload: body,
    receivedAt: new Date(),
  }).onConflictDoNothing();

  if (event === 'PAYMENT_RECEIVED' && payment.subscription) {
    await db.update(subscriptions)
      .set({ status: 'active', currentPeriodEnd: addMonths(new Date(), 1) })
      .where(eq(subscriptions.externalId, payment.subscription));
  }

  if (event === 'PAYMENT_OVERDUE' && payment.subscription) {
    await db.update(subscriptions)
      .set({ status: 'past_due' })
      .where(eq(subscriptions.externalId, payment.subscription));
  }

  return new Response('OK', { status: 200 });
}
```

**Importante:** responder 200 rápido (< 5s); processar assincronamente via `graphile-worker` se precisar.

### 2.5 SDK Node.js oficial

`npm install asaas-sdk` (community) ou usar `fetch` direto (oficial não tem SDK Node mantido; time costuma usar REST). Para DX, criar wrapper interno:

```ts
// lib/asaas.ts
const ASAAS_API = process.env.ASAAS_ENV === 'production'
  ? 'https://api.asaas.com/v3'
  : 'https://sandbox.asaas.com/v3';

export const asaas = {
  async createCustomer(data: CustomerInput) { /* ... */ },
  async createSubscription(data: SubscriptionInput) { /* ... */ },
  async cancelSubscription(id: string) { /* ... */ },
  async listPayments(customerId: string) { /* ... */ },
};
```

---

## 3. Mercado Pago — alternativa

### 3.1 Quando usar

- Seus clientes já têm conta Mercado Pago e preferem pagar ali (parcelado sem juros em até 12x com a conta certa).
- Marketplace / Split payments (Connect é mais robusto no MP que Asaas).
- Lead com confiança em "marca conhecida" — MP tem brand awareness forte no varejo BR.

### 3.2 API Subscriptions

Endpoints principais:
- `POST /preapproval` — cria subscription
- `GET /preapproval/{id}` — consulta
- `PUT /preapproval/{id}` — atualiza
- `POST /preapproval/{id}/cancel` — cancela

**Filtros de billingType suportados:**
- `credit_card`, `debit_card` (não recorrente)
- `account_money` (saldo MP)

**Recurring plans:**
- "Recurring payments with scheduling" — Subscriptions API.
- Disponível em BR, AR, CL, CO, MX, PE, UY.

**Webhooks (IPN):** precisa configurar URL no painel MP e tipo de notificação `subscription_preapproval`.

### 3.3 Custo (BR)

- PIX: 1,19% por transação
- Cartão nacional: 3,99% + R$ 0,39
- Cartão internacional: +2% (varia)
- Boleto: R$ 3,45 pago

### 3.4 Decisão

**Mais caro que Asaas para PIX.** Mais barato para **parcelado sem juros** em cartão (modelo BR). Se a persona do SaaS é MEI/PME que paga à vista via PIX, Asaas ganha. Se a persona é enterprise que precisa de split/Connect, MP ganha.

---

## 4. Pagar.me (Stone) — alternativa sólida

- Backed by Stone (banco forte).
- API moderna, documentação clara.
- Suporta PIX, boleto, cartão recorrente.
- Taxas competitivas.
- **Indicado** se quisermos uma alternativa "neutra" sem lock-in em MP.
- **Cuidado:** Stone pode aprovar clientes com análise mais rígida (CNPJ ativo, faturamento mínimo).

---

## 5. InfinitePay — opção para solo / pequenos

- Maquininha + link de pagamento + API.
- Taxa flat, sem mensalidade.
- Ideal para infoprodutores.
- Para SaaS recorrente, falta robustez na API de subscription — **não recomendado** para nosso caso.

---

## 6. Stripe direto — quando vale a pena

### 6.1 Vantagens

- DX #1 do mundo: webhooks idempotentes via `Stripe-Signature` header, eventos tipados, dashboard lindo.
- Stripe Billing maduro: proration, upgrade/downgrade, dunning automático, customer portal self-service.
- Stripe Connect para marketplaces (split payments nativo cross-border).
- Stripe Tax para cálculo automático de imposto (se necessário).
- Multi-moeda fácil (BRL + USD + EUR simultâneo).

### 6.2 Limitações no Brasil

- **PIX recorrente limitado:** Pix Automático só foi GA em abril/2026 e ainda em rollout.
- **Boleto:** suportado.
- **Cartão:** Visa + Mastercard. **Não suporta Elo, Hipercard, AVS** (cartões populares no varejo BR).
- **Parcelado brasileiro (Nx sem juros):** limitado ou ausente — confirmação de fontes como <https://www.fastpaybrasil.com/pt/comparativos/fastpay-vs-stripe> indicam "limitado".
- **Stripe Dashboard UI:** em inglês, alguns clientes BR reclamam.
- **Onboarding PJ via "Atlas"** mais lento que Asaas.

**Fonte:** <https://support.stripe.com/questions/accepted-payment-methods-in-brazil>

### 6.3 Quando Stripe vale a pena

- **Cliente final é internacional** (Stripe BR aceita pagamento de clientes do mundo todo).
- **Já está na stack** (Next.js + Vercel + Stripe é combo clássico).
- **SaaS multi-região** (cobrar em USD/EUR + BRL simultaneamente).
- **Quer Stripe Billing features** (proration, customer portal, dunning sofisticado) que Asaas não tem.

### 6.4 Decisão para nosso SaaS

**Primeiro mercado:** BR-only, persona PMEs e times de marketing B2B pagando em BRL via PIX principalmente. **Asaas é a melhor escolha.**

**Roadmap:** adicionar Stripe como gateway secundário para clientes internacionais (Fase 2).

---

## 7. LGPD em webhooks e armazenamento

### 7.1 Princípios

- **Minimização:** webhook do Asaas entrega `customer.email`, `customer.cpfCnpj`. Armazene **somente o que precisa** (id externo + email; nunca armazene CPF integral — só últimos 4 dígitos se precisar).
- **Retenção:** billing data é exceção legal (lei fiscal exige 5 anos para notas fiscais). Mas o `customer.cpfCnpj` deve ser criptografado em repouso.
- **Logs:** nunca logar payload completo do webhook em logs persistentes (PII vaza em monitoramento). Usar `pino` com redact:
  ```ts
  const logger = pino({ redact: ['customer.email', 'customer.cpfCnpj', 'customer.phone'] });
  ```
- **Webhook signature verification:** sempre validar header `asaas-access-token` (não confiar no payload).
- **Idempotência:** `webhookEvents.externalId` unique — Asaas pode reenviar mesmo evento.

### 7.2 Auditoria (LGPD art. 37)

Manter `audit_logs` registra:
- `billing.webhook_received` com `payload.event` mas SEM PII.
- `billing.subscription_created` com `userId` + `tenantId` + `externalId` (não armazenar `customer.cpfCnpj`).
- Acesso do admin ao painel de billing (quem viu).

### 7.3 Direito de eliminação (LGPD art. 18)

Se cliente pedir exclusão da conta:
1. `soft_delete` do workspace (30 dias para recovery).
2. Job graphile-worker apaga:
   - PII de billing (`email` em `subscriptions`).
   - Todos os `audit_logs` daquele tenant.
3. **Exceção:** dados fiscais (notas emitidas) devem ser mantidos 5 anos (obrigação legal).

---

## 8. Implementação — tabela `subscriptions` + integração

```ts
// src/lib/billing/asaas.ts
import { db } from '@/lib/db';
import { subscriptions, workspaces } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function createSubscription({
  tenantId,
  planId,
  paymentMethod,
  customerData,
}: {
  tenantId: string;
  planId: 'pro' | 'business';
  paymentMethod: 'PIX' | 'CREDIT_CARD' | 'BOLETO';
  customerData: { name: string; email: string; cpfCnpj: string };
}) {
  // 1. Cria ou acha customer no Asaas
  const asaasCustomer = await asaas.createCustomer(customerData);

  // 2. Cria subscription
  const asaasSub = await asaas.createSubscription({
    customer: asaasCustomer.id,
    billingType: paymentMethod,
    cycle: 'MONTHLY',
    value: PLANS[planId].price,
    nextDueDate: nextMonth(),
    description: `DemoBR ${planId}`,
  });

  // 3. Persiste no nosso DB
  await db.insert(subscriptions).values({
    tenantId,
    provider: 'asaas',
    externalId: asaasSub.id,
    status: mapAsaasStatus(asaasSub.status),
    plan: planId,
    currentPeriodEnd: new Date(asaasSub.nextDueDate),
  });

  return asaasSub;
}
```

---

## 9. Estimativa de complexidade

| Tarefa | tamanho |
|---------|---------|
| Tabela `subscriptions` + migrações | S |
| Wrapper Asaas REST (cliente) | S |
| Endpoint `/billing/checkout` | M |
| Endpoint `/billing/webhook` (idempotente) | M |
| UI de pricing + portal do cliente | M |
| Dunning automático (grace period) | M |
| Nota fiscal (integração NFe.io ou similar) | M (fase 2) |
| Multi-gateway (Asaas + Stripe) | L (fase 2) |

**MVP billing: M.** 1-2 sprints.

---

## 10. Referências

- Asaas API docs: <https://docs.asaas.com/>
- Asaas Subscriptions: <https://docs.asaas.com/docs/subscriptions>
- Asaas Pricing (PT-BR): <https://www.asaas.com/precos-e-taxas>
- Asaas Checkout com subscription: <https://docs.asaas.com/docs/checkout-com-assinatura-recorrente>
- Asaas Subscriptions via cartão: <https://docs.asaas.com/docs/subscriptions-via-credit-card>
- Mercado Pago Subscriptions: <https://www.mercadopago.com.br/developers/en/reference/online-payments/subscriptions/overview>
- Pagar.me (Stone): <https://pagar.me/>
- Stripe Pix Brasil: <https://docs.stripe.com/payments/pix?locale=pt-BR>
- Stripe métodos BR: <https://support.stripe.com/questions/accepted-payment-methods-in-brazil>
- Stripe vs BR gateways (Chargefy 2026): <https://www.chargefy.io/alternativas/stripe>
- FastPay vs Stripe: <https://www.fastpaybrasil.com/pt/comparativos/fastpay-vs-stripe>
- AndersDev — Stripe BR analysis: <https://www.andersdev.com.br/blog/stripe-brasil-pagamento-internacional-saas>