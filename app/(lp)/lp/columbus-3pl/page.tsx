import type { Metadata } from "next"
import Link from "next/link"
import {
  ArrowRight,
  Check,
  Clock,
  FileText,
  Sparkles,
  Upload,
  Download,
  Shield,
  MapPin,
  Truck,
  ChevronDown,
  Zap,
} from "lucide-react"
import { AuthButton } from "@/components/marketing/shared/AuthButton"

export const metadata: Metadata = {
  title:
    "Columbus 3PL Document Automation — Stop Keying BOLs by Hand | Parsli",
  description:
    "Columbus 3PLs: automate BOL and freight invoice data entry. AI extraction built for the I-70/I-71 corridor. Handles faded thermal dock prints. Start free.",
  robots: { index: false, follow: false },
  alternates: { canonical: "https://parsli.co/lp/columbus-3pl" },
}

const painPoints = [
  {
    icon: FileText,
    title: "300+ BOLs/day, all different formats",
    description:
      "Every shipper sends a different BOL. Your clerks waste hours figuring out where fields are before they can start typing.",
  },
  {
    icon: Clock,
    title: "12+ minutes per document — manual",
    description:
      "At 300 BOLs/day, that's 60+ clerk-hours of data entry. Every. Single. Day. And 20-30% still contain errors.",
  },
  {
    icon: Truck,
    title: "Can't hire fast enough",
    description:
      "Columbus unemployment is near historic lows. Finding data entry clerks who stay is harder and more expensive every year.",
  },
]

const results = [
  {
    metric: "92%",
    label: "Time reduction",
    detail: "From 12.7 min to under 1 min per document",
  },
  {
    metric: "95%+",
    label: "Extraction accuracy",
    detail: "With per-field confidence scores for review",
  },
  {
    metric: "$0.50-2",
    label: "Cost per document",
    detail: "vs. $25-40 for manual processing",
  },
  {
    metric: "0",
    label: "Additional clerks needed",
    detail: "Process 300+ BOLs/day with existing team",
  },
]

const steps = [
  {
    icon: Upload,
    num: "1",
    title: "Scan at the dock or forward emails",
    description:
      "Warehouse associates scan BOLs with a phone. Carrier invoices arrive via email. Both flow to Parsli automatically.",
  },
  {
    icon: Sparkles,
    num: "2",
    title: "AI extracts your fields in seconds",
    description:
      "Shipper, consignee, weight, freight class, PRO number — extracted from any format, including faded thermal prints.",
  },
  {
    icon: Download,
    num: "3",
    title: "Data appears in your WMS/TMS",
    description:
      "Structured data pushes to your systems via API, webhooks, Zapier, or Google Sheets. No manual re-entry.",
  },
]

const objections = [
  {
    q: "Do you work with Columbus-area 3PLs?",
    a: "Yes. Parsli is built for exactly the high-volume BOL and freight invoice processing that Columbus 3PLs handle daily. Whether you're near Rickenbacker, in the I-70 corridor, or anywhere in Central Ohio.",
  },
  {
    q: "Can it handle faded thermal BOL prints?",
    a: "Yes. Parsli uses Google Gemini 2.5 Pro, which reads faded thermal prints, low-contrast warehouse scans, and handwritten notes — documents that break traditional OCR.",
  },
  {
    q: "Does it integrate with our WMS?",
    a: "Yes. REST API, webhooks, Zapier (5,000+ apps), Make, and Google Sheets. If your WMS or TMS has an API, Parsli connects to it. No middleware needed.",
  },
  {
    q: "How is this different from Shipamax?",
    a: "Shipamax requires enterprise sales calls, custom implementations, and $1,000+/month commitments. Parsli offers the same AI-powered BOL extraction with self-service pricing starting free. Sign up and start extracting in minutes, not months.",
  },
  {
    q: "What's the pricing?",
    a: "Free: 30 pages/month. Starter: $33/mo (250 pages). Growth: $59/mo (1,000 pages). Pro: $99/mo (3,000 pages). Business: $349/mo (15,000 pages). All plans include full API access and all integrations.",
  },
]

export default function Columbus3plLP() {
  return (
    <>
      {/* Hero */}
      <section className="relative pt-24 pb-16 sm:pt-32 sm:pb-20">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-primary/5 rounded-full blur-3xl" />
        </div>
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border bg-card px-4 py-1.5 text-sm text-muted-foreground mb-6">
            <MapPin className="h-4 w-4 text-primary" />
            Built for Columbus, Ohio 3PLs
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight leading-[1.1] mb-6">
            Your 3PL Moves Freight for Half the Country.
            <br />
            <span className="text-primary">Let AI Handle the Paperwork.</span>
          </h1>

          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Columbus sits at I-70 and I-71, within a 1-day drive of 50% of the
            US population. Parsli automates the BOL and freight invoice data
            entry that&apos;s slowing your operations down.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-4">
            <AuthButton className="text-base px-8 h-12 w-full sm:w-auto" showArrow>
              Start Free — 30 Pages/Month
            </AuthButton>
          </div>

          <p className="text-sm text-muted-foreground">
            No credit card &middot; No sales call &middot; Processing in under 5
            minutes
          </p>
        </div>
      </section>

      {/* Social proof — Columbus context */}
      <section className="py-10 sm:py-14 border-t bg-muted/30">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-sm text-muted-foreground mb-2">
            Built for companies like
          </p>
          <p className="text-sm font-medium text-foreground">
            ODW Logistics &middot; FST Logistics &middot; Crane Worldwide
            &middot; AIT Worldwide &middot; Highlight Motor Freight &middot; NFI
            Industries
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            and hundreds of other Columbus-area 3PLs processing shipping
            documents daily
          </p>
        </div>
      </section>

      {/* Pain points */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-4">
            Sound Familiar?
          </h2>
          <p className="text-center text-muted-foreground mb-12">
            Every Columbus 3PL we talk to has the same three problems.
          </p>
          <div className="grid md:grid-cols-3 gap-6">
            {painPoints.map((point) => (
              <div key={point.title} className="rounded-xl border bg-card p-6">
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-destructive/10 text-destructive mb-4">
                  <point.icon className="h-5 w-5" />
                </div>
                <h3 className="font-semibold mb-2 text-sm">{point.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {point.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Results — what changes */}
      <section className="py-16 sm:py-20 bg-muted/30">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-12">
            What Changes with Parsli
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {results.map((r) => (
              <div
                key={r.label}
                className="rounded-xl border bg-card p-6 text-center"
              >
                <p className="text-3xl font-bold text-primary mb-1">
                  {r.metric}
                </p>
                <p className="font-semibold text-sm mb-1">{r.label}</p>
                <p className="text-xs text-muted-foreground">{r.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-12">
            From Loading Dock to Database in Seconds
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

      {/* What gets extracted */}
      <section className="py-16 sm:py-20 bg-muted/30">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-4">
            Documents We Automate
          </h2>
          <p className="text-center text-muted-foreground mb-10">
            Every document type your Columbus 3PL handles daily.
          </p>
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              {
                name: "Bills of Lading",
                fields:
                  "Shipper, consignee, weight, freight class, PRO number, special instructions",
              },
              {
                name: "Freight Invoices",
                fields:
                  "Carrier, rates, surcharges, accessorial charges, totals, BOL reference",
              },
              {
                name: "Packing Lists",
                fields:
                  "Item descriptions, quantities, weights, dimensions, PO references",
              },
              {
                name: "Delivery Notes & PODs",
                fields:
                  "Recipient, delivery date, signature status, exception notes",
              },
            ].map((doc) => (
              <div key={doc.name} className="rounded-xl border bg-card p-5">
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="h-4 w-4 text-primary" />
                  <h3 className="font-semibold text-sm">{doc.name}</h3>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {doc.fields}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ROI callout */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl border-2 border-primary/20 bg-primary/5 p-8 sm:p-10 text-center">
            <h2 className="text-xl sm:text-2xl font-bold mb-6">
              A 500-BOL/Day Operation Saves $200K+/Year
            </h2>
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div>
                <p className="text-2xl font-bold text-destructive">$25-40</p>
                <p className="text-xs text-muted-foreground">
                  Per doc (manual)
                </p>
              </div>
              <div>
                <p className="text-2xl font-bold text-muted-foreground">→</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">$0.50-2</p>
                <p className="text-xs text-muted-foreground">
                  Per doc (Parsli)
                </p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-6">
              That&apos;s before accounting for error reduction, faster billing
              cycles, and eliminating the data entry hiring problem.
            </p>
            <AuthButton className="text-base px-8 h-12" showArrow>
              Start Free — See It on Your Documents
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
                Encrypted at rest and in transit. GDPR compliant. Your documents
                never train AI models.
              </p>
            </div>
            <div className="rounded-xl border bg-card p-6 text-center">
              <Sparkles className="h-6 w-6 text-primary mx-auto mb-3" />
              <p className="font-semibold text-sm mb-1">
                Reads Faded Dock Prints
              </p>
              <p className="text-xs text-muted-foreground">
                Google Gemini 2.5 Pro handles thermal prints, carbon copies, and
                handwriting that OCR can&apos;t.
              </p>
            </div>
            <div className="rounded-xl border bg-card p-6 text-center">
              <Zap className="h-6 w-6 text-primary mx-auto mb-3" />
              <p className="font-semibold text-sm mb-1">Live in 5 Minutes</p>
              <p className="text-xs text-muted-foreground">
                No sales calls. No implementation project. Sign up, define your
                fields, process your first BOL.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-10">
            Questions Columbus 3PLs Ask
          </h2>
          <div className="divide-y rounded-xl border bg-card">
            {objections.map((faq) => (
              <details key={faq.q} className="group">
                <summary className="flex items-center justify-between gap-4 px-6 py-5 cursor-pointer list-none text-sm sm:text-base font-medium">
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
            Columbus Moves Fast. Your Data Entry Should Too.
          </h2>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-8">
            Start free. Upload a BOL from your dock. See structured data in
            seconds. No credit card, no sales call.
          </p>
          <AuthButton className="text-base px-8 h-12" showArrow>
            Start Free — 30 Pages/Month
          </AuthButton>
          <p className="mt-6 text-xs text-muted-foreground">
            Paid plans from $33/month &middot; Cancel anytime &middot; All
            integrations included
          </p>
        </div>
      </section>
    </>
  )
}
