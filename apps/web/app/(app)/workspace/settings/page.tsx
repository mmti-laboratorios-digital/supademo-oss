import { requireAuth } from "@/lib/auth";
import { withTenant } from "@/lib/db";
import { workspaces } from "@/db/schema/app";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export default async function WorkspaceSettingsPage() {
  const { orgId } = await requireAuth();
  const [ws] = await withTenant(orgId, async (db) =>
    db
      .select()
      .from(workspaces)
      .where(eq(workspaces.id, orgId))
      .limit(1),
  );

  return (
    <main className="container max-w-2xl py-8">
      <h1 className="mb-6 text-3xl font-bold">Workspace</h1>
      <dl className="space-y-4 rounded-lg border border-border p-6">
        <div>
          <dt className="text-sm text-muted-foreground">Nome</dt>
          <dd className="font-medium">{ws?.name ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-sm text-muted-foreground">Slug</dt>
          <dd className="font-mono">{ws?.slug ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-sm text-muted-foreground">Plano</dt>
          <dd className="font-medium uppercase">{ws?.planId ?? "free"}</dd>
        </div>
        <div>
          <dt className="text-sm text-muted-foreground">Locale</dt>
          <dd>{ws?.locale ?? "pt-BR"}</dd>
        </div>
      </dl>
    </main>
  );
}