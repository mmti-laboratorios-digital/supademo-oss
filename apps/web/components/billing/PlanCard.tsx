import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type PlanCardProps = {
  id: "free" | "pro" | "business";
  name: string;
  priceLabel: string;
  cadence: string;
  features: string[];
  ctaLabel: string;
  ctaHref: string;
  highlighted?: boolean;
  /**
   * Método do CTA.
   *
   * O checkout do Asaas é um **POST** (cria customer + subscription), então
   * o CTA de upgrade precisa ser um `<form method="post">` — um `<a href>`
   * dispararia um GET e o endpoint devolveria 405. Quando `undefined`, o CTA
   * é um link comum (usado no card do plano atual, que não navega).
   */
  ctaMethod?: "GET" | "POST";
};

export function PlanCard({
  name,
  priceLabel,
  cadence,
  features,
  ctaLabel,
  ctaHref,
  highlighted,
  ctaMethod,
}: PlanCardProps) {
  const featuresList = (
    <ul className="mt-6 space-y-2 text-sm">
      {features.map((f) => (
        <li key={f} className="flex gap-2">
          <span aria-hidden>✓</span>
          <span>{f}</span>
        </li>
      ))}
    </ul>
  );

  return (
    <div
      className={cn(
        "rounded-lg border-2 p-6",
        highlighted
          ? "border-primary shadow-[4px_4px_0_0_hsl(var(--foreground))]"
          : "border-border",
      )}
    >
      <h3 className="text-lg font-semibold">{name}</h3>
      <div className="mt-3 flex items-baseline gap-1">
        <span className="text-4xl font-bold">{priceLabel}</span>
        <span className="text-sm text-muted-foreground">{cadence}</span>
      </div>
      {featuresList}
      {ctaMethod === "POST" ? (
        // O endpoint de checkout lê o plano do query string e o workspace da
        // sessão — por isso o `plan` viaja na URL e o body fica vazio.
        <form action={ctaHref} method="post" className="mt-6">
          <Button type="submit" className="w-full" variant={highlighted ? "default" : "outline"}>
            {ctaLabel}
          </Button>
        </form>
      ) : (
        <Button asChild className="mt-6 w-full" variant={highlighted ? "default" : "outline"}>
          <a href={ctaHref}>{ctaLabel}</a>
        </Button>
      )}
    </div>
  );
}
