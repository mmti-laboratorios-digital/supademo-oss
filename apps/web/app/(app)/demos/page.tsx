import Link from "next/link";
import { desc } from "drizzle-orm";
import { withTenant } from "@/lib/db";
import { demos } from "@/db/schema/app";
import { requireAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function DemosListPage() {
  const { orgId } = await requireAuth();

  const list = await withTenant(orgId, async (db) =>
    db
      .select({
        id: demos.id,
        slug: demos.slug,
        title: demos.title,
        status: demos.status,
        updatedAt: demos.updatedAt,
      })
      .from(demos)
      .orderBy(desc(demos.updatedAt))
      .limit(50),
  );

  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
      >
        Pular para o conteúdo
      </a>

      <main id="main-content" className="container py-8" aria-labelledby="page-title">
        <header className="mb-6 flex items-center justify-between">
          <div>
            <h1 id="page-title" className="text-3xl font-bold">
              Suas demos
            </h1>
            <p className="text-sm text-muted-foreground" aria-live="polite">
              {list.length} demo{list.length === 1 ? "" : "s"} neste workspace.
            </p>
          </div>
          <Button asChild aria-label="Criar nova demo">
            <Link href="/demos/new">Nova demo</Link>
          </Button>
        </header>

        {list.length === 0 ? (
          <Card className="p-12 text-center" role="status">
            <p className="mb-4 text-muted-foreground">
              Você ainda não criou nenhuma demo.
            </p>
            <Button asChild>
              <Link href="/demos/new">Criar a primeira</Link>
            </Button>
          </Card>
        ) : (
          <ul
            className="grid gap-4 md:grid-cols-2 lg:grid-cols-3"
            aria-label="Lista de demos"
          >
            {list.map((d) => (
              <li key={d.id}>
                <Link
                  href={`/demos/${d.id}/edit`}
                  aria-label={`Editar demo: ${d.title} (${d.status})`}
                  className="block rounded-lg border border-border p-4 transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <div className="mb-2 flex items-center justify-between">
                    <span
                      className="rounded-full bg-muted px-2 py-0.5 text-xs uppercase tracking-wide text-muted-foreground"
                      aria-label={`Status: ${d.status}`}
                    >
                      {d.status}
                    </span>
                    <span className="font-mono text-xs text-muted-foreground">
                      /d/{d.slug}
                    </span>
                  </div>
                  <h2 className="font-semibold">{d.title}</h2>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
    </>
  );
}