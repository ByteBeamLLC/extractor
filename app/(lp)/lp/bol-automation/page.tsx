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
  Zap,
  ChevronDown,
} from "lucide-react"
import { AuthButton } from "@/components/marketing/shared/AuthButton"
import { Button } from "@/components/ui/button"

export const metadata: Metadata = {
  title: "Automate Bill of Lading Data Entry — 92% Faster | Parsli",
  description:
    "Stop keying BOL data by hand. Parsli AI extracts shipper, consignee, weight, freight class, and PRO number from any BOL format in seconds. Start free.",
  robots: { index: false, follow: false },
  alternates: { canonical: "https://parsli.co/lp/bol-automation" },
}

const painStats = [
  { value: "12.7 min", label: "Average time to manually process one BOL" },
  { value: "20-30%", label: "Of freight documents contain errors" },
  { value: "$25-40", label: "True cost per manually processed document" },
  { value: "300+", label: "BOLs a mid-size 3PL processes daily" },
]

const beforeAfter = [
  {
    before: "Clerk reads BOL, hunts for fields, types into WMS",
    after: "AI reads BOL and pushes structured data to WMS automatically",
  },
  {
    before: "12+ minutes per document, 20% error rate",
    after: "Under 1 minute, 95%+ accuracy with confidence scores",
  },
  {
    before: "Scaling means hiring more data entry clerks",
    after: "Process 300+ BOLs/day with zero additional headcount",
  },
  {
    before: "Faded thermal prints are unreadable by basic OCR",
    after: "Gemini 2.5 Pro reads faded prints, handwriting, carbon copies",
  },
]

const steps = [
  {
    icon: Upload,
    num: "1",
    title: "Forward your BOLs",
    description:
      "Scan at the dock, forward carrier emails, or send via API. Any source works.",
  },
  {
    icon: Sparkles,
    num: "2",
    title: "AI extracts your fields",
    description:
      "Shipper, consignee, weight, freight class, PRO number — whatever you need.",
  },
  {
    icon: Download,
    num: "3",
    title: "Data flows to your systems",
    description:
      "WMS, TMS, Google Sheets, or any system via API/webhooks/Zapier.",
  },
]

const objections = [
  {
    q: "Will it work with our BOL formats?",
    a: "Yes. Parsli handles any carrier format — UPS, FedEx, XPO, ODFL, Estes, and custom BOLs. No templates needed. The AI adapts to any layout.",
  },
  {
    q: "What about faded thermal prints from the dock?",
    a: "Parsli uses Google Gemini 2.5 Pro, which reads faded thermal prints, carbon copies, and handwritten annotations that traditional OCR can't handle.",
  },
  {
    q: "How long does setup take?",
    a: "Under 5 minutes. Create a parser, define your BOL fields (shipper, consignee, weight, etc.), upload a test document, and verify the results. No IT involvement needed.",
  },
  {
    q: "Does it integrate with our WMS?",
    a: "Yes. REST API, webhooks, Zapier (5,000+ apps), Make, and Google Sheets. If your WMS has an API, Parsli connects to it.",
  },
]

export default function BolAutomationLP() {
  return (
    <>
      {/* Hero — value prop above the fold */}
      <section className="relative pt-24 pb-16 sm:pt-32 sm:pb-20">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-primary/5 rounded-full blur-3xl" />
        </div>
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border bg-card px-4 py-1.5 text-sm text-muted-foreground mb-6">
            <Zap className="h-4 w-4 text-primary" />
            92% faster than manual entry
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight leading-[1.1] mb-6">
            Stop Keying BOL Data{" "}
            <span className="text-primary">Into Your WMS by Hand</span>
          </h1>

          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Parsli AI extracts shipper, consignee, weight, freight class, PRO
            number, and every FMCSA field from any bill of lading — in seconds,
            not minutes.
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

      {/* Pain stats — agitate the problem */}
      <section className="py-12 sm:py-16 border-t bg-muted/30">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm font-medium text-muted-foreground mb-8 uppercase tracking-wider">
            The manual data entry problem
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
        </div>
      </section>

      {/* Before/After — show the transformation */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-12">
            Before Parsli vs. After Parsli
          </h2>
          <div className="space-y-4">
            {beforeAfter.map((row) => (
              <div
                key={row.before}
                className="grid md:grid-cols-2 gap-4"
              >
                <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-5">
                  <p className="text-xs font-medium text-destructive mb-2 uppercase tracking-wider">
                    Before
                  </p>
                  <p className="text-sm text-foreground">{row.before}</p>
                </div>
                <div className="rounded-xl border border-green-500/20 bg-green-500/5 p-5">
                  <p className="text-xs font-medium text-green-600 mb-2 uppercase tracking-wider">
                    After
                  </p>
                  <p className="text-sm text-foreground">{row.after}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works — 3 steps */}
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

      {/* What gets extracted — concrete proof */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-4">
            Fields Parsli Extracts from Any BOL
          </h2>
          <p className="text-center text-muted-foreground mb-10">
            Define your schema once. The AI extracts from any carrier format.
          </p>

          <div className="rounded-xl border bg-card p-6 sm:p-8">
            <div className="grid sm:grid-cols-2 gap-3">
              {[
                "Shipper name & address",
                "Consignee name & address",
                "Description of goods",
                "Weight & piece count",
                "Freight class & NMFC code",
                "PRO / tracking number",
                "Special instructions",
                "Carrier name & SCAC code",
                "Pickup & delivery dates",
                "Hazmat classification",
                "Seal numbers",
                "Any custom field you define",
              ].map((field) => (
                <div key={field} className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-600 shrink-0" />
                  <span className="text-sm">{field}</span>
                </div>
              ))}
            </div>
          </div>

          {/* JSON output preview */}
          <div className="mt-8 rounded-xl border bg-zinc-950 text-zinc-100 p-6 overflow-x-auto">
            <p className="text-xs text-zinc-500 mb-3 font-mono">
              // Parsli API response
            </p>
            <pre className="text-xs sm:text-sm font-mono leading-relaxed">
              {`{
  "shipper_name": "ABC Manufacturing Co.",
  "consignee_name": "XYZ Distribution LLC",
  "weight": "12,450 lbs",
  "freight_class": "85",
  "pro_number": "PRO-2026-004817",
  "pieces": 24,
  "description": "Industrial components"
}`}
            </pre>
          </div>
        </div>
      </section>

      {/* Trust signals */}
      <section className="py-12 sm:py-16 bg-muted/30">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="grid sm:grid-cols-3 gap-6">
            <div className="rounded-xl border bg-card p-6 text-center">
              <Shield className="h-6 w-6 text-primary mx-auto mb-3" />
              <p className="font-semibold text-sm mb-1">SOC 2 Infrastructure</p>
              <p className="text-xs text-muted-foreground">
                Hosted on Supabase & Vercel. Encrypted at rest and in transit.
                GDPR compliant.
              </p>
            </div>
            <div className="rounded-xl border bg-card p-6 text-center">
              <Sparkles className="h-6 w-6 text-primary mx-auto mb-3" />
              <p className="font-semibold text-sm mb-1">Google Gemini 2.5 Pro</p>
              <p className="text-xs text-muted-foreground">
                Latest multimodal AI. Reads faded prints, handwriting, and
                complex layouts.
              </p>
            </div>
            <div className="rounded-xl border bg-card p-6 text-center">
              <Clock className="h-6 w-6 text-primary mx-auto mb-3" />
              <p className="font-semibold text-sm mb-1">5-Minute Setup</p>
              <p className="text-xs text-muted-foreground">
                No sales calls. No implementation timeline. Sign up and
                start extracting today.
              </p>
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
                <p className="text-3xl font-bold text-destructive">$25-40</p>
                <p className="text-sm text-muted-foreground">
                  Per document (manual)
                </p>
              </div>
              <div className="flex items-center justify-center">
                <ArrowRight className="h-6 w-6 text-muted-foreground" />
              </div>
              <div>
                <p className="text-3xl font-bold text-green-600">$0.50-2</p>
                <p className="text-sm text-muted-foreground">
                  Per document (Parsli)
                </p>
              </div>
            </div>
            <p className="text-muted-foreground mb-6">
              A 3PL processing 500 BOLs/day saves{" "}
              <span className="font-bold text-foreground">
                $200,000+/year
              </span>{" "}
              in data entry costs alone — before accounting for error reduction
              and faster billing.
            </p>
            <AuthButton className="text-base px-8 h-12" showArrow>
              Start Free — See It on Your BOLs
            </AuthButton>
          </div>
        </div>
      </section>

      {/* Objection handling — mini FAQ */}
      <section className="py-16 sm:py-20 bg-muted/30">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-10">
            Common Questions
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
            Your Clerks Have Better Things to Do
          </h2>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-8">
            Start free. Upload a BOL. See structured data in seconds. No credit
            card, no sales call, no implementation timeline.
          </p>
          <AuthButton className="text-base px-8 h-12" showArrow>
            Start Free — 30 Pages/Month
          </AuthButton>
          <p className="mt-6 text-xs text-muted-foreground">
            Paid plans from $20/month for 250 pages &middot; Cancel anytime
          </p>
        </div>
      </section>
    </>
  )
}
