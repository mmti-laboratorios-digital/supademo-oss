import type { MetadataRoute } from "next";
import { listBlogPosts } from "./(marketing)/content/contentLoader";

/**
 * Dynamic sitemap. Source:
 *   - Static landing/comparison/support routes (hardcoded below).
 *   - Blog posts discovered at build time from content/blog/*.mdx.
 *
 * Base URL precedence:
 *   1. NEXT_PUBLIC_BASE_URL (canonical, public).
 *   2. NEXT_PUBLIC_APP_URL (legacy alias).
 *   3. APP_BASE_URL (server-only, contains the env validation schema).
 *   4. http://localhost:3000.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL ??
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.APP_BASE_URL ??
    "http://localhost:3000";

  const now = new Date();
  const posts = await listBlogPosts();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${baseUrl}/`, lastModified: now, changeFrequency: "weekly", priority: 1.0 },
    { url: `${baseUrl}/pricing`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${baseUrl}/sobre`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${baseUrl}/blog`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${baseUrl}/lgpd`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    {
      url: `${baseUrl}/comparar/supademo`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/comparar/guideflow`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/comparar/storylane`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/use-cases/onboarding`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${baseUrl}/use-cases/lead-qualification`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.5,
    },
  ];

  const blogRoutes: MetadataRoute.Sitemap = posts.map((p) => ({
    url: `${baseUrl}/blog/${p.slug}`,
    lastModified: new Date(p.publishedAt),
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  return [...staticRoutes, ...blogRoutes];
}
