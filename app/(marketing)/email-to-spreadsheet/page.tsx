import type { Metadata } from "next"

import { AdsLandingPage } from "@/components/lp/AdsLandingPage"
import { JsonLd } from "@/components/marketing/shared/JsonLd"
import { breadcrumbJsonLd, faqJsonLd } from "@/lib/seo/json-ld"

export const metadata: Metadata = {
  title: "Email to Spreadsheet — Auto-Extract Email Data to Sheets | Parsli",
  description:
    "Automatically extract data from emails into Google Sheets or Excel. AI parses invoices, orders, and confirmations from your inbox. No code. Free plan included.",
  keywords: [
    "email to spreadsheet", "email to google sheets", "email data to excel",
    "email to spreadsheet automation", "extract email data to sheets",
    "auto fill spreadsheet from email", "email to csv", "parse email to spreadsheet",
  ],
  alternates: {
    canonical: "https://parsli.co/email-to-spreadsheet",
  },
  robots: { index: true, follow: true },
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
    question: "What if the email format changes?",
    answer:
      "Parsli uses AI, not templates. When a sender changes their email format, Parsli adapts automatically. No re-configuration needed — your data keeps flowing to your spreadsheet.",
  },
  {
    question: "How much does this cost?",
    answer:
      "Free plan includes 30 pages/month (each email = 1 page). Paid plans start at $20/month for 250 pages. No credit card required for the free tier.",
  },
]

export default function EmailToSpreadsheetPage() {
  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", url: "https://parsli.co" },
          {
            name: "Email to Spreadsheet",
            url: "https://parsli.co/email-to-spreadsheet",
          },
        ])}
      />
      <JsonLd data={faqJsonLd(faqs)} />

      <AdsLandingPage
        page="email-to-spreadsheet"
        hidePricing
        useHeroDemo
        socialProofHeadline="Trusted by teams automating email-to-spreadsheet workflows"
        demoSection={{
          title: "See how emails become spreadsheet rows",
          subtitle: "Click through the workflow — forward an email, AI extracts the data, a new row appears in your sheet.",
        }}
        hero={{
          badge: "Email to Spreadsheet — Automated",
          headline: "Email Data to\n{word}\nIn 3 Seconds",
          rotatingWords: ["Google Sheets", "Excel", "Spreadsheet", "Your Database", "CSV"],
          subheadline:
            "Stop manually copying data from emails into spreadsheets. AI reads every email and auto-fills your sheet — invoices, orders, confirmations, attachments included.",
          ctaText: "Start Free — No Credit Card",
          ctaHref: "/login?mode=signup",
          secondaryCtaText: "See How It Works",
          trustLine: "Free forever (30 pages/mo). Set up in under 2 minutes.",
        }}
        stats={[
          { value: "<3s", label: "Email → Row In Your Sheet", icon: "Zap" },
          { value: "2-4 hrs", label: "Of Copy-Paste Eliminated Daily", icon: "Clock" },
          { value: "99%", label: "More Accurate Than Manual Entry", icon: "ShieldCheck" },
          { value: "$0", label: "To Start (30 pages/mo free)", icon: "DollarSign" },
        ]}
        painPoints={{
          title: "Still copying email data into spreadsheets by hand?",
          subtitle: "Every email you process manually costs time and introduces errors.",
          items: [
            { text: "Copying invoice amounts, dates, and vendor names from emails into Excel — one by one, every day, eating hours of your week" },
            { text: "Typos and missed fields from manual copy-paste cause billing errors and reporting mistakes downstream" },
            { text: "Zapier and Power Automate email-to-sheet recipes break when email formats change — and attachments need a separate workflow" },
          ],
        }}
        howItWorks={{
          title: "Email to spreadsheet in 3 steps",
          steps: [
            { step: "1", title: "Forward Emails to Parsli", description: "Set up auto-forwarding from Gmail or Outlook. Every email with data you need goes to your Parsli parser automatically." },
            { step: "2", title: "AI Extracts the Data", description: "Define your columns — amount, date, sender, PO number, line items. The AI extracts them from any email format, including attachments." },
            { step: "3", title: "Rows Appear in Your Sheet", description: "Each processed email becomes a new row in Google Sheets or triggers an Excel update via Zapier/Make. Fully automatic." },
          ],
        }}
        testimonials={[
          { quote: "We used to spend 2 hours every morning copying invoice data from emails into our tracking sheet. Now it's fully automatic — rows just appear.", name: "Karen L.", role: "AP Coordinator", company: "Distribution Company" },
          { quote: "The Google Sheets integration is seamless. 150+ vendor emails per week go straight into our spreadsheet with zero manual work.", name: "Chris W.", role: "Operations Analyst", company: "Retail Brand" },
        ]}
        features={{
          title: "Why teams use Parsli for email to spreadsheet",
          items: [
            { title: "Native Google Sheets Integration", description: "Each extraction becomes a new row automatically — no middleware, no Zapier needed for Sheets. Excel supported via Zapier/Make.", icon: "FileSpreadsheet" },
            { title: "AI Reads Any Email Format", description: "Different senders, different layouts — doesn't matter. The AI extracts your fields from any email format automatically.", icon: "Brain" },
            { title: "Attachments Included", description: "PDF invoices, image receipts, document attachments — extracted alongside the email body into the same spreadsheet row.", icon: "Mail" },
          ],
        }}
        comparison={{
          title: "Parsli vs. manual email-to-spreadsheet methods",
          rows: [
            { feature: "Processing speed", them: "5-15 min/email (manual)", parsli: "< 3 seconds" },
            { feature: "Accuracy", them: "Depends on copy-paste", parsli: "99%" },
            { feature: "Format changes", them: "Rules break", parsli: "AI adapts automatically" },
            { feature: "Attachments", them: "Separate process", parsli: "Built-in" },
            { feature: "Google Sheets", them: "Manual paste", parsli: "Native auto-fill" },
            { feature: "Free tier", them: "No", parsli: "30 pages/mo" },
          ],
        }}
        faqs={faqs}
        finalCta={{
          title: "Your spreadsheet fills itself — starting now",
          subtitle: "Forward an email, watch the row appear. Free forever up to 30 pages/month.",
          ctaText: "Start Free — No Credit Card",
          ctaHref: "/login?mode=signup",
        }}
      />

      {/* SEO Content with Citations */}
      <section className="py-16 sm:py-20 border-t bg-muted/30">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-xl sm:text-2xl font-bold mb-4">Why Email-to-Spreadsheet Automation Is Growing</h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            According to <a href="https://www.mckinsey.com/capabilities/mckinsey-digital/our-insights/the-economic-potential-of-generative-ai-the-next-productivity-frontier" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">McKinsey&apos;s research on generative AI (2023)</a>, knowledge workers spend 28% of their time reading and responding to emails. A significant portion of that time involves manually extracting data — order amounts, invoice numbers, tracking details — and copying it into spreadsheets.
          </p>
          <p className="text-muted-foreground leading-relaxed mb-4">
            Google Sheets has over 900 million users worldwide (source: <a href="https://workspace.google.com/blog/" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">Google Workspace Blog, 2024</a>), making email-to-Sheets the most common document automation workflow. Zapier&apos;s <a href="https://zapier.com/blog/state-of-business-automation-2024/" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">State of Business Automation report (2024)</a> ranks email-to-spreadsheet as one of the top 10 most automated office tasks globally.
          </p>
          <p className="text-muted-foreground leading-relaxed mb-4">
            The limitation of rule-based email parsers (like Zapier&apos;s built-in parser) is brittleness: they break when email formats change. Research from the <a href="https://www.aiim.org" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">Association for Intelligent Information Management (AIIM)</a> shows that AI-powered extraction reduces format-change maintenance by 80% compared to template-based approaches, while improving accuracy from 75-85% to 95%+.
          </p>
        </div>
      </section>
    </>
  )
}
