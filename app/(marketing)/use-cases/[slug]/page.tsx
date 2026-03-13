import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { AlertTriangle, Check, ChevronDown, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { AuthButton } from "@/components/marketing/shared/AuthButton"
import { JsonLd } from "@/components/marketing/shared/JsonLd"
import { breadcrumbJsonLd, faqJsonLd } from "@/lib/seo/json-ld"
import { getUseCaseBySlug, getAllUseCaseSlugs } from "@/lib/seo/use-cases"

const useCaseTools: Record<string, { href: string; title: string; description: string }[]> = {
  "invoice-parsing": [
    { href: "/tools/invoice-parser", title: "Free Invoice Parser", description: "Extract vendor info, line items, and totals from invoices instantly." },
    { href: "/tools/receipt-scanner", title: "Free Receipt Scanner", description: "Scan receipts and extract transaction details in your browser." },
  ],
  "email-parsing": [
    { href: "/tools/pdf-to-text", title: "Free PDF to Text Extractor", description: "Extract text content from PDF email attachments instantly." },
    { href: "/tools/ai-summarizer", title: "Free AI Document Summarizer", description: "Summarize key information from any document instantly." },
  ],
  "pdf-data-extraction": [
    { href: "/tools/pdf-to-excel", title: "Free PDF to Excel Converter", description: "Convert PDF tables to Excel instantly in your browser." },
    { href: "/tools/pdf-to-text", title: "Free PDF to Text Extractor", description: "Extract all text content from PDF files. Works instantly." },
    { href: "/tools/pdf-table-extractor", title: "Free PDF Table Extractor", description: "Extract tables from PDF documents into structured data." },
  ],
  "receipt-scanning": [
    { href: "/tools/receipt-scanner", title: "Free Receipt Scanner", description: "Scan receipts and extract transaction details in your browser." },
    { href: "/tools/image-to-text", title: "Free Image to Text (OCR)", description: "Extract text from receipt images using AI-powered OCR." },
  ],
  "document-automation": [
    { href: "/tools/invoice-parser", title: "Free Invoice Parser", description: "Extract data from invoices automatically in your browser." },
    { href: "/tools/bank-statement-parser", title: "Free Bank Statement Parser", description: "Extract transactions and balances from bank statements." },
    { href: "/tools/ai-summarizer", title: "Free AI Document Summarizer", description: "Summarize key information from any document instantly." },
  ],
  "intelligent-document-processing": [
    { href: "/tools/ai-summarizer", title: "Free AI Document Summarizer", description: "Extract and summarize key information from any document." },
    { href: "/tools/invoice-parser", title: "Free Invoice Parser", description: "Extract structured data from invoices automatically." },
    { href: "/tools/image-to-text", title: "Free Image to Text (OCR)", description: "Extract text from images using AI-powered OCR." },
  ],
  "ocr-data-extraction": [
    { href: "/tools/image-to-text", title: "Free Image to Text (OCR)", description: "Extract text from images using AI-powered OCR. 12 languages." },
    { href: "/tools/photo-to-text", title: "Free Photo to Text", description: "Convert photographed documents into editable text." },
    { href: "/tools/handwriting-to-text", title: "Free Handwriting to Text", description: "Convert handwritten notes into digital text." },
  ],
  "pdf-to-excel": [
    { href: "/tools/pdf-to-excel", title: "Free PDF to Excel Converter", description: "Convert PDF tables to Excel instantly. No sign-up required." },
    { href: "/tools/pdf-table-extractor", title: "Free PDF Table Extractor", description: "Extract tables from PDF documents into structured data." },
  ],
  "pdf-to-csv": [
    { href: "/tools/pdf-to-excel", title: "Free PDF to Excel Converter", description: "Convert PDF tables to downloadable spreadsheets instantly." },
    { href: "/tools/excel-to-csv", title: "Free Excel to CSV Converter", description: "Convert Excel files to CSV format for easy processing." },
  ],
  "pdf-to-json": [
    { href: "/tools/pdf-to-excel", title: "Free PDF to Excel Converter", description: "Extract PDF table data into spreadsheet format." },
    { href: "/tools/excel-to-json", title: "Free Excel to JSON Converter", description: "Convert spreadsheets to structured JSON format." },
  ],
}

/** Use-case slugs that have matching parser templates */
const templateMap: Record<string, { templateId: string; ctaLabel: string }> = {
  "invoice-parsing": {
    templateId: "invoice-parsing",
    ctaLabel: "Start Parsing Invoices Free",
  },
}

export function generateStaticParams() {
  return getAllUseCaseSlugs().map((slug) => ({ slug }))
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string }
}): Promise<Metadata> {
  const useCase = getUseCaseBySlug(params.slug)
  if (!useCase) return {}

  return {
    title: useCase.metaTitle,
    description: useCase.metaDescription,
    alternates: {
      canonical: `https://parsli.co/use-cases/${useCase.slug}`,
    },
    openGraph: {
      title: useCase.metaTitle,
      description: useCase.metaDescription,
      url: `https://parsli.co/use-cases/${useCase.slug}`,
    },
  }
}

export default function UseCasePage({
  params,
}: {
  params: { slug: string }
}) {
  const useCase = getUseCaseBySlug(params.slug)
  if (!useCase) notFound()

  const template = templateMap[useCase.slug]
  const ctaHref = template
    ? `/dashboard?template=${template.templateId}`
    : undefined
  const ctaLabel = template?.ctaLabel ?? "Get Started Free"

  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", url: "https://parsli.co" },
          { name: "Use Cases", url: "https://parsli.co/use-cases" },
          {
            name: useCase.title,
            url: `https://parsli.co/use-cases/${useCase.slug}`,
          },
        ])}
      />
      <JsonLd
        data={faqJsonLd(
          useCase.faqs.map((f) => ({
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
            Use Case
          </Badge>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight leading-[1.1] mb-6">
            {useCase.h1}
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
            {useCase.heroDescription}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <AuthButton className="text-base px-8 h-12" showArrow href={ctaHref}>
              {ctaLabel}
            </AuthButton>
            <Button size="lg" variant="outline" className="text-base px-8 h-12" asChild>
              <Link href="/docs">See How It Works</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Pain Points */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-12">
            The Problem
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {useCase.painPoints.map((point) => (
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

      {/* Features / Solution */}
      <section className="py-16 sm:py-20 bg-muted/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-4">
            How Parsli Solves This
          </h2>
          <p className="text-center text-muted-foreground max-w-2xl mx-auto mb-12">
            Parsli&apos;s AI handles the heavy lifting so you can focus on what matters.
          </p>
          <div className="grid sm:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {useCase.features.map((feature) => (
              <div
                key={feature.title}
                className="rounded-xl border bg-card p-6 hover:border-primary/30 transition-colors"
              >
                <div className="inline-flex items-center justify-center w-8 h-8 rounded-md bg-primary/10 text-primary mb-3">
                  <Check className="h-4 w-4" />
                </div>
                <h3 className="font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-12">
            Frequently Asked Questions
          </h2>
          <div className="divide-y rounded-xl border bg-card">
            {useCase.faqs.map((faq, i) => (
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

      {/* Free Tools */}
      {useCaseTools[useCase.slug] && (
        <section className="py-10 sm:py-12">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-lg font-semibold mb-4">Try our free tools</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {useCaseTools[useCase.slug].map((tool) => (
                <Link
                  key={tool.href}
                  href={tool.href}
                  className="group flex items-center justify-between rounded-xl border border-primary/20 bg-primary/[0.03] p-5 hover:border-primary/40 transition-colors"
                >
                  <div>
                    <p className="font-semibold mb-0.5 group-hover:text-primary transition-colors">
                      {tool.title}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {tool.description}
                    </p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-primary shrink-0 ml-4 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Related Resources */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-sm font-semibold text-muted-foreground mb-4">
            Related Resources
          </h2>
          <div className="flex flex-wrap gap-3">
            {useCase.slug === "invoice-parsing" && (
              <>
                <Link href="/solutions/invoice-parsing" className="inline-flex items-center gap-1.5 rounded-lg border bg-card px-4 py-2 text-sm hover:border-primary/30 transition-colors">Invoice Parsing Solution <ArrowRight className="h-3 w-3 text-muted-foreground" /></Link>
                <Link href="/compare/nanonets" className="inline-flex items-center gap-1.5 rounded-lg border bg-card px-4 py-2 text-sm hover:border-primary/30 transition-colors">Parsli vs Nanonets <ArrowRight className="h-3 w-3 text-muted-foreground" /></Link>
                <Link href="/blog/best-invoice-ocr-software" className="inline-flex items-center gap-1.5 rounded-lg border bg-card px-4 py-2 text-sm hover:border-primary/30 transition-colors">Best Invoice OCR Software <ArrowRight className="h-3 w-3 text-muted-foreground" /></Link>
              </>
            )}
            {useCase.slug === "email-parsing" && (
              <>
                <Link href="/compare/parseur" className="inline-flex items-center gap-1.5 rounded-lg border bg-card px-4 py-2 text-sm hover:border-primary/30 transition-colors">Parsli vs Parseur <ArrowRight className="h-3 w-3 text-muted-foreground" /></Link>
                <Link href="/compare/mailparser" className="inline-flex items-center gap-1.5 rounded-lg border bg-card px-4 py-2 text-sm hover:border-primary/30 transition-colors">Parsli vs Mailparser <ArrowRight className="h-3 w-3 text-muted-foreground" /></Link>
                <Link href="/blog/best-email-parser-tools" className="inline-flex items-center gap-1.5 rounded-lg border bg-card px-4 py-2 text-sm hover:border-primary/30 transition-colors">Best Email Parser Tools <ArrowRight className="h-3 w-3 text-muted-foreground" /></Link>
              </>
            )}
            {useCase.slug === "pdf-data-extraction" && (
              <>
                <Link href="/solutions/pdf-to-excel" className="inline-flex items-center gap-1.5 rounded-lg border bg-card px-4 py-2 text-sm hover:border-primary/30 transition-colors">PDF to Excel Solution <ArrowRight className="h-3 w-3 text-muted-foreground" /></Link>
                <Link href="/compare/docparser" className="inline-flex items-center gap-1.5 rounded-lg border bg-card px-4 py-2 text-sm hover:border-primary/30 transition-colors">Parsli vs Docparser <ArrowRight className="h-3 w-3 text-muted-foreground" /></Link>
                <Link href="/blog/extract-data-from-pdf-automatically" className="inline-flex items-center gap-1.5 rounded-lg border bg-card px-4 py-2 text-sm hover:border-primary/30 transition-colors">Extract Data from PDF Automatically <ArrowRight className="h-3 w-3 text-muted-foreground" /></Link>
              </>
            )}
            {useCase.slug === "receipt-scanning" && (
              <>
                <Link href="/solutions/invoice-parsing" className="inline-flex items-center gap-1.5 rounded-lg border bg-card px-4 py-2 text-sm hover:border-primary/30 transition-colors">Invoice Parsing Solution <ArrowRight className="h-3 w-3 text-muted-foreground" /></Link>
                <Link href="/compare/veryfi" className="inline-flex items-center gap-1.5 rounded-lg border bg-card px-4 py-2 text-sm hover:border-primary/30 transition-colors">Parsli vs Veryfi <ArrowRight className="h-3 w-3 text-muted-foreground" /></Link>
              </>
            )}
            {useCase.slug === "document-automation" && (
              <>
                <Link href="/solutions/no-code-document-parser" className="inline-flex items-center gap-1.5 rounded-lg border bg-card px-4 py-2 text-sm hover:border-primary/30 transition-colors">No-Code Document Parser <ArrowRight className="h-3 w-3 text-muted-foreground" /></Link>
                <Link href="/compare/parseur" className="inline-flex items-center gap-1.5 rounded-lg border bg-card px-4 py-2 text-sm hover:border-primary/30 transition-colors">Parsli vs Parseur <ArrowRight className="h-3 w-3 text-muted-foreground" /></Link>
                <Link href="/blog/automate-data-entry" className="inline-flex items-center gap-1.5 rounded-lg border bg-card px-4 py-2 text-sm hover:border-primary/30 transition-colors">Automate Data Entry Guide <ArrowRight className="h-3 w-3 text-muted-foreground" /></Link>
              </>
            )}
            {useCase.slug === "intelligent-document-processing" && (
              <>
                <Link href="/solutions/no-code-document-parser" className="inline-flex items-center gap-1.5 rounded-lg border bg-card px-4 py-2 text-sm hover:border-primary/30 transition-colors">No-Code Document Parser <ArrowRight className="h-3 w-3 text-muted-foreground" /></Link>
                <Link href="/blog/what-is-document-parsing" className="inline-flex items-center gap-1.5 rounded-lg border bg-card px-4 py-2 text-sm hover:border-primary/30 transition-colors">What Is Document Parsing? <ArrowRight className="h-3 w-3 text-muted-foreground" /></Link>
                <Link href="/compare/nanonets" className="inline-flex items-center gap-1.5 rounded-lg border bg-card px-4 py-2 text-sm hover:border-primary/30 transition-colors">Parsli vs Nanonets <ArrowRight className="h-3 w-3 text-muted-foreground" /></Link>
              </>
            )}
            {useCase.slug === "ocr-data-extraction" && (
              <>
                <Link href="/solutions/document-parsing-api" className="inline-flex items-center gap-1.5 rounded-lg border bg-card px-4 py-2 text-sm hover:border-primary/30 transition-colors">Document Parsing API <ArrowRight className="h-3 w-3 text-muted-foreground" /></Link>
                <Link href="/compare/textract" className="inline-flex items-center gap-1.5 rounded-lg border bg-card px-4 py-2 text-sm hover:border-primary/30 transition-colors">Parsli vs Amazon Textract <ArrowRight className="h-3 w-3 text-muted-foreground" /></Link>
              </>
            )}
            {(useCase.slug === "pdf-to-excel" || useCase.slug === "pdf-to-csv" || useCase.slug === "pdf-to-json") && (
              <>
                <Link href="/solutions/pdf-to-excel" className="inline-flex items-center gap-1.5 rounded-lg border bg-card px-4 py-2 text-sm hover:border-primary/30 transition-colors">PDF to Excel Solution <ArrowRight className="h-3 w-3 text-muted-foreground" /></Link>
                <Link href="/compare/docparser" className="inline-flex items-center gap-1.5 rounded-lg border bg-card px-4 py-2 text-sm hover:border-primary/30 transition-colors">Parsli vs Docparser <ArrowRight className="h-3 w-3 text-muted-foreground" /></Link>
                <Link href="/blog/extract-data-pdf-to-excel" className="inline-flex items-center gap-1.5 rounded-lg border bg-card px-4 py-2 text-sm hover:border-primary/30 transition-colors">PDF to Excel Guide <ArrowRight className="h-3 w-3 text-muted-foreground" /></Link>
              </>
            )}
            <Link href="/compare" className="inline-flex items-center gap-1.5 rounded-lg border bg-card px-4 py-2 text-sm hover:border-primary/30 transition-colors">All Comparisons <ArrowRight className="h-3 w-3 text-muted-foreground" /></Link>
            <Link href="/blog" className="inline-flex items-center gap-1.5 rounded-lg border bg-card px-4 py-2 text-sm hover:border-primary/30 transition-colors">Blog <ArrowRight className="h-3 w-3 text-muted-foreground" /></Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 sm:py-20 bg-muted/30">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold mb-4">
            Ready to Automate {useCase.title}?
          </h2>
          <p className="text-muted-foreground mb-8">
            Start extracting data in minutes. No credit card required.
          </p>
          <AuthButton className="text-base px-8 h-12" showArrow href={ctaHref}>
            {ctaLabel}
          </AuthButton>
        </div>
      </section>
    </>
  )
}
