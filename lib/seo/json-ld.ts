const BASE_URL = "https://parsli.co"

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Parsli",
    url: BASE_URL,
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
      },
      {
        "@type": "Offer",
        name: "Starter",
        price: "27",
        priceCurrency: "USD",
        priceValidUntil: "2027-12-31",
      },
      {
        "@type": "Offer",
        name: "Growth",
        price: "49",
        priceCurrency: "USD",
        priceValidUntil: "2027-12-31",
      },
      {
        "@type": "Offer",
        name: "Pro",
        price: "79",
        priceCurrency: "USD",
        priceValidUntil: "2027-12-31",
      },
      {
        "@type": "Offer",
        name: "Business",
        price: "279",
        priceCurrency: "USD",
        priceValidUntil: "2027-12-31",
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
