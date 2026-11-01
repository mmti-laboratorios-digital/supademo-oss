import { CopySnippet } from "@/components/embed/CopySnippet";
import { demos } from "@/db/schema/app";
import { requireAuth } from "@/lib/auth";
import { withTenant } from "@/lib/db";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

/**
 * apps/web/app/(app)/demos/[id]/embed/page.tsx
 * -----------------------------------------------------------------------------
 * Página do creator com o snippet de embed copiável.
 *
 * Gera um `<iframe src="https://easydemo.io/embed/{id}" ...>` com altura
 * responsiva, `loading="lazy"`, sem chrome.
 *
 * ⚠️ O embed público já existe em `app/embed/[id]/page.tsx` — este arquivo
 * é só a UI do creator para copiar o código.
 */
export default async function DemoEmbedPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { orgId } = await requireAuth();

  const demo = await withTenant(orgId, async (db) => {
    const [row] = await db
      .select({ id: demos.id, title: demos.title, slug: demos.slug })
      .from(demos)
      .where(eq(demos.id, id))
      .limit(1);
    return row ?? null;
  });
  if (!demo) notFound();

  const host = await canonicalHost();
  const embedUrl = `${host}/embed/${demo.id}`;
  const publicUrl = `${host}/d/${demo.slug}`;

  const iframeSnippet = `<iframe
  src="${embedUrl}"
  width="100%"
  height="600"
  style="border: none; border-radius: 12px; max-width: 100%;"
  loading="lazy"
  allow="fullscreen"
  title="${escapeHtml(demo.title)}">
</iframe>`;

  return (
    <main className="container py-8">
      <header className="mb-6">
        <h1 className="text-3xl font-bold">{demo.title}</h1>
        <p className="text-sm text-muted-foreground">Embed em sites e landing pages</p>
      </header>

      <section className="grid gap-8 lg:grid-cols-2">
        <CopySnippet label="Código do embed" value={iframeSnippet} />
        <CopySnippet label="Link direto do demo" value={publicUrl} />
      </section>

      <section className="mt-8">
        <h2 className="mb-3 text-lg font-semibold">Preview</h2>
        <div className="overflow-hidden rounded-lg border border-border">
          <iframe
            src={embedUrl}
            width="100%"
            height="600"
            style={{ border: "none" }}
            loading="lazy"
            allow="fullscreen"
            title={`Preview de ${demo.title}`}
          />
        </div>
      </section>
    </main>
  );
}

/**
 * Host canônico do app.
 *
 * ⚠️ Em produção, usa `NEXT_PUBLIC_APP_URL` se existir. Em dev/teste, cai no
 * header `host` da requisição. Não usamos `window` porque esta função roda
 * em Server Component.
 */
async function canonicalHost(): Promise<string> {
  const envUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (envUrl) return envUrl.replace(/\/$/, "");

  const h = await headers();
  const host = h.get("host") ?? "easydemo.io";
  const protocol = host.includes("localhost") || host.startsWith("127.") ? "http" : "https";
  return `${protocol}://${host}`;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
