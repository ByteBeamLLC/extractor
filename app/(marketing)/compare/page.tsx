import type { Metadata } from "next"
import Link from "next/link"
import Image from "next/image"
import { ArrowRight, Zap, DollarSign, Shield, Puzzle, Eye, Sparkles, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { AuthButton } from "@/components/marketing/shared/AuthButton"
import { alternatives } from "@/lib/seo/alternatives"
import { getCompetitorLogo } from "@/lib/seo/competitor-logos"

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

/* ───── Attack-angle styling ───── */
const angleConfig: Record<string, { label: string; color: string; icon: typeof Zap }> = {
  cost: { label: "Save money", color: "emerald", icon: DollarSign },
  technology: { label: "Better AI", color: "violet", icon: Zap },
  completeness: { label: "More complete", color: "blue", icon: Puzzle },
  pricing_transparency: { label: "Transparent pricing", color: "emerald", icon: Eye },
  simplicity: { label: "Simpler setup", color: "amber", icon: Sparkles },
  modernization: { label: "Modern alternative", color: "violet", icon: Zap },
  accessibility: { label: "More accessible", color: "amber", icon: Sparkles },
  self_service: { label: "Self-service", color: "amber", icon: Sparkles },
  instant_accuracy: { label: "Instant accuracy", color: "blue", icon: Zap },
  flexibility: { label: "More flexible", color: "blue", icon: Puzzle },
  purpose: { label: "Purpose-built", color: "violet", icon: Shield },
  ease: { label: "Easier to use", color: "amber", icon: Sparkles },
  "ease-of-use": { label: "Easier to use", color: "amber", icon: Sparkles },
  features: { label: "More features", color: "blue", icon: Puzzle },
}

const colorClasses: Record<string, { badge: string; glow: string }> = {
  emerald: {
    badge: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
    glow: "group-hover:shadow-emerald-100",
  },
  violet: {
    badge: "bg-violet-50 text-violet-700 ring-violet-600/20",
    glow: "group-hover:shadow-violet-100",
  },
  blue: {
    badge: "bg-blue-50 text-blue-700 ring-blue-600/20",
    glow: "group-hover:shadow-blue-100",
  },
  amber: {
    badge: "bg-amber-50 text-amber-700 ring-amber-600/20",
    glow: "group-hover:shadow-amber-100",
  },
}

function getWinCount(alt: (typeof alternatives)[0]): number {
  return alt.comparisonCategories.reduce(
    (count, cat) => count + cat.rows.filter((r) => r.parsliWins).length,
    0
  )
}

function getTopWin(alt: (typeof alternatives)[0]): string | null {
  for (const cat of alt.comparisonCategories) {
    for (const row of cat.rows) {
      if (row.parsliWins) return row.feature
    }
  }
  return null
}

export default function ComparePage() {
  const totalComparisons = alternatives.length

  return (
    <>
      {/* Hero */}
      <section className="relative pt-28 pb-12 sm:pt-36 sm:pb-16">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-primary/5 rounded-full blur-3xl" />
        </div>
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary mb-6">
            <Zap className="h-3.5 w-3.5" />
            {totalComparisons} head-to-head comparisons
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight leading-[1.1] mb-6">
            See how Parsli stacks up
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Transparent, data-backed comparisons with every major document
            parsing tool. We show the numbers — you decide.
          </p>
        </div>
      </section>

      {/* Battlecard grid */}
      <section className="pb-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {alternatives.map((alt) => {
              const logo = getCompetitorLogo(alt.slug)
              const angle = angleConfig[alt.attackAngle] ?? angleConfig.cost
              const colors = colorClasses[angle.color] ?? colorClasses.blue
              const AngleIcon = angle.icon
              const winCount = getWinCount(alt)
              const topWin = getTopWin(alt)

              return (
                <Link
                  key={alt.slug}
                  href={`/compare/${alt.slug}`}
                  className={`group relative flex flex-col rounded-2xl border bg-card overflow-hidden transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 ${colors.glow}`}
                >
                  {/* Card header — logo matchup */}
                  <div className="flex items-center gap-3 px-5 pt-5 pb-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      {/* Parsli icon */}
                      <div className="relative h-8 w-8 shrink-0 rounded-lg bg-primary/10 flex items-center justify-center overflow-hidden">
                        <Image
                          src="/parsli-icon.png"
                          alt="Parsli"
                          width={20}
                          height={20}
                          className="object-contain"
                        />
                      </div>

                      <span className="text-xs font-bold text-muted-foreground/60 uppercase tracking-wider shrink-0">
                        vs
                      </span>

                      {/* Competitor icon */}
                      <div className="relative h-8 w-8 shrink-0 rounded-lg bg-muted flex items-center justify-center overflow-hidden">
                        {logo ? (
                          <Image
                            src={logo}
                            alt={alt.competitor}
                            width={20}
                            height={20}
                            className="object-contain"
                          />
                        ) : (
                          <span className="text-xs font-bold text-muted-foreground">
                            {alt.competitor.charAt(0)}
                          </span>
                        )}
                      </div>

                      <span className="font-semibold text-sm truncate">
                        {alt.competitor}
                      </span>
                    </div>
                  </div>

                  {/* Title */}
                  <div className="px-5 pb-3 flex-1">
                    <h2 className="font-semibold leading-snug mb-2 group-hover:text-primary transition-colors">
                      {alt.h1}
                    </h2>
                    <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
                      {alt.heroSubtitle}
                    </p>
                  </div>

                  {/* Stats strip */}
                  <div className="px-5 pb-3">
                    <div className="flex items-center gap-3 flex-wrap">
                      {/* Attack angle badge */}
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${colors.badge}`}
                      >
                        <AngleIcon className="h-3 w-3" />
                        {angle.label}
                      </span>

                      {/* Win count */}
                      {winCount > 0 && (
                        <span className="text-xs text-muted-foreground">
                          <span className="font-semibold text-foreground">{winCount}</span>{" "}
                          categories won
                        </span>
                      )}
                    </div>

                    {/* Top win highlight */}
                    {topWin && (
                      <p className="mt-2 text-xs text-muted-foreground">
                        Top advantage:{" "}
                        <span className="font-medium text-foreground">{topWin}</span>
                      </p>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="mt-auto flex items-center justify-between border-t px-5 py-3">
                    <span className="text-xs text-muted-foreground">
                      {alt.readTime} &middot; Updated{" "}
                      {new Date(alt.updatedAt).toLocaleDateString("en-US", {
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                    <span className="inline-flex items-center text-xs font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                      Compare
                      <ChevronRight className="h-3 w-3 ml-0.5" />
                    </span>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="pb-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl border bg-muted/30 p-10 text-center">
            <h2 className="text-2xl font-bold mb-3">
              Start extracting data for free
            </h2>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Free forever up to 30 pages/month. No credit card required.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <AuthButton href="/login" className="text-base px-8 h-12" showArrow>
                Try it for free
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
        </div>
      </section>
    </>
  )
}
