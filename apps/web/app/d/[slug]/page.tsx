import { ConsentBanner } from "@/components/player/ConsentBanner";
import { DemoPlayer } from "@/components/player/DemoPlayer";
import type { LeadFormValues } from "@/components/player/LeadForm";
import { demos, steps, workspaces } from "@/db/schema/app";
import { recordView } from "@/lib/analytics/events";
import { analyticsVisitorCookie } from "@/lib/analytics/visitor";
import { getBrandingByDemoSlug } from "@/lib/branding";
import { getDb } from "@/lib/db";
import { getPlanLimits, getWorkspacePlanIdPublic } from "@/lib/plans";
import type { FinalCta } from "@easydemo/shared";
import { asc, eq } from "drizzle-orm";
import { headers } from "next/headers";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function PublicDemoPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  // Bypass RLS para leitura pública — checa status=published e adiciona evento.
  const db = getDb(); // sem tenant — usa role público (read-only)
  const [demo] = await db.select().from(demos).where(eq(demos.slug, slug)).limit(1);

  if (!demo || demo.status !== "published") {
    notFound();
  }

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

  // Visitor cookie first-party (LGPD-safe)
  const cookieStore = await headers();
  const visitor = await analyticsVisitorCookie(cookieStore);

  // Branding e plano do workspace (contexto público — sem tenant).
  const branding = await getBrandingByDemoSlug(slug);
  const planId = await getWorkspacePlanIdPublic(demo.workspaceId);
  const planLimits = await getPlanLimits(planId);

  // Registra evento 'view' (fire-and-forget)
  void recordView({
    eventType: "view",
    demoId: demo.id,
    workspaceId: demo.workspaceId,
    visitorIdHash: visitor.idHash,
    deviceClass: visitor.deviceClass,
    referrerHost: visitor.referrerHost,
    countryCode: visitor.countryCode,
  });

  /**
   * Submit do lead form. O player é público: o endpoint `/api/v1/leads`
   * deriva o `workspaceId` do demo, então o cliente só manda o que é do
   * visitante.
   */
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
    <main className="min-h-dvh bg-muted/30">
      <DemoPlayer
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
        leadFormConsentText={demo.leadFormConsentText}
        workspaceName={workspace?.name ?? "EasyDemo"}
        onLeadSubmit={handleLeadSubmit}
        brandLogoUrl={branding?.logoUrl}
        brandColor={branding?.brandColor}
        watermarkOnCta={planLimits.watermarkOnCta}
      />
      <ConsentBanner locale={demo.language as "pt-BR" | "en"} />
    </main>
  );
}

function publicR2Url(key: string): string {
  const base = process.env.R2_PUBLIC_BASE_URL;
  if (!base) return `/_static/${key}`;
  return `${base.replace(/\/$/, "")}/${key}`;
}
