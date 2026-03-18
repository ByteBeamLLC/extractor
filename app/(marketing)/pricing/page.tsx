import type { Metadata } from "next"
import { PricingSection } from "@/components/marketing/sections/PricingSection"
import { JsonLd } from "@/components/marketing/shared/JsonLd"
import {
  breadcrumbJsonLd,
  softwareApplicationJsonLd,
  productJsonLd,
  faqJsonLd,
} from "@/lib/seo/json-ld"

const pricingFaq = [
  {
    question: "How does Parsli's page-based pricing work?",
    answer:
      "Each document you process counts as one page. Your page allowance resets every 30 days. If you exceed your limit, extractions pause until the next reset or you upgrade your plan.",
  },
  {
    question: "Can I try Parsli for free?",
    answer:
      "Yes! The free plan includes 30 pages per month, up to 3 parsers, and full access to all features including API access and integrations. No credit card required.",
  },
  {
    question: "What's included in every Parsli plan?",
    answer:
      "All plans include AI-powered extraction with Google Gemini 2.5 Pro, the no-code schema builder, webhook integrations, REST API access, and structured JSON/CSV output.",
  },
  {
    question: "Can I change or cancel my plan anytime?",
    answer:
      "Yes. You can upgrade, downgrade, or cancel your subscription at any time. Changes take effect at the start of your next billing cycle. There are no long-term contracts.",
  },
  {
    question: "Do you offer annual billing?",
    answer:
      "Yes. Annual plans save approximately 20% compared to monthly billing. For example, the Starter plan is $33/month billed monthly or $27/month billed annually.",
  },
]

export const metadata: Metadata = {
  title: "Pricing - Simple, Page-Based Pricing",
  description:
    "Parsli pricing plans start free with 30 pages/month. Pay only for what you use. Plans from $33/month. No credit card required to start.",
  alternates: {
    canonical: "https://parsli.co/pricing",
  },
  openGraph: {
    title: "Parsli Pricing - Start Free, Scale as You Grow",
    description:
      "Simple, page-based pricing. Free plan with 30 pages/month. Paid plans from $33/month.",
    url: "https://parsli.co/pricing",
  },
}

export default function PricingPage() {
  return (
    <div className="pt-16">
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", url: "https://parsli.co" },
          { name: "Pricing", url: "https://parsli.co/pricing" },
        ])}
      />
      <JsonLd data={softwareApplicationJsonLd()} />
      <JsonLd data={productJsonLd()} />
      <JsonLd data={faqJsonLd(pricingFaq)} />
      <PricingSection />
    </div>
  )
}
