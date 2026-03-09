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

      {/* Free Tool Banner (PDF-related use cases only) */}
      {["pdf-to-excel", "pdf-data-extraction", "pdf-to-csv"].includes(useCase.slug) && (
        <section className="py-10 sm:py-12">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
            <Link
              href="/tools/pdf-to-excel"
              className="group flex items-center justify-between rounded-xl border border-primary/20 bg-primary/[0.03] p-5 sm:p-6 hover:border-primary/40 transition-colors"
            >
              <div>
                <p className="font-semibold mb-0.5">
                  Try our free PDF to Excel converter
                </p>
                <p className="text-sm text-muted-foreground">
                  Convert simple PDF tables to Excel instantly. No sign-up, runs in your browser.
                </p>
              </div>
              <ArrowRight className="h-5 w-5 text-primary shrink-0 ml-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
        </section>
      )}

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
