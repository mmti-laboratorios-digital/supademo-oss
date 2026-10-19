import { DemoPlayer } from "@/components/player/DemoPlayer";
import { demos, steps } from "@/db/schema/app";
import { getDb } from "@/lib/db";
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

  const stepList = await db
    .select()
    .from(steps)
    .where(eq(steps.demoId, demo.id))
    .orderBy(asc(steps.position));

  return (
    <main className="min-h-dvh bg-background">
      <DemoPlayer
        demo={{
          id: demo.id,
          slug: demo.slug,
          title: demo.title,
          description: demo.description ?? "",
          language: demo.language === "en" ? "en" : "pt-BR",
          leadFormEnabled: false,
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
        embedded
      />
    </main>
  );
}

function publicR2Url(key: string): string {
  const base = process.env.R2_PUBLIC_BASE_URL;
  if (!base) return `/_static/${key}`;
  return `${base.replace(/\/$/, "")}/${key}`;
}
