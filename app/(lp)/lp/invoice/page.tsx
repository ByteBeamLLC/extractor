import type { Metadata } from "next"
import Link from "next/link"
import { HeroExtraction } from "@/components/marketing/sections/HeroExtraction"
import {
  ArrowRight,
  Check,
  ChevronDown,
  Clock,
  DollarSign,
  Shield,
  Sparkles,
  Upload,
  Download,
  Zap,
  X,
  FileText,
  Table,
} from "lucide-react"
import { AuthButton } from "@/components/marketing/shared/AuthButton"

export const metadata: Metadata = {
  title: "AI Invoice Data Extraction — 95%+ Accuracy, Any Format | Parsli",
  description:
    "Extract vendor info, line items, totals, and dates from any invoice format. AI-powered, no templates needed. Free invoice parser + $33/mo for automation.",
  robots: { index: false, follow: false },
  alternates: { canonical: "https://parsli.co/lp/invoice" },
}

const painStats = [
  { value: "$15.96", label: "Cost to manually process one invoice" },
  { value: "12+ min", label: "Average manual processing time" },
  { value: "3.6%", label: "Error rate on manually entered invoices" },
  { value: "16 days", label: "Average invoice processing cycle" },
]

const beforeAfter = [
  {
    before: "Clerk reads each invoice, finds vendor name, invoice number, line items, totals — types everything into your system",
    after: "AI reads any invoice layout and extracts all fields into structured data in under 15 seconds",
  },
  {
    before: "Every vendor uses a different format — you build templates for each one, maintain them when layouts change",
    after: "No templates needed. AI understands document structure semantically — works on the first upload from any vendor",
  },
  {
    before: "Scanned invoices and faxed copies are unreadable by basic OCR — someone has to type them manually",
    after: "Google Gemini 2.5 Pro reads scanned, faded, and handwritten invoices that traditional OCR can't process",
  },
  {
    before: "3-16 day processing cycle means missed early payment discounts and strained vendor relationships",
    after: "Same-day processing. Extracted data flows to your accounting system automatically via API or Zapier",
  },
]

const fields = [
  "Vendor / supplier name",
  "Invoice number & date",
  "Due date & payment terms",
  "Bill-to / ship-to address",
  "PO number reference",
  "Line items (table)",
  "Item descriptions",
  "Quantities & unit prices",
  "Subtotal & tax amount",
  "Total amount due",
  "Currency code",
  "Any custom field you define",
]

const steps = [
  {
    icon: Upload,
    num: "1",
    title: "Upload or forward invoices",
    description:
      "Drag-and-drop, email forwarding, cloud storage sync, or REST API. Any source works.",
  },
  {
    icon: Sparkles,
    num: "2",
    title: "AI extracts every field",
    description:
      "Vendor, invoice #, line items, totals, dates — per your schema. No templates to build.",
  },
  {
    icon: Download,
    num: "3",
    title: "Data flows to your systems",
    description:
      "QuickBooks, Xero, Google Sheets, ERP, or any system via API, webhooks, or Zapier.",
  },
]

const competitors = [
  { name: "Manual entry", speed: "12+ min", accuracy: "96%", cost: "$15.96/invoice", templates: "N/A" },
  { name: "Docparser", speed: "30-60s", accuracy: "100% (native PDF)", cost: "$0.39/page", templates: "Yes — per vendor" },
  { name: "Nanonets", speed: "< 30s", accuracy: "95%+", cost: "$0.99+/page", templates: "Trained models" },
  { name: "Parsli", speed: "< 15s", accuracy: "95%+", cost: "$0.33/page", templates: "None needed", highlight: true },
]

const objections = [
  {
    q: "How is Parsli different from Docparser?",
    a: "Docparser uses rule-based Zonal OCR — you build a template for each vendor's invoice layout. When a vendor changes their format, your template breaks. Parsli uses Google Gemini 2.5 Pro AI that understands document structure semantically. Upload an invoice from a vendor you've never seen before and it extracts all fields automatically. No templates, no rules, no maintenance.",
  },
  {
    q: "What about scanned or faxed invoices?",
    a: "Parsli handles scanned PDFs, photographed invoices, faxed copies, and even handwritten line items. Gemini 2.5 Pro reads documents that traditional OCR engines can't process — no image pre-processing required.",
  },
  {
    q: "Can I extract line items from invoice tables?",
    a: "Yes. Parsli extracts full line-item tables including description, quantity, unit price, and amount for each row. The data exports as structured JSON with the table intact — not flattened text.",
  },
  {
    q: "How does pricing work?",
    a: "Free plan: 30 pages/month, no credit card. Starter: $33/month for 250 pages. Growth: $59/month for 500 pages. All plans include API access, webhooks, Google Sheets integration, and email forwarding. No per-vendor fees, no template charges.",
  },
  {
    q: "Does it integrate with my accounting software?",
    a: "Parsli integrates via REST API, webhooks, Zapier (5,000+ apps including QuickBooks, Xero, FreshBooks), Make, and Google Sheets. Extracted invoice data can flow directly to your AP system without middleware.",
  },
  {
    q: "How long does setup take?",
    a: "Under 5 minutes. We have a pre-built invoice parser template with 14 fields (vendor, invoice number, line items, totals, dates, etc). Sign up, create a parser from the template, upload your first invoice, and verify the results. No IT involvement needed.",
  },
]

export default function InvoiceLP() {
  return (
    <>
      {/* Hero */}
      <section className="relative pt-24 pb-16 sm:pt-28 sm:pb-20">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-1/4 left-1/4 w-[600px] h-[400px] bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute top-20 right-0 w-[400px] h-[400px] bg-secondary/5 rounded-full blur-3xl" />
        </div>
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-10 items-center">
            {/* Left: Copy */}
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border bg-card px-4 py-1.5 text-sm text-muted-foreground mb-6">
                <Zap className="h-4 w-4 text-primary" />
                95%+ accuracy &middot; Any vendor format &middot; Under 15 seconds
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight leading-[1.1] mb-6">
                AI Invoice Data Extraction{" "}
                <span className="text-primary">That Just Works</span>
              </h1>

              <p className="text-lg text-muted-foreground max-w-xl mb-8">
                Stop building templates for every vendor. Parsli AI extracts vendor
                info, line items, totals, and dates from any invoice format —
                scanned, digital, or handwritten. No rules to configure.
              </p>

              <div className="flex flex-col sm:flex-row items-start gap-4 mb-4">
                <AuthButton className="text-base px-8 h-12" showArrow href="/dashboard?template=invoice-parsing">
                  Start Free — 30 Pages/Month
                </AuthButton>
              </div>

              <p className="text-sm text-muted-foreground">
                No credit card &middot; No sales call &middot; Processing in under 5
                minutes
              </p>
            </div>

            {/* Right: Interactive extraction demo */}
            <div className="hidden lg:block">
              <HeroExtraction />
            </div>
          </div>
        </div>
      </section>

      {/* Pain stats */}
      <section className="py-12 sm:py-16 border-t bg-muted/30">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm font-medium text-muted-foreground mb-8 uppercase tracking-wider">
            The manual invoice processing problem
          </p>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {painStats.map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-2xl sm:text-3xl font-bold text-primary mb-1">
                  {stat.value}
                </p>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
          <p className="text-center text-xs text-muted-foreground mt-6">
            Sources: HighRadius, Ardent Partners, IOFM
          </p>
        </div>
      </section>

      {/* Before/After */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-12">
            Before Parsli vs. After Parsli
          </h2>
          <div className="space-y-4">
            {beforeAfter.map((row) => (
              <div key={row.before} className="grid md:grid-cols-2 gap-4">
                <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-5 flex gap-3">
                  <X className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                  <p className="text-sm text-foreground">{row.before}</p>
                </div>
                <div className="rounded-xl border border-green-500/20 bg-green-500/5 p-5 flex gap-3">
                  <Check className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                  <p className="text-sm text-foreground">{row.after}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 sm:py-20 bg-muted/30">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-12">
            How It Works
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((step) => (
              <div
                key={step.num}
                className="relative rounded-xl border bg-card p-6 text-center"
              >
                <div className="absolute top-4 right-4 text-xs font-bold text-muted-foreground/40">
                  {step.num}
                </div>
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary mb-4">
                  <step.icon className="h-6 w-6" />
                </div>
                <h3 className="font-semibold text-lg mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Fields extracted */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-4">
            Fields Parsli Extracts from Any Invoice
          </h2>
          <p className="text-center text-muted-foreground mb-10">
            Pre-built template with 14 fields. Add your own or customize.
          </p>
          <div className="rounded-xl border bg-card p-6 sm:p-8">
            <div className="grid sm:grid-cols-2 gap-3">
              {fields.map((field) => (
                <div key={field} className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-600 shrink-0" />
                  <span className="text-sm">{field}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-8 rounded-xl border bg-zinc-950 text-zinc-100 p-6 overflow-x-auto">
            <p className="text-xs text-zinc-500 mb-3 font-mono">
              // Parsli API response — invoice extraction
            </p>
            <pre className="text-xs sm:text-sm font-mono leading-relaxed">
              {`{
  "vendor_name": "Acme Supplies Inc.",
  "invoice_number": "INV-2026-1847",
  "invoice_date": "2026-03-15",
  "due_date": "2026-04-14",
  "po_number": "PO-4492",
  "line_items": [
    {
      "description": "Office Chairs (Ergonomic)",
      "quantity": 12,
      "unit_price": 249.99,
      "amount": 2999.88
    },
    {
      "description": "Standing Desk Converters",
      "quantity": 6,
      "unit_price": 189.00,
      "amount": 1134.00
    }
  ],
  "subtotal": 4133.88,
  "tax": 330.71,
  "total": 4464.59,
  "currency": "USD"
}`}
            </pre>
          </div>
        </div>
      </section>

      {/* Comparison table */}
      <section className="py-16 sm:py-20 bg-muted/30">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-4">
            How Parsli Compares
          </h2>
          <p className="text-center text-muted-foreground mb-10">
            No templates to build. No models to train. No per-vendor fees.
          </p>
          <div className="rounded-xl border bg-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left px-5 py-3 font-semibold">Approach</th>
                    <th className="text-center px-5 py-3 font-semibold">Speed</th>
                    <th className="text-center px-5 py-3 font-semibold">Accuracy</th>
                    <th className="text-center px-5 py-3 font-semibold">Cost</th>
                    <th className="text-center px-5 py-3 font-semibold hidden sm:table-cell">Templates?</th>
                  </tr>
                </thead>
                <tbody>
                  {competitors.map((row) => (
                    <tr
                      key={row.name}
                      className={`border-b last:border-0 ${row.highlight ? "bg-primary/[0.03]" : ""}`}
                    >
                      <td className={`px-5 py-3 font-medium ${row.highlight ? "text-primary" : ""}`}>
                        {row.name}
                      </td>
                      <td className="px-5 py-3 text-center text-muted-foreground">{row.speed}</td>
                      <td className="px-5 py-3 text-center text-muted-foreground">{row.accuracy}</td>
                      <td className={`px-5 py-3 text-center font-medium ${row.highlight ? "text-primary" : "text-muted-foreground"}`}>
                        {row.cost}
                      </td>
                      <td className={`px-5 py-3 text-center hidden sm:table-cell ${row.highlight ? "text-primary font-medium" : "text-muted-foreground"}`}>
                        {row.templates}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* ROI callout */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl border-2 border-primary/20 bg-primary/5 p-8 sm:p-10 text-center">
            <h2 className="text-xl sm:text-2xl font-bold mb-4">
              The Math Is Simple
            </h2>
            <div className="grid sm:grid-cols-3 gap-6 mb-6">
              <div>
                <p className="text-3xl font-bold text-destructive">$15.96</p>
                <p className="text-sm text-muted-foreground">
                  Per invoice (manual)
                </p>
              </div>
              <div className="flex items-center justify-center">
                <ArrowRight className="h-6 w-6 text-muted-foreground" />
              </div>
              <div>
                <p className="text-3xl font-bold text-green-600">$0.33</p>
                <p className="text-sm text-muted-foreground">
                  Per invoice (Parsli)
                </p>
              </div>
            </div>
            <p className="text-muted-foreground mb-6">
              That&apos;s a{" "}
              <span className="font-bold text-foreground">48x cost reduction</span>.
              A team processing 500 invoices/month saves{" "}
              <span className="font-bold text-foreground">$7,815/month</span>{" "}
              in data entry costs alone.
            </p>
            <AuthButton className="text-base px-8 h-12" showArrow href="/dashboard?template=invoice-parsing">
              Start Free — See It on Your Invoices
            </AuthButton>
          </div>
        </div>
      </section>

      {/* Trust signals */}
      <section className="py-12 sm:py-16 bg-muted/30">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="grid sm:grid-cols-3 gap-6">
            <div className="rounded-xl border bg-card p-6 text-center">
              <Shield className="h-6 w-6 text-primary mx-auto mb-3" />
              <p className="font-semibold text-sm mb-1">Your Data Stays Private</p>
              <p className="text-xs text-muted-foreground">
                Invoices are never used to train AI models. Encrypted at rest
                and in transit. GDPR compliant.
              </p>
            </div>
            <div className="rounded-xl border bg-card p-6 text-center">
              <Sparkles className="h-6 w-6 text-primary mx-auto mb-3" />
              <p className="font-semibold text-sm mb-1">Google Gemini 2.5 Pro</p>
              <p className="text-xs text-muted-foreground">
                Latest multimodal AI. Reads scanned invoices, faded copies, and
                handwritten notes that basic OCR can&apos;t handle.
              </p>
            </div>
            <div className="rounded-xl border bg-card p-6 text-center">
              <Clock className="h-6 w-6 text-primary mx-auto mb-3" />
              <p className="font-semibold text-sm mb-1">5-Minute Setup</p>
              <p className="text-xs text-muted-foreground">
                Pre-built invoice template with 14 fields. No IT involvement,
                no vendor onboarding, no implementation timeline.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Objection handling */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-10">
            Common Questions
          </h2>
          <div className="divide-y rounded-xl border bg-card">
            {objections.map((faq) => (
              <details key={faq.q} className="group">
                <summary className="flex items-center justify-between gap-4 px-6 py-5 cursor-pointer list-none text-sm sm:text-base font-medium [&::-webkit-details-marker]:hidden">
                  {faq.q}
                  <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
                </summary>
                <div className="px-6 pb-5 text-sm text-muted-foreground leading-relaxed">
                  {faq.a}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 sm:py-24 border-t">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold mb-4">
            Your AP Team Has Better Things to Do
          </h2>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-8">
            Start free. Upload an invoice. See structured data in seconds.
            No credit card, no sales call, no implementation timeline.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <AuthButton className="text-base px-8 h-12" showArrow href="/dashboard?template=invoice-parsing">
              Start Free — 30 Pages/Month
            </AuthButton>
            <Link
              href="/tools/invoice-parser"
              className="inline-flex items-center gap-2 text-base font-medium text-primary hover:underline"
            >
              Try the free parser first
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <p className="mt-6 text-xs text-muted-foreground">
            Paid plans from $33/month &middot; Cancel anytime &middot; All vendors supported
          </p>
        </div>
      </section>
    </>
  )
}
