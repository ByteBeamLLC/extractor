/**
 * Converts Guide-category blog posts into GuideData entries
 * so they render under /guides with the richer template (TL;DR, ToC, steps, etc.)
 */
import type { BlogPost, ContentBlock } from "./blog-posts"
import { blogPosts } from "./blog-posts"
import type { GuideData, GuideContentBlock, GuideCategory } from "./guides"
import { bankStatementBlogPosts } from "./blog-posts-bank-statements"
import { financialBlogPosts } from "./blog-posts-financial"
import { nicheBlogPosts } from "./blog-posts-niche"
import { contentBlogPosts } from "./blog-posts-from-markdown"
import { guideSlugs } from "./guide-slug-list"

/* ── slug → GuideCategory mapping ── */
const categoryMap: Record<string, GuideCategory> = {
  // Bank statements
  "what-is-a-bank-statement": "Document Extraction",
  "how-to-read-bank-statement": "Document Extraction",
  "verify-bank-statements": "Document Extraction",
  "fake-bank-statements-detection": "Document Extraction",
  "bank-statement-reconciliation": "Document Extraction",
  // Financial / accounting
  "financial-document-automation": "Workflow Automation",
  "accounts-payable-automation": "Workflow Automation",
  "ocr-invoice-processing": "Document Extraction",
  "ai-invoice-processing": "Document Extraction",
  "detect-fraudulent-documents": "Document Extraction",
  "accounting-ocr": "Document Extraction",
  "receipt-ocr-guide": "Document Extraction",
  "paperless-invoice-processing": "Workflow Automation",
  "ocr-data-capture": "Document Extraction",
  // Niche
  "bank-statement-analysis-divorce": "Document Extraction",
  "utility-bill-data-extraction": "Document Extraction",
  "tax-resolution-bank-statement-analysis": "Document Extraction",
  "ocr-vs-idp": "Document Extraction",
  "ocr-underwriting": "Document Extraction",
  "bookkeeping-clean-up-guide": "Workflow Automation",
  // Content blog posts promoted to guides
  "extract-invoice-data-to-excel": "Data Conversion",
  "extract-table-data-from-pdfs": "Data Conversion",
  // Original blog posts promoted to guides
  "extract-data-pdf-to-excel": "Data Conversion",
  "what-is-document-parsing": "Document Extraction",
  "automate-data-entry": "Workflow Automation",
  "extract-data-from-pdf-automatically": "Document Extraction",
  "automate-invoice-data-extraction": "Workflow Automation",
  "extract-bank-statement-data-pdf": "Document Extraction",
  "agentic-document-extraction": "Document Extraction",
  "freight-invoice-processing-automation": "Workflow Automation",
  "true-cost-manual-data-entry-2026": "Workflow Automation",
  "what-is-intelligent-document-processing": "Document Extraction",
  "contract-data-extraction-small-business": "Document Extraction",
  "kyc-document-extraction-automation": "Workflow Automation",
  "receipt-extraction-accountants-bulk-processing": "Document Extraction",
  "brokerage-statement-extraction-financial-advisors": "Document Extraction",
  "extract-k1-data-from-pdf": "Document Extraction",
  "credit-card-statement-parsing-expense-reporting": "Document Extraction",
  "bank-statement-to-excel-automation-guide": "Data Conversion",
  "aml-document-processing-small-financial-firms": "Workflow Automation",
}

/* ── slug → relatedTools ── */
const toolsMap: Record<string, { href: string; title: string; description: string }[]> = {
  "what-is-a-bank-statement": [
    { href: "/tools/bank-statement-parser", title: "Free Bank Statement Parser", description: "Extract transactions from bank statements automatically." },
    { href: "/tools/bank-statement-to-excel", title: "Bank Statement to Excel", description: "Convert bank statement PDFs to Excel instantly." },
  ],
  "how-to-read-bank-statement": [
    { href: "/tools/bank-statement-parser", title: "Free Bank Statement Parser", description: "Let AI read your bank statement — extract every transaction." },
    { href: "/tools/bank-statement-to-csv", title: "Bank Statement to CSV", description: "Convert bank statement data to CSV for analysis." },
  ],
  "verify-bank-statements": [
    { href: "/tools/bank-statement-parser", title: "Free Bank Statement Parser", description: "Extract and verify bank statement data automatically." },
    { href: "/tools/bank-statement-to-excel", title: "Bank Statement to Excel", description: "Convert bank statements to Excel for verification." },
  ],
  "fake-bank-statements-detection": [
    { href: "/tools/bank-statement-parser", title: "Free Bank Statement Parser", description: "Parse bank statements to verify mathematical consistency." },
  ],
  "bank-statement-reconciliation": [
    { href: "/tools/bank-statement-to-excel", title: "Bank Statement to Excel", description: "Convert bank statements to Excel for reconciliation." },
    { href: "/tools/bank-statement-parser", title: "Free Bank Statement Parser", description: "Extract transaction data for faster reconciliation." },
    { href: "/tools/bank-statement-to-csv", title: "Bank Statement to CSV", description: "Export bank statement data to CSV format." },
  ],
  "financial-document-automation": [
    { href: "/tools/invoice-parser", title: "Free Invoice Parser", description: "Try AI document automation on invoices instantly." },
    { href: "/tools/bank-statement-parser", title: "Free Bank Statement Parser", description: "Automate bank statement data extraction." },
    { href: "/tools/receipt-scanner", title: "Free Receipt Scanner", description: "Automate receipt data capture in your browser." },
  ],
  "accounts-payable-automation": [
    { href: "/tools/invoice-parser", title: "Free Invoice Parser", description: "Automate the first step of AP — extract invoice data." },
    { href: "/tools/pdf-to-excel", title: "PDF to Excel Converter", description: "Convert invoice PDFs to Excel for AP processing." },
  ],
  "ocr-invoice-processing": [
    { href: "/tools/invoice-parser", title: "Free Invoice Parser", description: "Try OCR invoice processing — extract data from any invoice." },
  ],
  "ai-invoice-processing": [
    { href: "/tools/invoice-parser", title: "Free Invoice Parser", description: "Try AI invoice processing — no templates required." },
    { href: "/tools/pdf-to-json", title: "PDF to JSON Converter", description: "Convert invoices to structured JSON with AI." },
  ],
  "detect-fraudulent-documents": [
    { href: "/tools/bank-statement-parser", title: "Free Bank Statement Parser", description: "Extract bank statement data for fraud analysis." },
  ],
  "accounting-ocr": [
    { href: "/tools/invoice-parser", title: "Free Invoice Parser", description: "Try accounting OCR — extract invoice data instantly." },
    { href: "/tools/receipt-scanner", title: "Free Receipt Scanner", description: "Scan receipts and extract expense data." },
    { href: "/tools/bank-statement-parser", title: "Free Bank Statement Parser", description: "Parse bank statements for accounting workflows." },
  ],
  "receipt-ocr-guide": [
    { href: "/tools/receipt-scanner", title: "Free Receipt Scanner", description: "Try receipt OCR — scan and extract data in your browser." },
    { href: "/tools/pdf-to-excel", title: "PDF to Excel Converter", description: "Convert receipt PDFs to Excel for expense tracking." },
  ],
  "paperless-invoice-processing": [
    { href: "/tools/invoice-parser", title: "Free Invoice Parser", description: "Go paperless — extract invoice data from PDFs automatically." },
  ],
  "ocr-data-capture": [
    { href: "/tools/pdf-to-text", title: "PDF to Text Extractor", description: "Try OCR data capture — extract text from any PDF." },
    { href: "/tools/image-to-text", title: "Image to Text Converter", description: "Extract text from images using OCR technology." },
  ],
  "bank-statement-analysis-divorce": [
    { href: "/tools/bank-statement-parser", title: "Free Bank Statement Parser", description: "Extract transaction data for legal analysis." },
    { href: "/tools/bank-statement-to-excel", title: "Bank Statement to Excel", description: "Convert bank statements to Excel for divorce proceedings." },
  ],
  "utility-bill-data-extraction": [
    { href: "/tools/pdf-to-excel", title: "PDF to Excel Converter", description: "Extract utility bill data to Excel for analysis." },
  ],
  "tax-resolution-bank-statement-analysis": [
    { href: "/tools/bank-statement-parser", title: "Free Bank Statement Parser", description: "Extract bank statement data for IRS case preparation." },
    { href: "/tools/bank-statement-to-excel", title: "Bank Statement to Excel", description: "Convert client bank statements to Excel for tax analysis." },
  ],
  "ocr-vs-idp": [
    { href: "/tools/pdf-to-text", title: "PDF to Text Extractor", description: "Try OCR text extraction on your documents." },
    { href: "/tools/invoice-parser", title: "Free Invoice Parser", description: "See IDP in action — extract structured data from invoices." },
  ],
  "ocr-underwriting": [
    { href: "/tools/bank-statement-parser", title: "Free Bank Statement Parser", description: "Parse bank statements for underwriting review." },
    { href: "/tools/pdf-to-excel", title: "PDF to Excel Converter", description: "Convert underwriting documents to Excel." },
  ],
  "bookkeeping-clean-up-guide": [
    { href: "/tools/bank-statement-parser", title: "Free Bank Statement Parser", description: "Speed up bookkeeping cleanup — extract bank data automatically." },
    { href: "/tools/bank-statement-to-excel", title: "Bank Statement to Excel", description: "Convert months of bank statements to Excel in minutes." },
    { href: "/tools/receipt-scanner", title: "Free Receipt Scanner", description: "Digitize receipt backlog for clean-up." },
  ],
  // Content blog posts
  "extract-invoice-data-to-excel": [
    { href: "/tools/invoice-parser", title: "Free Invoice Parser", description: "Extract invoice data to Excel automatically." },
    { href: "/tools/pdf-to-excel", title: "Free PDF to Excel Converter", description: "Convert invoice PDFs to Excel instantly." },
  ],
  "extract-table-data-from-pdfs": [
    { href: "/tools/pdf-table-extractor", title: "Free PDF Table Extractor", description: "Extract tables from PDFs into structured data." },
    { href: "/tools/pdf-to-excel", title: "Free PDF to Excel Converter", description: "Convert PDF tables to Excel instantly." },
  ],
  // Original blog posts
  "extract-data-pdf-to-excel": [
    { href: "/tools/pdf-to-excel", title: "Free PDF to Excel Converter", description: "Convert PDF tables to Excel instantly in your browser." },
  ],
  "what-is-document-parsing": [
    { href: "/tools/pdf-to-text", title: "Free PDF to Text Extractor", description: "Extract text from PDF files instantly." },
    { href: "/tools/ai-summarizer", title: "Free AI Document Summarizer", description: "Summarize key information from any document." },
  ],
  "automate-data-entry": [
    { href: "/tools/invoice-parser", title: "Free Invoice Parser", description: "Extract invoice data automatically." },
    { href: "/tools/bank-statement-parser", title: "Free Bank Statement Parser", description: "Extract transactions from bank statements." },
  ],
  "extract-data-from-pdf-automatically": [
    { href: "/tools/pdf-to-excel", title: "Free PDF to Excel Converter", description: "Convert PDF tables to Excel instantly." },
    { href: "/tools/pdf-table-extractor", title: "Free PDF Table Extractor", description: "Extract tables from PDFs into structured data." },
  ],
  "automate-invoice-data-extraction": [
    { href: "/tools/invoice-parser", title: "Free Invoice Parser", description: "Extract data from invoices automatically." },
    { href: "/tools/receipt-scanner", title: "Free Receipt Scanner", description: "Scan receipts and extract transaction details." },
  ],
  "extract-bank-statement-data-pdf": [
    { href: "/tools/bank-statement-parser", title: "Free Bank Statement Parser", description: "Extract transactions from bank statements." },
    { href: "/tools/pdf-to-excel", title: "Free PDF to Excel Converter", description: "Convert bank statement PDFs to Excel." },
  ],
  "agentic-document-extraction": [
    { href: "/tools/pdf-to-json", title: "Free PDF to JSON Converter", description: "Convert PDFs to structured JSON data." },
    { href: "/tools/invoice-parser", title: "Free Invoice Parser", description: "Try AI-powered extraction on invoices." },
  ],
  "freight-invoice-processing-automation": [
    { href: "/tools/invoice-parser", title: "Free Invoice Parser", description: "Extract data from freight invoices automatically." },
    { href: "/tools/bol-parser", title: "Free BOL Parser", description: "Parse bills of lading for freight operations." },
  ],
  "true-cost-manual-data-entry-2026": [
    { href: "/tools/invoice-parser", title: "Free Invoice Parser", description: "Stop manual data entry — extract invoice data automatically." },
    { href: "/tools/pdf-to-excel", title: "Free PDF to Excel Converter", description: "Convert PDF tables to Excel instantly." },
  ],
  "what-is-intelligent-document-processing": [
    { href: "/tools/pdf-to-json", title: "Free PDF to JSON Converter", description: "See intelligent document processing in action." },
    { href: "/tools/invoice-parser", title: "Free Invoice Parser", description: "Try AI-powered document processing on invoices." },
  ],
  "contract-data-extraction-small-business": [
    { href: "/tools/pdf-to-json", title: "Free PDF to JSON Converter", description: "Extract structured data from contracts." },
    { href: "/tools/pdf-to-text", title: "Free PDF to Text Extractor", description: "Pull text from contract PDFs." },
  ],
  "kyc-document-extraction-automation": [
    { href: "/tools/pdf-to-json", title: "Free PDF to JSON Converter", description: "Extract KYC data from identity documents." },
    { href: "/tools/image-to-text", title: "Free Image to Text Converter", description: "Extract text from ID scans." },
  ],
  "receipt-extraction-accountants-bulk-processing": [
    { href: "/tools/receipt-scanner", title: "Free Receipt Scanner", description: "Scan and extract data from receipts in bulk." },
    { href: "/tools/invoice-parser", title: "Free Invoice Parser", description: "Extract vendor, amounts, and line items from invoices." },
  ],
  "brokerage-statement-extraction-financial-advisors": [
    { href: "/tools/bank-statement-parser", title: "Free Bank Statement Parser", description: "Extract holdings and transactions from brokerage statements." },
    { href: "/tools/pdf-to-excel", title: "Free PDF to Excel Converter", description: "Convert brokerage statement PDFs to Excel." },
  ],
  "extract-k1-data-from-pdf": [
    { href: "/tools/pdf-to-excel", title: "Free PDF to Excel Converter", description: "Convert K-1 tax form PDFs to Excel." },
    { href: "/tools/pdf-to-json", title: "Free PDF to JSON Converter", description: "Extract structured K-1 data into JSON." },
  ],
  "credit-card-statement-parsing-expense-reporting": [
    { href: "/tools/bank-statement-parser", title: "Free Bank Statement Parser", description: "Parse credit card statements and extract transactions." },
    { href: "/tools/bank-statement-to-csv", title: "Free Bank Statement to CSV", description: "Convert credit card statements to CSV." },
  ],
  "bank-statement-to-excel-automation-guide": [
    { href: "/tools/bank-statement-to-excel", title: "Free Bank Statement to Excel", description: "Convert bank statements to Excel instantly." },
    { href: "/tools/bank-statement-parser", title: "Free Bank Statement Parser", description: "Extract transactions and balances from bank statements." },
  ],
  "aml-document-processing-small-financial-firms": [
    { href: "/tools/bank-statement-parser", title: "Free Bank Statement Parser", description: "Parse bank statements for AML compliance checks." },
    { href: "/tools/pdf-to-json", title: "Free PDF to JSON Converter", description: "Extract structured data from compliance documents." },
  ],
}

/* ── slug → relatedSolutions ── */
const solutionsMap: Record<string, string[]> = {
  "what-is-a-bank-statement": ["bank-statement-extraction", "pdf-to-excel"],
  "how-to-read-bank-statement": ["bank-statement-extraction", "pdf-to-excel"],
  "verify-bank-statements": ["bank-statement-extraction"],
  "fake-bank-statements-detection": ["bank-statement-extraction"],
  "bank-statement-reconciliation": ["bank-statement-extraction", "pdf-to-excel"],
  "financial-document-automation": ["no-code-document-parser", "invoice-parsing"],
  "accounts-payable-automation": ["invoice-parsing", "invoice-data-extraction"],
  "ocr-invoice-processing": ["invoice-parsing"],
  "ai-invoice-processing": ["invoice-parsing", "document-parsing-api"],
  "detect-fraudulent-documents": ["bank-statement-extraction"],
  "accounting-ocr": ["invoice-parsing", "no-code-document-parser"],
  "receipt-ocr-guide": ["invoice-data-extraction"],
  "paperless-invoice-processing": ["invoice-parsing"],
  "ocr-data-capture": ["no-code-document-parser", "document-parsing-api"],
  "bank-statement-analysis-divorce": ["bank-statement-extraction"],
  "utility-bill-data-extraction": ["no-code-document-parser"],
  "tax-resolution-bank-statement-analysis": ["bank-statement-extraction"],
  "ocr-vs-idp": ["no-code-document-parser", "document-parsing-api"],
  "ocr-underwriting": ["bank-statement-extraction"],
  "bookkeeping-clean-up-guide": ["bank-statement-extraction"],
  "extract-invoice-data-to-excel": ["invoice-parsing", "pdf-to-excel"],
  "extract-table-data-from-pdfs": ["pdf-to-excel", "no-code-document-parser"],
}

/* ── slug → relatedCompare ── */
const compareMap: Record<string, string[]> = {
  "what-is-a-bank-statement": ["docuclipper"],
  "how-to-read-bank-statement": ["docuclipper"],
  "verify-bank-statements": ["docuclipper", "nanonets"],
  "fake-bank-statements-detection": ["docuclipper"],
  "bank-statement-reconciliation": ["docuclipper"],
  "financial-document-automation": ["nanonets", "docsumo", "abbyy"],
  "accounts-payable-automation": ["nanonets", "docsumo", "rossum"],
  "ocr-invoice-processing": ["nanonets", "abbyy"],
  "ai-invoice-processing": ["nanonets", "docsumo"],
  "detect-fraudulent-documents": ["docuclipper", "nanonets"],
  "accounting-ocr": ["abbyy", "nanonets"],
  "receipt-ocr-guide": ["veryfi", "klippa"],
  "paperless-invoice-processing": ["nanonets", "docsumo"],
  "ocr-data-capture": ["abbyy", "nanonets"],
  "bank-statement-analysis-divorce": ["docuclipper"],
  "utility-bill-data-extraction": ["nanonets"],
  "tax-resolution-bank-statement-analysis": ["docuclipper"],
  "ocr-vs-idp": ["abbyy", "nanonets"],
  "ocr-underwriting": ["nanonets", "abbyy"],
  "bookkeeping-clean-up-guide": ["docuclipper"],
  "extract-invoice-data-to-excel": ["nanonets", "docparser"],
  "extract-table-data-from-pdfs": ["google-document-ai", "textract"],
}

/* ── slug → relatedBlog ── */
const blogMap: Record<string, string[]> = {
  "what-is-a-bank-statement": ["extract-bank-statement-data-pdf", "bank-statement-to-excel-automation-guide"],
  "how-to-read-bank-statement": ["extract-bank-statement-data-pdf"],
  "verify-bank-statements": ["extract-bank-statement-data-pdf"],
  "fake-bank-statements-detection": ["extract-bank-statement-data-pdf"],
  "bank-statement-reconciliation": ["extract-bank-statement-data-pdf", "bank-statement-to-excel-automation-guide"],
  "financial-document-automation": ["automate-data-entry", "true-cost-manual-data-entry-2026"],
  "accounts-payable-automation": ["automate-invoice-data-extraction", "best-invoice-ocr-software"],
  "ocr-invoice-processing": ["best-invoice-ocr-software", "automate-invoice-data-extraction"],
  "ai-invoice-processing": ["best-invoice-ocr-software", "what-is-intelligent-document-processing"],
  "detect-fraudulent-documents": ["extract-bank-statement-data-pdf"],
  "accounting-ocr": ["best-invoice-ocr-software", "automate-data-entry"],
  "receipt-ocr-guide": ["receipt-extraction-accountants-bulk-processing"],
  "paperless-invoice-processing": ["automate-invoice-data-extraction"],
  "ocr-data-capture": ["what-is-document-parsing", "automate-data-entry"],
  "bank-statement-analysis-divorce": ["extract-bank-statement-data-pdf"],
  "utility-bill-data-extraction": ["automate-data-entry"],
  "tax-resolution-bank-statement-analysis": ["extract-bank-statement-data-pdf", "bank-statement-to-excel-automation-guide"],
  "ocr-vs-idp": ["ocr-vs-ai-document-extraction", "what-is-intelligent-document-processing"],
  "ocr-underwriting": ["extract-bank-statement-data-pdf"],
  "bookkeeping-clean-up-guide": ["extract-bank-statement-data-pdf", "automate-data-entry"],
  "extract-invoice-data-to-excel": ["best-invoice-ocr-software", "extract-data-pdf-to-excel"],
  "extract-table-data-from-pdfs": ["extract-data-pdf-to-excel", "best-pdf-parser-tools"],
}

/* ── Conversion helpers ── */

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
}

function convertContentBlock(block: ContentBlock): GuideContentBlock {
  switch (block.type) {
    case "paragraph":
      return { type: "paragraph", text: block.text }
    case "heading":
      return { type: "heading", level: block.level, text: block.text, id: slugify(block.text) }
    case "list":
      return { type: "list", items: block.items }
    case "callout":
      return { type: "callout", variant: "tip", text: block.text }
    case "mid-cta":
      return { type: "mid-cta", text: block.text }
    case "cta":
      return { type: "cta", headline: block.headline }
    default:
      return { type: "paragraph", text: "" }
  }
}

function extractFaqs(content: ContentBlock[]): { question: string; answer: string }[] {
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

function contentWithoutFaqs(content: ContentBlock[]): GuideContentBlock[] {
  const faqIdx = content.findIndex(
    (b) => b.type === "heading" && b.level === 2 && b.text === "Frequently Asked Questions"
  )
  const slice = faqIdx === -1 ? content : content.slice(0, faqIdx)
  return slice.map(convertContentBlock)
}

function generateImageTitle(title: string): string {
  // Remove year references and common suffixes
  return title
    .replace(/\s*\(.*?\)\s*/g, "")
    .replace(/:\s+.*$/, "")
    .replace(/in \d{4}/g, "")
    .trim()
}

/* ── Main converter ── */

function convertBlogToGuide(post: BlogPost): GuideData {
  return {
    slug: post.slug,
    title: post.title,
    h1: post.title,
    metaTitle: post.metaTitle,
    metaDescription: post.metaDescription,
    publishedAt: post.publishedAt,
    updatedAt: post.updatedAt,
    author: post.author,
    authorTitle: post.authorTitle,
    readTime: post.readTime,
    category: categoryMap[post.slug] ?? "Document Extraction",
    imageTitle: generateImageTitle(post.title),
    tldr: post.keyTakeaways.map((t) => `**${t.split(" — ")[0]}** — ${t.split(" — ").slice(1).join(" — ") || t}`),
    content: contentWithoutFaqs(post.content),
    faqs: extractFaqs(post.content),
    relatedTools: toolsMap[post.slug] ?? [],
    relatedSolutions: solutionsMap[post.slug] ?? [],
    relatedCompare: compareMap[post.slug] ?? [],
    relatedBlog: blogMap[post.slug] ?? [],
  }
}

/* ── Collect & export ── */

const allGuideBlogPosts = [
  ...blogPosts.filter((p) => guideSlugs.has(p.slug)),
  ...bankStatementBlogPosts.filter((p) => guideSlugs.has(p.slug)),
  ...financialBlogPosts.filter((p) => guideSlugs.has(p.slug)),
  ...nicheBlogPosts.filter((p) => guideSlugs.has(p.slug)),
  ...contentBlogPosts.filter((p) => guideSlugs.has(p.slug)),
]

export const convertedGuides: GuideData[] = allGuideBlogPosts.map(convertBlogToGuide)
