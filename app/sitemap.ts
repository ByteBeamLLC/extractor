import type { MetadataRoute } from "next"
import { getAllSolutionSlugs } from "@/lib/seo/solutions"
import { getAllBlogPosts } from "@/lib/seo/blog-posts"
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
      url: `${BASE_URL}/compare`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/tools`,
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
    // PDF Utility Tools
    {
      url: `${BASE_URL}/tools/pdf-merger`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/tools/pdf-splitter`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/tools/pdf-compressor`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/tools/pdf-page-remover`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/tools/pdf-rotate`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/tools/image-to-pdf`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    // OCR & Text Extraction Tools
    {
      url: `${BASE_URL}/tools/image-to-text`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/tools/pdf-to-text`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/tools/handwriting-to-text`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/tools/screenshot-to-text`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/tools/photo-to-text`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    // Data Conversion Tools
    {
      url: `${BASE_URL}/tools/excel-to-json`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/tools/json-to-excel`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/tools/excel-to-csv`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/tools/csv-to-excel`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    // AI Extraction Tools
    {
      url: `${BASE_URL}/tools/invoice-parser`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/tools/receipt-scanner`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/tools/bank-statement-parser`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/tools/resume-parser`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/tools/pdf-table-extractor`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/tools/ai-summarizer`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/use-cases`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/solutions`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/integrations`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/industries`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/document-types`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.7,
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

  const blogPages: MetadataRoute.Sitemap = getAllBlogPosts().map((post) => ({
    url: `${BASE_URL}/blog/${post.slug}`,
    lastModified: new Date(post.updatedAt),
    changeFrequency: "monthly" as const,
    // Comparison/alternative posts target higher-intent commercial queries
    priority: post.category === "Comparison" ? 0.8 : 0.7,
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

  const comparePages: MetadataRoute.Sitemap = getAllAlternativeSlugs().map(
    (slug) => ({
      url: `${BASE_URL}/compare/${slug}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.8,
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
    ...comparePages,
    ...industryPages,
    ...documentTypePages,
  ]
}
