import { BrandingEditor } from "@/components/workspace/BrandingEditor";
import { workspaces } from "@/db/schema/app";
import { requireAuth } from "@/lib/auth";
import { withTenant } from "@/lib/db";
import { publicUrl } from "@/lib/r2";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export default async function WorkspaceSettingsPage() {
  const { orgId } = await requireAuth();
  const [ws] = await withTenant(orgId, async (db) =>
    db.select().from(workspaces).where(eq(workspaces.id, orgId)).limit(1),
  );

  const logoUrl = ws?.brandLogoR2Key ? publicUrl(ws.brandLogoR2Key) : null;

  return (
    <main className="container max-w-2xl space-y-6 py-8">
      <div>
        <h1 className="text-3xl font-bold">Workspace</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Configurações que valem para todas as demos deste workspace.
        </p>
      </div>

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

      {/* F7.6 — branding do workspace: era lido pelo player mas não havia UI
          para gravar. O `ThemeEditor` do editor de demos edita o tema da demo
          (fonte, raio, fundo), que é outro conceito. */}
      <BrandingEditor
        initialBrandColor={ws?.brandColor ?? null}
        initialBrandLogoR2Key={ws?.brandLogoR2Key ?? null}
        initialLogoUrl={logoUrl}
        planId={ws?.planId ?? "free"}
      />
    </main>
  );
}
