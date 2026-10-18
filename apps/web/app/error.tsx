"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

/**
 * Root error boundary. Catches errors thrown by any nested route.
 * Provides:
 *   - "Tentar novamente" (calls reset() to retry the segment).
 *   - Link to the (future) status page.
 *   - Correlation id (digest) so support can locate logs.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    // Log client-side; Sentry ingest happens via instrumentation hook.
    console.error("[error.tsx]", error);
  }, [error]);

  return (
    <main className="container flex min-h-dvh flex-col items-center justify-center gap-6 py-16 text-center">
      <span className="rounded-full border border-border bg-muted px-3 py-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
        Erro 500 · algo deu errado
      </span>
      <h1 className="text-balance text-4xl font-bold md:text-5xl">
        Não conseguimos carregar essa página.
      </h1>
      <p className="max-w-md text-muted-foreground">
        Tente recarregar. Se persistir, verifique nossa página de status ou
        entre em contato.
      </p>
      {error.digest ? (
        <code className="rounded bg-muted px-3 py-1 text-xs text-muted-foreground">
          id: {error.digest}
        </code>
      ) : null}
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Button onClick={reset}>Tentar de novo</Button>
        <Button asChild variant="outline">
          <Link
            href="https://status.dominio.com.br"
            target="_blank"
            rel="noreferrer"
          >
            Página de status
          </Link>
        </Button>
        <Button asChild variant="ghost">
          <Link href="/">Voltar ao início</Link>
        </Button>
      </div>
    </main>
  );
}
