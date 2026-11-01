import { StatsChart } from "@/components/analytics/StatsChart";
import { demos, steps } from "@/db/schema/app";
import { getDemoSummary } from "@/lib/analytics/summary";
import { requireAuth } from "@/lib/auth";
import { withTenant } from "@/lib/db";
import { asc, eq } from "drizzle-orm";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

/**
 * Dashboard de analytics da demo.
 *
 * ⚠️ **O que mudou na F5:** a página mostrava só a contagem bruta de
 * eventos (`Record<string, number>`) num `StatsChart` que desenhava 6
 * barras. Não havia drop-off por step nem CTA CTR — as duas informações que
 * o creator mais precisa para decidir o que melhorar no demo.
 *
 * Agora:
 *   - o funil vem de `computeFunnel` (`lib/analytics/funnel.ts`, pure
 *     function já pronta e testada — o §8 da F5 proíbe mexer nela);
 *   - os agregados (visitantes únicos, conclusão, CTA CTR) vêm de
 *     `lib/analytics/summary.ts`;
 *   - cada step do funil é rotulado com a **posição e o caption** do step,
 *     para o creator saber onde o visitante desiste.
 */
export default async function DemoAnalyticsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { orgId } = await requireAuth();

  // 1) A demo precisa existir **e** ser do tenant logado (RLS).
  const demo = await withTenant(orgId, async (db) => {
    const [row] = await db.select().from(demos).where(eq(demos.id, id)).limit(1);
    return row ?? null;
  });
  if (!demo) notFound();

  // 2) Os steps da demo, para rotular o funil.
  const stepList = await withTenant(orgId, async (db) =>
    db
      .select({ id: steps.id, position: steps.position, caption: steps.caption })
      .from(steps)
      .where(eq(steps.demoId, id))
      .orderBy(asc(steps.position)),
  );

  // 3) O resumo (agregados + funil).
  //
  // ⚠️ O `workspaceId` é obrigatório: a policy `events_select` exige o
  // contexto de tenant — sem ele, a query volta 0 linhas silenciosamente.
  const summary = await getDemoSummary(id, { workspaceId: orgId });

  // 4) Rótulo de cada step do funil.
  //
  // ⚠️ O `computeFunnel` devolve `stepId` — o índice do funil (0 = "view")
  // **não** é a posição do step no demo. Um step que ninguém viu não aparece
  // no funil, então os índices do funil e as posições do demo não batem.
  // Por isso o rótulo é resolvido pelo **stepId**, não pelo índice.
  const labelByStepId = new Map(stepList.map((s) => [s.id, s]));
  const stepLabels: Record<number, string> = {};
  for (const funnelStep of summary.funnelSteps) {
    if (funnelStep.stepId === null) {
      stepLabels[funnelStep.index] = "Visualização";
      continue;
    }
    const step = labelByStepId.get(funnelStep.stepId);
    if (!step) {
      stepLabels[funnelStep.index] = `Step ${funnelStep.index}`;
      continue;
    }
    const caption = step.caption?.trim();
    stepLabels[funnelStep.index] = caption
      ? `Step ${step.position} — ${truncate(caption, 40)}`
      : `Step ${step.position}`;
  }

  return (
    <main className="container py-8">
      <header className="mb-6">
        <h1 className="text-3xl font-bold">{demo.title}</h1>
        <p className="text-sm text-muted-foreground">
          Analytics dos últimos 30 dias · {summary.uniqueVisitors} visitante
          {summary.uniqueVisitors === 1 ? "" : "s"} único
          {summary.uniqueVisitors === 1 ? "" : "s"}
        </p>
      </header>

      <StatsChart summary={summary} stepLabels={stepLabels} />
    </main>
  );
}

function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1)}…`;
}
