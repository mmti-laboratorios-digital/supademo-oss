import type { MetadataRoute } from "next";

/**
 * robots.txt. Allows everything by default; explicitly disallows /api, /embed
 * (rendered inline elsewhere) and /demos/* (auth-required app routes).
 * Sitemap reference uses NEXT_PUBLIC_BASE_URL when set.
 */
export default function robots(): MetadataRoute.Robots {
  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL ??
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.APP_BASE_URL ??
    "http://localhost:3000";

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/embed/",
          "/demos/",
          "/workspace/",
          "/billing/",
          "/admin/",
          "/onboarding/",
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
