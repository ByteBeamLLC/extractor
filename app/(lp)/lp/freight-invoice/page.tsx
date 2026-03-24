import type { Metadata } from "next"
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
} from "lucide-react"
import { AuthButton } from "@/components/marketing/shared/AuthButton"

export const metadata: Metadata = {
  title: "AI Freight Invoice Parser — Extract Data in Seconds | Parsli",
  description:
    "Automate freight invoice processing for FedEx, XPO, ODFL, Estes, Saia & any carrier. 95%+ accuracy. $20/mo. 30 free pages — no credit card.",
  robots: { index: false, follow: false },
  alternates: { canonical: "https://parsli.co/lp/freight-invoice" },
}

const painStats = [
  { value: "$15.96", label: "Cost to manually process one freight invoice" },
  { value: "12.7 min", label: "Average manual processing time per document" },
  { value: "20-30%", label: "Error rate on manually processed invoices" },
  { value: "$1,596/mo", label: "Cost of processing just 100 invoices manually" },
]

const beforeAfter = [
  {
    before: "Manually key carrier charges, PRO numbers, and surcharges into your system",
    after: "AI extracts all fields from any carrier invoice format in under 15 seconds",
  },
  {
    before: "Every carrier uses a different format — FedEx, XPO, ODFL, Estes all look different",
    after: "One parser handles all carriers. No per-carrier templates or configuration needed",
  },
  {
    before: "3-7 day billing lag because invoices sit in a manual processing queue",
    after: "Invoices processed on arrival — extracted data flows to your TMS/ERP instantly",
  },
  {
    before: "No way to verify accessorial charges, fuel surcharges, or detect overcharges",
    after: "Structured data enables automated freight audit and 3-way matching",
  },
]

const steps = [
  {
    icon: Upload,
    num: "1",
    title: "Forward carrier invoices",
    description:
      "Email forwarding, dock scanner upload, or REST API. Parsli ingests from any source.",
  },
  {
    icon: Sparkles,
    num: "2",
    title: "AI extracts every field",
    description:
      "Carrier, PRO#, charges, surcharges, weight, origin, destination — per your schema.",
  },
  {
    icon: Download,
    num: "3",
    title: "Data flows to your systems",
    description:
      "WMS, TMS, ERP, accounting, or Google Sheets via API, webhooks, or Zapier.",
  },
]

const fields = [
  "Carrier name & SCAC code",
  "Invoice number & date",
  "PRO / tracking number",
  "BOL number reference",
  "Origin & destination",
  "Weight & freight class",
  "Line-haul charges",
  "Fuel surcharge",
  "Accessorial charges (table)",
  "Total charges",
  "Payment terms & due date",
  "Any custom field you define",
]

const competitors = [
  { name: "Manual entry", speed: "15-20 min", accuracy: "70-80%", cost: "$25-40/doc" },
  { name: "Template OCR", speed: "30-60 sec", accuracy: "75-85%", cost: "$3-8/doc" },
  { name: "Enterprise tools", speed: "< 30 sec", accuracy: "90%+", cost: "$$$$" },
  { name: "Parsli", speed: "< 15 sec", accuracy: "95%+", cost: "$0.08/page", highlight: true },
]

const objections = [
  {
    q: "Will it work with my carrier's invoice format?",
    a: "Yes. Parsli handles FedEx Freight, UPS, XPO, ODFL, Estes, Saia, DHL, ABF, Dayton, R+L, and any regional carrier. The AI understands document semantics — no per-carrier templates needed.",
  },
  {
    q: "How is this different from Docparser or Parseur?",
    a: "Docparser uses rule-based Zonal OCR — you build templates per carrier format. Parsli uses Google Gemini 2.5 Pro AI that reads any format without templates. Upload an invoice from a carrier you've never processed before and it just works.",
  },
  {
    q: "What about faded thermal prints?",
    a: "Gemini 2.5 Pro reads dock-quality documents that break traditional OCR — faded thermal prints, crooked scans, carbon copies, even handwritten annotations.",
  },
  {
    q: "How long does setup take?",
    a: "Under 5 minutes. We pre-built a freight invoice template with 17 fields (carrier, PRO, charges, surcharges, etc). Sign up, click 'Create Parser', select the template, and upload your first invoice.",
  },
  {
    q: "Can I integrate with my TMS or ERP?",
    a: "Yes. REST API, webhooks, Zapier (5,000+ apps), Make, and Google Sheets. Extracted data pushes to your systems automatically — no middleware needed.",
  },
]

export default function FreightInvoiceLP() {
  return (
    <>
      {/* Hero */}
      <section className="relative pt-24 pb-16 sm:pt-32 sm:pb-20">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-primary/5 rounded-full blur-3xl" />
        </div>
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border bg-card px-4 py-1.5 text-sm text-muted-foreground mb-6">
            <Zap className="h-4 w-4 text-primary" />
            95%+ accuracy &middot; Any carrier format &middot; Under 15 seconds
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight leading-[1.1] mb-6">
            Stop Keying Freight Invoices{" "}
            <span className="text-primary">by Hand</span>
          </h1>

          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Parsli AI extracts carrier charges, PRO numbers, surcharges, and
            shipment data from any freight invoice format — FedEx, XPO, ODFL,
            Estes, Saia, and 100+ more carriers. No templates needed.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-4">
            <AuthButton className="text-base px-8 h-12 w-full sm:w-auto" showArrow href="/dashboard?template=freight-invoice">
              Start Free — 30 Pages/Month
            </AuthButton>
          </div>

          <p className="text-sm text-muted-foreground">
            No credit card &middot; No sales call &middot; Processing in under 5
            minutes
          </p>
        </div>
      </section>

      {/* Pain stats */}
      <section className="py-12 sm:py-16 border-t bg-muted/30">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm font-medium text-muted-foreground mb-8 uppercase tracking-wider">
            The manual freight invoice problem
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
            Sources: HighRadius, SoftLabsGroup, Expedock
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
            Fields Parsli Extracts from Any Freight Invoice
          </h2>
          <p className="text-center text-muted-foreground mb-10">
            Pre-built template with 17 fields. Customize or add your own.
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
              // Parsli API response — freight invoice
            </p>
            <pre className="text-xs sm:text-sm font-mono leading-relaxed">
              {`{
  "carrier_name": "XPO Logistics",
  "invoice_number": "INV-2026-048271",
  "pro_number": "PRO-830-491726",
  "origin": "Chicago, IL",
  "destination": "Dallas, TX",
  "weight": 8450,
  "freight_class": "70",
  "line_haul_charge": 2147.50,
  "fuel_surcharge": 429.50,
  "accessorial_charges": [
    { "type": "Liftgate", "amount": 175.00 },
    { "type": "Inside Delivery", "amount": 95.00 }
  ],
  "total_charges": 2847.00
}`}
            </pre>
          </div>
        </div>
      </section>

      {/* Comparison table */}
      <section className="py-16 sm:py-20 bg-muted/30">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-10">
            How Parsli Compares
          </h2>
          <div className="rounded-xl border bg-card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left px-5 py-3 font-semibold">Approach</th>
                  <th className="text-center px-5 py-3 font-semibold">Speed</th>
                  <th className="text-center px-5 py-3 font-semibold">Accuracy</th>
                  <th className="text-center px-5 py-3 font-semibold">Cost</th>
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
                  </tr>
                ))}
              </tbody>
            </table>
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
                <p className="text-3xl font-bold text-destructive">$1,596</p>
                <p className="text-sm text-muted-foreground">
                  100 invoices/mo (manual)
                </p>
              </div>
              <div className="flex items-center justify-center">
                <ArrowRight className="h-6 w-6 text-muted-foreground" />
              </div>
              <div>
                <p className="text-3xl font-bold text-green-600">$20</p>
                <p className="text-sm text-muted-foreground">
                  250 invoices/mo (Parsli)
                </p>
              </div>
            </div>
            <p className="text-muted-foreground mb-6">
              That&apos;s a{" "}
              <span className="font-bold text-foreground">80x cost reduction</span>.
              Plus faster billing cycles, fewer errors, and automated freight audit.
            </p>
            <AuthButton className="text-base px-8 h-12" showArrow href="/dashboard?template=freight-invoice">
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
              <p className="font-semibold text-sm mb-1">Enterprise Security</p>
              <p className="text-xs text-muted-foreground">
                Hosted on Supabase & Vercel. Encrypted at rest and in transit.
                Your documents are never used to train AI.
              </p>
            </div>
            <div className="rounded-xl border bg-card p-6 text-center">
              <Sparkles className="h-6 w-6 text-primary mx-auto mb-3" />
              <p className="font-semibold text-sm mb-1">Google Gemini 2.5 Pro</p>
              <p className="text-xs text-muted-foreground">
                Latest multimodal AI. Reads faded thermal prints, carbon copies,
                and handwritten annotations.
              </p>
            </div>
            <div className="rounded-xl border bg-card p-6 text-center">
              <Clock className="h-6 w-6 text-primary mx-auto mb-3" />
              <p className="font-semibold text-sm mb-1">5-Minute Setup</p>
              <p className="text-xs text-muted-foreground">
                Pre-built freight invoice template. No sales calls. No
                implementation. Start extracting today.
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
            Start free. Upload a freight invoice. See structured data in seconds.
            No credit card, no sales call, no implementation timeline.
          </p>
          <AuthButton className="text-base px-8 h-12" showArrow href="/dashboard?template=freight-invoice">
            Start Free — 30 Pages/Month
          </AuthButton>
          <p className="mt-6 text-xs text-muted-foreground">
            Paid plans from $20/month &middot; Cancel anytime &middot; All carriers supported
          </p>
        </div>
      </section>
    </>
  )
}
