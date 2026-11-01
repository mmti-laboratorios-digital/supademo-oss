import { EmbedPlayer } from "@/components/embed/EmbedPlayer";
import type { LeadFormValues } from "@/components/player/LeadForm";
import { demos, steps, workspaces } from "@/db/schema/app";
import { getBrandingByDemoId } from "@/lib/branding";
import { getDb } from "@/lib/db";
import { getPlanLimits, getWorkspacePlanIdPublic } from "@/lib/plans";
import type { FinalCta } from "@easydemo/shared";
import { asc, eq } from "drizzle-orm";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function EmbedPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const db = getDb();
  const [demo] = await db.select().from(demos).where(eq(demos.id, id)).limit(1);
  if (!demo || demo.status !== "published") notFound();

  const publishedDemo = demo;

  const stepList = await db
    .select()
    .from(steps)
    .where(eq(steps.demoId, demo.id))
    .orderBy(asc(steps.position));

  const [workspace] = await db
    .select({ name: workspaces.name })
    .from(workspaces)
    .where(eq(workspaces.id, demo.workspaceId))
    .limit(1);

  // Branding e plano do workspace (contexto público — sem tenant).
  const branding = await getBrandingByDemoId(id);
  const planId = await getWorkspacePlanIdPublic(demo.workspaceId);
  const planLimits = await getPlanLimits(planId);

  async function handleLeadSubmit(values: LeadFormValues) {
    const res = await fetch("/api/v1/leads", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        demoId: publishedDemo.id,
        name: values.name,
        email: values.email,
        phone: values.phone || undefined,
        consent: values.consent,
        locale: publishedDemo.language === "en" ? "en" : "pt-BR",
      }),
    });
    if (!res.ok) {
      const body = (await res.json().catch(() => null)) as { message?: string } | null;
      throw new Error(body?.message ?? "Não foi possível enviar seus dados.");
    }
  }

  return (
    <main className="min-h-dvh bg-background">
      <EmbedPlayer
        demo={{
          id: publishedDemo.id,
          slug: publishedDemo.slug,
          title: publishedDemo.title,
          description: publishedDemo.description ?? "",
          language: publishedDemo.language === "en" ? "en" : "pt-BR",
          leadFormEnabled: publishedDemo.leadFormEnabled,
          finalCta: (publishedDemo.finalCta as FinalCta | null) ?? null,
        }}
        steps={stepList.map((s) => ({
          id: s.id,
          position: s.position,
          screenshotUrl: publicR2Url(s.screenshotR2Key),
          sourceUrl: s.sourceUrl,
          sourceTitle: s.sourceTitle ?? "",
          caption: s.caption ?? "",
          hotspot: (s.hotspot as {
            type: "pointer" | "callout" | "area";
            x: number;
            y: number;
            w?: number;
            h?: number;
          }) ?? { type: "pointer", x: 50, y: 50 },
        }))}
        locale={demo.language as "pt-BR" | "en"}
        embedded
        leadFormConsentText={demo.leadFormConsentText}
        workspaceName={workspace?.name ?? "EasyDemo"}
        onLeadSubmit={handleLeadSubmit}
        brandLogoUrl={branding?.logoUrl}
        brandColor={branding?.brandColor}
        watermarkOnCta={planLimits.watermarkOnCta}
      />
    </main>
  );
}

function publicR2Url(key: string): string {
  const base = process.env.R2_PUBLIC_BASE_URL;
  if (!base) return `/_static/${key}`;
  return `${base.replace(/\/$/, "")}/${key}`;
}
