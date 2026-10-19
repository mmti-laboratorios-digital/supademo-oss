import { randomUUID } from "node:crypto";
import {
  asaasWebhookPayload,
  asaasWebhookSignature,
} from "@demo.br/shared/test-utils/asaas-payloads";
import { Client } from "pg";
/**
 * apps/web/app/api/__tests__/webhook-asaas.sandbox.integration.test.ts
 * -----------------------------------------------------------------------------
 * E2E test sandbox do webhook Asaas.
 *
 * Diferente de `webhook-asaas.integration.test.ts` (que mocka tudo e exercita
 * só o handler), este test:
 *
 *   1. Sobe o mock server local em MOCK_ASAAS_URL (configurado pelo
 *      vitest.globalSetup.ts)
 *   2. Cria customer + subscription via o wrapper `lib/asaas.ts` — o
 *      wrapper é stubado para apontar para o mock (não editamos o arquivo)
 *   3. Dispara webhook PAYMENT_RECEIVED contra o handler real
 *   4. Verifica que o DB foi atualizado
 *   5. Reenvia o mesmo event → idempotente
 *   6. Envia com HMAC inválido → 401
 *   7. Envia PAYMENT_OVERDUE → status=pass_due
 *   8. Envia PAYMENT_REFUNDED → status=canceled, workspace.planId=free
 *   9. Envia SUBSCRIPTION_INACTIVATED → status=canceled
 *  10. Cleanup do DB
 *
 * Eventos Asaas cobertos:
 *   - PAYMENT_RECEIVED      (happy path + idempotência)
 *   - PAYMENT_OVERDUE       (subscription → past_due)
 *   - PAYMENT_REFUNDED      (subscription → canceled, workspace → free)
 *   - SUBSCRIPTION_INACTIVATED (subscription → canceled)
 *
 * Pré-requisitos:
 *   - MOCK_ASAAS_URL disponível (vitest.globalSetup.ts injeta)
 *   - Container postgres supademo-test em 55432 (já rodando em dev)
 */
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

// ---------------------------------------------------------------------------
// Env — must be set BEFORE we import the route handler (which calls env())
// ---------------------------------------------------------------------------
const MOCK_ASAAS_URL = process.env.MOCK_ASAAS_URL ?? "http://127.0.0.1:65500";
process.env.MOCK_ASAAS_URL = MOCK_ASAAS_URL;
process.env.ASAAS_API_KEY = "mock_api_key";
process.env.ASAAS_WEBHOOK_SECRET = "mock_webhook_secret_for_sandbox";

// ---------------------------------------------------------------------------
// Mock next/headers so the handler can read our injected signature.
// ---------------------------------------------------------------------------
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

// ---------------------------------------------------------------------------
// Mock queue — sandbox doesn't have graphile-worker running.
// ---------------------------------------------------------------------------
vi.mock("@/lib/queue", async () => {
  return {
    enqueue: vi.fn(async () => "mock-job-id"),
  };
});

// ---------------------------------------------------------------------------
// Mock the lib/asaas wrapper so it points at our mock server. We do NOT
// edit lib/asaas.ts — we replace its fetch implementation via vi.mock.
// ---------------------------------------------------------------------------
vi.mock("@/lib/asaas", async () => {
  const real = await vi.importActual<typeof import("@/lib/asaas")>("@/lib/asaas");

  async function mockAsaas<T>(path: string, init: RequestInit = {}): Promise<T> {
    const res = await fetch(`${MOCK_ASAAS_URL}${path}`, {
      ...init,
      headers: {
        "content-type": "application/json",
        ...(init.headers ?? {}),
      },
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Mock Asaas ${path} failed: ${res.status} ${text}`);
    }
    return (await res.json()) as T;
  }

  return {
    ...real,
    createCustomer: (args: { name: string; email?: string; cpfCnpj?: string }) =>
      mockAsaas("/v3/customers", { method: "POST", body: JSON.stringify(args) }),
    createSubscription: (args: Parameters<typeof real.createSubscription>[0]) =>
      mockAsaas("/v3/subscriptions", { method: "POST", body: JSON.stringify(args) }),
    getSubscription: (id: string) => mockAsaas(`/v3/subscriptions/${id}`),
    cancelSubscription: async (id: string) => {
      await mockAsaas(`/v3/subscriptions/${id}`, { method: "DELETE" });
    },
  };
});

// ---------------------------------------------------------------------------
// DB helpers
// ---------------------------------------------------------------------------
const APP_USER_URL =
  process.env.DATABASE_URL ?? "postgres://app_user:demobr@127.0.0.1:55432/supademo";
const APP_OWNER_URL = APP_USER_URL.replace("app_user", "app_owner");

let adminClient: Client;
let workspaceId: string;
const seededSubscriptionIds: string[] = [];

beforeAll(async () => {
  adminClient = new Client({ connectionString: APP_OWNER_URL });
  await adminClient.connect();

  // Limpa dados de runs anteriores
  await adminClient.query(
    "DELETE FROM app.subscriptions WHERE asaas_subscription_id LIKE 'asaas_sub_sandbox_%'",
  );
  await adminClient.query("DELETE FROM app.workspaces WHERE slug LIKE 'wh-sandbox-%'");

  // Cria workspace vinculado
  const slug = `wh-sandbox-${randomUUID().slice(0, 8)}`;
  const w = await adminClient.query<{ id: string }>(
    `INSERT INTO app.workspaces (slug, name, plan_id)
     VALUES ($1, 'Webhook Sandbox Test', 'free') RETURNING id`,
    [slug],
  );
  workspaceId = w.rows[0].id;
});

afterAll(async () => {
  if (seededSubscriptionIds.length > 0) {
    await adminClient.query("DELETE FROM app.subscriptions WHERE id = ANY($1::uuid[])", [
      seededSubscriptionIds,
    ]);
  }
  await adminClient.query("DELETE FROM app.workspaces WHERE id = $1", [workspaceId]);
  await adminClient.end();
});

// ---------------------------------------------------------------------------
// Wrapper helpers (using the vi.mock-redirected wrapper)
// ---------------------------------------------------------------------------
async function createFixtureSubscription(opts: {
  billingType?: "PIX" | "BOLETO" | "CREDIT_CARD";
  cycle?: "MONTHLY" | "YEARLY";
  value?: number;
}): Promise<{ asaasSubscriptionId: string; customerId: string }> {
  // Import AFTER vi.mock so the override applies
  const { createCustomer, createSubscription } = await import("@/lib/asaas");

  const customer = await createCustomer({
    name: `Sandbox Customer ${randomUUID().slice(0, 6)}`,
    email: `sandbox-${randomUUID().slice(0, 6)}@example.com`,
    cpfCnpj: "00000000000",
  });

  const subscription = await createSubscription({
    customer: customer.id,
    billingType: opts.billingType ?? "PIX",
    value: opts.value ?? 49.0,
    cycle: opts.cycle ?? "MONTHLY",
    nextDueDate: new Date().toISOString().slice(0, 10),
    description: "Sandbox test subscription",
  });

  // Persist a row in app.subscriptions so the handler can find it
  // (the handler looks up by `asaas_subscription_id`)
  const asaasSubscriptionId = subscription.id;
  const s = await adminClient.query<{ id: string }>(
    `INSERT INTO app.subscriptions (workspace_id, plan_id, asaas_subscription_id, status)
     VALUES ($1, 'pro', $2, 'incomplete') RETURNING id`,
    [workspaceId, asaasSubscriptionId],
  );
  seededSubscriptionIds.push(s.rows[0].id);

  return { asaasSubscriptionId, customerId: customer.id };
}

async function insertBareSubscription(
  asaasSubscriptionId: string,
  status = "incomplete",
): Promise<string> {
  const s = await adminClient.query<{ id: string }>(
    `INSERT INTO app.subscriptions (workspace_id, plan_id, asaas_subscription_id, status)
     VALUES ($1, 'free', $2, $3) RETURNING id`,
    [workspaceId, asaasSubscriptionId, status],
  );
  seededSubscriptionIds.push(s.rows[0].id);
  return s.rows[0].id;
}

// ---------------------------------------------------------------------------
// Webhook poster — calls the real handler module
// ---------------------------------------------------------------------------
const WEBHOOK_SECRET = process.env.ASAAS_WEBHOOK_SECRET ?? "mock_webhook_secret_for_sandbox";

async function postWebhook(rawBody: string, signature: string | null): Promise<Response> {
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

async function fetchSubscriptionStatus(asaasSubscriptionId: string): Promise<
  | {
      status: string;
      plan_id: string;
      cancel_at_period_end: boolean;
    }
  | undefined
> {
  const r = await adminClient.query<{
    status: string;
    plan_id: string;
    cancel_at_period_end: boolean;
  }>(
    `SELECT status, plan_id, cancel_at_period_end
       FROM app.subscriptions
      WHERE asaas_subscription_id = $1
      ORDER BY created_at DESC
      LIMIT 1`,
    [asaasSubscriptionId],
  );
  return r.rows[0];
}

async function fetchWorkspacePlan(): Promise<string> {
  const r = await adminClient.query<{ plan_id: string }>(
    "SELECT plan_id FROM app.workspaces WHERE id = $1",
    [workspaceId],
  );
  return r.rows[0].plan_id;
}

// ---------------------------------------------------------------------------
// Sanity check: mock server reachable
// ---------------------------------------------------------------------------
describe("Asaas mock server", () => {
  it("responds on MOCK_ASAAS_URL", async () => {
    const res = await fetch(`${MOCK_ASAAS_URL}/v3/customers`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: "ping" }),
    });
    expect(res.status).toBe(201);
    const json = (await res.json()) as { id: string };
    expect(json.id).toMatch(/^cus_/);
  });

  it("creates subscription via wrapper for all billing types", async () => {
    for (const billingType of ["PIX", "BOLETO", "CREDIT_CARD"] as const) {
      const { asaasSubscriptionId } = await createFixtureSubscription({ billingType });
      expect(asaasSubscriptionId).toMatch(/^sub_/);

      // Verify via mock GET — wrapper returns AsaasSubscription (subset);
      // mock returns the full schema, but TS narrows to wrapper's declared fields.
      const { getSubscription } = await import("@/lib/asaas");
      const sub = await getSubscription(asaasSubscriptionId);
      expect(sub.status).toBe("ACTIVE");
      // The mock echoes billingType back; cast through unknown to read the extra field
      const subFull = sub as unknown as { billingType: string };
      expect(subFull.billingType).toBe(billingType);
    }
  });
});

// ---------------------------------------------------------------------------
// Webhook handler — auth
// ---------------------------------------------------------------------------
describe("/api/webhooks/asaas — auth", () => {
  it("sem header → 401 MISSING_AUTH", async () => {
    const res = await postWebhook(JSON.stringify({ event: "PAYMENT_RECEIVED" }), null);
    expect(res.status).toBe(401);
    const json = (await res.json()) as { error: string };
    expect(json.error).toBe("MISSING_AUTH");
  });

  it("assinatura HMAC inválida → 401 INVALID_SIGNATURE", async () => {
    const body = JSON.stringify({ event: "PAYMENT_RECEIVED" });
    const res = await postWebhook(body, "a".repeat(64));
    expect(res.status).toBe(401);
    const json = (await res.json()) as { error: string };
    expect(json.error).toBe("INVALID_SIGNATURE");
  });
});

// ---------------------------------------------------------------------------
// Webhook handler — PAYMENT_RECEIVED (happy path + idempotência)
// ---------------------------------------------------------------------------
describe("/api/webhooks/asaas — PAYMENT_RECEIVED", () => {
  let asaasSubscriptionId: string;
  let customerId: string;

  beforeAll(async () => {
    const fixture = await createFixtureSubscription({ billingType: "PIX", value: 49 });
    asaasSubscriptionId = fixture.asaasSubscriptionId;
    customerId = fixture.customerId;
  });

  it("happy path → 200, status=active, workspace.planId=pro", async () => {
    const payload = asaasWebhookPayload({
      event: "PAYMENT_RECEIVED",
      subscriptionId: asaasSubscriptionId,
      customerId,
      billingType: "PIX",
      value: 4900,
    });
    const rawBody = JSON.stringify(payload);
    const signature = asaasWebhookSignature(rawBody, WEBHOOK_SECRET);

    const res = await postWebhook(rawBody, signature);
    expect(res.status).toBe(200);
    const json = (await res.json()) as { ok: boolean; deduplicated?: boolean };
    expect(json.ok).toBe(true);
    expect(json.deduplicated).toBeFalsy();

    const sub = await fetchSubscriptionStatus(asaasSubscriptionId);
    expect(sub.status).toBe("active");
    // Workspace plan upgraded from "free" → "pro" (matches inserted row)
    expect(sub.plan_id).toBe("pro");
    expect(await fetchWorkspacePlan()).toBe("pro");
  });

  it("mesmo event_id 2x → 2ª chamada vem deduplicated=true", async () => {
    const payload = asaasWebhookPayload({
      event: "PAYMENT_RECEIVED",
      subscriptionId: asaasSubscriptionId,
      customerId,
      paymentId: `pay_idemp_${randomUUID().slice(0, 6)}`,
    });
    const rawBody = JSON.stringify(payload);
    const signature = asaasWebhookSignature(rawBody, WEBHOOK_SECRET);

    const r1 = await postWebhook(rawBody, signature);
    expect(r1.status).toBe(200);
    const j1 = (await r1.json()) as { deduplicated?: boolean };
    expect(j1.deduplicated).toBeFalsy();

    // Snapshot do workspace plan após 1ª chamada
    const planAfter1 = await fetchWorkspacePlan();
    const subAfter1 = await fetchSubscriptionStatus(asaasSubscriptionId);

    // 2ª chamada idêntica
    const r2 = await postWebhook(rawBody, signature);
    expect(r2.status).toBe(200);
    const j2 = (await r2.json()) as { deduplicated?: boolean };
    expect(j2.deduplicated).toBe(true);

    // Estado não muda na 2ª chamada
    expect(await fetchWorkspacePlan()).toBe(planAfter1);
    expect((await fetchSubscriptionStatus(asaasSubscriptionId)).status).toBe(subAfter1.status);
  });
});

// ---------------------------------------------------------------------------
// Webhook handler — PAYMENT_OVERDUE
// ---------------------------------------------------------------------------
describe("/api/webhooks/asaas — PAYMENT_OVERDUE", () => {
  it("→ subscription.status muda para past_due", async () => {
    const { asaasSubscriptionId, customerId } = await createFixtureSubscription({
      billingType: "BOLETO",
      value: 79,
    });

    const payload = asaasWebhookPayload({
      event: "PAYMENT_OVERDUE",
      subscriptionId: asaasSubscriptionId,
      customerId,
      billingType: "BOLETO",
    });
    const rawBody = JSON.stringify(payload);
    const signature = asaasWebhookSignature(rawBody, WEBHOOK_SECRET);

    const res = await postWebhook(rawBody, signature);
    expect(res.status).toBe(200);

    const sub = await fetchSubscriptionStatus(asaasSubscriptionId);
    expect(sub.status).toBe("past_due");
  });
});

// ---------------------------------------------------------------------------
// Webhook handler — PAYMENT_REFUNDED
// ---------------------------------------------------------------------------
describe("/api/webhooks/asaas — PAYMENT_REFUNDED", () => {
  it("→ subscription.status=canceled, cancelAtPeriodEnd=true, workspace.planId=free", async () => {
    const { asaasSubscriptionId, customerId } = await createFixtureSubscription({
      billingType: "CREDIT_CARD",
      value: 99,
    });

    // First, mark active
    const activePayload = asaasWebhookPayload({
      event: "PAYMENT_RECEIVED",
      subscriptionId: asaasSubscriptionId,
      customerId,
      billingType: "CREDIT_CARD",
    });
    await postWebhook(
      JSON.stringify(activePayload),
      asaasWebhookSignature(JSON.stringify(activePayload), WEBHOOK_SECRET),
    );

    // Now refund
    const refundPayload = asaasWebhookPayload({
      event: "PAYMENT_REFUNDED",
      subscriptionId: asaasSubscriptionId,
      customerId,
      billingType: "CREDIT_CARD",
    });
    const refundRaw = JSON.stringify(refundPayload);
    const refundSig = asaasWebhookSignature(refundRaw, WEBHOOK_SECRET);

    const res = await postWebhook(refundRaw, refundSig);
    expect(res.status).toBe(200);

    const sub = await fetchSubscriptionStatus(asaasSubscriptionId);
    expect(sub.status).toBe("canceled");
    expect(sub.cancel_at_period_end).toBe(true);
    expect(await fetchWorkspacePlan()).toBe("free");
  });
});

// ---------------------------------------------------------------------------
// Webhook handler — SUBSCRIPTION_INACTIVATED
// ---------------------------------------------------------------------------
describe("/api/webhooks/asaas — SUBSCRIPTION_INACTIVATED", () => {
  it("→ subscription.status=canceled, workspace.planId=free", async () => {
    const asaasSubscriptionId = `asaas_sub_sandbox_inactive_${randomUUID().slice(0, 6)}`;
    await insertBareSubscription(asaasSubscriptionId, "active");

    const payload = asaasWebhookPayload({
      event: "SUBSCRIPTION_INACTIVATED",
      subscriptionId: asaasSubscriptionId,
      customerId: `cus_inactive_${randomUUID().slice(0, 6)}`,
    });
    const rawBody = JSON.stringify(payload);
    const signature = asaasWebhookSignature(rawBody, WEBHOOK_SECRET);

    const res = await postWebhook(rawBody, signature);
    expect(res.status).toBe(200);

    const sub = await fetchSubscriptionStatus(asaasSubscriptionId);
    expect(sub.status).toBe("canceled");
    expect(await fetchWorkspacePlan()).toBe("free");
  });
});
