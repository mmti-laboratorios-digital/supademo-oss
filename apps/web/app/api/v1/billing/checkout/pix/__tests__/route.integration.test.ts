import { randomUUID } from "node:crypto";
import { Client } from "pg";
/**
 * apps/web/app/api/v1/billing/checkout/pix/__tests__/route.integration.test.ts
 *
 * F4.8 — QR Code do PIX na tela de checkout.
 *
 * ⚠️ Antes, a página `/billing/checkout` dizia "pague com PIX" mas **não
 * mostrava o QR Code** — o creator tinha que abrir o e-mail ou o link de
 * pagamento. O QR Code dinâmico do Asaas só vem de
 * `GET /v3/payments/{id}/pixQrCode`, que exige a API key — então a chamada
 * precisa sair do servidor.
 *
 * Este teste cobre:
 *   1. o endpoint devolve a imagem (base64) e o código copia-e-cola;
 *   2. o base64 **sem** prefixo `data:` é normalizado (produção do Asaas);
 *   3. assinatura já paga → não há QR Code;
 *   4. assinatura sem `asaas_payment_id` (pré-migration 0006) → fallback;
 *   5. o creator de outro workspace não acessa o QR Code alheio.
 *
 * Usa Postgres real e o mock server do Asaas (`MOCK_ASAAS_URL`).
 */
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

const MOCK_ASAAS_URL = process.env.MOCK_ASAAS_URL ?? "http://127.0.0.1:65500";
process.env.MOCK_ASAAS_URL = MOCK_ASAAS_URL;
process.env.ASAAS_API_KEY = "mock_api_key";

const mockRequireAuth = vi.fn();
vi.mock("@/lib/auth", async () => {
  return {
    requireAuth: () => mockRequireAuth(),
  };
});

const APP_OWNER_URL =
  process.env.DIRECT_URL ??
  process.env.DATABASE_URL?.replace("app_user", "app_owner") ??
  "postgres://app_owner:easydemo@127.0.0.1:55432/easydemo";

let adminClient: Client;
let workspaceId: string;
let otherWorkspaceId: string;

async function authAs(wsId: string) {
  mockRequireAuth.mockResolvedValueOnce({ userId: "user_1", orgId: wsId, role: "owner" });
}

/**
 * Insere uma assinatura **local** (no Postgres).
 *
 * ⚠️ Nome diferente de propósito: existe também o `createSubscription` do
 * Asaas (importado dinamicamente nos testes). Com o mesmo nome, o helper local
 * sobrescreveria o import dentro do bloco e o teste chamaria a função errada
 * — foi exatamente o que aconteceu na primeira rodada.
 */
async function insertSubscription(opts: {
  workspaceId: string;
  paymentId: string | null;
  status: string;
}): Promise<void> {
  await adminClient.query(
    `INSERT INTO app.subscriptions
       (workspace_id, plan_id, asaas_subscription_id, asaas_payment_id, status)
     VALUES ($1, 'pro', $2, $3, $4)`,
    [opts.workspaceId, `sub_${randomUUID().slice(0, 8)}`, opts.paymentId, opts.status],
  );
}

beforeAll(async () => {
  adminClient = new Client({ connectionString: APP_OWNER_URL });
  await adminClient.connect();
  await adminClient.query("DELETE FROM app.workspaces WHERE slug LIKE 'f4-pix-%'");

  const a = await adminClient.query<{ id: string }>(
    `INSERT INTO app.workspaces (slug, name, plan_id)
     VALUES ('f4-pix-a', 'PIX Test A', 'free') RETURNING id`,
  );
  workspaceId = a.rows[0]?.id ?? "";

  const b = await adminClient.query<{ id: string }>(
    `INSERT INTO app.workspaces (slug, name, plan_id)
     VALUES ('f4-pix-b', 'PIX Test B', 'free') RETURNING id`,
  );
  otherWorkspaceId = b.rows[0]?.id ?? "";
});

afterAll(async () => {
  await adminClient.query("DELETE FROM app.subscriptions WHERE workspace_id = ANY($1::uuid[])", [
    [workspaceId, otherWorkspaceId],
  ]);
  await adminClient.query("DELETE FROM app.workspaces WHERE id = ANY($1::uuid[])", [
    [workspaceId, otherWorkspaceId],
  ]);
  await adminClient.end();
});

beforeEach(async () => {
  await adminClient.query("DELETE FROM app.subscriptions WHERE workspace_id = ANY($1::uuid[])", [
    [workspaceId, otherWorkspaceId],
  ]);
});

describe("pixQrCodeDataUrl", () => {
  it("normaliza base64 puro em data URL (formato da produção do Asaas)", async () => {
    const { pixQrCodeDataUrl } = await import("@/lib/billing/asaas");
    expect(pixQrCodeDataUrl("iVBORw0KGgo=")).toBe("data:image/png;base64,iVBORw0KGgo=");
  });

  it("mantém o data URL quando o Asaas já devolve com prefixo (sandbox)", async () => {
    const { pixQrCodeDataUrl } = await import("@/lib/billing/asaas");
    const withPrefix = "data:image/png;base64,iVBORw0KGgo=";
    expect(pixQrCodeDataUrl(withPrefix)).toBe(withPrefix);
  });

  it("devolve null para imagem ausente ou vazia", async () => {
    const { pixQrCodeDataUrl } = await import("@/lib/billing/asaas");
    expect(pixQrCodeDataUrl(undefined)).toBeNull();
    expect(pixQrCodeDataUrl("   ")).toBeNull();
  });
});

describe("/api/v1/billing/checkout/pix", () => {
  it("devolve o QR Code (imagem base64) e o código copia-e-cola", async () => {
    // Cria a cobrança no mock do Asaas para ter um paymentId real.
    const { createPayment } = await import("@/lib/billing/asaas");
    const { createCustomer, createSubscription } = await import("@/lib/billing/asaas");
    const customer = await createCustomer({ name: "PIX Test", email: "pix@example.com" });
    const sub = await createSubscription({
      customer: customer.id,
      valueCents: 4900,
      billingType: "PIX",
    });
    const payment = await createPayment({
      customer: customer.id,
      subscription: sub.id,
      value: 4900,
      dueDate: new Date().toISOString().slice(0, 10),
      billingType: "PIX",
    });

    await insertSubscription({
      workspaceId,
      paymentId: payment.id,
      status: "incomplete",
    });

    authAs(workspaceId);
    const { GET } = await import("../route");
    const res = await GET();
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.paid).toBe(false);
    // Base64 puro do mock → normalizado em data URL.
    expect(body.qrCode).toMatch(/^data:image\/png;base64,/);
    expect(body.payload).toContain("br.gov.bcb.pix");
  });

  it("assinatura já paga → sem QR Code", async () => {
    await insertSubscription({
      workspaceId,
      paymentId: "pay_qualquer",
      status: "active",
    });

    authAs(workspaceId);
    const { GET } = await import("../route");
    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.paid).toBe(true);
    expect(body.qrCode).toBeNull();
  });

  it("assinatura sem asaas_payment_id (pré-migration 0006) → fallback", async () => {
    await insertSubscription({ workspaceId, paymentId: null, status: "incomplete" });

    authAs(workspaceId);
    const { GET } = await import("../route");
    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.paid).toBe(false);
    expect(body.qrCode).toBeNull();
    expect(body.reason).toBe("NO_PAYMENT_ID");
  });

  it("nunca devolve o QR Code de outro workspace", async () => {
    const { createPayment, createCustomer, createSubscription } = await import(
      "@/lib/billing/asaas"
    );
    const customer = await createCustomer({ name: "PIX Other", email: "other@example.com" });
    const sub = await createSubscription({
      customer: customer.id,
      valueCents: 4900,
      billingType: "PIX",
    });
    const payment = await createPayment({
      customer: customer.id,
      subscription: sub.id,
      value: 4900,
      dueDate: new Date().toISOString().slice(0, 10),
      billingType: "PIX",
    });

    // A cobrança é do workspace A…
    await insertSubscription({
      workspaceId,
      paymentId: payment.id,
      status: "incomplete",
    });

    // …mas o workspace B pede o QR Code.
    authAs(otherWorkspaceId);
    const { GET } = await import("../route");
    const res = await GET();
    expect(res.status).toBe(404);
  });

  it("retorna 401 quando não autenticado", async () => {
    mockRequireAuth.mockRejectedValueOnce(new Error("UNAUTHORIZED"));
    const { GET } = await import("../route");
    const res = await GET();
    expect(res.status).toBe(401);
    expect(await res.json()).toMatchObject({ error: "UNAUTHORIZED" });
  });
});
