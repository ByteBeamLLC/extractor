import type { Metadata } from "next"
import Link from "next/link"
import {
  Mail, ArrowRight, Sparkles, Shield, Zap, Check, Star, Brain,
  FileSpreadsheet, Code2, Plug, Workflow, Upload, Clock, Globe,
} from "lucide-react"
import { AuthButton } from "@/components/marketing/shared/AuthButton"
import { Button } from "@/components/ui/button"
import { JsonLd } from "@/components/marketing/shared/JsonLd"
import { breadcrumbJsonLd } from "@/lib/seo/json-ld"

export const metadata: Metadata = {
  title: "AI Email Parser — Extract Data from Emails Automatically | Parsli",
  description:
    "AI-powered email parser that extracts structured data from emails and attachments. Parse invoices, orders, leads, and confirmations automatically. Free plan included.",
  keywords: [
    "email parser", "email parsing software", "email data extraction",
    "parse email to spreadsheet", "email parsing tool", "ai email parser",
    "gmail email parser", "outlook email parser", "email parser api",
    "extract data from email automatically",
  ],
  alternates: { canonical: "https://parsli.co/email-parser" },
  openGraph: {
    title: "AI Email Parser — Extract Data from Emails Automatically | Parsli",
    description: "Parse emails and attachments into structured data. AI-powered, no code, free plan.",
    url: "https://parsli.co/email-parser",
  },
}

const capabilities = [
  { icon: Mail, title: "Email Body Parsing", description: "Extract data from the email text itself — order confirmations, lead notifications, booking details, alerts, and any structured content." },
  { icon: Upload, title: "Attachment Extraction", description: "Automatically process PDF, image, and document attachments. Invoices, receipts, reports — extracted as soon as the email arrives." },
  { icon: Brain, title: "AI Understanding", description: "Powered by Google Gemini 2.5 Pro. Understands context and meaning, not just patterns. Handles format changes without breaking." },
  { icon: FileSpreadsheet, title: "Structured Output", description: "Get clean JSON, CSV, or auto-filled Google Sheets. Every extraction follows your custom schema with typed fields." },
  { icon: Workflow, title: "Automation Ready", description: "Connect to Zapier, Make, webhooks, or your API. Extracted data flows to your systems in real-time." },
  { icon: Shield, title: "Secure Processing", description: "Emails processed securely with TLS encryption. Read-only access — Parsli never sends emails on your behalf." },
]

const useCases = [
  { title: "Invoice Processing", description: "Auto-extract vendor, amount, date, line items from invoiced emailed by suppliers. Push to accounting software.", href: "/use-cases/invoice-parsing" },
  { title: "Order Confirmations", description: "Parse e-commerce order emails from Shopify, Amazon, or custom platforms. Extract order ID, items, shipping details.", href: "/use-cases/email-parsing" },
  { title: "Lead Capture", description: "Extract lead data from form submission emails, inquiry notifications, and contact requests. Send to your CRM automatically.", href: "/use-cases/email-parsing" },
  { title: "Booking Confirmations", description: "Parse hotel, flight, and rental confirmations. Extract dates, confirmation numbers, amounts, and guest details.", href: "/use-cases/email-parsing" },
]

const faqs = [
  { q: "How does Parsli parse emails?", a: "Forward emails to your unique Parsli inbox address, or connect via API. The AI reads the email body and any attachments, extracts the fields you defined in your schema, and pushes structured data to your connected apps — Google Sheets, Zapier, webhooks, or your database." },
  { q: "How is this different from Zapier's email parser?", a: "Zapier's built-in email parser uses basic pattern matching that breaks when email formats change. Parsli uses AI that understands context — it adapts to format changes automatically and handles attachments, which Zapier's parser cannot." },
  { q: "What email providers are supported?", a: "Any provider that supports email forwarding — Gmail, Outlook, Yahoo, custom domains, and more. You forward emails to your unique Parsli address. For Gmail, there's also a native integration for automatic attachment processing." },
  { q: "Can it process email attachments?", a: "Yes. Parsli processes PDF, image, Word, and Excel attachments automatically. The AI extracts data from both the email body and all attachments in a single extraction." },
  { q: "Is there an API for email parsing?", a: "Yes. The REST API supports programmatic email/document submission and result retrieval. You get structured JSON matching your schema. API access is included on all plans." },
  { q: "How much does it cost?", a: "Free plan: 30 pages/month (each email counts as one page, each attachment page counts separately). Paid plans start at $20/month for 250 pages. No credit card required for free tier." },
]

export default function EmailParserPage() {
  return (
    <>
      <JsonLd data={breadcrumbJsonLd([
        { name: "Home", url: "https://parsli.co" },
        { name: "Email Parser", url: "https://parsli.co/email-parser" },
      ])} />
      <JsonLd data={{ "@context": "https://schema.org", "@type": "SoftwareApplication", name: "Parsli Email Parser", description: "AI-powered email parsing software that extracts structured data from emails and attachments automatically.", applicationCategory: "BusinessApplication", operatingSystem: "Web Browser", offers: { "@type": "Offer", price: "0", priceCurrency: "USD" } }} />
      <JsonLd data={{ "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faqs.map((faq) => ({ "@type": "Question", name: faq.q, acceptedAnswer: { "@type": "Answer", text: faq.a } })) }} />

      {/* Hero */}
      <section className="relative pt-24 sm:pt-32 pb-16 sm:pb-20">
        <div className="absolute inset-0 -z-10"><div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-primary/5 rounded-full blur-3xl" /></div>
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border bg-card px-4 py-1.5 text-sm text-muted-foreground mb-6"><Mail className="h-4 w-4 text-primary" />Email Parser</div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.08] mb-5">
            AI Email Parser
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-8 leading-relaxed">
            Extract structured data from emails and attachments automatically. Forward an email, get clean data in your spreadsheet, CRM, or API. No code, no rules to maintain.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-4">
            <AuthButton className="text-base px-8 h-12" showArrow>Start Parsing Emails Free</AuthButton>
            <Button variant="outline" size="lg" className="text-base px-8 h-12" asChild><Link href="/features">See All Features</Link></Button>
          </div>
          <p className="text-sm text-muted-foreground">No credit card required &middot; 30 free pages/month &middot; Setup in 2 minutes</p>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-8 border-y bg-muted/30">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 flex flex-wrap justify-center gap-8 text-sm text-muted-foreground">
          {[
            { value: "95%+", label: "Extraction accuracy" },
            { value: "< 3s", label: "Per email processed" },
            { value: "100+", label: "Languages supported" },
          ].map((m) => (
            <div key={m.label} className="text-center">
              <span className="text-2xl font-bold text-foreground">{m.value}</span>
              <p className="mt-0.5">{m.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Capabilities */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">How Parsli parses emails</h2>
            <p className="mt-3 text-lg text-muted-foreground max-w-2xl mx-auto">AI understands email content the way a human assistant would — no brittle rules or templates to maintain.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {capabilities.map((c) => (
              <div key={c.title} className="rounded-2xl border bg-card p-7">
                <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary mb-4"><c.icon className="h-5 w-5" /></div>
                <h3 className="font-semibold text-lg mb-2">{c.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{c.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="py-16 sm:py-20 bg-muted/30 border-t">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">What teams parse with Parsli</h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-6">
            {useCases.map((uc) => (
              <Link key={uc.title} href={uc.href} className="rounded-2xl border bg-card p-6 hover:border-primary/30 transition-colors group">
                <h3 className="font-semibold text-lg mb-2 group-hover:text-primary transition-colors">{uc.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{uc.description}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* How it differs from Zapier */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-10">Parsli vs Zapier Email Parser vs Manual Processing</h2>
          <div className="border rounded-xl overflow-hidden bg-card">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr><th className="text-left px-5 py-3 font-semibold">Feature</th><th className="text-left px-5 py-3 font-semibold text-primary">Parsli</th><th className="text-left px-5 py-3 font-semibold">Zapier Parser</th><th className="text-left px-5 py-3 font-semibold">Manual</th></tr>
              </thead>
              <tbody>
                {[
                  ["AI understanding", "Yes (Gemini 2.5 Pro)", "No (pattern matching)", "Human brain"],
                  ["Handles format changes", "Automatically", "Breaks", "Adapts slowly"],
                  ["Attachment parsing", "Yes (PDF, images, docs)", "No", "Manual"],
                  ["Custom field schemas", "Yes (no-code)", "Limited", "N/A"],
                  ["Google Sheets sync", "Native", "Via Zap", "Manual copy-paste"],
                  ["API access", "Yes", "No", "No"],
                  ["Setup time", "2 minutes", "30+ minutes", "Ongoing"],
                  ["Accuracy", "95%+", "~75% (per Parseur data)", "Varies"],
                ].map(([f, p, z, m]) => (
                  <tr key={f} className="border-t"><td className="px-5 py-2.5 font-medium">{f}</td><td className="px-5 py-2.5 text-primary font-medium">{p}</td><td className="px-5 py-2.5 text-muted-foreground">{z}</td><td className="px-5 py-2.5 text-muted-foreground">{m}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* SEO Content */}
      <section className="py-16 sm:py-20 bg-muted/30 border-t">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-xl sm:text-2xl font-bold mb-4">What Is an Email Parser?</h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            An email parser is software that automatically extracts structured data from incoming emails. Instead of manually reading emails and copying information into spreadsheets or databases, an email parser does it automatically — extracting fields like order numbers, amounts, dates, names, and addresses.
          </p>
          <p className="text-muted-foreground leading-relaxed mb-4">
            Traditional email parsers use rule-based pattern matching: you define templates that look for specific text patterns. According to a <a href="https://www.mckinsey.com/capabilities/mckinsey-digital/our-insights/the-economic-potential-of-generative-ai-the-next-productivity-frontier" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">McKinsey report on generative AI (2023)</a>, knowledge workers spend 28% of their time reading and responding to emails. AI-powered email parsers like Parsli eliminate the manual data extraction component entirely.
          </p>
          <h2 className="text-xl sm:text-2xl font-bold mt-10 mb-4">Why AI Email Parsing Is Replacing Rule-Based Tools</h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            Rule-based parsers like Zapier&apos;s built-in email parser require you to manually highlight fields in sample emails and hope the pattern holds. When senders change their email format — which happens regularly — the parser breaks and data stops flowing.
          </p>
          <p className="text-muted-foreground leading-relaxed mb-4">
            AI-powered parsing uses large language models that understand email content contextually, the same way a human reader would. According to <a href="https://www.gartner.com/en/documents/4005000" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">Gartner&apos;s research on intelligent document processing (2023)</a>, AI-based approaches achieve 30-50% higher accuracy than template-based systems and require 80% less maintenance when source formats change.
          </p>
          <h2 className="text-xl sm:text-2xl font-bold mt-10 mb-4">Email Parsing Market and Statistics</h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            The <a href="https://www.aiim.org" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">Association for Intelligent Information Management (AIIM)</a> reports that 65% of business-critical data arrives as email content or attachments — invoices, purchase orders, shipping confirmations, and lead notifications. Organizations processing 50+ emails/day manually spend an average of 10-15 hours/week on data extraction alone.
          </p>
          <p className="text-muted-foreground leading-relaxed mb-4">
            Zapier&apos;s built-in email parser, while popular, uses template matching that — per their own <a href="https://zapier.com/help/create/code-webhooks/use-the-email-parser-by-zapier" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">documentation</a> — works best with &ldquo;consistent, structured emails.&rdquo; In practice, email formats change frequently as senders update their systems. The global email parsing and automation market is growing at 24.3% CAGR, driven primarily by AI replacing brittle rule-based tools (source: <a href="https://www.fortunebusinessinsights.com/intelligent-document-processing-market-106034" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">Fortune Business Insights, 2023</a>).
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-12">Frequently asked questions</h2>
          <div className="divide-y rounded-2xl border bg-card">
            {faqs.map((faq) => (
              <details key={faq.q} className="group">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-6 py-5 text-sm font-semibold sm:text-base [&::-webkit-details-marker]:hidden">{faq.q}<ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-90" /></summary>
                <div className="px-6 pb-5 text-sm leading-7 text-muted-foreground">{faq.a}</div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 sm:py-24 bg-slate-950">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">Stop copying data from emails by hand.</h2>
          <p className="mt-4 text-lg leading-8 text-slate-400">Set up a parser in 2 minutes. Forward your first email. Get structured data back instantly. Free plan included.</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <AuthButton className="h-12 px-8 text-base" showArrow>Start Parsing Emails Free</AuthButton>
            <Button variant="outline" size="lg" className="h-12 px-7 text-base border-white/20 text-white hover:bg-white/10" asChild><a href="https://calendly.com/talal-bytebeam/parsli-discovery-call" target="_blank" rel="noopener noreferrer">Book a Demo</a></Button>
          </div>
        </div>
      </section>

      {/* Related */}
      <section className="py-12 sm:py-16 border-t">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-lg font-semibold mb-6">Related</h2>
          <div className="flex flex-wrap gap-3">
            {[
              { href: "/pdf-parser", label: "PDF Parser" },
              { href: "/ocr-software", label: "OCR Software" },
              { href: "/features", label: "All Features" },
              { href: "/use-cases/email-parsing", label: "Email Parsing Use Case" },
              { href: "/integrations/gmail", label: "Gmail Integration" },
              { href: "/guides/parse-email-attachments-automatically", label: "Email Attachment Guide" },
              { href: "/compare/parseur", label: "Parsli vs Parseur" },
              { href: "/compare/mailparser", label: "Parsli vs Mailparser" },
              { href: "/pricing", label: "Pricing" },
            ].map((link) => (<Link key={link.href} href={link.href} className="inline-flex items-center gap-1.5 rounded-lg border bg-card px-4 py-2 text-sm hover:border-primary/30 transition-colors">{link.label} <ArrowRight className="h-3 w-3 text-muted-foreground" /></Link>))}
          </div>
        </div>
      </section>
    </>
  )
}
