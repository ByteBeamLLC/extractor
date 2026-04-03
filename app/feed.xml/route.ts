import { Feed } from "feed"
import { getAllBlogPosts } from "@/lib/seo/blog-posts"
import { getAllGuides } from "@/lib/seo/guides"
import { alternatives } from "@/lib/seo/alternatives"
import { getAllSolutions } from "@/lib/seo/solutions"
import { integrations } from "@/lib/seo/integrations"
import { useCases } from "@/lib/seo/use-cases"
import { industries } from "@/lib/seo/industries"
import { documentTypes } from "@/lib/seo/document-types"

const BASE_URL = "https://parsli.co"
const HUB_URL = "https://pubsubhubbub.appspot.com/"

export async function GET() {
  const feed = new Feed({
    title: "Parsli",
    description:
      "AI-powered document data extraction — tools, guides, comparisons, integrations, and product updates.",
    id: BASE_URL,
    link: BASE_URL,
    language: "en",
    image: `${BASE_URL}/og-image.png`,
    favicon: `${BASE_URL}/parsli-icon.png`,
    copyright: `Copyright ${new Date().getFullYear()} Parsli`,
    updated: new Date(),
    feedLinks: {
      rss2: `${BASE_URL}/feed.xml`,
    },
    hub: HUB_URL,
    author: {
      name: "Talal Bazerbachi",
      link: BASE_URL,
    },
  })

  // ── Blog posts ──
  for (const post of getAllBlogPosts()) {
    feed.addItem({
      title: post.title,
      id: `${BASE_URL}/blog/${post.slug}`,
      link: `${BASE_URL}/blog/${post.slug}`,
      description: post.excerpt,
      date: new Date(post.updatedAt),
      published: new Date(post.publishedAt),
      author: [{ name: post.author }],
      category: [{ name: post.category }],
    })
  }

  // ── Guides ──
  for (const guide of getAllGuides()) {
    feed.addItem({
      title: guide.title,
      id: `${BASE_URL}/guides/${guide.slug}`,
      link: `${BASE_URL}/guides/${guide.slug}`,
      description: guide.metaDescription,
      date: new Date(guide.updatedAt),
      published: new Date(guide.publishedAt),
      author: [{ name: guide.author }],
      category: [{ name: guide.category }],
    })
  }

  // ── Comparison pages ──
  for (const alt of alternatives) {
    feed.addItem({
      title: alt.h1,
      id: `${BASE_URL}/compare/${alt.slug}`,
      link: `${BASE_URL}/compare/${alt.slug}`,
      description: alt.metaDescription,
      date: new Date(alt.updatedAt),
      published: new Date(alt.publishedAt),
    })
  }

  // ── Solution pages ──
  for (const sol of getAllSolutions()) {
    feed.addItem({
      title: sol.h1,
      id: `${BASE_URL}/solutions/${sol.slug}`,
      link: `${BASE_URL}/solutions/${sol.slug}`,
      description: sol.metaDescription,
      date: new Date("2026-04-03"),
      category: [{ name: "Solutions" }],
    })
  }

  // ── Integration pages ──
  for (const int of integrations) {
    feed.addItem({
      title: `${int.name} Integration`,
      id: `${BASE_URL}/integrations/${int.slug}`,
      link: `${BASE_URL}/integrations/${int.slug}`,
      description: int.metaDescription,
      date: new Date("2026-04-03"),
      category: [{ name: "Integrations" }],
    })
  }

  // ── Use case pages ──
  for (const uc of useCases) {
    feed.addItem({
      title: uc.title,
      id: `${BASE_URL}/use-cases/${uc.slug}`,
      link: `${BASE_URL}/use-cases/${uc.slug}`,
      description: uc.metaDescription,
      date: new Date("2026-03-19"),
      category: [{ name: "Use Cases" }],
    })
  }

  // ── Industry pages ──
  for (const ind of industries) {
    feed.addItem({
      title: `${ind.name} — Document Automation`,
      id: `${BASE_URL}/industries/${ind.slug}`,
      link: `${BASE_URL}/industries/${ind.slug}`,
      description: ind.metaDescription,
      date: new Date("2026-03-19"),
      category: [{ name: "Industries" }],
    })
  }

  // ── Document type pages ──
  for (const dt of documentTypes) {
    feed.addItem({
      title: `Extract Data from ${dt.name}`,
      id: `${BASE_URL}/document-types/${dt.slug}`,
      link: `${BASE_URL}/document-types/${dt.slug}`,
      description: dt.metaDescription,
      date: new Date("2026-03-19"),
      category: [{ name: "Document Types" }],
    })
  }

  // ── Tool pages (static list — no data file) ──
  const toolPages = [
    { slug: "pdf-to-excel", title: "PDF to Excel Converter", desc: "Convert PDF tables to Excel spreadsheets. Free, instant, browser-based." },
    { slug: "pdf-merger", title: "PDF Merger", desc: "Combine multiple PDF files into one document. Free, no upload to servers." },
    { slug: "pdf-splitter", title: "PDF Splitter", desc: "Split PDFs into individual pages or page ranges. Free browser tool." },
    { slug: "pdf-compressor", title: "PDF Compressor", desc: "Reduce PDF file size while maintaining quality. Free compression tool." },
    { slug: "pdf-page-remover", title: "PDF Page Remover", desc: "Delete specific pages from PDF documents. Free, browser-based." },
    { slug: "pdf-rotate", title: "PDF Page Rotator", desc: "Rotate PDF pages 90, 180, or 270 degrees. Free tool." },
    { slug: "image-to-pdf", title: "Image to PDF Converter", desc: "Convert images to PDF documents. Supports JPG, PNG, and more." },
    { slug: "image-to-text", title: "Image to Text (OCR)", desc: "Extract text from images using OCR. Free, supports 12 languages." },
    { slug: "pdf-to-text", title: "PDF to Text Extractor", desc: "Extract all text content from PDF files instantly." },
    { slug: "handwriting-to-text", title: "Handwriting to Text", desc: "Convert handwritten notes to digital text with AI." },
    { slug: "screenshot-to-text", title: "Screenshot to Text", desc: "Extract text from screenshots instantly." },
    { slug: "photo-to-text", title: "Photo to Text", desc: "Convert photos of documents to editable text." },
    { slug: "excel-to-json", title: "Excel to JSON", desc: "Convert Excel spreadsheets to structured JSON format." },
    { slug: "json-to-excel", title: "JSON to Excel", desc: "Convert JSON data to downloadable Excel files." },
    { slug: "excel-to-csv", title: "Excel to CSV", desc: "Convert Excel files to CSV format." },
    { slug: "csv-to-excel", title: "CSV to Excel", desc: "Convert CSV files to formatted Excel spreadsheets." },
    { slug: "invoice-parser", title: "Invoice Parser", desc: "Extract data from invoices automatically. Free AI-powered tool." },
    { slug: "bol-parser", title: "BOL Parser", desc: "Extract data from bills of lading automatically." },
    { slug: "receipt-scanner", title: "Receipt Scanner", desc: "Scan and extract data from receipts. Free tool." },
    { slug: "bank-statement-parser", title: "Bank Statement Parser", desc: "Extract transactions from bank statements automatically." },
    { slug: "bank-statement-to-excel", title: "Bank Statement to Excel", desc: "Convert bank statements to Excel spreadsheets." },
    { slug: "bank-statement-to-csv", title: "Bank Statement to CSV", desc: "Convert bank statements to CSV format." },
    { slug: "resume-parser", title: "Resume Parser", desc: "Extract structured data from resumes and CVs." },
    { slug: "pdf-table-extractor", title: "PDF Table Extractor", desc: "Extract tables from PDF documents with structure preserved." },
    { slug: "ai-summarizer", title: "AI Document Summarizer", desc: "Summarize documents with AI. Free tool." },
    // New tools (2026-04-02)
    { slug: "ocr", title: "Free Online OCR", desc: "Extract text from images with optical character recognition. Free, 12 languages.", date: "2026-04-02" },
    { slug: "scan-to-text", title: "Scan to Text", desc: "Convert scanned documents to editable text. Free OCR tool.", date: "2026-04-02" },
    { slug: "pdf-to-google-sheets", title: "PDF to Google Sheets", desc: "Convert PDF tables to Google Sheets format. Free converter.", date: "2026-04-02" },
    { slug: "pdf-to-json", title: "PDF to JSON", desc: "Convert PDF documents to structured JSON data. Free tool for developers.", date: "2026-04-02" },
    { slug: "pdf-to-xml", title: "PDF to XML", desc: "Convert PDF documents to structured XML format. Free converter.", date: "2026-04-02" },
    { slug: "make-pdf-searchable", title: "Make PDF Searchable", desc: "Run OCR on scanned PDFs to extract searchable text. Free tool.", date: "2026-04-02" },
  ]
  for (const tool of toolPages) {
    feed.addItem({
      title: tool.title,
      id: `${BASE_URL}/tools/${tool.slug}`,
      link: `${BASE_URL}/tools/${tool.slug}`,
      description: tool.desc,
      date: new Date((tool as { date?: string }).date || "2026-03-19"),
      category: [{ name: "Free Tools" }],
    })
  }

  // ── Static pages added recently ──
  const staticPages = [
    { path: "/features", title: "Features — AI Document Data Extraction", desc: "Explore Parsli's features: AI extraction, custom schemas, integrations, and REST API.", date: "2026-04-03" },
    { path: "/email-parser", title: "AI Email Parser", desc: "AI-powered email parser that extracts structured data from emails and attachments automatically.", date: "2026-04-03" },
    { path: "/pdf-parser", title: "AI PDF Parser", desc: "AI-powered PDF parser that extracts tables, text, and structured data from any PDF.", date: "2026-04-03" },
    { path: "/ocr-software", title: "OCR Software — AI-Powered Text Recognition", desc: "AI OCR software that goes beyond text recognition. Extract structured data from scanned documents.", date: "2026-04-03" },
    { path: "/email-to-spreadsheet", title: "Email to Spreadsheet Automation", desc: "Automatically extract data from emails into Google Sheets or Excel.", date: "2026-04-03" },
    { path: "/data-entry-automation", title: "Data Entry Automation Software", desc: "Cut data entry costs by 80% with AI-powered document extraction.", date: "2026-04-03" },
    { path: "/zapier-alternative", title: "Zapier Email Parser Alternative", desc: "AI email parser that's more accurate than Zapier's built-in parser. Handles attachments.", date: "2026-04-03" },
    { path: "/solutions/handwriting-to-text", title: "AI Handwriting to Text Solution", desc: "Convert cursive, messy handwriting, and old documents to structured text with 95%+ accuracy.", date: "2026-04-02" },
    { path: "/pricing", title: "Pricing — Parsli", desc: "Simple, transparent pricing. Free plan with 30 pages/month. Paid plans from $20/month.", date: "2026-03-19" },
    { path: "/docs", title: "Documentation — Parsli", desc: "API documentation, getting started guides, and integration setup for Parsli.", date: "2026-03-19" },
  ]
  for (const page of staticPages) {
    feed.addItem({
      title: page.title,
      id: `${BASE_URL}${page.path}`,
      link: `${BASE_URL}${page.path}`,
      description: page.desc,
      date: new Date(page.date),
      category: [{ name: "Product" }],
    })
  }

  // Sort by most recent first
  feed.items.sort((a, b) => b.date.getTime() - a.date.getTime())

  return new Response(feed.rss2(), {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "s-maxage=3600, stale-while-revalidate",
    },
  })
}
