import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { demos } from "@/db/schema/app";
import { requireAuth } from "@/lib/auth";
import { withTenant } from "@/lib/db";
import { shortId } from "@/lib/utils";
import { eq } from "drizzle-orm";
import Link from "next/link";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ demoId?: string }>;

export default async function NewDemoPage({ searchParams }: { searchParams: SearchParams }) {
  const { orgId } = await requireAuth();
  const { demoId } = await searchParams;

  if (demoId) {
    const existing = await withTenant(orgId, async (db) => {
      const [demo] = await db
        .select({ id: demos.id })
        .from(demos)
        .where(eq(demos.id, demoId))
        .limit(1);
      return demo ?? null;
    });

    if (existing) {
      redirect(`/demos/${existing.id}/edit`);
    }
  }

  const slug = `demo-${shortId(10).toLowerCase()}`;
  const [demo] = await withTenant(orgId, async (db) =>
    db
      .insert(demos)
      .values({
        workspaceId: orgId,
        slug,
        title: "Nova demo",
        status: "draft",
      })
      .returning({ id: demos.id }),
  );

  if (!demo) {
    redirect("/demos");
  }

  // F2.3 — caminho sem extensão Chrome: o creator chega direto no editor e
  // envia os screenshots pelo upload manual (botão "Criar" na sidebar).
  redirect(`/demos/${demo.id}/edit`);
}

export function CreateDemoFallback() {
  return (
    <main className="container py-8">
      <Card className="p-8">
        <h1 className="text-2xl font-bold">Não foi possível criar a demo</h1>
        <p className="mt-2 text-muted-foreground">Tente novamente em alguns instantes.</p>
        <Button asChild className="mt-4">
          <Link href="/demos">Voltar para as demos</Link>
        </Button>
      </Card>
    </main>
  );
}
