import { subscriptions, workspaces } from "@/db/schema/app";
import { requireAuth } from "@/lib/auth";
import { cancelSubscription } from "@/lib/billing/asaas";
import { withTenant } from "@/lib/db";
import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";

export const runtime = "nodejs";

/**
 * POST /api/v1/billing/cancel
 * -----------------------------------------------------------------------------
 * Cancela a assinatura do workspace.
 *
 * ⚠️ **Semântica de "no fim do ciclo"** (critério de aceitação do gate G3):
 *
 * O Asaas **cobra o ciclo já pago**. Cancelar não gera estorno — o creator
 * continua com o plano até o fim do período que pagou. Então:
 *
 *   1. chamamos `DELETE /subscriptions/:id` no Asaas;
 *   2. a subscription local vira `canceled` com `cancel_at_period_end = true`;
 *   3. o `workspaces.plan_id` **permanece** o plano pago;
 *   4. quando o `current_period_end` passa, o job de expurgo rebaixa o
 *      workspace para "free" (e o webhook `SUBSCRIPTION_INACTIVATED` também
 *      rebaixa, se o período já tiver acabado).
 *
 * O `workspaceId` vem da sessão — nunca do cliente.
 */

const cancelSchema = z.object({
  /** Motivo do cancelamento (registrado no log, não enviado ao Asaas). */
  reason: z.string().max(500).optional(),
});

export async function POST(req: Request) {
  try {
    const { orgId } = await requireAuth();
    const body = await req.json().catch(() => ({}));
    const parsed = cancelSchema.safeParse(body ?? {});
    if (!parsed.success) {
      return NextResponse.json(
        { error: "BAD_REQUEST", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const sub = await withTenant(orgId, async (db) => {
      const [row] = await db
        .select()
        .from(subscriptions)
        .where(and(eq(subscriptions.workspaceId, orgId), eq(subscriptions.status, "active")))
        .limit(1);
      return row ?? null;
    });

    if (!sub) {
      return NextResponse.json({ error: "NO_ACTIVE_SUBSCRIPTION" }, { status: 404 });
    }

    // 1) Cancela no Asaas (se tiver subscription id).
    if (sub.asaasSubscriptionId) {
      try {
        await cancelSubscription(sub.asaasSubscriptionId);
      } catch (err) {
        // Falha no Asaas não impede o cancelamento local — o creator pediu
        // para sair, e o job de expurgo limpa o resto. Logamos para
        // reconciliação.
        console.error("[/api/v1/billing/cancel] falha ao cancelar no Asaas:", err, {
          asaasSubscriptionId: sub.asaasSubscriptionId,
        });
      }
    }

    // 2) Marca como cancelado no fim do ciclo (plano mantido).
    //
    // ⚠️ Se o período pago **já acabou**, o workspace volta para Free
    // agora — não há nada a reter. (O mesmo raciocínio do webhook
    // `SUBSCRIPTION_INACTIVATED`.)
    const periodEnd = sub.currentPeriodEnd ? new Date(sub.currentPeriodEnd) : null;
    const periodFinished = periodEnd !== null && periodEnd.getTime() <= Date.now();

    await withTenant(orgId, async (db) => {
      await db
        .update(subscriptions)
        .set({
          status: "canceled",
          cancelAtPeriodEnd: !periodFinished,
          updatedAt: new Date(),
        })
        .where(eq(subscriptions.id, sub.id));

      if (periodFinished) {
        await db
          .update(workspaces)
          .set({ planId: "free", updatedAt: new Date() })
          .where(eq(workspaces.id, orgId));
      }
    });

    return NextResponse.json({
      canceled: true,
      planId: periodFinished ? "free" : sub.planId,
      planRetainedUntil: sub.currentPeriodEnd,
      message: periodFinished
        ? "Assinatura cancelada. Seu plano voltou para o Free."
        : "Assinatura cancelada. Seu plano continua ativo até o fim do período já pago.",
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
    console.error("[/api/v1/billing/cancel] error:", err);
    return NextResponse.json({ error: "INTERNAL" }, { status: 500 });
  }
}
