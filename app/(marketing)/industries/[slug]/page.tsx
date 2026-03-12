import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { AlertTriangle, Check, ChevronDown, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { AuthButton } from "@/components/marketing/shared/AuthButton"
import { JsonLd } from "@/components/marketing/shared/JsonLd"
import { breadcrumbJsonLd, faqJsonLd } from "@/lib/seo/json-ld"
import {
  getIndustryBySlug,
  getAllIndustrySlugs,
} from "@/lib/seo/industries"
import { getUseCaseBySlug } from "@/lib/seo/use-cases"
import { getDocumentTypeBySlug } from "@/lib/seo/document-types"

const industryTools: Record<string, { href: string; title: string; description: string }[]> = {
  finance: [
    { href: "/tools/invoice-parser", title: "Invoice Parser", description: "Extract vendor info, line items, and totals from invoices." },
    { href: "/tools/receipt-scanner", title: "Receipt Scanner", description: "Scan receipts and extract transaction details." },
    { href: "/tools/bank-statement-parser", title: "Bank Statement Parser", description: "Extract transactions and balances from bank statements." },
    { href: "/tools/pdf-to-excel", title: "PDF to Excel", description: "Convert financial PDF tables to Excel spreadsheets." },
  ],
  "real-estate": [
    { href: "/tools/pdf-to-text", title: "PDF to Text", description: "Extract text from property documents and contracts." },
    { href: "/tools/ai-summarizer", title: "AI Summarizer", description: "Summarize key details from lengthy property documents." },
    { href: "/tools/pdf-merger", title: "PDF Merger", description: "Combine multiple property documents into one PDF." },
  ],
  logistics: [
    { href: "/tools/invoice-parser", title: "Invoice Parser", description: "Extract data from shipping invoices and bills of lading." },
    { href: "/tools/pdf-to-excel", title: "PDF to Excel", description: "Convert logistics PDF reports to spreadsheets." },
    { href: "/tools/pdf-to-text", title: "PDF to Text", description: "Extract text from shipping documents and manifests." },
  ],
  healthcare: [
    { href: "/tools/image-to-text", title: "Image to Text (OCR)", description: "Extract text from scanned medical documents." },
    { href: "/tools/pdf-to-text", title: "PDF to Text", description: "Extract text from medical PDF reports and forms." },
    { href: "/tools/ai-summarizer", title: "AI Summarizer", description: "Summarize key information from medical documents." },
  ],
  legal: [
    { href: "/tools/pdf-to-text", title: "PDF to Text", description: "Extract text from legal documents and contracts." },
    { href: "/tools/ai-summarizer", title: "AI Summarizer", description: "Summarize key clauses from lengthy legal documents." },
    { href: "/tools/pdf-merger", title: "PDF Merger", description: "Combine case files and legal documents into one PDF." },
  ],
  ecommerce: [
    { href: "/tools/invoice-parser", title: "Invoice Parser", description: "Extract data from supplier and vendor invoices." },
    { href: "/tools/receipt-scanner", title: "Receipt Scanner", description: "Scan and extract data from purchase receipts." },
    { href: "/tools/pdf-to-excel", title: "PDF to Excel", description: "Convert product catalogs and reports to Excel." },
  ],
  hr: [
    { href: "/tools/resume-parser", title: "Resume Parser", description: "Extract contact info, experience, skills from resumes." },
    { href: "/tools/pdf-to-text", title: "PDF to Text", description: "Extract text from HR documents and policies." },
    { href: "/tools/image-to-text", title: "Image to Text (OCR)", description: "Digitize scanned employee documents." },
  ],
  insurance: [
    { href: "/tools/pdf-to-text", title: "PDF to Text", description: "Extract text from insurance policies and claims." },
    { href: "/tools/ai-summarizer", title: "AI Summarizer", description: "Summarize key terms from insurance documents." },
    { href: "/tools/image-to-text", title: "Image to Text (OCR)", description: "Digitize scanned claim forms and documents." },
  ],
}

export function generateStaticParams() {
  return getAllIndustrySlugs().map((slug) => ({ slug }))
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string }
}): Promise<Metadata> {
  const industry = getIndustryBySlug(params.slug)
  if (!industry) return {}

  return {
    title: industry.metaTitle,
    description: industry.metaDescription,
    alternates: {
      canonical: `https://parsli.co/industries/${industry.slug}`,
    },
    openGraph: {
      title: industry.metaTitle,
      description: industry.metaDescription,
      url: `https://parsli.co/industries/${industry.slug}`,
    },
  }
}

export default function IndustryPage({
  params,
}: {
  params: { slug: string }
}) {
  const industry = getIndustryBySlug(params.slug)
  if (!industry) notFound()

  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", url: "https://parsli.co" },
          { name: "Industries", url: "https://parsli.co/industries" },
          {
            name: industry.name,
            url: `https://parsli.co/industries/${industry.slug}`,
          },
        ])}
      />
      <JsonLd
        data={faqJsonLd(
          industry.faqs.map((f) => ({
            question: f.question,
            answer: f.answer,
          }))
        )}
      />

      {/* Hero */}
      <section className="relative pt-28 pb-16 sm:pt-36 sm:pb-20">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-primary/5 rounded-full blur-3xl" />
        </div>
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <Badge variant="secondary" className="mb-6">
            Industry
          </Badge>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight leading-[1.1] mb-6">
            {industry.h1}
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
            {industry.heroDescription}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <AuthButton className="text-base px-8 h-12" showArrow>
              Get Started Free
            </AuthButton>
            <Button size="lg" variant="outline" className="text-base px-8 h-12" asChild>
              <Link href="/pricing">View Pricing</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Pain Points */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-12">
            The Challenge
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {industry.painPoints.map((point) => (
              <div key={point.title} className="rounded-xl border bg-card p-6">
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-destructive/10 text-destructive mb-4">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <h3 className="font-semibold mb-2">{point.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {point.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="py-16 sm:py-20 bg-muted/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-4">
            How {industry.name} Teams Use Parsli
          </h2>
          <p className="text-center text-muted-foreground max-w-2xl mx-auto mb-12">
            Common document parsing use cases in {industry.name.toLowerCase()}.
          </p>
          <div className="grid sm:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {industry.useCases.map((uc) => (
              <div
                key={uc.title}
                className="rounded-xl border bg-card p-6 hover:border-primary/30 transition-colors"
              >
                <div className="inline-flex items-center justify-center w-8 h-8 rounded-md bg-primary/10 text-primary mb-3">
                  <Check className="h-4 w-4" />
                </div>
                <h3 className="font-semibold mb-2">{uc.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {uc.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Free Tools */}
      {industryTools[industry.slug] && (
        <section className="py-16 sm:py-20 bg-muted/30">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-center mb-4">
              Try Our Free Tools
            </h2>
            <p className="text-center text-muted-foreground max-w-2xl mx-auto mb-8">
              Get started with free browser-based tools. No sign-up required.
            </p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {industryTools[industry.slug].map((tool) => (
                <Link
                  key={tool.href}
                  href={tool.href}
                  className="group rounded-xl border bg-card p-5 hover:border-primary/30 transition-colors"
                >
                  <h3 className="font-semibold text-sm mb-1 group-hover:text-primary transition-colors">
                    {tool.title}
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {tool.description}
                  </p>
                  <span className="inline-flex items-center gap-1 text-xs text-primary mt-2">
                    Try free <ArrowRight className="h-3 w-3" />
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* FAQ */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-12">
            Frequently Asked Questions
          </h2>
          <div className="divide-y rounded-xl border bg-card">
            {industry.faqs.map((faq, i) => (
              <details key={i} className="group">
                <summary className="flex items-center justify-between gap-4 px-6 py-5 cursor-pointer list-none text-sm sm:text-base font-medium">
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

      {/* Related Pages */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-12">
            Related Resources
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {industry.relatedUseCases.map((slug) => {
              const uc = getUseCaseBySlug(slug)
              if (!uc) return null
              return (
                <Link
                  key={slug}
                  href={`/use-cases/${slug}`}
                  className="group rounded-xl border bg-card p-5 hover:border-primary/30 transition-colors"
                >
                  <Badge variant="secondary" className="mb-2 text-xs">Use Case</Badge>
                  <h3 className="font-semibold text-sm mb-1 group-hover:text-primary transition-colors">{uc.title}</h3>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    Learn more <ArrowRight className="h-3 w-3" />
                  </span>
                </Link>
              )
            })}
            {industry.relatedDocumentTypes.map((slug) => {
              const dt = getDocumentTypeBySlug(slug)
              if (!dt) return null
              return (
                <Link
                  key={slug}
                  href={`/document-types/${slug}`}
                  className="group rounded-xl border bg-card p-5 hover:border-primary/30 transition-colors"
                >
                  <Badge variant="secondary" className="mb-2 text-xs">Document Type</Badge>
                  <h3 className="font-semibold text-sm mb-1 group-hover:text-primary transition-colors">{dt.name}</h3>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    Learn more <ArrowRight className="h-3 w-3" />
                  </span>
                </Link>
              )
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 sm:py-20 bg-muted/30">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold mb-4">
            Ready to Automate {industry.name} Document Processing?
          </h2>
          <p className="text-muted-foreground mb-8">
            Start extracting data in minutes. No credit card required.
          </p>
          <AuthButton className="text-base px-8 h-12" showArrow>
            Get Started Free
          </AuthButton>
        </div>
      </section>
    </>
  )
}
