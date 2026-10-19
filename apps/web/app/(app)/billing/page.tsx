import { PlanCard } from "@/components/billing/PlanCard";
import { requireAuth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function BillingPage() {
  const { orgId } = await requireAuth();
  // Em produção: ler plan atual via workspaces WHERE id = orgId.
  // Por ora: placeholder fixo.
  void orgId;
  const currentPlan = "free";

  return (
    <main className="container py-8">
      <header className="mb-6">
        <h1 className="text-3xl font-bold">Cobrança</h1>
        <p className="text-sm text-muted-foreground">
          Plano atual: <span className="font-semibold">{currentPlan}</span>
        </p>
      </header>

      <section className="grid gap-6 md:grid-cols-3">
        <PlanCard
          id="free"
          name="Free"
          priceLabel="R$ 0"
          cadence="/mês"
          features={["3 demos publicados", "50 views/mês", "Sem cartão"]}
          ctaLabel={currentPlan === "free" ? "Plano atual" : "Downgrade"}
          ctaHref="#"
          highlighted={false}
        />
        <PlanCard
          id="pro"
          name="Pro"
          priceLabel="R$ 49"
          cadence="/mês"
          features={["Demos ilimitados", "100 leads/mês", "PIX + boleto + cartão"]}
          ctaLabel="Upgrade via PIX"
          ctaHref="/api/billing/checkout?plan=pro"
          highlighted
        />
        <PlanCard
          id="business"
          name="Business"
          priceLabel="R$ 199"
          cadence="/mês"
          features={["Domínio customizado", "CRM BR", "Suporte 24h"]}
          ctaLabel="Falar com vendas"
          ctaHref="mailto:vendas@dominio.com.br"
          highlighted={false}
        />
      </section>
    </main>
  );
}
