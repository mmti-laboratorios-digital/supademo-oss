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
