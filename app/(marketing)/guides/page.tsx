import type { Metadata } from "next"
import Link from "next/link"
import Image from "next/image"
import fs from "fs"
import path from "path"
import { ArrowRight } from "lucide-react"
import { AuthButton } from "@/components/marketing/shared/AuthButton"
import { JsonLd } from "@/components/marketing/shared/JsonLd"
import { breadcrumbJsonLd } from "@/lib/seo/json-ld"
import { getAllGuides } from "@/lib/seo/guides"
import { GuideGrid } from "@/components/marketing/GuideGrid"

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

export default function GuidesHubPage() {
  const guides = getAllGuides()

  const hasImage = (slug: string) =>
    fs.existsSync(
      path.join(process.cwd(), "public", "images", "guides", `${slug}.webp`)
    )

  // Featured = most recent guide
  const featured = guides[0]
  const featuredHasImage = featured ? hasImage(featured.slug) : false

  // Unique categories in display order
  const categories = Array.from(new Set(guides.map((g) => g.category)))

  // Data for client component
  const cardData = guides.map((g) => ({
    slug: g.slug,
    title: g.h1,
    description: g.metaDescription,
    category: g.category,
    publishedAt: g.publishedAt,
    readTime: g.readTime,
    hasImage: hasImage(g.slug),
  }))

  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", url: "https://parsli.co" },
          { name: "Guides", url: "https://parsli.co/guides" },
        ])}
      />

      {/* Hero */}
      <section className="relative pt-28 pb-12 sm:pt-36 sm:pb-16">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-primary/5 rounded-full blur-3xl" />
        </div>
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight leading-[1.1] mb-4">
            Parsli Guides
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Step-by-step tutorials on extracting data from invoices, bank
            statements, receipts, PDFs, and more.
          </p>
        </div>
      </section>

      {/* Featured guide */}
      {featured && (
        <section className="pb-12">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <Link
              href={`/guides/${featured.slug}`}
              className="group grid lg:grid-cols-2 gap-0 rounded-2xl border bg-card overflow-hidden hover:border-primary/30 hover:shadow-lg transition-all duration-200"
            >
              {/* Left — text */}
              <div className="flex flex-col justify-center p-8 sm:p-10 lg:p-12 order-2 lg:order-1">
                <span className="text-xs font-medium text-primary uppercase tracking-wider mb-4">
                  {featured.category}
                </span>
                <h2 className="text-2xl sm:text-3xl font-bold leading-snug mb-4 group-hover:text-primary transition-colors">
                  {featured.h1}
                </h2>
                <p className="text-muted-foreground leading-relaxed mb-6 line-clamp-3">
                  {featured.metaDescription}
                </p>
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <time dateTime={featured.publishedAt}>
                    {new Date(featured.publishedAt).toLocaleDateString(
                      "en-US",
                      {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      }
                    )}
                  </time>
                  <span aria-hidden="true">&middot;</span>
                  <span>{featured.readTime}</span>
                </div>
              </div>
              {/* Right — image */}
              <div className="aspect-[16/9] lg:aspect-auto overflow-hidden bg-muted order-1 lg:order-2">
                {featuredHasImage ? (
                  <Image
                    src={`/images/guides/${featured.slug}.webp`}
                    alt={featured.h1}
                    width={720}
                    height={405}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    priority
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-primary/20 via-primary/10 to-primary/5" />
                )}
              </div>
            </Link>
          </div>
        </section>
      )}

      {/* Filter + grid */}
      <section className="pb-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <GuideGrid guides={cardData} categories={categories} />
        </div>
      </section>

      {/* Explore More */}
      <section className="py-16 sm:py-20 bg-muted/30">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-center mb-8">Explore More</h2>
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
