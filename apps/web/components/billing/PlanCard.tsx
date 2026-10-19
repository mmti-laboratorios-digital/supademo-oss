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
};

export function PlanCard({
  name,
  priceLabel,
  cadence,
  features,
  ctaLabel,
  ctaHref,
  highlighted,
}: PlanCardProps) {
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
      <ul className="mt-6 space-y-2 text-sm">
        {features.map((f) => (
          <li key={f} className="flex gap-2">
            <span aria-hidden>✓</span>
            <span>{f}</span>
          </li>
        ))}
      </ul>
      <Button asChild className="mt-6 w-full" variant={highlighted ? "default" : "outline"}>
        <a href={ctaHref}>{ctaLabel}</a>
      </Button>
    </div>
  );
}
