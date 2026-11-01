import { createHmac, randomUUID } from "node:crypto";
import pg from "pg";
/**
 * apps/web/app/api/__tests__/webhook-asaas.script.test.ts
 * -----------------------------------------------------------------------------
 * Checks do webhook Asaas rodados pelo `pnpm scripts:test-webhook-asaas`.
 *
 * ⚠️ **Por que um arquivo de teste e não um script solto?** Porque
 * `vi.mock` só funciona dentro do runner do vitest. O script
 * (`scripts/test-webhook-asaas.ts`) é executado com `tsx` — fora do runner —
 * e a versão anterior dele exigia um Next.js rodando em `$BASE` e lia o
 * status por uma rota (`/api/v1/billing/subscriptions/:id`) que nunca
 * existiu. Este arquivo roda contra o handler real + Postgres real, sem
 * servidor.
 *
 * Cobre (gate G3):
 *   1. webhook sem auth → 401 MISSING_AUTH;
 *   2. assinatura HMAC inválida → 401 INVALID_SIGNATURE;
 *   3. `PAYMENT_RECEIVED` → subscription active **e** plano promovido;
 *   4. reenvio do mesmo `payment.id` → idempotente;
 *   5. `PAYMENT_OVERDUE` → past_due;
 *   6. `PAYMENT_REFUNDED` → canceled + volta para Free;
 *   7. `SUBSCRIPTION_INACTIVATED` com período vencido → Free;
 *   8. `SUBSCRIPTION_INACTIVATED` dentro do ciclo → plano mantido.
 */
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

// ---------------------------------------------------------------------------
// Env — setado ANTES de importar o route (que chama env())
// ---------------------------------------------------------------------------
const WEBHOOK_SECRET = process.env.ASAAS_WEBHOOK_SECRET ?? "mock_webhook_secret_for_sandbox";
process.env.ASAAS_WEBHOOK_SECRET = WEBHOOK_SECRET;
process.env.ASAAS_API_KEY = process.env.ASAAS_API_KEY ?? "mock_api_key";

// ---------------------------------------------------------------------------
// Mocks
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

vi.mock("@/lib/queue", async () => {
  return {
    enqueue: vi.fn(async () => "mock-job-id"),
  };
});

// ---------------------------------------------------------------------------
// DB
// ---------------------------------------------------------------------------
const APP_OWNER_URL =
  process.env.DIRECT_URL ??
  process.env.DATABASE_URL?.replace("app_user", "app_owner") ??
  "postgres://app_owner:easydemo@127.0.0.1:55432/easydemo";

let adminClient: pg.Client;
let workspaceId: string;

beforeAll(async () => {
  adminClient = new pg.Client({ connectionString: APP_OWNER_URL });
  await adminClient.connect();

  await adminClient.query("DELETE FROM app.workspaces WHERE slug LIKE 'script-asaas-%'");
  const w = await adminClient.query<{ id: string }>(
    `INSERT INTO app.workspaces (slug, name, plan_id)
     VALUES ($1, 'Script Asaas Test', 'free') RETURNING id`,
    [`script-asaas-${randomUUID().slice(0, 8)}`],
  );
  workspaceId = w.rows[0].id;
});

afterAll(async () => {
  await adminClient.query("DELETE FROM app.workspaces WHERE id = $1", [workspaceId]);
  await adminClient.end();
});

beforeEach(async () => {
  await adminClient.query("DELETE FROM app.subscriptions WHERE workspace_id = $1", [workspaceId]);
  await adminClient.query("UPDATE app.workspaces SET plan_id = 'free' WHERE id = $1", [
    workspaceId,
  ]);
  mockHeaders.clear();
});

async function workspacePlan(): Promise<string> {
  const r = await adminClient.query<{ plan_id: string }>(
    "SELECT plan_id FROM app.workspaces WHERE id = $1",
    [workspaceId],
  );
  return r.rows[0].plan_id;
}

async function subscriptionRow(): Promise<
  { status: string; plan_id: string; cancel_at_period_end: boolean } | undefined
> {
  const r = await adminClient.query<{
    status: string;
    plan_id: string;
    cancel_at_period_end: boolean;
  }>(
    `SELECT status, plan_id, cancel_at_period_end
       FROM app.subscriptions
      WHERE workspace_id = $1
      ORDER BY created_at DESC
      LIMIT 1`,
    [workspaceId],
  );
  return r.rows[0];
}

async function insertSubscription(
  asaasSubscriptionId: string,
  opts: { planId?: string; status?: string; periodEnd?: Date | null } = {},
): Promise<void> {
  await adminClient.query(
    `INSERT INTO app.subscriptions
       (workspace_id, plan_id, asaas_subscription_id, status, current_period_end)
     VALUES ($1, $2, $3, $4, $5)`,
    [
      workspaceId,
      opts.planId ?? "pro",
      asaasSubscriptionId,
      opts.status ?? "incomplete",
      opts.periodEnd ?? null,
    ],
  );
}

async function postWebhook(
  rawBody: string,
  signature: string | null,
): Promise<{ status: number; body: Record<string, unknown> }> {
  mockHeaders.clear();
  if (signature) mockHeaders.set("asaas-signature", signature);

  const { POST } = await import("../webhooks/asaas/route");
  const res = await POST(
    new Request("http://localhost/api/webhooks/asaas", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: rawBody,
    }),
  );
  return {
    status: res.status,
    body: (await res.json().catch(() => ({}))) as Record<string, unknown>,
  };
}

function sign(payload: string): string {
  return createHmac("sha256", WEBHOOK_SECRET).update(payload).digest("hex");
}

describe("webhook Asaas — gate G3 (script de validação)", () => {
  it("1. sem header de auth → 401 MISSING_AUTH", async () => {
    const r = await postWebhook(JSON.stringify({ event: "PAYMENT_RECEIVED" }), null);
    expect(r.status).toBe(401);
    expect(r.body.error).toBe("MISSING_AUTH");
  });

  it("2. assinatura HMAC inválida → 401 INVALID_SIGNATURE", async () => {
    const r = await postWebhook(JSON.stringify({ event: "PAYMENT_RECEIVED" }), "a".repeat(64));
    expect(r.status).toBe(401);
    expect(r.body.error).toBe("INVALID_SIGNATURE");
  });

  it("3. PAYMENT_RECEIVED → subscription active e plano promovido", async () => {
    const subId = `asaas_sub_script_${randomUUID().slice(0, 8)}`;
    await insertSubscription(subId);

    const rawBody = JSON.stringify({
      event: "PAYMENT_RECEIVED",
      payment: {
        id: `pay_script_${randomUUID().slice(0, 8)}`,
        customer: "cus_script",
        subscription: subId,
        value: 4900,
        billingType: "PIX",
        status: "RECEIVED",
      },
    });
    const r = await postWebhook(rawBody, sign(rawBody));
    expect(r.status).toBe(200);
    expect((await subscriptionRow())?.status).toBe("active");
    expect(await workspacePlan()).toBe("pro");
  });

  it("4. reenvio do mesmo payment.id → idempotente", async () => {
    const subId = `asaas_sub_script_${randomUUID().slice(0, 8)}`;
    await insertSubscription(subId);

    const rawBody = JSON.stringify({
      event: "PAYMENT_RECEIVED",
      payment: {
        id: `pay_idem_${randomUUID().slice(0, 8)}`,
        customer: "cus_script",
        subscription: subId,
        value: 4900,
        billingType: "PIX",
        status: "RECEIVED",
      },
    });

    const r1 = await postWebhook(rawBody, sign(rawBody));
    expect(r1.status).toBe(200);
    expect(r1.body.deduplicated).toBeFalsy();
    const planAfter1 = await workspacePlan();

    const r2 = await postWebhook(rawBody, sign(rawBody));
    expect(r2.status).toBe(200);
    expect(r2.body.deduplicated).toBe(true);
    // Nenhum efeito duplicado.
    expect(await workspacePlan()).toBe(planAfter1);
    expect((await subscriptionRow())?.status).toBe("active");
  });

  it("5. PAYMENT_OVERDUE → past_due", async () => {
    const subId = `asaas_sub_script_${randomUUID().slice(0, 8)}`;
    await insertSubscription(subId);

    const rawBody = JSON.stringify({
      event: "PAYMENT_OVERDUE",
      payment: {
        id: `pay_overdue_${randomUUID().slice(0, 8)}`,
        customer: "cus_script",
        subscription: subId,
        value: 4900,
        billingType: "BOLETO",
        status: "OVERDUE",
      },
    });
    const r = await postWebhook(rawBody, sign(rawBody));
    expect(r.status).toBe(200);
    expect((await subscriptionRow())?.status).toBe("past_due");
  });

  it("6. PAYMENT_REFUNDED → canceled e volta para Free", async () => {
    const subId = `asaas_sub_script_${randomUUID().slice(0, 8)}`;
    await insertSubscription(subId, { status: "active" });
    await adminClient.query("UPDATE app.workspaces SET plan_id = 'pro' WHERE id = $1", [
      workspaceId,
    ]);

    const rawBody = JSON.stringify({
      event: "PAYMENT_REFUNDED",
      payment: {
        id: `pay_refund_${randomUUID().slice(0, 8)}`,
        customer: "cus_script",
        subscription: subId,
        value: 4900,
        billingType: "PIX",
        status: "REFUNDED",
      },
    });
    const r = await postWebhook(rawBody, sign(rawBody));
    expect(r.status).toBe(200);
    expect((await subscriptionRow())?.status).toBe("canceled");
    expect(await workspacePlan()).toBe("free");
  });

  it("7. SUBSCRIPTION_INACTIVATED com período vencido → Free", async () => {
    const subId = `asaas_sub_expired_${randomUUID().slice(0, 8)}`;
    await insertSubscription(subId, {
      status: "active",
      periodEnd: new Date(Date.now() - 86_400_000),
    });
    await adminClient.query("UPDATE app.workspaces SET plan_id = 'pro' WHERE id = $1", [
      workspaceId,
    ]);

    const rawBody = JSON.stringify({
      event: "SUBSCRIPTION_INACTIVATED",
      subscription: {
        id: subId,
        customer: "cus_script",
        status: "INACTIVE",
        value: 4900,
      },
    });
    const r = await postWebhook(rawBody, sign(rawBody));
    expect(r.status).toBe(200);
    expect(await workspacePlan()).toBe("free");
  });

  it("8. SUBSCRIPTION_INACTIVATED dentro do ciclo → mantém o plano", async () => {
    const subId = `asaas_sub_live_${randomUUID().slice(0, 8)}`;
    await insertSubscription(subId, {
      status: "active",
      periodEnd: new Date(Date.now() + 15 * 86_400_000),
    });
    await adminClient.query("UPDATE app.workspaces SET plan_id = 'pro' WHERE id = $1", [
      workspaceId,
    ]);

    const rawBody = JSON.stringify({
      event: "SUBSCRIPTION_INACTIVATED",
      subscription: {
        id: subId,
        customer: "cus_script",
        status: "INACTIVE",
        value: 4900,
      },
    });
    const r = await postWebhook(rawBody, sign(rawBody));
    expect(r.status).toBe(200);
    // O creator pagou o ciclo — o plano permanece até o fim.
    expect(await workspacePlan()).toBe("pro");
    expect((await subscriptionRow())?.cancel_at_period_end).toBe(true);
  });
});
