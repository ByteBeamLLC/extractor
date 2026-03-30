import type { Metadata } from "next"

import { AdsLandingPage } from "@/components/lp/AdsLandingPage"
import { JsonLd } from "@/components/marketing/shared/JsonLd"
import { breadcrumbJsonLd, faqJsonLd } from "@/lib/seo/json-ld"

export const metadata: Metadata = {
  title: "Zapier Email Parser Alternative — More Accurate, More Reliable | Parsli",
  description:
    "Outgrowing Zapier's email parser? Parsli uses AI for 99% accuracy, handles attachments, and never breaks when formats change. Free plan included. Migrate in minutes.",
  alternates: {
    canonical: "https://parsli.co/ads/zapier-alternative",
  },
  robots: { index: false, follow: false },
}

const faqs = [
  {
    question: "Why switch from Zapier Email Parser to Parsli?",
    answer:
      "Zapier's parser relies on template matching — you highlight fields in a sample email and it looks for the same pattern. When senders change their email format, it breaks. Parsli uses AI (Google Gemini 2.5 Pro) that understands content semantically, so it handles format changes automatically. It also parses attachments, which Zapier's parser cannot.",
  },
  {
    question: "Can I still use Zapier with Parsli?",
    answer:
      "Absolutely. Parsli integrates natively with Zapier. You can trigger Zaps when Parsli extracts data — getting the best of both worlds: AI-powered extraction from Parsli, and workflow automation from Zapier.",
  },
  {
    question: "How hard is it to migrate from Zapier Email Parser?",
    answer:
      "Migration takes under 5 minutes. Create a parser in Parsli, define your fields with the visual schema builder, and redirect your email forwarding to your new Parsli address. Your Zapier workflows stay the same — just swap the trigger.",
  },
  {
    question: "Does Parsli handle email attachments?",
    answer:
      "Yes. Parsli parses both the email body and any PDF, image, or document attachments in a single workflow. Zapier Email Parser only handles the email body text.",
  },
  {
    question: "What about pricing compared to Zapier?",
    answer:
      "Parsli's Free plan includes 30 pages/month (no credit card required). Paid plans start at $16/month for 250 pages. Zapier's email parser is bundled with Zapier plans starting at $19.99/month — but extraction quality is limited to template matching.",
  },
  {
    question: "Is Parsli compatible with Gmail and Outlook?",
    answer:
      "Yes. Set up auto-forwarding from Gmail, Outlook, or any email provider. Emails are processed automatically as they arrive, just like Zapier Email Parser but with AI-powered accuracy.",
  },
]

export default function ZapierAlternativeLandingPage() {
  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", url: "https://parsli.co" },
          {
            name: "Zapier Email Parser Alternative",
            url: "https://parsli.co/ads/zapier-alternative",
          },
        ])}
      />
      <JsonLd data={faqJsonLd(faqs)} />

      <AdsLandingPage
        page="zapier-alternative"
        hero={{
          badge: "Zapier Email Parser Alternative",
          headline: "Zapier Email Parser Keeps Breaking? There's a Better Way.",
          subheadline:
            "Parsli uses AI instead of templates. It doesn't break when email formats change, it parses attachments too, and it's 99% accurate. Migrate in under 5 minutes.",
          ctaText: "Try Parsli Free",
          ctaHref: "/login",

        }}
        heroAnimation={{
          docTitle: "SHIPPING NOTIFICATION",
          docRef: "#SHP-60291",
          docLines: [
            "From: shipping@supplier.io",
            "Tracking: 1Z999AA10123456784",
            "Carrier: UPS Ground",
            "ETA: March 31, 2026",
            "Items: 3 packages",
          ],
          docFooterLeft: "via Outlook",
          docFooterRight: "03/27/2026",
          fields: [
            { key: "sender", value: "shipping@supplier.io" },
            { key: "tracking", value: "1Z999AA10123456784" },
            { key: "carrier", value: "UPS Ground" },
            { key: "eta", value: "2026-03-31" },
            { key: "package_count", value: "3" },
          ],
        }}
        stats={[
          { value: "99%", label: "Extraction Accuracy", icon: "ShieldCheck" },
          { value: "0", label: "Templates to Build", icon: "RefreshCw" },
          { value: "<5 min", label: "Migration Time", icon: "Clock" },
          { value: "$16", label: "Starting Price/mo", icon: "DollarSign" },
        ]}
        painPoints={{
          title: "Why Zapier Email Parser frustrates teams",
          subtitle:
            "If any of these sound familiar, you've outgrown template-based parsing.",
          items: [
            { text: "Parser breaks every time a sender updates their email template — and you have to re-train it manually" },
            { text: "Highlighting fields in sample emails is tedious and error-prone — one missed click and data is wrong" },
            { text: "Can't parse PDF or image attachments — you need a separate tool for invoices and receipts" },
            { text: "Accuracy degrades with email format variations — 70-80% hit rate means constant manual review" },
            { text: "No way to extract structured data from tables, line items, or nested content in emails" },
            { text: "Debugging failed parses is painful — no clear error messages, just missing or wrong data" },
          ],
        }}
        howItWorks={{
          title: "Migrate from Zapier parser in 3 steps",
          steps: [
            {
              step: "1",
              title: "Create a Parser in Parsli",
              description:
                "Sign up free and create a new email parser. Define the fields you need with the visual schema builder — no templates to train.",
            },
            {
              step: "2",
              title: "Redirect Your Email Forwarding",
              description:
                "Point your email forwarding to your new Parsli address. Takes 30 seconds in Gmail or Outlook settings.",
            },
            {
              step: "3",
              title: "Connect Your Zaps",
              description:
                "Swap your Zapier trigger from Email Parser to Parsli's native Zapier integration. Your downstream workflows stay the same.",
            },
          ],
        }}
        features={{
          title: "Everything Zapier parser does — and everything it can't",
          items: [
            {
              title: "AI, Not Templates",
              description:
                "Google Gemini 2.5 Pro reads emails semantically. No templates to train, no rules to maintain. Format changes? Handled automatically.",
              icon: "Brain",
            },
            {
              title: "Attachments Included",
              description:
                "Parse email body AND PDF/image attachments in one workflow. Invoices, receipts, POs — extracted together.",
              icon: "FileText",
            },
            {
              title: "Works With Zapier",
              description:
                "Native Zapier integration. Trigger Zaps when data is extracted. Your existing workflows stay intact.",
              icon: "Zap",
            },
            {
              title: "5,000+ Integrations",
              description:
                "Beyond Zapier: connect via Make, webhooks, REST API, and Google Sheets. Push data anywhere.",
              icon: "Plug",
            },
            {
              title: "Never Breaks",
              description:
                "When senders change email formats, Parsli adapts automatically. No re-training, no downtime, no manual fixes.",
              icon: "RefreshCw",
            },
            {
              title: "Easy Migration",
              description:
                "Redirect email forwarding and swap your Zapier trigger. Full migration in under 5 minutes.",
              icon: "ArrowRightLeft",
            },
          ],
        }}
        comparison={{
          title: "Parsli vs. Zapier Email Parser",
          subtitle: "Side-by-side comparison of features that matter.",
          rows: [
            { feature: "Extraction method", them: "Template matching", parsli: "AI (Gemini 2.5 Pro)" },
            { feature: "Accuracy", them: "70-80%", parsli: "99%" },
            { feature: "Parse attachments", them: "No", parsli: "Yes (PDF, images)" },
            { feature: "Format changes", them: "Breaks (re-train)", parsli: "Automatic" },
            { feature: "Table/line item extraction", them: "No", parsli: "Yes" },
            { feature: "Setup per email type", them: "10-30 min (template)", parsli: "0 min (AI adapts)" },
            { feature: "Zapier integration", them: "Built-in", parsli: "Native integration" },
            { feature: "Free plan", them: "No (bundled with Zapier)", parsli: "30 pages/mo free" },
          ],
        }}
        faqs={faqs}
        finalCta={{
          title: "Ready to stop re-training your email parser?",
          subtitle:
            "Switch to AI-powered parsing in under 5 minutes. Free plan included — no credit card required.",
          ctaText: "Start Free — Migrate in Minutes",
          ctaHref: "/login",
        }}
      />
    </>
  )
}
