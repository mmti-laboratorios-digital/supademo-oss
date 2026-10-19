import { demos } from "@/db/schema/app";
import { getDb } from "@/lib/db";
import { eq } from "drizzle-orm";
import { ImageResponse } from "next/og";

/**
 * Per-demo Open Graph image (1200×630). Generated via @vercel/og.
 *
 * Route matches: /d/<slug>/opengraph-image
 *
 * Looks up the demo title from DB; falls back to a slug-derived title when
 * the demo is missing or unpublished.
 *
 * Runs on the Node.js runtime because we query Postgres (postgres-js uses
 * node:net, node:tls, node:crypto, node:stream, node:perf_hooks — none of
 * which are available on the edge runtime).
 */

export const runtime = "nodejs";
export const alt = "DemoBR — Demos interativas pra vender mais, sem uma reunião a mais.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({ params }: { params: { slug: string } }) {
  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL ?? process.env.APP_BASE_URL ?? "http://localhost:3000";

  // Look up demo title (best-effort — page should still render if not found).
  let title = slugToTitle(params.slug);
  try {
    const db = getDb();
    const [demo] = await db
      .select({ title: demos.title })
      .from(demos)
      .where(eq(demos.slug, params.slug))
      .limit(1);
    if (demo?.title) title = demo.title;
  } catch {
    /* fall back to slug-derived */
  }

  return new ImageResponse(
    <div
      style={{
        height: "100%",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        background: "linear-gradient(135deg, #2B6CB0 0%, #234E80 55%, #0F2A4A 100%)",
        color: "#FFFFFF",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "40px 60px",
          fontSize: 22,
          opacity: 0.85,
          letterSpacing: 6,
          textTransform: "uppercase",
          fontWeight: 600,
        }}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 32 32"
          style={{ width: 36, height: 36 }}
        >
          <path d="M11 8 L24 16 L11 24 Z" fill="#FFFFFF" />
        </svg>
        DemoBR
      </div>

      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "0 60px",
        }}
      >
        <div
          style={{
            fontSize: 64,
            fontWeight: 800,
            lineHeight: 1.05,
            maxWidth: 900,
            display: "flex",
          }}
        >
          {title}
        </div>
        <div
          style={{
            marginTop: 24,
            fontSize: 28,
            opacity: 0.9,
            fontWeight: 500,
            display: "flex",
          }}
        >
          Demos interativas pra vender mais, sem uma reunião a mais.
        </div>
      </div>

      <div
        style={{
          padding: "0 60px 40px",
          fontSize: 24,
          fontWeight: 700,
          color: "#38B2AC",
          display: "flex",
        }}
      >
        {baseUrl.replace(/^https?:\/\//, "")}
      </div>
    </div>,
    { ...size },
  );
}

function slugToTitle(slug: string): string {
  return slug
    .split("-")
    .map((w) => {
      if (!w.length) return w;
      const head = w[0];
      if (!head) return w;
      return head.toUpperCase() + w.slice(1);
    })
    .join(" ");
}
