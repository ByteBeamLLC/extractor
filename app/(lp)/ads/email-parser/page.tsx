import type { Metadata } from "next"

import { AdsLandingPage } from "@/components/lp/AdsLandingPage"
import { JsonLd } from "@/components/marketing/shared/JsonLd"
import { breadcrumbJsonLd, faqJsonLd } from "@/lib/seo/json-ld"

export const metadata: Metadata = {
  title: "AI Email Parser — Extract Data From Emails Automatically | Parsli",
  description:
    "Turn emails into structured data automatically. AI-powered email parsing software extracts invoices, orders, and leads from your inbox. No code. Free plan included.",
  alternates: {
    canonical: "https://parsli.co/ads/email-parser",
  },
  robots: { index: false, follow: false },
}

const faqs = [
  {
    question: "How does Parsli parse emails?",
    answer:
      "Forward emails to your unique Parsli inbox (or connect via API). The AI reads the email body and attachments, extracts the fields you defined in your schema, and pushes structured data to your connected apps — Google Sheets, Zapier, webhooks, or your database.",
  },
  {
    question: "What types of emails can Parsli parse?",
    answer:
      "Any email with structured or semi-structured data: invoices, purchase orders, shipping confirmations, lead form notifications, booking confirmations, delivery notices, and more. You define the schema — Parsli extracts exactly the fields you need.",
  },
  {
    question: "How accurate is the extraction?",
    answer:
      "Parsli uses Google Gemini 2.5 Pro for extraction, achieving 99%+ accuracy on standard email formats. The AI understands context and layout, not just pattern matching, so it handles format variations across senders automatically.",
  },
  {
    question: "Is there a free plan?",
    answer:
      "Yes. The Free plan includes 30 pages per month — enough to test with real emails. No credit card required. Paid plans start at $16/month (annual) for 250 pages.",
  },
  {
    question: "How long does setup take?",
    answer:
      "Under 2 minutes. Create a parser, define your fields with the no-code schema builder, and start forwarding emails. No templates to configure, no rules to write — the AI handles format variations automatically.",
  },
  {
    question: "Can I connect to Gmail and Outlook?",
    answer:
      "Yes. Set up email forwarding from Gmail, Outlook, or any email provider to your Parsli parser address. Emails are processed automatically as they arrive. You can also use the REST API or Zapier for more complex workflows.",
  },
]

export default function EmailParserLandingPage() {
  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", url: "https://parsli.co" },
          { name: "AI Email Parser", url: "https://parsli.co/ads/email-parser" },
        ])}
      />
      <JsonLd data={faqJsonLd(faqs)} />

      <AdsLandingPage
        page="email-parser"
        hero={{
          badge: "AI-Powered Email Parsing",
          headline: "Turn Emails Into Structured Data — Automatically",
          subheadline:
            "Stop copy-pasting data from emails. Parsli's AI reads invoices, orders, and leads from your inbox and pushes structured data to your apps. 99% accuracy. No code. Set up in 2 minutes.",
          ctaText: "Start Free — 30 Pages/Month",
          ctaHref: "/login",

        }}
        heroAnimation={{
          docTitle: "ORDER CONFIRMATION",
          docRef: "#ORD-94012",
          docLines: [
            "From: orders@acmecorp.com",
            "Customer: Jane Smith",
            "Order: #PO-2026-1847",
            "Amount: $3,250.00",
            "Ship to: 440 N Wabash, Chicago",
          ],
          docFooterLeft: "via Gmail",
          docFooterRight: "03/28/2026",
          fields: [
            { key: "sender", value: "orders@acmecorp.com" },
            { key: "customer", value: "Jane Smith" },
            { key: "order_number", value: "PO-2026-1847" },
            { key: "amount", value: "$3,250.00" },
            { key: "ship_to", value: "440 N Wabash, Chicago" },
          ],
        }}
        stats={[
          { value: "99%", label: "Extraction Accuracy", icon: "ShieldCheck" },
          { value: "<3s", label: "Per Email", icon: "Zap" },
          { value: "2 min", label: "Setup Time", icon: "Clock" },
          { value: "$0.08", label: "Per Page", icon: "DollarSign" },
        ]}
        painPoints={{
          title: "Sound familiar?",
          subtitle:
            "If you're manually processing email data, you're losing hours every week.",
          items: [
            { text: "Copying and pasting invoice data from emails into spreadsheets — for every single order" },
            { text: "Emails from different senders use different formats, so you can't write reliable rules" },
            { text: "Important emails slip through the cracks when volume spikes — missed orders, missed payments" },
            { text: "Zapier's built-in email parser breaks whenever the sender changes their template" },
            { text: "Your team spends 2-4 hours/day on email data entry instead of higher-value work" },
            { text: "You've tried regex and parsing rules, but maintaining them is a full-time job" },
          ],
        }}
        howItWorks={{
          title: "How Parsli parses your emails",
          steps: [
            {
              step: "1",
              title: "Forward Emails to Parsli",
              description:
                "Set up auto-forwarding from Gmail, Outlook, or any provider. Emails arrive in your Parsli parser inbox instantly.",
            },
            {
              step: "2",
              title: "AI Extracts Your Data",
              description:
                "Define the fields you need — invoice number, amount, sender, line items — and the AI extracts them from any email format.",
            },
            {
              step: "3",
              title: "Data Flows to Your Apps",
              description:
                "Structured data pushes to Google Sheets, your CRM, ERP, or any app via Zapier, Make, webhooks, or REST API.",
            },
          ],
        }}
        features={{
          title: "Why teams choose Parsli for email parsing",
          items: [
            {
              title: "AI-Powered, Not Rule-Based",
              description:
                "Google Gemini 2.5 Pro understands email content semantically. No regex, no templates, no rules to maintain.",
              icon: "Brain",
            },
            {
              title: "Any Email Format",
              description:
                "Invoices, orders, shipping notifications, lead forms — the AI adapts to any sender's format automatically.",
              icon: "Mail",
            },
            {
              title: "Attachments Included",
              description:
                "Parse both email body and PDF/image attachments in a single workflow. Invoices, receipts, and documents extracted together.",
              icon: "FileText",
            },
            {
              title: "5,000+ Integrations",
              description:
                "Connect to Google Sheets, Zapier, Make, webhooks, and REST API. Push data anywhere your workflow needs it.",
              icon: "Plug",
            },
            {
              title: "No-Code Schema Builder",
              description:
                "Define extraction fields visually. Add, rename, or restructure fields without touching code.",
              icon: "Settings",
            },
            {
              title: "Real-Time Dashboard",
              description:
                "Monitor extraction results, accuracy, and volume in real-time. Export to CSV or JSON anytime.",
              icon: "BarChart3",
            },
          ],
        }}
        comparison={{
          title: "Parsli vs. traditional email parsing",
          rows: [
            { feature: "Setup time", them: "Hours to days", parsli: "< 2 minutes" },
            { feature: "New sender formats", them: "Manual rules update", parsli: "Automatic" },
            { feature: "Accuracy", them: "70-85%", parsli: "99%" },
            { feature: "Attachments", them: "Separate workflow", parsli: "Built-in" },
            { feature: "Integrations", them: "Limited", parsli: "5,000+ apps" },
            { feature: "Free plan", them: "Rarely", parsli: "30 pages/mo" },
            { feature: "Pricing", them: "$50-200+/mo", parsli: "From $16/mo" },
          ],
        }}
        faqs={faqs}
        finalCta={{
          title: "Stop copy-pasting email data",
          subtitle:
            "Join thousands of teams that automated email processing with Parsli. Free forever up to 30 pages/month.",
          ctaText: "Start Free — No Credit Card",
          ctaHref: "/login",
        }}
      />
    </>
  )
}
