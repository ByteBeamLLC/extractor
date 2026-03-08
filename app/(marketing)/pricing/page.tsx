import type { Metadata } from "next"
import { PricingSection } from "@/components/marketing/sections/PricingSection"
import { JsonLd } from "@/components/marketing/shared/JsonLd"
import { breadcrumbJsonLd } from "@/lib/seo/json-ld"

export const metadata: Metadata = {
  title: "Pricing - Simple, Page-Based Pricing",
  description:
    "Parsli pricing plans start free with 30 pages/month. Pay only for what you use. Plans from $27/month. No credit card required to start.",
  alternates: {
    canonical: "https://parsli.co/pricing",
  },
  openGraph: {
    title: "Parsli Pricing - Start Free, Scale as You Grow",
    description:
      "Simple, page-based pricing. Free plan with 30 pages/month. Paid plans from $27/month.",
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
      <PricingSection />
    </div>
  )
}
