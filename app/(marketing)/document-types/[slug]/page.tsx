import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { FileText, Check, ChevronDown, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { AuthButton } from "@/components/marketing/shared/AuthButton"
import { JsonLd } from "@/components/marketing/shared/JsonLd"
import { breadcrumbJsonLd, faqJsonLd } from "@/lib/seo/json-ld"
import {
  getDocumentTypeBySlug,
  getAllDocumentTypeSlugs,
} from "@/lib/seo/document-types"
import { getUseCaseBySlug } from "@/lib/seo/use-cases"
import { getIndustryBySlug } from "@/lib/seo/industries"

export function generateStaticParams() {
  return getAllDocumentTypeSlugs().map((slug) => ({ slug }))
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string }
}): Promise<Metadata> {
  const docType = getDocumentTypeBySlug(params.slug)
  if (!docType) return {}

  return {
    title: docType.metaTitle,
    description: docType.metaDescription,
    alternates: {
      canonical: `https://parsli.co/document-types/${docType.slug}`,
    },
    openGraph: {
      title: docType.metaTitle,
      description: docType.metaDescription,
      url: `https://parsli.co/document-types/${docType.slug}`,
    },
  }
}

export default function DocumentTypePage({
  params,
}: {
  params: { slug: string }
}) {
  const docType = getDocumentTypeBySlug(params.slug)
  if (!docType) notFound()

  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", url: "https://parsli.co" },
          { name: "Document Types", url: "https://parsli.co/document-types" },
          {
            name: docType.name,
            url: `https://parsli.co/document-types/${docType.slug}`,
          },
        ])}
      />
      <JsonLd
        data={faqJsonLd(
          docType.faqs.map((f) => ({
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
            Document Type
          </Badge>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight leading-[1.1] mb-6">
            {docType.h1}
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
            {docType.heroDescription}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <AuthButton className="text-base px-8 h-12" showArrow>
              Start Extracting Free
            </AuthButton>
            <Button size="lg" variant="outline" className="text-base px-8 h-12" asChild>
              <Link href="/docs">See How It Works</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Extractable Fields */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-4">
            What You Can Extract
          </h2>
          <p className="text-center text-muted-foreground max-w-2xl mx-auto mb-12">
            Define your schema with any combination of these fields — or add your own custom fields.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl mx-auto">
            {docType.extractableFields.map((field) => (
              <div
                key={field.name}
                className="rounded-xl border bg-card p-5 hover:border-primary/30 transition-colors"
              >
                <div className="inline-flex items-center justify-center w-8 h-8 rounded-md bg-primary/10 text-primary mb-3">
                  <FileText className="h-4 w-4" />
                </div>
                <h3 className="font-semibold text-sm mb-1">{field.name}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {field.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Supported Formats */}
      <section className="py-16 sm:py-20 bg-muted/30">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-12">
            Supported Formats
          </h2>
          <div className="rounded-xl border bg-card p-6 sm:p-8">
            <ul className="grid sm:grid-cols-2 gap-4">
              {docType.supportedFormats.map((format) => (
                <li key={format} className="flex items-center gap-3">
                  <Check className="h-5 w-5 text-primary shrink-0" />
                  <span className="text-sm sm:text-base">{format}</span>
                </li>
              ))}
            </ul>
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
            {docType.faqs.map((faq, i) => (
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
            {docType.relatedUseCases.map((slug) => {
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
            {docType.relatedIndustries.map((slug) => {
              const ind = getIndustryBySlug(slug)
              if (!ind) return null
              return (
                <Link
                  key={slug}
                  href={`/industries/${slug}`}
                  className="group rounded-xl border bg-card p-5 hover:border-primary/30 transition-colors"
                >
                  <Badge variant="secondary" className="mb-2 text-xs">Industry</Badge>
                  <h3 className="font-semibold text-sm mb-1 group-hover:text-primary transition-colors">{ind.name}</h3>
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
            Start Extracting Data from {docType.name}
          </h2>
          <p className="text-muted-foreground mb-8">
            Set up in minutes. No credit card required.
          </p>
          <AuthButton className="text-base px-8 h-12" showArrow>
            Get Started Free
          </AuthButton>
        </div>
      </section>
    </>
  )
}
