import type { Metadata } from "next"
import { HeroSection } from "@/components/marketing/sections/HeroSection"
import { ProblemSection } from "@/components/marketing/sections/ProblemSection"
import { FeaturesSection } from "@/components/marketing/sections/FeaturesSection"
import { UseCasesSection } from "@/components/marketing/sections/UseCasesSection"
import { HowItWorksSection } from "@/components/marketing/sections/HowItWorksSection"
import { IntegrationsSection } from "@/components/marketing/sections/IntegrationsSection"
import { FreeToolsSection } from "@/components/marketing/sections/FreeToolsSection"
import { PricingSection } from "@/components/marketing/sections/PricingSection"
import { FAQSection } from "@/components/marketing/sections/FAQSection"
import { faqItems } from "@/lib/seo/faq-data"
import { CTASection } from "@/components/marketing/sections/CTASection"
import { JsonLd } from "@/components/marketing/shared/JsonLd"
import {
  organizationJsonLd,
  websiteJsonLd,
  softwareApplicationJsonLd,
  faqJsonLd,
} from "@/lib/seo/json-ld"

export const metadata: Metadata = {
  title: "Parsli - AI-Powered Document Data Extraction Software",
  description:
    "Extract structured data from PDFs, invoices, images, and emails automatically with AI. No-code document parser with Google Sheets, Zapier, Make, and API integrations. Start free.",
  keywords: [
    "document data extraction",
    "pdf data extraction software",
    "AI document parser",
    "invoice parsing software",
    "email parser software",
    "no-code document parser",
    "intelligent document processing",
    "pdf to excel converter",
    "extract data from pdf",
    "automated document processing",
    "OCR data extraction",
    "document automation software",
  ],
  alternates: {
    canonical: "https://parsli.co",
  },
  openGraph: {
    title: "Parsli - AI-Powered Document Data Extraction",
    description:
      "Extract structured data from any document with AI. No code required. Connect to Google Sheets, Zapier, and 5,000+ apps.",
    url: "https://parsli.co",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Parsli - AI Document Data Extraction",
      },
    ],
  },
}

export default function LandingPage() {
  return (
    <>
      <JsonLd data={organizationJsonLd()} />
      <JsonLd data={websiteJsonLd()} />
      <JsonLd data={softwareApplicationJsonLd()} />
      <JsonLd
        data={faqJsonLd(
          faqItems.map((item) => ({
            question: item.question,
            answer: item.answer,
          }))
        )}
      />

      <HeroSection />
      <ProblemSection />
      <FeaturesSection />
      <UseCasesSection />
      <HowItWorksSection />
      <IntegrationsSection />
      <FreeToolsSection />
      <PricingSection />
      <FAQSection />
      <CTASection />
    </>
  )
}
