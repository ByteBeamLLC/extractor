import type { Metadata } from "next"
import { Check, X, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { PricingSection } from "@/components/marketing/sections/PricingSection"
import { PricingComparison } from "@/components/marketing/sections/PricingComparison"
import { SavingsCalculator } from "@/components/marketing/sections/SavingsCalculator"
import { PricingFAQ } from "@/components/marketing/sections/PricingFAQ"
import { JsonLd } from "@/components/marketing/shared/JsonLd"
import {
  breadcrumbJsonLd,
  softwareApplicationJsonLd,
  productJsonLd,
  faqJsonLd,
} from "@/lib/seo/json-ld"
import { APP_URL } from "@/lib/config"

const pricingFaqForJsonLd = [
  {
    question: "How does Parsli's page-based pricing work?",
    answer:
      "Each document you process counts based on its number of pages. Your page allowance resets every 30 days. If you exceed your limit, extractions pause until the next reset or you upgrade your plan.",
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
      "Yes. Annual plans save approximately 20% compared to monthly billing. For example, the Growth plan is $49/month billed monthly or $39/month billed annually.",
  },
]

export const metadata: Metadata = {
  title: "Pricing — Simple, Volume-Based Pricing | Parsli",
  description:
    "Parsli pricing starts free with 30 pages/month. Pay only for what you use. Plans from $16/month (billed annually). No credit card required. See how much you can save.",
  alternates: {
    canonical: "https://parsli.co/pricing",
  },
  openGraph: {
    title: "Parsli Pricing — Start Free, Scale as You Grow",
    description:
      "Simple, volume-based pricing. Free plan with 30 pages/month. Paid plans from $16/month. ROI calculator included.",
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
      <JsonLd data={faqJsonLd(pricingFaqForJsonLd)} />

      {/* 1. Pricing cards + billing toggle */}
      <PricingSection asPage />

      {/* 2. Consolidation: Manual processing vs Parsli */}
      <section className="py-20 sm:py-24 lg:py-28 bg-muted/30">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-0 rounded-2xl overflow-hidden border">
            {/* Left — the problem */}
            <div className="bg-card p-8 sm:p-10">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                Manual Processing
              </p>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-3">
                What does manual data entry cost you?
              </h2>
              <p className="text-muted-foreground text-sm mb-6">
                Most teams still copy data from documents by hand &mdash;
                burning time and budget on work that AI can do instantly.
              </p>
              <ul className="space-y-3">
                {[
                  "10+ minutes per document on data entry",
                  "3\u20135% error rate from manual transcription",
                  "Scaling means hiring more people",
                  "Repetitive, low-value work for skilled employees",
                  "No audit trail or version control",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm">
                    <X className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                    <span className="text-muted-foreground">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Right — the solution */}
            <div className="bg-teal-600 text-white p-8 sm:p-10">
              <p className="text-xs font-semibold uppercase tracking-wider text-teal-200 mb-3">
                Parsli
              </p>
              <h3 className="text-2xl sm:text-3xl font-bold tracking-tight mb-6">
                One tool. Full automation.
              </h3>
              <ul className="space-y-3">
                {[
                  "AI extracts data in seconds, not minutes",
                  "99%+ accuracy \u2014 fewer errors than manual entry",
                  "Handles PDFs, images, Word, Excel automatically",
                  "Connects to Google Sheets, Zapier, Make instantly",
                  "Scales from 30 to 25,000+ pages without hiring",
                  "REST API for custom developer workflows",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm">
                    <Check className="h-4 w-4 text-teal-200 shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Feature comparison table */}
      <PricingComparison />

      {/* 4. ROI Calculator */}
      <SavingsCalculator />

      {/* 5. Bottom CTA */}
      <section className="py-20 sm:py-24 lg:py-28 bg-slate-900 text-white">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-teal-400 mb-4">
            Get Started
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
            Ready to remove manual work from your operations?
          </h2>
          <p className="text-lg text-slate-300 mb-3">
            Start free in minutes and see how Parsli fits into your workflow.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-slate-400 mb-8">
            <span className="flex items-center gap-1.5">
              <Check className="h-4 w-4 text-teal-400" /> No model training
              required
            </span>
            <span className="flex items-center gap-1.5">
              <Check className="h-4 w-4 text-teal-400" /> Built for real
              workflows
            </span>
            <span className="flex items-center gap-1.5">
              <Check className="h-4 w-4 text-teal-400" /> Scales from
              point-and-click to API
            </span>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              size="lg"
              className="text-base px-8 h-12 font-semibold bg-teal-500 hover:bg-teal-600 text-white"
              asChild
            >
              <a href={`${APP_URL}/login?mode=signup`}>
                Sign up for free
                <ArrowRight className="ml-2 h-4 w-4" />
              </a>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="text-base px-8 h-12 border-slate-600 text-white hover:bg-slate-800"
              asChild
            >
              <a href="mailto:talal@bytebeam.co">Book a demo</a>
            </Button>
          </div>
        </div>
      </section>

      {/* 6. FAQ */}
      <PricingFAQ />
    </div>
  )
}
