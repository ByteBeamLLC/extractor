import type { MetadataRoute } from "next"

const BASE_URL = "https://parsli.co"

const useCaseSlugs = [
  "invoice-parsing",
  "email-parsing",
  "pdf-data-extraction",
  "receipt-scanning",
  "document-automation",
  "intelligent-document-processing",
  "ocr-data-extraction",
  "pdf-to-excel",
  "pdf-to-csv",
  "pdf-to-json",
]

const integrationSlugs = [
  "google-sheets",
  "zapier",
  "make",
  "gmail",
  "webhooks",
  "api",
]

const alternativeSlugs = [
  "parseur",
  "docparser",
  "nanonets",
  "upstage",
]

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
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/docs`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.7,
    },
  ]

  const useCasePages: MetadataRoute.Sitemap = useCaseSlugs.map((slug) => ({
    url: `${BASE_URL}/use-cases/${slug}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.8,
  }))

  const integrationPages: MetadataRoute.Sitemap = integrationSlugs.map(
    (slug) => ({
      url: `${BASE_URL}/integrations/${slug}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })
  )

  const alternativePages: MetadataRoute.Sitemap = alternativeSlugs.map(
    (slug) => ({
      url: `${BASE_URL}/alternative/${slug}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })
  )

  return [
    ...staticPages,
    ...useCasePages,
    ...integrationPages,
    ...alternativePages,
  ]
}
