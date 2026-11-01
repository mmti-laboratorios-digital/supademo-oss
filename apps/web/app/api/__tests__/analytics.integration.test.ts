import { randomUUID } from "node:crypto";
import pg from "pg";
/**
 * apps/web/app/api/__tests__/analytics.integration.test.ts
 *
 * Gate G5 — os 3 critérios de aceitação do analytics:
 *
 *   1. **Duas views do mesmo navegador = 1 visitor**;
 *   2. **Drop-off por step aparece no dashboard com os steps corretos**;
 *   3. **CTA CTR = cliques / viewers que chegaram ao último step**.
 *
 * Usa Postgres real e mocka apenas o Clerk (`requireAuth`).
 */
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

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

let adminClient: pg.Client;
let workspaceId: string;
let otherWorkspaceId: string;
let demoId: string;
let stepIds: string[] = [];

beforeAll(async () => {
  adminClient = new pg.Client({ connectionString: APP_OWNER_URL });
  await adminClient.connect();

  await adminClient.query("DELETE FROM app.workspaces WHERE slug LIKE 'f5-analytics-%'");

  const w = await adminClient.query<{ id: string }>(
    `INSERT INTO app.workspaces (slug, name, plan_id)
     VALUES ($1, 'F5 Analytics Test', 'free') RETURNING id`,
    [`f5-analytics-${randomUUID().slice(0, 8)}`],
  );
  workspaceId = w.rows[0].id;

  const w2 = await adminClient.query<{ id: string }>(
    `INSERT INTO app.workspaces (slug, name, plan_id)
     VALUES ($1, 'F5 Outro', 'free') RETURNING id`,
    [`f5-analytics-other-${randomUUID().slice(0, 8)}`],
  );
  otherWorkspaceId = w2.rows[0].id;

  const d = await adminClient.query<{ id: string }>(
    `INSERT INTO app.demos (workspace_id, slug, title, status, language)
     VALUES ($1, $2, 'Demo Analytics F5', 'published', 'pt-BR') RETURNING id`,
    [workspaceId, `f5-analytics-${randomUUID().slice(0, 12)}`],
  );
  demoId = d.rows[0].id;

  // 3 steps — o último é o que conta como "chegou ao último step".
  for (let i = 1; i <= 3; i++) {
    const s = await adminClient.query<{ id: string }>(
      `INSERT INTO app.steps (demo_id, position, screenshot_r2_key, source_url, hotspot)
       VALUES ($1, $2, $3, $4, '{"type":"pointer","x":50,"y":50}'::jsonb)
       RETURNING id`,
      [demoId, i, `f5/step-${i}.webp`, `https://example.com/step-${i}`],
    );
    stepIds.push(s.rows[0].id);
  }
});

afterAll(async () => {
  await adminClient.query("DELETE FROM app.demos WHERE workspace_id = ANY($1::uuid[])", [
    [workspaceId, otherWorkspaceId],
  ]);
  await adminClient.query("DELETE FROM app.workspaces WHERE id = ANY($1::uuid[])", [
    [workspaceId, otherWorkspaceId],
  ]);
  await adminClient.end();
});

beforeEach(async () => {
  await adminClient.query("DELETE FROM analytics.events WHERE demo_id = $1", [demoId]);
});

/** Insere um evento de analytics direto no banco. */
async function insertEvent(
  visitorIdHash: string,
  eventType: string,
  opts: { stepId?: string | null; deviceClass?: string; countryCode?: string } = {},
): Promise<void> {
  await adminClient.query(
    `INSERT INTO analytics.events
       (workspace_id, demo_id, step_id, event_type, visitor_id_hash, device_class, country_code)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [
      workspaceId,
      demoId,
      opts.stepId ?? null,
      eventType,
      visitorIdHash,
      opts.deviceClass ?? "desktop",
      opts.countryCode ?? "BR",
    ],
  );
}

describe("gate G5 — analytics", () => {
  it("1. duas views do mesmo navegador = 1 visitor", async () => {
    const { getDemoSummary } = await import("@/lib/analytics/summary");

    // O mesmo visitante abre o demo 3 vezes.
    const visitor = "hash-visitante-unico";
    for (let i = 0; i < 3; i++) {
      await insertEvent(visitor, "view");
    }

    const summary = await getDemoSummary(demoId, { workspaceId });
    expect(summary.uniqueVisitors).toBe(1);
    expect(summary.views).toBe(3);
  });

  it("1b. visitantes diferentes contam separadamente", async () => {
    const { getDemoSummary } = await import("@/lib/analytics/summary");

    await insertEvent("visitante-a", "view");
    await insertEvent("visitante-a", "view");
    await insertEvent("visitante-b", "view");

    const summary = await getDemoSummary(demoId, { workspaceId });
    expect(summary.uniqueVisitors).toBe(2);
    expect(summary.views).toBe(3);
  });

  it("2. drop-off por step aparece com os steps corretos", async () => {
    const { getDemoSummary } = await import("@/lib/analytics/summary");

    // 10 visitors veem o demo; 4 avançam ao step 2; 2 chegam ao step 3.
    for (let i = 0; i < 10; i++) {
      await insertEvent(`v${i}`, "view");
    }
    for (let i = 0; i < 4; i++) {
      await insertEvent(`v${i}`, "step_seen", { stepId: stepIds[1] });
    }
    for (let i = 0; i < 2; i++) {
      await insertEvent(`v${i}`, "step_seen", { stepId: stepIds[2] });
    }

    const summary = await getDemoSummary(demoId, { workspaceId });

    // O funil tem: view (null) → step 1 → step 2.
    expect(summary.funnelSteps).toHaveLength(3);
    expect(summary.funnelSteps[0].stepId).toBeNull();
    expect(summary.funnelSteps[0].reach).toBe(10);
    expect(summary.funnelSteps[0].pct_continue).toBe(100);

    // ⚠️ O stepId é o **id real do step**, não o índice — o dashboard
    // resolve o rótulo por ele.
    expect(summary.funnelSteps[1].stepId).toBe(stepIds[1]);
    expect(summary.funnelSteps[1].reach).toBe(4);
    expect(summary.funnelSteps[1].pct_continue).toBe(40);

    expect(summary.funnelSteps[2].stepId).toBe(stepIds[2]);
    expect(summary.funnelSteps[2].reach).toBe(2);
    expect(summary.funnelSteps[2].pct_continue).toBe(50);

    // Drop-off: 60% desiste entre o view e o step 1; 50% entre step 1 e 2.
    const dropOff1 = 100 - summary.funnelSteps[1].pct_continue;
    const dropOff2 = 100 - summary.funnelSteps[2].pct_continue;
    expect(dropOff1).toBe(60);
    expect(dropOff2).toBe(50);
  });

  it("3. CTA CTR = cliques / viewers que chegaram ao último step", async () => {
    const { getDemoSummary } = await import("@/lib/analytics/summary");

    // 4 visitors chegam ao último step (step 3); 1 clica no CTA.
    for (let i = 0; i < 4; i++) {
      await insertEvent(`c${i}`, "view");
      await insertEvent(`c${i}`, "step_seen", { stepId: stepIds[1] });
      await insertEvent(`c${i}`, "step_seen", { stepId: stepIds[2] });
    }
    await insertEvent("c0", "cta_click", { stepId: stepIds[2] });

    const summary = await getDemoSummary(demoId, { workspaceId });

    // ⚠️ O denominador NÃO é o total de visitors (4 chegaram ao último
    // step; 1 clicou) — é quem **chegou ao último step**.
    expect(summary.ctaClickVisitors).toBe(1);
    expect(summary.ctaCtr).toBe(25);
  });

  it("3b. CTA CTR = 0 quando ninguém chegou ao último step", async () => {
    const { getDemoSummary } = await import("@/lib/analytics/summary");

    await insertEvent("so-view", "view");
    await insertEvent("so-view", "cta_click");

    const summary = await getDemoSummary(demoId, { workspaceId });
    // 1 clique, mas 0 visitors chegaram ao último step → 0% (não 100%).
    expect(summary.ctaClickVisitors).toBe(1);
    expect(summary.ctaCtr).toBe(0);
  });

  it("taxa de conclusão usa visitantes únicos, não views", async () => {
    const { getDemoSummary } = await import("@/lib/analytics/summary");

    // 1 visitante abre 10 vezes e completa 1 → 100% de conclusão.
    for (let i = 0; i < 10; i++) {
      await insertEvent("reincidente", "view");
    }
    await insertEvent("reincidente", "complete");

    const summary = await getDemoSummary(demoId, { workspaceId });
    expect(summary.uniqueVisitors).toBe(1);
    expect(summary.views).toBe(10);
    expect(summary.completers).toBe(1);
    expect(summary.completionRate).toBe(100);
  });

  it("distribuições por device, país e referrer", async () => {
    const { getDemoSummary } = await import("@/lib/analytics/summary");

    await insertEvent("d1", "view", { deviceClass: "mobile", countryCode: "BR" });
    await insertEvent("d2", "view", { deviceClass: "mobile", countryCode: "US" });
    await insertEvent("d3", "view", { deviceClass: "desktop", countryCode: "BR" });

    await adminClient.query(
      `UPDATE analytics.events SET referrer_host = 'linkedin.com'
        WHERE demo_id = $1 AND visitor_id_hash = 'd1'`,
      [demoId],
    );

    const summary = await getDemoSummary(demoId, { workspaceId });
    expect(summary.byDevice.find((d) => d.device === "mobile")?.count).toBe(2);
    expect(summary.byDevice.find((d) => d.device === "desktop")?.count).toBe(1);
    expect(summary.byCountry.find((c) => c.country === "BR")?.count).toBe(2);
    expect(summary.topReferrers.find((r) => r.host === "linkedin.com")?.count).toBe(1);
  });

  it("isolamento: demo de outro workspace devolve 0 (RLS)", async () => {
    const { getDemoSummary } = await import("@/lib/analytics/summary");

    const outro = await adminClient.query<{ id: string }>(
      `INSERT INTO app.demos (workspace_id, slug, title, status, language)
       VALUES ($1, $2, 'Demo de outro tenant', 'published', 'pt-BR') RETURNING id`,
      [otherWorkspaceId, `f5-outro-${randomUUID().slice(0, 12)}`],
    );

    await adminClient.query(
      `INSERT INTO analytics.events
         (workspace_id, demo_id, event_type, visitor_id_hash, device_class)
       VALUES ($1, $2, 'view', 'intruso', 'desktop')`,
      [otherWorkspaceId, outro.rows[0].id],
    );

    // Lendo com o contexto do workspace **errado** → a policy barra.
    const summary = await getDemoSummary(outro.rows[0].id, { workspaceId });
    expect(summary.uniqueVisitors).toBe(0);
    expect(summary.views).toBe(0);

    await adminClient.query("DELETE FROM app.demos WHERE id = $1", [outro.rows[0].id]);
  });

  it("demo sem eventos devolve zeros (não quebra a página)", async () => {
    const { getDemoSummary } = await import("@/lib/analytics/summary");
    const summary = await getDemoSummary(demoId, { workspaceId });
    expect(summary.uniqueVisitors).toBe(0);
    expect(summary.completionRate).toBe(0);
    expect(summary.ctaCtr).toBe(0);
    expect(summary.funnelSteps).toEqual([]);
  });
});
