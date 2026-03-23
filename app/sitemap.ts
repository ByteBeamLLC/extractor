import type { MetadataRoute } from "next"
import { getAllSolutionSlugs } from "@/lib/seo/solutions"
import { getAllBlogPosts } from "@/lib/seo/blog-posts"
import { getAllUseCaseSlugs } from "@/lib/seo/use-cases"
import { getAllAlternativeSlugs } from "@/lib/seo/alternatives"
import { getAllIntegrationSlugs } from "@/lib/seo/integrations"
import { getAllIndustrySlugs } from "@/lib/seo/industries"
import { getAllDocumentTypeSlugs } from "@/lib/seo/document-types"
import { getAllGuides } from "@/lib/seo/guides"

const BASE_URL = "https://parsli.co"

export default function sitemap(): MetadataRoute.Sitemap {
  // Use a fixed date for static/rarely-changing pages so Google trusts lastModified signals.
  // Update this date when you make meaningful content changes to static pages.
  const staticDate = new Date("2026-03-19")

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: staticDate,
      changeFrequency: "weekly",
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/pricing`,
      lastModified: staticDate,
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/docs`,
      lastModified: staticDate,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/blog`,
      lastModified: staticDate,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/compare`,
      lastModified: staticDate,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/tools`,
      lastModified: staticDate,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/tools/pdf-to-excel`,
      lastModified: staticDate,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    // PDF Utility Tools
    {
      url: `${BASE_URL}/tools/pdf-merger`,
      lastModified: staticDate,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/tools/pdf-splitter`,
      lastModified: staticDate,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/tools/pdf-compressor`,
      lastModified: staticDate,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/tools/pdf-page-remover`,
      lastModified: staticDate,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/tools/pdf-rotate`,
      lastModified: staticDate,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/tools/image-to-pdf`,
      lastModified: staticDate,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    // OCR & Text Extraction Tools
    {
      url: `${BASE_URL}/tools/image-to-text`,
      lastModified: staticDate,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/tools/pdf-to-text`,
      lastModified: staticDate,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/tools/handwriting-to-text`,
      lastModified: new Date("2026-03-23"),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/tools/screenshot-to-text`,
      lastModified: staticDate,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/tools/photo-to-text`,
      lastModified: staticDate,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    // Data Conversion Tools
    {
      url: `${BASE_URL}/tools/excel-to-json`,
      lastModified: staticDate,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/tools/json-to-excel`,
      lastModified: staticDate,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/tools/excel-to-csv`,
      lastModified: staticDate,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/tools/csv-to-excel`,
      lastModified: staticDate,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    // AI Extraction Tools
    {
      url: `${BASE_URL}/tools/invoice-parser`,
      lastModified: staticDate,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/tools/bol-parser`,
      lastModified: staticDate,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/tools/receipt-scanner`,
      lastModified: staticDate,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/tools/bank-statement-parser`,
      lastModified: staticDate,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/tools/bank-statement-to-excel`,
      lastModified: staticDate,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/tools/bank-statement-to-csv`,
      lastModified: staticDate,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/tools/resume-parser`,
      lastModified: staticDate,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/tools/pdf-table-extractor`,
      lastModified: staticDate,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/tools/ai-summarizer`,
      lastModified: staticDate,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/use-cases`,
      lastModified: staticDate,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/solutions`,
      lastModified: staticDate,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/integrations`,
      lastModified: staticDate,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/industries`,
      lastModified: staticDate,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/document-types`,
      lastModified: staticDate,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/guides`,
      lastModified: staticDate,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/columbus`,
      lastModified: staticDate,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/freight`,
      lastModified: staticDate,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/lp/columbus-3pl`,
      lastModified: staticDate,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    // Note: /lp/freight-invoice and /lp/bol-automation excluded — they have noindex tags
    {
      url: `${BASE_URL}/privacy`,
      lastModified: staticDate,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/terms`,
      lastModified: staticDate,
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ]

  const solutionPages: MetadataRoute.Sitemap = getAllSolutionSlugs().map(
    (slug) => ({
      url: `${BASE_URL}/solutions/${slug}`,
      lastModified: staticDate,
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
      lastModified: staticDate,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })
  )

  const integrationPages: MetadataRoute.Sitemap = getAllIntegrationSlugs().map(
    (slug) => ({
      url: `${BASE_URL}/integrations/${slug}`,
      lastModified: staticDate,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })
  )

  const comparePages: MetadataRoute.Sitemap = getAllAlternativeSlugs().map(
    (slug) => ({
      url: `${BASE_URL}/compare/${slug}`,
      lastModified: staticDate,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })
  )

  const industryPages: MetadataRoute.Sitemap = getAllIndustrySlugs().map(
    (slug) => ({
      url: `${BASE_URL}/industries/${slug}`,
      lastModified: staticDate,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })
  )

  const documentTypePages: MetadataRoute.Sitemap =
    getAllDocumentTypeSlugs().map((slug) => ({
      url: `${BASE_URL}/document-types/${slug}`,
      lastModified: staticDate,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    }))

  const guidePages: MetadataRoute.Sitemap = getAllGuides().map((guide) => ({
    url: `${BASE_URL}/guides/${guide.slug}`,
    lastModified: new Date(guide.updatedAt),
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
    ...guidePages,
  ]
}
