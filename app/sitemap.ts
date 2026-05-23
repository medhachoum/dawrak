import type { MetadataRoute } from "next";
import { prisma } from "@/lib/db";

export const revalidate = 3600;

/**
 * Sitemap. Marketing + legal pages are always present. Each business shop
 * page is added so search engines can crawl `/q/{slug}` after launch.
 *
 * The dashboard, customer wait pages, and API are intentionally excluded.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = (
    process.env.NEXT_PUBLIC_BASE_URL ??
    process.env.AUTH_URL ??
    "https://dawrak.example.com"
  ).replace(/\/$/, "");
  const now = new Date();

  let businessUrls: MetadataRoute.Sitemap = [];
  try {
    const shops = await prisma.business.findMany({
      select: { slug: true, updatedAt: true },
    });
    businessUrls = shops.map((s) => ({
      url: `${base}/q/${s.slug}`,
      lastModified: s.updatedAt,
      changeFrequency: "daily",
      priority: 0.7,
    }));
  } catch {
    // DB may be unavailable at build time — keep static entries only.
  }

  return [
    {
      url: `${base}/`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${base}/privacy`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${base}/terms`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    ...businessUrls,
  ];
}
