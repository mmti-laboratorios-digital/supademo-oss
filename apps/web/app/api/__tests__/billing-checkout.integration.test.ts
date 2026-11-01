import { randomUUID } from "node:crypto";
import { Client } from "pg";
/**
 * apps/web/app/api/__tests__/billing-checkout.integration.test.ts
 *
 * Gate G3 — os 4 critérios de aceitação do billing:
 *
 *   1. Checkout sandbox abre e o webhook `PAYMENT_CONFIRMED` muda o plano;
 *   2. O plano do workspace aparece correto em `/billing`;
 *   3. Criar 4º demo no Free é bloqueado com mensagem de upgrade;
 *   4. Cancelamento volta ao Free no fim do ciclo.
 *
 * Usa Postgres real e o mock server do Asaas (sobe no `vitest.globalSetup.ts`
 * em `MOCK_ASAAS_URL`). Mocka apenas o Clerk (`requireAuth`).
 */
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

// ---------------------------------------------------------------------------
// Env — precisa estar setado ANTES de importar o route (que chama env())
// ---------------------------------------------------------------------------
const MOCK_ASAAS_URL = process.env.MOCK_ASAAS_URL ?? "http://127.0.0.1:65500";
process.env.MOCK_ASAAS_URL = MOCK_ASAAS_URL;
process.env.ASAAS_API_KEY = "mock_api_key";
process.env.ASAAS_WEBHOOK_SECRET = "mock_webhook_secret_for_sandbox";

const mockRequireAuth = vi.fn();
vi.mock("@/lib/auth", async () => {
  return {
    requireAuth: () => mockRequireAuth(),
  };
});

// Mock do Clerk (currentUser) — usado no checkout para achar o e-mail.
vi.mock("@clerk/nextjs/server", async () => {
  return {
    currentUser: async () => ({
      primaryEmailAddressId: "email_1",
      emailAddresses: [{ id: "email_1", emailAddress: "creator@example.com" }],
    }),
    auth: async () => ({ userId: "user_1", orgId: null, orgRole: null }),
    clerkClient: async () => ({}),
  };
});

// Mock da fila — o sandbox não tem graphile-worker rodando.
vi.mock("@/lib/queue", async () => {
  return {
    enqueue: vi.fn(async () => "mock-job-id"),
  };
});

// Mock next/headers para o webhook ler a assinatura injetada.
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

const APP_OWNER_URL =
  process.env.DIRECT_URL ??
  process.env.DATABASE_URL?.replace("app_user", "app_owner") ??
  "postgres://app_owner:easydemo@127.0.0.1:55432/easydemo";

let adminClient: Client;
let workspaceId: string;

beforeAll(async () => {
  adminClient = new Client({ connectionString: APP_OWNER_URL });
  await adminClient.connect();

  await adminClient.query("DELETE FROM app.workspaces WHERE slug LIKE 'f4-gate-%'");

  const w = await adminClient.query<{ id: string }>(
    `INSERT INTO app.workspaces (slug, name, plan_id)
     VALUES ($1, 'F4 Gate G3', 'free') RETURNING id`,
    [`f4-gate-${randomUUID().slice(0, 8)}`],
  );
  workspaceId = w.rows[0].id;
});

afterAll(async () => {
  await adminClient.query("DELETE FROM app.workspaces WHERE id = $1", [workspaceId]);
  await adminClient.end();
});

beforeEach(async () => {
  // Zera o estado entre testes: plano Free, sem subscription, sem demo.
  await adminClient.query("DELETE FROM app.subscriptions WHERE workspace_id = $1", [workspaceId]);
  await adminClient.query("DELETE FROM app.demos WHERE workspace_id = $1", [workspaceId]);
  await adminClient.query("UPDATE app.workspaces SET plan_id = 'free' WHERE id = $1", [
    workspaceId,
  ]);
  mockHeaders.clear();
});

async function authAs() {
  mockRequireAuth.mockResolvedValue({
    userId: "user_1",
    orgId: workspaceId,
    role: "owner" as const,
  });
}

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

// ---------------------------------------------------------------------------
// Critério 1 — checkout sandbox abre
// ---------------------------------------------------------------------------
describe("POST /api/v1/billing/checkout — gate G3", () => {
  it("cria customer + subscription + pagamento e devolve a URL de checkout", async () => {
    await authAs();
    const { POST } = await import("../v1/billing/checkout/route");
    const res = await POST(
      new Request("http://localhost/api/v1/billing/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ plan: "pro" }),
      }),
    );

    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.planId).toBe("pro");
    // O preço vem do banco: R$ 49 = 4900 centavos.
    expect(body.priceBrlCents).toBe(4900);
    expect(body.subscriptionId).toMatch(/^sub_/);
    expect(body.paymentId).toMatch(/^pay_/);
    expect(body.checkoutUrl).toBeTruthy();

    // A row local existe, com status "incomplete" (o plano SÓ muda no webhook).
    const sub = await subscriptionRow();
    expect(sub?.status).toBe("incomplete");
    expect(sub?.plan_id).toBe("pro");
    expect(await workspacePlan()).toBe("free");
  });

  it("o workspaceId do body é ignorado — o checkout usa o da sessão", async () => {
    await authAs();
    const outroWorkspace = await adminClient.query<{ id: string }>(
      `INSERT INTO app.workspaces (slug, name, plan_id)
       VALUES ($1, 'Outro F4', 'free') RETURNING id`,
      [`f4-gate-other-${randomUUID().slice(0, 8)}`],
    );

    const { POST } = await import("../v1/billing/checkout/route");
    const res = await POST(
      new Request("http://localhost/api/v1/billing/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ plan: "pro", workspaceId: outroWorkspace.rows[0].id }),
      }),
    );

    // 403 — o cliente tentou assinar em nome de outro workspace.
    expect(res.status).toBe(403);
    expect((await res.json()).error).toBe("WORKSPACE_MISMATCH");

    await adminClient.query("DELETE FROM app.workspaces WHERE id = $1", [
      outroWorkspace.rows[0].id,
    ]);
  });

  it("plano inválido → 400", async () => {
    await authAs();
    const { POST } = await import("../v1/billing/checkout/route");
    const res = await POST(
      new Request("http://localhost/api/v1/billing/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ plan: "enterprise" }),
      }),
    );
    expect(res.status).toBe(400);
  });

  it("o plano 'free' não tem checkout → 400", async () => {
    await authAs();
    const { POST } = await import("../v1/billing/checkout/route");
    const res = await POST(
      new Request("http://localhost/api/v1/billing/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ plan: "free" }),
      }),
    );
    expect(res.status).toBe(400);
  });

  it("aceita form-urlencoded (o form da página /billing) e redireciona", async () => {
    await authAs();
    const { POST } = await import("../v1/billing/checkout/route");
    const res = await POST(
      new Request("http://localhost/api/v1/billing/checkout?plan=pro", {
        method: "POST",
        headers: {
          "content-type": "application/x-www-form-urlencoded",
          accept: "text/html",
          "sec-fetch-mode": "navigate",
        },
        body: "",
      }),
    );

    expect(res.status).toBe(303);
    const location = res.headers.get("location") ?? "";
    expect(location).toContain("/billing/checkout");
    expect(location).toContain("plan=pro");
  });
});

// ---------------------------------------------------------------------------
// Critério 1 (continuação) — o webhook payment.confirmed muda o plano
// ---------------------------------------------------------------------------
describe("webhook PAYMENT_RECEIVED promove o plano — gate G3", () => {
  it("payment.confirmed muda o workspace de free para pro", async () => {
    // 1) Checkout cria a subscription.
    await authAs();
    const { POST } = await import("../v1/billing/checkout/route");
    const checkoutRes = await POST(
      new Request("http://localhost/api/v1/billing/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ plan: "pro" }),
      }),
    );
    const { subscriptionId } = await checkoutRes.json();

    // 2) O Asaas confirma o pagamento.
    const { signWebhook } = await import("@/lib/billing/asaas");
    const rawBody = JSON.stringify({
      event: "PAYMENT_RECEIVED",
      payment: {
        id: `pay_f4_${randomUUID().slice(0, 8)}`,
        customer: "cus_f4",
        subscription: subscriptionId,
        value: 4900,
        billingType: "PIX",
        status: "RECEIVED",
      },
    });
    mockHeaders.set(
      "asaas-signature",
      signWebhook(rawBody, process.env.ASAAS_WEBHOOK_SECRET as string),
    );

    const { POST: webhookPost } = await import("../webhooks/asaas/route");
    const webhookRes = await webhookPost(
      new Request("http://localhost/api/webhooks/asaas", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: rawBody,
      }),
    );

    expect(webhookRes.status).toBe(200);
    // O plano mudou!
    expect(await workspacePlan()).toBe("pro");
    const sub = await subscriptionRow();
    expect(sub?.status).toBe("active");
  });
});

// ---------------------------------------------------------------------------
// Critério 3 — criar 4º demo no Free é bloqueado
// ---------------------------------------------------------------------------
describe("enforcement de limite do plano — gate G3", () => {
  it("cria 3 demos no Free e bloqueia o 4º com mensagem de upgrade", async () => {
    await authAs();
    const { POST } = await import("../v1/demos/route");

    for (let i = 1; i <= 3; i++) {
      const res = await POST(
        new Request("http://localhost/api/v1/demos", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            title: `Demo ${i} do teste F4`,
            slug: `f4-demo-${i}-${randomUUID().slice(0, 6)}`,
          }),
        }),
      );
      expect(res.status).toBe(201);
    }

    // O 4º estoura o limite do Free (max_demos = 3).
    const res = await POST(
      new Request("http://localhost/api/v1/demos", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          title: "Demo 4 do teste F4",
          slug: `f4-demo-4-${randomUUID().slice(0, 6)}`,
        }),
      }),
    );

    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toBe("PLAN_LIMIT_EXCEEDED");
    expect(body.resource).toBe("demo");
    expect(body.limit).toBe(3);
    expect(body.planId).toBe("free");
    expect(body.message).toMatch(/upgrade/i);
    expect(body.upgradeUrl).toBe("/billing");
  });

  it("no plano Pro o 4º demo é criado (limite ilimitado)", async () => {
    await adminClient.query("UPDATE app.workspaces SET plan_id = 'pro' WHERE id = $1", [
      workspaceId,
    ]);
    await authAs();
    const { POST } = await import("../v1/demos/route");

    for (let i = 1; i <= 4; i++) {
      const res = await POST(
        new Request("http://localhost/api/v1/demos", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            title: `Demo Pro ${i}`,
            slug: `f4-pro-${i}-${randomUUID().slice(0, 6)}`,
          }),
        }),
      );
      expect(res.status).toBe(201);
    }
  });
});

// ---------------------------------------------------------------------------
// Critério 4 — cancelamento volta ao Free no fim do ciclo
// ---------------------------------------------------------------------------
describe("cancelamento — gate G3", () => {
  it("cancelar marca cancel_at_period_end e mantém o plano até o fim do ciclo", async () => {
    // Workspace no plano Pro, com subscription ativa e período ainda corrente.
    await adminClient.query("UPDATE app.workspaces SET plan_id = 'pro' WHERE id = $1", [
      workspaceId,
    ]);
    await adminClient.query(
      `INSERT INTO app.subscriptions
         (workspace_id, plan_id, asaas_subscription_id, status, current_period_end)
       VALUES ($1, 'pro', $2, 'active', now() + interval '30 days')`,
      [workspaceId, `sub_f4_cancel_${randomUUID().slice(0, 8)}`],
    );

    await authAs();
    const { POST } = await import("../v1/billing/cancel/route");
    const res = await POST(
      new Request("http://localhost/api/v1/billing/cancel", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({}),
      }),
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.canceled).toBe(true);

    // A assinatura está cancelada…
    const sub = await subscriptionRow();
    expect(sub?.status).toBe("canceled");
    expect(sub?.cancel_at_period_end).toBe(true);
    // …mas o plano é MANTIDO — o creator pagou o ciclo.
    expect(await workspacePlan()).toBe("pro");
  });

  it("cancelamento com o período já vencido volta para o Free", async () => {
    await adminClient.query("UPDATE app.workspaces SET plan_id = 'pro' WHERE id = $1", [
      workspaceId,
    ]);
    await adminClient.query(
      `INSERT INTO app.subscriptions
         (workspace_id, plan_id, asaas_subscription_id, status, current_period_end)
       VALUES ($1, 'pro', $2, 'active', now() - interval '1 day')`,
      [workspaceId, `sub_f4_expired_${randomUUID().slice(0, 8)}`],
    );

    await authAs();
    const { POST } = await import("../v1/billing/cancel/route");
    const res = await POST(
      new Request("http://localhost/api/v1/billing/cancel", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({}),
      }),
    );

    expect(res.status).toBe(200);
    // Período já acabou → o workspace volta para Free.
    expect(await workspacePlan()).toBe("free");
  });

  it("SUBSCRIPTION_INACTIVATED com o período acabou volta para o Free", async () => {
    await adminClient.query("UPDATE app.workspaces SET plan_id = 'pro' WHERE id = $1", [
      workspaceId,
    ]);
    const asaasSubId = `sub_f4_inact_${randomUUID().slice(0, 8)}`;
    await adminClient.query(
      `INSERT INTO app.subscriptions
         (workspace_id, plan_id, asaas_subscription_id, status, current_period_end)
       VALUES ($1, 'pro', $2, 'active', now() - interval '1 day')`,
      [workspaceId, asaasSubId],
    );

    const { signWebhook } = await import("@/lib/billing/asaas");
    const rawBody = JSON.stringify({
      event: "SUBSCRIPTION_INACTIVATED",
      subscription: {
        id: asaasSubId,
        customer: "cus_f4",
        status: "INACTIVE",
        value: 4900,
      },
    });
    mockHeaders.set(
      "asaas-signature",
      signWebhook(rawBody, process.env.ASAAS_WEBHOOK_SECRET as string),
    );

    const { POST: webhookPost } = await import("../webhooks/asaas/route");
    const res = await webhookPost(
      new Request("http://localhost/api/webhooks/asaas", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: rawBody,
      }),
    );

    expect(res.status).toBe(200);
    expect(await workspacePlan()).toBe("free");
  });

  it("SUBSCRIPTION_INACTIVATED dentro do ciclo mantém o plano", async () => {
    await adminClient.query("UPDATE app.workspaces SET plan_id = 'pro' WHERE id = $1", [
      workspaceId,
    ]);
    const asaasSubId = `sub_f4_inact2_${randomUUID().slice(0, 8)}`;
    await adminClient.query(
      `INSERT INTO app.subscriptions
         (workspace_id, plan_id, asaas_subscription_id, status, current_period_end)
       VALUES ($1, 'pro', $2, 'active', now() + interval '15 days')`,
      [workspaceId, asaasSubId],
    );

    const { signWebhook } = await import("@/lib/billing/asaas");
    const rawBody = JSON.stringify({
      event: "SUBSCRIPTION_INACTIVATED",
      subscription: {
        id: asaasSubId,
        customer: "cus_f4",
        status: "INACTIVE",
        value: 4900,
      },
    });
    mockHeaders.set(
      "asaas-signature",
      signWebhook(rawBody, process.env.ASAAS_WEBHOOK_SECRET as string),
    );

    const { POST: webhookPost } = await import("../webhooks/asaas/route");
    await webhookPost(
      new Request("http://localhost/api/webhooks/asaas", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: rawBody,
      }),
    );

    // O creator pagou o ciclo — o plano permanece até o fim.
    expect(await workspacePlan()).toBe("pro");
  });
});

// ---------------------------------------------------------------------------
// Critério 2 — o plano do workspace aparece correto
// ---------------------------------------------------------------------------
describe("GET /api/v1/billing/subscription — gate G3", () => {
  it("devolve o plano real do workspace", async () => {
    await adminClient.query("UPDATE app.workspaces SET plan_id = 'business' WHERE id = $1", [
      workspaceId,
    ]);
    await authAs();
    const { GET } = await import("../v1/billing/subscription/route");
    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.planId).toBe("business");
  });

  it("sem subscription devolve planId free", async () => {
    await authAs();
    const { GET } = await import("../v1/billing/subscription/route");
    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.planId).toBe("free");
    expect(body.subscription).toBeNull();
  });
});
