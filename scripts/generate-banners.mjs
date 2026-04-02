#!/usr/bin/env node
/**
 * Generate banner images for all guides and blog posts using fal.ai Nano Banana Pro.
 * Usage: node scripts/generate-banners.mjs
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");

const FAL_KEY =
  "72acd6a4-a1a2-4976-bf78-1fb0b24a5692:b27ad38b35785846c3000b039d124bfa";
const MODEL = "fal-ai/nano-banana-pro";
const ENDPOINT = `https://fal.run/${MODEL}`;

const GUIDES_DIR = path.join(ROOT, "public", "images", "guides");
const BLOG_DIR = path.join(ROOT, "public", "images", "blog");

fs.mkdirSync(GUIDES_DIR, { recursive: true });
fs.mkdirSync(BLOG_DIR, { recursive: true });

// ── All pages: { slug, title, type: "guide"|"blog" } ──

const pages = [
  // ═══════════════ GUIDES (from guides.ts) ═══════════════
  { slug: "extract-line-items-from-invoices", title: "How to Extract Line Items from Invoices Automatically", type: "guide" },
  { slug: "extract-data-from-bank-statements", title: "How to Extract Data from Bank Statements (PDF to Excel)", type: "guide" },
  { slug: "convert-receipts-to-spreadsheet", title: "How to Convert Receipts to Spreadsheet Data", type: "guide" },
  { slug: "extract-tables-from-pdf", title: "Extract Tables from PDF Documents", type: "guide" },
  { slug: "parse-email-attachments-automatically", title: "How to Parse Email Attachments Automatically", type: "guide" },
  { slug: "extract-data-from-purchase-orders", title: "How to Extract Data from Purchase Orders", type: "guide" },
  { slug: "automate-invoice-processing-with-google-sheets", title: "How to Automate Invoice Processing with Google Sheets", type: "guide" },
  { slug: "extract-data-from-scanned-documents", title: "Extract Data from Scanned Documents with AI OCR", type: "guide" },
  { slug: "pdf-to-google-sheets-automation", title: "PDF to Google Sheets Automation", type: "guide" },
  { slug: "extract-vendor-information-from-invoices", title: "How to Extract Vendor Information from Invoices", type: "guide" },
  { slug: "extract-data-from-contracts", title: "How to Extract Data from Contracts Automatically", type: "guide" },
  { slug: "extract-data-from-medical-records", title: "How to Extract Data from Medical Records with AI", type: "guide" },
  { slug: "extract-data-from-shipping-documents", title: "How to Extract Data from Shipping Documents Automatically", type: "guide" },
  { slug: "extract-data-from-insurance-claims", title: "How to Extract Data from Insurance Claims Automatically", type: "guide" },
  { slug: "extract-invoice-data-to-quickbooks", title: "Extract Invoice Data to QuickBooks Automatically", type: "guide" },
  { slug: "parse-email-attachments-with-zapier", title: "Parse Email Attachments with Zapier and AI", type: "guide" },
  { slug: "automate-receipt-processing-with-make", title: "Automate Receipt Processing with Make.com", type: "guide" },
  { slug: "extract-data-from-pdfs-without-code", title: "How to Extract Data from PDFs Without Code", type: "guide" },
  { slug: "automate-invoice-processing-for-small-business", title: "How to Automate Invoice Processing for Small Business", type: "guide" },
  { slug: "extract-data-from-handwritten-documents", title: "Extract Data from Handwritten Documents with AI", type: "guide" },
  { slug: "pdf-to-json-extraction", title: "PDF to JSON Extraction", type: "guide" },
  { slug: "extract-data-from-excel-to-json", title: "Extract Data from Excel to JSON", type: "guide" },
  { slug: "batch-process-documents-automatically", title: "Batch Process Documents Automatically", type: "guide" },
  { slug: "extract-data-from-tax-forms", title: "Extract Data from Tax Forms", type: "guide" },
  { slug: "extract-data-from-utility-bills", title: "Extract Data from Utility Bills", type: "guide" },
  { slug: "extract-data-from-bills-of-lading", title: "Extract Data from Bills of Lading", type: "guide" },
  { slug: "automate-freight-invoice-processing", title: "Automate Freight Invoice Processing", type: "guide" },
  { slug: "bol-data-to-wms-integration", title: "BOL Data to WMS Integration", type: "guide" },
  { slug: "extract-data-from-customs-documents", title: "Extract Data from Customs Documents", type: "guide" },
  { slug: "extract-data-from-delivery-notes", title: "Extract Data from Delivery Notes", type: "guide" },

  // ═══════════════ GUIDES (converted from blog — rendered at /guides/) ═══════════════
  { slug: "what-is-a-bank-statement", title: "What Is a Bank Statement? A Complete Guide", type: "guide" },
  { slug: "how-to-read-bank-statement", title: "How to Read a Bank Statement: A Line-by-Line Guide", type: "guide" },
  { slug: "verify-bank-statements", title: "How to Verify Bank Statements", type: "guide" },
  { slug: "fake-bank-statements-detection", title: "How to Spot Fake Bank Statements: 12 Red Flags", type: "guide" },
  { slug: "bank-statement-reconciliation", title: "Bank Statement Reconciliation Guide", type: "guide" },
  { slug: "financial-document-automation", title: "Financial Document Automation: Benefits and How to Get Started", type: "guide" },
  { slug: "accounts-payable-automation", title: "Accounts Payable: How to Streamline and Automate AP", type: "guide" },
  { slug: "ocr-invoice-processing", title: "What Is OCR Invoice Processing? How It Works", type: "guide" },
  { slug: "ai-invoice-processing", title: "AI Invoice Processing: How It Works", type: "guide" },
  { slug: "detect-fraudulent-documents", title: "How to Detect Fraudulent Documents", type: "guide" },
  { slug: "accounting-ocr", title: "Accounting OCR: Automate Financial Data Extraction", type: "guide" },
  { slug: "receipt-ocr-guide", title: "Receipt OCR: How to Extract Data from Receipts", type: "guide" },
  { slug: "paperless-invoice-processing", title: "Paperless Invoice Processing: What It Is and How to Implement It", type: "guide" },
  { slug: "ocr-data-capture", title: "OCR Data Capture: What It Is and How It Works", type: "guide" },
  { slug: "bank-statement-analysis-divorce", title: "How to Analyze Bank Statements for Divorce", type: "guide" },
  { slug: "utility-bill-data-extraction", title: "How to Extract Data from Utility Bills", type: "guide" },
  { slug: "tax-resolution-bank-statement-analysis", title: "Automate Bank Statement Analysis for Tax Resolution", type: "guide" },
  { slug: "ocr-vs-idp", title: "OCR vs IDP: What Is the Difference?", type: "guide" },
  { slug: "ocr-underwriting", title: "OCR for Underwriting: Benefits for Lenders and Insurers", type: "guide" },
  { slug: "bookkeeping-clean-up-guide", title: "Bookkeeping Clean Up: A Step-by-Step Guide", type: "guide" },
  { slug: "extract-data-pdf-to-excel", title: "How to Extract Data from PDF to Excel", type: "guide" },
  { slug: "what-is-document-parsing", title: "What Is Document Parsing? Complete Guide", type: "guide" },
  { slug: "automate-data-entry", title: "How to Automate Data Entry", type: "guide" },
  { slug: "extract-data-from-pdf-automatically", title: "Extract Data from PDF Automatically", type: "guide" },
  { slug: "automate-invoice-data-extraction", title: "How to Automate Invoice Data Extraction", type: "guide" },
  { slug: "extract-bank-statement-data-pdf", title: "How to Extract Bank Statement Data from PDFs", type: "guide" },
  { slug: "agentic-document-extraction", title: "Agentic Document Extraction: How AI Agents Parse Docs", type: "guide" },
  { slug: "freight-invoice-processing-automation", title: "Freight Invoice Processing Automation", type: "guide" },
  { slug: "true-cost-manual-data-entry-2026", title: "The True Cost of Manual Data Entry in 2026", type: "guide" },
  { slug: "what-is-intelligent-document-processing", title: "What Is Intelligent Document Processing (IDP)?", type: "guide" },
  { slug: "contract-data-extraction-small-business", title: "Contract Data Extraction for Small Business", type: "guide" },
  { slug: "kyc-document-extraction-automation", title: "KYC Document Extraction: Automate Without Enterprise Budgets", type: "guide" },
  { slug: "receipt-extraction-accountants-bulk-processing", title: "Receipt Extraction for Accountants: Bulk Processing", type: "guide" },
  { slug: "brokerage-statement-extraction-financial-advisors", title: "Brokerage Statement Extraction for Financial Advisors", type: "guide" },
  { slug: "extract-k1-data-from-pdf", title: "How to Extract K-1 Data from PDFs Automatically", type: "guide" },
  { slug: "credit-card-statement-parsing-expense-reporting", title: "Credit Card Statement Parsing for Expense Reporting", type: "guide" },
  { slug: "bank-statement-to-excel-automation-guide", title: "Bank Statement to Excel: Complete Automation Guide", type: "guide" },
  { slug: "aml-document-processing-small-financial-firms", title: "AML Document Processing for Small Financial Firms", type: "guide" },
  { slug: "extract-invoice-data-to-excel", title: "Extract Invoice Data to Excel Automatically", type: "guide" },
  { slug: "extract-table-data-from-pdfs", title: "How to Extract Table Data from PDFs", type: "guide" },

  // ═══════════════ BLOG POSTS (remain at /blog/) ═══════════════
  { slug: "best-invoice-ocr-software", title: "Best Invoice OCR Software in 2026: An Honest Comparison", type: "blog" },
  { slug: "nanonets-alternatives", title: "Best Nanonets Alternatives in 2026", type: "blog" },
  { slug: "best-pdf-parser-tools", title: "Best PDF Parser Tools in 2026", type: "blog" },
  { slug: "parseur-alternatives", title: "Best Parseur Alternatives in 2026", type: "blog" },
  { slug: "best-email-parser-tools", title: "Best Email Parser Tools in 2026: AI vs Rule-Based", type: "blog" },
  { slug: "mailparser-alternatives", title: "Best Mailparser Alternatives in 2026", type: "blog" },
  { slug: "parse-emails-to-google-sheets", title: "How to Parse Emails to Google Sheets Automatically", type: "blog" },
  { slug: "email-attachments-to-spreadsheet", title: "Turn Email Attachments Into Spreadsheet Data", type: "blog" },
  { slug: "document-parsing-api", title: "Document Parsing API: Extract Structured Data", type: "blog" },
  { slug: "bill-of-lading-requirements-complete-guide", title: "Bill of Lading Requirements: Complete Guide", type: "blog" },
  { slug: "bol-errors-prevention-guide", title: "12 Common Bill of Lading Errors That Cost 3PLs Thousands", type: "blog" },
  { slug: "cost-of-manual-data-entry-3pl", title: "The Hidden Cost of Manual Data Entry for 3PLs", type: "blog" },
  { slug: "ohio-freight-regulations-2026", title: "Ohio Freight & Logistics Regulations 2026", type: "blog" },
  { slug: "columbus-logistics-hub-3pl-guide", title: "Columbus Logistics Hub: 3PL Guide", type: "blog" },
  { slug: "ocr-vs-ai-document-extraction", title: "OCR vs AI Document Extraction", type: "blog" },
  { slug: "best-tax-document-extraction-tools-2026", title: "Best Tax Document Extraction Tools in 2026", type: "blog" },

  // Alternatives
  { slug: "ocrolus-alternatives", title: "Best Ocrolus Alternatives in 2026", type: "blog" },
  { slug: "veryfi-alternatives", title: "Best Veryfi Alternatives in 2026", type: "blog" },
  { slug: "klippa-alternatives", title: "Best Klippa Alternatives in 2026", type: "blog" },
  { slug: "abbyy-alternatives", title: "Best ABBYY Alternatives in 2026", type: "blog" },
  { slug: "best-bank-statement-analyzer", title: "Best Bank Statement Analyzer Tools in 2026", type: "blog" },
  { slug: "best-accounts-payable-ocr-software", title: "Best Accounts Payable OCR Software in 2026", type: "blog" },
  { slug: "best-forensic-accounting-software", title: "Best Forensic Accounting Software in 2026", type: "blog" },

  // Statistics
  { slug: "data-entry-statistics", title: "Data Entry Statistics: Error Rates and Automation Trends", type: "blog" },
  { slug: "human-error-statistics", title: "Human Error Statistics in Data Entry", type: "blog" },
  { slug: "financial-automation-statistics", title: "Financial Automation Statistics: Trends and ROI", type: "blog" },
  { slug: "erp-statistics", title: "ERP Statistics 2026: Adoption and Market Size", type: "blog" },

  // Markdown content
  { slug: "best-ai-document-data-extraction-tools", title: "Best AI Document Data Extraction Tools in 2026", type: "blog" },
  { slug: "email-parser-vs-virtual-assistant", title: "Email Parser vs Virtual Assistant", type: "blog" },
  { slug: "invoice-extraction-tools-benchmark", title: "Invoice Extraction Tools Tested on 100 Invoices", type: "blog" },
  { slug: "llm-ocr-vs-traditional-ocr", title: "LLM-Based OCR vs Traditional OCR", type: "blog" },
];

// ── Prompt builder ──
function buildPrompt(title) {
  return `A sleek, modern, professional blog banner illustration for a SaaS document data extraction platform called Parsli. Topic: "${title}". The image should feature an abstract, clean representation related to the topic — think documents, data flowing, tables, spreadsheets, AI processing, automation. Use a blue (#2782ff) and indigo (#6366f1) color scheme with a soft light gray (#f8f9fa) background. Minimalist flat design with subtle geometric shapes, clean lines, and gentle gradients. Professional, modern tech aesthetic. Wide cinematic format. No text, no words, no letters, no watermarks.`;
}

// ── API caller ──
async function generateImage(slug, title, type) {
  const outDir = type === "guide" ? GUIDES_DIR : BLOG_DIR;
  const outPath = path.join(outDir, `${slug}.webp`);

  // Skip if already exists
  if (fs.existsSync(outPath)) {
    console.log(`⏭  SKIP ${type}/${slug} (already exists)`);
    return { slug, status: "skipped" };
  }

  const prompt = buildPrompt(title);

  try {
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Key ${FAL_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt,
        aspect_ratio: "16:9",
        output_format: "webp",
        resolution: "1K",
        num_images: 1,
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error(`❌ FAIL ${type}/${slug}: ${res.status} ${text}`);
      return { slug, status: "error", error: text };
    }

    const data = await res.json();
    const imageUrl = data.images?.[0]?.url;

    if (!imageUrl) {
      console.error(`❌ FAIL ${type}/${slug}: no image URL in response`);
      return { slug, status: "error", error: "no image URL" };
    }

    // Download the image
    const imgRes = await fetch(imageUrl);
    if (!imgRes.ok) {
      console.error(`❌ FAIL downloading ${type}/${slug}: ${imgRes.status}`);
      return { slug, status: "error", error: "download failed" };
    }

    const buffer = Buffer.from(await imgRes.arrayBuffer());
    fs.writeFileSync(outPath, buffer);
    console.log(`✅ OK   ${type}/${slug} (${(buffer.length / 1024).toFixed(0)} KB)`);
    return { slug, status: "ok", size: buffer.length };
  } catch (err) {
    console.error(`❌ FAIL ${type}/${slug}: ${err.message}`);
    return { slug, status: "error", error: err.message };
  }
}

// ── Run with concurrency limit ──
async function runAll() {
  const CONCURRENCY = 5;
  const results = [];
  let i = 0;

  console.log(`\n🎨 Generating ${pages.length} banner images via fal.ai Nano Banana Pro\n`);

  while (i < pages.length) {
    const batch = pages.slice(i, i + CONCURRENCY);
    const batchResults = await Promise.all(
      batch.map((p) => generateImage(p.slug, p.title, p.type))
    );
    results.push(...batchResults);
    i += CONCURRENCY;

    // Small delay between batches to be nice to the API
    if (i < pages.length) {
      await new Promise((r) => setTimeout(r, 500));
    }
  }

  const ok = results.filter((r) => r.status === "ok").length;
  const skipped = results.filter((r) => r.status === "skipped").length;
  const failed = results.filter((r) => r.status === "error").length;

  console.log(`\n📊 Done: ${ok} generated, ${skipped} skipped, ${failed} failed`);

  if (failed > 0) {
    console.log("\nFailed slugs:");
    results
      .filter((r) => r.status === "error")
      .forEach((r) => console.log(`  - ${r.slug}: ${r.error}`));
  }
}

runAll();
