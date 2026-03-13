import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRight, ChevronRight, BookOpen } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { AuthButton } from "@/components/marketing/shared/AuthButton"
import { JsonLd } from "@/components/marketing/shared/JsonLd"
import { breadcrumbJsonLd } from "@/lib/seo/json-ld"
import { getAllGuides } from "@/lib/seo/guides"

export const metadata: Metadata = {
  title: "Guides — Document Extraction Tutorials & How-Tos | Parsli",
  description:
    "Step-by-step guides on extracting data from invoices, bank statements, receipts, and PDFs. Learn manual, Python, and AI-powered methods.",
  alternates: {
    canonical: "https://parsli.co/guides",
  },
  openGraph: {
    title: "Guides — Document Extraction Tutorials & How-Tos | Parsli",
    description:
      "Step-by-step guides on extracting data from invoices, bank statements, receipts, and PDFs.",
    url: "https://parsli.co/guides",
  },
}

const categoryColors: Record<string, { text: string; bg: string }> = {
  "Document Extraction": {
    text: "text-blue-700 dark:text-blue-400",
    bg: "bg-blue-50 dark:bg-blue-950/50",
  },
  "Workflow Automation": {
    text: "text-purple-700 dark:text-purple-400",
    bg: "bg-purple-50 dark:bg-purple-950/50",
  },
  "Integration Guide": {
    text: "text-green-700 dark:text-green-400",
    bg: "bg-green-50 dark:bg-green-950/50",
  },
  "Data Conversion": {
    text: "text-orange-700 dark:text-orange-400",
    bg: "bg-orange-50 dark:bg-orange-950/50",
  },
}

export default function GuidesHubPage() {
  const guides = getAllGuides()

  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", url: "https://parsli.co" },
          { name: "Guides", url: "https://parsli.co/guides" },
        ])}
      />

      {/* Hero */}
      <section className="relative pt-28 pb-16 sm:pt-36 sm:pb-20">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-primary/5 rounded-full blur-3xl" />
        </div>
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <Badge variant="secondary" className="mb-6">
            Guides
          </Badge>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight leading-[1.1] mb-6">
            Document Extraction Guides
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Step-by-step tutorials on extracting data from invoices, bank
            statements, receipts, PDFs, and more. Learn manual, Python, and
            AI-powered methods.
          </p>
        </div>
      </section>

      {/* Guide Grid */}
      <section className="pb-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-6">
            {guides.map((guide) => {
              const colors = categoryColors[guide.category] ?? {
                text: "text-primary",
                bg: "bg-primary/5",
              }
              return (
                <Link
                  key={guide.slug}
                  href={`/guides/${guide.slug}`}
                  className="group rounded-xl border bg-card p-6 sm:p-8 hover:border-primary/30 hover:shadow-md transition-all duration-200"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-3">
                        <Badge
                          variant="secondary"
                          className={`text-xs ${colors.text} ${colors.bg} border-0`}
                        >
                          {guide.category}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {guide.readTime}
                        </span>
                      </div>
                      <h2 className="text-lg sm:text-xl font-semibold mb-2 group-hover:text-primary transition-colors">
                        {guide.h1}
                      </h2>
                      <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
                        {guide.metaDescription}
                      </p>
                      <div className="flex items-center gap-3 mt-4 text-sm text-muted-foreground">
                        <span>{guide.author}</span>
                        <span aria-hidden="true">&middot;</span>
                        <time dateTime={guide.publishedAt}>
                          {new Date(guide.publishedAt).toLocaleDateString(
                            "en-US",
                            {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            }
                          )}
                        </time>
                      </div>
                    </div>
                    <ArrowRight className="h-5 w-5 text-muted-foreground shrink-0 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200 mt-1 hidden sm:block" />
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      </section>

      {/* Explore More */}
      <section className="py-16 sm:py-20 bg-muted/30">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-center mb-8">
            Explore More
          </h2>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              href="/blog"
              className="inline-flex items-center gap-1.5 rounded-lg border bg-card px-4 py-2 text-sm hover:border-primary/30 transition-colors"
            >
              Blog
              <ArrowRight className="h-3 w-3 text-muted-foreground" />
            </Link>
            <Link
              href="/solutions"
              className="inline-flex items-center gap-1.5 rounded-lg border bg-card px-4 py-2 text-sm hover:border-primary/30 transition-colors"
            >
              Solutions
              <ArrowRight className="h-3 w-3 text-muted-foreground" />
            </Link>
            <Link
              href="/tools"
              className="inline-flex items-center gap-1.5 rounded-lg border bg-card px-4 py-2 text-sm hover:border-primary/30 transition-colors"
            >
              Free Tools
              <ArrowRight className="h-3 w-3 text-muted-foreground" />
            </Link>
            <Link
              href="/compare"
              className="inline-flex items-center gap-1.5 rounded-lg border bg-card px-4 py-2 text-sm hover:border-primary/30 transition-colors"
            >
              Compare Alternatives
              <ArrowRight className="h-3 w-3 text-muted-foreground" />
            </Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold mb-4">
            Ready to Automate Document Extraction?
          </h2>
          <p className="text-muted-foreground mb-8">
            Start extracting structured data in minutes. No credit card
            required.
          </p>
          <AuthButton className="text-base px-8 h-12" showArrow>
            Get Started Free
          </AuthButton>
        </div>
      </section>
    </>
  )
}
