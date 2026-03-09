import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"
import {
  Upload,
  Sparkles,
  Download,
  FileText,
  Zap,
  Clock,
  Plug,
  X,
  Check,
  ArrowRight,
  Info,
  ChevronDown,
} from "lucide-react"
import { AuthButton } from "@/components/marketing/shared/AuthButton"
import { JsonLd } from "@/components/marketing/shared/JsonLd"
import { breadcrumbJsonLd, solutionPageJsonLd, faqJsonLd } from "@/lib/seo/json-ld"
import {
  getSolutionBySlug,
  getAllSolutionSlugs,
  getAllSolutions,
} from "@/lib/seo/solutions"

/** Solution slugs that have matching parser templates */
const templateMap: Record<string, { templateId: string; ctaLabel: string }> = {
  "invoice-parsing": {
    templateId: "invoice-parsing",
    ctaLabel: "Start Parsing Invoices Free",
  },
  "bank-statement-extraction": {
    templateId: "bank-statement-extraction",
    ctaLabel: "Start Extracting Statements Free",
  },
}

/* Map each solution slug to related use cases, blog posts, and other links */
const solutionRelatedLinks: Record<
  string,
  { href: string; label: string }[]
> = {
  "pdf-to-excel": [
    { href: "/tools/pdf-to-excel", label: "Free PDF to Excel Converter" },
    { href: "/use-cases/pdf-to-excel", label: "PDF to Excel Use Case" },
    { href: "/use-cases/pdf-data-extraction", label: "PDF Data Extraction" },
    { href: "/blog/extract-data-pdf-to-excel", label: "How to Extract Data from PDF to Excel" },
    { href: "/solutions/bank-statement-extraction", label: "Bank Statement Extraction" },
  ],
  "invoice-parsing": [
    { href: "/use-cases/invoice-parsing", label: "Invoice Parsing Use Case" },
    { href: "/use-cases/receipt-scanning", label: "Receipt Scanning" },
    { href: "/use-cases/document-automation", label: "Document Automation" },
    { href: "/blog/best-invoice-ocr-software", label: "Best Invoice OCR Software" },
    { href: "/solutions/no-code-document-parser", label: "No-Code Document Parser" },
  ],
  "bank-statement-extraction": [
    { href: "/tools/pdf-to-excel", label: "Free PDF to Excel Converter" },
    { href: "/use-cases/pdf-data-extraction", label: "PDF Data Extraction" },
    { href: "/use-cases/pdf-to-excel", label: "PDF to Excel" },
    { href: "/blog/extract-data-pdf-to-excel", label: "How to Extract Data from PDF to Excel" },
    { href: "/solutions/pdf-to-excel", label: "PDF to Excel Solution" },
  ],
  "no-code-document-parser": [
    { href: "/use-cases/document-automation", label: "Document Automation" },
    { href: "/use-cases/intelligent-document-processing", label: "Intelligent Document Processing" },
    { href: "/use-cases/email-parsing", label: "Email Parsing" },
    { href: "/blog/best-invoice-ocr-software", label: "Best Invoice OCR Software" },
    { href: "/solutions/invoice-parsing", label: "Invoice Parsing Solution" },
  ],
  "document-parsing-api": [
    { href: "/use-cases/ocr-data-extraction", label: "OCR Data Extraction" },
    { href: "/use-cases/document-automation", label: "Document Automation" },
    { href: "/integrations/api", label: "REST API Integration" },
    { href: "/integrations/webhooks", label: "Webhooks Integration" },
    { href: "/docs#api", label: "API Documentation" },
  ],
}

function getRelatedLinks(slug: string) {
  return solutionRelatedLinks[slug] ?? [
    { href: "/tools/pdf-to-excel", label: "Free PDF to Excel Converter" },
    { href: "/use-cases/pdf-data-extraction", label: "PDF Data Extraction" },
    { href: "/use-cases/document-automation", label: "Document Automation" },
    { href: "/blog/extract-data-pdf-to-excel", label: "How to Extract Data from PDF to Excel" },
  ]
}

function getOtherSolutions(currentSlug: string) {
  return getAllSolutions().filter((s) => s.slug !== currentSlug)
}

export function generateStaticParams() {
  return getAllSolutionSlugs().map((slug) => ({ slug }))
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string }
}): Promise<Metadata> {
  const solution = getSolutionBySlug(params.slug)
  if (!solution) return {}

  return {
    title: solution.metaTitle,
    description: solution.metaDescription,
    alternates: {
      canonical: `https://parsli.co/solutions/${solution.slug}`,
    },
    openGraph: {
      title: solution.metaTitle,
      description: solution.metaDescription,
      url: `https://parsli.co/solutions/${solution.slug}`,
    },
  }
}

const stepIcons = [Upload, Sparkles, Download]
const benefitIcons = [FileText, Zap, Clock, Plug]

export default function SolutionPage({
  params,
}: {
  params: { slug: string }
}) {
  const solution = getSolutionBySlug(params.slug)
  if (!solution) notFound()

  const template = templateMap[solution.slug]
  const ctaHref = template
    ? `/dashboard?template=${template.templateId}`
    : undefined
  const ctaLabel = template?.ctaLabel ?? "Start Free Trial"

  const otherSolutions = getOtherSolutions(solution.slug)

  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", url: "https://parsli.co" },
          { name: "Solutions", url: "https://parsli.co/solutions" },
          {
            name: solution.h1,
            url: `https://parsli.co/solutions/${solution.slug}`,
          },
        ])}
      />
      <JsonLd data={solutionPageJsonLd(solution)} />
      <JsonLd data={faqJsonLd(solution.faq)} />

      {/* ═══════ Hero ═══════ */}
      <section className="relative min-h-[80vh] flex items-center justify-center">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-primary/5 rounded-full blur-3xl" />
        </div>
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center py-20">
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.08] mb-8">
            {solution.h1}
            <br />
            <span className="text-primary">{solution.h1Accent}</span>
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
            {solution.subtitle}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <AuthButton className="text-base px-8 h-13" showArrow href={ctaHref}>
              {ctaLabel}
            </AuthButton>
            <Link
              href="/docs"
              className="inline-flex items-center gap-2 rounded-lg border bg-card px-7 h-13 text-base font-medium hover:bg-muted transition-colors"
            >
              View API Docs
            </Link>
          </div>
          <p className="mt-5 text-sm text-muted-foreground">
            No credit card required &middot; 30 free pages/month
          </p>
        </div>
      </section>

      {/* ═══════ Pain Comparison ═══════ */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <p className="text-sm font-semibold text-primary text-center mb-3">
            Why Parsli?
          </p>
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-12">
            {solution.comparisonHeadline}
          </h2>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Without Parsli */}
            <div className="rounded-xl border bg-card p-6 sm:p-8">
              <h3 className="text-lg font-bold text-destructive mb-6">
                Without Parsli
              </h3>
              <ul className="space-y-4">
                {solution.painPoints.map((point) => (
                  <li key={point} className="flex gap-3">
                    <X className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                    <span className="text-muted-foreground">{point}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* With Parsli */}
            <div className="rounded-xl border border-primary/20 bg-primary/[0.03] p-6 sm:p-8">
              <h3 className="text-lg font-bold text-primary mb-6">
                With Parsli
              </h3>
              <ul className="space-y-4">
                {solution.solutions.map((point) => (
                  <li key={point} className="flex gap-3">
                    <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <span className="text-foreground">{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <p className="mt-8 text-center">
            <span className="inline-block rounded-md bg-primary px-3 py-1 text-sm font-bold text-primary-foreground">
              {solution.saveLine}
            </span>
          </p>
        </div>
      </section>

      {/* ═══════ Callout Box ═══════ */}
      <section className="pb-16 sm:pb-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-xl border border-primary/20 bg-primary/[0.03] p-6 sm:p-8 flex gap-4">
            <div className="shrink-0">
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 text-primary">
                <Info className="h-5 w-5" />
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-1">
                {solution.calloutBox.title}
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                {solution.calloutBox.description}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════ Supported Document Types ═══════ */}
      <section className="py-16 sm:py-20 bg-muted/30">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <p className="text-sm font-semibold text-primary text-center mb-3">
            Compatibility
          </p>
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-12">
            Every document format supported
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
            {solution.supportedTypes.map((type) => (
              <div
                key={type.name}
                className="rounded-xl border bg-card p-5 text-center hover:border-primary/30 transition-colors"
              >
                <span className="text-3xl mb-3 block">{type.emoji}</span>
                <span className="text-sm font-medium">{type.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ How It Works ═══════ */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <p className="text-sm font-semibold text-primary text-center mb-3">
            How It Works
          </p>
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-12">
            Three steps to structured data
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {solution.howItWorks.map((step, i) => {
              const Icon = stepIcons[i]
              return (
                <div
                  key={step.step}
                  className="relative rounded-xl border bg-card p-6 text-center"
                >
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary mb-4">
                    <Icon className="h-6 w-6" />
                  </div>
                  <div className="absolute top-4 right-4 text-xs font-bold text-muted-foreground/40">
                    {step.step}
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{step.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {step.description}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ═══════ See It In Action ═══════ */}
      <section className="py-16 sm:py-20 bg-muted/30">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <p className="text-sm font-semibold text-primary text-center mb-3">
            See It In Action
          </p>
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-4">
            From document to structured data in minutes
          </h2>
          <p className="text-center text-muted-foreground max-w-2xl mx-auto mb-12">
            No complex setup. No code required. Just define what you need and let AI do the rest.
          </p>

          <div className="space-y-16">
            {/* Step 1: Create Parser */}
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold mb-4">
                  1
                </div>
                <h3 className="text-xl font-semibold mb-2">Create a parser</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Give your parser a name and description. Each parser is a reusable extraction
                  template — create one for invoices, another for receipts, another for contracts.
                </p>
              </div>
              <div className="rounded-xl border bg-card overflow-hidden shadow-sm">
                <Image
                  src="/images/app/create-parser.png"
                  alt="Create Parser dialog showing name and description fields"
                  width={1000}
                  height={600}
                  className="w-full h-auto"
                />
              </div>
            </div>

            {/* Step 2: Define Schema */}
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div className="md:order-2">
                <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold mb-4">
                  2
                </div>
                <h3 className="text-xl font-semibold mb-2">Define your schema</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Tell the AI exactly what data to extract. Add fields like &ldquo;invoice number&rdquo;,
                  &ldquo;line items&rdquo;, or &ldquo;total amount&rdquo; — choose from 15 field types
                  including tables, objects, and lists.
                </p>
              </div>
              <div className="rounded-xl border bg-card overflow-hidden shadow-sm md:order-1">
                <Image
                  src="/images/app/schema-overview.png"
                  alt="Schema builder showing defined extraction fields with type badges"
                  width={1500}
                  height={580}
                  className="w-full h-auto"
                />
              </div>
            </div>

            {/* Step 3: Connect Integrations */}
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold mb-4">
                  3
                </div>
                <h3 className="text-xl font-semibold mb-2">Connect your tools</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Send extracted data wherever you need it — Google Sheets, Zapier, Make,
                  Power Automate, webhooks, or Gmail inbox. One-click setup, no code required.
                </p>
              </div>
              <div className="rounded-xl border bg-card overflow-hidden shadow-sm">
                <Image
                  src="/images/app/add-integration.png"
                  alt="Add Integration dialog showing Webhook, Google Sheets, Zapier, Make, Power Automate, and Gmail options"
                  width={1000}
                  height={1050}
                  className="w-full h-auto"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════ Code Example (API page only) ═══════ */}
      {solution.codeExample && (
        <section className="py-16 sm:py-20">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <p className="text-sm font-semibold text-primary text-center mb-3">
              Code Example
            </p>
            <h2 className="text-2xl sm:text-3xl font-bold text-center mb-10">
              Get Started in Minutes
            </h2>
            <div className="rounded-xl border bg-[#1e1e2e] overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-white/10">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500/80" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                  <div className="w-3 h-3 rounded-full bg-green-500/80" />
                </div>
                <span className="text-xs text-white/50 ml-2">
                  {solution.codeExample.title}
                </span>
              </div>
              <pre className="p-6 overflow-x-auto text-sm leading-relaxed">
                <code className="text-green-300/90 font-mono">
                  {solution.codeExample.code}
                </code>
              </pre>
            </div>
          </div>
        </section>
      )}

      {/* ═══════ Benefits ═══════ */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <p className="text-sm font-semibold text-primary text-center mb-3">
            Features
          </p>
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-12">
            Why teams choose Parsli
          </h2>
          <div className="grid sm:grid-cols-2 gap-6">
            {solution.benefits.map((benefit, i) => {
              const Icon = benefitIcons[i % benefitIcons.length]
              return (
                <div
                  key={benefit.title}
                  className="rounded-xl border bg-card p-6 hover:border-primary/30 transition-colors"
                >
                  <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 text-primary mb-4">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-semibold mb-2">{benefit.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {benefit.description}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ═══════ Mid-page CTA ═══════ */}
      <section className="py-12 sm:py-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 text-center">
          <AuthButton className="text-base px-8 h-12" showArrow href={ctaHref}>
            {ctaLabel}
          </AuthButton>
          <p className="mt-3 text-sm text-muted-foreground">
            No credit card required &middot; 30 free pages/month
          </p>
        </div>
      </section>

      {/* ═══════ SEO Content Sections ═══════ */}
      <section className="py-16 sm:py-20 border-t">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          {solution.seoSections.map((section, i) => (
            <div key={section.heading} className={i > 0 ? "mt-12" : ""}>
              <h2 className="text-xl sm:text-2xl font-bold mb-4">
                {section.heading}
              </h2>
              {section.content.split("\n\n").map((paragraph, j) => (
                <p
                  key={j}
                  className="text-muted-foreground leading-relaxed mb-4"
                >
                  {paragraph}
                </p>
              ))}
            </div>
          ))}
        </div>
      </section>

      {/* ═══════ FAQ ═══════ */}
      <section className="py-16 sm:py-20 bg-muted/30">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <p className="text-sm font-semibold text-primary text-center mb-3">
            FAQ
          </p>
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-12">
            Frequently asked questions
          </h2>
          <div className="space-y-4">
            {solution.faq.map((item) => (
              <details
                key={item.question}
                className="group rounded-xl border bg-card"
              >
                <summary className="flex items-center justify-between gap-4 px-6 py-5 cursor-pointer list-none font-medium hover:text-primary transition-colors [&::-webkit-details-marker]:hidden">
                  {item.question}
                  <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
                </summary>
                <div className="px-6 pb-5 -mt-1">
                  <p className="text-muted-foreground leading-relaxed">
                    {item.answer}
                  </p>
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ Explore All Solutions ═══════ */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <p className="text-sm font-semibold text-primary text-center mb-3">
            Explore
          </p>
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-4">
            One platform, every document type
          </h2>
          <p className="text-center text-muted-foreground max-w-2xl mx-auto mb-12">
            Same AI extraction engine for all your document processing needs
          </p>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {otherSolutions.map((other) => (
              <Link
                key={other.slug}
                href={`/solutions/${other.slug}`}
                className="rounded-xl border bg-card p-5 hover:border-primary/30 hover:shadow-sm transition-all group"
              >
                <h3 className="font-semibold mb-1 group-hover:text-primary transition-colors">
                  {other.h1}
                </h3>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {other.h1Accent}
                </p>
                <span className="inline-flex items-center gap-1 text-xs font-medium text-primary mt-3">
                  Learn more
                  <ArrowRight className="h-3 w-3" />
                </span>
              </Link>
            ))}
          </div>

          {/* Related resources */}
          <div className="pt-8 border-t">
            <h3 className="text-sm font-semibold text-muted-foreground mb-4">
              Related Resources
            </h3>
            <div className="flex flex-wrap gap-3">
              {getRelatedLinks(solution.slug).map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="inline-flex items-center gap-1.5 rounded-lg border bg-card px-4 py-2 text-sm hover:border-primary/30 transition-colors"
                >
                  {link.label}
                  <ArrowRight className="h-3 w-3 text-muted-foreground" />
                </Link>
              ))}
              <Link
                href="/pricing"
                className="inline-flex items-center gap-1.5 rounded-lg border bg-card px-4 py-2 text-sm hover:border-primary/30 transition-colors"
              >
                Pricing
                <ArrowRight className="h-3 w-3 text-muted-foreground" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════ Final CTA ═══════ */}
      <section className="py-20 sm:py-28 border-t bg-muted/30">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Ready to stop {solution.ctaPainPoint}?
          </h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto">
            Start extracting structured data in minutes. No credit card required.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <AuthButton className="text-base px-8 h-13" showArrow href={ctaHref}>
              {ctaLabel}
            </AuthButton>
            <Link
              href="/docs"
              className="inline-flex items-center gap-2 text-base font-medium text-primary hover:underline"
            >
              Read Documentation
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <p className="mt-5 text-sm text-muted-foreground">
            No credit card required &middot; 30 free pages/month &middot; Cancel anytime
          </p>
        </div>
      </section>
    </>
  )
}
