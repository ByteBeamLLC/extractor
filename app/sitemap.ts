import type { MetadataRoute } from "next"
import { getAllSolutionSlugs } from "@/lib/seo/solutions"
import { getAllBlogSlugs } from "@/lib/seo/blog-posts"
import { getAllUseCaseSlugs } from "@/lib/seo/use-cases"
import { getAllAlternativeSlugs } from "@/lib/seo/alternatives"
import { getAllIntegrationSlugs } from "@/lib/seo/integrations"
import { getAllIndustrySlugs } from "@/lib/seo/industries"
import { getAllDocumentTypeSlugs } from "@/lib/seo/document-types"

const BASE_URL = "https://parsli.co"

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
      url: `${BASE_URL}/pricing`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/docs`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/blog`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/tools/pdf-to-excel`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/privacy`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/terms`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ]

  const solutionPages: MetadataRoute.Sitemap = getAllSolutionSlugs().map(
    (slug) => ({
      url: `${BASE_URL}/solutions/${slug}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.9,
    })
  )

  const blogPages: MetadataRoute.Sitemap = getAllBlogSlugs().map((slug) => ({
    url: `${BASE_URL}/blog/${slug}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }))

  const useCasePages: MetadataRoute.Sitemap = getAllUseCaseSlugs().map(
    (slug) => ({
      url: `${BASE_URL}/use-cases/${slug}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })
  )

  const integrationPages: MetadataRoute.Sitemap = getAllIntegrationSlugs().map(
    (slug) => ({
      url: `${BASE_URL}/integrations/${slug}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })
  )

  const alternativePages: MetadataRoute.Sitemap = getAllAlternativeSlugs().map(
    (slug) => ({
      url: `${BASE_URL}/alternative/${slug}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })
  )

  const industryPages: MetadataRoute.Sitemap = getAllIndustrySlugs().map(
    (slug) => ({
      url: `${BASE_URL}/industries/${slug}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })
  )

  const documentTypePages: MetadataRoute.Sitemap =
    getAllDocumentTypeSlugs().map((slug) => ({
      url: `${BASE_URL}/document-types/${slug}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    }))

  return [
    ...staticPages,
    ...solutionPages,
    ...blogPages,
    ...useCasePages,
    ...integrationPages,
    ...alternativePages,
    ...industryPages,
    ...documentTypePages,
  ]
}
