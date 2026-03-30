import type { Metadata } from "next"

import { AdsLandingPage } from "@/components/lp/AdsLandingPage"
import { JsonLd } from "@/components/marketing/shared/JsonLd"
import { breadcrumbJsonLd, faqJsonLd } from "@/lib/seo/json-ld"

export const metadata: Metadata = {
  title: "Email to Spreadsheet — Auto-Extract Email Data to Sheets | Parsli",
  description:
    "Automatically extract data from emails into Google Sheets or Excel. AI parses invoices, orders, and confirmations from your inbox. No code. Free plan included.",
  alternates: {
    canonical: "https://parsli.co/ads/email-to-spreadsheet",
  },
  robots: { index: false, follow: false },
}

const faqs = [
  {
    question: "How does email to Google Sheets work?",
    answer:
      "Forward emails to your Parsli parser address (or set up auto-forwarding). The AI extracts the fields you defined — invoice number, amount, date, sender, etc. — and pushes each email's data as a new row in your Google Sheet automatically.",
  },
  {
    question: "Can I extract data from email attachments into Excel?",
    answer:
      "Yes. Parsli parses both the email body and attachments (PDFs, images, documents). Extract invoice data from a PDF attachment and push it to Excel or Google Sheets — all in one automated workflow.",
  },
  {
    question: "Does it work with Outlook and Gmail?",
    answer:
      "Yes. Set up auto-forwarding from Gmail, Outlook, Yahoo, or any email provider. Parsli processes emails as they arrive. You can also use Power Automate or Zapier to trigger Parsli from specific email rules.",
  },
  {
    question: "Can I choose which fields go into the spreadsheet?",
    answer:
      "Absolutely. Use the no-code schema builder to define exactly which fields you want extracted — amount, date, vendor, PO number, line items, etc. Each field becomes a column in your spreadsheet.",
  },
  {
    question: "What if the email format changes?",
    answer:
      "Parsli uses AI, not templates. When a sender changes their email format, Parsli adapts automatically. No re-configuration needed — your data keeps flowing to your spreadsheet.",
  },
  {
    question: "How much does it cost?",
    answer:
      "Free plan: 30 pages/month (no credit card). Starter: $16/month for 250 pages. Growth: $39/month for 1,000 pages. All plans include Google Sheets integration and unlimited spreadsheet connections.",
  },
]

export default function EmailToSpreadsheetLandingPage() {
  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", url: "https://parsli.co" },
          {
            name: "Email to Spreadsheet",
            url: "https://parsli.co/ads/email-to-spreadsheet",
          },
        ])}
      />
      <JsonLd data={faqJsonLd(faqs)} />

      <AdsLandingPage
        page="email-to-spreadsheet"
        hero={{
          badge: "Email to Spreadsheet — Automated",
          headline: "Email Data to Spreadsheet in Under 3 Seconds",
          subheadline:
            "Stop manually copying data from emails into Excel or Google Sheets. Parsli's AI reads every email and auto-fills your spreadsheet — invoices, orders, confirmations, anything.",
          ctaText: "Start Free — 30 Pages/Month",
          ctaHref: "/login",

        }}
        heroAnimation={{
          docTitle: "INVOICE EMAIL",
          docRef: "#INV-88432",
          docLines: [
            "From: billing@vendorco.com",
            "Invoice: INV-2026-0847",
            "Due Date: April 15, 2026",
            "Amount: $1,875.00",
            "Payment: Net 30",
          ],
          docFooterLeft: "→ Google Sheets",
          docFooterRight: "03/29/2026",
          fields: [
            { key: "sender", value: "billing@vendorco.com" },
            { key: "invoice_no", value: "INV-2026-0847" },
            { key: "due_date", value: "2026-04-15" },
            { key: "amount", value: "$1,875.00" },
            { key: "terms", value: "Net 30" },
          ],
        }}
        stats={[
          { value: "<3s", label: "Email → Spreadsheet", icon: "Zap" },
          { value: "99%", label: "Accuracy", icon: "ShieldCheck" },
          { value: "2 min", label: "Setup Time", icon: "Clock" },
          { value: "$0", label: "To Start", icon: "DollarSign" },
        ]}
        painPoints={{
          title: "Tired of copying email data into spreadsheets?",
          subtitle:
            "Manual email-to-spreadsheet workflows waste hours and introduce errors.",
          items: [
            { text: "Copying invoice amounts, dates, and vendor names from emails into Excel — one by one, every day" },
            { text: "Order confirmation emails pile up faster than you can process them into your tracking sheet" },
            { text: "Typos and missed fields from manual entry cause downstream billing and reporting errors" },
            { text: "Power Automate and Zapier email-to-sheet recipes break when email formats change" },
            { text: "You need data from attachments too, but that's a completely separate manual process" },
            { text: "Different senders = different formats = no single automation works for everything" },
          ],
        }}
        howItWorks={{
          title: "Email to spreadsheet in 3 steps",
          steps: [
            {
              step: "1",
              title: "Forward Emails to Parsli",
              description:
                "Set up auto-forwarding from Gmail or Outlook. Every email with data you need goes to your Parsli parser automatically.",
            },
            {
              step: "2",
              title: "AI Extracts the Data",
              description:
                "Define your columns — amount, date, sender, PO number, line items. The AI extracts them from any email format, including attachments.",
            },
            {
              step: "3",
              title: "Rows Appear in Your Sheet",
              description:
                "Each processed email becomes a new row in Google Sheets or triggers an Excel update via Zapier/Make. Fully automatic.",
            },
          ],
        }}
        features={{
          title: "Why Parsli for email to spreadsheet",
          items: [
            {
              title: "Google Sheets Integration",
              description:
                "Native IMPORTDATA connection to Google Sheets. Each extraction becomes a new row automatically — no middleware needed.",
              icon: "FileSpreadsheet",
            },
            {
              title: "Excel via Zapier/Make",
              description:
                "Push to Excel Online, Excel desktop (via OneDrive), or any spreadsheet app using Zapier, Make, or webhooks.",
              icon: "Table2",
            },
            {
              title: "AI Reads Any Format",
              description:
                "Different senders, different layouts — doesn't matter. The AI extracts your fields from any email format automatically.",
              icon: "Brain",
            },
            {
              title: "Includes Attachments",
              description:
                "PDF invoices, image receipts, document attachments — extracted alongside the email body in one flow.",
              icon: "Mail",
            },
            {
              title: "Never Breaks",
              description:
                "Template changes? New senders? Parsli adapts automatically. No rules to update, no re-training.",
              icon: "RefreshCw",
            },
            {
              title: "5,000+ App Connections",
              description:
                "Beyond spreadsheets: push data to CRMs, ERPs, databases, Slack, or any app in your workflow.",
              icon: "Plug",
            },
          ],
        }}
        comparison={{
          title: "Parsli vs. manual email-to-spreadsheet methods",
          rows: [
            { feature: "Setup time", them: "Hours (rules/formulas)", parsli: "2 minutes" },
            { feature: "Handles format changes", them: "No (breaks)", parsli: "Yes (AI adapts)" },
            { feature: "Parse attachments", them: "No", parsli: "Yes" },
            { feature: "Accuracy", them: "Depends on you", parsli: "99%" },
            { feature: "Processing speed", them: "5-15 min/email", parsli: "< 3 seconds" },
            { feature: "Google Sheets native", them: "Varies", parsli: "Built-in" },
            { feature: "Free tier", them: "No", parsli: "30 pages/mo" },
          ],
        }}
        faqs={faqs}
        finalCta={{
          title: "Your spreadsheet fills itself — starting now",
          subtitle:
            "Forward an email, watch the row appear. Free forever up to 30 pages/month. No credit card required.",
          ctaText: "Start Free — Email to Sheet in 2 min",
          ctaHref: "/login",
        }}
      />
    </>
  )
}
