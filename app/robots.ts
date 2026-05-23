import type { MetadataRoute } from "next";

/**
 * Robots policy:
 *  - Public marketing/legal pages and shop pages are indexable.
 *  - Dashboard, API, and per-customer wait pages are excluded
 *    (they're either auth-gated or contain ephemeral session data).
 */
export default function robots(): MetadataRoute.Robots {
  const base =
    process.env.NEXT_PUBLIC_BASE_URL ??
    process.env.AUTH_URL ??
    "https://dawrak.example.com";
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/privacy", "/terms"],
        disallow: ["/dashboard", "/dashboard/", "/api/"],
      },
    ],
    sitemap: `${base.replace(/\/$/, "")}/sitemap.xml`,
  };
}
