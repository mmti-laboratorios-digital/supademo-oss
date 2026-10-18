import Link from "next/link";
import { PlanCard } from "@/components/billing/PlanCard";
import { loadPricingDetail } from "./content/contentLoader";

/**
 * Pricing-detail page (PT-BR). Reads structured content from
 * content/pricing-detail.mdx and renders:
 *   - Hero
 *   - Comparison table (PlanCard per tier)
 *   - Guarantee banner
 *   - FAQ schema (visible FAQ + structured JSON-LD)
 *   - Footer with DPO contact
 */
export default async function PricingDetailPage() {
  const { plans, faq, guaranteeDays } = await loadPricingDetail();

  // Schema.org FAQ structured data
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map((q) => ({
      "@type": "Question",
      name: q.question,
      acceptedAnswer: { "@type": "Answer", text: q.answer },
    })),
  };

  return (
    <main className="container py-24">
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      <header className="mb-12 text-center">
        <h1 className="text-balance text-4xl font-bold md:text-5xl">
          Planos simples em R$, sem surpresas.
        </h1>
        <p className="mt-3 text-muted-foreground">
          Pague via PIX, boleto ou cartão. NF-e emitida em todos os planos
          pagos. Garantia de {guaranteeDays} dias no Pro.
        </p>
      </header>

      <section
        aria-label="Comparativo de planos"
        className="mb-16 grid gap-6 md:grid-cols-3"
      >
        {plans.map((p) => (
          <PlanCard
            key={p.id}
            id={p.id as "free" | "pro" | "business"}
            name={p.name}
            priceLabel={p.priceLabel}
            cadence={p.cadence}
            features={p.features}
            ctaLabel={p.ctaLabel}
            ctaHref={p.ctaHref}
            highlighted={p.highlighted}
          />
        ))}
      </section>

      <section className="mx-auto mb-16 max-w-3xl rounded-xl border-2 border-accent bg-card p-8 shadow-[4px_4px_0_0_hsl(var(--foreground))]">
        <div className="flex flex-wrap items-center gap-4">
          <div className="rounded-full bg-accent px-3 py-1 text-xs font-bold uppercase tracking-wider text-accent-foreground">
            Garantia {guaranteeDays} dias
          </div>
          <h2 className="text-xl font-bold">
            Se o Pro não for pra você, devolvemos seu dinheiro.
          </h2>
        </div>
        <p className="mt-3 text-sm text-muted-foreground">
          Você assina, testa por até {guaranteeDays} dias, e se decidir que
          DemoBR não é o que precisava, é só clicar em &quot;Cancelar e
          reembolsar&quot; na sua área de billing. Sem formulário, sem ligação,
          sem letra miúda. O estorno cai em até 5 dias úteis no mesmo método
          de pagamento.
        </p>
      </section>

      <section className="mx-auto max-w-3xl">
        <h2 className="mb-6 text-center text-2xl font-bold md:text-3xl">
          Perguntas frequentes
        </h2>
        <dl className="divide-y divide-border">
          {faq.map((q) => (
            <div key={q.question} className="py-5">
              <dt className="text-base font-semibold">{q.question}</dt>
              <dd className="mt-2 text-sm text-muted-foreground">{q.answer}</dd>
            </div>
          ))}
        </dl>
      </section>

      <footer className="mt-16 text-center text-sm text-muted-foreground">
        Dúvidas?{" "}
        <Link href="mailto:dpo@dominio.com.br" className="underline">
          dpo@dominio.com.br
        </Link>{" "}
        · LGPD art. 18 garantido.
      </footer>
    </main>
  );
}
