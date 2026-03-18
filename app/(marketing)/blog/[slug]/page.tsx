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
  "true-cost-manual-data-entry-2026": [
    "no-code-document-parser",
    "invoice-data-extraction",
    "document-parsing-api",
  ],
  "what-is-intelligent-document-processing": [
    "no-code-document-parser",
    "document-parsing-api",
    "invoice-data-extraction",
  ],
  "ocr-vs-ai-document-extraction": [
    "no-code-document-parser",
    "pdf-to-excel",
    "document-parsing-api",
  ],
  "contract-data-extraction-small-business": [
    "no-code-document-parser",
    "document-parsing-api",
    "pdf-to-excel",
  ],
  "kyc-document-extraction-automation": [
    "no-code-document-parser",
    "document-parsing-api",
    "bank-statement-extraction",
  ],
  "receipt-extraction-accountants-bulk-processing": [
    "invoice-data-extraction",
    "no-code-document-parser",
    "pdf-to-excel",
  ],
  "brokerage-statement-extraction-financial-advisors": [
    "bank-statement-extraction",
    "pdf-to-excel",
    "no-code-document-parser",
  ],
  "extract-k1-data-from-pdf": [
    "pdf-to-excel",
    "no-code-document-parser",
    "document-parsing-api",
  ],
  "credit-card-statement-parsing-expense-reporting": [
    "bank-statement-extraction",
    "pdf-to-excel",
    "invoice-data-extraction",
  ],
  "bank-statement-to-excel-automation-guide": [
    "bank-statement-extraction",
    "pdf-to-excel",
    "no-code-document-parser",
  ],
  "aml-document-processing-small-financial-firms": [
    "bank-statement-extraction",
    "no-code-document-parser",
    "document-parsing-api",
  ],
  "best-tax-document-extraction-tools-2026": [
    "invoice-data-extraction",
    "pdf-to-excel",
    "no-code-document-parser",
  ],
  "bill-of-lading-requirements-complete-guide": [
    "logistics-document-automation",
    "no-code-document-parser",
    "document-parsing-api",
  ],
  "bol-errors-prevention-guide": [
    "logistics-document-automation",
    "no-code-document-parser",
    "document-parsing-api",
  ],
  "columbus-logistics-hub-3pl-guide": [
    "logistics-document-automation",
    "no-code-document-parser",
    "invoice-data-extraction",
  ],
  "cost-of-manual-data-entry-3pl": [
    "logistics-document-automation",
    "no-code-document-parser",
    "invoice-data-extraction",
  ],
  "ohio-freight-regulations-2026": [
    "logistics-document-automation",
    "no-code-document-parser",
    "document-parsing-api",
  ],
  "freight-invoice-processing-automation": [
    "logistics-document-automation",
    "invoice-parsing",
    "no-code-document-parser",
  ],
  // New bank statement posts
  "what-is-a-bank-statement": [
    "bank-statement-extraction",
    "pdf-to-excel",
    "no-code-document-parser",
  ],
  "how-to-read-bank-statement": [
    "bank-statement-extraction",
    "pdf-to-excel",
    "no-code-document-parser",
  ],
  "verify-bank-statements": [
    "bank-statement-extraction",
    "no-code-document-parser",
    "document-parsing-api",
  ],
  "fake-bank-statements-detection": [
    "bank-statement-extraction",
    "no-code-document-parser",
    "document-parsing-api",
  ],
  "bank-statement-reconciliation": [
    "bank-statement-extraction",
    "pdf-to-excel",
    "no-code-document-parser",
  ],
  // New financial posts
  "financial-document-automation": [
    "no-code-document-parser",
    "invoice-parsing",
    "document-parsing-api",
  ],
  "accounts-payable-automation": [
    "invoice-parsing",
    "no-code-document-parser",
    "invoice-data-extraction",
  ],
  "ocr-invoice-processing": [
    "invoice-parsing",
    "no-code-document-parser",
    "document-parsing-api",
  ],
  "ai-invoice-processing": [
    "invoice-parsing",
    "no-code-document-parser",
    "document-parsing-api",
  ],
  "detect-fraudulent-documents": [
    "bank-statement-extraction",
    "no-code-document-parser",
    "document-parsing-api",
  ],
  "accounting-ocr": [
    "invoice-parsing",
    "no-code-document-parser",
    "pdf-to-excel",
  ],
  "receipt-ocr-guide": [
    "invoice-data-extraction",
    "no-code-document-parser",
    "pdf-to-excel",
  ],
  "paperless-invoice-processing": [
    "invoice-parsing",
    "no-code-document-parser",
    "document-parsing-api",
  ],
  "ocr-data-capture": [
    "no-code-document-parser",
    "document-parsing-api",
    "pdf-to-excel",
  ],
  // New alternative/comparison posts
  "ocrolus-alternatives": [
    "bank-statement-extraction",
    "no-code-document-parser",
    "document-parsing-api",
  ],
  "veryfi-alternatives": [
    "invoice-data-extraction",
    "no-code-document-parser",
    "document-parsing-api",
  ],
  "klippa-alternatives": [
    "invoice-parsing",
    "no-code-document-parser",
    "document-parsing-api",
  ],
  "abbyy-alternatives": [
    "no-code-document-parser",
    "document-parsing-api",
    "invoice-parsing",
  ],
  "best-bank-statement-analyzer": [
    "bank-statement-extraction",
    "pdf-to-excel",
    "no-code-document-parser",
  ],
  "best-accounts-payable-ocr-software": [
    "invoice-parsing",
    "no-code-document-parser",
    "invoice-data-extraction",
  ],
  "best-forensic-accounting-software": [
    "bank-statement-extraction",
    "no-code-document-parser",
    "pdf-to-excel",
  ],
  // New statistics posts
  "data-entry-statistics": [
    "no-code-document-parser",
    "invoice-parsing",
    "document-parsing-api",
  ],
  "human-error-statistics": [
    "no-code-document-parser",
    "invoice-parsing",
    "document-parsing-api",
  ],
  "financial-automation-statistics": [
    "no-code-document-parser",
    "invoice-parsing",
    "document-parsing-api",
  ],
  "erp-statistics": [
    "no-code-document-parser",
    "document-parsing-api",
    "invoice-parsing",
  ],
  // New niche posts
  "bank-statement-analysis-divorce": [
    "bank-statement-extraction",
    "pdf-to-excel",
    "no-code-document-parser",
  ],
  "utility-bill-data-extraction": [
    "no-code-document-parser",
    "pdf-to-excel",
    "document-parsing-api",
  ],
  "tax-resolution-bank-statement-analysis": [
    "bank-statement-extraction",
    "pdf-to-excel",
    "no-code-document-parser",
  ],
  "ocr-vs-idp": [
    "no-code-document-parser",
    "document-parsing-api",
    "invoice-parsing",
  ],
  "ocr-underwriting": [
    "bank-statement-extraction",
    "no-code-document-parser",
    "document-parsing-api",
  ],
  "bookkeeping-clean-up-guide": [
    "bank-statement-extraction",
    "pdf-to-excel",
    "no-code-document-parser",
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
    { href: "/tools/pdf-to-json", title: "Free PDF to JSON Converter", description: "Convert PDF documents to structured JSON data." },
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
    { href: "/tools/pdf-to-json", title: "Free PDF to JSON Converter", description: "Convert PDF documents to structured JSON data instantly." },
    { href: "/tools/invoice-parser", title: "Free Invoice Parser", description: "Try AI-powered extraction on invoices instantly." },
    { href: "/tools/pdf-to-text", title: "Free PDF to Text Extractor", description: "Extract text from any PDF using AI — no sign-up required." },
  ],
  "true-cost-manual-data-entry-2026": [
    { href: "/tools/invoice-parser", title: "Free Invoice Parser", description: "Stop manual data entry — extract invoice data automatically." },
    { href: "/tools/pdf-to-excel", title: "Free PDF to Excel Converter", description: "Convert PDF tables to Excel instantly. No manual typing." },
    { href: "/tools/receipt-scanner", title: "Free Receipt Scanner", description: "Scan receipts and extract data without manual entry." },
  ],
  "what-is-intelligent-document-processing": [
    { href: "/tools/pdf-to-json", title: "Free PDF to JSON Converter", description: "See intelligent document processing in action — convert PDFs to structured JSON." },
    { href: "/tools/invoice-parser", title: "Free Invoice Parser", description: "Try AI-powered document processing on invoices instantly." },
    { href: "/tools/pdf-to-text", title: "Free PDF to Text Extractor", description: "Extract text from PDFs using intelligent processing." },
  ],
  "ocr-vs-ai-document-extraction": [
    { href: "/tools/pdf-to-text", title: "Free PDF to Text Extractor", description: "Go beyond OCR — extract text from PDFs with AI accuracy." },
    { href: "/tools/image-to-text", title: "Free Image to Text Converter", description: "Compare OCR vs AI extraction on your own images." },
    { href: "/tools/pdf-to-excel", title: "Free PDF to Excel Converter", description: "AI-powered PDF to Excel — more accurate than traditional OCR." },
  ],
  "contract-data-extraction-small-business": [
    { href: "/tools/pdf-to-json", title: "Free PDF to JSON Converter", description: "Extract structured data from contracts instantly." },
    { href: "/tools/pdf-to-text", title: "Free PDF to Text Extractor", description: "Pull text from contract PDFs — no sign-up required." },
    { href: "/tools/pdf-to-excel", title: "Free PDF to Excel Converter", description: "Convert contract data to Excel for easy analysis." },
  ],
  "kyc-document-extraction-automation": [
    { href: "/tools/pdf-to-json", title: "Free PDF to JSON Converter", description: "Extract KYC data from identity documents into structured JSON." },
    { href: "/tools/image-to-text", title: "Free Image to Text Converter", description: "Extract text from ID scans and KYC documents instantly." },
    { href: "/tools/bank-statement-parser", title: "Free Bank Statement Parser", description: "Parse bank statements as part of your KYC verification workflow." },
  ],
  "receipt-extraction-accountants-bulk-processing": [
    { href: "/tools/receipt-scanner", title: "Free Receipt Scanner", description: "Scan and extract data from receipts in bulk — no sign-up required." },
    { href: "/tools/invoice-parser", title: "Free Invoice Parser", description: "Extract vendor, amounts, and line items from invoices automatically." },
    { href: "/tools/pdf-to-excel", title: "Free PDF to Excel Converter", description: "Convert receipt PDFs to Excel for accounting workflows." },
  ],
  "brokerage-statement-extraction-financial-advisors": [
    { href: "/tools/bank-statement-parser", title: "Free Bank Statement Parser", description: "Extract holdings and transactions from brokerage statements." },
    { href: "/tools/pdf-to-excel", title: "Free PDF to Excel Converter", description: "Convert brokerage statement PDFs to Excel instantly." },
    { href: "/tools/bank-statement-to-excel", title: "Free Bank Statement to Excel", description: "Export statement data to Excel for portfolio analysis." },
  ],
  "extract-k1-data-from-pdf": [
    { href: "/tools/pdf-to-excel", title: "Free PDF to Excel Converter", description: "Convert K-1 tax form PDFs to Excel spreadsheets instantly." },
    { href: "/tools/pdf-to-json", title: "Free PDF to JSON Converter", description: "Extract structured K-1 data into JSON format." },
    { href: "/tools/pdf-to-text", title: "Free PDF to Text Extractor", description: "Pull all text from K-1 PDFs — no sign-up required." },
  ],
  "credit-card-statement-parsing-expense-reporting": [
    { href: "/tools/bank-statement-parser", title: "Free Bank Statement Parser", description: "Parse credit card statements and extract transactions automatically." },
    { href: "/tools/bank-statement-to-csv", title: "Free Bank Statement to CSV", description: "Convert credit card statements to CSV for expense reports." },
    { href: "/tools/bank-statement-to-excel", title: "Free Bank Statement to Excel", description: "Export credit card transactions to Excel instantly." },
  ],
  "bank-statement-to-excel-automation-guide": [
    { href: "/tools/bank-statement-to-excel", title: "Free Bank Statement to Excel", description: "Convert bank statements to Excel instantly — no sign-up required." },
    { href: "/tools/bank-statement-parser", title: "Free Bank Statement Parser", description: "Extract transactions and balances from bank statement PDFs." },
    { href: "/tools/bank-statement-to-csv", title: "Free Bank Statement to CSV", description: "Export bank statement data to CSV format." },
  ],
  "aml-document-processing-small-financial-firms": [
    { href: "/tools/bank-statement-parser", title: "Free Bank Statement Parser", description: "Parse bank statements for AML compliance checks." },
    { href: "/tools/bank-statement-to-excel", title: "Free Bank Statement to Excel", description: "Convert financial documents to Excel for AML review." },
    { href: "/tools/pdf-to-json", title: "Free PDF to JSON Converter", description: "Extract structured data from compliance documents." },
  ],
  "best-tax-document-extraction-tools-2026": [
    { href: "/tools/pdf-to-excel", title: "Free PDF to Excel Converter", description: "Convert tax documents to Excel — try it before choosing a tool." },
    { href: "/tools/invoice-parser", title: "Free Invoice Parser", description: "Extract tax-relevant data from invoices automatically." },
    { href: "/tools/receipt-scanner", title: "Free Receipt Scanner", description: "Scan tax receipts and extract deductible amounts." },
  ],
  "bill-of-lading-requirements-complete-guide": [
    { href: "/tools/bol-parser", title: "Free BOL Parser", description: "Extract shipper, consignee, and cargo details from bills of lading." },
    { href: "/tools/pdf-to-json", title: "Free PDF to JSON Converter", description: "Convert BOL documents to structured JSON data." },
    { href: "/tools/pdf-to-excel", title: "Free PDF to Excel Converter", description: "Convert bills of lading to Excel for easy record-keeping." },
  ],
  "bol-errors-prevention-guide": [
    { href: "/tools/bol-parser", title: "Free BOL Parser", description: "Catch BOL errors automatically — extract and validate BOL data." },
    { href: "/tools/pdf-to-json", title: "Free PDF to JSON Converter", description: "Parse BOL documents into structured data to spot discrepancies." },
    { href: "/tools/pdf-to-text", title: "Free PDF to Text Extractor", description: "Extract text from BOL documents for quick review." },
  ],
  "columbus-logistics-hub-3pl-guide": [
    { href: "/tools/bol-parser", title: "Free BOL Parser", description: "Parse bills of lading for Columbus-area freight operations." },
    { href: "/tools/invoice-parser", title: "Free Invoice Parser", description: "Extract data from freight invoices automatically." },
    { href: "/tools/pdf-to-excel", title: "Free PDF to Excel Converter", description: "Convert logistics documents to Excel spreadsheets." },
  ],
  "cost-of-manual-data-entry-3pl": [
    { href: "/tools/bol-parser", title: "Free BOL Parser", description: "Eliminate manual BOL data entry — extract data automatically." },
    { href: "/tools/invoice-parser", title: "Free Invoice Parser", description: "Stop typing invoice data — let AI extract it for you." },
    { href: "/tools/pdf-to-excel", title: "Free PDF to Excel Converter", description: "Convert 3PL documents to Excel without manual entry." },
  ],
  "ohio-freight-regulations-2026": [
    { href: "/tools/bol-parser", title: "Free BOL Parser", description: "Parse bills of lading for Ohio freight compliance." },
    { href: "/tools/pdf-to-json", title: "Free PDF to JSON Converter", description: "Extract regulatory document data into structured JSON." },
    { href: "/tools/pdf-to-text", title: "Free PDF to Text Extractor", description: "Extract text from freight regulation documents." },
  ],
  // New bank statement posts
  "what-is-a-bank-statement": [
    { href: "/tools/bank-statement-parser", title: "Free Bank Statement Parser", description: "Extract transactions from bank statements automatically." },
    { href: "/tools/bank-statement-to-excel", title: "Free Bank Statement to Excel", description: "Convert bank statement PDFs to Excel instantly." },
  ],
  "how-to-read-bank-statement": [
    { href: "/tools/bank-statement-parser", title: "Free Bank Statement Parser", description: "Let AI read your bank statement — extract every transaction automatically." },
    { href: "/tools/bank-statement-to-csv", title: "Free Bank Statement to CSV", description: "Convert bank statement data to CSV for easy analysis." },
  ],
  "verify-bank-statements": [
    { href: "/tools/bank-statement-parser", title: "Free Bank Statement Parser", description: "Extract and verify bank statement data automatically." },
    { href: "/tools/bank-statement-to-excel", title: "Free Bank Statement to Excel", description: "Convert bank statements to Excel for verification." },
  ],
  "fake-bank-statements-detection": [
    { href: "/tools/bank-statement-parser", title: "Free Bank Statement Parser", description: "Parse bank statements to verify mathematical consistency." },
    { href: "/tools/pdf-to-text", title: "Free PDF to Text Extractor", description: "Extract text from bank statement PDFs for analysis." },
  ],
  "bank-statement-reconciliation": [
    { href: "/tools/bank-statement-to-excel", title: "Free Bank Statement to Excel", description: "Convert bank statements to Excel for reconciliation." },
    { href: "/tools/bank-statement-parser", title: "Free Bank Statement Parser", description: "Extract transaction data for faster reconciliation." },
    { href: "/tools/bank-statement-to-csv", title: "Free Bank Statement to CSV", description: "Export bank statement data to CSV format." },
  ],
  // New financial posts
  "financial-document-automation": [
    { href: "/tools/invoice-parser", title: "Free Invoice Parser", description: "Try AI document automation — extract invoice data instantly." },
    { href: "/tools/bank-statement-parser", title: "Free Bank Statement Parser", description: "Automate bank statement data extraction." },
    { href: "/tools/receipt-scanner", title: "Free Receipt Scanner", description: "Automate receipt data capture in your browser." },
  ],
  "accounts-payable-automation": [
    { href: "/tools/invoice-parser", title: "Free Invoice Parser", description: "Automate the first step of AP — extract invoice data automatically." },
    { href: "/tools/pdf-to-excel", title: "Free PDF to Excel Converter", description: "Convert invoice PDFs to Excel for AP processing." },
  ],
  "ocr-invoice-processing": [
    { href: "/tools/invoice-parser", title: "Free Invoice Parser", description: "Try OCR invoice processing — extract data from any invoice." },
    { href: "/tools/pdf-to-text", title: "Free PDF to Text Extractor", description: "Extract text from invoice PDFs using OCR." },
  ],
  "ai-invoice-processing": [
    { href: "/tools/invoice-parser", title: "Free Invoice Parser", description: "Try AI invoice processing — no templates required." },
    { href: "/tools/pdf-to-json", title: "Free PDF to JSON Converter", description: "Convert invoices to structured JSON with AI." },
  ],
  "detect-fraudulent-documents": [
    { href: "/tools/bank-statement-parser", title: "Free Bank Statement Parser", description: "Extract bank statement data for fraud analysis." },
    { href: "/tools/pdf-to-text", title: "Free PDF to Text Extractor", description: "Extract text from documents for verification." },
  ],
  "accounting-ocr": [
    { href: "/tools/invoice-parser", title: "Free Invoice Parser", description: "Try accounting OCR — extract invoice data instantly." },
    { href: "/tools/receipt-scanner", title: "Free Receipt Scanner", description: "Scan receipts and extract expense data automatically." },
    { href: "/tools/bank-statement-parser", title: "Free Bank Statement Parser", description: "Parse bank statements for accounting workflows." },
  ],
  "receipt-ocr-guide": [
    { href: "/tools/receipt-scanner", title: "Free Receipt Scanner", description: "Try receipt OCR — scan and extract data in your browser." },
    { href: "/tools/pdf-to-excel", title: "Free PDF to Excel Converter", description: "Convert receipt PDFs to Excel for expense tracking." },
  ],
  "paperless-invoice-processing": [
    { href: "/tools/invoice-parser", title: "Free Invoice Parser", description: "Go paperless — extract invoice data from PDFs automatically." },
    { href: "/tools/pdf-to-json", title: "Free PDF to JSON Converter", description: "Convert paper invoices to structured digital data." },
  ],
  "ocr-data-capture": [
    { href: "/tools/pdf-to-text", title: "Free PDF to Text Extractor", description: "Try OCR data capture — extract text from any PDF." },
    { href: "/tools/image-to-text", title: "Free Image to Text Converter", description: "Extract text from images using OCR technology." },
    { href: "/tools/pdf-to-excel", title: "Free PDF to Excel Converter", description: "Capture structured data from PDF documents." },
  ],
  // New alternative/comparison posts
  "ocrolus-alternatives": [
    { href: "/tools/bank-statement-parser", title: "Free Bank Statement Parser", description: "Try Parsli's free bank statement parser — an Ocrolus alternative." },
    { href: "/tools/invoice-parser", title: "Free Invoice Parser", description: "Extract invoice data without enterprise pricing." },
  ],
  "veryfi-alternatives": [
    { href: "/tools/receipt-scanner", title: "Free Receipt Scanner", description: "Try Parsli's free receipt scanner — a Veryfi alternative." },
    { href: "/tools/invoice-parser", title: "Free Invoice Parser", description: "Extract invoice data without per-document pricing." },
  ],
  "klippa-alternatives": [
    { href: "/tools/invoice-parser", title: "Free Invoice Parser", description: "Try Parsli — a flexible Klippa alternative." },
    { href: "/tools/pdf-to-excel", title: "Free PDF to Excel Converter", description: "Convert documents to Excel without enterprise pricing." },
  ],
  "abbyy-alternatives": [
    { href: "/tools/invoice-parser", title: "Free Invoice Parser", description: "Try Parsli — ABBYY-level extraction without enterprise pricing." },
    { href: "/tools/pdf-to-json", title: "Free PDF to JSON Converter", description: "Extract structured data from PDFs — no ABBYY license needed." },
  ],
  "best-bank-statement-analyzer": [
    { href: "/tools/bank-statement-parser", title: "Free Bank Statement Parser", description: "Try Parsli's free bank statement analyzer." },
    { href: "/tools/bank-statement-to-excel", title: "Free Bank Statement to Excel", description: "Convert bank statements to Excel instantly." },
    { href: "/tools/bank-statement-to-csv", title: "Free Bank Statement to CSV", description: "Export bank statement data to CSV format." },
  ],
  "best-accounts-payable-ocr-software": [
    { href: "/tools/invoice-parser", title: "Free Invoice Parser", description: "Try Parsli's free AP invoice parser." },
    { href: "/tools/pdf-to-excel", title: "Free PDF to Excel Converter", description: "Convert invoices to Excel for AP processing." },
  ],
  "best-forensic-accounting-software": [
    { href: "/tools/bank-statement-parser", title: "Free Bank Statement Parser", description: "Extract bank statement data for forensic analysis." },
    { href: "/tools/pdf-to-excel", title: "Free PDF to Excel Converter", description: "Convert financial documents to Excel for analysis." },
  ],
  // New statistics posts
  "data-entry-statistics": [
    { href: "/tools/invoice-parser", title: "Free Invoice Parser", description: "Eliminate data entry — extract invoice data automatically." },
    { href: "/tools/pdf-to-excel", title: "Free PDF to Excel Converter", description: "Skip manual data entry — convert PDFs to Excel instantly." },
  ],
  "human-error-statistics": [
    { href: "/tools/invoice-parser", title: "Free Invoice Parser", description: "Reduce human errors — let AI extract invoice data." },
    { href: "/tools/bank-statement-parser", title: "Free Bank Statement Parser", description: "Eliminate manual errors in bank statement processing." },
  ],
  "financial-automation-statistics": [
    { href: "/tools/invoice-parser", title: "Free Invoice Parser", description: "Start automating — extract invoice data for free." },
    { href: "/tools/bank-statement-parser", title: "Free Bank Statement Parser", description: "Automate bank statement processing today." },
  ],
  "erp-statistics": [
    { href: "/tools/invoice-parser", title: "Free Invoice Parser", description: "Feed clean invoice data to your ERP automatically." },
    { href: "/tools/pdf-to-json", title: "Free PDF to JSON Converter", description: "Convert documents to JSON for ERP integration." },
  ],
  // New niche posts
  "bank-statement-analysis-divorce": [
    { href: "/tools/bank-statement-parser", title: "Free Bank Statement Parser", description: "Extract transaction data from bank statements for legal analysis." },
    { href: "/tools/bank-statement-to-excel", title: "Free Bank Statement to Excel", description: "Convert bank statements to Excel for divorce proceedings." },
  ],
  "utility-bill-data-extraction": [
    { href: "/tools/pdf-to-excel", title: "Free PDF to Excel Converter", description: "Extract utility bill data to Excel for analysis." },
    { href: "/tools/pdf-to-json", title: "Free PDF to JSON Converter", description: "Convert utility bills to structured JSON data." },
  ],
  "tax-resolution-bank-statement-analysis": [
    { href: "/tools/bank-statement-parser", title: "Free Bank Statement Parser", description: "Extract bank statement data for IRS case preparation." },
    { href: "/tools/bank-statement-to-excel", title: "Free Bank Statement to Excel", description: "Convert client bank statements to Excel for tax analysis." },
  ],
  "ocr-vs-idp": [
    { href: "/tools/pdf-to-text", title: "Free PDF to Text Extractor", description: "Try OCR text extraction on your documents." },
    { href: "/tools/invoice-parser", title: "Free Invoice Parser", description: "See IDP in action — extract structured data from invoices." },
  ],
  "ocr-underwriting": [
    { href: "/tools/bank-statement-parser", title: "Free Bank Statement Parser", description: "Parse bank statements for underwriting review." },
    { href: "/tools/pdf-to-excel", title: "Free PDF to Excel Converter", description: "Convert underwriting documents to Excel." },
  ],
  "bookkeeping-clean-up-guide": [
    { href: "/tools/bank-statement-parser", title: "Free Bank Statement Parser", description: "Speed up bookkeeping cleanup — extract bank data automatically." },
    { href: "/tools/bank-statement-to-excel", title: "Free Bank Statement to Excel", description: "Convert months of bank statements to Excel in minutes." },
    { href: "/tools/receipt-scanner", title: "Free Receipt Scanner", description: "Digitize receipt backlog for clean-up." },
  ],
}

/* Map blog slugs to related comparison pages */
const blogToCompare: Record<string, string[]> = {
  "parseur-alternatives": ["parseur", "docparser", "parsio", "docsumo"],
  "nanonets-alternatives": ["nanonets", "parseur", "docparser", "docsumo"],
  "mailparser-alternatives": ["mailparser", "parseur", "parsio", "docparser"],
  "best-invoice-ocr-software": ["nanonets", "docparser", "rossum", "docsumo"],
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
  "agentic-document-extraction": ["nanonets", "docsumo", "sensible", "unstract"],
  "best-pdf-parser-tools": ["docparser", "parseur", "nanonets", "abbyy"],
  "true-cost-manual-data-entry-2026": ["nanonets", "docparser", "parseur", "rossum"],
  "what-is-intelligent-document-processing": ["nanonets", "abbyy", "rossum", "docsumo"],
  "ocr-vs-ai-document-extraction": ["abbyy", "nanonets", "mindee", "veryfi"],
  "contract-data-extraction-small-business": ["docsumo", "nanonets", "sensible", "affinda"],
  "kyc-document-extraction-automation": ["mindee", "veryfi", "nanonets", "klippa"],
  "receipt-extraction-accountants-bulk-processing": ["veryfi", "klippa", "nanonets", "docsumo"],
  "brokerage-statement-extraction-financial-advisors": ["docuclipper", "nanonets", "sensible", "docparser"],
  "extract-k1-data-from-pdf": ["docuclipper", "nanonets", "sensible", "docparser"],
  "credit-card-statement-parsing-expense-reporting": ["docuclipper", "veryfi", "nanonets", "klippa"],
  "bank-statement-to-excel-automation-guide": ["docuclipper", "docparser", "nanonets", "parseur"],
  "aml-document-processing-small-financial-firms": ["mindee", "nanonets", "klippa", "sensible"],
  "best-tax-document-extraction-tools-2026": ["nanonets", "docsumo", "veryfi", "abbyy"],
  "bill-of-lading-requirements-complete-guide": ["shipamax", "nanonets", "docparser", "extend-ai"],
  "bol-errors-prevention-guide": ["shipamax", "nanonets", "extend-ai", "docparser"],
  "columbus-logistics-hub-3pl-guide": ["shipamax", "nanonets", "extend-ai", "matil"],
  "cost-of-manual-data-entry-3pl": ["shipamax", "nanonets", "parseur", "docparser"],
  "ohio-freight-regulations-2026": ["shipamax", "nanonets", "extend-ai", "docparser"],
  // New bank statement posts
  "what-is-a-bank-statement": ["docuclipper", "docparser", "nanonets"],
  "how-to-read-bank-statement": ["docuclipper", "docparser", "nanonets"],
  "verify-bank-statements": ["docuclipper", "nanonets", "sensible"],
  "fake-bank-statements-detection": ["docuclipper", "nanonets", "sensible"],
  "bank-statement-reconciliation": ["docuclipper", "docparser", "nanonets"],
  // New financial posts
  "financial-document-automation": ["nanonets", "docsumo", "abbyy", "rossum"],
  "accounts-payable-automation": ["nanonets", "docsumo", "rossum"],
  "ocr-invoice-processing": ["nanonets", "abbyy", "docsumo", "rossum"],
  "ai-invoice-processing": ["nanonets", "docsumo", "rossum", "abbyy"],
  "detect-fraudulent-documents": ["docuclipper", "nanonets", "sensible"],
  "accounting-ocr": ["abbyy", "nanonets", "docsumo", "veryfi"],
  "receipt-ocr-guide": ["veryfi", "klippa", "nanonets", "docsumo"],
  "paperless-invoice-processing": ["nanonets", "docsumo", "rossum"],
  "ocr-data-capture": ["abbyy", "nanonets", "textract", "google-document-ai"],
  // New alternative/comparison posts
  "ocrolus-alternatives": ["nanonets", "docsumo", "abbyy", "veryfi"],
  "veryfi-alternatives": ["nanonets", "docsumo", "klippa"],
  "klippa-alternatives": ["nanonets", "abbyy", "docsumo"],
  "abbyy-alternatives": ["nanonets", "docsumo", "rossum", "textract"],
  "best-bank-statement-analyzer": ["docuclipper", "nanonets", "docparser"],
  "best-accounts-payable-ocr-software": ["nanonets", "docsumo", "rossum", "abbyy"],
  "best-forensic-accounting-software": ["docuclipper", "nanonets", "abbyy"],
  // New statistics posts
  "data-entry-statistics": ["nanonets", "docparser", "parseur"],
  "human-error-statistics": ["nanonets", "docparser", "parseur"],
  "financial-automation-statistics": ["nanonets", "docsumo", "rossum", "abbyy"],
  "erp-statistics": ["nanonets", "docsumo", "abbyy"],
  // New niche posts
  "bank-statement-analysis-divorce": ["docuclipper", "nanonets", "docparser"],
  "utility-bill-data-extraction": ["nanonets", "docparser", "docsumo"],
  "tax-resolution-bank-statement-analysis": ["docuclipper", "nanonets", "docparser"],
  "ocr-vs-idp": ["abbyy", "nanonets", "docsumo", "textract"],
  "ocr-underwriting": ["nanonets", "abbyy", "docsumo", "mindee"],
  "bookkeeping-clean-up-guide": ["docuclipper", "nanonets", "docparser"],
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
