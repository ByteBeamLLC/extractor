import type { Metadata } from "next"

import { AdsLandingPage } from "@/components/lp/AdsLandingPage"
import { JsonLd } from "@/components/marketing/shared/JsonLd"
import { breadcrumbJsonLd, faqJsonLd } from "@/lib/seo/json-ld"

export const metadata: Metadata = {
  title: "Automate Data Entry — AI Data Capture Software | Parsli",
  description:
    "Cut data entry costs by 80%. AI extracts data from invoices, PDFs, emails, and documents automatically. No code, no templates. Free plan included.",
  keywords: [
    "data entry automation", "automate data entry", "data entry automation software",
    "automated data entry", "ai data entry", "data entry tools",
    "auto data entry software", "data capture automation", "document data entry automation",
  ],
  alternates: {
    canonical: "https://parsli.co/data-entry-automation",
  },
  robots: { index: true, follow: true },
}

const faqs = [
  {
    question: "How much can I save by automating data entry?",
    answer:
      "Manual data entry costs $15-25 per document when you factor in labor, error correction, and processing time. Parsli processes documents for as low as $0.08/page — an 80-95% cost reduction. A team processing 100 documents/day saves $40,000+ per year.",
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
    question: "What document types can be automated?",
    answer:
      "Any document with structured data: invoices, receipts, bank statements, purchase orders, contracts, forms, emails, and attachments. PDFs, images, scans, Word docs, and Excel files are all supported.",
  },
]

export default function DataEntryAutomationPage() {
  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", url: "https://parsli.co" },
          {
            name: "Data Entry Automation",
            url: "https://parsli.co/data-entry-automation",
          },
        ])}
      />
      <JsonLd data={faqJsonLd(faqs)} />

      <AdsLandingPage
        page="data-entry-automation"
        hidePricing
        useHeroDemo
        socialProofHeadline="Trusted by teams replacing manual data entry in logistics, finance, and operations"
        demoSection={{
          title: "See how teams automate extraction",
          subtitle: "Click through the full workflow — from uploading a document to structured data flowing into your systems. Takes 60 seconds.",
        }}
        hero={{
          badge: "Stop Manual Data Entry",
          headline: "Automate\n{word}\nIn Seconds",
          rotatingWords: ["Data Extraction", "Data Entry", "Data Capture", "Document Processing", "Invoice Processing"],
          subheadline:
            "AI extracts structured data from any document — invoices, emails, PDFs, forms — and pushes it to your systems. Replace $15/document manual entry with $0.08/page automation.",
          ctaText: "Start Free — No Credit Card",
          ctaHref: "/login?mode=signup",
          secondaryCtaText: "See How It Works",
          trustLine: "Free forever (30 pages/mo). Set up in under 2 minutes.",
        }}
        stats={[
          { value: "6+ hrs", label: "Saved Per Week", icon: "Clock" },
          { value: "<3s", label: "To Process Any Document", icon: "Zap" },
          { value: "$40K+", label: "Saved Per Year (100 docs/day)", icon: "DollarSign" },
          { value: "99%", label: "More Accurate Than Manual", icon: "ShieldCheck" },
        ]}
        painPoints={{
          title: "Manual data entry is costing you more than you think",
          subtitle: "Every document processed by hand costs $15-25 in labor, errors, and delays.",
          items: [
            { text: "Your team spends hours per day typing data from invoices and documents into spreadsheets — that's $40K+/year in hidden labor costs" },
            { text: "Manual entry has a 1-4% error rate per field — multiply that across hundreds of documents and errors compound into real revenue loss" },
            { text: "Legacy OCR and template-based tools need per-format configuration, break when layouts change, and still require manual review" },
          ],
        }}
        howItWorks={{
          title: "Automate extraction in 3 steps",
          steps: [
            { step: "1", title: "Send Documents to Parsli", description: "Upload PDFs and images, forward emails, or send documents via REST API or webhook. Any ingestion method works." },
            { step: "2", title: "AI Extracts Your Data", description: "Define the fields you need — amounts, dates, vendor names, line items — and the AI extracts them from any document format automatically." },
            { step: "3", title: "Data Flows to Your Systems", description: "Structured data pushes to your ERP, CRM, accounting software, or spreadsheets via Zapier, Make, webhooks, or API." },
          ],
        }}
        testimonials={[
          { quote: "We replaced 3 hours of daily invoice data entry with a fully automated pipeline. Parsli paid for itself in the first week.", name: "Sarah M.", role: "Operations Manager", company: "Logistics Company" },
          { quote: "Our team used to manually key in 200+ documents per week. Now the AI handles it in minutes — more accurate than we ever were.", name: "David R.", role: "AP Lead", company: "Distribution Company" },
        ]}
        features={{
          title: "Why teams replace manual entry with Parsli",
          items: [
            { title: "AI-Powered Extraction", description: "Google Gemini 2.5 Pro reads documents like a human — understanding context, tables, and relationships. No templates or rules needed.", icon: "Brain" },
            { title: "Any Document, Any Format", description: "Invoices, POs, receipts, BOLs, forms, bank statements — PDFs, images, emails, Word, Excel. If it has data, Parsli extracts it.", icon: "FileText" },
            { title: "5,000+ Integrations", description: "Push extracted data to Google Sheets, your ERP, CRM, or any app via Zapier, Make, webhooks, or REST API.", icon: "Plug" },
          ],
        }}
        comparison={{
          title: "Manual entry vs. Parsli automation",
          subtitle: "Based on processing 100 documents per month.",
          rows: [
            { feature: "Cost per document", them: "$15-25 (manual labor)", parsli: "$0.08/page (AI)" },
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
          subtitle: "Join hundreds of teams automating extraction with AI. Free forever up to 30 pages/month.",
          ctaText: "Start Free — No Credit Card",
          ctaHref: "/login?mode=signup",
        }}
      />
    </>
  )
}
