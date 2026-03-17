import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { FreightHeroAnimation } from "@/components/marketing/freight/FreightHeroAnimation"
import {
  Upload,
  Sparkles,
  Download,
  FileText,
  Zap,
  Clock,
  Plug,
  X,
  Check,
  ArrowRight,
  Info,
  ChevronDown,
  Quote,
  TrendingDown,
  DollarSign,
  Timer,
  ShieldCheck,
} from "lucide-react"
import { AuthButton } from "@/components/marketing/shared/AuthButton"
import { JsonLd } from "@/components/marketing/shared/JsonLd"
import { breadcrumbJsonLd, faqJsonLd } from "@/lib/seo/json-ld"

export const metadata: Metadata = {
  title:
    "Freight Invoice Automation for 3PLs & Freight Brokers | Parsli",
  description:
    "Automate freight invoice processing and bill of lading data extraction. Works with FedEx, XPO, ODFL, Estes, Saia, DHL — any carrier format. Freight audit and 3-way matching included. 30 free pages/month.",
  alternates: {
    canonical: "https://parsli.co/freight",
  },
  openGraph: {
    title: "Freight Invoice Automation for 3PLs & Freight Brokers | Parsli",
    description:
      "Automate freight invoice processing and bill of lading data extraction. Works with FedEx, XPO, ODFL, Estes, Saia, DHL — any carrier format. Freight audit and 3-way matching included. 30 free pages/month.",
    url: "https://parsli.co/freight",
  },
}

const stats = [
  { value: "92%", label: "Time Savings", icon: Timer },
  { value: "<$2", label: "Per Document Cost", icon: DollarSign },
  { value: "<15s", label: "Processing Time", icon: Zap },
  { value: "95%+", label: "Extraction Accuracy", icon: ShieldCheck },
]

const painPoints = [
  "Manually keying BOL data into your WMS — 12+ minutes per document",
  "Every carrier uses a different invoice format — FedEx, XPO, ODFL, Estes, Saia, DHL all look different",
  "Faded thermal dock prints that traditional OCR can't read",
  "3-7 day billing lag because freight invoices sit in a manual processing queue",
  "20-30% error rate means overcharges, duplicate payments, and billing disputes",
  "No automated freight audit — accessorial charges and fuel surcharges go unverified",
]

const solutions = [
  "AI reads any carrier's BOL or invoice format — FedEx, UPS, XPO, DHL, Estes, Saia, and 100+ more",
  "Handles faded thermal prints, carbon copies, and handwritten annotations",
  "Automated freight invoice audit — flag overcharges, duplicate invoices, and surcharge discrepancies",
  "Extracted data flows to your WMS, TMS, or ERP in seconds via API or webhook",
  "Process 300+ documents per day — no additional headcount needed",
  "92% time reduction — from 12.7 minutes to under 1 minute per document",
]

const supportedDocs = [
  { emoji: "\u{1F4CB}", name: "Bills of Lading" },
  { emoji: "\u{1F9FE}", name: "Freight Invoices" },
  { emoji: "\u{1F4E6}", name: "Packing Lists" },
  { emoji: "\u{1F4C4}", name: "Commercial Invoices" },
  { emoji: "\u{1F6C3}", name: "Customs Forms" },
  { emoji: "\u{1F4EC}", name: "Delivery Notes" },
]

const howItWorks = [
  {
    step: "1",
    title: "Forward Documents via Email or API",
    description:
      "Forward BOLs and freight invoices from your inbox, scan them at the dock, or send via REST API. Parsli ingests from any source.",
  },
  {
    step: "2",
    title: "AI Extracts Data Per Your Schema",
    description:
      "Define the fields you need — shipper, consignee, weight, freight class, PRO number, charges — and the AI extracts them from any format.",
  },
  {
    step: "3",
    title: "Data Flows to Your WMS/TMS",
    description:
      "Extracted data pushes to your warehouse management system, TMS, ERP, or Google Sheets automatically via webhooks, Zapier, or REST API.",
  },
]

const benefits = [
  {
    title: "Every Carrier Format — Automatically",
    description:
      "FedEx Freight, UPS, XPO, ODFL, Estes, R+L, Saia, DHL, ABF, Dayton — the AI adapts to any carrier\u2019s invoice and BOL layout without per-carrier templates or configuration.",
  },
  {
    title: "Freight Invoice Auditing Built In",
    description:
      "Automated 3-way matching between freight invoices, BOLs, and rate confirmations. Flag overcharges, duplicate invoices, and fuel surcharge discrepancies before payment. Companies recover 2-5% of freight spend through automated auditing.",
  },
  {
    title: "Dock-Quality OCR",
    description:
      "Google Gemini 2.5 Pro reads faded thermal prints, crooked scans, and carbon copies that traditional OCR engines can\u2019t process. No image pre-processing needed.",
  },
  {
    title: "WMS/TMS Integration via API & EDI",
    description:
      "Push extracted data directly to your WMS, TMS, ERP, or accounting system via REST API, webhooks, Zapier, or Google Sheets. Supports EDI-compatible JSON output for freight invoice workflows.",
  },
  {
    title: "Built for Freight Brokers",
    description:
      "Whether you\u2019re a freight broker processing carrier invoices, a 3PL managing dock receipts, or a shipper auditing freight bills — Parsli handles your document volume without adding headcount.",
  },
  {
    title: "Freight Audit Trail",
    description:
      "Every extraction includes confidence scores and links to original documents. Build a complete carrier spend database for rate negotiations and cost analysis.",
  },
]

const roiData = [
  {
    label: "Manual invoice processing cost",
    manual: "$15.96",
    parsli: "$0.33",
    source: "HighRadius",
  },
  {
    label: "Processing time per document",
    manual: "12.7 min",
    parsli: "< 1 min",
    source: "Internal",
  },
  {
    label: "Error rate",
    manual: "20-30%",
    parsli: "< 5%",
    source: "SoftLabsGroup",
  },
  {
    label: "Monthly cost (100 invoices)",
    manual: "$1,596",
    parsli: "$33",
    source: "Calculated",
  },
]

const competitors = [
  {
    name: "Manual Entry",
    speed: "15-20 min",
    accuracy: "70-80%",
    anyCarrier: "Yes (human reads)",
    cost: "$25-40/doc",
  },
  {
    name: "Template OCR (Docparser)",
    speed: "30-60 sec",
    accuracy: "75-85%",
    anyCarrier: "No (per-carrier templates)",
    cost: "$3-8/doc",
  },
  {
    name: "Enterprise (Shipamax)",
    speed: "< 30 sec",
    accuracy: "90%+",
    anyCarrier: "Yes",
    cost: "Custom ($$$$)",
  },
  {
    name: "Parsli",
    speed: "< 15 sec",
    accuracy: "95%+",
    anyCarrier: "Yes",
    cost: "$0.33/page",
    highlight: true,
  },
]

const faqs = [
  {
    question: "Can Parsli handle BOLs from different carriers?",
    answer:
      "Yes. Parsli uses AI (Google Gemini 2.5 Pro) that understands document semantics, not fixed templates. It reads BOLs from UPS, FedEx, XPO, Old Dominion, Estes, Saia, and any regional carrier without per-carrier configuration. Upload a BOL from any carrier and the AI extracts all fields automatically.",
  },
  {
    question: "What about faded thermal BOL prints?",
    answer:
      "Parsli handles dock-quality documents that break traditional OCR — faded thermal prints, low-contrast warehouse scans, crooked copies, and even handwritten annotations. No image pre-processing or cleanup required.",
  },
  {
    question: "How does pricing work for freight companies?",
    answer:
      "Parsli offers volume-based pricing starting at $33/month for 100 pages. The Free plan includes 30 pages/month — enough to test with real freight documents. For 3PLs processing 300+ documents daily, the Business plan at $349/month covers 10,000 pages. All plans include API access, webhooks, and integrations.",
  },
  {
    question: "Can I integrate with my WMS or TMS?",
    answer:
      "Yes. Parsli integrates via REST API, webhooks, Zapier, Make, and Google Sheets. Extracted BOL and invoice data can flow directly to your WMS, TMS, ERP, or accounting system without middleware. Set up email forwarding to auto-process carrier invoices from your inbox.",
  },
  {
    question: "How is Parsli different from Shipamax or Cass?",
    answer:
      "Shipamax and Cass target enterprise clients with custom pricing and long implementation timelines. Parsli is self-serve — sign up, create a parser, and start extracting data in minutes. No sales calls, no implementation project, no minimum contract. Pricing starts at $33/month vs. enterprise custom pricing.",
  },
  {
    question: "What data can I extract from freight invoices?",
    answer:
      "Carrier name, invoice number, PRO number, BOL number, origin/destination, weight, freight class, line-haul charges, fuel surcharges, accessorial charges (detention, lumper, liftgate), total charges, payment terms, and due dates. You define the schema — Parsli extracts exactly the fields you need.",
  },
  {
    question: "What is the difference between a freight invoice and a bill of lading?",
    answer:
      "A bill of lading (BOL) is a shipping document that details what is being shipped, who is shipping it, and where it is going. A freight invoice is the carrier's bill for transporting the shipment — it references the BOL and lists charges (line-haul, fuel surcharge, accessorials). Parsli extracts data from both document types and can match them for freight audit and 3-way verification.",
  },
  {
    question: "What is freight invoice auditing?",
    answer:
      "Freight invoice auditing is the process of verifying carrier charges against contracted rates, BOL details, and delivery records before approving payment. It catches overcharges, duplicate invoices, incorrect surcharges, and billing errors. Parsli automates this by extracting structured data from every invoice, enabling automated comparison against your rate agreements — companies typically recover 2-5% of freight spend through auditing.",
  },
  {
    question: "Does Parsli work with FedEx, UPS, and DHL freight invoices?",
    answer:
      "Yes. Parsli processes freight invoices from FedEx Freight, UPS Freight, DHL, XPO, Old Dominion (ODFL), Estes, Saia, ABF, Dayton, R+L Carriers, and any other carrier. The AI understands carrier-specific invoice formats without needing per-carrier templates — upload an invoice from any carrier and data is extracted automatically.",
  },
  {
    question: "Can freight brokers use Parsli for invoice processing?",
    answer:
      "Yes. Freight brokers use Parsli to automate carrier invoice processing, extract charges for billing reconciliation, and match PRO numbers across invoices and BOLs. Set up email forwarding to auto-process carrier invoices as they arrive in your inbox. The freight invoice template pre-configures all common fields (carrier, PRO, charges, surcharges) so you can start extracting immediately.",
  },
]

const logos = [
  { src: "/logos/carrefour.png", alt: "Carrefour", h: "h-8" },
  { src: "/logos/dld.png", alt: "Dubai Land Department", h: "h-16" },
  { src: "/logos/infoquest.png", alt: "InfoQuest", h: "h-8" },
  {
    src: "/logos/takhlees.png",
    alt: "Takhlees Government Services",
    h: "h-9",
  },
]

const stepIcons = [Upload, Sparkles, Download]
const benefitIcons = [FileText, Zap, Clock, Plug]

export default function FreightLandingPage() {
  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", url: "https://parsli.co" },
          {
            name: "Freight Document Automation",
            url: "https://parsli.co/freight",
          },
        ])}
      />
      <JsonLd data={faqJsonLd(faqs)} />

      {/* ═══════ Hero ═══════ */}
      <section className="relative min-h-[80vh] flex items-center justify-center">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-primary/5 rounded-full blur-3xl" />
        </div>
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-20">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary mb-6">
                For Freight Brokers, 3PLs & Carriers
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.08] mb-6">
                Freight Invoice Automation That Just Works
              </h1>
              <p className="text-lg sm:text-xl text-muted-foreground mb-8 max-w-xl">
                Stop spending 2-4 hours/day on manual data entry. Parsli
                automates freight invoice processing and BOL data extraction
                for FedEx, XPO, ODFL, Estes, Saia, DHL — any carrier, any
                format, in seconds.
              </p>
              <div className="flex flex-col sm:flex-row items-start gap-4">
                <AuthButton className="text-base px-8 h-13" showArrow href="/dashboard?template=freight-invoice">
                  Start Free — 30 Pages/Month
                </AuthButton>
                <Link
                  href="/docs"
                  className="inline-flex items-center gap-2 rounded-lg border bg-card px-7 h-13 text-base font-medium hover:bg-muted transition-colors"
                >
                  View API Docs
                </Link>
              </div>
              <p className="mt-4 text-sm text-muted-foreground">
                No credit card required
              </p>
            </div>
            <FreightHeroAnimation />
          </div>
        </div>
      </section>

      {/* ═══════ Social Proof ═══════ */}
      <section className="py-12 border-y bg-muted/30">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <p className="text-sm text-muted-foreground text-center mb-6">
            Trusted by companies processing thousands of documents
          </p>
          <div className="flex items-center justify-center gap-8 sm:gap-12 flex-wrap">
            {logos.map((logo) => (
              <Image
                key={logo.alt}
                src={logo.src}
                alt={logo.alt}
                width={140}
                height={40}
                className={`${logo.h} w-auto object-contain opacity-70 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-200`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ Stats ═══════ */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((stat) => {
              const Icon = stat.icon
              return (
                <div
                  key={stat.label}
                  className="rounded-xl border bg-card p-6 text-center"
                >
                  <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 text-primary mb-3">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="text-3xl sm:text-4xl font-bold text-foreground mb-1">
                    {stat.value}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {stat.label}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ═══════ Pain Comparison ═══════ */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <p className="text-sm font-semibold text-primary text-center mb-3">
            Why Parsli?
          </p>
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-12">
            End the freight invoice processing bottleneck
          </h2>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="rounded-xl border bg-card p-6 sm:p-8">
              <h3 className="text-lg font-bold text-destructive mb-6">
                Without Parsli
              </h3>
              <ul className="space-y-4">
                {painPoints.map((point) => (
                  <li key={point} className="flex gap-3">
                    <X className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                    <span className="text-muted-foreground">{point}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-xl border border-primary/20 bg-primary/[0.03] p-6 sm:p-8">
              <h3 className="text-lg font-bold text-primary mb-6">
                With Parsli
              </h3>
              <ul className="space-y-4">
                {solutions.map((point) => (
                  <li key={point} className="flex gap-3">
                    <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <span className="text-foreground">{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <p className="mt-8 text-center">
            <span className="inline-block rounded-md bg-primary px-3 py-1 text-sm font-bold text-primary-foreground">
              Save 60+ clerk-hours per day on logistics document processing.
            </span>
          </p>
        </div>
      </section>

      {/* ═══════ ROI Calculator ═══════ */}
      <section className="py-16 sm:py-20 bg-muted/30">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <p className="text-sm font-semibold text-primary text-center mb-3">
            ROI
          </p>
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-4">
            Processing 100 freight invoices manually costs $1,596/mo
          </h2>
          <p className="text-center text-muted-foreground max-w-2xl mx-auto mb-12">
            Parsli costs $33/mo. Here&apos;s the math.
          </p>

          <div className="rounded-xl border bg-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left px-6 py-4 font-semibold">
                      Metric
                    </th>
                    <th className="text-center px-6 py-4 font-semibold text-destructive">
                      Manual
                    </th>
                    <th className="text-center px-6 py-4 font-semibold text-primary">
                      Parsli
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {roiData.map((row) => (
                    <tr key={row.label} className="border-b last:border-0">
                      <td className="px-6 py-4 text-muted-foreground">
                        {row.label}
                      </td>
                      <td className="px-6 py-4 text-center font-medium text-destructive">
                        {row.manual}
                      </td>
                      <td className="px-6 py-4 text-center font-medium text-primary">
                        {row.parsli}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="border-t bg-primary/[0.03] px-6 py-4 text-center">
              <span className="font-semibold text-primary">
                48x cost reduction
              </span>
              <span className="text-muted-foreground">
                {" "}
                — switch from $1,596/mo to $33/mo for 100 invoices
              </span>
            </div>
          </div>

          <p className="mt-4 text-xs text-muted-foreground text-center">
            Sources: HighRadius (AP automation pricing), SoftLabsGroup (freight
            error rates), Expedock (processing time benchmarks)
          </p>
        </div>
      </section>

      {/* ═══════ Callout Box ═══════ */}
      <section className="pb-16 sm:pb-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 pt-16">
          <div className="rounded-xl border border-primary/20 bg-primary/[0.03] p-6 sm:p-8 flex gap-4">
            <div className="shrink-0">
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 text-primary">
                <Info className="h-5 w-5" />
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-1">
                Works with Dock-Quality Documents
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                Google Gemini 2.5 Pro reads faded thermal BOL prints,
                low-contrast warehouse scans, and even handwritten notes —
                documents that break traditional OCR. No pre-processing or image
                cleanup required.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════ Supported Document Types ═══════ */}
      <section className="py-16 sm:py-20 bg-muted/30">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <p className="text-sm font-semibold text-primary text-center mb-3">
            Document Types
          </p>
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-12">
            Every freight document format supported
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
            {supportedDocs.map((type) => (
              <div
                key={type.name}
                className="rounded-xl border bg-card p-5 text-center hover:border-primary/30 transition-colors"
              >
                <span className="text-3xl mb-3 block">{type.emoji}</span>
                <span className="text-sm font-medium">{type.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ How It Works ═══════ */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <p className="text-sm font-semibold text-primary text-center mb-3">
            How It Works
          </p>
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-12">
            Three steps to structured freight data
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {howItWorks.map((step, i) => {
              const Icon = stepIcons[i]
              return (
                <div
                  key={step.step}
                  className="relative rounded-xl border bg-card p-6 text-center"
                >
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary mb-4">
                    <Icon className="h-6 w-6" />
                  </div>
                  <div className="absolute top-4 right-4 text-xs font-bold text-muted-foreground/40">
                    {step.step}
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{step.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {step.description}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ═══════ See It In Action ═══════ */}
      <section className="py-16 sm:py-20 bg-muted/30">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <p className="text-sm font-semibold text-primary text-center mb-3">
            See It In Action
          </p>
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-4">
            From loading dock to database in minutes
          </h2>
          <p className="text-center text-muted-foreground max-w-2xl mx-auto mb-12">
            No complex setup. No code required. Just define what you need and
            let AI do the rest.
          </p>

          <div className="space-y-16">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold mb-4">
                  1
                </div>
                <h3 className="text-xl font-semibold mb-2">
                  Create a freight parser
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  Name your parser &ldquo;Freight Invoices&rdquo; or &ldquo;BOL
                  Extraction&rdquo;. Each parser is a reusable extraction
                  template for a specific document type.
                </p>
              </div>
              <div className="rounded-xl border bg-card overflow-hidden shadow-sm">
                <Image
                  src="/images/app/create-parser.png"
                  alt="Create Parser dialog for freight invoice extraction"
                  width={1000}
                  height={600}
                  className="w-full h-auto"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div className="md:order-2">
                <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold mb-4">
                  2
                </div>
                <h3 className="text-xl font-semibold mb-2">
                  Define freight fields
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  Add fields for carrier name, PRO number, weight, freight
                  class, charges, and surcharges. Choose from 15 field types
                  including tables for line-item accessorial charges.
                </p>
              </div>
              <div className="rounded-xl border bg-card overflow-hidden shadow-sm md:order-1">
                <Image
                  src="/images/app/schema-overview.png"
                  alt="Schema builder with freight-specific fields defined"
                  width={1500}
                  height={580}
                  className="w-full h-auto"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold mb-4">
                  3
                </div>
                <h3 className="text-xl font-semibold mb-2">
                  Connect to your WMS/TMS
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  Send extracted data to your WMS, TMS, ERP, or accounting
                  system via webhooks, Zapier, Make, or Google Sheets. One-click
                  setup, no code required.
                </p>
              </div>
              <div className="rounded-xl border bg-card overflow-hidden shadow-sm">
                <Image
                  src="/images/app/add-integration.png"
                  alt="Integration options: Webhook, Google Sheets, Zapier, Make, Power Automate, and Gmail"
                  width={1000}
                  height={1050}
                  className="w-full h-auto"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════ Code Example ═══════ */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <p className="text-sm font-semibold text-primary text-center mb-3">
            API
          </p>
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-10">
            Extract BOL Data in One API Call
          </h2>
          <div className="rounded-xl border bg-[#1e1e2e] overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-white/10">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500/80" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                <div className="w-3 h-3 rounded-full bg-green-500/80" />
              </div>
              <span className="text-xs text-white/50 ml-2">
                Extract BOL Data via API
              </span>
            </div>
            <pre className="p-6 overflow-x-auto text-sm leading-relaxed">
              <code className="text-green-300/90 font-mono">{`const response = await fetch('https://api.parsli.co/v1/extract', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    parser_id: 'your_bol_parser_id',
    file_url: 'https://example.com/bol-document.pdf',
  }),
});

const data = await response.json();
// {
//   "shipper_name": "ABC Manufacturing Co.",
//   "consignee_name": "XYZ Distribution LLC",
//   "weight": "12,450 lbs",
//   "freight_class": "85",
//   "pro_number": "PRO-2026-004817",
//   "description_of_goods": "Industrial components, NMFC 156400",
//   "pieces": 24,
//   "special_instructions": "Dock delivery, no appointment needed"
// }`}</code>
            </pre>
          </div>
        </div>
      </section>

      {/* ═══════ Competitive Comparison ═══════ */}
      <section className="py-16 sm:py-20 bg-muted/30">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <p className="text-sm font-semibold text-primary text-center mb-3">
            Compare
          </p>
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-4">
            How Parsli compares to alternatives
          </h2>
          <p className="text-center text-muted-foreground max-w-2xl mx-auto mb-12">
            No enterprise contracts. No per-carrier templates. No 6-month
            implementations.
          </p>

          <div className="rounded-xl border bg-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left px-5 py-4 font-semibold">
                      Approach
                    </th>
                    <th className="text-center px-5 py-4 font-semibold">
                      Speed
                    </th>
                    <th className="text-center px-5 py-4 font-semibold">
                      Accuracy
                    </th>
                    <th className="text-center px-5 py-4 font-semibold hidden sm:table-cell">
                      Any Carrier
                    </th>
                    <th className="text-center px-5 py-4 font-semibold">
                      Cost
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {competitors.map((row) => (
                    <tr
                      key={row.name}
                      className={`border-b last:border-0 ${row.highlight ? "bg-primary/[0.03]" : ""}`}
                    >
                      <td
                        className={`px-5 py-4 font-medium ${row.highlight ? "text-primary" : ""}`}
                      >
                        {row.name}
                      </td>
                      <td className="px-5 py-4 text-center text-muted-foreground">
                        {row.speed}
                      </td>
                      <td className="px-5 py-4 text-center text-muted-foreground">
                        {row.accuracy}
                      </td>
                      <td className="px-5 py-4 text-center text-muted-foreground hidden sm:table-cell">
                        {row.anyCarrier}
                      </td>
                      <td
                        className={`px-5 py-4 text-center font-medium ${row.highlight ? "text-primary" : "text-muted-foreground"}`}
                      >
                        {row.cost}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════ Benefits ═══════ */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <p className="text-sm font-semibold text-primary text-center mb-3">
            Features
          </p>
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-12">
            Built for freight invoice automation
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {benefits.map((benefit, i) => {
              const Icon = benefitIcons[i % benefitIcons.length]
              return (
                <div
                  key={benefit.title}
                  className="rounded-xl border bg-card p-6 hover:border-primary/30 transition-colors"
                >
                  <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 text-primary mb-4">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-semibold mb-2">{benefit.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {benefit.description}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ═══════ Testimonial ═══════ */}
      <section className="py-16 sm:py-20 bg-muted/30">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-xl border bg-card p-8 sm:p-10 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary mb-6">
              <Quote className="h-6 w-6" />
            </div>
            <blockquote className="text-lg sm:text-xl leading-relaxed text-foreground mb-6">
              &ldquo;Working with ByteBeam has been an exceptional experience.
              Their agile and well-organised team helped us transform a
              time-consuming, manual process into a smart, efficient workflow
              &ndash; saving both time and costs while ensuring quality and
              compliance.&rdquo;
            </blockquote>
            <div>
              <div className="font-semibold">Chief Financial Officer</div>
              <div className="text-sm text-muted-foreground">
                Licensed Governmental Center, Takhlees
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════ Mid-page CTA ═══════ */}
      <section className="py-12 sm:py-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 text-center">
          <AuthButton className="text-base px-8 h-12" showArrow href="/dashboard?template=freight-invoice">
            Start Free — 30 Pages/Month
          </AuthButton>
          <p className="mt-3 text-sm text-muted-foreground">
            No credit card required &middot; 30 free pages/month
          </p>
        </div>
      </section>

      {/* ═══════ Free Tools ═══════ */}
      <section className="py-16 sm:py-20 border-t">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <p className="text-sm font-semibold text-primary text-center mb-3">
            Try Free
          </p>
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-4">
            Free freight document tools
          </h2>
          <p className="text-center text-muted-foreground max-w-2xl mx-auto mb-12">
            Extract data from freight documents right now. No sign-up required.
          </p>

          <div className="grid sm:grid-cols-3 gap-6">
            <Link
              href="/tools/bol-parser"
              className="rounded-xl border bg-card p-6 hover:border-primary/30 hover:shadow-sm transition-all group"
            >
              <h3 className="font-semibold mb-2 group-hover:text-primary transition-colors">
                Free BOL Parser
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Extract text from bills of lading instantly in your browser.
              </p>
              <span className="inline-flex items-center gap-1 text-xs font-medium text-primary">
                Try free
                <ArrowRight className="h-3 w-3" />
              </span>
            </Link>
            <Link
              href="/tools/invoice-parser"
              className="rounded-xl border bg-card p-6 hover:border-primary/30 hover:shadow-sm transition-all group"
            >
              <h3 className="font-semibold mb-2 group-hover:text-primary transition-colors">
                Free Invoice Parser
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Extract data from carrier invoices and freight invoices.
              </p>
              <span className="inline-flex items-center gap-1 text-xs font-medium text-primary">
                Try free
                <ArrowRight className="h-3 w-3" />
              </span>
            </Link>
            <Link
              href="/tools/pdf-to-excel"
              className="rounded-xl border bg-card p-6 hover:border-primary/30 hover:shadow-sm transition-all group"
            >
              <h3 className="font-semibold mb-2 group-hover:text-primary transition-colors">
                PDF to Excel
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Convert freight PDF reports and rate sheets to spreadsheets.
              </p>
              <span className="inline-flex items-center gap-1 text-xs font-medium text-primary">
                Try free
                <ArrowRight className="h-3 w-3" />
              </span>
            </Link>
          </div>
        </div>
      </section>

      {/* ═══════ FAQ ═══════ */}
      <section className="py-16 sm:py-20 bg-muted/30">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <p className="text-sm font-semibold text-primary text-center mb-3">
            FAQ
          </p>
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-12">
            Frequently asked questions
          </h2>
          <div className="space-y-4">
            {faqs.map((item) => (
              <details
                key={item.question}
                className="group rounded-xl border bg-card"
              >
                <summary className="flex items-center justify-between gap-4 px-6 py-5 cursor-pointer list-none font-medium hover:text-primary transition-colors [&::-webkit-details-marker]:hidden">
                  {item.question}
                  <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
                </summary>
                <div className="px-6 pb-5 -mt-1">
                  <p className="text-muted-foreground leading-relaxed">
                    {item.answer}
                  </p>
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ Related Resources ═══════ */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <p className="text-sm font-semibold text-primary text-center mb-3">
            Resources
          </p>
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-12">
            Learn more about freight automation
          </h2>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              {
                href: "/use-cases/bill-of-lading-parsing",
                label: "Bill of Lading Parsing",
                type: "Use Case",
              },
              {
                href: "/use-cases/freight-invoice-processing",
                label: "Freight Invoice Processing",
                type: "Use Case",
              },
              {
                href: "/solutions/logistics-document-automation",
                label: "Logistics Document Automation",
                type: "Solution",
              },
              {
                href: "/blog/bill-of-lading-requirements-complete-guide",
                label: "BOL Requirements Guide",
                type: "Blog",
              },
              {
                href: "/blog/cost-of-manual-data-entry-3pl",
                label: "Cost of Manual Data Entry for 3PLs",
                type: "Blog",
              },
              {
                href: "/compare/shipamax",
                label: "Parsli vs Shipamax",
                type: "Compare",
              },
              {
                href: "/guides/automate-freight-invoice-processing",
                label: "Freight Invoice Automation Guide",
                type: "Guide",
              },
              {
                href: "/guides/extract-data-from-bills-of-lading",
                label: "BOL Data Extraction Guide",
                type: "Guide",
              },
              {
                href: "/pricing",
                label: "Pricing",
                type: "Pricing",
              },
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-xl border bg-card p-5 hover:border-primary/30 hover:shadow-sm transition-all group"
              >
                <span className="text-xs font-medium text-primary">
                  {link.type}
                </span>
                <h3 className="font-semibold mt-1 group-hover:text-primary transition-colors">
                  {link.label}
                </h3>
                <span className="inline-flex items-center gap-1 text-xs font-medium text-primary mt-3">
                  Learn more
                  <ArrowRight className="h-3 w-3" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ Final CTA ═══════ */}
      <section className="py-20 sm:py-28 border-t bg-muted/30">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Stop keying freight data by hand
          </h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto">
            Start extracting structured data from BOLs and freight invoices in
            minutes. No credit card required.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <AuthButton className="text-base px-8 h-13" showArrow>
              Start Free — 30 Pages/Month
            </AuthButton>
            <Link
              href="/docs"
              className="inline-flex items-center gap-2 text-base font-medium text-primary hover:underline"
            >
              Read Documentation
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <p className="mt-5 text-sm text-muted-foreground">
            No credit card required &middot; 30 free pages/month &middot; Cancel
            anytime
          </p>
        </div>
      </section>
    </>
  )
}
