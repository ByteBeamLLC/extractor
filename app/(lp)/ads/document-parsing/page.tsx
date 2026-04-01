import type { Metadata } from "next"

import { AdsLandingPage } from "@/components/lp/AdsLandingPage"
import { JsonLd } from "@/components/marketing/shared/JsonLd"
import { breadcrumbJsonLd, faqJsonLd } from "@/lib/seo/json-ld"

export const metadata: Metadata = {
  title: "AI Document Parser — Intelligent Document Processing | Parsli",
  description:
    "Parse PDFs, invoices, and documents with AI. Intelligent document processing that extracts structured data from any format. No templates. Free plan included.",
  alternates: {
    canonical: "https://parsli.co/ads/document-parsing",
  },
  robots: { index: false, follow: false },
}

const faqs = [
  {
    question: "How is Parsli different from pdfplumber or layoutparser?",
    answer:
      "Tools like pdfplumber and layoutparser require writing and maintaining code for every document format. Parsli uses AI (Google Gemini 2.5 Pro) to understand documents visually — no code, no templates, no regex. Define your fields once and the AI extracts them from any layout automatically.",
  },
  {
    question: "Can Parsli extract tables and line items from PDFs?",
    answer:
      "Yes. Parsli handles complex tables, nested line items, multi-page documents, and hierarchical data. Define table fields in your schema and the AI extracts all rows and columns with full structure preserved — even from scanned documents.",
  },
  {
    question: "What about scanned documents and low-quality images?",
    answer:
      "Parsli handles scanned documents, faded prints, rotated pages, handwritten annotations, and low-resolution images. Google Gemini's multimodal AI processes visual content that traditional OCR engines like Tesseract and i2ocr can't read reliably.",
  },
  {
    question: "How does pricing compare to enterprise IDP solutions?",
    answer:
      "Enterprise IDP platforms (ABBYY, Kofax, UiPath Document Understanding) cost $500-5,000+/month with long implementation timelines. Parsli starts free (30 pages/month) with paid plans from $16/month. Same AI-powered accuracy, fraction of the cost.",
  },
]

export default function DocumentParsingLandingPage() {
  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", url: "https://parsli.co" },
          {
            name: "AI Document Parser",
            url: "https://parsli.co/ads/document-parsing",
          },
        ])}
      />
      <JsonLd data={faqJsonLd(faqs)} />

      <AdsLandingPage
        page="document-parsing"
        hidePricing
        useHeroDemo
        socialProofHeadline="Trusted by teams parsing documents in finance, logistics, and operations"
        demoSection={{
          title: "See document parsing in action",
          subtitle: "Click through the full workflow — upload a document, define fields, and see structured data extracted in seconds.",
        }}
        hero={{
          badge: "AI Document Parser",
          headline: "Parse Any\n{word}\nWith AI",
          rotatingWords: ["PDF", "Document", "Invoice", "Scanned File", "Image", "Table"],
          subheadline:
            "AI extracts structured data from PDFs, scanned documents, images, and forms — including tables and line items. No code, no templates. Works in seconds.",
          ctaText: "Start Free — No Credit Card",
          ctaHref: "/login?mode=signup",
          secondaryCtaText: "See How It Works",
          trustLine: "Free forever (30 pages/mo). No code required.",
        }}
        stats={[
          { value: "99%", label: "More Accurate Than OCR", icon: "ShieldCheck" },
          { value: "<3s", label: "To Parse Any Document", icon: "Zap" },
          { value: "0 lines", label: "Of Code Required", icon: "FileText" },
          { value: "$0.08", label: "Per Page (vs $500+/mo for IDP)", icon: "DollarSign" },
        ]}
        painPoints={{
          title: "Tired of writing code to extract data from documents?",
          subtitle:
            "pdfplumber, layoutparser, Tesseract — they work until the format changes. Then you're back to debugging.",
          items: [
            { text: "Code-based tools (pdfplumber, layoutparser) need custom scripts per document format — and break when layouts change" },
            { text: "Traditional OCR reads characters but can't understand tables, context, or relationships — accuracy tops out at 70-85%" },
            { text: "Enterprise IDP solutions (ABBYY, Kofax) cost $500+/month, take weeks to deploy, and still need template configuration" },
          ],
        }}
        howItWorks={{
          title: "Document parsing in 3 steps",
          steps: [
            {
              step: "1",
              title: "Upload Documents",
              description:
                "Drag and drop PDFs, images, or scanned docs. Or automate intake via email forwarding, API, or webhook.",
            },
            {
              step: "2",
              title: "AI Extracts Structured Data",
              description:
                "Define your fields — text, numbers, dates, tables, line items — and the AI extracts them from any format without templates or code.",
            },
            {
              step: "3",
              title: "Export or Integrate",
              description:
                "Download as CSV/JSON, push to Google Sheets, or route to any system via Zapier, Make, webhooks, or REST API.",
            },
          ],
        }}
        testimonials={[
          {
            quote: "We replaced 500 lines of pdfplumber code with Parsli. It handles every layout our vendors send — no maintenance needed.",
            name: "Mike T.",
            role: "Engineering Lead",
            company: "Fintech Startup",
          },
          {
            quote: "Table extraction actually works. We parse complex invoices with nested line items and it gets every row right.",
            name: "Lisa C.",
            role: "Data Operations",
            company: "Accounting Firm",
          },
        ]}
        features={{
          title: "Why teams switch from code and OCR to Parsli",
          items: [
            {
              title: "AI-Powered — Not Template-Based",
              description:
                "Google Gemini 2.5 Pro reads documents like a human — understanding layout, context, tables, and relationships. No templates, no regex, no scripts.",
              icon: "Brain",
            },
            {
              title: "Table & Line Item Extraction",
              description:
                "Complex tables, multi-row line items, nested data — extracted with full structure preserved from any document format.",
              icon: "Layers",
            },
            {
              title: "PDFs, Scans, Images, Handwriting",
              description:
                "Handles scanned documents, faded prints, rotated pages, handwritten notes, and low-quality images that OCR tools can't read.",
              icon: "FileText",
            },
          ],
        }}
        comparison={{
          title: "Parsli vs. other document parsing approaches",
          rows: [
            { feature: "Setup", them: "Write code / configure templates", parsli: "Define fields visually (2 min)" },
            { feature: "Accuracy", them: "70-85% (OCR/regex)", parsli: "99% (AI)" },
            { feature: "New formats", them: "New code or template per layout", parsli: "AI adapts automatically" },
            { feature: "Tables & line items", them: "Custom parsing logic required", parsli: "Built-in, works on any layout" },
            { feature: "Scanned docs", them: "Limited or no support", parsli: "Full support inc. handwriting" },
            { feature: "Price", them: "$500+/mo (enterprise) or dev time", parsli: "Free forever (30 pg/mo)" },
          ],
        }}
        faqs={faqs}
        finalCta={{
          title: "Parse your first document in 2 minutes",
          subtitle:
            "Upload a PDF, see structured data. No code, no templates, no credit card.",
          ctaText: "Start Free — No Credit Card",
          ctaHref: "/login?mode=signup",
        }}
      />
    </>
  )
}
