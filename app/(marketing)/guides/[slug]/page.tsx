import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import {
  ArrowRight,
  ChevronRight,
  ChevronDown,
  Check,
  Zap,
  Lightbulb,
  AlertTriangle,
  Info,
  X,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { AuthButton } from "@/components/marketing/shared/AuthButton"
import { JsonLd } from "@/components/marketing/shared/JsonLd"
import {
  breadcrumbJsonLd,
  blogPostJsonLd,
  faqJsonLd,
} from "@/lib/seo/json-ld"
import {
  getGuideBySlug,
  getAllGuideSlugs,
  getAllGuides,
  type GuideContentBlock,
} from "@/lib/seo/guides"
import { getSolutionBySlug } from "@/lib/seo/solutions"
import { getAlternativeBySlug } from "@/lib/seo/alternatives"
import { getBlogPostBySlug } from "@/lib/seo/blog-posts"

export function generateStaticParams() {
  return getAllGuideSlugs().map((slug) => ({ slug }))
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string }
}): Promise<Metadata> {
  const guide = getGuideBySlug(params.slug)
  if (!guide) return {}

  return {
    title: guide.metaTitle,
    description: guide.metaDescription,
    alternates: {
      canonical: `https://parsli.co/guides/${guide.slug}`,
    },
    openGraph: {
      title: guide.metaTitle,
      description: guide.metaDescription,
      url: `https://parsli.co/guides/${guide.slug}`,
      type: "article",
      publishedTime: guide.publishedAt,
      modifiedTime: guide.updatedAt,
      authors: [guide.author],
      images: [
        {
          url: "https://parsli.co/parsli-og.png",
          width: 1200,
          height: 630,
          alt: guide.metaTitle,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: guide.metaTitle,
      description: guide.metaDescription,
      images: ["https://parsli.co/parsli-og.png"],
    },
  }
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
}

function extractHeadings(content: GuideContentBlock[]) {
  const headings: { id: string; text: string; level: 2 | 3 }[] = []
  for (const block of content) {
    if (block.type === "heading") {
      headings.push({
        id: block.id ?? slugify(block.text),
        text: block.text,
        level: block.level,
      })
    }
  }
  return headings
}

function renderBlock(block: GuideContentBlock, index: number) {
  switch (block.type) {
    case "paragraph":
      return (
        <p
          key={index}
          className="text-base leading-relaxed text-muted-foreground"
        >
          {block.text}
        </p>
      )
    case "heading": {
      const id = block.id ?? slugify(block.text)
      if (block.level === 2) {
        return (
          <h2
            key={index}
            id={id}
            className="text-2xl font-bold tracking-tight mt-10 mb-4 scroll-mt-24"
          >
            {block.text}
          </h2>
        )
      }
      return (
        <h3
          key={index}
          id={id}
          className="text-xl font-semibold mt-8 mb-3 scroll-mt-24"
        >
          {block.text}
        </h3>
      )
    }
    case "list":
      if (block.ordered) {
        return (
          <ol key={index} className="list-decimal pl-6 space-y-2">
            {block.items.map((item, i) => (
              <li
                key={i}
                className="text-base leading-relaxed text-muted-foreground"
                dangerouslySetInnerHTML={{
                  __html: item.replace(
                    /\*\*(.*?)\*\*/g,
                    '<strong class="text-foreground">$1</strong>'
                  ),
                }}
              />
            ))}
          </ol>
        )
      }
      return (
        <ul key={index} className="list-disc pl-6 space-y-2">
          {block.items.map((item, i) => (
            <li
              key={i}
              className="text-base leading-relaxed text-muted-foreground"
              dangerouslySetInnerHTML={{
                __html: item.replace(
                  /\*\*(.*?)\*\*/g,
                  '<strong class="text-foreground">$1</strong>'
                ),
              }}
            />
          ))}
        </ul>
      )
    case "callout": {
      const styles = {
        tip: "border-primary bg-primary/5",
        warning: "border-amber-500 bg-amber-50 dark:bg-amber-950/30",
        note: "border-muted-foreground/30 bg-muted/30",
      }
      const icons = {
        tip: <Lightbulb className="h-4 w-4 text-primary shrink-0 mt-0.5" />,
        warning: (
          <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
        ),
        note: (
          <Info className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
        ),
      }
      return (
        <div
          key={index}
          className={`rounded-lg border-l-4 ${styles[block.variant]} px-6 py-4`}
        >
          <div className="flex gap-3">
            {icons[block.variant]}
            <p className="text-sm leading-relaxed font-medium">{block.text}</p>
          </div>
        </div>
      )
    }
    case "tldr":
      return (
        <div
          key={index}
          className="rounded-xl bg-primary/5 border border-primary/20 p-6 sm:p-8"
        >
          <div className="flex items-center gap-2 mb-4">
            <Zap className="h-5 w-5 text-primary" />
            <span className="font-bold text-primary uppercase text-sm tracking-wider">
              TL;DR
            </span>
          </div>
          <ul className="space-y-3">
            {block.items.map((item, i) => (
              <li key={i} className="flex gap-3">
                <span className="text-primary mt-1 shrink-0">-</span>
                <span
                  className="text-sm leading-relaxed"
                  dangerouslySetInnerHTML={{
                    __html: item.replace(
                      /\*\*(.*?)\*\*/g,
                      '<strong class="text-foreground">$1</strong>'
                    ),
                  }}
                />
              </li>
            ))}
          </ul>
        </div>
      )
    case "table":
      return (
        <div key={index} className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/50">
                {block.headers.map((header, i) => (
                  <th
                    key={i}
                    className={`px-4 py-3 text-left font-semibold ${
                      block.highlightColumn === i
                        ? "bg-primary/10 text-primary"
                        : ""
                    }`}
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              {block.rows.map((row, ri) => (
                <tr key={ri}>
                  {row.map((cell, ci) => (
                    <td
                      key={ci}
                      className={`px-4 py-3 text-muted-foreground ${
                        block.highlightColumn === ci ? "bg-primary/5" : ""
                      }`}
                    >
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )
    case "step":
      return (
        <div key={index} className="flex gap-4">
          <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-sm font-bold shrink-0">
            {block.number}
          </div>
          <div className="pt-0.5">
            <h4 className="font-semibold mb-1">{block.title}</h4>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {block.description}
            </p>
          </div>
        </div>
      )
    case "tool-callout":
      return (
        <div
          key={index}
          className="rounded-xl border border-primary/20 bg-primary/[0.03] p-6"
        >
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Zap className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-semibold mb-1">{block.title}</p>
              <p className="text-sm text-muted-foreground mb-3">
                {block.description}
              </p>
              <Link
                href={block.href}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline underline-offset-4"
              >
                Try it free
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </div>
        </div>
      )
    case "mid-cta":
      return (
        <div
          key={index}
          className="rounded-lg border border-primary/20 bg-primary/[0.03] px-6 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
        >
          <p className="text-sm font-medium leading-relaxed">{block.text}</p>
          <AuthButton href="/login" size="sm" className="shrink-0" showArrow>
            Try it for free
          </AuthButton>
        </div>
      )
    case "cta":
      return (
        <div
          key={index}
          className="rounded-xl border bg-muted/30 p-8 text-center mt-10"
        >
          <h2 className="text-2xl font-bold mb-3">
            {block.headline ??
              "Stop copying data out of documents manually."}
          </h2>
          <p className="text-muted-foreground mb-6">
            Parsli extracts structured data from PDFs, invoices, and emails —
            automatically. Free forever up to 30 pages/month.
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
          <p className="text-sm text-muted-foreground mt-3">
            No credit card required.
          </p>
        </div>
      )
    case "pros-cons":
      return (
        <div
          key={index}
          className="grid sm:grid-cols-2 gap-4"
        >
          <div className="rounded-lg border bg-green-50/50 dark:bg-green-950/20 p-5">
            <p className="font-semibold text-sm text-green-700 dark:text-green-400 mb-3">
              Pros
            </p>
            <ul className="space-y-2">
              {block.pros.map((pro, i) => (
                <li key={i} className="flex gap-2 text-sm">
                  <Check className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
                  <span className="text-muted-foreground">{pro}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-lg border bg-red-50/50 dark:bg-red-950/20 p-5">
            <p className="font-semibold text-sm text-red-700 dark:text-red-400 mb-3">
              Cons
            </p>
            <ul className="space-y-2">
              {block.cons.map((con, i) => (
                <li key={i} className="flex gap-2 text-sm">
                  <X className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                  <span className="text-muted-foreground">{con}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )
    case "image":
      return (
        <figure key={index} className="rounded-lg overflow-hidden border">
          <img
            src={block.src}
            alt={block.alt}
            className="w-full"
            loading="lazy"
          />
          {block.caption && (
            <figcaption className="text-xs text-muted-foreground text-center py-2 px-4">
              {block.caption}
            </figcaption>
          )}
        </figure>
      )
    default:
      return null
  }
}

export default function GuidePage({
  params,
}: {
  params: { slug: string }
}) {
  const guide = getGuideBySlug(params.slug)
  if (!guide) notFound()

  const headings = extractHeadings(guide.content)
  const allGuides = getAllGuides()
  const relatedGuides = allGuides
    .filter((g) => g.slug !== guide.slug)
    .slice(0, 3)

  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", url: "https://parsli.co" },
          { name: "Guides", url: "https://parsli.co/guides" },
          {
            name: guide.title,
            url: `https://parsli.co/guides/${guide.slug}`,
          },
        ])}
      />
      <JsonLd
        data={blogPostJsonLd({
          title: guide.title,
          description: guide.metaDescription,
          url: `https://parsli.co/guides/${guide.slug}`,
          publishedAt: guide.publishedAt,
          updatedAt: guide.updatedAt,
          author: guide.author,
        })}
      />
      {guide.faqs.length > 0 && (
        <JsonLd data={faqJsonLd(guide.faqs)} />
      )}

      {/* Hero */}
      <section className="relative pt-28 pb-12 sm:pt-36 sm:pb-16">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-primary/5 rounded-full blur-3xl" />
        </div>
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          {/* Breadcrumbs */}
          <nav
            aria-label="Breadcrumb"
            className="flex items-center gap-1.5 text-sm text-muted-foreground mb-8"
          >
            <Link
              href="/"
              className="hover:text-foreground transition-colors"
            >
              Home
            </Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <Link
              href="/guides"
              className="hover:text-foreground transition-colors"
            >
              Guides
            </Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="text-foreground truncate max-w-[200px] sm:max-w-none">
              {guide.title}
            </span>
          </nav>

          <div className="grid lg:grid-cols-2 gap-8 items-start">
            {/* Left — title + meta */}
            <div>
              <Badge variant="secondary" className="mb-4">
                {guide.category}
              </Badge>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight leading-[1.1] mb-6">
                {guide.h1}
              </h1>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <span>{guide.author}</span>
                <span aria-hidden="true">&middot;</span>
                <time dateTime={guide.updatedAt}>
                  {new Date(guide.updatedAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </time>
                <span aria-hidden="true">&middot;</span>
                <span>{guide.readTime}</span>
              </div>
            </div>

            {/* Right — featured image card */}
            <div className="rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border p-8 text-center hidden lg:block">
              <Badge className="mb-4 bg-primary/20 text-primary border-0">
                {guide.category}
              </Badge>
              <p className="text-xl font-bold">{guide.imageTitle}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Two-column layout */}
      <section className="pb-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-[1fr_240px] lg:gap-12">
            {/* Main content */}
            <article className="min-w-0">
              {/* TL;DR */}
              <div className="mb-8">
                <div className="rounded-xl bg-primary/5 border border-primary/20 p-6 sm:p-8">
                  <div className="flex items-center gap-2 mb-4">
                    <Zap className="h-5 w-5 text-primary" />
                    <span className="font-bold text-primary uppercase text-sm tracking-wider">
                      TL;DR
                    </span>
                  </div>
                  <ul className="space-y-3">
                    {guide.tldr.map((item, i) => (
                      <li key={i} className="flex gap-3">
                        <span className="text-primary mt-1 shrink-0">-</span>
                        <span
                          className="text-sm leading-relaxed"
                          dangerouslySetInnerHTML={{
                            __html: item.replace(
                              /\*\*(.*?)\*\*/g,
                              '<strong class="text-foreground">$1</strong>'
                            ),
                          }}
                        />
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Content blocks */}
              <div className="space-y-5">
                {guide.content.map((block, index) =>
                  renderBlock(block, index)
                )}
              </div>

              {/* FAQ */}
              {guide.faqs.length > 0 && (
                <div className="mt-16">
                  <h2
                    id="faq"
                    className="text-2xl font-bold tracking-tight mb-8 scroll-mt-24"
                  >
                    Frequently Asked Questions
                  </h2>
                  <div className="divide-y rounded-xl border bg-card">
                    {guide.faqs.map((faq, i) => (
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
              )}

              {/* Related Resources */}
              <div className="mt-16 pt-10 border-t">
                <h2 className="text-xl font-bold mb-6">
                  Related Resources
                </h2>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {guide.relatedSolutions.map((slug) => {
                    const sol = getSolutionBySlug(slug)
                    if (!sol) return null
                    return (
                      <Link
                        key={slug}
                        href={`/solutions/${slug}`}
                        className="group rounded-xl border bg-card p-5 hover:border-primary/30 transition-colors"
                      >
                        <Badge
                          variant="secondary"
                          className="mb-2 text-xs"
                        >
                          Solution
                        </Badge>
                        <h3 className="font-semibold text-sm mb-1 group-hover:text-primary transition-colors">
                          {sol.h1}
                        </h3>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          Learn more{" "}
                          <ArrowRight className="h-3 w-3" />
                        </span>
                      </Link>
                    )
                  })}
                  {guide.relatedCompare.map((slug) => {
                    const alt = getAlternativeBySlug(slug)
                    if (!alt) return null
                    return (
                      <Link
                        key={slug}
                        href={`/compare/${slug}`}
                        className="group rounded-xl border bg-card p-5 hover:border-primary/30 transition-colors"
                      >
                        <Badge
                          variant="secondary"
                          className="mb-2 text-xs"
                        >
                          Compare
                        </Badge>
                        <h3 className="font-semibold text-sm mb-1 group-hover:text-primary transition-colors">
                          Parsli vs {alt.competitor}
                        </h3>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          Compare{" "}
                          <ArrowRight className="h-3 w-3" />
                        </span>
                      </Link>
                    )
                  })}
                  {guide.relatedBlog.map((slug) => {
                    const post = getBlogPostBySlug(slug)
                    if (!post) return null
                    return (
                      <Link
                        key={slug}
                        href={`/blog/${slug}`}
                        className="group rounded-xl border bg-card p-5 hover:border-primary/30 transition-colors"
                      >
                        <Badge
                          variant="secondary"
                          className="mb-2 text-xs"
                        >
                          Blog
                        </Badge>
                        <h3 className="font-semibold text-sm mb-1 group-hover:text-primary transition-colors">
                          {post.title}
                        </h3>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          Read more{" "}
                          <ArrowRight className="h-3 w-3" />
                        </span>
                      </Link>
                    )
                  })}
                </div>
                <div className="mt-6 flex flex-wrap gap-3">
                  <Link
                    href="/guides"
                    className="inline-flex items-center gap-1.5 rounded-lg border bg-card px-4 py-2 text-sm hover:border-primary/30 transition-colors"
                  >
                    All Guides{" "}
                    <ArrowRight className="h-3 w-3 text-muted-foreground" />
                  </Link>
                  <Link
                    href="/compare"
                    className="inline-flex items-center gap-1.5 rounded-lg border bg-card px-4 py-2 text-sm hover:border-primary/30 transition-colors"
                  >
                    Compare Alternatives{" "}
                    <ArrowRight className="h-3 w-3 text-muted-foreground" />
                  </Link>
                  <Link
                    href="/blog"
                    className="inline-flex items-center gap-1.5 rounded-lg border bg-card px-4 py-2 text-sm hover:border-primary/30 transition-colors"
                  >
                    Blog{" "}
                    <ArrowRight className="h-3 w-3 text-muted-foreground" />
                  </Link>
                </div>
              </div>

              {/* Related Guides */}
              {relatedGuides.length > 0 && (
                <div className="mt-12 pt-10 border-t">
                  <h2 className="text-xl font-bold mb-6">
                    More Guides
                  </h2>
                  <div className="grid gap-4">
                    {relatedGuides.map((g) => (
                      <Link
                        key={g.slug}
                        href={`/guides/${g.slug}`}
                        className="group rounded-lg border bg-card p-5 hover:border-primary/30 transition-colors"
                      >
                        <Badge
                          variant="secondary"
                          className="mb-2 text-xs"
                        >
                          {g.category}
                        </Badge>
                        <h3 className="font-semibold group-hover:text-primary transition-colors mb-1">
                          {g.h1}
                        </h3>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {g.metaDescription}
                        </p>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Author Bio */}
              <div className="mt-12 pt-10 border-t">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-primary font-bold">
                    {guide.author
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </div>
                  <div>
                    <p className="font-semibold">{guide.author}</p>
                    <p className="text-sm text-muted-foreground">
                      {guide.authorTitle}
                    </p>
                  </div>
                </div>
              </div>
            </article>

            {/* Sidebar */}
            <aside className="hidden lg:block">
              <div className="sticky top-24">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
                  On this page
                </p>
                <nav className="space-y-1">
                  {headings
                    .filter((h) => h.level === 2)
                    .map((h2) => (
                      <div key={h2.id}>
                        <a
                          href={`#${h2.id}`}
                          className="block text-sm text-muted-foreground hover:text-foreground transition-colors py-1"
                        >
                          {h2.text}
                        </a>
                      </div>
                    ))}
                  {guide.faqs.length > 0 && (
                    <a
                      href="#faq"
                      className="block text-sm text-muted-foreground hover:text-foreground transition-colors py-1"
                    >
                      FAQ
                    </a>
                  )}
                </nav>

                {/* Related tools in sidebar */}
                {guide.relatedTools.length > 0 && (
                  <div className="mt-8 pt-6 border-t">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                      Try Free
                    </p>
                    {guide.relatedTools.map((tool) => (
                      <Link
                        key={tool.href}
                        href={tool.href}
                        className="block text-sm text-primary hover:underline underline-offset-4 mb-2"
                      >
                        {tool.title} &rarr;
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </aside>
          </div>
        </div>
      </section>
    </>
  )
}
