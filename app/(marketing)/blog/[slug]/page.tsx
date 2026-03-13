import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, ArrowRight, ChevronRight, Check } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { AuthButton } from "@/components/marketing/shared/AuthButton"
import { JsonLd } from "@/components/marketing/shared/JsonLd"
import { breadcrumbJsonLd, blogPostJsonLd, faqJsonLd } from "@/lib/seo/json-ld"
import {
  getBlogPostBySlug,
  getAllBlogSlugs,
  getAllBlogPosts,
  type ContentBlock,
} from "@/lib/seo/blog-posts"
import { getAllSolutions } from "@/lib/seo/solutions"
import { getAlternativeBySlug } from "@/lib/seo/alternatives"

/* Map blog slugs to related solution slugs */
const blogToSolutions: Record<string, string[]> = {
  // Existing posts
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
  // New posts
  "what-is-document-parsing": [
    "no-code-document-parser",
    "document-parsing-api",
    "invoice-parsing",
  ],
  "automate-data-entry": [
    "no-code-document-parser",
    "invoice-parsing",
    "document-parsing-api",
  ],
  "nanonets-alternatives": [
    "no-code-document-parser",
    "invoice-parsing",
    "document-parsing-api",
  ],
  "best-pdf-parser-tools": [
    "document-parsing-api",
    "no-code-document-parser",
    "pdf-to-excel",
  ],
  "parseur-alternatives": [
    "no-code-document-parser",
    "invoice-parsing",
    "document-parsing-api",
  ],
  "best-email-parser-tools": [
    "no-code-document-parser",
    "invoice-parsing",
    "document-parsing-api",
  ],
  "extract-data-from-pdf-automatically": [
    "no-code-document-parser",
    "pdf-to-excel",
    "document-parsing-api",
  ],
  "automate-invoice-data-extraction": [
    "invoice-parsing",
    "no-code-document-parser",
    "document-parsing-api",
  ],
  "mailparser-alternatives": [
    "no-code-document-parser",
    "invoice-parsing",
    "document-parsing-api",
  ],
  "extract-bank-statement-data-pdf": [
    "bank-statement-extraction",
    "pdf-to-excel",
    "no-code-document-parser",
  ],
  "parse-emails-to-google-sheets": [
    "no-code-document-parser",
    "invoice-parsing",
    "document-parsing-api",
  ],
  "email-attachments-to-spreadsheet": [
    "no-code-document-parser",
    "invoice-parsing",
    "document-parsing-api",
  ],
  "document-parsing-api": [
    "document-parsing-api",
    "no-code-document-parser",
    "invoice-parsing",
  ],
  "agentic-document-extraction": [
    "no-code-document-parser",
    "document-parsing-api",
    "invoice-parsing",
  ],
}

/* Map blog slugs to related free tools */
const blogToTools: Record<string, { href: string; title: string; description: string }[]> = {
  "extract-data-pdf-to-excel": [
    { href: "/tools/pdf-to-excel", title: "Free PDF to Excel Converter", description: "Convert PDF tables to Excel instantly in your browser. No sign-up, no uploads." },
  ],
  "best-invoice-ocr-software": [
    { href: "/tools/invoice-parser", title: "Free Invoice Parser", description: "Extract vendor info, line items, and totals from invoices in your browser." },
    { href: "/tools/receipt-scanner", title: "Free Receipt Scanner", description: "Scan receipts and extract transaction details instantly." },
  ],
  "what-is-document-parsing": [
    { href: "/tools/pdf-to-text", title: "Free PDF to Text Extractor", description: "Extract text from PDF files instantly. No sign-up required." },
    { href: "/tools/ai-summarizer", title: "Free AI Document Summarizer", description: "Summarize key information from any document instantly." },
  ],
  "automate-data-entry": [
    { href: "/tools/invoice-parser", title: "Free Invoice Parser", description: "Extract invoice data automatically in your browser." },
    { href: "/tools/bank-statement-parser", title: "Free Bank Statement Parser", description: "Extract transactions from bank statements automatically." },
  ],
  "nanonets-alternatives": [
    { href: "/tools/invoice-parser", title: "Free Invoice Parser", description: "Try Parsli's free invoice parser — no sign-up required." },
    { href: "/tools/pdf-to-excel", title: "Free PDF to Excel Converter", description: "Convert PDF tables to Excel instantly in your browser." },
  ],
  "best-pdf-parser-tools": [
    { href: "/tools/pdf-to-excel", title: "Free PDF to Excel Converter", description: "Convert PDF tables to Excel — runs entirely in your browser." },
    { href: "/tools/pdf-to-text", title: "Free PDF to Text Extractor", description: "Extract all text content from PDF files instantly." },
    { href: "/tools/pdf-table-extractor", title: "Free PDF Table Extractor", description: "Extract tables from PDF documents into structured data." },
  ],
  "parseur-alternatives": [
    { href: "/tools/invoice-parser", title: "Free Invoice Parser", description: "Try Parsli's free invoice parser — no sign-up required." },
    { href: "/tools/pdf-to-excel", title: "Free PDF to Excel Converter", description: "Convert PDF tables to Excel instantly." },
  ],
  "best-email-parser-tools": [
    { href: "/tools/pdf-to-text", title: "Free PDF to Text Extractor", description: "Extract text from PDF attachments instantly." },
    { href: "/tools/ai-summarizer", title: "Free AI Document Summarizer", description: "Summarize key info from email attachments." },
  ],
  "extract-data-from-pdf-automatically": [
    { href: "/tools/pdf-to-excel", title: "Free PDF to Excel Converter", description: "Convert PDF tables to Excel instantly in your browser." },
    { href: "/tools/pdf-to-text", title: "Free PDF to Text Extractor", description: "Extract all text from PDF files. No sign-up required." },
    { href: "/tools/pdf-table-extractor", title: "Free PDF Table Extractor", description: "Extract tables from PDFs into structured data." },
  ],
  "automate-invoice-data-extraction": [
    { href: "/tools/invoice-parser", title: "Free Invoice Parser", description: "Extract data from invoices automatically in your browser." },
    { href: "/tools/receipt-scanner", title: "Free Receipt Scanner", description: "Scan receipts and extract transaction details." },
  ],
  "mailparser-alternatives": [
    { href: "/tools/pdf-to-text", title: "Free PDF to Text Extractor", description: "Extract text from PDF email attachments." },
    { href: "/tools/invoice-parser", title: "Free Invoice Parser", description: "Parse invoice data from email attachments." },
  ],
  "extract-bank-statement-data-pdf": [
    { href: "/tools/bank-statement-parser", title: "Free Bank Statement Parser", description: "Extract transactions, balances, and account details from bank statements." },
    { href: "/tools/pdf-to-excel", title: "Free PDF to Excel Converter", description: "Convert bank statement PDFs to Excel." },
  ],
  "parse-emails-to-google-sheets": [
    { href: "/tools/pdf-to-excel", title: "Free PDF to Excel Converter", description: "Convert PDF attachments to spreadsheets instantly." },
    { href: "/tools/excel-to-json", title: "Free Excel to JSON Converter", description: "Convert spreadsheet data to JSON format." },
  ],
  "email-attachments-to-spreadsheet": [
    { href: "/tools/pdf-to-excel", title: "Free PDF to Excel Converter", description: "Convert PDF attachments to Excel spreadsheets." },
    { href: "/tools/invoice-parser", title: "Free Invoice Parser", description: "Extract structured data from invoice attachments." },
  ],
  "document-parsing-api": [
    { href: "/tools/pdf-to-excel", title: "Free PDF to Excel Converter", description: "Try our free browser-based converter before using the API." },
    { href: "/tools/invoice-parser", title: "Free Invoice Parser", description: "Test document parsing free before integrating the API." },
  ],
  "agentic-document-extraction": [
    { href: "/tools/ai-summarizer", title: "Free AI Document Summarizer", description: "See AI document analysis in action — free in your browser." },
    { href: "/tools/invoice-parser", title: "Free Invoice Parser", description: "Try AI-powered extraction on invoices instantly." },
  ],
}

/* Map blog slugs to related comparison pages */
const blogToCompare: Record<string, string[]> = {
  "parseur-alternatives": ["parseur", "docparser", "parsio", "docsumo"],
  "nanonets-alternatives": ["nanonets", "parseur", "docparser", "docsumo"],
  "mailparser-alternatives": ["mailparser", "parseur", "parsio", "docparser"],
  "best-invoice-ocr-software": ["nanonets", "docparser", "rossum", "docsumo"],
  "best-pdf-parser-tools": ["docparser", "parseur", "nanonets", "textract"],
  "best-email-parser-tools": ["parseur", "mailparser", "parsio"],
  "extract-data-pdf-to-excel": ["docparser", "parseur", "textract"],
  "what-is-document-parsing": ["nanonets", "docsumo", "textract"],
  "automate-data-entry": ["parseur", "nanonets", "docsumo"],
  "extract-data-from-pdf-automatically": ["textract", "google-document-ai", "docparser"],
  "automate-invoice-data-extraction": ["nanonets", "docsumo", "rossum"],
  "extract-bank-statement-data-pdf": ["docparser", "parseur", "nanonets"],
  "parse-emails-to-google-sheets": ["parseur", "mailparser", "parsio"],
  "email-attachments-to-spreadsheet": ["mailparser", "parseur", "parsio"],
  "document-parsing-api": ["textract", "google-document-ai", "azure-document-intelligence"],
  "agentic-document-extraction": ["nanonets", "docsumo", "google-document-ai"],
}

function getRelatedComparisons(blogSlug: string) {
  const slugs = blogToCompare[blogSlug] ?? []
  return slugs
    .map((s) => {
      const alt = getAlternativeBySlug(s)
      if (!alt) return null
      return { slug: alt.slug, competitor: alt.competitor, attackAngle: alt.attackAngle }
    })
    .filter(Boolean) as { slug: string; competitor: string; attackAngle: string }[]
}

function extractFaqItems(content: ContentBlock[]) {
  const faqIdx = content.findIndex(
    (b) => b.type === "heading" && b.level === 2 && b.text === "Frequently Asked Questions"
  )
  if (faqIdx === -1) return []
  const items: { question: string; answer: string }[] = []
  let i = faqIdx + 1
  while (i < content.length) {
    const block = content[i]
    if (block.type === "heading" && block.level === 3) {
      const next = content[i + 1]
      if (next?.type === "paragraph") {
        items.push({ question: block.text, answer: next.text })
        i += 2
        continue
      }
    }
    if (block.type === "cta") break
    i++
  }
  return items
}

function getRelatedSolutions(blogSlug: string) {
  const relatedSlugs = blogToSolutions[blogSlug] ?? []
  const allSolutions = getAllSolutions()
  return allSolutions.filter((s) => relatedSlugs.includes(s.slug))
}

function getRelatedPosts(currentSlug: string, relatedSlugs: string[]) {
  const allPosts = getAllBlogPosts()
  return allPosts.filter(
    (p) => p.slug !== currentSlug && relatedSlugs.includes(p.slug)
  )
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
      images: [
        {
          url: "https://parsli.co/parsli-og.png",
          width: 1200,
          height: 630,
          alt: post.metaTitle,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: post.metaTitle,
      description: post.metaDescription,
      images: ["https://parsli.co/parsli-og.png"],
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
            {block.headline ?? "Stop copying data out of documents manually."}
          </h2>
          <p className="text-muted-foreground mb-6">
            Parsli extracts structured data from PDFs, invoices, and emails —
            automatically. Free forever up to 30 pages/month.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <AuthButton href="/login" className="text-base px-8 h-12" showArrow>
              Try it for free
            </AuthButton>
            <Button variant="outline" size="lg" className="text-base px-8 h-12" asChild>
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

  const relatedPosts = getRelatedPosts(post.slug, post.relatedSlugs)

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
      {extractFaqItems(post.content).length > 0 && (
        <JsonLd data={faqJsonLd(extractFaqItems(post.content))} />
      )}

      {/* Article */}
      <article className="relative pt-28 pb-20 sm:pt-36">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
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
              href="/blog"
              className="hover:text-foreground transition-colors"
            >
              Blog
            </Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="text-foreground truncate max-w-[200px] sm:max-w-none">
              {post.title}
            </span>
          </nav>

          {/* Header */}
          <header className="mb-10">
            <Badge variant="secondary" className="mb-4">
              {post.category}
            </Badge>
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

          {/* Key Takeaways */}
          {post.keyTakeaways.length > 0 && (
            <div className="rounded-xl border bg-primary/[0.03] border-primary/20 p-6 mb-10">
              <h2 className="font-semibold text-sm uppercase tracking-wider text-primary mb-4">
                Key Takeaways
              </h2>
              <ul className="space-y-3">
                {post.keyTakeaways.map((takeaway, i) => (
                  <li key={i} className="flex gap-3">
                    <Check className="h-4 w-4 text-primary shrink-0 mt-1" />
                    <span className="text-sm leading-relaxed">
                      {takeaway}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Content */}
          <div className="space-y-5">
            {post.content.map((block, index) => renderBlock(block, index))}
          </div>

          {/* Free Tool callouts for relevant blog posts */}
          {blogToTools[post.slug] && (
            <div className="mt-12 space-y-4">
              <h2 className="text-lg font-semibold">Try our free tools</h2>
              {blogToTools[post.slug].map((tool) => (
                <div key={tool.href} className="rounded-xl border border-primary/20 bg-primary/[0.03] p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <span className="text-primary text-lg">&#9889;</span>
                    </div>
                    <div>
                      <p className="font-semibold mb-1">{tool.title}</p>
                      <p className="text-sm text-muted-foreground mb-3">
                        {tool.description}
                      </p>
                      <Link
                        href={tool.href}
                        className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline underline-offset-4"
                      >
                        Try it free
                        <ArrowRight className="h-3 w-3" />
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

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

          {/* Related Comparisons */}
          {getRelatedComparisons(post.slug).length > 0 && (
            <div className="mt-12 pt-10 border-t">
              <h2 className="text-xl font-bold mb-6">Compare Parsli</h2>
              <div className="flex flex-wrap gap-3">
                {getRelatedComparisons(post.slug).map((comp) => (
                  <Link
                    key={comp.slug}
                    href={`/compare/${comp.slug}`}
                    className="inline-flex items-center gap-1.5 rounded-lg border bg-card px-4 py-2 text-sm hover:border-primary/30 transition-colors"
                  >
                    Parsli vs {comp.competitor}
                    <ArrowRight className="h-3 w-3 text-muted-foreground" />
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Related Posts */}
          {relatedPosts.length > 0 && (
            <div className="mt-12 pt-10 border-t">
              <h2 className="text-xl font-bold mb-6">Related Articles</h2>
              <div className="grid gap-4">
                {relatedPosts.map((related) => (
                  <Link
                    key={related.slug}
                    href={`/blog/${related.slug}`}
                    className="group rounded-lg border bg-card p-5 hover:border-primary/30 transition-colors"
                  >
                    <Badge variant="secondary" className="mb-2 text-xs">
                      {related.category}
                    </Badge>
                    <h3 className="font-semibold group-hover:text-primary transition-colors mb-1">
                      {related.title}
                    </h3>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {related.excerpt}
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
                {post.author
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </div>
              <div>
                <p className="font-semibold">{post.author}</p>
                <p className="text-sm text-muted-foreground">
                  {post.authorTitle}
                </p>
              </div>
            </div>
          </div>
        </div>
      </article>
    </>
  )
}
