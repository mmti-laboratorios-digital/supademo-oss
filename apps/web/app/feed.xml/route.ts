import { listBlogPosts } from "../(marketing)/content/contentLoader";

/**
 * RSS 2.0 feed for the blog. Latest 20 posts.
 * URL: /feed.xml (Content-Type: application/rss+xml).
 *
 * Uses an escape helper to keep channel-level strings XML-safe.
 */
export const dynamic = "force-static";
export const revalidate = 3600; // refresh hourly

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET() {
  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL ??
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.APP_BASE_URL ??
    "http://localhost:3000";

  const posts = (await listBlogPosts()).slice(0, 20);
  const now = new Date().toUTCString();

  const items = posts
    .map((p) => {
      const url = `${baseUrl}/blog/${p.slug}`;
      const pub = new Date(p.publishedAt).toUTCString();
      return `
    <item>
      <title>${escapeXml(p.title)}</title>
      <link>${escapeXml(url)}</link>
      <guid isPermaLink="true">${escapeXml(url)}</guid>
      <pubDate>${pub}</pubDate>
      <author>noreply@dominio.com.br (${escapeXml(p.author)})</author>
      <category>${escapeXml(p.category)}</category>
      <description>${escapeXml(p.description)}</description>
      <content:encoded><![CDATA[${p.description}]]></content:encoded>
    </item>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
     xmlns:atom="http://www.w3.org/2005/Atom"
     xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>EasyDemo — Blog</title>
    <link>${escapeXml(baseUrl)}/blog</link>
    <description>Guias, news e engineering sobre demos interativas, LGPD e a plataforma EasyDemo.</description>
    <language>pt-BR</language>
    <lastBuildDate>${now}</lastBuildDate>
    <generator>EasyDemo / Next.js</generator>
    <atom:link href="${escapeXml(baseUrl)}/feed.xml" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
