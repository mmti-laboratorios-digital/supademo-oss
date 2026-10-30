# Webhooks — Spec de saída (DemoBR → cliente)

> Como o DemoBR notifica **integrações dos clientes** (CRM, automação, Slack,
> webhook.site para debug) sobre eventos da plataforma.

**Versão:** 1.0
**Base URL de envio:** `https://webhooks.easydemo.io/v1/{workspace_id}`
**Última atualização:** 2026-10-18

---

## 1. Visão geral

Webhooks **de saída** permitem que seus sistemas reajam a eventos do DemoBR
em tempo real (ex.: criar deal no CRM quando um lead é capturado, notificar
Slack quando uma demo é publicada).

Toda chamada de webhook é:

- Assinada com **HMAC SHA-256** (header `X-DemoBR-Signature`).
- Enviada via **POST** com `Content-Type: application/json`.
- **Idempotente** via header `X-DemoBR-Event-Id` (UUID v7).
- Retentada com **exponential backoff + jitter** em falhas (até 8 tentativas).
- Logada em `/admin/webhooks` (Webhook Inspector UI) por 30 dias.

---

## 2. Cadastrando um webhook

### 2.1 Via API

```bash
curl -X POST https://api.easydemo.io/api/v1/webhooks \
  -H "Authorization: Bearer gf_live_..." \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://seu-crm.com/webhooks/demobr",
    "events": ["demo.viewed", "demo.lead_captured"],
    "active": true,
    "description": "CRM principal — leads e views"
  }'
```

Resposta:

```json
{
  "id": "01H8XK7B3V4Y5Z6W7N8M9P0Q1R",
  "url": "https://seu-crm.com/webhooks/demobr",
  "events": ["demo.viewed", "demo.lead_captured"],
  "active": true,
  "secret": "whsec_4f2k9aB3cD7eF8gH1iJ0kL2mN4oP5qR6sT7uV8wX",
  "created_at": "2026-10-18T14:32:00.000Z"
}
```

> ⚠️ O `secret` é mostrado **apenas uma vez**. Salve em seu vault.

### 2.2 Via painel

`/admin/{workspace}/settings/webhooks` → **New webhook** → formulário visual.

---

## 3. Eventos disponíveis

| Evento | Quando dispara | Payload principal |
|--------|----------------|-------------------|
| `demo.viewed` | Visitor abre uma demo (`event_type=view`) | `{ demo_id, visitor_id_hash, referrer_host }` |
| `demo.completed` | Visitor chega ao último step (`event_type=complete`) | `{ demo_id, step_count, duration_ms }` |
| `demo.lead_captured` | Formulário de lead submetido | `{ demo_id, lead: {...} }` |
| `demo.published` | Demo muda para status `published` | `{ demo_id, slug }` |
| `demo.unpublished` | Demo volta para `draft` | `{ demo_id, slug }` |
| `subscription.created` | Assinatura Asaas confirmada | `{ workspace_id, plan_id, asaas_subscription_id }` |
| `subscription.cancelled` | Cliente cancela assinatura | `{ workspace_id, cancel_at_period_end }` |
| `payment.failed` | Pagamento Asaas falhou/overdue | `{ subscription_id, value_brl_cents, attempts }` |

---

## 4. Schema do envelope (comum a todos eventos)

```json
{
  "id": "01H8XK7B3V4Y5Z6W7N8M9P0Q1R",
  "type": "demo.lead_captured",
  "created_at": 1729200000,
  "workspace_id": "01H8WKP0M3Y5Z6W7N8M9P0Q1R2",
  "api_version": "2026-10-18",
  "data": { /* payload específico por tipo */ }
}
```

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | UUID v7 | ID único do evento (idempotência) |
| `type` | string | Um dos eventos da tabela §3 |
| `created_at` | integer | Unix timestamp (segundos) |
| `workspace_id` | UUID | Workspace de origem |
| `api_version` | string | Versão do schema (ISO date) |
| `data` | object | Payload específico do evento |

---

## 5. Payloads específicos

### 5.1 `demo.viewed`

```json
{
  "id": "01H8XK7B3V4Y5Z6W7N8M9P0QA1",
  "type": "demo.viewed",
  "created_at": 1729200000,
  "workspace_id": "01H8WKP0M3Y5Z6W7N8M9P0Q1R2",
  "api_version": "2026-10-18",
  "data": {
    "demo_id": "01H8XK7B3V4Y5Z6W7N8M9P0Q1R",
    "demo_slug": "produto-novo-q4-2026",
    "demo_title": "Produto Novo — Tour de 3 min",
    "visitor_id_hash": "8f3d2a7c4b1e6f9a0d5c8b3e2a1f4d7c9b6e3a0f5d8c2b1e4a7f0d3c6b9e2a5f",
    "device_class": "desktop",
    "country_code": "BR",
    "referrer_host": "google.com",
    "utm": {
      "source": "google",
      "medium": "cpc",
      "campaign": "q4-launch"
    }
  }
}
```

### 5.2 `demo.completed`

```json
{
  "id": "01H8XK7B3V4Y5Z6W7N8M9P0QA2",
  "type": "demo.completed",
  "created_at": 1729200150,
  "workspace_id": "01H8WKP0M3Y5Z6W7N8M9P0Q1R2",
  "api_version": "2026-10-18",
  "data": {
    "demo_id": "01H8XK7B3V4Y5Z6W7N8M9P0Q1R",
    "demo_slug": "produto-novo-q4-2026",
    "visitor_id_hash": "8f3d2a7c...",
    "step_count": 5,
    "duration_ms": 52300
  }
}
```

### 5.3 `demo.lead_captured`

```json
{
  "id": "01H8XK7B3V4Y5Z6W7N8M9P0QA3",
  "type": "demo.lead_captured",
  "created_at": 1729200180,
  "workspace_id": "01H8WKP0M3Y5Z6W7N8M9P0Q1R2",
  "api_version": "2026-10-18",
  "data": {
    "demo_id": "01H8XK7B3V4Y5Z6W7N8M9P0Q1R",
    "demo_slug": "produto-novo-q4-2026",
    "lead": {
      "id": "01H8XK7B3V4Y5Z6W7N8M9P0QB1",
      "name": "Maria Silva",
      "email": "maria@acme.com.br",
      "phone": "+5511988887777",
      "consent_text": "Concordo com a Política de Privacidade da DemoBR.",
      "consent_at": "2026-10-18T14:32:00.000Z",
      "extra": {
        "empresa": "Acme Corp",
        "cargo": "CMO"
      }
    }
  }
}
```

### 5.4 `demo.published`

```json
{
  "id": "01H8XK7B3V4Y5Z6W7N8M9P0QA4",
  "type": "demo.published",
  "created_at": 1729200300,
  "workspace_id": "01H8WKP0M3Y5Z6W7N8M9P0Q1R2",
  "api_version": "2026-10-18",
  "data": {
    "demo_id": "01H8XK7B3V4Y5Z6W7N8M9P0Q1R",
    "slug": "produto-novo-q4-2026",
    "title": "Produto Novo — Tour de 3 min",
    "public_url": "https://easydemo.io/d/produto-novo-q4-2026",
    "published_by_user_id": "user_abc123"
  }
}
```

### 5.5 `demo.unpublished`

Mesmo schema de `demo.published` mas com `type: "demo.unpublished"`.

### 5.6 `subscription.created`

```json
{
  "id": "01H8XK7B3V4Y5Z6W7N8M9P0QA6",
  "type": "subscription.created",
  "created_at": 1729200400,
  "workspace_id": "01H8WKP0M3Y5Z6W7N8M9P0Q1R2",
  "api_version": "2026-10-18",
  "data": {
    "subscription_id": "01H8XK7B3V4Y5Z6W7N8M9P0QRS",
    "plan_id": "pro",
    "asaas_subscription_id": "sub_abc123xyz",
    "billing_type": "CREDIT_CARD",
    "cycle": "MONTHLY",
    "value_brl_cents": 9900,
    "current_period_end": "2026-11-18T00:00:00.000Z"
  }
}
```

### 5.7 `subscription.cancelled`

```json
{
  "id": "01H8XK7B3V4Y5Z6W7N8M9P0QA7",
  "type": "subscription.cancelled",
  "created_at": 1729200500,
  "workspace_id": "01H8WKP0M3Y5Z6W7N8M9P0Q1R2",
  "api_version": "2026-10-18",
  "data": {
    "subscription_id": "01H8XK7B3V4Y5Z6W7N8M9P0QRS",
    "plan_id": "pro",
    "cancel_at_period_end": true,
    "current_period_end": "2026-11-18T00:00:00.000Z",
    "cancelled_by_user_id": "user_abc123"
  }
}
```

### 5.8 `payment.failed`

```json
{
  "id": "01H8XK7B3V4Y5Z6W7N8M9P0QA8",
  "type": "payment.failed",
  "created_at": 1729200600,
  "workspace_id": "01H8WKP0M3Y5Z6W7N8M9P0Q1R2",
  "api_version": "2026-10-18",
  "data": {
    "asaas_payment_id": "pay_xyz789",
    "asaas_subscription_id": "sub_abc123xyz",
    "value_brl_cents": 9900,
    "billing_type": "CREDIT_CARD",
    "attempts": 2,
    "next_attempt_at": "2026-10-25T00:00:00.000Z",
    "reason": "card_declined"
  }
}
```

---

## 6. Validação de assinatura (HMAC SHA-256)

Todo webhook inclui:

- Header `X-DemoBR-Signature: t=<unix_ts>,v1=<hex_hmac>`
- Header `X-DemoBR-Event-Id: <uuid>` (idempotência)
- Header `X-DemoBR-Webhook-Id: <webhook_id>` (qual webhook entregou)

### 6.1 Verificação em Node.js

```ts
import crypto from 'node:crypto';

const SECRET = process.env.DEMOBR_WEBHOOK_SECRET!; // ex.: whsec_4f2k9aB3...
const SIGNATURE_HEADER = req.headers['x-demobr-signature'] as string;
const EVENT_ID = req.headers['x-demobr-event-id'] as string;
const RAW_BODY = req.rawBody; // precisa do body bruto (não JSON.parse)

function verifyWebhook(rawBody: string, signatureHeader: string, secret: string): boolean {
  // Formato: "t=1729200000,v1=abc123def456..."
  const parts = Object.fromEntries(
    signatureHeader.split(',').map(p => p.split('=') as [string, string])
  );
  const ts = parts['t'];
  const v1 = parts['v1'];

  // 1. Rejeitar se timestamp > 5 min (proteção contra replay)
  const FIVE_MIN = 5 * 60;
  if (Math.abs(Date.now() / 1000 - Number(ts)) > FIVE_MIN) {
    return false;
  }

  // 2. Calcular HMAC esperado
  const signedPayload = `${ts}.${rawBody}`;
  const expected = crypto
    .createHmac('sha256', secret)
    .update(signedPayload, 'utf8')
    .digest('hex');

  // 3. Comparação constant-time
  return crypto.timingSafeEqual(
    Buffer.from(v1, 'hex'),
    Buffer.from(expected, 'hex')
  );
}

if (!verifyWebhook(RAW_BODY, SIGNATURE_HEADER, SECRET)) {
  return res.status(401).json({ error: 'invalid_signature' });
}
```

### 6.2 Verificação em Python

```python
import hmac, hashlib, time

SECRET = os.environ["DEMOBR_WEBHOOK_SECRET"].encode()
signature_header = request.headers["X-DemoBR-Signature"]  # "t=...,v1=..."
event_id = request.headers["X-DemoBR-Event-Id"]
raw_body = request.body  # bytes brutos

parts = dict(p.split("=") for p in signature_header.split(","))
ts, v1 = parts["t"], parts["v1"]

# Anti-replay: rejeitar se ts > 5 min
if abs(time.time() - int(ts)) > 300:
    abort(401)

signed_payload = f"{ts}.{raw_body.decode()}".encode()
expected = hmac.new(SECRET, signed_payload, hashlib.sha256).hexdigest()

if not hmac.compare_digest(v1, expected):
    abort(401)
```

---

## 7. Retry policy

Quando seu endpoint retorna:

- `2xx` → sucesso, **não retentamos**.
- `4xx` (exceto `408`, `429`) → falha permanente; paramos. Logamos.
- `408`, `429`, `5xx`, **timeout**, **connection refused**, **DNS fail** → retentamos.

**Backoff exponencial com jitter** (RFC 9110 / AWS pattern):

| Tentativa | Delay base | Jitter (±) | Total elapsed |
|-----------|-----------|-----------|---------------|
| 1 | 0s | 0 | 0s |
| 2 | 30s | ±10s | ~30s |
| 3 | 2min | ±30s | ~2.5min |
| 4 | 10min | ±2min | ~13min |
| 5 | 30min | ±5min | ~45min |
| 6 | 1h | ±10min | ~1h 50min |
| 7 | 3h | ±30min | ~5h 20min |
| 8 | 12h | ±1h | ~17h 20min |

Após **8 tentativas** (em ~17h), o webhook entra em estado `dead_letter`.
Você pode **replay** manualmente via Webhook Inspector UI.

### Headers em retries

Em cada retry, mantemos os mesmos:

- `X-DemoBR-Event-Id` — mesmo valor (idempotência).
- `X-DemoBR-Signature` — **novo timestamp `t=`** com HMAC recalculado.

Adicionamos `X-DemoBR-Delivery-Attempt: <n>` (1..8).

---

## 8. Idempotência

Toda entrega inclui `X-DemoBR-Event-Id` (UUID v7, único por evento).

**Seu sistema deve**:

1. Armazenar IDs já processados (Redis, DB) por ≥ 24h.
2. Antes de processar, checar se ID já foi visto.
3. Se sim, retornar `200` sem reprocessar.

```ts
const seen = await redis.sismember(`webhook:seen:${workspace_id}`, event_id);
if (seen) return res.status(200).json({ ok: true, dedup: true });
// ... processa ...
await redis.sadd(`webhook:seen:${workspace_id}`, event_id);
await redis.expire(`webhook:seen:${workspace_id}`, 86400); // 24h
return res.status(200).json({ ok: true });
```

---

## 9. Webhook Inspector UI

Em `/admin/{workspace}/settings/webhooks` você encontra:

- **Lista de webhooks** cadastrados (URL, eventos, ativo/inativo).
- **Histórico de entregas** (últimas 30 dias):
  - Status (success, failed, pending, dead_letter).
  - Response code + body (truncado a 2 KB).
  - Timestamp de cada tentativa.
  - Botão **Replay** para reenviar manualmente.
- **Filtros**: por evento, status, range de data.
- **Test send**: envia um evento `demo.published` fake para validar URL.

Endpoint da inspector (também via API):

```bash
GET /api/v1/webhooks/{id}/deliveries?status=failed&limit=50
```

---

## 10. Segurança

- **TLS obrigatório**: webhooks só são entregues para URLs `https://`.
- **SSRF protection**: bloqueamos delivery para IPs privados
  (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`, `127.0.0.0/8`).
  Endpoint deve ser público.
- **HMAC obrigatório**: secret gerado server-side, ≥ 32 bytes random.
- **Secret rotation**: rotação via `/api/v1/webhooks/{id}/rotate-secret`
  (mantém secret antigo por 24h para overlap).
- **Rate limit**: 60 deliveries/min por webhook (configurável).
- **Audit log**: todo registro/rotação/DELETE logado em `app.audit_log`.

---

## 11. Limit & quotas (por plano)

| Plano | Webhooks ativos | Eventos/dia | Retenção inspector |
|-------|----------------|-------------|---------------------|
| Free | 1 | 1.000 | 7 dias |
| Pro | 10 | 100.000 | 30 dias |
| Business | 50 | ilimitado | 90 dias |

Excedente: novas tentativas entram em fila e são entregues quando quota
resetar (próximo dia UTC), ou **são descartadas** se fila > 10k (config).

---

## 12. Troubleshooting

| Sintoma | Causa provável | Ação |
|---------|---------------|------|
| Webhook nunca chega | DNS resolve para IP privado | Conferir URL pública |
| `401 invalid_signature` | Body foi parseado antes de verificar | Usar raw body |
| `401 invalid_signature` | Clock skew > 5 min | Sincronizar NTP |
| Status `dead_letter` | 8 retries falharam | Inspecionar response, corrigir, Replay |
| Status `failed` permanente | 4xx consistente | Conferir URL/auth no receptor |
| Eventos atrasados | Rate limit do receptor | Aumentar throughput no receptor |
| Eventos atrasados | Quota do plano excedida | Upgrade de plano |

---

## 13. Versionamento

- Header `X-DemoBR-API-Version: 2026-10-18` enviado em todo webhook.
- Mudanças **breaking** (renomear campo, mudar tipo) ⇒ nova data
  (`2027-04-15`).
- Suportamos 2 versões por 12 meses após release da nova.
- Webhooks antigos permanecem entregando mesmo após deprecation;
  nova versão de campo é opcional (`field_v2` ao lado de `field`).

---

## 14. Referências

- [OpenAPI spec completa](openapi.yaml) — schema `WebhookEvent`.
- [Stripe Webhooks best practices](https://stripe.com/docs/webhooks/best-practices) — modelo de assinatura.
- [Svix webhook guide](https://docs.svix.com/receiving/verifying-payloads/how) — usado por Clerk.
- [RFC 9110 — HTTP semantics](https://www.rfc-editor.org/rfc/rfc9110) — status codes.
- [Resend webhooks](https://resend.com/docs/dashboard/webhooks/introduction) — referência de DX.
- `docs/SECURITY-MODEL.md` §5 — política de rotação de segredos.