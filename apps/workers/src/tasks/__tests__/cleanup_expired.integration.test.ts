/**
 * apps/workers/src/tasks/__tests__/cleanup_expired.integration.test.ts
 *
 * Retenção LGPD (art. 16).
 *
 * ⚠️ Este job é agendado **todo dia** pelo cron do graphile-worker. Um bug
 * aqui apaga dado de cliente que ainda está ativo — por isso o teste cobre
 * explicitamente o caso "não apaga lead de workspace ativo".
 */
import { randomUUID } from "node:crypto";
// ⚠️ `pg` é CommonJS — o import default funciona em ESM (vitest e tsx).
import pg from "pg";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

const { Client } = pg;

const APP_OWNER_URL =
  process.env.DIRECT_URL ??
  process.env.DATABASE_URL?.replace("app_user", "app_owner") ??
  "postgres://app_owner:easydemo@127.0.0.1:55432/easydemo";

let adminClient: pg.Client;
let workspaceIds: string[] = [];

async function createWorkspace(opts: {
  deletedAt: Date | null;
}): Promise<string> {
  const slug = `ret-${randomUUID().slice(0, 8)}`;
  const { rows } = await adminClient.query<{ id: string }>(
    `INSERT INTO app.workspaces (slug, name, plan_id, deleted_at)
     VALUES ($1, 'Retention Test', 'free', $2) RETURNING id`,
    [slug, opts.deletedAt],
  );
  const id = rows[0]?.id ?? "";
  workspaceIds.push(id);
  return id;
}

async function createDemo(workspaceId: string): Promise<string> {
  const { rows } = await adminClient.query<{ id: string }>(
    `INSERT INTO app.demos (workspace_id, slug, title, status, language)
     VALUES ($1, $2, 'Retention Demo', 'published', 'pt-BR') RETURNING id`,
    [workspaceId, `ret-demo-${randomUUID().slice(0, 12)}`],
  );
  return rows[0]?.id ?? "";
}

async function createLead(workspaceId: string, demoId: string): Promise<string> {
  const { rows } = await adminClient.query<{ id: string }>(
    `INSERT INTO app.leads (workspace_id, demo_id, name, email, consent_text)
     VALUES ($1, $2, 'Lead Test', $3, 'consentimento') RETURNING id`,
    [workspaceId, demoId, `lead-${randomUUID().slice(0, 8)}@example.com`],
  );
  return rows[0]?.id ?? "";
}

async function createEvent(workspaceId: string, demoId: string, createdAt: Date): Promise<string> {
  const { rows } = await adminClient.query<{ id: string }>(
    `INSERT INTO analytics.events (workspace_id, demo_id, event_type, created_at)
     VALUES ($1, $2, 'view', $3) RETURNING id`,
    [workspaceId, demoId, createdAt],
  );
  return rows[0]?.id ?? "";
}

beforeAll(async () => {
  adminClient = new pg.Client({ connectionString: APP_OWNER_URL });
  await adminClient.connect();
});

afterAll(async () => {
  if (workspaceIds.length > 0) {
    await adminClient.query("DELETE FROM analytics.events WHERE workspace_id = ANY($1::uuid[])", [
      workspaceIds,
    ]);
    await adminClient.query("DELETE FROM app.leads WHERE workspace_id = ANY($1::uuid[])", [
      workspaceIds,
    ]);
    await adminClient.query("DELETE FROM app.demos WHERE workspace_id = ANY($1::uuid[])", [
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
    await adminClient.query("DELETE FROM analytics.events WHERE workspace_id = ANY($1::uuid[])", [
      workspaceIds,
    ]);
    await adminClient.query("DELETE FROM app.leads WHERE workspace_id = ANY($1::uuid[])", [
      workspaceIds,
    ]);
    await adminClient.query("DELETE FROM app.demos WHERE workspace_id = ANY($1::uuid[])", [
      workspaceIds,
    ]);
    await adminClient.query("DELETE FROM app.workspaces WHERE id = ANY($1::uuid[])", [
      workspaceIds,
    ]);
    workspaceIds = [];
  }
});

describe("cleanup_expired", () => {
  it("apaga lead de workspace deletado há mais do prazo", async () => {
    process.env.LGPD_LEAD_RETENTION_DAYS = "90";
    const ws = await createWorkspace({
      deletedAt: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000),
    });
    const demo = await createDemo(ws);
    const leadId = await createLead(ws, demo);

    const { cleanupExpired } = await import("../cleanup_expired");
    await cleanupExpired({}, {} as never);

    const { rows } = await adminClient.query<{ id: string }>(
      "SELECT id FROM app.leads WHERE id = $1",
      [leadId],
    );
    expect(rows).toHaveLength(0);
  });

  it("NÃO apaga lead de workspace ativo", async () => {
    process.env.LGPD_LEAD_RETENTION_DAYS = "90";
    const ws = await createWorkspace({ deletedAt: null });
    const demo = await createDemo(ws);
    const leadId = await createLead(ws, demo);

    const { cleanupExpired } = await import("../cleanup_expired");
    await cleanupExpired({}, {} as never);

    const { rows } = await adminClient.query<{ id: string }>(
      "SELECT id FROM app.leads WHERE id = $1",
      [leadId],
    );
    expect(rows).toHaveLength(1);
  });

  it("NÃO apaga lead de workspace deletado dentro do prazo", async () => {
    process.env.LGPD_LEAD_RETENTION_DAYS = "90";
    const ws = await createWorkspace({
      deletedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
    });
    const demo = await createDemo(ws);
    const leadId = await createLead(ws, demo);

    const { cleanupExpired } = await import("../cleanup_expired");
    await cleanupExpired({}, {} as never);

    const { rows } = await adminClient.query<{ id: string }>(
      "SELECT id FROM app.leads WHERE id = $1",
      [leadId],
    );
    expect(rows).toHaveLength(1);
  });

  it("apaga evento de analytics fora do prazo de retenção", async () => {
    process.env.LGPD_ANALYTICS_RETENTION_MONTHS = "24";
    const ws = await createWorkspace({ deletedAt: null });
    const demo = await createDemo(ws);
    // ⚠️ O prazo é de 24 **meses** — 400 dias (~13 meses) ainda está dentro
    // do prazo. Precisa de mais de 2 anos.
    const eventId = await createEvent(ws, demo, new Date(Date.now() - 800 * 24 * 60 * 60 * 1000));

    const { cleanupExpired } = await import("../cleanup_expired");
    await cleanupExpired({}, {} as never);

    const { rows } = await adminClient.query<{ id: string }>(
      "SELECT id FROM analytics.events WHERE id = $1",
      [eventId],
    );
    expect(rows).toHaveLength(0);
  });

  it("NÃO apaga evento de analytics dentro do prazo", async () => {
    process.env.LGPD_ANALYTICS_RETENTION_MONTHS = "24";
    const ws = await createWorkspace({ deletedAt: null });
    const demo = await createDemo(ws);
    const eventId = await createEvent(ws, demo, new Date(Date.now() - 400 * 24 * 60 * 60 * 1000));

    const { cleanupExpired } = await import("../cleanup_expired");
    await cleanupExpired({}, {} as never);

    const { rows } = await adminClient.query<{ id: string }>(
      "SELECT id FROM analytics.events WHERE id = $1",
      [eventId],
    );
    expect(rows).toHaveLength(1);
  });

  it("rejeita prazo de retenção inválido em vez de apagar tudo", async () => {
    process.env.LGPD_LEAD_RETENTION_DAYS = "0";
    const { cleanupExpired } = await import("../cleanup_expired");
    await expect(cleanupExpired({}, {} as never)).rejects.toThrow(/LGPD_LEAD_RETENTION_DAYS/);
    process.env.LGPD_LEAD_RETENTION_DAYS = "90";
  });

  it("é idempotente — rodar duas vezes não causa erro", async () => {
    process.env.LGPD_LEAD_RETENTION_DAYS = "90";
    const ws = await createWorkspace({
      deletedAt: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000),
    });
    const demo = await createDemo(ws);
    await createLead(ws, demo);

    const { cleanupExpired } = await import("../cleanup_expired");
    await cleanupExpired({}, {} as never);
    await expect(cleanupExpired({}, {} as never)).resolves.not.toThrow();
  });
});
