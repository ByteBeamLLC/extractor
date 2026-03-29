/**
 * Single source of truth for slugs that belong under /guides (not /blog).
 * Imported by both blog-posts.ts (to filter them out) and guides-from-blog.ts (to convert them).
 * Kept in its own file to avoid circular dependencies.
 */
export const guideSlugs = new Set([
  // ── New posts (from extended blog files) ──
  "what-is-a-bank-statement",
  "how-to-read-bank-statement",
  "verify-bank-statements",
  "fake-bank-statements-detection",
  "bank-statement-reconciliation",
  "financial-document-automation",
  "accounts-payable-automation",
  "ocr-invoice-processing",
  "ai-invoice-processing",
  "detect-fraudulent-documents",
  "accounting-ocr",
  "receipt-ocr-guide",
  "paperless-invoice-processing",
  "ocr-data-capture",
  "bank-statement-analysis-divorce",
  "utility-bill-data-extraction",
  "tax-resolution-bank-statement-analysis",
  "ocr-vs-idp",
  "ocr-underwriting",
  "bookkeeping-clean-up-guide",
  // ── Original blog posts with category "Guide" ──
  "extract-data-pdf-to-excel",
  "what-is-document-parsing",
  "automate-data-entry",
  "extract-data-from-pdf-automatically",
  "automate-invoice-data-extraction",
  "extract-bank-statement-data-pdf",
  "agentic-document-extraction",
  "freight-invoice-processing-automation",
  "true-cost-manual-data-entry-2026",
  "what-is-intelligent-document-processing",
  "contract-data-extraction-small-business",
  "kyc-document-extraction-automation",
  "receipt-extraction-accountants-bulk-processing",
  "brokerage-statement-extraction-financial-advisors",
  "extract-k1-data-from-pdf",
  "credit-card-statement-parsing-expense-reporting",
  "bank-statement-to-excel-automation-guide",
  "aml-document-processing-small-financial-firms",
  // Content blog posts promoted to guides
  "extract-invoice-data-to-excel",
  "extract-table-data-from-pdfs",
])
