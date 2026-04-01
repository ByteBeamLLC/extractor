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
    question: "What is intelligent document processing (IDP)?",
    answer:
      "IDP uses AI to automatically extract, classify, and structure data from documents — PDFs, images, emails, and scanned files. Unlike traditional OCR that just reads characters, IDP understands document context, tables, and relationships. Parsli is an IDP platform powered by Google Gemini 2.5 Pro.",
  },
  {
    question: "What document types can Parsli parse?",
    answer:
      "PDFs, scanned documents, images (JPG, PNG, TIFF, HEIC), Word documents, Excel spreadsheets, emails (body + attachments), invoices, purchase orders, receipts, forms, contracts, bank statements, and more. If it contains data, Parsli can extract it.",
  },
  {
    question: "How is Parsli different from OCR tools like ABBYY or Tesseract?",
    answer:
      "Traditional OCR reads characters from images but doesn't understand document structure. Parsli's AI understands context — it knows that a number next to 'Total' is a monetary amount, that a table has headers and rows, and that related fields belong together. This means 99% accuracy vs. 70-85% for raw OCR.",
  },
  {
    question: "Do I need to create templates for each document layout?",
    answer:
      "No. Template-based parsers (like Docparser) require a template per layout. Parsli's AI adapts to any layout automatically. Define your fields once, and the AI extracts them from any document format.",
  },
  {
    question: "Can I extract table and line item data?",
    answer:
      "Yes. Parsli handles complex tables, nested line items, multi-page documents, and hierarchical data structures. Define table fields in your schema and the AI extracts all rows and columns automatically.",
  },
  {
    question: "What about scanned and low-quality documents?",
    answer:
      "Parsli handles scanned documents, faded prints, rotated pages, handwritten annotations, and low-resolution images. Google Gemini's multimodal AI processes visual content that traditional OCR engines can't read.",
  },
  {
    question: "How does pricing compare to enterprise IDP solutions?",
    answer:
      "Enterprise IDP platforms (ABBYY, Kofax, UiPath Document Understanding) cost $500-5,000+/month with long implementation timelines. Parsli starts free (30 pages/month) with paid plans from $16/month. Same AI-powered accuracy, fraction of the cost and setup time.",
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
        hero={{
          badge: "Intelligent Document Processing",
          headline: "AI Document Parser — Extract Data From Any Document",
          subheadline:
            "Parse PDFs, scanned documents, invoices, and forms with AI. No templates, no rules — just define your fields and the AI extracts structured data from any format in seconds.",
          ctaText: "Start Free — 30 Pages/Month",
          ctaHref: "/login?mode=signup",

        }}
        heroAnimation={{
          docTitle: "FINANCIAL REPORT",
          docRef: "#Q1-2026",
          docLines: [
            "Company: Apex Holdings Ltd.",
            "Period: Q1 2026",
            "Revenue: $4,280,000",
            "Net Income: $612,400",
            "EPS: $2.14",
          ],
          docFooterLeft: "PDF — 12 pages",
          docFooterRight: "03/31/2026",
          fields: [
            { key: "company", value: "Apex Holdings Ltd." },
            { key: "period", value: "Q1 2026" },
            { key: "revenue", value: "$4,280,000" },
            { key: "net_income", value: "$612,400" },
            { key: "eps", value: "$2.14" },
          ],
        }}
        stats={[
          { value: "99%", label: "Extraction Accuracy", icon: "ShieldCheck" },
          { value: "<3s", label: "Per Document", icon: "Zap" },
          { value: "5,000+", label: "Integrations", icon: "Plug" },
          { value: "$0.08", label: "Per Page", icon: "DollarSign" },
        ]}
        painPoints={{
          title: "Why document parsing is harder than it looks",
          subtitle:
            "Traditional tools promise automation but create new problems.",
          items: [
            { text: "OCR reads characters but doesn't understand context — 'Total' next to a number means nothing to it" },
            { text: "Template-based parsers need a new template for every document layout and break when formats change" },
            { text: "Scanned documents, faded prints, and handwritten notes defeat traditional OCR engines" },
            { text: "Complex tables, multi-page documents, and nested data require expensive enterprise solutions" },
            { text: "Enterprise IDP platforms cost $500-5,000/month and take weeks to implement" },
            { text: "You end up with 80% automation and 20% manual cleanup — the worst of both worlds" },
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
                "Define your schema — fields, tables, nested objects — and the AI extracts data from any document format without templates.",
            },
            {
              step: "3",
              title: "Export or Integrate",
              description:
                "Download as CSV/JSON, push to Google Sheets, or route to any system via Zapier, Make, webhooks, or REST API.",
            },
          ],
        }}
        features={{
          title: "Document parsing powered by AI — not templates",
          subtitle:
            "Everything you need to extract data from documents at scale.",
          items: [
            {
              title: "Google Gemini 2.5 Pro",
              description:
                "State-of-the-art multimodal AI that reads documents like a human — understanding layout, context, tables, and relationships.",
              icon: "Brain",
            },
            {
              title: "Any Document Format",
              description:
                "PDFs, scans, images, emails, Word, Excel. Invoices, POs, receipts, forms, contracts, BOLs — all supported.",
              icon: "FileText",
            },
            {
              title: "No-Code Schema Builder",
              description:
                "Define extraction fields visually. Support for flat fields, tables, nested objects, and arrays.",
              icon: "Settings",
            },
            {
              title: "Table & Line Item Extraction",
              description:
                "Complex tables, multi-row line items, hierarchical data — extracted with full structure preserved.",
              icon: "Layers",
            },
            {
              title: "5,000+ Integrations",
              description:
                "Google Sheets, Zapier, Make, webhooks, REST API. Route extracted data anywhere in your workflow.",
              icon: "Plug",
            },
            {
              title: "Enterprise-Grade Security",
              description:
                "TLS 1.3 encryption, SOC 2 compliant infrastructure, documents processed in memory. Your data stays yours.",
              icon: "Lock",
            },
          ],
        }}
        comparison={{
          title: "Parsli vs. traditional document parsing",
          rows: [
            { feature: "Technology", them: "OCR + templates", parsli: "AI (Gemini 2.5 Pro)" },
            { feature: "Accuracy", them: "70-85%", parsli: "99%" },
            { feature: "Setup per format", them: "1-4 hours", parsli: "0 (AI adapts)" },
            { feature: "Scanned documents", them: "Limited quality", parsli: "Full support" },
            { feature: "Table extraction", them: "Basic or none", parsli: "Full structure" },
            { feature: "Free plan", them: "14-day trial", parsli: "Free forever (30 pg/mo)" },
            { feature: "Starting price", them: "$100-500/mo", parsli: "$16/mo" },
            { feature: "Implementation", them: "Weeks", parsli: "2 minutes" },
          ],
        }}
        faqs={faqs}
        finalCta={{
          title: "Parse your first document in 2 minutes",
          subtitle:
            "Upload a PDF, see structured data. Free forever up to 30 pages/month. No credit card required.",
          ctaText: "Start Free — Try It Now",
          ctaHref: "/login?mode=signup",
        }}
      />
    </>
  )
}
