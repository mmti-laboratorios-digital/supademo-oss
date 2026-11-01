/**
 * apps/web/scripts/metrics-snapshot.ts
 * -----------------------------------------------------------------------------
 * Snapshot manual das métricas de growth do EasyDemo.
 *
 * F10 — instrumenta `marketing/METRICS-DASHBOARD.md` com dados reais do
 * Postgres (LGPD-safe: usa roles app_user/app_owner, sem PII sensível).
 *
 * Uso:
 *   set -a; source .env; set +a; unset SENTRY_DSN
 *   pnpm --filter web exec tsx scripts/metrics-snapshot.ts
 *
 * ⚠️ Requer .env com DATABASE_URL e DIRECT_URL.
 */

import { events } from "@/db/schema/analytics";
import { demos, leads, workspaces } from "@/db/schema/app";
import { getDb } from "@/lib/db";
import { getPlanLimits } from "@/lib/plans";
import { count, eq, inArray, sql } from "drizzle-orm";

async function main(): Promise<void> {
  const db = getDb();
  const since30d = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const since30dIso = since30d.toISOString();

  // Workspaces
  const [workspaceRow] = await db.select({ total: count() }).from(workspaces);
  const [publishedDemoRow] = await db
    .select({ total: count() })
    .from(demos)
    .where(eq(demos.status, "published"));
  const [draftDemoRow] = await db
    .select({ total: count() })
    .from(demos)
    .where(eq(demos.status, "draft"));

  // Leads (últimos 30 dias)
  const [leadRow] = await db.execute<{ total: number }>(sql`
    SELECT COUNT(*)::int AS total FROM app.leads
    WHERE created_at >= ${since30dIso}::timestamptz
  `);

  // Views (últimos 30 dias) — eventos do tipo 'view'
  const [viewRow] = await db.execute<{ total: number }>(sql`
    SELECT COUNT(*)::int AS total FROM analytics.events
    WHERE event_type = 'view' AND created_at >= ${since30dIso}::timestamptz
  `);

  // Assinaturas pagas ativas
  const paidPlans = await db
    .select({ planId: workspaces.planId, total: count() })
    .from(workspaces)
    .where(inArray(workspaces.planId, ["pro", "business"]))
    .groupBy(workspaces.planId);

  // MRR estimado (usa preços do catálogo)
  let mrrCents = 0;
  for (const row of paidPlans) {
    const limits = await getPlanLimits(row.planId as "pro" | "business");
    mrrCents += limits.priceBrlCents * Number(row.total);
  }

  // Workspaces ativos: publicaram demo OU tiveram view nos últimos 30 dias
  const activeWsIds = new Set<string>();
  const demosWithActivity = await db
    .select({ workspaceId: demos.workspaceId })
    .from(demos)
    .where(eq(demos.status, "published"));
  for (const d of demosWithActivity) activeWsIds.add(d.workspaceId);

  const wsWithLeads = await db
    .selectDistinct({ workspaceId: leads.workspaceId })
    .from(leads)
    .where(sql`${leads.createdAt} >= ${since30d.toISOString()}`);
  for (const l of wsWithLeads) activeWsIds.add(l.workspaceId);

  console.log("=== EasyDemo Metrics Snapshot ===");
  console.log(`Workspaces total:      ${workspaceRow?.total ?? 0}`);
  console.log(`Workspaces ativos:     ${activeWsIds.size}`);
  console.log(`Demos publicadas:      ${publishedDemoRow?.total ?? 0}`);
  console.log(`Demos rascunho:        ${draftDemoRow?.total ?? 0}`);
  console.log(`Leads (30d):           ${leadRow?.total ?? 0}`);
  console.log(`Views (30d):           ${viewRow?.total ?? 0}`);
  console.log("Planos pagos:");
  for (const row of paidPlans) {
    console.log(`  ${row.planId}: ${row.total}`);
  }
  console.log(`MRR estimado:          R$ ${(mrrCents / 100).toFixed(2)}`);
  console.log("===================================");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
