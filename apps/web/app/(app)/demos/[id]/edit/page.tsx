import { DemoEditor } from "@/components/editor/DemoEditor";
import { EditorI18n } from "@/components/editor/EditorI18n";
import { requireAuth } from "@/lib/auth";
import { withTenant } from "@/lib/db";
import { demos, steps, workspaces } from "@/db/schema/app";
import { eq, asc } from "drizzle-orm";
import { notFound } from "next/navigation";
import type { Demo, Step } from "@demo.br/shared";

export const dynamic = "force-dynamic";

export default async function EditDemoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { orgId } = await requireAuth();

  const result = await withTenant(orgId, async (db) => {
    const [demo] = await db
      .select()
      .from(demos)
      .where(eq(demos.id, id))
      .limit(1);
    if (!demo) return null;
    const stepList = await db
      .select()
      .from(steps)
      .where(eq(steps.demoId, id))
      .orderBy(asc(steps.position));
    const [workspace] = await db
      .select({ planId: workspaces.planId, slug: workspaces.slug })
      .from(workspaces)
      .where(eq(workspaces.id, demo.workspaceId))
      .limit(1);
    return { demo, stepList, workspace };
  });

  if (!result) notFound();

  return (
    <EditorI18n locale={result.demo.language}>
      <main className="h-[calc(100dvh-3.5rem)]">
        <DemoEditor
          demo={result.demo as unknown as Pick<
            Demo,
            | "id"
            | "title"
            | "description"
            | "finalCta"
            | "language"
            | "status"
            | "slug"
            | "leadFormEnabled"
          >}
          initialSteps={result.stepList as unknown as Step[]}
          workspaceSlug={result.workspace?.slug ?? "workspace"}
          workspacePlan={(result.workspace?.planId as "free" | "pro" | "business") ?? "free"}
        />
      </main>
    </EditorI18n>
  );
}