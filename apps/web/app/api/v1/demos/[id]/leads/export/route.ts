import { demos, leads } from "@/db/schema/app";
import { requireAuth } from "@/lib/auth";
import { withTenant } from "@/lib/db";
import { eq } from "drizzle-orm";

export const runtime = "nodejs";

/**
 * Export CSV dos leads de uma demo.
 *
 * Leitura dentro de `withTenant` — a RLS garante o isolamento por
 * workspace. O CSV é gerado no servidor: os dados não passam pelo browser
 * antes de virar arquivo.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
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
          name: leads.name,
          email: leads.email,
          phone: leads.phone,
          consentText: leads.consentText,
          consentAt: leads.consentAt,
          createdAt: leads.createdAt,
        })
        .from(leads)
        .where(eq(leads.demoId, id));

      return { demo, list };
    });

    if (!result) {
      return new Response(JSON.stringify({ error: "NOT_FOUND" }), {
        status: 404,
        headers: { "content-type": "application/json" },
      });
    }

    const header = [
      "nome",
      "email",
      "telefone",
      "consentimento_em",
      "texto_consentimento",
      "capturado_em",
    ];
    const rows = result.list.map((lead) => [
      lead.name ?? "",
      lead.email ?? "",
      lead.phone ?? "",
      lead.consentAt.toISOString(),
      lead.consentText,
      lead.createdAt.toISOString(),
    ]);

    const csv = [header, ...rows].map((row) => row.map(csvCell).join(",")).join("\r\n");
    const filename = `leads-${result.demo.slug}.csv`;

    return new Response(`﻿${csv}`, {
      status: 200,
      headers: {
        "content-type": "text/csv; charset=utf-8",
        "content-disposition": `attachment; filename="${filename}"`,
        "cache-control": "no-store",
      },
    });
  } catch (err) {
    if (err instanceof Error) {
      if (err.message === "UNAUTHORIZED") {
        return new Response(JSON.stringify({ error: "UNAUTHORIZED" }), {
          status: 401,
          headers: { "content-type": "application/json" },
        });
      }
      if (err.message === "NO_WORKSPACE") {
        return new Response(JSON.stringify({ error: "NO_WORKSPACE" }), {
          status: 403,
          headers: { "content-type": "application/json" },
        });
      }
    }
    console.error("[/api/v1/demos/:id/leads/export] error:", err);
    return new Response(JSON.stringify({ error: "INTERNAL" }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }
}

/**
 * Escapa um campo CSV: duplica as aspas e envolve em aspas quando precisa.
 * O BOM (﻿) no começo do arquivo faz o Excel abrir em UTF-8.
 */
function csvCell(value: string): string {
  if (/[",\r\n]/.test(value)) {
    return `"${value.replaceAll('"', '""')}"`;
  }
  return value;
}
