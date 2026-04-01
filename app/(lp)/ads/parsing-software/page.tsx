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
        hidePricing
        useHeroDemo
        socialProofHeadline="Trusted by teams in logistics, finance, and e-commerce"
        demoSection={{
          title: "See exactly what you'll get",
          subtitle: "Click through the full product — from creating your first parser to seeing structured data flow out. Takes 60 seconds.",
        }}
        hero={{
          badge: "AI Parsing Software",
          headline: "Extract Data From\nAny {word}\nAutomatically",
          rotatingWords: ["Email", "Invoice", "PDF", "Document", "Receipt", "Spreadsheet"],
          subheadline:
            "AI reads your emails, attachments, and documents like a human — and pushes structured data to your apps in seconds. No templates, no rules, no code.",
          ctaText: "Start Free — No Credit Card",
          ctaHref: "/login?mode=signup",
          secondaryCtaText: "See How It Works",
          trustLine: "Free forever (30 pages/mo). Set up in under 2 minutes.",
        }}
        stats={[
          { value: "90%", label: "Less Manual Work", icon: "TrendingDown" },
          { value: "<3s", label: "To Extract Any Document", icon: "Zap" },
          { value: "6+ hrs", label: "Saved Per Week", icon: "Clock" },
          { value: "$0.08", label: "Per Document (vs $15 Manual)", icon: "DollarSign" },
        ]}
        painPoints={{
          title: "Still copying data from documents by hand?",
          subtitle:
            "Manual data entry is slow, error-prone, and costs $15+ per document. Traditional parsing tools aren't much better.",
          items: [
            { text: "Template-based parsers need a new template for every document format — and break when layouts change" },
            { text: "Legacy OCR engines top out at 80-85% accuracy — you still review every batch manually" },
            { text: "Enterprise solutions cost $500+/month and take weeks to set up with IT involvement" },
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
        testimonials={[
          {
            quote: "We went from 3 hours of manual invoice entry per day to fully automated extraction. Parsli paid for itself in the first week.",
            name: "Sarah M.",
            role: "Operations Manager",
            company: "Logistics Company",
          },
          {
            quote: "The AI handles every format our vendors send — PDFs, scanned images, even handwritten notes. No templates to maintain.",
            name: "James K.",
            role: "Finance Lead",
            company: "E-commerce Brand",
          },
        ]}
        features={{
          title: "Why teams switch to Parsli",
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
              title: "5,000+ Integrations",
              description:
                "Google Sheets, Zapier, Make, webhooks, and a full REST API. Connect Parsli to your entire stack.",
              icon: "Plug",
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
          title: "Stop manual data entry today",
          subtitle:
            "Join hundreds of teams extracting data automatically. Free forever up to 30 pages/month.",
          ctaText: "Start Free — No Credit Card",
          ctaHref: "/login?mode=signup",
        }}
      />
    </>
  )
}
