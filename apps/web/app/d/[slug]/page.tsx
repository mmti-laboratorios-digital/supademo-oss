import { ConsentBanner } from "@/components/player/ConsentBanner";
import { DemoPlayer } from "@/components/player/DemoPlayer";
import { demos, steps } from "@/db/schema/app";
import { recordView } from "@/lib/analytics/events";
import { analyticsVisitorCookie } from "@/lib/analytics/visitor";
import { getDb } from "@/lib/db";
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

  const stepList = await db
    .select()
    .from(steps)
    .where(eq(steps.demoId, demo.id))
    .orderBy(asc(steps.position));

  // Visitor cookie first-party (LGPD-safe)
  const cookieStore = await headers();
  const visitor = await analyticsVisitorCookie(cookieStore);

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

  return (
    <main className="min-h-dvh bg-muted/30">
      <DemoPlayer
        demo={{
          id: demo.id,
          slug: demo.slug,
          title: demo.title,
          description: demo.description ?? "",
          language: demo.language === "en" ? "en" : "pt-BR",
          leadFormEnabled: demo.leadFormEnabled,
          finalCta: null,
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
