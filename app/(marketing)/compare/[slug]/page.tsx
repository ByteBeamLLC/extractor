import type { Metadata } from "next"
import dynamic from "next/dynamic"
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

const InteractiveDemo = dynamic(
  () => import("@/components/marketing/InteractiveDemo").then((m) => m.InteractiveDemo),
  { ssr: false, loading: () => <div className="h-[420px] rounded-xl border bg-muted/30 animate-pulse" /> }
)
import { getAllBlogPosts } from "@/lib/seo/blog-posts"
import { getAllSolutions } from "@/lib/seo/solutions"

/* Map comparison slugs to related blog posts */
const compareToBlog: Record<string, string[]> = {
  parseur: ["parseur-alternatives", "best-email-parser-tools", "best-invoice-ocr-software"],
  docparser: ["best-pdf-parser-tools", "best-invoice-ocr-software", "extract-data-pdf-to-excel"],
  parsio: ["parseur-alternatives", "best-email-parser-tools", "best-invoice-ocr-software"],
  docsumo: ["best-invoice-ocr-software", "automate-invoice-data-extraction", "nanonets-alternatives"],
  nanonets: ["nanonets-alternatives", "best-invoice-ocr-software", "automate-invoice-data-extraction"],
  rossum: ["best-invoice-ocr-software", "automate-invoice-data-extraction"],
  klippa: ["best-invoice-ocr-software", "automate-data-entry"],
  "base64ai": ["document-parsing-api", "agentic-document-extraction"],
  textract: ["extract-data-from-pdf-automatically", "document-parsing-api", "best-pdf-parser-tools"],
  "google-document-ai": ["extract-data-from-pdf-automatically", "document-parsing-api", "best-pdf-parser-tools"],
  "azure-document-intelligence": ["extract-data-from-pdf-automatically", "document-parsing-api"],
  mailparser: ["mailparser-alternatives", "best-email-parser-tools", "parse-emails-to-google-sheets"],
  abbyy: ["best-invoice-ocr-software", "what-is-document-parsing"],
  llamaparse: ["document-parsing-api", "agentic-document-extraction", "best-pdf-parser-tools"],
  mindee: ["best-invoice-ocr-software", "document-parsing-api"],
  reducto: ["document-parsing-api", "agentic-document-extraction"],
  sensible: ["document-parsing-api", "best-pdf-parser-tools"],
  uipath: ["automate-data-entry", "automate-invoice-data-extraction"],
  hyperscience: ["automate-data-entry", "what-is-document-parsing"],
  veryfi: ["best-invoice-ocr-software", "automate-invoice-data-extraction"],
  unstructured: ["document-parsing-api", "agentic-document-extraction"],
  upstage: ["document-parsing-api", "agentic-document-extraction"],
  "landing-ai": ["document-parsing-api", "agentic-document-extraction"],
  "pulse-ai": ["document-parsing-api", "agentic-document-extraction"],
  "cradl-ai": ["automate-data-entry", "best-invoice-ocr-software"],
  airparser: ["best-email-parser-tools", "automate-data-entry"],
  shipamax: ["bill-of-lading-requirements-complete-guide", "cost-of-manual-data-entry-3pl", "freight-invoice-processing-automation"],
  "v7-labs": ["extract-data-from-pdf-automatically", "document-parsing-api", "what-is-document-parsing"],
  "extend-ai": ["agentic-document-extraction", "what-is-intelligent-document-processing", "ocr-vs-ai-document-extraction"],
  unstract: ["agentic-document-extraction", "ocr-vs-ai-document-extraction", "extract-data-from-pdf-automatically"],
  affinda: ["what-is-intelligent-document-processing", "ocr-vs-ai-document-extraction", "automate-data-entry"],
  matil: ["extract-data-from-pdf-automatically", "ocr-vs-ai-document-extraction", "true-cost-manual-data-entry-2026"],
  docuclipper: ["bank-statement-to-excel-automation-guide", "best-tax-document-extraction-tools-2026", "ocr-vs-ai-document-extraction"],
}

/* Map comparison slugs to related solutions */
const compareToSolutions: Record<string, string[]> = {
  parseur: ["no-code-document-parser", "invoice-parsing"],
  docparser: ["pdf-to-excel", "document-parsing-api"],
  parsio: ["no-code-document-parser", "invoice-parsing"],
  docsumo: ["invoice-parsing", "document-parsing-api"],
  nanonets: ["invoice-parsing", "no-code-document-parser"],
  rossum: ["invoice-parsing"],
  klippa: ["invoice-parsing", "no-code-document-parser"],
  "base64ai": ["document-parsing-api"],
  textract: ["document-parsing-api", "pdf-to-excel"],
  "google-document-ai": ["document-parsing-api", "pdf-to-excel"],
  "azure-document-intelligence": ["document-parsing-api"],
  mailparser: ["no-code-document-parser", "invoice-parsing"],
  abbyy: ["invoice-parsing", "no-code-document-parser"],
  llamaparse: ["document-parsing-api"],
  mindee: ["invoice-parsing", "document-parsing-api"],
  reducto: ["document-parsing-api"],
  sensible: ["document-parsing-api"],
  uipath: ["no-code-document-parser", "invoice-parsing"],
  hyperscience: ["no-code-document-parser", "invoice-parsing"],
  veryfi: ["invoice-parsing"],
  unstructured: ["document-parsing-api"],
  upstage: ["document-parsing-api"],
  "landing-ai": ["document-parsing-api"],
  "pulse-ai": ["document-parsing-api"],
  "cradl-ai": ["no-code-document-parser", "invoice-parsing"],
  airparser: ["no-code-document-parser"],
  shipamax: ["logistics-document-automation", "document-parsing-api"],
  "v7-labs": ["no-code-document-parser", "document-parsing-api"],
  "extend-ai": ["document-parsing-api", "invoice-data-extraction", "no-code-document-parser"],
  unstract: ["document-parsing-api", "pdf-to-excel", "no-code-document-parser"],
  affinda: ["invoice-data-extraction", "document-parsing-api", "no-code-document-parser"],
  matil: ["document-parsing-api", "pdf-to-excel", "email-data-extraction"],
  docuclipper: ["bank-statement-extraction", "pdf-to-excel", "no-code-document-parser"],
}

function getRelatedBlogPosts(slug: string) {
  const slugs = compareToBlog[slug] ?? []
  const allPosts = getAllBlogPosts()
  return allPosts.filter((p) => slugs.includes(p.slug))
}

function getRelatedSolutionsForCompare(slug: string) {
  const slugs = compareToSolutions[slug] ?? []
  const allSolutions = getAllSolutions()
  return allSolutions.filter((s) => slugs.includes(s.slug))
}

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
      canonical: `https://parsli.co/compare/${alt.slug}`,
    },
    openGraph: {
      title: alt.metaTitle,
      description: alt.metaDescription,
      url: `https://parsli.co/compare/${alt.slug}`,
      type: "article",
      publishedTime: alt.publishedAt,
      modifiedTime: alt.updatedAt,
      authors: ["Talal Bazerbachi"],
      images: [
        {
          url: "https://parsli.co/parsli-og.png",
          width: 1200,
          height: 630,
          alt: alt.metaTitle,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: alt.metaTitle,
      description: alt.metaDescription,
      images: ["https://parsli.co/parsli-og.png"],
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
          { name: "Compare", url: "https://parsli.co/compare" },
          {
            name: `${alt.competitor} Alternative`,
            url: `https://parsli.co/compare/${alt.slug}`,
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
          url: `https://parsli.co/compare/${alt.slug}`,
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

      {/* ═══════ Architecture Diagram (conditional) ═══════ */}
      {alt.infraComparison && (
        <section className="py-16 sm:py-20 bg-muted/30">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-center mb-4">
              Infrastructure Comparison
            </h2>
            <p className="text-center text-muted-foreground max-w-2xl mx-auto mb-12">
              What it takes to run each platform in production.
            </p>
            <div className="grid md:grid-cols-2 gap-8">
              {/* Parsli — Simple */}
              <div className="rounded-xl border-2 border-primary/30 bg-primary/[0.02] p-6 sm:p-8">
                <div className="text-center mb-6">
                  <p className="text-lg font-bold text-primary">Parsli</p>
                  <p className="text-sm text-muted-foreground">Fully Managed SaaS</p>
                </div>
                <div className="rounded-lg bg-primary/10 p-5">
                  <div className="flex flex-wrap items-center justify-center gap-2 text-sm">
                    <span className="px-3 py-1.5 bg-white rounded-md shadow-sm font-medium">Sign Up</span>
                    <ArrowRight className="h-4 w-4 text-primary shrink-0" />
                    <span className="px-3 py-1.5 bg-white rounded-md shadow-sm font-medium">Build Schema</span>
                    <ArrowRight className="h-4 w-4 text-primary shrink-0" />
                    <span className="px-3 py-1.5 bg-white rounded-md shadow-sm font-medium">Upload</span>
                    <ArrowRight className="h-4 w-4 text-primary shrink-0" />
                    <span className="px-3 py-1.5 bg-white rounded-md shadow-sm font-medium">Get JSON</span>
                  </div>
                </div>
                <div className="text-center mt-6">
                  <p className="text-base font-semibold text-primary">Setup: 3 minutes</p>
                  <p className="text-xs text-muted-foreground mt-1">1 service &middot; Zero infrastructure &middot; Zero DevOps</p>
                </div>
              </div>

              {/* Competitor — Complex */}
              <div className="rounded-xl border bg-card p-6 sm:p-8">
                <div className="text-center mb-6">
                  <p className="text-lg font-bold text-muted-foreground">{alt.infraComparison.competitorName} (Self-Hosted)</p>
                  <p className="text-sm text-muted-foreground">{alt.infraComparison.competitorSubtitle}</p>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {alt.infraComparison.services.map((service) => (
                    <div key={service} className="px-2 py-2.5 bg-muted rounded-md text-center text-xs font-medium truncate">
                      {service}
                    </div>
                  ))}
                  {alt.infraComparison.extras.map((extra) => (
                    <div key={extra} className="px-2 py-2.5 bg-muted/50 rounded-md text-center text-xs text-muted-foreground border border-dashed truncate">
                      + {extra}
                    </div>
                  ))}
                </div>
                <div className="text-center mt-6">
                  <p className="text-base font-semibold text-muted-foreground">Setup: {alt.infraComparison.setupTime}</p>
                  <p className="text-xs text-muted-foreground mt-1">{alt.infraComparison.services.length}+ services &middot; DevOps required &middot; Ongoing maintenance</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ═══════ Interactive Product Tour ═══════ */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-4">
            See Parsli in Action
          </h2>
          <p className="text-center text-muted-foreground max-w-2xl mx-auto mb-12">
            Click through the interactive tour — from creating a parser to extracting structured data.
          </p>
          <InteractiveDemo />
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

      {/* ═══════ 5. ROI Metrics ═══════ */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-4">
            The Impact of Switching to Parsli
          </h2>
          <p className="text-center text-muted-foreground max-w-2xl mx-auto mb-12">
            Based on teams processing 1,000+ documents per month.
          </p>
          <div className="grid sm:grid-cols-3 gap-6">
            {alt.roiMetrics ? (
              <>
                <div className="rounded-xl border bg-card p-6 text-center">
                  <p className="text-4xl font-bold text-primary mb-2">{alt.roiMetrics.stat1.value}</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">{alt.roiMetrics.stat1.label}</p>
                </div>
                <div className="rounded-xl border bg-card p-6 text-center">
                  <p className="text-4xl font-bold text-primary mb-2">{alt.roiMetrics.stat2.value}</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">{alt.roiMetrics.stat2.label}</p>
                </div>
                <div className="rounded-xl border bg-card p-6 text-center">
                  <p className="text-4xl font-bold text-primary mb-2">{alt.roiMetrics.stat3.value}</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">{alt.roiMetrics.stat3.label}</p>
                </div>
              </>
            ) : (
              <>
                <div className="rounded-xl border bg-card p-6 text-center">
                  <p className="text-4xl font-bold text-primary mb-2">&lt;3s</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">Average processing time per document</p>
                </div>
                <div className="rounded-xl border bg-card p-6 text-center">
                  <p className="text-4xl font-bold text-primary mb-2">99%+</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">Extraction accuracy on complex layouts</p>
                </div>
                <div className="rounded-xl border bg-card p-6 text-center">
                  <p className="text-4xl font-bold text-primary mb-2">50k+</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">Documents processed across all accounts</p>
                </div>
              </>
            )}
          </div>
        </div>
      </section>

      {/* ═══════ 6. Testimonials ═══════ */}
      {alt.testimonials && alt.testimonials.length > 0 && (
        <section className="py-16 sm:py-20 bg-muted/30">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-center mb-12">
              What Our Customers Say
            </h2>
            <div className="grid sm:grid-cols-3 gap-6">
              {alt.testimonials.map((t, i) => (
                <div key={i} className="rounded-xl border bg-card p-6">
                  <p className="text-sm text-muted-foreground leading-relaxed mb-4 italic">
                    &ldquo;{t.quote}&rdquo;
                  </p>
                  <div>
                    <p className="font-semibold text-sm">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.title}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ═══════ 7. Key Takeaways ═══════ */}
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

      {/* ═══════ Getting Started Steps ═══════ */}
      {alt.gettingStartedSteps && alt.gettingStartedSteps.length > 0 && (
        <section className="py-16 sm:py-20">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-center mb-12">
              How to Get Started
            </h2>
            <div className="space-y-6">
              {alt.gettingStartedSteps.map((s, i) => (
                <div key={i} className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                    {i + 1}
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">{s.step}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{s.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ═══════ CTA ═══════ */}
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

      {/* ═══════ Free Tools ═══════ */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-xl font-bold text-center mb-4">
            Try Our Free Tools
          </h2>
          <p className="text-center text-muted-foreground max-w-2xl mx-auto mb-8">
            No sign-up required. Everything runs in your browser.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link href="/tools/pdf-to-excel" className="inline-flex items-center gap-1.5 rounded-lg border bg-card px-4 py-2 text-sm hover:border-primary/30 transition-colors">
              PDF to Excel <ArrowRight className="h-3 w-3 text-muted-foreground" />
            </Link>
            <Link href="/tools/invoice-parser" className="inline-flex items-center gap-1.5 rounded-lg border bg-card px-4 py-2 text-sm hover:border-primary/30 transition-colors">
              Invoice Parser <ArrowRight className="h-3 w-3 text-muted-foreground" />
            </Link>
            <Link href="/tools/image-to-text" className="inline-flex items-center gap-1.5 rounded-lg border bg-card px-4 py-2 text-sm hover:border-primary/30 transition-colors">
              Image to Text <ArrowRight className="h-3 w-3 text-muted-foreground" />
            </Link>
            <Link href="/tools/bank-statement-parser" className="inline-flex items-center gap-1.5 rounded-lg border bg-card px-4 py-2 text-sm hover:border-primary/30 transition-colors">
              Bank Statement Parser <ArrowRight className="h-3 w-3 text-muted-foreground" />
            </Link>
            <Link href="/tools/receipt-scanner" className="inline-flex items-center gap-1.5 rounded-lg border bg-card px-4 py-2 text-sm hover:border-primary/30 transition-colors">
              Receipt Scanner <ArrowRight className="h-3 w-3 text-muted-foreground" />
            </Link>
            <Link href="/tools" className="inline-flex items-center gap-1.5 rounded-lg border bg-card px-4 py-2 text-sm hover:border-primary/30 transition-colors">
              All 22 Free Tools <ArrowRight className="h-3 w-3 text-muted-foreground" />
            </Link>
          </div>
        </div>
      </section>

      {/* ═══════ Related Blog Posts & Solutions ═══════ */}
      {(getRelatedBlogPosts(alt.slug).length > 0 ||
        getRelatedSolutionsForCompare(alt.slug).length > 0) && (
        <section className="py-16 sm:py-20 bg-muted/30">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-xl font-bold text-center mb-8">
              Learn More
            </h2>
            <div className="space-y-6">
              {getRelatedSolutionsForCompare(alt.slug).length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground mb-3">
                    Solutions
                  </h3>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {getRelatedSolutionsForCompare(alt.slug).map((solution) => (
                      <Link
                        key={solution.slug}
                        href={`/solutions/${solution.slug}`}
                        className="group rounded-lg border bg-card p-4 hover:border-primary/30 transition-colors"
                      >
                        <h4 className="font-semibold text-sm group-hover:text-primary transition-colors mb-1">
                          {solution.h1}
                        </h4>
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {solution.subtitle}
                        </p>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
              {getRelatedBlogPosts(alt.slug).length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground mb-3">
                    From the Blog
                  </h3>
                  <div className="flex flex-wrap gap-3">
                    {getRelatedBlogPosts(alt.slug).map((post) => (
                      <Link
                        key={post.slug}
                        href={`/blog/${post.slug}`}
                        className="inline-flex items-center gap-1.5 rounded-lg border bg-card px-4 py-2 text-sm hover:border-primary/30 transition-colors"
                      >
                        {post.title}
                        <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0" />
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

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
                  href={`/compare/${relSlug}`}
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
