import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { demos, leads } from "@/db/schema/app";
import { requireAuth } from "@/lib/auth";
import { withTenant } from "@/lib/db";
import { desc, eq } from "drizzle-orm";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

/**
 * Lista de leads de uma demo + export CSV.
 *
 * A leitura é feita dentro de `withTenant` — a RLS garante que o creator só
 * veja os leads do próprio workspace. O CSV é gerado no servidor (rota
 * abaixo) para não expor dados do cliente desnecessariamente.
 */
export default async function DemoLeadsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { orgId } = await requireAuth();

  const result = await withTenant(orgId, async (db) => {
    const [demo] = await db
      .select({ id: demos.id, title: demos.title, slug: demos.slug })
      .from(demos)
      .where(eq(demos.id, id))
      .limit(1);
    if (!demo) return null;

    const list = await db
      .select({
        id: leads.id,
        name: leads.name,
        email: leads.email,
        phone: leads.phone,
        consentText: leads.consentText,
        consentAt: leads.consentAt,
        createdAt: leads.createdAt,
      })
      .from(leads)
      .where(eq(leads.demoId, id))
      .orderBy(desc(leads.createdAt));

    return { demo, list };
  });

  if (!result) notFound();

  const { demo, list } = result;

  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
      >
        Pular para o conteúdo
      </a>

      <main id="main-content" className="container py-8" aria-labelledby="page-title">
        <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 id="page-title" className="text-3xl font-bold">
              Leads — {demo.title}
            </h1>
            <p className="text-sm text-muted-foreground" aria-live="polite">
              {list.length} lead{list.length === 1 ? "" : "s"} capturado
              {list.length === 1 ? "" : "s"} nesta demo.
            </p>
          </div>
          <Button asChild variant="outline">
            <a href={`/api/v1/demos/${demo.id}/leads/export`}>Exportar CSV</a>
          </Button>
        </header>

        {list.length === 0 ? (
          <Card className="p-12 text-center" role="status">
            <p className="mb-2 text-muted-foreground">Nenhum lead capturado ainda.</p>
            <p className="text-sm text-muted-foreground">
              Ative o formulário de lead no editor e publique a demo para começar a capturar
              contatos.
            </p>
          </Card>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-left text-sm">
              <caption className="sr-only">Leads capturados na demo {demo.title}</caption>
              <thead className="border-b border-border bg-muted/40 text-xs uppercase text-muted-foreground">
                <tr>
                  <th scope="col" className="px-4 py-3">
                    Nome
                  </th>
                  <th scope="col" className="px-4 py-3">
                    E-mail
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Telefone
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Consentimento
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Capturado em
                  </th>
                </tr>
              </thead>
              <tbody>
                {list.map((lead) => (
                  <tr key={lead.id} className="border-b border-border/60 last:border-0">
                    <td className="px-4 py-3">{lead.name ?? "—"}</td>
                    <td className="px-4 py-3">{lead.email ?? "—"}</td>
                    <td className="px-4 py-3">{lead.phone ?? "—"}</td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-muted-foreground">
                        {lead.consentAt.toLocaleString("pt-BR")}
                      </span>
                      <span className="mt-1 block max-w-md text-xs text-muted-foreground">
                        {lead.consentText}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {lead.createdAt.toLocaleString("pt-BR")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </>
  );
}
