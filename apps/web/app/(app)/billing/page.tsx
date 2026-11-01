import { PlanCard } from "@/components/billing/PlanCard";
import { plans, subscriptions, workspaces } from "@/db/schema/app";
import { requireAuth } from "@/lib/auth";
import { formatPriceBrl } from "@/lib/billing/asaas";
import { withTenant } from "@/lib/db";
import type { PlanId } from "@easydemo/shared";
import { desc, eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

/**
 * Página de cobrança.
 *
 * O plano mostrado é o **real** (`workspaces.plan_id`), lido do banco — antes
 * era hardcoded `"free"`, o que fazia o creator nunca ver o plano que tinha
 * comprado.
 *
 * Os preços também vêm de `app.plans.price_brl_cents` — o mesmo catálogo que
 * o checkout usa (`POST /api/v1/billing/checkout`). Uma única fonte de
 * verdade: mudar o preço no banco muda a página E o checkout.
 */
export default async function BillingPage() {
  const { orgId } = await requireAuth();

  const { currentPlan, sub, planRows } = await withTenant(orgId, async (db) => {
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

    const catalog = await db.select().from(plans);

    return {
      currentPlan: (ws?.planId ?? "free") as PlanId,
      sub: latestSub ?? null,
      planRows: catalog,
    };
  });

  // Catálogo na ordem de exibição: free → pro → business.
  const order: PlanId[] = ["free", "pro", "business"];
  const catalog = order
    .map((id) => planRows.find((p) => p.id === id))
    .filter((p): p is NonNullable<typeof p> => Boolean(p));

  const featuresFor = (id: PlanId): string[] => {
    const row = planRows.find((p) => p.id === id);
    const features = (row?.features ?? []) as unknown[];
    if (features.length > 0) {
      return features.filter((f): f is string => typeof f === "string");
    }
    // Fallback: monta a partir dos limites (o `features` jsonb é seed do
    // catálogo, mas nem sempre está populado).
    if (id === "free") return ["3 demos publicados", "10 steps por demo", "20 leads/mês"];
    if (id === "pro") return ["Demos ilimitados", "100 leads/mês", "PIX + boleto + cartão"];
    return ["Demos ilimitados", "Leads ilimitados", "Domínio customizado"];
  };

  return (
    <main className="container py-8">
      <header className="mb-6">
        <h1 className="text-3xl font-bold">Cobrança</h1>
        <p className="text-sm text-muted-foreground">
          Plano atual: <span className="font-semibold uppercase">{currentPlan}</span>
          {sub?.cancelAtPeriodEnd && sub.currentPeriodEnd ? (
            <span className="ml-2 text-xs text-muted-foreground">
              (cancelado — ativo até {new Date(sub.currentPeriodEnd).toLocaleDateString("pt-BR")})
            </span>
          ) : null}
        </p>
      </header>

      <section className="grid gap-6 md:grid-cols-3">
        {catalog.map((plan) => {
          const planId = plan.id as PlanId;
          const isCurrent = planId === currentPlan;
          const isPaid = planId !== "free";

          return (
            <PlanCard
              key={plan.id}
              id={planId}
              name={plan.namePtBr}
              priceLabel={formatPriceBrl(plan.priceBrlCents)}
              cadence="/mês"
              features={featuresFor(planId)}
              ctaLabel={
                isCurrent
                  ? "Plano atual"
                  : isPaid
                    ? `Assinar ${plan.namePtBr} via PIX`
                    : "Mudar para Free"
              }
              // O checkout é um POST (cria customer + subscription no Asaas).
              // O botão usa um form que submete para a rota real — o path
              // antigo `/api/billing/checkout` não existia.
              ctaHref={isCurrent ? "#" : `/api/v1/billing/checkout?plan=${planId}`}
              ctaMethod={isCurrent ? undefined : "POST"}
              highlighted={planId === "pro"}
            />
          );
        })}
      </section>
    </main>
  );
}
