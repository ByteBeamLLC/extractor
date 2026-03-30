import type { Metadata } from "next"

import { AdsLandingPage } from "@/components/lp/AdsLandingPage"
import { JsonLd } from "@/components/marketing/shared/JsonLd"
import { breadcrumbJsonLd, faqJsonLd } from "@/lib/seo/json-ld"

export const metadata: Metadata = {
  title: "AI Parsing Software — Automate Email & Document Extraction | Parsli",
  description:
    "Enterprise-grade parsing software that extracts data from emails, PDFs, and documents using AI. No-code setup. 5,000+ integrations. Free plan included.",
  alternates: {
    canonical: "https://parsli.co/ads/parsing-software",
  },
  robots: { index: false, follow: false },
}

const faqs = [
  {
    question: "What makes Parsli different from traditional parsing software?",
    answer:
      "Traditional parsing tools rely on templates and regex rules that break when formats change. Parsli uses Google Gemini 2.5 Pro AI to understand document content semantically — it adapts to new formats automatically without configuration.",
  },
  {
    question: "What file types does Parsli support?",
    answer:
      "PDFs, images (JPG, PNG, TIFF, HEIC), Word documents, Excel spreadsheets, emails (body + attachments), and scanned documents. The AI handles any document format you need to extract data from.",
  },
  {
    question: "Can I use Parsli without coding?",
    answer:
      "Yes. The entire workflow — creating parsers, defining schemas, setting up integrations — is no-code. You can also use the REST API if you prefer programmatic access.",
  },
  {
    question: "How does pricing work?",
    answer:
      "Parsli charges per page processed. The Free plan includes 30 pages/month. Paid plans start at $16/month (annual) for 250 pages, scaling to $199/month for 25,000 pages. No per-feature upsells.",
  },
  {
    question: "Is my data secure?",
    answer:
      "Yes. Documents are processed in memory and not stored beyond the extraction lifecycle. All data is encrypted in transit (TLS 1.3) and at rest. Parsli runs on enterprise-grade Supabase infrastructure.",
  },
  {
    question: "How fast is the extraction?",
    answer:
      "Most documents are processed in under 3 seconds. Email parsing happens in real-time as emails arrive. Batch processing via API can handle hundreds of documents per minute.",
  },
]

export default function ParsingSoftwareLandingPage() {
  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", url: "https://parsli.co" },
          { name: "AI Parsing Software", url: "https://parsli.co/ads/parsing-software" },
        ])}
      />
      <JsonLd data={faqJsonLd(faqs)} />

      <AdsLandingPage
        page="parsing-software"
        hero={{
          badge: "AI Parsing Software",
          headline: "Parsing Software That Actually Works — Powered by AI",
          subheadline:
            "Extract structured data from emails, PDFs, invoices, and documents in seconds. No templates to build, no rules to maintain. AI handles any format automatically.",
          ctaText: "Start Free — 30 Pages/Month",
          ctaHref: "/login",

        }}
        stats={[
          { value: "99%", label: "Extraction Accuracy", icon: "ShieldCheck" },
          { value: "<3s", label: "Processing Time", icon: "Zap" },
          { value: "5,000+", label: "App Integrations", icon: "Plug" },
          { value: "$0.08", label: "Per Page", icon: "DollarSign" },
        ]}
        painPoints={{
          title: "Why parsing software usually disappoints",
          subtitle:
            "Most parsing tools promise automation but deliver endless configuration.",
          items: [
            { text: "Template-based parsers need a new template for every document format — and break when layouts change" },
            { text: "Regex rules become an unmaintainable mess as the number of senders and formats grows" },
            { text: "Legacy OCR engines can't read low-quality scans, faded prints, or handwritten notes" },
            { text: "\"No-code\" tools still require hours of configuration per document type" },
            { text: "Accuracy tops out at 80-85% — meaning manual review is still required for every batch" },
            { text: "Enterprise solutions cost $500+/month and require IT involvement to set up" },
          ],
        }}
        howItWorks={{
          title: "How Parsli works",
          steps: [
            {
              step: "1",
              title: "Upload or Forward Documents",
              description:
                "Upload PDFs, images, or emails. Or set up email forwarding and API ingestion to automate document intake.",
            },
            {
              step: "2",
              title: "AI Extracts Structured Data",
              description:
                "Define your fields with the visual schema builder. The AI extracts data from any format — invoices, orders, forms, emails — without per-format configuration.",
            },
            {
              step: "3",
              title: "Data Pushes to Your Systems",
              description:
                "Extracted data flows to Google Sheets, your database, CRM, or any app via Zapier, Make, webhooks, or REST API.",
            },
          ],
        }}
        features={{
          title: "Enterprise-grade extraction, startup-simple setup",
          items: [
            {
              title: "AI-Powered Extraction",
              description:
                "Google Gemini 2.5 Pro understands documents like a human. It reads context, tables, and relationships — not just patterns.",
              icon: "Brain",
            },
            {
              title: "Email + Document Parsing",
              description:
                "Parse email bodies, PDF attachments, images, Word docs, and Excel files — all in one platform.",
              icon: "Mail",
            },
            {
              title: "No-Code Schema Builder",
              description:
                "Define extraction fields visually. Drag, rename, and restructure your schema without writing code.",
              icon: "Settings",
            },
            {
              title: "5,000+ Integrations",
              description:
                "Google Sheets, Zapier, Make, webhooks, and a full REST API. Connect Parsli to your entire stack.",
              icon: "Plug",
            },
            {
              title: "Handles Any Document",
              description:
                "Invoices, purchase orders, receipts, BOLs, forms, contracts — any document with data to extract.",
              icon: "FileText",
            },
            {
              title: "Real-Time Monitoring",
              description:
                "Track extractions, accuracy, and throughput in a real-time dashboard. Export results anytime.",
              icon: "BarChart3",
            },
          ],
        }}
        comparison={{
          title: "Parsli vs. traditional parsing software",
          rows: [
            { feature: "Setup per format", them: "Hours (templates/rules)", parsli: "0 min (AI adapts)" },
            { feature: "Format changes", them: "Breaks, needs fixing", parsli: "Handled automatically" },
            { feature: "Accuracy", them: "70-85%", parsli: "99%" },
            { feature: "Document types", them: "PDF only (usually)", parsli: "PDF, email, images, Word, Excel" },
            { feature: "Free plan", them: "14-day trial", parsli: "Free forever (30 pg/mo)" },
            { feature: "Starting price", them: "$50-500/mo", parsli: "$16/mo" },
          ],
        }}
        faqs={faqs}
        finalCta={{
          title: "Try the parsing software that actually works",
          subtitle:
            "No templates. No rules. No broken workflows. Just AI that reads documents like a human.",
          ctaText: "Start Free — No Credit Card",
          ctaHref: "/login",
        }}
      />
    </>
  )
}
