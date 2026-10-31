import { demos, steps } from "@/db/schema/app";
import { withTenant } from "@/lib/db";
import type { Demo, Step } from "@easydemo/shared";
import { and, desc, eq } from "drizzle-orm";

/**
 * Repository pattern para isolar queries Drizzle dos componentes.
 * Cada função encapsula o `withTenant` automaticamente.
 */

export async function listDemos(
  orgId: string,
  opts: { status?: "draft" | "published" | "archived"; limit?: number } = {},
): Promise<Pick<Demo, "id" | "slug" | "title" | "status" | "language" | "updatedAt">[]> {
  const { status, limit = 50 } = opts;
  return withTenant(orgId, async (db) => {
    const where = status
      ? and(eq(demos.workspaceId, orgId), eq(demos.status, status))
      : eq(demos.workspaceId, orgId);
    return db
      .select({
        id: demos.id,
        slug: demos.slug,
        title: demos.title,
        status: demos.status,
        language: demos.language,
        updatedAt: demos.updatedAt,
      })
      .from(demos)
      .where(where)
      .orderBy(desc(demos.updatedAt))
      .limit(limit) as unknown as Promise<
      Pick<Demo, "id" | "slug" | "title" | "status" | "language" | "updatedAt">[]
    >;
  });
}

export async function getDemoWithSteps(
  orgId: string,
  demoId: string,
): Promise<{ demo: Demo; steps: Step[] } | null> {
  return withTenant(orgId, async (db) => {
    const [demo] = await db.select().from(demos).where(eq(demos.id, demoId)).limit(1);
    if (!demo) return null;
    const stepList = await db.select().from(steps).where(eq(steps.demoId, demoId));
    return { demo: demo as Demo, steps: stepList as Step[] };
  });
}

export type PublishDemoResult =
  | { ok: true; demo: typeof demos.$inferSelect }
  | { ok: false; reason: "NOT_FOUND" | "NO_STEPS" | "SLUG_TAKEN" };

/**
 * Publica uma demo no slug informado.
 *
 * O slug é global no schema (`app.demos.slug` tem UNIQUE), portanto a
 * unicidade é verificada dentro do tenant para evitar revelar demos de
 * outro workspace; o índice global continua protegendo contra corrida.
 */
export async function publishDemo(
  orgId: string,
  demoId: string,
  slug: string,
): Promise<PublishDemoResult> {
  return withTenant(orgId, async (db) => {
    const [demo] = await db
      .select({ id: demos.id })
      .from(demos)
      .where(and(eq(demos.id, demoId), eq(demos.workspaceId, orgId)))
      .limit(1);
    if (!demo) return { ok: false, reason: "NOT_FOUND" };

    const [step] = await db
      .select({ id: steps.id })
      .from(steps)
      .where(eq(steps.demoId, demoId))
      .limit(1);
    if (!step) return { ok: false, reason: "NO_STEPS" };

    const [slugOwner] = await db
      .select({ id: demos.id })
      .from(demos)
      .where(eq(demos.slug, slug))
      .limit(1);
    if (slugOwner && slugOwner.id !== demoId) {
      return { ok: false, reason: "SLUG_TAKEN" };
    }

    const [published] = await db
      .update(demos)
      .set({ slug, status: "published", publishedAt: new Date(), updatedAt: new Date() })
      .where(and(eq(demos.id, demoId), eq(demos.workspaceId, orgId)))
      .returning();

    if (!published) return { ok: false, reason: "NOT_FOUND" };
    return { ok: true, demo: published };
  });
}

/** Despublica uma demo, voltando para rascunho e limpando `published_at`. */
export async function unpublishDemo(
  orgId: string,
  demoId: string,
): Promise<{ ok: true; demo: typeof demos.$inferSelect } | { ok: false; reason: "NOT_FOUND" }> {
  return withTenant(orgId, async (db) => {
    const [updated] = await db
      .update(demos)
      .set({ status: "draft", publishedAt: null, updatedAt: new Date() })
      .where(and(eq(demos.id, demoId), eq(demos.workspaceId, orgId)))
      .returning();
    if (!updated) return { ok: false, reason: "NOT_FOUND" };
    return { ok: true, demo: updated };
  });
}
