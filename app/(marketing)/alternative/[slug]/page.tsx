import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { Check, ChevronDown, ArrowRight, Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { AuthButton } from "@/components/marketing/shared/AuthButton"
import { JsonLd } from "@/components/marketing/shared/JsonLd"
import { breadcrumbJsonLd, faqJsonLd, blogPostJsonLd } from "@/lib/seo/json-ld"
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
          { name: "Alternatives", url: "https://parsli.co/alternative" },
          {
            name: `${alt.competitor} Alternative`,
            url: `https://parsli.co/alternative/${alt.slug}`,
          },
        ])}
      />
      <JsonLd
        data={faqJsonLd(
          alt.faqs.map((f) => ({
            question: f.question,
            answer: f.answer,
          }))
        )}
      />
      <JsonLd
        data={blogPostJsonLd({
          title: alt.metaTitle,
          description: alt.metaDescription,
          url: `https://parsli.co/alternative/${alt.slug}`,
          publishedAt: alt.publishedAt,
          updatedAt: alt.updatedAt,
          author: "Talal Bazerbachi",
        })}
      />

      {/* ═══════ 1. Hero ═══════ */}
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
            {alt.heroSubtitle}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <AuthButton className="text-base px-8 h-12" showArrow>
              Try Parsli Free
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
          <p className="mt-5 text-sm text-muted-foreground">
            No credit card required &middot; 30 free pages/month &middot; Full
            API access
          </p>
          <div className="mt-8 flex items-center justify-center gap-2 text-sm text-muted-foreground flex-wrap">
            <span>By Talal Bazerbachi, Founder at Parsli</span>
            <span aria-hidden="true">&middot;</span>
            <time dateTime={alt.publishedAt}>
              Published{" "}
              {new Date(alt.publishedAt).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </time>
            <span aria-hidden="true">&middot;</span>
            <time dateTime={alt.updatedAt}>
              Updated{" "}
              {new Date(alt.updatedAt).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </time>
            <span aria-hidden="true">&middot;</span>
            <span>{alt.readTime}</span>
          </div>
        </div>
      </section>

      {/* ═══════ 2. What Makes Parsli Different ═══════ */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-12">
            What Makes Parsli Different
          </h2>
          <div className="grid sm:grid-cols-2 gap-6">
            {alt.differentiators.map((diff) => (
              <div
                key={diff.title}
                className="rounded-xl border bg-card p-6 hover:border-primary/30 transition-colors"
              >
                <div className="inline-flex items-center justify-center w-8 h-8 rounded-md bg-primary/10 text-primary mb-3">
                  <Check className="h-4 w-4" />
                </div>
                <h3 className="font-semibold mb-2">{diff.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {diff.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ 3. Detailed Comparison Table (Narrative) ═══════ */}
      <section className="py-16 sm:py-20 bg-muted/30">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-4">
            Parsli vs {alt.competitor}: Detailed Comparison
          </h2>
          <p className="text-center text-muted-foreground max-w-2xl mx-auto mb-12">
            An honest, side-by-side comparison across every dimension that
            matters. We include areas where {alt.competitor} is stronger.
          </p>

          <div className="space-y-8">
            {alt.comparisonCategories.map((cat) => (
              <div
                key={cat.category}
                className="rounded-xl border bg-card overflow-hidden"
              >
                <div className="px-6 py-4 border-b bg-muted/50">
                  <h3 className="font-semibold">{cat.category}</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left px-6 py-3 font-medium text-muted-foreground w-[20%]">
                          Feature
                        </th>
                        <th className="text-left px-6 py-3 font-medium text-primary w-[40%]">
                          Parsli
                        </th>
                        <th className="text-left px-6 py-3 font-medium text-muted-foreground w-[40%]">
                          {alt.competitor}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {cat.rows.map((row) => (
                        <tr
                          key={row.feature}
                          className="border-b last:border-0"
                        >
                          <td className="px-6 py-4 font-medium align-top">
                            {row.feature}
                          </td>
                          <td
                            className={`px-6 py-4 align-top ${row.parsliWins ? "text-foreground" : "text-muted-foreground"}`}
                          >
                            {row.parsli}
                          </td>
                          <td
                            className={`px-6 py-4 align-top ${!row.parsliWins ? "text-foreground" : "text-muted-foreground"}`}
                          >
                            {row.competitor}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>

          {/* Bias acknowledgment */}
          <div className="mt-8 rounded-lg border bg-card px-6 py-4 flex gap-3 items-start">
            <Info className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
            <p className="text-sm text-muted-foreground leading-relaxed">
              Parsli is our own product, so naturally we believe in its
              capabilities. That said, we strive to be objective in this
              comparison. If you notice any inaccuracies, please{" "}
              <Link
                href="mailto:support@parsli.co"
                className="text-primary hover:underline underline-offset-4"
              >
                let us know
              </Link>
              .
            </p>
          </div>
        </div>
      </section>

      {/* ═══════ 4. FAQ (10-11 Questions) ═══════ */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-12">
            Frequently Asked Questions
          </h2>
          <div className="divide-y rounded-xl border bg-card">
            {alt.faqs.map((faq, i) => (
              <details key={i} className="group">
                <summary className="flex items-center justify-between gap-4 px-6 py-5 cursor-pointer list-none text-sm sm:text-base font-medium [&::-webkit-details-marker]:hidden">
                  {faq.question}
                  <ChevronDown className="h-5 w-5 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
                </summary>
                <p className="px-6 pb-5 text-sm text-muted-foreground leading-relaxed">
                  {faq.answer}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ 5. Key Takeaways ═══════ */}
      <section className="py-16 sm:py-20 bg-muted/30">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-8">
            Key Takeaways
          </h2>
          <div className="rounded-xl border bg-card p-6 sm:p-8">
            <ul className="space-y-4">
              {alt.keyTakeaways.map((takeaway) => (
                <li key={takeaway} className="flex gap-3">
                  <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <span className="text-sm sm:text-base">{takeaway}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ═══════ 6. Decision Matrix ═══════ */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-12">
            When to Choose Each Platform
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="rounded-xl border bg-card p-6 sm:p-8">
              <h3 className="text-lg font-bold text-muted-foreground mb-6">
                Choose {alt.competitor} if you...
              </h3>
              <ul className="space-y-4">
                {alt.chooseCompetitor.map((item) => (
                  <li key={item} className="flex gap-3">
                    <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0 mt-1" />
                    <span className="text-sm text-muted-foreground">
                      {item}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-xl border border-primary/20 bg-primary/[0.03] p-6 sm:p-8">
              <h3 className="text-lg font-bold text-primary mb-6">
                Choose Parsli if you...
              </h3>
              <ul className="space-y-4">
                {alt.chooseParsli.map((item) => (
                  <li key={item} className="flex gap-3">
                    <Check className="h-4 w-4 text-primary shrink-0 mt-1" />
                    <span className="text-sm">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════ 7. Deep-Dive: Why Parsli is the Best Alternative ═══════ */}
      <section className="py-16 sm:py-20 bg-muted/30">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-12">
            Why Parsli is the Best {alt.competitor} Alternative
          </h2>
          <div className="space-y-8">
            {alt.deepDiveReasons.map((reason) => (
              <div key={reason.title}>
                <h3 className="text-xl font-semibold mb-3">{reason.title}</h3>
                <p className="text-muted-foreground leading-relaxed">
                  {reason.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ 8. ROI Stats ═══════ */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-12">
            What Teams Get with Parsli
          </h2>
          <div className="grid sm:grid-cols-3 gap-6">
            <div className="rounded-xl border bg-card p-6 text-center">
              <p className="text-4xl font-bold text-primary mb-2">&lt;3s</p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Average processing time per document
              </p>
            </div>
            <div className="rounded-xl border bg-card p-6 text-center">
              <p className="text-4xl font-bold text-primary mb-2">95%+</p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Extraction accuracy on complex layouts and scanned documents
              </p>
            </div>
            <div className="rounded-xl border bg-card p-6 text-center">
              <p className="text-4xl font-bold text-primary mb-2">50k+</p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Documents processed across all customer accounts
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════ 9. Getting Started / CTA ═══════ */}
      <section className="py-16 sm:py-20 bg-muted/30">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold mb-4">
            Ready to Switch from {alt.competitor}?
          </h2>
          <p className="text-muted-foreground mb-8">
            Start free with 30 pages/month. Set up in minutes. No credit card
            required.
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
          <p className="mt-5 text-sm text-muted-foreground">
            No credit card required &middot; 30 free pages/month &middot; Cancel
            anytime
          </p>
        </div>
      </section>

      {/* ═══════ 10. Related Comparisons ═══════ */}
      <section className="py-16 sm:py-20 bg-muted/30">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-xl font-bold text-center mb-8">
            Other Comparisons
          </h2>
          <div className="flex flex-wrap items-center justify-center gap-3">
            {alt.relatedAlternatives.map((relSlug) => {
              const rel = getAlternativeBySlug(relSlug)
              const name = rel?.competitor ?? relSlug
              return (
                <Link
                  key={relSlug}
                  href={`/alternative/${relSlug}`}
                  className="inline-flex items-center gap-1.5 rounded-lg border bg-card px-4 py-2 text-sm hover:border-primary/30 transition-colors"
                >
                  Parsli vs {name}
                  <ArrowRight className="h-3 w-3 text-muted-foreground" />
                </Link>
              )
            })}
            <Link
              href="/pricing"
              className="inline-flex items-center gap-1.5 rounded-lg border bg-card px-4 py-2 text-sm hover:border-primary/30 transition-colors"
            >
              Pricing
              <ArrowRight className="h-3 w-3 text-muted-foreground" />
            </Link>
            <Link
              href="/docs"
              className="inline-flex items-center gap-1.5 rounded-lg border bg-card px-4 py-2 text-sm hover:border-primary/30 transition-colors"
            >
              Documentation
              <ArrowRight className="h-3 w-3 text-muted-foreground" />
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
