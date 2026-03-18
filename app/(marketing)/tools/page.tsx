import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { AuthButton } from "@/components/marketing/shared/AuthButton"

const categories = [
  {
    title: "PDF Tools",
    tools: [
      {
        slug: "pdf-to-excel",
        title: "PDF to Excel Converter",
        description:
          "Upload a PDF and get a clean Excel or CSV download. Table extraction preserves rows, columns, and headers.",
      },
      {
        slug: "pdf-merger",
        title: "PDF Merger",
        description:
          "Combine multiple PDF files into a single document. Reorder pages before merging.",
      },
      {
        slug: "pdf-splitter",
        title: "PDF Splitter",
        description:
          "Split PDFs into individual pages or extract specific page ranges. Download as ZIP.",
      },
      {
        slug: "pdf-compressor",
        title: "PDF Compressor",
        description:
          "Reduce PDF file size while maintaining quality. Great for email attachments.",
      },
      {
        slug: "pdf-page-remover",
        title: "PDF Page Remover",
        description:
          "Delete unwanted pages from your PDF documents. Select specific pages to remove.",
      },
      {
        slug: "pdf-rotate",
        title: "PDF Page Rotator",
        description:
          "Rotate PDF pages 90°, 180°, or 270°. Fix scanned documents and sideways pages.",
      },
      {
        slug: "image-to-pdf",
        title: "Image to PDF Converter",
        description:
          "Convert JPG, PNG, and other images into a single PDF document.",
      },
    ],
  },
  {
    title: "OCR & Text Extraction",
    tools: [
      {
        slug: "image-to-text",
        title: "Image to Text (OCR)",
        description:
          "Extract text from images using AI-powered OCR. Supports 12 languages.",
      },
      {
        slug: "pdf-to-text",
        title: "PDF to Text Extractor",
        description:
          "Extract all text content from PDF files. Works with text-based PDFs instantly.",
      },
      {
        slug: "handwriting-to-text",
        title: "Handwriting to Text",
        description:
          "Convert handwritten notes and documents into digital, editable text.",
      },
      {
        slug: "screenshot-to-text",
        title: "Screenshot to Text",
        description:
          "Extract text from screenshots. Perfect for copying text from images and locked PDFs.",
      },
      {
        slug: "photo-to-text",
        title: "Photo to Text",
        description:
          "Convert photographed documents, signs, and printed text into editable text.",
      },
    ],
  },
  {
    title: "Data Conversion",
    tools: [
      {
        slug: "excel-to-json",
        title: "Excel to JSON",
        description:
          "Convert Excel spreadsheets (.xlsx, .xls) to structured JSON format.",
      },
      {
        slug: "json-to-excel",
        title: "JSON to Excel",
        description:
          "Convert JSON data into downloadable Excel spreadsheets (.xlsx).",
      },
      {
        slug: "excel-to-csv",
        title: "Excel to CSV",
        description:
          "Convert Excel files to CSV format for easy data import and processing.",
      },
      {
        slug: "csv-to-excel",
        title: "CSV to Excel",
        description:
          "Convert CSV files into formatted Excel spreadsheets with proper columns.",
      },
    ],
  },
  {
    title: "AI Document Extraction",
    tools: [
      {
        slug: "invoice-parser",
        title: "Invoice Parser",
        description:
          "Extract data from invoices — vendor info, line items, totals, and payment details.",
      },
      {
        slug: "bol-parser",
        title: "BOL Parser",
        description:
          "Extract data from bills of lading — shipper, consignee, weight, freight class, and PRO numbers.",
      },
      {
        slug: "receipt-scanner",
        title: "Receipt Scanner",
        description:
          "Scan receipts and extract transaction details, totals, and merchant info.",
      },
      {
        slug: "bank-statement-parser",
        title: "Bank Statement Parser",
        description:
          "Extract transactions, balances, and account details from bank statements.",
      },
      {
        slug: "bank-statement-to-excel",
        title: "Bank Statement to Excel",
        description:
          "Convert bank statement PDFs to Excel spreadsheets. Preserves transaction tables, dates, and amounts.",
      },
      {
        slug: "bank-statement-to-csv",
        title: "Bank Statement to CSV",
        description:
          "Convert bank statement PDFs to CSV format for import into accounting software like QuickBooks, Xero, or Wave.",
      },
      {
        slug: "resume-parser",
        title: "Resume Parser",
        description:
          "Extract structured data from resumes — contact info, experience, skills, and education.",
      },
      {
        slug: "pdf-table-extractor",
        title: "PDF Table Extractor",
        description:
          "Extract tables from PDF documents into structured, usable data.",
      },
      {
        slug: "ai-summarizer",
        title: "AI Document Summarizer",
        description:
          "Extract and summarize key information from any document instantly.",
      },
    ],
  },
]

export const metadata: Metadata = {
  title: "25 Free Document Tools — PDF, OCR, Data Conversion & More | Parsli",
  description:
    "Free online tools for PDF merging, splitting, OCR text extraction, data conversion, and document parsing. No signup required. 100% browser-based and private.",
  keywords: [
    "free pdf tools",
    "pdf merger",
    "pdf splitter",
    "pdf compressor",
    "image to text",
    "ocr online free",
    "excel to json",
    "invoice parser",
    "receipt scanner",
    "pdf to excel",
    "document tools",
    "free online tools",
  ],
  alternates: {
    canonical: "https://parsli.co/tools",
  },
  openGraph: {
    title: "25 Free Document Tools — PDF, OCR & More",
    description:
      "Free online tools for PDF processing, OCR text extraction, data conversion, and document parsing. No signup required.",
    url: "https://parsli.co/tools",
    images: [
      {
        url: "https://parsli.co/parsli-og.png",
        width: 1200,
        height: 630,
        alt: "Parsli Free Tools",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "25 Free Document Tools — PDF, OCR & More",
    description:
      "Free online tools for PDF processing, OCR, data conversion, and document parsing.",
    images: ["https://parsli.co/parsli-og.png"],
  },
}

export default function ToolsPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative pt-28 pb-16 sm:pt-36 sm:pb-20">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-primary/5 rounded-full blur-3xl" />
        </div>
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight leading-[1.1] mb-6">
            Free Document Parsing Tools
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            25 free tools for PDF processing, OCR text extraction, data
            conversion, and document parsing. No signup required — everything
            runs in your browser.
          </p>
        </div>
      </section>

      {/* Tools by category */}
      <section className="pb-16">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 space-y-16">
          {categories.map((category) => (
            <div key={category.title}>
              <h2 className="text-xl sm:text-2xl font-bold mb-6">
                {category.title}
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {category.tools.map((tool) => (
                  <Link
                    key={tool.slug}
                    href={`/tools/${tool.slug}`}
                    className="group rounded-xl border bg-card p-5 hover:border-primary/30 transition-colors"
                  >
                    <h3 className="font-semibold mb-1.5 group-hover:text-primary transition-colors">
                      {tool.title}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {tool.description}
                    </p>
                    <span className="inline-flex items-center gap-1 text-sm text-primary mt-3">
                      Use tool
                      <ArrowRight className="h-3 w-3" />
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer CTA */}
      <section className="pb-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl border bg-muted/30 p-10 text-center">
            <h2 className="text-2xl font-bold mb-3">
              Need to automate document processing?
            </h2>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Parsli uses AI to extract structured data from any document at
              scale. Free forever up to 30 pages/month.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <AuthButton
                href="/login"
                className="text-base px-8 h-12"
                showArrow
              >
                Try Parsli Free
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
