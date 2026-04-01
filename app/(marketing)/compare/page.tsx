import type { Metadata } from "next"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { AuthButton } from "@/components/marketing/shared/AuthButton"
import { alternatives } from "@/lib/seo/alternatives"
import { getCompetitorLogo } from "@/lib/seo/competitor-logos"
import {
  CompareGrid,
  type CompetitorCardData,
} from "@/components/marketing/CompareGrid"

export const metadata: Metadata = {
  title: "Compare Parsli to Top Alternatives (2026)",
  description:
    "See how Parsli compares to Parseur, Docparser, Nanonets, Docsumo, and 20+ other document parsing tools. Side-by-side feature comparisons, pricing, and accuracy.",
  alternates: {
    canonical: "https://parsli.co/compare",
  },
  openGraph: {
    title: "Compare Parsli to Top Alternatives (2026)",
    description:
      "Side-by-side comparisons of Parsli vs every major document parsing tool.",
    url: "https://parsli.co/compare",
    images: [
      {
        url: "https://parsli.co/parsli-og.png",
        width: 1200,
        height: 630,
        alt: "Parsli Comparisons",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Compare Parsli to Top Alternatives (2026)",
    description:
      "Side-by-side comparisons of Parsli vs every major document parsing tool.",
    images: ["https://parsli.co/parsli-og.png"],
  },
}

/* ───── Floating hero logos ───── */
const heroLogos: { slug: string; className: string; imgSize: number }[] = [
  { slug: "parseur", className: "top-20 left-[12%] h-16 w-16", imgSize: 36 },
  { slug: "nanonets", className: "top-10 left-[28%] h-14 w-14", imgSize: 30 },
  { slug: "docparser", className: "top-14 right-[12%] h-16 w-16", imgSize: 36 },
  { slug: "abbyy", className: "top-8 right-[28%] h-14 w-14", imgSize: 30 },
  { slug: "google-document-ai", className: "bottom-28 left-[14%] h-16 w-16", imgSize: 36 },
  { slug: "uipath", className: "bottom-16 left-[28%] h-14 w-14", imgSize: 30 },
  { slug: "textract", className: "bottom-24 right-[14%] h-16 w-16", imgSize: 36 },
  { slug: "rossum", className: "bottom-14 right-[28%] h-14 w-14", imgSize: 30 },
  { slug: "mindee", className: "top-[45%] left-[8%] h-14 w-14 -translate-y-1/2", imgSize: 30 },
  { slug: "docsumo", className: "top-[45%] right-[8%] h-14 w-14 -translate-y-1/2", imgSize: 30 },
]

/* ───── Friendly card labels for raw feature names ───── */
const cardLabels: Record<string, string> = {
  "Free plan": "Free plan included",
  "Entry price": "Lower starting price",
  "Entry price for paid plan": "Lower starting price",
  "AI engine": "Top-tier AI at every plan",
  "Training required": "Zero training needed",
  "Model training": "Zero training needed",
  "Extraction method": "AI extraction, no templates",
  "Data used for training": "Your data stays private",
  "Data retention": "You control data retention",
  "Setup time": "Set up in minutes",
  "Self-service": "Fully self-service",
  "Self-service signup": "Fully self-service",
  "Pricing transparency": "Transparent pricing",
  "Pricing model": "Simple, predictable pricing",
  "Pricing predictability": "Predictable pricing",
  "Cost per page at scale": "Cheaper at scale",
  "Cost at 5,000 pages/month": "Cheaper at scale",
  "OCR capabilities": "AI-native, no OCR needed",
  "Document types": "All document types supported",
  "API access": "Full API access",
  "Integration options": "Zapier, Sheets & more",
  "Webhook support": "Webhook support included",
  "Implementation cost": "No implementation cost",
  "True total cost": "No hidden costs",
  "Hidden costs": "No hidden costs",
  "Setup fees": "No setup fees",
  "Volume pricing": "Volume discounts built in",
  "Custom schema support": "Custom schema builder",
  "Output format": "Structured JSON output",
  "Interface": "No-code visual interface",
  "Handling format changes": "Handles any format",
  "AI approach": "State-of-the-art AI",
  "Team pricing": "Affordable team pricing",
}

/* ───── Pre-compute card data ───── */
function buildCardData(): CompetitorCardData[] {
  return alternatives.map((alt) => {
    const allRows = alt.comparisonCategories.flatMap((cat) => cat.rows)
    const wins = allRows.filter((r) => r.parsliWins)

    // Pick one win per category for diverse representation
    const diverseWins: string[] = []
    for (const cat of alt.comparisonCategories) {
      if (diverseWins.length >= 4) break
      const win = cat.rows.find((r) => r.parsliWins)
      if (win) {
        diverseWins.push(cardLabels[win.feature] ?? win.feature)
      }
    }

    return {
      slug: alt.slug,
      competitor: alt.competitor,
      attackAngle: alt.attackAngle,
      logo: getCompetitorLogo(alt.slug),
      winCount: wins.length,
      totalRows: allRows.length,
      topWins: diverseWins,
    }
  })
}

export default function ComparePage() {
  const competitors = buildCardData()

  return (
    <>
      {/* Hero with floating competitor logos */}
      <section className="relative pt-28 pb-16 sm:pt-36 sm:pb-20 overflow-hidden">
        {/* Background glow */}
        <div className="absolute inset-0 -z-20">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-primary/5 rounded-full blur-3xl" />
        </div>

        {/* Floating logos — hidden on mobile */}
        <div className="hidden lg:block absolute inset-0 -z-10" aria-hidden="true">
          {heroLogos.map(({ slug, className, imgSize }) => {
            const logo = getCompetitorLogo(slug)
            if (!logo) return null
            return (
              <div
                key={slug}
                className={`absolute rounded-2xl border bg-white shadow-md flex items-center justify-center animate-float-slow ${className}`}
              >
                <Image
                  src={logo}
                  alt=""
                  width={imgSize}
                  height={imgSize}
                  className="object-contain"
                />
              </div>
            )
          })}
        </div>

        {/* Hero content */}
        <div className="relative z-10 mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-1.5 text-sm font-medium text-emerald-700 mb-6 ring-1 ring-inset ring-emerald-600/20">
            Starting at $20/mo &mdash; cheapest in the market
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight leading-[1.1] mb-5">
            Same AI extraction.
            <br />
            <span className="text-primary">Half the price.</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-8">
            Compare Parsli to {alternatives.length}+ document parsing tools.
            We show the data — you decide.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <AuthButton href="/login" className="text-base px-8 h-12" showArrow>
              Try free — 30 pages/mo
            </AuthButton>
            <Button
              variant="outline"
              size="lg"
              className="text-base px-8 h-12"
              asChild
            >
              <a
                href="https://calendly.com/talal-bytebeam/parsli-discovery-call"
                target="_blank"
                rel="noopener noreferrer"
              >
                Book a demo
              </a>
            </Button>
          </div>
        </div>
      </section>

      {/* Pricing proof strip */}
      <section className="pb-12">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            {[
              { value: "$20/mo", label: "Starting price" },
              { value: "2¢", label: "Per page at scale" },
              { value: "30 pages", label: "Free forever" },
              { value: "0", label: "Training needed" },
            ].map((stat) => (
              <div key={stat.label} className="rounded-xl border bg-card p-4">
                <p className="text-xl sm:text-2xl font-bold text-primary">
                  {stat.value}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Filterable comparison grid */}
      <CompareGrid competitors={competitors} />

      {/* Footer CTA */}
      <section className="pb-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl border bg-muted/30 p-10 text-center">
            <h2 className="text-2xl font-bold mb-3">
              Switch to Parsli and save
            </h2>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Free forever up to 30 pages/month. No credit card required.
              Most teams save 50%+ on their document parsing bill.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <AuthButton href="/login" className="text-base px-8 h-12" showArrow>
                Get started free
              </AuthButton>
              <Button
                variant="outline"
                size="lg"
                className="text-base px-8 h-12"
                asChild
              >
                <a href="/pricing">See pricing</a>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
