import { Button } from "@/components/ui/button";
import Link from "next/link";

/**
 * 404 page. Includes an inline search affordance and 6 suggested pages.
 * Accessibility:
 *   - h1 is the first focusable heading.
 *   - search is a real GET form (not JS), so it works without hydration.
 */
export default function NotFound() {
  return (
    <main className="container flex min-h-dvh flex-col items-center justify-center gap-8 py-16 text-center">
      <div aria-hidden className="relative h-24 w-24">
        <svg viewBox="0 0 100 100" className="h-full w-full">
          <path
            d="M22 12 L84 50 L22 88 Z"
            fill="#2B6CB0"
            stroke="#1A202C"
            strokeWidth="4"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        </svg>
      </div>

      <header>
        <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Erro 404
        </p>
        <h1 className="mt-2 text-balance text-5xl font-bold md:text-6xl">Página não encontrada.</h1>
        <p className="mt-3 max-w-xl text-muted-foreground">
          A página que você procura não existe, foi movida ou está em um link expirado. Use a busca
          abaixo ou confira nossas páginas principais.
        </p>
      </header>

      <form
        action="/blog"
        method="GET"
        role="search"
        aria-label="Buscar no blog"
        className="flex w-full max-w-md gap-2"
      >
        <label htmlFor="404-q" className="sr-only">
          Buscar
        </label>
        <input
          id="404-q"
          name="q"
          type="search"
          placeholder="Buscar no blog…"
          className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        <Button type="submit">Buscar</Button>
      </form>

      <section
        aria-label="Páginas sugeridas"
        className="mx-auto grid w-full max-w-3xl gap-3 sm:grid-cols-2 md:grid-cols-3"
      >
        {[
          { href: "/", label: "Home", desc: "Página principal e hero." },
          { href: "/pricing", label: "Planos", desc: "Comparativo Free × Pro × Business." },
          { href: "/sobre", label: "Sobre", desc: "História, time e princípios." },
          { href: "/blog", label: "Blog", desc: "Guias, news e engineering." },
          { href: "/d/exemplo-tour", label: "Demo de exemplo", desc: "Tour interativo de demo." },
          { href: "/lgpd", label: "LGPD", desc: "Política de privacidade e DSR." },
        ].map((s) => (
          <Link
            key={s.href}
            href={s.href}
            className="rounded-md border border-border bg-card p-4 text-left transition-colors hover:bg-muted"
          >
            <div className="font-semibold">{s.label}</div>
            <div className="mt-1 text-xs text-muted-foreground">{s.desc}</div>
          </Link>
        ))}
      </section>

      <div className="text-xs text-muted-foreground">
        Procurando algo específico? Escreva pra{" "}
        <Link href="mailto:suporte@dominio.com.br" className="underline">
          suporte@dominio.com.br
        </Link>
        .
      </div>
    </main>
  );
}
