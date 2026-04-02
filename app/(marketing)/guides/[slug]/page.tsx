import type { Metadata } from "next"
import Link from "next/link"
import Image from "next/image"
import fs from "fs"
import path from "path"
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
  Trophy,
  ExternalLink,
  Quote,
  FileText,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { AuthButton } from "@/components/marketing/shared/AuthButton"
import { DemoModalButton } from "@/components/marketing/DemoModalButton"
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

  const bannerExists = fs.existsSync(
    path.join(process.cwd(), "public", "images", "guides", `${guide.slug}.webp`)
  )
  const ogImage = bannerExists
    ? `https://parsli.co/images/guides/${guide.slug}.webp`
    : "https://parsli.co/parsli-og.png"

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
          url: ogImage,
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
      images: [ogImage],
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

/** Process markdown-like syntax: **bold**, [link text](url), *italic* */
function processInlineMarkup(text: string): string {
  return text
    .replace(
      /\[([^\]]+)\]\(([^)]+)\)/g,
      '<a href="$2" class="text-primary underline underline-offset-4 hover:text-primary/80 transition-colors">$1</a>'
    )
    .replace(
      /\*\*(.*?)\*\*/g,
      '<strong class="text-foreground">$1</strong>'
    )
    .replace(
      /(?<!\*)\*([^*]+)\*(?!\*)/g,
      '<em>$1</em>'
    )
}

function renderBlock(block: GuideContentBlock, index: number) {
  switch (block.type) {
    case "paragraph":
      return (
        <p
          key={index}
          className="text-base leading-[1.8] text-muted-foreground"
          dangerouslySetInnerHTML={{
            __html: processInlineMarkup(block.text),
          }}
        />
      )
    case "heading": {
      const id = block.id ?? slugify(block.text)
      if (block.level === 2) {
        return (
          <h2
            key={index}
            id={id}
            className="text-2xl font-bold tracking-tight mt-12 mb-4 scroll-mt-24"
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
          <ol key={index} className="list-decimal pl-6 space-y-3">
            {block.items.map((item, i) => (
              <li
                key={i}
                className="text-base leading-[1.8] text-muted-foreground pl-1"
                dangerouslySetInnerHTML={{
                  __html: processInlineMarkup(item),
                }}
              />
            ))}
          </ol>
        )
      }
      return (
        <ul key={index} className="list-disc pl-6 space-y-3">
          {block.items.map((item, i) => (
            <li
              key={i}
              className="text-base leading-[1.8] text-muted-foreground pl-1"
              dangerouslySetInnerHTML={{
                __html: processInlineMarkup(item),
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
        tip: <Lightbulb className="h-5 w-5 text-primary shrink-0 mt-0.5" />,
        warning: (
          <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
        ),
        note: (
          <Info className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
        ),
      }
      return (
        <div
          key={index}
          className={`rounded-lg border-l-4 ${styles[block.variant]} px-6 py-5`}
        >
          <div className="flex gap-3">
            {icons[block.variant]}
            <p
              className="text-sm leading-relaxed font-medium"
              dangerouslySetInnerHTML={{
                __html: processInlineMarkup(block.text),
              }}
            />
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
                    __html: processInlineMarkup(item),
                  }}
                />
              </li>
            ))}
          </ul>
        </div>
      )
    case "table":
      return (
        <div key={index} className="overflow-x-auto rounded-xl border">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/50 border-b">
                {block.headers.map((header, i) => (
                  <th
                    key={i}
                    className={`px-4 py-3.5 text-left font-semibold text-sm ${
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
                <tr key={ri} className="hover:bg-muted/20 transition-colors">
                  {row.map((cell, ci) => (
                    <td
                      key={ci}
                      className={`px-4 py-3.5 text-muted-foreground ${
                        block.highlightColumn === ci
                          ? "bg-primary/5 font-medium text-foreground"
                          : ""
                      } ${ci === 0 ? "font-medium text-foreground" : ""}`}
                      dangerouslySetInnerHTML={{
                        __html: cell
                          .replace(/✓/g, '<span class="text-green-600 font-bold">✓</span>')
                          .replace(/✗/g, '<span class="text-red-500 font-bold">✗</span>'),
                      }}
                    />
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )
    case "step":
      return (
        <div key={index} className="flex gap-4 py-1">
          <div className="w-9 h-9 rounded-full bg-primary text-white flex items-center justify-center text-sm font-bold shrink-0 shadow-sm">
            {block.number}
          </div>
          <div className="pt-0.5 flex-1">
            <h4 className="font-semibold mb-1.5 text-foreground">{block.title}</h4>
            <p
              className="text-sm text-muted-foreground leading-relaxed"
              dangerouslySetInnerHTML={{
                __html: processInlineMarkup(block.description),
              }}
            />
          </div>
        </div>
      )
    case "tool-callout":
      return (
        <div
          key={index}
          className="rounded-xl border-2 border-primary/20 bg-gradient-to-r from-primary/[0.04] to-transparent p-6"
        >
          <div className="flex items-start gap-4">
            <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Zap className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-base mb-1">{block.title}</p>
              <p className="text-sm text-muted-foreground mb-3">
                {block.description}
              </p>
              <Link
                href={block.href}
                className="inline-flex items-center gap-2 text-sm font-semibold text-primary bg-primary/10 hover:bg-primary/20 px-4 py-2 rounded-lg transition-colors"
              >
                Try it free
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>
      )
    case "mid-cta":
      return (
        <div
          key={index}
          className="rounded-xl border-2 border-primary/20 bg-gradient-to-r from-primary/[0.05] to-primary/[0.02] px-6 py-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
        >
          <p
            className="text-sm font-medium leading-relaxed"
            dangerouslySetInnerHTML={{
              __html: processInlineMarkup(block.text),
            }}
          />
          <div className="flex gap-2 shrink-0">
            <AuthButton href="/login" size="sm" className="shrink-0 shadow-sm" showArrow>
              Try it for free
            </AuthButton>
            <DemoModalButton className="h-9 text-xs px-3">
              See demo
            </DemoModalButton>
          </div>
        </div>
      )
    case "cta":
      return (
        <div
          key={index}
          className="relative rounded-2xl overflow-hidden mt-12"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/90 to-primary/80" />
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-4 right-8 w-32 h-32 border-2 border-white/30 rounded-xl rotate-12" />
            <div className="absolute bottom-4 left-8 w-24 h-24 border-2 border-white/20 rounded-lg -rotate-6" />
          </div>
          <div className="relative px-8 py-12 text-center">
            <h2 className="text-2xl sm:text-3xl font-bold mb-3 text-white">
              {block.headline ??
                "Stop copying data out of documents manually."}
            </h2>
            <p className="text-white/80 mb-8 max-w-lg mx-auto">
              Parsli extracts structured data from PDFs, invoices, and emails —
              automatically. Free forever up to 30 pages/month.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <AuthButton
                href="/login"
                className="text-base px-8 h-12 bg-white text-primary hover:bg-white/90 shadow-lg"
                showArrow
              >
                Try it for free
              </AuthButton>
              <DemoModalButton className="text-base px-8 h-12 border-white/30 text-white hover:bg-white/10 hover:text-white">
                See How It Works
              </DemoModalButton>
            </div>
            <p className="text-sm text-white/60 mt-4">
              No credit card required. &nbsp;·&nbsp;{" "}
              <a
                href="https://calendly.com/talal-bytebeam/parsli-discovery-call"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-white/80"
              >
                Or book a demo call
              </a>
            </p>
          </div>
        </div>
      )
    case "pros-cons":
      return (
        <div key={index} className="grid sm:grid-cols-2 gap-4">
          <div className="rounded-xl border bg-green-50/50 dark:bg-green-950/20 p-6">
            <p className="font-semibold text-sm text-green-700 dark:text-green-400 mb-3 flex items-center gap-2">
              <Check className="h-4 w-4" />
              Pros
            </p>
            <ul className="space-y-2.5">
              {block.pros.map((pro, i) => (
                <li key={i} className="flex gap-2.5 text-sm">
                  <Check className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
                  <span className="text-muted-foreground leading-relaxed">{pro}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-xl border bg-red-50/50 dark:bg-red-950/20 p-6">
            <p className="font-semibold text-sm text-red-700 dark:text-red-400 mb-3 flex items-center gap-2">
              <X className="h-4 w-4" />
              Cons
            </p>
            <ul className="space-y-2.5">
              {block.cons.map((con, i) => (
                <li key={i} className="flex gap-2.5 text-sm">
                  <X className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                  <span className="text-muted-foreground leading-relaxed">{con}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )
    case "tool-review":
      return (
        <div
          key={index}
          className="rounded-xl border-2 border-amber-200 dark:border-amber-800/50 bg-gradient-to-b from-amber-50/80 to-transparent dark:from-amber-950/20 p-6 sm:p-8"
        >
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-9 h-9 rounded-lg bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center">
              <Trophy className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                Best For
              </p>
            </div>
          </div>
          <p
            className="text-sm text-muted-foreground leading-relaxed mb-5"
            dangerouslySetInnerHTML={{
              __html: processInlineMarkup(block.bestFor),
            }}
          />
          {block.features.length > 0 && (
            <div className="mb-5">
              <p className="font-semibold text-sm mb-2.5">Key features</p>
              <ul className="space-y-2">
                {block.features.map((f, i) => (
                  <li key={i} className="flex gap-2.5 text-sm">
                    <Check className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                    <span
                      className="text-muted-foreground leading-relaxed"
                      dangerouslySetInnerHTML={{
                        __html: processInlineMarkup(f),
                      }}
                    />
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div className="grid sm:grid-cols-2 gap-4 mb-5">
            <div>
              <p className="font-semibold text-sm text-green-700 dark:text-green-400 mb-2">Pros</p>
              <ul className="space-y-1.5">
                {block.pros.map((p, i) => (
                  <li key={i} className="text-sm text-muted-foreground leading-relaxed">
                    + {p}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="font-semibold text-sm text-red-700 dark:text-red-400 mb-2">Cons</p>
              <ul className="space-y-1.5">
                {block.cons.map((c, i) => (
                  <li key={i} className="text-sm text-muted-foreground leading-relaxed">
                    - {c}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="pt-4 border-t border-amber-200/50 dark:border-amber-800/30">
            <p className="text-sm font-semibold mb-1">Should you use {block.name}?</p>
            <p
              className="text-sm text-muted-foreground leading-relaxed"
              dangerouslySetInnerHTML={{
                __html: processInlineMarkup(block.verdict),
              }}
            />
          </div>
        </div>
      )
    case "link-button":
      return (
        <div key={index} className="flex">
          <Link
            href={block.href}
            className="inline-flex items-center gap-2 rounded-full bg-primary text-white px-6 py-3 text-sm font-medium hover:bg-primary/90 transition-colors shadow-sm"
          >
            {block.text}
            <ExternalLink className="h-3.5 w-3.5" />
          </Link>
        </div>
      )
    case "quote":
      return (
        <div
          key={index}
          className="rounded-xl bg-muted/40 border px-6 py-6 sm:px-8"
        >
          <Quote className="h-6 w-6 text-primary/40 mb-3" />
          <blockquote
            className="text-base italic leading-[1.8] text-foreground/80 mb-4"
            dangerouslySetInnerHTML={{
              __html: processInlineMarkup(block.text),
            }}
          />
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">
              {block.author.split(" ").map((n) => n[0]).join("")}
            </div>
            <div>
              <p className="text-sm font-semibold">{block.author}</p>
              {block.role && (
                <p className="text-xs text-muted-foreground">{block.role}</p>
              )}
            </div>
          </div>
        </div>
      )
    case "key-stat":
      return (
        <div key={index} className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {block.stats.map((stat, i) => (
            <div
              key={i}
              className="rounded-xl border bg-gradient-to-b from-primary/[0.04] to-transparent p-5 text-center"
            >
              <p className="text-2xl sm:text-3xl font-bold text-primary mb-1">
                {stat.value}
              </p>
              <p className="text-xs text-muted-foreground leading-snug">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      )
    case "image":
      return (
        <figure key={index} className="rounded-xl overflow-hidden border shadow-sm">
          <div className="bg-muted/30 flex items-center gap-1.5 px-4 py-2.5 border-b">
            <div className="w-3 h-3 rounded-full bg-red-400/60" />
            <div className="w-3 h-3 rounded-full bg-yellow-400/60" />
            <div className="w-3 h-3 rounded-full bg-green-400/60" />
            <span className="text-xs text-muted-foreground ml-2 truncate">{block.alt}</span>
          </div>
          <img
            src={block.src}
            alt={block.alt}
            className="w-full"
            loading="lazy"
          />
          {block.caption && (
            <figcaption className="text-xs text-muted-foreground text-center py-3 px-4 bg-muted/20">
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

  const hasBanner = fs.existsSync(
    path.join(process.cwd(), "public", "images", "guides", `${guide.slug}.webp`)
  )

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

      {/* Hero — gradient background like Supademo */}
      <section className="relative pt-28 pb-12 sm:pt-36 sm:pb-16 overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-primary/[0.06] via-primary/[0.03] to-transparent" />
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-primary/5 rounded-full blur-3xl" />
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

          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* Left — title + meta */}
            <div>
              <Badge variant="secondary" className="mb-4">
                {guide.category}
              </Badge>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight leading-[1.1] mb-6">
                {guide.h1}
              </h1>
              <div className="flex items-center gap-3 text-sm text-muted-foreground mb-6">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-primary text-xs font-bold">
                  {guide.author.split(" ").map((n) => n[0]).join("")}
                </div>
                <span className="font-medium text-foreground">{guide.author}</span>
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

            {/* Right — featured banner image */}
            {hasBanner ? (
              <div className="rounded-2xl overflow-hidden hidden lg:block min-h-[280px] relative border border-primary/10">
                <Image
                  src={`/images/guides/${guide.slug}.webp`}
                  alt={guide.imageTitle}
                  width={560}
                  height={315}
                  className="w-full h-full object-cover"
                  priority
                />
              </div>
            ) : (
              <div className="rounded-2xl bg-gradient-to-br from-primary/20 via-primary/10 to-primary/5 border border-primary/10 p-8 sm:p-10 hidden lg:flex flex-col items-center justify-center min-h-[280px] relative overflow-hidden">
                <div className="absolute top-3 right-3 w-20 h-20 border border-primary/10 rounded-xl rotate-12 opacity-40" />
                <div className="absolute bottom-3 left-3 w-16 h-16 border border-primary/10 rounded-lg -rotate-6 opacity-30" />
                <Badge className="mb-4 bg-white/80 dark:bg-white/10 text-primary border-0 shadow-sm">
                  {guide.category}
                </Badge>
                <p className="text-2xl font-bold text-center mb-6">{guide.imageTitle}</p>
                <div className="w-full max-w-[280px] rounded-lg border bg-white dark:bg-card shadow-lg overflow-hidden">
                  <div className="flex items-center gap-1.5 px-3 py-2 bg-muted/50 border-b">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-400/60" />
                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-400/60" />
                    <div className="w-2.5 h-2.5 rounded-full bg-green-400/60" />
                    <span className="text-[10px] text-muted-foreground ml-2">parsli.co</span>
                  </div>
                  <div className="p-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <FileText className="h-3.5 w-3.5 text-primary" />
                      <div className="h-2 w-20 bg-primary/20 rounded" />
                    </div>
                    <div className="space-y-1.5">
                      <div className="h-1.5 w-full bg-muted rounded" />
                      <div className="h-1.5 w-4/5 bg-muted rounded" />
                      <div className="h-1.5 w-3/5 bg-muted rounded" />
                    </div>
                    <div className="flex gap-1.5 pt-1">
                      <div className="h-5 w-16 bg-primary/20 rounded text-[8px] text-primary flex items-center justify-center font-medium">Extract</div>
                      <div className="h-5 w-16 bg-muted rounded text-[8px] text-muted-foreground flex items-center justify-center">Export</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
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
              <div className="mb-10">
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
                            __html: processInlineMarkup(item),
                          }}
                        />
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Content blocks */}
              <div className="space-y-6">
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
                <h2 className="text-xl font-bold mb-6">Related Resources</h2>
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
                        <Badge variant="secondary" className="mb-2 text-xs">Solution</Badge>
                        <h3 className="font-semibold text-sm mb-1 group-hover:text-primary transition-colors">{sol.h1}</h3>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          Learn more <ArrowRight className="h-3 w-3" />
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
                        <Badge variant="secondary" className="mb-2 text-xs">Compare</Badge>
                        <h3 className="font-semibold text-sm mb-1 group-hover:text-primary transition-colors">
                          Parsli vs {alt.competitor}
                        </h3>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          Compare <ArrowRight className="h-3 w-3" />
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
                        <Badge variant="secondary" className="mb-2 text-xs">Blog</Badge>
                        <h3 className="font-semibold text-sm mb-1 group-hover:text-primary transition-colors">{post.title}</h3>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          Read more <ArrowRight className="h-3 w-3" />
                        </span>
                      </Link>
                    )
                  })}
                </div>
                <div className="mt-6 flex flex-wrap gap-3">
                  <Link href="/guides" className="inline-flex items-center gap-1.5 rounded-lg border bg-card px-4 py-2 text-sm hover:border-primary/30 transition-colors">
                    All Guides <ArrowRight className="h-3 w-3 text-muted-foreground" />
                  </Link>
                  <Link href="/compare" className="inline-flex items-center gap-1.5 rounded-lg border bg-card px-4 py-2 text-sm hover:border-primary/30 transition-colors">
                    Compare Alternatives <ArrowRight className="h-3 w-3 text-muted-foreground" />
                  </Link>
                  <Link href="/blog" className="inline-flex items-center gap-1.5 rounded-lg border bg-card px-4 py-2 text-sm hover:border-primary/30 transition-colors">
                    Blog <ArrowRight className="h-3 w-3 text-muted-foreground" />
                  </Link>
                </div>
              </div>

              {/* Related Guides */}
              {relatedGuides.length > 0 && (
                <div className="mt-12 pt-10 border-t">
                  <h2 className="text-xl font-bold mb-6">More Guides</h2>
                  <div className="grid gap-4">
                    {relatedGuides.map((g) => (
                      <Link
                        key={g.slug}
                        href={`/guides/${g.slug}`}
                        className="group rounded-lg border bg-card p-5 hover:border-primary/30 transition-colors"
                      >
                        <Badge variant="secondary" className="mb-2 text-xs">{g.category}</Badge>
                        <h3 className="font-semibold group-hover:text-primary transition-colors mb-1">{g.h1}</h3>
                        <p className="text-sm text-muted-foreground line-clamp-2">{g.metaDescription}</p>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Author Bio */}
              <div className="mt-12 pt-10 border-t">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-primary font-bold">
                    {guide.author.split(" ").map((n) => n[0]).join("")}
                  </div>
                  <div>
                    <p className="font-semibold">{guide.author}</p>
                    <p className="text-sm text-muted-foreground">{guide.authorTitle}</p>
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
                <nav className="space-y-1 border-l-2 border-muted pl-4">
                  {headings
                    .filter((h) => h.level === 2)
                    .map((h2) => (
                      <div key={h2.id}>
                        <a
                          href={`#${h2.id}`}
                          className="block text-sm text-muted-foreground hover:text-primary transition-colors py-1.5 -ml-[18px] pl-[16px] border-l-2 border-transparent hover:border-primary"
                        >
                          {h2.text.length > 35
                            ? h2.text.slice(0, 35) + "..."
                            : h2.text}
                        </a>
                      </div>
                    ))}
                  {guide.faqs.length > 0 && (
                    <a
                      href="#faq"
                      className="block text-sm text-muted-foreground hover:text-primary transition-colors py-1.5 -ml-[18px] pl-[16px] border-l-2 border-transparent hover:border-primary"
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
                        className="flex items-center gap-2 text-sm text-primary hover:underline underline-offset-4 mb-2.5 group"
                      >
                        <Zap className="h-3.5 w-3.5 shrink-0" />
                        <span>{tool.title}</span>
                        <ArrowRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
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
