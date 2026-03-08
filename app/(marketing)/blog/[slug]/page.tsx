import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { AuthButton } from "@/components/marketing/shared/AuthButton"
import { JsonLd } from "@/components/marketing/shared/JsonLd"
import { breadcrumbJsonLd, blogPostJsonLd } from "@/lib/seo/json-ld"
import {
  getBlogPostBySlug,
  getAllBlogSlugs,
  type ContentBlock,
} from "@/lib/seo/blog-posts"
import { getAllSolutions } from "@/lib/seo/solutions"

/* Map blog slugs to related solution slugs */
const blogToSolutions: Record<string, string[]> = {
  "extract-data-pdf-to-excel": [
    "pdf-to-excel",
    "bank-statement-extraction",
    "no-code-document-parser",
  ],
  "best-invoice-ocr-software": [
    "invoice-parsing",
    "no-code-document-parser",
    "document-parsing-api",
  ],
}

function getRelatedSolutions(blogSlug: string) {
  const relatedSlugs = blogToSolutions[blogSlug] ?? []
  const allSolutions = getAllSolutions()
  return allSolutions.filter((s) => relatedSlugs.includes(s.slug))
}

export function generateStaticParams() {
  return getAllBlogSlugs().map((slug) => ({ slug }))
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string }
}): Promise<Metadata> {
  const post = getBlogPostBySlug(params.slug)
  if (!post) return {}

  return {
    title: post.metaTitle,
    description: post.metaDescription,
    alternates: {
      canonical: `https://parsli.co/blog/${post.slug}`,
    },
    openGraph: {
      title: post.metaTitle,
      description: post.metaDescription,
      url: `https://parsli.co/blog/${post.slug}`,
      type: "article",
      publishedTime: post.publishedAt,
      modifiedTime: post.updatedAt,
      authors: [post.author],
    },
  }
}

function renderBlock(block: ContentBlock, index: number) {
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
    case "heading":
      if (block.level === 2) {
        return (
          <h2
            key={index}
            className="text-2xl font-bold tracking-tight mt-10 mb-4"
          >
            {block.text}
          </h2>
        )
      }
      return (
        <h3 key={index} className="text-xl font-semibold mt-8 mb-3">
          {block.text}
        </h3>
      )
    case "list":
      return (
        <ul key={index} className="list-disc pl-6 space-y-2">
          {block.items.map((item, i) => (
            <li
              key={i}
              className="text-base leading-relaxed text-muted-foreground"
            >
              {item}
            </li>
          ))}
        </ul>
      )
    case "callout":
      return (
        <div
          key={index}
          className="rounded-lg border-l-4 border-primary bg-primary/5 px-6 py-4"
        >
          <p className="text-sm leading-relaxed font-medium">{block.text}</p>
        </div>
      )
    case "cta":
      return (
        <div
          key={index}
          className="rounded-xl border bg-muted/30 p-8 text-center mt-10"
        >
          <h2 className="text-2xl font-bold mb-3">
            Ready to Extract Data Automatically?
          </h2>
          <p className="text-muted-foreground mb-6">
            Start free with 30 pages/month. No credit card required.
          </p>
          <AuthButton className="text-base px-8 h-12" showArrow>
            Try Parsli Free
          </AuthButton>
        </div>
      )
    default:
      return null
  }
}

export default function BlogPostPage({
  params,
}: {
  params: { slug: string }
}) {
  const post = getBlogPostBySlug(params.slug)
  if (!post) notFound()

  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", url: "https://parsli.co" },
          { name: "Blog", url: "https://parsli.co/blog" },
          {
            name: post.title,
            url: `https://parsli.co/blog/${post.slug}`,
          },
        ])}
      />
      <JsonLd
        data={blogPostJsonLd({
          title: post.title,
          description: post.metaDescription,
          url: `https://parsli.co/blog/${post.slug}`,
          publishedAt: post.publishedAt,
          updatedAt: post.updatedAt,
          author: post.author,
        })}
      />

      {/* Article */}
      <article className="relative pt-28 pb-20 sm:pt-36">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          {/* Back link */}
          <Link
            href="/blog"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to blog
          </Link>

          {/* Header */}
          <header className="mb-10">
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight leading-[1.15] mb-4">
              {post.title}
            </h1>
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <span>{post.author}</span>
              <span aria-hidden="true">&middot;</span>
              <time dateTime={post.publishedAt}>
                {new Date(post.publishedAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </time>
              <span aria-hidden="true">&middot;</span>
              <span>{post.readTime}</span>
            </div>
          </header>

          {/* Content */}
          <div className="space-y-5">
            {post.content.map((block, index) => renderBlock(block, index))}
          </div>

          {/* Related Solutions */}
          {getRelatedSolutions(post.slug).length > 0 && (
            <div className="mt-16 pt-10 border-t">
              <h2 className="text-xl font-bold mb-6">Related Solutions</h2>
              <div className="grid gap-4">
                {getRelatedSolutions(post.slug).map((solution) => (
                  <Link
                    key={solution.slug}
                    href={`/solutions/${solution.slug}`}
                    className="group rounded-lg border bg-card p-5 hover:border-primary/30 transition-colors"
                  >
                    <h3 className="font-semibold group-hover:text-primary transition-colors mb-1">
                      {solution.h1}
                    </h3>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {solution.subtitle}
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </article>
    </>
  )
}
