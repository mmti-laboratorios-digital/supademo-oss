/* eslint-disable no-console */
/**
 * apps/web/scripts/test-webhook-asaas.ts
 * -----------------------------------------------------------------------------
 * Envia um webhook Asaas fake de PAYMENT_RECEIVED e valida que:
 *   1. A subscription no DB mudou para status=active
 *   2. Uma segunda chamada com mesmo payment.id é idempotente
 *
 * Pré-requisitos:
 *   - Aplicação Next.js rodando em $BASE (default http://localhost:3000)
 *   - Asaas webhook secret configurado em ASAAS_WEBHOOK_SECRET
 *   - Workspace + customer Asaas de teste já existem no DB (use seed)
 *
 * Uso:
 *   BASE=http://localhost:3000 \
 *   ASAAS_WEBHOOK_SECRET=whsec_test \
 *   pnpm --filter web exec tsx scripts/test-webhook-asaas.ts
 */
import { createHmac } from "node:crypto";

// -----------------------------------------------------------------------------
// Args
// -----------------------------------------------------------------------------
const BASE = process.env.BASE ?? "http://localhost:3000";
const SECRET = process.env.ASAAS_WEBHOOK_SECRET ?? "whsec_test";
const TOKEN = process.env.TOKEN ?? "dev-token";
const SUBSCRIPTION_ID = process.env.SUBSCRIPTION_ID ?? "sub_test_001";

function sign(payload: string): string {
  return createHmac("sha256", SECRET).update(payload).digest("hex");
}

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { Authorization: `Bearer ${TOKEN}` },
  });
  if (!res.ok) throw new Error(`GET ${path} → ${res.status}`);
  return (await res.json()) as T;
}

async function postSigned(path: string, body: unknown): Promise<{ status: number; body: string }> {
  const payload = JSON.stringify(body);
  const signature = sign(payload);
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Asaas-Signature": signature,
      "X-Asaas-Webhook-Secret": SECRET,
    },
    body: payload,
  });
  const text = await res.text();
  return { status: res.status, body: text };
}

interface Subscription { id: string; status: string; paid_at?: string | null }

async function fetchSubscription(id: string): Promise<Subscription> {
  return getJson<Subscription>(`/api/v1/billing/subscriptions/${id}`);
}

// -----------------------------------------------------------------------------
// Main
// -----------------------------------------------------------------------------
async function main() {
  console.log(`▶ Target: ${BASE}  (subscription: ${SUBSCRIPTION_ID})`);

  // Snapshot inicial
  const before = await fetchSubscription(SUBSCRIPTION_ID);
  console.log(`  status inicial: ${before.status}`);

  // 1) Envia webhook PAYMENT_RECEIVED
  const paymentId = `pay_${Date.now()}`;
  const event = {
    event: "PAYMENT_RECEIVED",
    payment: {
      id: paymentId,
      customer: "cus_test_001",
      subscription: SUBSCRIPTION_ID,
      value: 49.0,
      netValue: 48.0,
      status: "RECEIVED",
      billingType: "PIX",
      confirmedDate: new Date().toISOString(),
    },
  };

  console.log("▶ Enviando webhook PAYMENT_RECEIVED…");
  const r1 = await postSigned("/api/webhooks/asaas", event);
  console.log(`  status: ${r1.status} body: ${r1.body.slice(0, 120)}`);

  // Dá tempo do handler processar
  await new Promise((r) => setTimeout(r, 500));

  const after1 = await fetchSubscription(SUBSCRIPTION_ID);
  console.log(`  status pós-webhook: ${after1.status}`);

  if (after1.status === before.status && after1.status !== "active") {
    console.error(`❌ subscription.status não mudou: ${before.status} → ${after1.status}`);
    process.exit(1);
  }
  console.log("  ✓ subscription atualizada.");

  // 2) Idempotência — envia o MESMO payment.id
  console.log("\n▶ Reenviando MESMO payment.id (idempotência)…");
  const r2 = await postSigned("/api/webhooks/asaas", event);
  console.log(`  status: ${r2.status} body: ${r2.body.slice(0, 120)}`);

  await new Promise((r) => setTimeout(r, 500));
  const after2 = await fetchSubscription(SUBSCRIPTION_ID);

  // Asserções: status não duplicado, paid_at inalterado
  if (after2.status !== after1.status) {
    console.error(`❌ status mudou na 2ª chamada: ${after1.status} → ${after2.status}`);
    process.exit(1);
  }
  if (after2.paid_at !== after1.paid_at) {
    console.error(`❌ paid_at foi sobrescrito na 2ª chamada (${after1.paid_at} → ${after2.paid_at})`);
    process.exit(1);
  }
  console.log("  ✓ idempotente: 2ª chamada não duplicou efeito.");

  console.log("\n✅ Webhook Asaas ok + idempotente.");
}

main().catch((e) => {
  console.error("❌", (e as Error).message);
  process.exit(1);
});