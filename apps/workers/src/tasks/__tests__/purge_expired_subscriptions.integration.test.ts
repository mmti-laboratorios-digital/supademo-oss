/**
 * apps/workers/src/tasks/__tests__/purge_expired_subscriptions.integration.test.ts
 *
 * Expurgo de assinatura (débito da F4).
 *
 * ⚠️ O cenário que motivou o job: o creator cancela, o plano é mantido até o
 * fim do ciclo, e o rebaixamento para Free depende do webhook
 * `SUBSCRIPTION_INACTIVATED` chegar. Se ele não chega (retry perdido, trial
 * sem evento), o creator fica **no plano pago para sempre**, sem pagar.
 *
 * Este job é a rede de segurança. O teste garante que ele:
 *   1. rebaixa a assinatura expirada e cancelada;
 *   2. **não** rebaixa quem ainda está dentro do ciclo pago;
 *   3. **não** rebaixa quem renovou (tem outra subscription ativa);
 *   4. **não** rebaixa quem fez upgrade para um plano superior;
 *   5. é idempotente.
 */
import { randomUUID } from "node:crypto";
import pg from "pg";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

const APP_OWNER_URL =
  process.env.DIRECT_URL ??
  process.env.DATABASE_URL?.replace("app_user", "app_owner") ??
  "postgres://app_owner:easydemo@127.0.0.1:55432/easydemo";

let adminClient: pg.Client;
let workspaceIds: string[] = [];

async function createWorkspace(planId: "free" | "pro" | "business"): Promise<string> {
  const slug = `purge-${randomUUID().slice(0, 8)}`;
  const { rows } = await adminClient.query<{ id: string }>(
    `INSERT INTO app.workspaces (slug, name, plan_id)
     VALUES ($1, 'Purge Test', $2) RETURNING id`,
    [slug, planId],
  );
  const id = rows[0]?.id ?? "";
  workspaceIds.push(id);
  return id;
}

async function createSubscription(opts: {
  workspaceId: string;
  planId: string;
  status: string;
  cancelAtPeriodEnd: boolean;
  periodEnd: Date | null;
}): Promise<string> {
  const { rows } = await adminClient.query<{ id: string }>(
    `INSERT INTO app.subscriptions
       (workspace_id, plan_id, status, cancel_at_period_end, current_period_end, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, now(), now())
     RETURNING id`,
    [opts.workspaceId, opts.planId, opts.status, opts.cancelAtPeriodEnd, opts.periodEnd],
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

beforeAll(async () => {
  adminClient = new pg.Client({ connectionString: APP_OWNER_URL });
  await adminClient.connect();
});

afterAll(async () => {
  if (workspaceIds.length > 0) {
    await adminClient.query("DELETE FROM app.subscriptions WHERE workspace_id = ANY($1::uuid[])", [
      workspaceIds,
    ]);
    await adminClient.query("DELETE FROM app.workspaces WHERE id = ANY($1::uuid[])", [
      workspaceIds,
    ]);
  }
  await adminClient.end();
});

beforeEach(async () => {
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

describe("purge_expired_subscriptions", () => {
  it("rebaixa para Free a assinatura cancelada cujo período já passou", async () => {
    const ws = await createWorkspace("pro");
    await createSubscription({
      workspaceId: ws,
      planId: "pro",
      status: "canceled",
      cancelAtPeriodEnd: true,
      periodEnd: new Date(Date.now() - 24 * 60 * 60 * 1000), // ontem
    });

    const { purgeExpiredSubscriptions } = await import("../purge_expired_subscriptions");
    await purgeExpiredSubscriptions({}, {} as never);

    expect(await planOf(ws)).toBe("free");
  });

  it("NÃO rebaixa quem ainda está dentro do ciclo pago", async () => {
    const ws = await createWorkspace("pro");
    await createSubscription({
      workspaceId: ws,
      planId: "pro",
      status: "canceled",
      cancelAtPeriodEnd: true,
      periodEnd: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // daqui a 7 dias
    });

    const { purgeExpiredSubscriptions } = await import("../purge_expired_subscriptions");
    await purgeExpiredSubscriptions({}, {} as never);

    expect(await planOf(ws)).toBe("pro");
  });

  it("NÃO rebaixa quem renovou (tem outra subscription ativa)", async () => {
    const ws = await createWorkspace("pro");
    // A antiga, expirada e cancelada.
    await createSubscription({
      workspaceId: ws,
      planId: "pro",
      status: "canceled",
      cancelAtPeriodEnd: true,
      periodEnd: new Date(Date.now() - 24 * 60 * 60 * 1000),
    });
    // A renovação, viva.
    await createSubscription({
      workspaceId: ws,
      planId: "pro",
      status: "active",
      cancelAtPeriodEnd: false,
      periodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    });

    const { purgeExpiredSubscriptions } = await import("../purge_expired_subscriptions");
    await purgeExpiredSubscriptions({}, {} as never);

    expect(await planOf(ws)).toBe("pro");
  });

  it("NÃO rebaixa quem fez upgrade para um plano superior", async () => {
    const ws = await createWorkspace("business");
    // Assinatura antiga do Pro, expirada.
    await createSubscription({
      workspaceId: ws,
      planId: "pro",
      status: "canceled",
      cancelAtPeriodEnd: true,
      periodEnd: new Date(Date.now() - 24 * 60 * 60 * 1000),
    });

    const { purgeExpiredSubscriptions } = await import("../purge_expired_subscriptions");
    await purgeExpiredSubscriptions({}, {} as never);

    // O workspace está em Business — rebaixar para Free seria errado.
    expect(await planOf(ws)).toBe("business");
  });

  it("NÃO rebaixa subscription ativa com período passado (webhook perdido, mas pago)", async () => {
    const ws = await createWorkspace("pro");
    await createSubscription({
      workspaceId: ws,
      planId: "pro",
      status: "active",
      cancelAtPeriodEnd: false,
      periodEnd: new Date(Date.now() - 24 * 60 * 60 * 1000),
    });

    const { purgeExpiredSubscriptions } = await import("../purge_expired_subscriptions");
    await purgeExpiredSubscriptions({}, {} as never);

    expect(await planOf(ws)).toBe("pro");
  });

  it("é idempotente — rodar duas vezes não muda nada", async () => {
    const ws = await createWorkspace("pro");
    await createSubscription({
      workspaceId: ws,
      planId: "pro",
      status: "canceled",
      cancelAtPeriodEnd: true,
      periodEnd: new Date(Date.now() - 24 * 60 * 60 * 1000),
    });

    const { purgeExpiredSubscriptions } = await import("../purge_expired_subscriptions");
    await purgeExpiredSubscriptions({}, {} as never);
    expect(await planOf(ws)).toBe("free");

    await purgeExpiredSubscriptions({}, {} as never);
    expect(await planOf(ws)).toBe("free");
  });

  it("não falha quando não há nada a expurgar", async () => {
    const { purgeExpiredSubscriptions } = await import("../purge_expired_subscriptions");
    await expect(purgeExpiredSubscriptions({}, {} as never)).resolves.not.toThrow();
  });
});
