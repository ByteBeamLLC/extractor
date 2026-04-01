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
    question: "How is Parsli different from Zapier's email parser?",
    answer:
      "Zapier's built-in parser uses rules and templates that break when senders change their format. Parsli uses AI (Google Gemini 2.5 Pro) that understands email content semantically — it adapts to format changes automatically. No rules to maintain.",
  },
  {
    question: "Can I parse email attachments too?",
    answer:
      "Yes. Parsli processes both the email body and PDF/image attachments in a single workflow. Invoices, receipts, and documents attached to emails are extracted together with the email data.",
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
        hidePricing
        useHeroDemo
        socialProofHeadline="Trusted by teams automating email workflows in sales, logistics, and finance"
        demoSection={{
          title: "See email parsing in action",
          subtitle: "Click through the full workflow — forward an email, extract structured data, push it to your apps. Takes 60 seconds.",
        }}
        hero={{
          badge: "AI Email Parser",
          headline: "Extract Data From\nAny {word}\nAutomatically",
          rotatingWords: ["Email", "Gmail", "Outlook", "Invoice Email", "Order Confirmation", "Inbox", "Attachment"],
          subheadline:
            "AI reads your emails, attachments, and inbox data — and pushes structured fields to your apps in seconds. No rules, no regex, no templates to maintain.",
          ctaText: "Start Free — No Credit Card",
          ctaHref: "/login?mode=signup",
          secondaryCtaText: "See How It Works",
          trustLine: "Free forever (30 pages/mo). Set up in under 2 minutes.",
        }}
        stats={[
          { value: "2-4 hrs", label: "Of Email Data Entry Eliminated Daily", icon: "Clock" },
          { value: "<3s", label: "To Parse Any Email", icon: "Zap" },
          { value: "0 rules", label: "To Write Or Maintain", icon: "FileText" },
          { value: "99%", label: "More Accurate Than Regex", icon: "ShieldCheck" },
        ]}
        painPoints={{
          title: "Still copy-pasting data from emails into spreadsheets?",
          subtitle:
            "Regex rules and Zapier's parser break every time a sender changes their format. You deserve better.",
          items: [
            { text: "Every sender uses a different email format — rules and templates break constantly, and you spend hours fixing them" },
            { text: "Copy-pasting invoice data, order details, and leads from emails eats 2-4 hours per day of your team's time" },
            { text: "Important emails slip through the cracks during volume spikes — missed orders, missed payments, missed leads" },
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
                "Define the fields you need — sender, amounts, order numbers, line items — and the AI extracts them from any email format.",
            },
            {
              step: "3",
              title: "Data Flows to Your Apps",
              description:
                "Structured data pushes to Google Sheets, your CRM, ERP, or any app via Zapier, Make, webhooks, or REST API.",
            },
          ],
        }}
        testimonials={[
          {
            quote: "We process 200+ order confirmation emails per day now. Before Parsli, that was a full-time person copy-pasting into spreadsheets.",
            name: "Rachel D.",
            role: "Operations Lead",
            company: "E-commerce Company",
          },
          {
            quote: "Zapier's parser broke every time a vendor changed their invoice template. Parsli's AI just handles it — zero maintenance.",
            name: "Tom H.",
            role: "Finance Manager",
            company: "Supply Chain Company",
          },
        ]}
        features={{
          title: "Why teams switch to Parsli for email parsing",
          items: [
            {
              title: "AI-Powered — Not Rule-Based",
              description:
                "Google Gemini 2.5 Pro understands email content semantically. No regex, no templates, no rules to maintain. Adapts to new senders automatically.",
              icon: "Brain",
            },
            {
              title: "Emails + Attachments Together",
              description:
                "Parse the email body and PDF/image attachments in a single workflow. Invoices, receipts, and order docs extracted together.",
              icon: "Mail",
            },
            {
              title: "5,000+ Integrations",
              description:
                "Push extracted data to Google Sheets, your CRM, ERP, or any app via Zapier, Make, webhooks, or REST API.",
              icon: "Plug",
            },
          ],
        }}
        comparison={{
          title: "Parsli vs. rule-based email parsers",
          rows: [
            { feature: "New sender formats", them: "Update rules manually", parsli: "AI adapts automatically" },
            { feature: "Accuracy", them: "Breaks on format changes", parsli: "99% across all formats" },
            { feature: "Attachments", them: "Separate workflow", parsli: "Built-in (email + PDF)" },
            { feature: "Setup time", them: "Hours per sender", parsli: "2 minutes total" },
            { feature: "Maintenance", them: "Ongoing rule fixes", parsli: "Zero" },
            { feature: "Pricing", them: "$50-200+/mo", parsli: "From $16/mo" },
          ],
        }}
        faqs={faqs}
        finalCta={{
          title: "Stop copy-pasting email data",
          subtitle:
            "Join hundreds of teams that automated email processing with AI. Free forever up to 30 pages/month.",
          ctaText: "Start Free — No Credit Card",
          ctaHref: "/login?mode=signup",
        }}
      />
    </>
  )
}
