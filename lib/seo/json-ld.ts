const BASE_URL = "https://parsli.co"

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Parsli",
    url: BASE_URL,
    description:
      "AI-powered document data extraction platform. Extract structured data from PDFs, invoices, emails, and images automatically.",
    logo: {
      "@type": "ImageObject",
      url: `${BASE_URL}/parsli-icon.png`,
      width: 512,
      height: 512,
    },
    contactPoint: {
      "@type": "ContactPoint",
      email: "support@parsli.co",
      contactType: "customer service",
    },
    sameAs: ["https://www.linkedin.com/company/parsli"],
  }
}

export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Parsli",
    url: BASE_URL,
    description:
      "AI-powered document data extraction. Extract structured data from PDFs, invoices, emails, and images automatically.",
    inLanguage: "en",
    publisher: {
      "@type": "Organization",
      name: "Parsli",
    },
  }
}

export function softwareApplicationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Parsli",
    url: BASE_URL,
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    description:
      "Extract structured data from PDFs, invoices, emails, and documents automatically with AI. No-code interface with Google Sheets, Zapier, and API integrations.",
    offers: [
      {
        "@type": "Offer",
        name: "Free",
        price: "0",
        priceCurrency: "USD",
        description: "30 pages per month, up to 3 parsers",
      },
      {
        "@type": "Offer",
        name: "Starter",
        price: "20",
        priceCurrency: "USD",
        priceValidUntil: "2027-12-31",
        description: "250 pages per month, up to 10 parsers",
      },
      {
        "@type": "Offer",
        name: "Growth",
        price: "49",
        priceCurrency: "USD",
        priceValidUntil: "2027-12-31",
        description: "1,000 pages per month, up to 25 parsers",
      },
      {
        "@type": "Offer",
        name: "Pro",
        price: "99",
        priceCurrency: "USD",
        priceValidUntil: "2027-12-31",
        description: "5,000 pages per month, up to 100 parsers",
      },
      {
        "@type": "Offer",
        name: "Business",
        price: "249",
        priceCurrency: "USD",
        priceValidUntil: "2027-12-31",
        description: "25,000 pages per month, unlimited parsers",
      },
    ],
    featureList: [
      "AI-powered data extraction",
      "PDF, image, Word, Excel support",
      "No-code schema builder",
      "Google Sheets integration",
      "Zapier integration",
      "Make integration",
      "Gmail inbox automation",
      "REST API & webhooks",
      "Structured JSON output",
    ],
  }
}

export function faqJsonLd(
  items: { question: string; answer: string }[]
) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  }
}

export function blogPostJsonLd({
  title,
  description,
  url,
  publishedAt,
  updatedAt,
  author,
}: {
  title: string
  description: string
  url: string
  publishedAt: string
  updatedAt: string
  author: string
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: title,
    description,
    url,
    image: `${BASE_URL}/parsli-og.png`,
    datePublished: publishedAt,
    dateModified: updatedAt,
    author: {
      "@type": "Person",
      name: author,
      url: "https://www.linkedin.com/in/talal-bazerbachi/",
    },
    publisher: {
      "@type": "Organization",
      name: "Parsli",
      url: BASE_URL,
      logo: {
        "@type": "ImageObject",
        url: `${BASE_URL}/parsli-icon.png`,
        width: 512,
        height: 512,
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": url,
    },
  }
}

export function breadcrumbJsonLd(
  items: { name: string; url: string }[]
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  }
}

export function solutionPageJsonLd(solution: {
  h1: string
  metaDescription: string
  slug: string
  keyword: string
}) {
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: solution.h1,
    description: solution.metaDescription,
    url: `${BASE_URL}/solutions/${solution.slug}`,
    keywords: solution.keyword,
    provider: {
      "@type": "Organization",
      name: "Parsli",
      url: BASE_URL,
    },
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
      description: "Free tier with 30 pages/month",
      url: `${BASE_URL}/pricing`,
    },
  }
}

export function productJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: "Parsli",
    url: BASE_URL,
    description:
      "AI-powered document data extraction platform. Extract structured data from PDFs, invoices, emails, and images automatically with a no-code interface.",
    image: `${BASE_URL}/parsli-og.png`,
    brand: {
      "@type": "Organization",
      name: "Parsli",
    },
    offers: {
      "@type": "AggregateOffer",
      lowPrice: "0",
      highPrice: "249",
      priceCurrency: "USD",
      offerCount: 5,
      url: `${BASE_URL}/pricing`,
    },
    category: "Document Processing Software",
  }
}
