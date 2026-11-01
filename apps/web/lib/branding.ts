/**
 * apps/web/lib/branding.ts
 * -----------------------------------------------------------------------------
 * Leitura pública do branding do workspace.
 *
 * ⚠️ O contexto é **público** (`/d/[slug]`, `/embed/[id]`): o visitante não
 * está autenticado, então não podemos usar `withTenant`. A tabela
 * `app.workspaces` tem RLS, mas as colunas de branding são legíveis para
 * qualquer um via join a partir de `app.demos` — desde que a demo esteja
 * `published`.
 *
 * LGPD: só expomos `name`, `brandLogoR2Key` e `brandColor` — nada de e-mail,
 * CNPJ, ids internos ou metadados sensíveis.
 */

import { demos, workspaces } from "@/db/schema/app";
import { getDb } from "@/lib/db";
import { and, eq } from "drizzle-orm";

export type WorkspaceBranding = {
  name: string;
  logoUrl: string | null;
  brandColor: string | null;
};

/**
 * Busca o branding de um workspace a partir do id da demo publicada.
 *
 * ⚠️ Não usa `withTenant` — esta função é chamada de Server Components
 * públicos. O join com `app.demos` filtra `status = 'published'` no caller.
 */
export async function getBrandingByDemoId(demoId: string): Promise<WorkspaceBranding | null> {
  const db = getDb();
  const [row] = await db
    .select({
      name: workspaces.name,
      brandLogoR2Key: workspaces.brandLogoR2Key,
      brandColor: workspaces.brandColor,
    })
    .from(workspaces)
    .innerJoin(demos, eq(demos.workspaceId, workspaces.id))
    .where(and(eq(demos.id, demoId), eq(demos.status, "published")))
    .limit(1);

  if (!row) return null;

  return {
    name: row.name,
    logoUrl: row.brandLogoR2Key ? publicR2Url(row.brandLogoR2Key) : null,
    brandColor: row.brandColor,
  };
}

/**
 * Busca o branding de um workspace a partir do slug da demo publicada.
 */
export async function getBrandingByDemoSlug(slug: string): Promise<WorkspaceBranding | null> {
  const db = getDb();
  const [row] = await db
    .select({
      name: workspaces.name,
      brandLogoR2Key: workspaces.brandLogoR2Key,
      brandColor: workspaces.brandColor,
    })
    .from(workspaces)
    .innerJoin(demos, eq(demos.workspaceId, workspaces.id))
    .where(and(eq(demos.slug, slug), eq(demos.status, "published")))
    .limit(1);

  if (!row) return null;

  return {
    name: row.name,
    logoUrl: row.brandLogoR2Key ? publicR2Url(row.brandLogoR2Key) : null,
    brandColor: row.brandColor,
  };
}

function publicR2Url(key: string): string {
  const base = process.env.R2_PUBLIC_BASE_URL;
  if (!base) return `/_static/${key}`;
  return `${base.replace(/\/$/, "")}/${key}`;
}
