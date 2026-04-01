import type { Metadata } from "next"
import Image from "next/image"
import { notFound } from "next/navigation"
import { ArrowRight, Check, X, Play, Quote, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { JsonLd } from "@/components/marketing/shared/JsonLd"
import { breadcrumbJsonLd } from "@/lib/seo/json-ld"
import { getCompetitorAd, getAllCompetitorAdSlugs } from "@/lib/seo/competitor-ads"
import { APP_URL } from "@/lib/config"
import { LPTracker } from "@/components/lp/LPTracker"
import { AdHeroDemo } from "@/components/lp/AdHeroDemo"

export function generateStaticParams() {
  return getAllCompetitorAdSlugs().map((slug) => ({ slug }))
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const data = getCompetitorAd(params.slug)
  if (!data) return {}
  return {
    title: `${data.name} Alternative — AI-Powered Document Parsing | Parsli`,
    description: data.subheadline,
    alternates: { canonical: `https://parsli.co/ads/compare/${data.slug}` },
    robots: { index: false, follow: false },
  }
}

export default function CompetitorAdPage({ params }: { params: { slug: string } }) {
  const data = getCompetitorAd(params.slug)
  if (!data) notFound()

  const ctaHref = `${APP_URL}/login?mode=signup`

  return (
    <>
      <LPTracker page={`compare-${data.slug}`} />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", url: "https://parsli.co" },
          { name: `${data.name} Alternative`, url: `https://parsli.co/ads/compare/${data.slug}` },
        ])}
      />

      {/* ═══ Hero ═══ */}
      <section className="relative min-h-[70vh] flex items-center">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-primary/5 rounded-full blur-3xl" />
        </div>
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-20">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary mb-6">
                {data.name} Alternative
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-[3.25rem] font-bold tracking-tight leading-[1.12] mb-6">
                {data.headline}
              </h1>
              <p className="text-lg text-muted-foreground mb-8 max-w-xl">
                {data.subheadline}
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <Button size="lg" className="text-base px-8 h-13" asChild>
                  <a href={ctaHref}>
                    Start Free — No Credit Card
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </a>
                </Button>
                <Button size="lg" variant="outline" className="text-base px-6 h-13" asChild>
                  <a href="#comparison">
                    <Play className="mr-2 h-4 w-4" />
                    See Comparison
                  </a>
                </Button>
              </div>
              <p className="mt-4 text-sm text-muted-foreground">
                Free forever (30 pages/mo). Migrate in under 5 minutes.
              </p>
            </div>
            <div className="hidden lg:block">
              <AdHeroDemo />
            </div>
          </div>
        </div>
      </section>

      {/* ═══ Comparison Table (immediately after hero — #1 thing competitor searchers want) ═══ */}
      <section id="comparison" className="py-16 sm:py-20 bg-muted/30 scroll-mt-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-center mb-4">
            Parsli vs. {data.name}
          </h2>
          <p className="text-center text-muted-foreground mb-10">
            Side-by-side comparison of what matters.
          </p>
          <div className="overflow-x-auto rounded-xl border bg-card">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-3 text-left font-medium">Feature</th>
                  <th className="px-4 py-3 text-center font-medium text-muted-foreground">
                    <div className="flex items-center justify-center gap-2">
                      <Image src={data.logo} alt={data.name} width={20} height={20} className="rounded" />
                      {data.name}
                    </div>
                  </th>
                  <th className="px-4 py-3 text-center font-medium text-primary">
                    Parsli
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.comparisonRows.map((row, i) => (
                  <tr key={i} className="border-b last:border-0">
                    <td className="px-4 py-3 font-medium">{row.feature}</td>
                    <td className="px-4 py-3 text-center text-muted-foreground">{row.them}</td>
                    <td className="px-4 py-3 text-center font-medium">{row.parsli}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="text-center py-10">
            <Button size="lg" className="text-base px-8 h-13" asChild>
              <a href={ctaHref}>
                Switch to Parsli — Free
                <ArrowRight className="ml-2 h-4 w-4" />
              </a>
            </Button>
            <p className="mt-3 text-xs text-muted-foreground">
              No credit card required. Cancel anytime.
            </p>
          </div>
        </div>
      </section>

      {/* ═══ Why Teams Switch ═══ */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-center mb-4">
            Why teams switch from {data.name}
          </h2>
          <p className="text-center text-muted-foreground mb-10">
            Common frustrations that lead teams to Parsli.
          </p>
          <div className="grid sm:grid-cols-3 gap-4">
            {data.painPoints.map((pain, i) => (
              <div key={i} className="flex items-start gap-3 rounded-xl border bg-card p-5">
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-destructive/10 text-destructive text-sm font-bold">
                  !
                </span>
                <p className="text-sm leading-relaxed">{pain}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ Differentiators ═══ */}
      <section className="py-16 sm:py-20 bg-muted/30">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-center mb-10">
            What you get with Parsli instead
          </h2>
          <div className="grid sm:grid-cols-3 gap-6">
            {data.differentiators.map((d, i) => (
              <div key={i} className="rounded-xl border bg-card p-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 mb-4">
                  <Check className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">{d.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{d.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ Switching Testimonial ═══ */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-xl border bg-card p-8 relative text-center">
            <Quote className="h-10 w-10 text-primary/10 mx-auto mb-4" />
            <p className="text-lg leading-relaxed mb-6 italic text-foreground/80">
              &ldquo;{data.switchTestimonial.quote}&rdquo;
            </p>
            <div>
              <p className="font-semibold">{data.switchTestimonial.name}</p>
              <p className="text-sm text-muted-foreground">
                {data.switchTestimonial.role}, {data.switchTestimonial.company}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ Migration Steps ═══ */}
      <section className="py-16 sm:py-20 bg-muted/30">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-center mb-4">
            Switch from {data.name} in 3 steps
          </h2>
          <p className="text-center text-muted-foreground mb-10">
            No implementation project. No training. Under 5 minutes.
          </p>
          <div className="grid md:grid-cols-3 gap-8">
            {data.migrationSteps.map((step, i) => (
              <div key={i} className="text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-lg">
                  {i + 1}
                </div>
                <h3 className="text-lg font-semibold mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ Final CTA ═══ */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
            Ready to switch from {data.name}?
          </h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto">
            Start free, migrate in minutes. No credit card, no sales calls, no implementation project.
          </p>
          <Button size="lg" className="text-base px-10 h-13" asChild>
            <a href={ctaHref}>
              Start Free — No Credit Card
              <ArrowRight className="ml-2 h-4 w-4" />
            </a>
          </Button>
          <p className="mt-6 text-sm text-muted-foreground italic max-w-md mx-auto">
            &ldquo;{data.switchTestimonial.quote.length > 100 ? data.switchTestimonial.quote.slice(0, 100) + "..." : data.switchTestimonial.quote}&rdquo;
            <span className="block mt-1 text-xs not-italic font-medium text-foreground/60">
              — {data.switchTestimonial.name}, {data.switchTestimonial.company}
            </span>
          </p>
        </div>
      </section>
    </>
  )
}
