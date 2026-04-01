import type { Metadata } from "next"

import { AdsLandingPage } from "@/components/lp/AdsLandingPage"
import { JsonLd } from "@/components/marketing/shared/JsonLd"
import { breadcrumbJsonLd, faqJsonLd } from "@/lib/seo/json-ld"

export const metadata: Metadata = {
  title: "Automate Data Entry — AI Data Capture Software | Parsli",
  description:
    "Cut data entry costs by 80%. AI extracts data from invoices, PDFs, emails, and documents automatically. No code, no templates. Free plan included.",
  alternates: {
    canonical: "https://parsli.co/ads/data-entry-automation",
  },
  robots: { index: false, follow: false },
}

const faqs = [
  {
    question: "How much can I save by automating data entry?",
    answer:
      "Manual data entry costs $15-25 per document when you factor in labor, error correction, and processing time. Parsli processes documents for as low as $0.08/page — an 80-95% cost reduction. A team processing 100 documents/day saves $40,000+ per year.",
  },
  {
    question: "What types of documents can Parsli process?",
    answer:
      "Invoices, purchase orders, receipts, delivery notes, forms, contracts, bank statements, bills of lading, and any document with structured data. Parsli handles PDFs, images, scanned documents, emails, Word files, and Excel spreadsheets.",
  },
  {
    question: "Do I need to create templates for each document type?",
    answer:
      "No. Parsli uses AI (Google Gemini 2.5 Pro) that understands document content semantically. It adapts to new formats automatically — no templates, no rules, no regex. Just define your fields and the AI extracts them from any layout.",
  },
  {
    question: "How accurate is automated extraction vs. manual entry?",
    answer:
      "Parsli achieves 99% accuracy — higher than most manual data entry (which typically has a 1-4% error rate per field). The AI reads context, tables, and relationships, not just individual characters.",
  },
  {
    question: "Can I integrate with my existing systems?",
    answer:
      "Yes. Parsli connects to 5,000+ apps via Zapier, Make, webhooks, and REST API. Push extracted data directly to your ERP, CRM, accounting software, database, or Google Sheets.",
  },
  {
    question: "How long does it take to set up?",
    answer:
      "Under 2 minutes. Create a parser, define your fields with the visual schema builder, and start uploading documents or forwarding emails. No IT department needed, no integration project.",
  },
]

export default function DataEntryAutomationLandingPage() {
  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", url: "https://parsli.co" },
          {
            name: "Data Entry Automation",
            url: "https://parsli.co/ads/data-entry-automation",
          },
        ])}
      />
      <JsonLd data={faqJsonLd(faqs)} />

      <AdsLandingPage
        page="data-entry-automation"
        hero={{
          badge: "Stop Manual Data Entry",
          headline: "Automate Data Entry — Save 6+ Hours Per Week",
          subheadline:
            "AI extracts data from invoices, PDFs, emails, and documents automatically. Cut processing costs from $15 to under $0.10 per document. No code. No templates. Set up in minutes.",
          ctaText: "Start Free — 30 Pages/Month",
          ctaHref: "/login?mode=signup",

        }}
        heroAnimation={{
          docTitle: "RECEIPT",
          docRef: "#REC-45019",
          docLines: [
            "Store: Office Depot #1247",
            "Date: March 26, 2026",
            "Item: HP LaserJet Toner x2",
            "Subtotal: $189.98",
            "Tax: $16.52 | Total: $206.50",
          ],
          docFooterLeft: "Scanned image",
          docFooterRight: "03/26/2026",
          fields: [
            { key: "store", value: "Office Depot #1247" },
            { key: "date", value: "2026-03-26" },
            { key: "item", value: "HP LaserJet Toner x2" },
            { key: "subtotal", value: "$189.98" },
            { key: "total", value: "$206.50" },
          ],
        }}
        stats={[
          { value: "80%", label: "Cost Reduction", icon: "TrendingDown" },
          { value: "99%", label: "Accuracy", icon: "ShieldCheck" },
          { value: "<3s", label: "Per Document", icon: "Timer" },
          { value: "$0.08", label: "Per Page", icon: "DollarSign" },
        ]}
        painPoints={{
          title: "The real cost of manual data entry",
          subtitle:
            "Every document you process manually costs time, money, and accuracy.",
          items: [
            { text: "Your team spends hours per day typing data from invoices and documents into spreadsheets and systems" },
            { text: "Manual data entry has a 1-4% error rate per field — multiply that across hundreds of documents" },
            { text: "Processing backlogs grow during peak periods, delaying invoicing, payments, and reporting" },
            { text: "Hiring more data entry staff is expensive ($35K-45K/year per FTE) and doesn't scale" },
            { text: "Legacy OCR tools need per-template configuration and break when document layouts change" },
            { text: "Enterprise data capture software costs $500+/month and takes weeks to deploy" },
          ],
        }}
        howItWorks={{
          title: "Automate data entry in 3 steps",
          steps: [
            {
              step: "1",
              title: "Send Documents to Parsli",
              description:
                "Upload PDFs and images, forward emails, or send documents via REST API. Any ingestion method works.",
            },
            {
              step: "2",
              title: "AI Extracts Your Data",
              description:
                "Define the fields you need — amounts, dates, vendor names, line items — and the AI extracts them from any document format.",
            },
            {
              step: "3",
              title: "Data Flows to Your Systems",
              description:
                "Structured data pushes to your ERP, CRM, accounting software, or spreadsheets via Zapier, webhooks, or API.",
            },
          ],
        }}
        features={{
          title: "Why teams automate data entry with Parsli",
          items: [
            {
              title: "AI Data Extraction",
              description:
                "Google Gemini 2.5 Pro reads documents like a human — understanding context, tables, and relationships across any format.",
              icon: "Brain",
            },
            {
              title: "Any Document Type",
              description:
                "Invoices, POs, receipts, forms, BOLs, bank statements — if it has data, Parsli can extract it.",
              icon: "FileText",
            },
            {
              title: "No Templates Needed",
              description:
                "Unlike legacy OCR, Parsli doesn't need per-format templates. The AI adapts to new document layouts automatically.",
              icon: "Settings",
            },
            {
              title: "Sub-3-Second Processing",
              description:
                "Documents are processed in under 3 seconds. Process hundreds per hour instead of dozens per day.",
              icon: "Zap",
            },
            {
              title: "5,000+ Integrations",
              description:
                "Zapier, Make, Google Sheets, webhooks, REST API. Push data to any system in your stack.",
              icon: "Plug",
            },
            {
              title: "ROI in Week One",
              description:
                "At $0.08/page vs. $15+ for manual entry, Parsli pays for itself from the first batch of documents.",
              icon: "DollarSign",
            },
          ],
        }}
        comparison={{
          title: "Cost comparison: manual vs. automated",
          subtitle: "Based on processing 100 documents per month.",
          rows: [
            { feature: "Cost per document", them: "$15-25 (manual)", parsli: "$0.08/page" },
            { feature: "Processing time", them: "10-15 min each", parsli: "< 3 seconds" },
            { feature: "Error rate", them: "1-4% per field", parsli: "< 1%" },
            { feature: "Monthly cost (100 docs)", them: "$1,500-2,500", parsli: "$20" },
            { feature: "Scale capacity", them: "Limited by headcount", parsli: "Unlimited" },
            { feature: "Setup time", them: "N/A (ongoing labor)", parsli: "2 minutes" },
          ],
        }}
        faqs={faqs}
        finalCta={{
          title: "Stop paying $15 per document for data entry",
          subtitle:
            "Automate with AI for $0.08/page. Free plan included — no credit card required.",
          ctaText: "Start Free — Automate Data Entry Now",
          ctaHref: "/login?mode=signup",
        }}
      />
    </>
  )
}
