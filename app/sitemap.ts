import type { MetadataRoute } from "next"
import { SFDA_TOOLS } from "@/lib/sfda/tools"

const BASE_URL = "https://bytebeam.co"

/**
 * Public sitemap for the marketing surfaces served from the Bytebeam root
 * domain. Extractor and authenticated app routes are intentionally excluded.
 *
 * Adding a new SFDA tool? Append it to `SFDA_TOOLS` in `lib/sfda/tools.ts`
 * and the sitemap picks it up automatically.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/sfda`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.9,
    },
  ]

  const sfdaToolPages: MetadataRoute.Sitemap = SFDA_TOOLS.map((tool) => ({
    url: `${BASE_URL}/sfda/${tool.slug}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.8,
  }))

  return [...staticPages, ...sfdaToolPages]
}
