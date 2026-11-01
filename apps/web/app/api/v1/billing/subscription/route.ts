import { subscriptions, workspaces } from "@/db/schema/app";
import { requireAuth } from "@/lib/auth";
import { withTenant } from "@/lib/db";
import type { PlanId } from "@easydemo/shared";
import { desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * GET /api/v1/billing/subscription
 * -----------------------------------------------------------------------------
 * Estado da assinatura do workspace autenticado.
 *
 * A página `/billing` usa isso para mostrar o plano real e o estado da
 * assinatura (ativa, cancelada no fim do ciclo, inadimplente).
 *
 * O `workspaceId` vem da sessão — o endpoint não aceita workspaceId do
 * cliente.
 */
export async function GET() {
  try {
    const { orgId } = await requireAuth();

    const { workspacePlan, sub } = await withTenant(orgId, async (db) => {
      const [ws] = await db
        .select({ planId: workspaces.planId })
        .from(workspaces)
        .where(eq(workspaces.id, orgId))
        .limit(1);

      const [latestSub] = await db
        .select()
        .from(subscriptions)
        .where(eq(subscriptions.workspaceId, orgId))
        .orderBy(desc(subscriptions.createdAt))
        .limit(1);

      return { workspacePlan: (ws?.planId ?? "free") as PlanId, sub: latestSub ?? null };
    });

    if (!sub) {
      return NextResponse.json({ subscription: null, planId: workspacePlan });
    }

    return NextResponse.json({
      subscription: {
        id: sub.id,
        planId: sub.planId,
        status: sub.status,
        currentPeriodStart: sub.currentPeriodStart,
        currentPeriodEnd: sub.currentPeriodEnd,
        cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
      },
      // ⚠️ O plano **efetivo** é o do workspace (`workspaces.plan_id`), não o
      // da subscription. Eles divergem quando a assinatura está cancelada mas
      // o creator ainda está dentro do ciclo pago — nesse caso o workspace
      // continua no plano pago, e é isso que a página de billing mostra.
      planId: workspacePlan,
    });
  } catch (err) {
    if (err instanceof Error) {
      if (err.message === "UNAUTHORIZED") {
        return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
      }
      if (err.message === "NO_WORKSPACE") {
        return NextResponse.json({ error: "NO_WORKSPACE" }, { status: 403 });
      }
    }
    console.error("[/api/v1/billing/subscription] error:", err);
    return NextResponse.json({ error: "INTERNAL" }, { status: 500 });
  }
}
