/**
 * apps/workers/src/tasks/__tests__/sync_billing.integration.test.ts
 *
 * Reconciliação de billing com o Asaas.
 *
 * ⚠️ **O que este job fecha:**
 *
 * O plano do workspace no EasyDemo é derivado de **eventos** do Asaas. Cada
 * evento pode se perder (retry que não chega, timeout, falha do nosso banco).
 * E as consequências são assimétricas:
 *
 *   1. **Pagamento confirmado perdido** → o creator **pagou** e continua no
 *      Free. O job de expurgo (`purge_expired_subscriptions`) **não** corrige
 *      isso de propósito — ele só rebaixa, nunca promove (promover quem não
 *      pagou seria dar Pro de graça).
 *   2. **Inativação perdida** → o creator cancelou e continua no plano pago
 *      para sempre, sem pagar.
 *
 * Este teste usa o **mock do Asaas** (`packages/shared/src/test-utils/mock-asaas.ts`)
 * para exercitar a reconciliação de verdade — HTTP real, JSON real, status
 * real.
 */
import { randomUUID } from "node:crypto";
import { type MockAsaasServer, startMockAsaas } from "@easydemo/shared/test-utils/mock-asaas";
// ⚠️ `pg` é CommonJS — o import default funciona em ESM (vitest e tsx).
import pg from "pg";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

const { Client } = pg;

const APP_OWNER_URL =
  process.env.DIRECT_URL ??
  process.env.DATABASE_URL?.replace("app_user", "app_owner") ??
  "postgres://app_owner:easydemo@127.0.0.1:55432/easydemo";

let adminClient: pg.Client;
let mock: MockAsaasServer;
let workspaceIds: string[] = [];

/** Data no formato do Asaas (`YYYY-MM-DD`), N dias à frente/tras de hoje. */
function asaasDateIn(days: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

async function createWorkspace(planId: "free" | "pro" | "business"): Promise<string> {
  const slug = `sync-${randomUUID().slice(0, 8)}`;
  const { rows } = await adminClient.query<{ id: string }>(
    `INSERT INTO app.workspaces (slug, name, plan_id)
     VALUES ($1, 'Sync Test', $2) RETURNING id`,
    [slug, planId],
  );
  const id = rows[0]?.id ?? "";
  workspaceIds.push(id);
  return id;
}

async function createSubscription(opts: {
  workspaceId: string;
  planId: string;
  asaasSubscriptionId: string;
  status: string;
  cancelAtPeriodEnd?: boolean;
  periodEnd?: Date | null;
}): Promise<string> {
  const { rows } = await adminClient.query<{ id: string }>(
    `INSERT INTO app.subscriptions
       (workspace_id, plan_id, asaas_subscription_id, status, cancel_at_period_end,
        current_period_end, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, now(), now())
     RETURNING id`,
    [
      opts.workspaceId,
      opts.planId,
      opts.asaasSubscriptionId,
      opts.status,
      opts.cancelAtPeriodEnd ?? false,
      opts.periodEnd ?? null,
    ],
  );
  return rows[0]?.id ?? "";
}

async function planOf(workspaceId: string): Promise<string | null> {
  const { rows } = await adminClient.query<{ plan_id: string }>(
    "SELECT plan_id FROM app.workspaces WHERE id = $1",
    [workspaceId],
  );
  return rows[0]?.plan_id ?? null;
}

/** Estado local da subscription (o que o job reconcilia). */
type SubState = {
  status: string;
  cancel_at_period_end: boolean;
  current_period_end: Date | null;
};

async function subState(workspaceId: string): Promise<SubState | null> {
  const { rows } = await adminClient.query<SubState>(
    `SELECT status, cancel_at_period_end, current_period_end
     FROM app.subscriptions WHERE workspace_id = $1 ORDER BY created_at DESC LIMIT 1`,
    [workspaceId],
  );
  return rows[0] ?? null;
}

beforeAll(async () => {
  adminClient = new pg.Client({ connectionString: APP_OWNER_URL });
  await adminClient.connect();

  mock = await startMockAsaas({ port: 65512, silent: true });
  process.env.MOCK_ASAAS_URL = mock.url;
  // A API key é exigida pelo client do worker — valor fictício (o mock não
  // valida).
  process.env.ASAAS_API_KEY = "test-key";
});

afterAll(async () => {
  await mock?.stop();
  await adminClient.end();
});

beforeEach(async () => {
  mock.reset();
  if (workspaceIds.length > 0) {
    await adminClient.query("DELETE FROM app.subscriptions WHERE workspace_id = ANY($1::uuid[])", [
      workspaceIds,
    ]);
    await adminClient.query("DELETE FROM app.workspaces WHERE id = ANY($1::uuid[])", [
      workspaceIds,
    ]);
    workspaceIds = [];
  }
});

describe("sync_billing", () => {
  it("PROMOVE o workspace quando o Asaas confirma assinatura ativa (webhook de pagamento perdido)", async () => {
    const ws = await createWorkspace("free");
    const asaasId = `sub_${randomUUID().slice(0, 12)}`;
    await createSubscription({
      workspaceId: ws,
      planId: "pro",
      asaasSubscriptionId: asaasId,
      status: "incomplete", // ← checkout iniciado, pagamento nunca confirmado
    });
    // No Asaas a assinatura está ATIVA (o pagamento entrou).
    mock.seedSubscription({ id: asaasId, status: "ACTIVE", nextDueDate: asaasDateIn(20) });

    const { syncBilling } = await import("../sync_billing");
    await syncBilling({ asaasSubscriptionId: asaasId }, {} as never);

    expect(await planOf(ws)).toBe("pro");
  });

  it("NÃO promove quando o Asaas diz que a assinatura está incompleta (não pagou)", async () => {
    const ws = await createWorkspace("free");
    const asaasId = `sub_${randomUUID().slice(0, 12)}`;
    await createSubscription({
      workspaceId: ws,
      planId: "pro",
      asaasSubscriptionId: asaasId,
      status: "incomplete",
    });
    mock.seedSubscription({ id: asaasId, status: "INACTIVE", nextDueDate: asaasDateIn(20) });

    const { syncBilling } = await import("../sync_billing");
    await syncBilling({ asaasSubscriptionId: asaasId }, {} as never);

    expect(await planOf(ws)).toBe("free");
  });

  it("NÃO promove quando o Asaas diz inadimplente (past_due)", async () => {
    const ws = await createWorkspace("free");
    const asaasId = `sub_${randomUUID().slice(0, 12)}`;
    await createSubscription({
      workspaceId: ws,
      planId: "pro",
      asaasSubscriptionId: asaasId,
      status: "incomplete",
    });
    mock.seedSubscription({ id: asaasId, status: "OVERDUE", nextDueDate: asaasDateIn(20) });

    const { syncBilling } = await import("../sync_billing");
    await syncBilling({ asaasSubscriptionId: asaasId }, {} as never);

    expect(await planOf(ws)).toBe("free");
  });

  it("REBAIXA para Free quando a assinatura morreu e o período pago já acabou", async () => {
    const ws = await createWorkspace("pro");
    const asaasId = `sub_${randomUUID().slice(0, 12)}`;
    await createSubscription({
      workspaceId: ws,
      planId: "pro",
      asaasSubscriptionId: asaasId,
      status: "active",
      cancelAtPeriodEnd: false,
      periodEnd: new Date(Date.now() - 24 * 60 * 60 * 1000), // ontem
    });
    mock.seedSubscription({
      id: asaasId,
      status: "INACTIVE",
      cancelAtPeriodEnd: true,
      nextDueDate: asaasDateIn(-5),
    });

    const { syncBilling } = await import("../sync_billing");
    await syncBilling({ asaasSubscriptionId: asaasId }, {} as never);

    expect(await planOf(ws)).toBe("free");
  });

  it("NÃO rebaixa quem cancelou mas ainda está dentro do ciclo pago", async () => {
    const ws = await createWorkspace("pro");
    const asaasId = `sub_${randomUUID().slice(0, 12)}`;
    await createSubscription({
      workspaceId: ws,
      planId: "pro",
      asaasSubscriptionId: asaasId,
      status: "active",
      cancelAtPeriodEnd: false,
      periodEnd: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // daqui a 7 dias
    });
    mock.seedSubscription({
      id: asaasId,
      status: "ACTIVE",
      cancelAtPeriodEnd: true, // cancelamento agendado, mas o ciclo continua
      nextDueDate: asaasDateIn(7),
    });

    const { syncBilling } = await import("../sync_billing");
    await syncBilling({ asaasSubscriptionId: asaasId }, {} as never);

    // O creator pagou o ciclo — mantém o plano até o vencimento.
    expect(await planOf(ws)).toBe("pro");
  });

  it("NÃO rebaixa quem fez upgrade para um plano superior", async () => {
    const ws = await createWorkspace("business");
    const asaasId = `sub_${randomUUID().slice(0, 12)}`;
    await createSubscription({
      workspaceId: ws,
      planId: "pro", // a assinatura antiga é do Pro…
      asaasSubscriptionId: asaasId,
      status: "active",
      cancelAtPeriodEnd: false,
      periodEnd: new Date(Date.now() - 24 * 60 * 60 * 1000),
    });
    mock.seedSubscription({
      id: asaasId,
      status: "INACTIVE",
      cancelAtPeriodEnd: true,
      nextDueDate: asaasDateIn(-5),
    });

    const { syncBilling } = await import("../sync_billing");
    await syncBilling({ asaasSubscriptionId: asaasId }, {} as never);

    // O workspace está em Business — rebaixar para Free seria errado.
    expect(await planOf(ws)).toBe("business");
  });

  it("reconcilia o status e o cancel_at_period_end da subscription local", async () => {
    const ws = await createWorkspace("pro");
    const asaasId = `sub_${randomUUID().slice(0, 12)}`;
    await createSubscription({
      workspaceId: ws,
      planId: "pro",
      asaasSubscriptionId: asaasId,
      status: "active",
      cancelAtPeriodEnd: false,
    });
    mock.seedSubscription({
      id: asaasId,
      status: "ACTIVE",
      cancelAtPeriodEnd: true,
      nextDueDate: asaasDateIn(12),
    });

    const { syncBilling } = await import("../sync_billing");
    await syncBilling({ asaasSubscriptionId: asaasId }, {} as never);

    const state = await subState(ws);
    expect(state?.cancel_at_period_end).toBe(true);
    expect(state?.status).toBe("active");
  });

  it("atualiza o fim do período a partir do nextDueDate do Asaas", async () => {
    const ws = await createWorkspace("pro");
    const asaasId = `sub_${randomUUID().slice(0, 12)}`;
    await createSubscription({
      workspaceId: ws,
      planId: "pro",
      asaasSubscriptionId: asaasId,
      status: "active",
    });
    mock.seedSubscription({ id: asaasId, status: "ACTIVE", nextDueDate: asaasDateIn(12) });

    const { syncBilling } = await import("../sync_billing");
    await syncBilling({ asaasSubscriptionId: asaasId }, {} as never);

    const state = await subState(ws);
    expect(state?.current_period_end).not.toBeNull();
    // O fim do período deve estar no mesmo dia que o nextDueDate do Asaas.
    const expectedDay = asaasDateIn(12);
    const actual = state?.current_period_end?.toISOString().slice(0, 10);
    expect(actual).toBe(expectedDay);
  });

  it("o SWEEP (cron) reconcilia todas as subscriptions, sem payload", async () => {
    const ws1 = await createWorkspace("free");
    const ws2 = await createWorkspace("pro");
    const id1 = `sub_${randomUUID().slice(0, 12)}`;
    const id2 = `sub_${randomUUID().slice(0, 12)}`;
    await createSubscription({
      workspaceId: ws1,
      planId: "pro",
      asaasSubscriptionId: id1,
      status: "incomplete",
    });
    await createSubscription({
      workspaceId: ws2,
      planId: "pro",
      asaasSubscriptionId: id2,
      status: "active",
      periodEnd: new Date(Date.now() - 24 * 60 * 60 * 1000),
    });
    mock.seedSubscription({ id: id1, status: "ACTIVE", nextDueDate: asaasDateIn(20) });
    mock.seedSubscription({
      id: id2,
      status: "INACTIVE",
      cancelAtPeriodEnd: true,
      nextDueDate: asaasDateIn(-5),
    });

    const { syncBilling } = await import("../sync_billing");
    // ⚠️ Sem payload → modo sweep (é o que o cron executa).
    await syncBilling({}, {} as never);

    expect(await planOf(ws1)).toBe("pro"); // promovido
    expect(await planOf(ws2)).toBe("free"); // rebaixado
  });

  it("NÃO rebaixa nem promove nada quando o Asaas não conhece a assinatura", async () => {
    const ws = await createWorkspace("pro");
    const asaasId = `sub_${randomUUID().slice(0, 12)}`;
    await createSubscription({
      workspaceId: ws,
      planId: "pro",
      asaasSubscriptionId: asaasId,
      status: "active",
    });
    // ⚠️ Nada semeado no mock → o GET devolve 404.

    const { syncBilling } = await import("../sync_billing");
    await syncBilling({ asaasSubscriptionId: asaasId }, {} as never);

    // Uma falha da API do Asaas **não** pode rebaixar ninguém.
    expect(await planOf(ws)).toBe("pro");
  });

  it("não falha quando a assinatura não existe no banco local", async () => {
    const { syncBilling } = await import("../sync_billing");
    await expect(
      syncBilling({ asaasSubscriptionId: "sub_inexistente" }, {} as never),
    ).resolves.not.toThrow();
  });

  it("é idempotente — rodar duas vezes não muda nada", async () => {
    const ws = await createWorkspace("free");
    const asaasId = `sub_${randomUUID().slice(0, 12)}`;
    await createSubscription({
      workspaceId: ws,
      planId: "pro",
      asaasSubscriptionId: asaasId,
      status: "incomplete",
    });
    mock.seedSubscription({ id: asaasId, status: "ACTIVE", nextDueDate: asaasDateIn(20) });

    const { syncBilling } = await import("../sync_billing");
    await syncBilling({ asaasSubscriptionId: asaasId }, {} as never);
    expect(await planOf(ws)).toBe("pro");

    await syncBilling({ asaasSubscriptionId: asaasId }, {} as never);
    expect(await planOf(ws)).toBe("pro");
  });

  it("atualiza o updated_at mesmo sem mudança — para o sweep rotacionar", async () => {
    // ⚠️ O sweep ordena por `updated_at ASC` e tem um limite. Se o
    // `updated_at` só fosse atualizado quando algo mudasse, as rows
    // estáveis ficariam eternamente na frente do limite e as assinaturas
    // novas nunca seriam reconciliadas.
    const ws = await createWorkspace("pro");
    const asaasId = `sub_${randomUUID().slice(0, 12)}`;
    await createSubscription({
      workspaceId: ws,
      planId: "pro",
      asaasSubscriptionId: asaasId,
      status: "active",
    });
    mock.seedSubscription({ id: asaasId, status: "ACTIVE", nextDueDate: asaasDateIn(20) });

    // Deixa o updated_at no passado (seria o fim da fila do sweep).
    await adminClient.query(
      "UPDATE app.subscriptions SET updated_at = now() - interval '10 days' WHERE workspace_id = $1",
      [ws],
    );

    const { syncBilling } = await import("../sync_billing");
    await syncBilling({ asaasSubscriptionId: asaasId }, {} as never);

    const { rows } = await adminClient.query<{ updated_at: Date }>(
      "SELECT updated_at FROM app.subscriptions WHERE workspace_id = $1",
      [ws],
    );
    const updated = rows[0]?.updated_at ?? new Date(0);
    // Recente (< 1 minuto atrás) — o `updated_at` foi tocado.
    expect(Date.now() - updated.getTime()).toBeLessThan(60_000);
  });
});
