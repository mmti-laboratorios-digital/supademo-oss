import { StatsChart } from "@/components/analytics/StatsChart";
import { demos } from "@/db/schema/app";
import { requireAuth } from "@/lib/auth";
import { withTenant } from "@/lib/db";
import { sql as drizzleSql, eq } from "drizzle-orm";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function DemoAnalyticsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { orgId } = await requireAuth();

  const result = await withTenant(orgId, async (db) => {
    const [demo] = await db.select().from(demos).where(eq(demos.id, id)).limit(1);
    if (!demo) return null;

    const rows = await db.execute<{
      event_type: string;
      n: string;
    }>(drizzleSql`
      SELECT event_type, COUNT(*)::text AS n
      FROM analytics.events
      WHERE demo_id = ${id}::uuid
      GROUP BY event_type
    `);

    const stats = rows.reduce<Record<string, number>>((acc, r) => {
      acc[r.event_type] = Number(r.n);
      return acc;
    }, {});

    return { demo, stats };
  });

  if (!result) notFound();

  return (
    <main className="container py-8">
      <header className="mb-6">
        <h1 className="text-3xl font-bold">{result.demo.title}</h1>
        <p className="text-sm text-muted-foreground">Analytics do demo</p>
      </header>
      <StatsChart stats={result.stats} />
    </main>
  );
}
