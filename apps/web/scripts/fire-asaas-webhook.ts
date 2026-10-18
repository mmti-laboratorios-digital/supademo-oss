/* eslint-disable no-console */
/**
 * apps/web/scripts/fire-asaas-webhook.ts
 * -----------------------------------------------------------------------------
 * Smoke script: dispara um webhook Asaas real contra o handler
 * /api/webhooks/asaas do nosso app Next.js. Útil pra testar manualmente
 * sem depender do sandbox oficial do Asaas.
 *
 * Pré-requisitos:
 *   - Mock Asaas server rodando (porta 65500):
 *       $ tsx scripts/mock-asaas.ts &
 *   - App Next.js rodando em http://localhost:3000 (ou BASE)
 *   - .env.test configurado com ASAAS_WEBHOOK_SECRET + SUBSCRIPTION_ID
 *
 * Uso:
 *   $ pnpm --filter web exec tsx scripts/fire-asaas-webhook.ts PAYMENT_RECEIVED
 *   $ EVENT=PAYMENT_OVERDUE SUBSCRIPTION_ID=asaas_sub_xxx \
 *       pnpm --filter web exec tsx scripts/fire-asaas-webhook.ts
 *
 * Argumentos:
 *   argv[2]  evento Asaas (default: PAYMENT_RECEIVED)
 *              PAYMENT_RECEIVED | PAYMENT_OVERDUE | PAYMENT_REFUNDED |
 *              PAYMENT_CONFIRMED | SUBSCRIPTION_INACTIVATED | ...
 *
 * Env vars relevantes:
 *   BASE                   default http://localhost:3000
 *   ASAAS_WEBHOOK_SECRET   default = valor de .env.test
 *   SUBSCRIPTION_ID        default sub_sandbox_default
 *   CUSTOMER_ID            default cus_sandbox_default
 *   PAYMENT_ID             default gerado automaticamente
 *   VALUE (centavos)       default 4900
 *   BILLING_TYPE           default PIX
 */
import { asaasWebhookPayload, asaasWebhookSignature } from "@demo.br/shared/test-utils/asaas-payloads";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

// ---------------------------------------------------------------------------
// Args & env
// ---------------------------------------------------------------------------
const argvEvent = process.argv[2] ?? process.env.EVENT ?? "PAYMENT_RECEIVED";

const BASE = process.env.BASE ?? "http://localhost:3000";

function loadEnvFile(): void {
  const candidates = [
    resolve(process.cwd(), ".env.test"),
    resolve(process.cwd(), "../../.env.test"),
  ];
  for (const path of candidates) {
    if (!existsSync(path)) continue;
    const content = readFileSync(path, "utf8");
    for (const raw of content.split("\n")) {
      const line = raw.trim();
      if (!line || line.startsWith("#")) continue;
      const eq = line.indexOf("=");
      if (eq < 0) continue;
      const k = line.slice(0, eq).trim();
      let v = line.slice(eq + 1).trim();
      if (
        (v.startsWith('"') && v.endsWith('"')) ||
        (v.startsWith("'") && v.endsWith("'"))
      ) {
        v = v.slice(1, -1);
      }
      if (!(k in process.env)) process.env[k] = v;
    }
    break;
  }
}
loadEnvFile();

const WEBHOOK_SECRET =
  process.env.ASAAS_WEBHOOK_SECRET ?? "mock_webhook_secret_for_sandbox";

const SUBSCRIPTION_ID =
  process.env.SUBSCRIPTION_ID ?? "sub_sandbox_default";
const CUSTOMER_ID = process.env.CUSTOMER_ID ?? "cus_sandbox_default";
const PAYMENT_ID = process.env.PAYMENT_ID ?? undefined;
const VALUE = Number(process.env.VALUE ?? 4900);
const BILLING_TYPE = (process.env.BILLING_TYPE ?? "PIX") as
  | "PIX"
  | "BOLETO"
  | "CREDIT_CARD";

// ---------------------------------------------------------------------------
// Validate event type
// ---------------------------------------------------------------------------
const VALID_EVENTS = [
  "PAYMENT_CONFIRMED",
  "PAYMENT_RECEIVED",
  "PAYMENT_OVERDUE",
  "PAYMENT_REFUNDED",
  "PAYMENT_DELETED",
  "SUBSCRIPTION_CREATED",
  "SUBSCRIPTION_UPDATED",
  "SUBSCRIPTION_DELETED",
  "SUBSCRIPTION_INACTIVATED",
] as const;
type AsaasEvent = (typeof VALID_EVENTS)[number];

if (!VALID_EVENTS.includes(argvEvent as AsaasEvent)) {
  console.error(`❌ Evento inválido: ${argvEvent}`);
  console.error(`   Válidos: ${VALID_EVENTS.join(", ")}`);
  process.exit(2);
}
const event = argvEvent as AsaasEvent;

// ---------------------------------------------------------------------------
// Build + sign payload
// ---------------------------------------------------------------------------
const payload = asaasWebhookPayload({
  event,
  subscriptionId: SUBSCRIPTION_ID,
  customerId: CUSTOMER_ID,
  paymentId: PAYMENT_ID,
  value: VALUE,
  billingType: BILLING_TYPE,
});
const rawBody = JSON.stringify(payload);
const signature = asaasWebhookSignature(rawBody, WEBHOOK_SECRET);

// ---------------------------------------------------------------------------
// Fire
// ---------------------------------------------------------------------------
async function main(): Promise<void> {
  console.log(`▶ Target: ${BASE}/api/webhooks/asaas`);
  console.log(`  event:    ${event}`);
  console.log(`  sub:      ${SUBSCRIPTION_ID}`);
  console.log(`  customer: ${CUSTOMER_ID}`);
  console.log(`  value:    ${VALUE} (${BILLING_TYPE})`);
  console.log(`  sig:      ${signature.slice(0, 16)}…`);

  const res = await fetch(`${BASE}/api/webhooks/asaas`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "asaas-signature": signature,
    },
    body: rawBody,
  });

  const text = await res.text();
  console.log(`◀ status:  ${res.status}`);
  console.log(`◀ body:    ${text}`);

  if (!res.ok) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("❌", (err as Error).message);
  process.exit(1);
});