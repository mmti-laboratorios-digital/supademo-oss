import { Button } from "@/components/ui/button";
import Link from "next/link";
import { loadHomeContent } from "./content/contentLoader";

/**
 * Renders the marketing home page in PT-BR.
 * Reuses the structured content authored at
 *   apps/web/app/(marketing)/content/home.mdx
 * Copy edits propagate to both languages automatically when the loader is
 * enabled for EN (see ./home.en.mdx). For now this page uses PT-BR; the EN
 * variant lives at /en and is loaded from home.en.mdx via the same loader
 * with a `locale` parameter.
 */
export default async function MarketingHomePage() {
  const content = await loadHomeContent("home.mdx");
  const { meta, socialProof, features, showcase, pricing, finalCta } = content;
  return (
    <main className="min-h-dvh">
      <header className="container flex min-h-[80dvh] flex-col items-center justify-center gap-6 py-24 text-center">
        <span className="rounded-full border border-border bg-muted px-3 py-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {meta.badge}
        </span>
        <h1 className="max-w-3xl text-balance text-5xl font-bold leading-tight tracking-tight md:text-7xl">
          {meta.title}
        </h1>
        <p className="max-w-2xl text-balance text-lg text-muted-foreground">{meta.subtitle}</p>
        <div className="flex flex-wrap items-center justify-center gap-4">
          <Button asChild size="lg" className="neobrutalism-button">
            <Link href={meta.primaryCta.href}>{meta.primaryCta.label}</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href={meta.secondaryCta.href}>{meta.secondaryCta.label}</Link>
          </Button>
        </div>
      </header>

      <section className="container py-12">
        <p className="mb-6 text-center text-sm uppercase tracking-wider text-muted-foreground">
          Usado por 200+ times de produto, marketing e CX
        </p>
        <div className="mx-auto grid max-w-5xl grid-cols-2 gap-3 md:grid-cols-6">
          {socialProof.map((s) => (
            <div
              key={s.name}
              className="rounded-md border border-border bg-card px-3 py-4 text-center text-xs"
            >
              <div className="font-semibold">{s.name}</div>
              <div className="text-muted-foreground">{s.industry}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="container py-12">
        <div className="mx-auto grid max-w-5xl gap-6 md:grid-cols-3">
          {features.map((f) => (
            <div key={f.title} className="neobrutalism-card rounded-lg p-6">
              <h3 className="mb-2 text-lg font-semibold">{f.title}</h3>
              <p className="text-sm text-muted-foreground">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="container py-16">
        <h2 className="mb-8 text-center text-3xl font-bold md:text-4xl">
          Veja demos reais rodando
        </h2>
        <div className="mx-auto grid max-w-5xl gap-6 md:grid-cols-3">
          {showcase.map((d) => (
            <Link
              key={d.title}
              href={d.href}
              className="group rounded-lg border border-border bg-card p-4 transition-shadow hover:shadow-[4px_4px_0_0_hsl(var(--foreground))]"
            >
              <div
                className="mb-3 aspect-video rounded-md bg-cover bg-center"
                style={{ background: "linear-gradient(135deg,#2B6CB0,#38B2AC)" }}
              />
              <h3 className="text-base font-semibold">{d.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{d.description}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="container py-16">
        <h2 className="mb-8 text-center text-3xl font-bold md:text-4xl">
          Preços simples, em R$, sem surpresa
        </h2>
        <div className="mx-auto grid max-w-5xl gap-6 md:grid-cols-3">
          {pricing.map((p) => (
            <div
              key={p.name}
              className={
                p.highlighted
                  ? "rounded-lg border-2 border-primary p-6 shadow-[4px_4px_0_0_hsl(var(--foreground))]"
                  : "rounded-lg border-2 border-border p-6"
              }
            >
              <h3 className="text-lg font-semibold">{p.name}</h3>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="text-4xl font-bold">{p.priceLabel}</span>
                <span className="text-sm text-muted-foreground">{p.cadence}</span>
              </div>
              <Button
                asChild
                className="mt-6 w-full"
                variant={p.highlighted ? "default" : "outline"}
              >
                <Link href={p.ctaHref}>Começar</Link>
              </Button>
            </div>
          ))}
        </div>
        <div className="mt-8 text-center text-sm text-muted-foreground">
          PIX, boleto ou cartão. NF-e emitida em todos os planos pagos.{" "}
          <Link href="/pricing" className="underline">
            Ver comparativo completo
          </Link>
          .
        </div>
      </section>

      <section className="container py-20">
        <div className="mx-auto max-w-3xl rounded-xl border-2 border-foreground bg-primary p-10 text-center text-primary-foreground shadow-[8px_8px_0_0_hsl(var(--foreground))]">
          <h2 className="text-3xl font-bold md:text-4xl">{finalCta.title}</h2>
          <p className="mt-3 text-base opacity-90">{finalCta.subtitle}</p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
            <Button asChild size="lg" variant="outline">
              <Link href={finalCta.primaryCta.href}>{finalCta.primaryCta.label}</Link>
            </Button>
            <Button asChild size="lg" variant="ghost" className="text-primary-foreground">
              <Link href={finalCta.secondaryCta.href}>{finalCta.secondaryCta.label}</Link>
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}
