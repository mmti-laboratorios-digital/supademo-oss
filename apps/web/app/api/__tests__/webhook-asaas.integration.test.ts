/**
 * apps/web/app/api/__tests__/webhook-asaas.integration.test.ts
 *
 * Testes de INTEGRAÇÃO do endpoint /api/webhooks/asaas.
 *
 * Cobertura:
 *  - Assinatura inválida → 401
 *  - Assinatura válida + PAYMENT_RECEIVED → 200, subscription atualizada
 *  - Mesmo event_id 2x → idempotente (1 efeito)
 */
import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { Client } from "pg";
import { createHmac } from "node:crypto";
import { randomUUID } from "node:crypto";

const APP_USER_URL =
  process.env.DATABASE_URL ?? "postgres://app_user:demobr@127.0.0.1:55432/supademo";
const APP_OWNER_URL = APP_USER_URL.replace("app_user", "app_owner");
const WEBHOOK_SECRET = "test-webhook-secret-do-not-use-in-prod";

// Mock next/headers (para retornar headers customizados em cada request)
const mockHeaders = new Map<string, string>();
vi.mock("next/headers", async () => {
  return {
    headers: async () => ({
      get(name: string): string | null {
        return mockHeaders.get(name.toLowerCase()) ?? null;
      },
    }),
  };
});

// Mock queue — não queremos dependência real de graphile-worker
vi.mock("@/lib/queue", async () => {
  return {
    enqueue: vi.fn(async () => "mock-job-id"),
  };
});

let adminClient: Client;
let workspaceId: string;
let subscriptionId: string;
const asaasSubscriptionId = `asaas_sub_${randomUUID().slice(0, 8)}`;

beforeAll(async () => {
  adminClient = new Client({ connectionString: APP_OWNER_URL });
  await adminClient.connect();
  await adminClient.query(
    "DELETE FROM app.subscriptions WHERE asaas_subscription_id LIKE 'asaas_sub_test-%'",
  );
  await adminClient.query(
    "DELETE FROM app.workspaces WHERE slug LIKE 'wh-int-%'",
  );

  // Cria workspace
  const w = await adminClient.query<{ id: string }>(
    `INSERT INTO app.workspaces (slug, name, plan_id)
     VALUES ('wh-int-1', 'Webhook Test', 'free') RETURNING id`,
  );
  workspaceId = w.rows[0].id;

  // Cria subscription vinculada
  const s = await adminClient.query<{ id: string }>(
    `INSERT INTO app.subscriptions (workspace_id, plan_id, asaas_subscription_id, status)
     VALUES ($1, 'free', $2, 'incomplete') RETURNING id`,
    [workspaceId, asaasSubscriptionId],
  );
  subscriptionId = s.rows[0].id;

  // Configura env
  process.env.ASAAS_WEBHOOK_SECRET = WEBHOOK_SECRET;
});

afterAll(async () => {
  await adminClient.query(
    "DELETE FROM app.subscriptions WHERE id = $1",
    [subscriptionId],
  );
  await adminClient.query("DELETE FROM app.workspaces WHERE id = $1", [
    workspaceId,
  ]);
  await adminClient.end();
});

function signPayload(rawBody: string): string {
  return createHmac("sha256", WEBHOOK_SECRET).update(rawBody).digest("hex");
}

async function postWebhook(
  rawBody: string,
  signature: string | null,
): Promise<Response> {
  // Reset headers
  mockHeaders.clear();
  if (signature) {
    mockHeaders.set("asaas-signature", signature);
  }
  const { POST } = await import("../webhooks/asaas/route");
  const req = new Request("http://localhost/api/webhooks/asaas", {
    method: "POST",
    body: rawBody,
    headers: { "content-type": "application/json" },
  });
  return await POST(req);
}

describe("/api/webhooks/asaas — autenticação", () => {
  it("POST sem header → 401 (MISSING_AUTH)", async () => {
    const body = JSON.stringify({ event: "PAYMENT_RECEIVED" });
    const res = await postWebhook(body, null);
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.error).toBe("MISSING_AUTH");
  });

  it("POST com assinatura inválida → 401 (INVALID_SIGNATURE)", async () => {
    const body = JSON.stringify({ event: "PAYMENT_RECEIVED" });
    const res = await postWebhook(body, "deadbeef".repeat(8));
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.error).toBe("INVALID_SIGNATURE");
  });
});

describe("/api/webhooks/asaas — PAYMENT_RECEIVED", () => {
  it("POST válido → 200 e subscription atualizada para active", async () => {
    const paymentId = `pay_${randomUUID().slice(0, 8)}`;
    const body = JSON.stringify({
      event: "PAYMENT_RECEIVED",
      payment: {
        id: paymentId,
        subscription: asaasSubscriptionId,
        customer: "cus_1",
        value: 4900,
        billingType: "PIX",
        status: "RECEIVED",
      },
    });
    const signature = signPayload(body);
    const res = await postWebhook(body, signature);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.deduplicated).toBeFalsy();

    // Verifica que subscription foi atualizada
    const verify = await adminClient.query<{ status: string; plan_id: string }>(
      "SELECT status, plan_id FROM app.subscriptions WHERE id = $1",
      [subscriptionId],
    );
    expect(verify.rows[0].status).toBe("active");
    expect(verify.rows[0].plan_id).toBe("free");
  });

  it("Idempotente: mesmo event_id 2x → 1 efeito (deduplicated=true)", async () => {
    const paymentId = `pay_idemp_${randomUUID().slice(0, 8)}`;
    const body = JSON.stringify({
      event: "PAYMENT_RECEIVED",
      payment: {
        id: paymentId,
        subscription: asaasSubscriptionId,
        customer: "cus_1",
        value: 4900,
        billingType: "PIX",
        status: "RECEIVED",
      },
    });
    const signature = signPayload(body);

    // 1ª chamada — deve processar
    const r1 = await postWebhook(body, signature);
    expect(r1.status).toBe(200);
    const j1 = await r1.json();
    expect(j1.deduplicated).toBeFalsy();

    // 2ª chamada — deve vir deduplicated
    const r2 = await postWebhook(body, signature);
    expect(r2.status).toBe(200);
    const j2 = await r2.json();
    expect(j2.deduplicated).toBe(true);
  });
});