import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { Check, X, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { AuthButton } from "@/components/marketing/shared/AuthButton"
import { JsonLd } from "@/components/marketing/shared/JsonLd"
import { breadcrumbJsonLd } from "@/lib/seo/json-ld"
import {
  getAlternativeBySlug,
  getAllAlternativeSlugs,
} from "@/lib/seo/alternatives"

export function generateStaticParams() {
  return getAllAlternativeSlugs().map((slug) => ({ slug }))
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string }
}): Promise<Metadata> {
  const alt = getAlternativeBySlug(params.slug)
  if (!alt) return {}

  return {
    title: alt.metaTitle,
    description: alt.metaDescription,
    alternates: {
      canonical: `https://parsli.co/alternative/${alt.slug}`,
    },
    openGraph: {
      title: alt.metaTitle,
      description: alt.metaDescription,
      url: `https://parsli.co/alternative/${alt.slug}`,
    },
  }
}

export default function AlternativePage({
  params,
}: {
  params: { slug: string }
}) {
  const alt = getAlternativeBySlug(params.slug)
  if (!alt) notFound()

  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", url: "https://parsli.co" },
          {
            name: `${alt.competitor} Alternative`,
            url: `https://parsli.co/alternative/${alt.slug}`,
          },
        ])}
      />

      {/* Hero */}
      <section className="relative pt-28 pb-16 sm:pt-36 sm:pb-20">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-primary/5 rounded-full blur-3xl" />
        </div>
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <Badge variant="secondary" className="mb-6">
            vs {alt.competitor}
          </Badge>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight leading-[1.1] mb-6">
            {alt.h1}
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
            {alt.heroDescription}
          </p>
          <AuthButton className="text-base px-8 h-12" showArrow>
            Try Parsli Free
          </AuthButton>
        </div>
      </section>

      {/* Comparison Table */}
      <section className="py-16 sm:py-20 bg-muted/30">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-12">
            Parsli vs {alt.competitor} Comparison
          </h2>
          <div className="rounded-xl border bg-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left px-6 py-4 font-semibold">Feature</th>
                    <th className="text-left px-6 py-4 font-semibold text-primary">
                      Parsli
                    </th>
                    <th className="text-left px-6 py-4 font-semibold text-muted-foreground">
                      {alt.competitor}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {alt.comparisonPoints.map((point) => (
                    <tr key={point.feature} className="border-b last:border-0">
                      <td className="px-6 py-4 font-medium">{point.feature}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {point.parsliWins && (
                            <Check className="h-4 w-4 text-green-500 shrink-0" />
                          )}
                          <span>{point.parsli}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">
                        <div className="flex items-center gap-2">
                          {!point.parsliWins && (
                            <Check className="h-4 w-4 text-green-500 shrink-0" />
                          )}
                          <span>{point.competitor}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* Reasons to Switch */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-12">
            Why Teams Switch from {alt.competitor} to Parsli
          </h2>
          <div className="grid sm:grid-cols-2 gap-6">
            {alt.reasons.map((reason) => (
              <div
                key={reason.title}
                className="rounded-xl border bg-card p-6 hover:border-primary/30 transition-colors"
              >
                <div className="inline-flex items-center justify-center w-8 h-8 rounded-md bg-primary/10 text-primary mb-3">
                  <Check className="h-4 w-4" />
                </div>
                <h3 className="font-semibold mb-2">{reason.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {reason.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 sm:py-20 bg-muted/30">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold mb-4">
            Ready to Switch from {alt.competitor}?
          </h2>
          <p className="text-muted-foreground mb-8">
            Start free with 30 pages/month. No credit card required. Set up in
            minutes.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <AuthButton className="text-base px-8 h-12" showArrow>
              Get Started Free
            </AuthButton>
            <Button
              size="lg"
              variant="outline"
              className="text-base px-8 h-12"
              asChild
            >
              <Link href="/pricing">Compare Pricing</Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  )
}
