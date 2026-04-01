import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import {
  Shield,
  ArrowRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { AuthButton } from "@/components/marketing/shared/AuthButton"
import { DemoModalButton } from "@/components/marketing/DemoModalButton"
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

/* ───── Floating hero logos — ordered by keyword traffic ───── */
const heroLogos: { slug: string; className: string; size: number }[] = [
  // Top traffic — largest & most prominent positions (pushed down to clear navbar)
  { slug: "abbyy", className: "top-28 left-[7%]", size: 72 },           // 12,220/mo
  { slug: "unstructured", className: "top-24 right-[7%]", size: 68 },   // 10,300/mo
  { slug: "google-document-ai", className: "bottom-16 left-[8%]", size: 68 }, // 3,210/mo
  { slug: "landing-ai", className: "bottom-20 right-[8%]", size: 64 },  // 2,900/mo
  // High traffic — large
  { slug: "docparser", className: "top-20 left-[24%]", size: 56 },      // 1,500/mo
  { slug: "parseur", className: "top-24 right-[22%]", size: 56 },       // 1,380/mo
  // Medium traffic
  { slug: "pulse-ai", className: "top-[48%] left-[5%] -translate-y-1/2", size: 48 }, // 880/mo
  { slug: "mailparser", className: "top-[48%] right-[5%] -translate-y-1/2", size: 48 }, // 520/mo
  { slug: "nanonets", className: "bottom-28 left-[24%]", size: 48 },    // 430/mo
  { slug: "upstage", className: "bottom-24 right-[22%]", size: 44 },    // 260/mo
  // Lower traffic — smaller
  { slug: "klippa", className: "top-[62%] left-[16%]", size: 40 },
  { slug: "mindee", className: "top-[58%] right-[16%]", size: 40 },
]

/* ───── Sort order by keyword search traffic ───── */
const trafficRank: Record<string, number> = {
  abbyy: 12220, unstructured: 10300, "google-document-ai": 3210,
  "landing-ai": 2900, docparser: 1500, parseur: 1380,
  "pulse-ai": 880, mailparser: 520, nanonets: 430, upstage: 260,
  "cradl-ai": 50, klippa: 40, mindee: 30, rossum: 10,
}

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

/* ───── Pre-compute card data, sorted by keyword traffic ───── */
function buildCardData(): CompetitorCardData[] {
  return alternatives
    .map((alt) => {
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
    .sort((a, b) => (trafficRank[b.slug] ?? 0) - (trafficRank[a.slug] ?? 0))
}

export default function ComparePage() {
  const competitors = buildCardData()

  return (
    <>
      {/* Hero with floating competitor logos */}
      <section className="relative pt-40 pb-20 sm:pt-48 sm:pb-24 overflow-hidden">
        {/* Dot grid background */}
        <div
          className="absolute inset-0 -z-20"
          style={{
            backgroundImage:
              "radial-gradient(circle, rgba(39,130,255,0.15) 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        />
        {/* Fade edges of dot grid */}
        <div className="absolute inset-0 -z-20 bg-gradient-to-b from-background via-transparent to-background" />
        <div className="absolute inset-0 -z-20 bg-gradient-to-r from-background via-transparent to-background" />

        {/* Floating logos — hidden on mobile */}
        <div className="hidden lg:block absolute inset-0 -z-10" aria-hidden="true">
          {heroLogos.map(({ slug, className, size }) => {
            const logo = getCompetitorLogo(slug)
            if (!logo) return null
            return (
              <div
                key={slug}
                className={`absolute animate-float-slow ${className}`}
                style={{ width: size, height: size }}
              >
                <Image
                  src={logo}
                  alt=""
                  width={size}
                  height={size}
                  className="object-contain w-full h-full drop-shadow-md"
                />
              </div>
            )
          })}
        </div>

        {/* Hero content */}
        <div className="relative z-10 mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold tracking-tight leading-[1.08] mb-6">
            Compare Parsli to
            <br />
            every alternative
          </h1>
          <p className="text-xl sm:text-2xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
            Top-tier AI accuracy at every plan — starting at $20/mo,
            up to 50% cheaper than alternatives.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button size="lg" className="text-base px-8 h-12" asChild>
              <a href="#comparisons">
                Compare Parsli
                <ArrowRight className="ml-2 h-4 w-4" />
              </a>
            </Button>
            <DemoModalButton className="text-base px-8 h-12">
              See How It Works
            </DemoModalButton>
          </div>
        </div>
      </section>

      {/* Key reasons section */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-center mb-4">
            Key reasons teams switch to Parsli
          </h2>
          <p className="text-lg text-muted-foreground text-center max-w-2xl mx-auto mb-14">
            From startups to enterprises, teams choose Parsli for
            unbeatable pricing, top-tier AI, and zero setup friction.
          </p>

          <div className="space-y-16 lg:space-y-20">
            {/* Reason 1 — Cheapest */}
            <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
              <div>
                <span className="inline-flex items-center rounded-full border border-primary/30 px-3 py-1 text-xs font-medium text-primary mb-4">
                  Reason #1
                </span>
                <h3 className="text-2xl sm:text-3xl font-bold mb-4">
                  Up to 50% cheaper than any alternative
                </h3>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Parsli starts at $20/mo with 250 pages — most competitors
                  charge $39-$499/mo for the same volume. At scale, you pay as
                  little as 1¢ per page. No hidden fees, no setup costs.
                </p>
                <Link
                  href="/pricing"
                  className="inline-flex items-center text-sm font-medium text-primary hover:underline"
                >
                  See pricing
                  <ArrowRight className="ml-1 h-3.5 w-3.5" />
                </Link>
              </div>
              <div className="rounded-xl border bg-card p-6">
                <p className="text-xs font-medium text-muted-foreground mb-4 text-center">
                  Starting price comparison
                </p>
                <div className="space-y-3">
                  {[
                    { name: "Parsli", price: "$20/mo", width: "20%", highlight: true },
                    { name: "Parseur", price: "$39/mo", width: "39%", highlight: false },
                    { name: "Docparser", price: "$39/mo", width: "39%", highlight: false },
                    { name: "Rossum", price: "$200/mo", width: "60%", highlight: false },
                    { name: "Nanonets", price: "$499/mo", width: "100%", highlight: false },
                  ].map((row) => (
                    <div key={row.name} className="flex items-center gap-3">
                      <span className="text-xs w-20 shrink-0 text-right font-medium">
                        {row.name}
                      </span>
                      <div className="flex-1 h-7 rounded-md bg-muted overflow-hidden">
                        <div
                          className={`h-full rounded-md flex items-center px-2 text-[10px] font-bold text-white ${
                            row.highlight ? "bg-primary" : "bg-muted-foreground/40"
                          }`}
                          style={{ width: row.width }}
                        >
                          {row.price}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Reason 2 — Best AI */}
            <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
              <div className="order-2 lg:order-1 rounded-xl border bg-card p-6">
                <p className="text-xs font-medium text-muted-foreground mb-4 text-center">
                  AI capabilities at every tier
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { feature: "Gemini 2.5 Pro", parsli: true, others: false },
                    { feature: "Zero training", parsli: true, others: false },
                    { feature: "Table extraction", parsli: true, others: true },
                    { feature: "Scanned docs", parsli: true, others: true },
                    { feature: "Multi-language", parsli: true, others: false },
                    { feature: "Free tier AI", parsli: true, others: false },
                  ].map((row) => (
                    <div
                      key={row.feature}
                      className="flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-2"
                    >
                      <div
                        className={`h-2 w-2 rounded-full shrink-0 ${
                          row.parsli ? "bg-primary" : "bg-muted-foreground/30"
                        }`}
                      />
                      <span className="text-xs">{row.feature}</span>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between mt-4 text-[10px] font-medium text-muted-foreground">
                  <span>
                    Parsli: <span className="text-primary">6/6</span>
                  </span>
                  <span>Others: 2/6</span>
                </div>
              </div>
              <div className="order-1 lg:order-2">
                <span className="inline-flex items-center rounded-full border border-primary/30 px-3 py-1 text-xs font-medium text-primary mb-4">
                  Reason #2
                </span>
                <h3 className="text-2xl sm:text-3xl font-bold mb-4">
                  Top-performing AI on every plan — including free
                </h3>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Parsli uses Google Gemini 2.5 Pro on every tier — the same
                  state-of-the-art model, whether you&apos;re on the free plan or
                  Business. No OCR fallbacks, no legacy engines, no AI downgrades
                  on cheaper plans.
                </p>
                <Link
                  href="/docs"
                  className="inline-flex items-center text-sm font-medium text-primary hover:underline"
                >
                  Explore AI capabilities
                  <ArrowRight className="ml-1 h-3.5 w-3.5" />
                </Link>
              </div>
            </div>

            {/* Reason 3 — Zero setup */}
            <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
              <div>
                <span className="inline-flex items-center rounded-full border border-primary/30 px-3 py-1 text-xs font-medium text-primary mb-4">
                  Reason #3
                </span>
                <h3 className="text-2xl sm:text-3xl font-bold mb-4">
                  Set up in minutes, not weeks
                </h3>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  No templates to configure, no training data to label, no
                  engineering team required. Define your fields in plain English,
                  upload a document, and get structured JSON back in seconds.
                </p>
                <Link
                  href="/use-cases"
                  className="inline-flex items-center text-sm font-medium text-primary hover:underline"
                >
                  See use cases
                  <ArrowRight className="ml-1 h-3.5 w-3.5" />
                </Link>
              </div>
              <div className="rounded-xl border bg-card p-6">
                <p className="text-xs font-medium text-muted-foreground mb-4 text-center">
                  Time to first extraction
                </p>
                <div className="flex items-end justify-center gap-8">
                  <div className="text-center">
                    <div className="flex items-end justify-center gap-1 mb-2">
                      <div className="w-14 bg-primary rounded-t-md" style={{ height: 32 }} />
                    </div>
                    <p className="text-2xl font-bold text-primary">~2 min</p>
                    <p className="text-xs text-muted-foreground mt-1">Parsli</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-end justify-center gap-1 mb-2">
                      <div className="w-14 bg-muted-foreground/30 rounded-t-md" style={{ height: 96 }} />
                    </div>
                    <p className="text-2xl font-bold text-muted-foreground">1-4 hrs</p>
                    <p className="text-xs text-muted-foreground mt-1">Template tools</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-end justify-center gap-1 mb-2">
                      <div className="w-14 bg-muted-foreground/20 rounded-t-md" style={{ height: 160 }} />
                    </div>
                    <p className="text-2xl font-bold text-muted-foreground">Days</p>
                    <p className="text-xs text-muted-foreground mt-1">Enterprise tools</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Reason 4 — Privacy */}
            <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
              <div className="order-2 lg:order-1 rounded-xl border bg-card p-6">
                <p className="text-xs font-medium text-muted-foreground mb-4 text-center">
                  Data handling
                </p>
                <div className="space-y-3">
                  {[
                    { feature: "Never trains on your data", parsli: true },
                    { feature: "GDPR compliant", parsli: true },
                    { feature: "Encryption at rest & in transit", parsli: true },
                    { feature: "Configurable data retention", parsli: true },
                    { feature: "Row-level security", parsli: true },
                  ].map((row) => (
                    <div
                      key={row.feature}
                      className="flex items-center gap-3 rounded-lg bg-muted/50 px-4 py-2.5"
                    >
                      <Shield className="h-4 w-4 text-primary shrink-0" />
                      <span className="text-sm">{row.feature}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="order-1 lg:order-2">
                <span className="inline-flex items-center rounded-full border border-primary/30 px-3 py-1 text-xs font-medium text-primary mb-4">
                  Reason #4
                </span>
                <h3 className="text-2xl sm:text-3xl font-bold mb-4">
                  Your documents stay yours
                </h3>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Parsli never uses your documents to train AI models. Your data
                  is encrypted, isolated, and deletable on demand. Many
                  competitors don&apos;t disclose how they handle your data — we do.
                </p>
                <Link
                  href="/privacy"
                  className="inline-flex items-center text-sm font-medium text-primary hover:underline"
                >
                  Read our privacy policy
                  <ArrowRight className="ml-1 h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Filterable comparison grid */}
      <div id="comparisons" className="scroll-mt-20">
        <CompareGrid competitors={competitors} />
      </div>

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
