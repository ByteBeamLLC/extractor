import type { Metadata } from "next"
import Link from "next/link"
import Image from "next/image"
import fs from "fs"
import path from "path"
import { ChevronRight } from "lucide-react"
import { getAllBlogPosts } from "@/lib/seo/blog-posts"
import { Button } from "@/components/ui/button"
import { AuthButton } from "@/components/marketing/shared/AuthButton"
import { BlogGrid } from "@/components/marketing/BlogGrid"

export const metadata: Metadata = {
  title: "Blog - Parsli",
  description:
    "Guides, comparisons, and tips for document data extraction. Learn how to extract data from PDFs, automate invoice processing, and more.",
  alternates: {
    canonical: "https://parsli.co/blog",
  },
  openGraph: {
    title: "Blog - Parsli",
    description:
      "Guides, comparisons, and tips for document data extraction.",
    url: "https://parsli.co/blog",
    images: [
      {
        url: "https://parsli.co/parsli-og.png",
        width: 1200,
        height: 630,
        alt: "Parsli Blog",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Blog - Parsli",
    description:
      "Guides, comparisons, and tips for document data extraction.",
    images: ["https://parsli.co/parsli-og.png"],
  },
}

export default function BlogIndexPage() {
  const posts = getAllBlogPosts()

  const hasImage = (slug: string) =>
    fs.existsSync(
      path.join(process.cwd(), "public", "images", "blog", `${slug}.webp`)
    )

  // Featured = most recent post
  const featured = posts[0]
  const featuredHasImage = featured ? hasImage(featured.slug) : false

  // Unique categories in display order
  const categories = Array.from(new Set(posts.map((p) => p.category)))

  // Data for client component
  const cardData = posts.map((p) => ({
    slug: p.slug,
    title: p.title,
    excerpt: p.excerpt,
    category: p.category,
    publishedAt: p.publishedAt,
    readTime: p.readTime,
    hasImage: hasImage(p.slug),
    href: `/blog/${p.slug}`,
  }))

  return (
    <>
      {/* Hero */}
      <section className="relative pt-28 pb-12 sm:pt-36 sm:pb-16">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-primary/5 rounded-full blur-3xl" />
        </div>
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight leading-[1.1] mb-4">
            The Parsli Blog
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Comparisons, industry insights, and tips for document data
            extraction to help you automate faster.
          </p>
        </div>
      </section>

      {/* Featured post */}
      {featured && (
        <section className="pb-12">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <Link
              href={`/blog/${featured.slug}`}
              className="group grid lg:grid-cols-2 gap-0 rounded-2xl border bg-card overflow-hidden hover:border-primary/30 hover:shadow-lg transition-all duration-200"
            >
              {/* Left — text */}
              <div className="flex flex-col justify-center p-8 sm:p-10 lg:p-12 order-2 lg:order-1">
                <span className="text-xs font-medium text-primary uppercase tracking-wider mb-4">
                  {featured.category}
                </span>
                <h2 className="text-2xl sm:text-3xl font-bold leading-snug mb-4 group-hover:text-primary transition-colors">
                  {featured.title}
                </h2>
                <p className="text-muted-foreground leading-relaxed mb-6 line-clamp-3">
                  {featured.excerpt}
                </p>
                <time
                  dateTime={featured.publishedAt}
                  className="text-sm text-muted-foreground"
                >
                  {new Date(featured.publishedAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </time>
              </div>
              {/* Right — image */}
              <div className="aspect-[16/9] lg:aspect-auto overflow-hidden bg-muted order-1 lg:order-2">
                {featuredHasImage ? (
                  <Image
                    src={`/images/blog/${featured.slug}.webp`}
                    alt={featured.title}
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
      <section className="pb-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <BlogGrid posts={cardData} categories={categories} />
        </div>
      </section>

      {/* Footer CTA */}
      <section className="pb-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl border bg-muted/30 p-10 text-center">
            <h2 className="text-2xl font-bold mb-3">
              Start extracting data for free
            </h2>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Free forever up to 30 pages/month. No credit card required.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <AuthButton
                href="/login"
                className="text-base px-8 h-12"
                showArrow
              >
                Try it for free
              </AuthButton>
              <Button
                variant="outline"
                size="lg"
                className="text-base px-8 h-12"
                asChild
              >
                <a
                  href="https://calendly.com/talal-bytebeam/parsli-discovery-call"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Book a demo
                </a>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
