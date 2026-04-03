import type { Metadata } from "next"
import Link from "next/link"
import {
  Brain,
  FileText,
  Table,
  Mail,
  Plug,
  Shield,
  Zap,
  Code2,
  FileSpreadsheet,
  Layers,
  ScanText,
  ArrowRight,
  Check,
  Star,
  Upload,
  Workflow,
  Globe,
  Lock,
  BarChart3,
  PenLine,
} from "lucide-react"
import { AuthButton } from "@/components/marketing/shared/AuthButton"
import { Button } from "@/components/ui/button"
import { JsonLd } from "@/components/marketing/shared/JsonLd"
import { breadcrumbJsonLd } from "@/lib/seo/json-ld"

export const metadata: Metadata = {
  title: "Features — AI Document Data Extraction | Parsli",
  description:
    "Explore Parsli's features: AI-powered extraction from PDFs, images, and emails. Custom schemas, Google Sheets integration, REST API, Zapier, Make, and more. Free to start.",
  keywords: [
    "document extraction features",
    "ai document parser features",
    "pdf data extraction software",
    "email parsing features",
    "document automation features",
    "ocr software features",
    "intelligent document processing",
    "no-code document parser",
  ],
  alternates: { canonical: "https://parsli.co/features" },
  openGraph: {
    title: "Features — AI Document Data Extraction | Parsli",
    description:
      "AI-powered extraction from PDFs, images, and emails. Custom schemas, integrations, and REST API.",
    url: "https://parsli.co/features",
  },
}

const coreFeatures = [
  {
    icon: Brain,
    title: "AI-Powered Extraction",
    description:
      "Powered by Google Gemini 2.5 Pro. Understands document context, not just character patterns. Handles complex layouts, handwriting, and poor-quality scans that template OCR misses.",
    highlight: true,
  },
  {
    icon: Layers,
    title: "Custom Schema Builder",
    description:
      "Define exactly what fields to extract — no code, no templates. Drag-and-drop field definitions with types (text, number, date, currency, array). The AI follows your schema precisely.",
  },
  {
    icon: FileText,
    title: "Any Document Type",
    description:
      "PDFs, images, scans, Word docs, Excel files, emails, and attachments. Invoices, receipts, bank statements, contracts, forms, bills of lading — if it has data, Parsli extracts it.",
  },
  {
    icon: Table,
    title: "Table & Line Item Extraction",
    description:
      "Detects and extracts table data with rows, columns, and headers preserved. Handles multi-page tables, nested line items, and complex invoice layouts automatically.",
  },
  {
    icon: Mail,
    title: "Email Parsing",
    description:
      "Forward emails to your Parsli inbox. The AI extracts data from both the email body and attachments — invoices, orders, lead notifications, booking confirmations, and more.",
  },
  {
    icon: ScanText,
    title: "Built-in OCR",
    description:
      "No separate OCR tool needed. Parsli reads scanned documents, photos, faxes, and image-based PDFs. Supports 100+ languages with AI-enhanced recognition that goes beyond traditional OCR.",
  },
]

const integrationFeatures = [
  {
    icon: FileSpreadsheet,
    title: "Google Sheets",
    description:
      "Auto-fill spreadsheets with extracted data via IMPORTDATA formula. Real-time refresh.",
    href: "/integrations/google-sheets",
  },
  {
    icon: Zap,
    title: "Zapier",
    description:
      "Connect to 5,000+ apps. Trigger Zaps when documents are processed.",
    href: "/integrations/zapier",
  },
  {
    icon: Workflow,
    title: "Make (Integromat)",
    description:
      "Build visual automations with Make scenarios triggered by document extraction.",
    href: "/integrations/make",
  },
  {
    icon: Mail,
    title: "Gmail & Email",
    description:
      "Auto-process email attachments. Forward emails to your Parsli address.",
    href: "/integrations/gmail",
  },
  {
    icon: Code2,
    title: "REST API",
    description:
      "Full API access. Upload documents, get structured JSON. Batch process via code.",
    href: "/integrations/api",
  },
  {
    icon: Globe,
    title: "Webhooks",
    description:
      "Push extracted data to any endpoint in real-time via HTTP webhooks.",
    href: "/integrations/webhooks",
  },
]

const advancedFeatures = [
  {
    icon: Upload,
    title: "Multiple Import Methods",
    description:
      "Upload via dashboard, forward emails, send via API, or use webhook triggers. Process documents however they arrive.",
  },
  {
    icon: PenLine,
    title: "Handwriting Recognition",
    description:
      "AI reads cursive, messy handwriting, and old documents with 95%+ accuracy. Far beyond what traditional OCR can handle.",
  },
  {
    icon: BarChart3,
    title: "Extraction Analytics",
    description:
      "Track processing volume, accuracy, and throughput. Monitor extraction performance across all your parsers.",
  },
  {
    icon: Lock,
    title: "Security & Privacy",
    description:
      "Data encrypted in transit (TLS 1.3) and at rest (AES-256). Hosted on Supabase with row-level security. Documents processed and stored securely.",
  },
]

const comparisonRows = [
  ["AI document understanding", "Yes (Gemini 2.5 Pro)", "No", "No"],
  ["Custom extraction schemas", "Yes (no-code)", "No", "No"],
  ["Handwriting recognition", "95%+ accuracy", "Poor", "N/A"],
  ["Table/line item extraction", "Yes", "Basic", "No"],
  ["Email parsing", "Yes", "No", "No"],
  ["Google Sheets integration", "Native", "No", "Manual"],
  ["Zapier/Make integration", "Yes", "No", "No"],
  ["REST API", "Yes", "No", "No"],
  ["100+ languages", "Yes", "Limited", "Limited"],
  ["Free tier", "30 pages/mo", "Limited", "Varies"],
]

const faqs = [
  {
    q: "What document types does Parsli support?",
    a: "PDFs (native and scanned), images (JPG, PNG, TIFF, WebP), Word documents, Excel files, and emails with attachments. Any document containing text or data can be processed.",
  },
  {
    q: "How does the custom schema builder work?",
    a: "You define the fields you want extracted (e.g., invoice_number, total_amount, vendor_name) with data types. The AI then extracts exactly those fields from every document, outputting clean structured data.",
  },
  {
    q: "What AI model does Parsli use?",
    a: "Parsli uses Google Gemini 2.5 Pro for extraction. This is a multimodal AI that understands both text and visual layout, enabling it to handle complex documents that rule-based OCR cannot.",
  },
  {
    q: "Is there a free plan?",
    a: "Yes. The free plan includes 30 pages/month, 3 parsers, API access, and webhook integrations. No credit card required. Paid plans start at $20/month for 250 pages.",
  },
  {
    q: "How accurate is the extraction?",
    a: "Parsli achieves 95%+ accuracy on most document types. For clean, well-formatted documents like invoices and bank statements, accuracy is typically 98-99%. Complex layouts and handwriting achieve 95%+.",
  },
  {
    q: "Can I use Parsli via API?",
    a: "Yes. The REST API supports document upload, extraction triggering, and result retrieval. You get structured JSON output matching your schema. API access is included on all plans, including free.",
  },
]

export default function FeaturesPage() {
  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", url: "https://parsli.co" },
          { name: "Features", url: "https://parsli.co/features" },
        ])}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          name: "Parsli",
          description:
            "AI-powered document data extraction platform. Extract structured data from PDFs, images, and emails with custom schemas.",
          applicationCategory: "BusinessApplication",
          operatingSystem: "Web Browser",
          offers: {
            "@type": "Offer",
            price: "0",
            priceCurrency: "USD",
            description: "Free tier: 30 pages/month. Paid plans from $20/mo.",
          },
          featureList: [
            "AI-powered extraction with Google Gemini 2.5 Pro",
            "Custom no-code schema builder",
            "PDF, image, scan, and email parsing",
            "Table and line item extraction",
            "Handwriting and cursive recognition",
            "Google Sheets, Zapier, Make integrations",
            "REST API with JSON output",
            "100+ language support",
          ],
        }}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: faqs.map((faq) => ({
            "@type": "Question",
            name: faq.q,
            acceptedAnswer: { "@type": "Answer", text: faq.a },
          })),
        }}
      />

      {/* Hero */}
      <section className="relative pt-24 sm:pt-32 pb-16 sm:pb-20">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-primary/5 rounded-full blur-3xl" />
        </div>
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border bg-card px-4 py-1.5 text-sm text-muted-foreground mb-6">
            <Brain className="h-4 w-4 text-primary" />
            Powered by Google Gemini 2.5 Pro
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.08] mb-5">
            Turn any document into{" "}
            <span className="text-primary">structured data</span>
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-8 leading-relaxed">
            AI-powered extraction from PDFs, images, scans, and emails. Define
            what you need, Parsli extracts it. No templates, no rules, no code.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-6">
            <AuthButton className="text-base px-8 h-12" showArrow>
              Start Free — 30 Pages/Month
            </AuthButton>
            <Button
              variant="outline"
              size="lg"
              className="text-base px-8 h-12"
              asChild
            >
              <Link href="/pricing">View Pricing</Link>
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            No credit card required &middot; Free forever up to 30 pages/month
          </p>
        </div>
      </section>

      {/* Core Features */}
      <section className="py-16 sm:py-20 border-t bg-muted/30">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary mb-3">
              Core Features
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
              Everything you need to extract document data
            </h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {coreFeatures.map((f) => (
              <div
                key={f.title}
                className={`rounded-2xl border bg-card p-7 ${f.highlight ? "border-primary/30 ring-1 ring-primary/10" : ""}`}
              >
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary mb-5">
                  <f.icon className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {f.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary mb-3">
              How It Works
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
              Three steps to structured data
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: "1",
                title: "Define your schema",
                description:
                  "Use the visual schema builder to define exactly what fields you need extracted. Set data types, mark required fields, and add descriptions.",
              },
              {
                step: "2",
                title: "Send documents",
                description:
                  "Upload via dashboard, forward emails, push via API, or trigger via webhook. Parsli processes any format — PDFs, images, scans, emails.",
              },
              {
                step: "3",
                title: "Get structured data",
                description:
                  "Extracted data flows to Google Sheets, Zapier, Make, webhooks, or your API. JSON, CSV, or spreadsheet — your choice.",
              },
            ].map((item) => (
              <div
                key={item.step}
                className="relative rounded-2xl border bg-card p-7"
              >
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-lg mb-5">
                  {item.step}
                </div>
                <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Integrations */}
      <section className="py-16 sm:py-20 border-t bg-muted/30">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary mb-3">
              Integrations
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
              Connect to your existing tools
            </h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              Extracted data flows where you need it — spreadsheets, CRMs,
              databases, or your own systems.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {integrationFeatures.map((f) => (
              <Link
                key={f.title}
                href={f.href}
                className="rounded-2xl border bg-card p-6 hover:border-primary/30 transition-colors group"
              >
                <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary mb-4">
                  <f.icon className="h-5 w-5" />
                </div>
                <h3 className="font-semibold mb-1 group-hover:text-primary transition-colors">
                  {f.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {f.description}
                </p>
              </Link>
            ))}
          </div>
          <div className="mt-8 text-center">
            <Link
              href="/integrations"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline underline-offset-4"
            >
              View all integrations <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Advanced Features */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary mb-3">
              More Capabilities
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
              Built for real-world documents
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {advancedFeatures.map((f) => (
              <div key={f.title} className="rounded-2xl border bg-card p-6">
                <f.icon className="h-5 w-5 text-primary mb-4" />
                <h3 className="font-semibold text-sm mb-2">{f.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {f.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison */}
      <section className="py-16 sm:py-20 bg-muted/30 border-t">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Parsli vs Traditional OCR vs Manual Entry
            </h2>
            <p className="mt-3 text-muted-foreground">
              See why AI-powered extraction replaces template-based tools.
            </p>
          </div>
          <div className="border rounded-xl overflow-hidden bg-card">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left px-5 py-3 font-semibold">Feature</th>
                  <th className="text-left px-5 py-3 font-semibold text-primary">
                    Parsli
                  </th>
                  <th className="text-left px-5 py-3 font-semibold">
                    Template OCR
                  </th>
                  <th className="text-left px-5 py-3 font-semibold">
                    Manual Entry
                  </th>
                </tr>
              </thead>
              <tbody>
                {comparisonRows.map(([feature, parsli, ocr, manual]) => (
                  <tr key={feature} className="border-t">
                    <td className="px-5 py-2.5 font-medium">{feature}</td>
                    <td className="px-5 py-2.5 text-primary font-medium">
                      {parsli}
                    </td>
                    <td className="px-5 py-2.5 text-muted-foreground">{ocr}</td>
                    <td className="px-5 py-2.5 text-muted-foreground">
                      {manual}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Supported Document Types */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Works with every document type
            </h2>
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            {[
              "Invoices",
              "Receipts",
              "Bank Statements",
              "Contracts",
              "Purchase Orders",
              "Bills of Lading",
              "Tax Forms",
              "Insurance Claims",
              "Medical Records",
              "Resumes / CVs",
              "Emails",
              "Spreadsheets",
              "Scanned PDFs",
              "Photos of Documents",
              "Handwritten Notes",
              "Delivery Notes",
            ].map((type) => (
              <span
                key={type}
                className="inline-flex items-center gap-1.5 rounded-full border bg-card px-4 py-2 text-sm"
              >
                <Check className="h-3.5 w-3.5 text-primary" />
                {type}
              </span>
            ))}
          </div>
          <div className="mt-6 text-center">
            <Link
              href="/document-types"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline underline-offset-4"
            >
              Browse all document types{" "}
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Free Tools Callout */}
      <section className="py-16 sm:py-20 bg-muted/30 border-t">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
              30+ free tools — no sign-up required
            </h2>
            <p className="mt-3 text-muted-foreground max-w-2xl mx-auto">
              Try Parsli&apos;s free browser-based tools for quick conversions.
              No account needed.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { href: "/tools/pdf-to-excel", label: "PDF to Excel" },
              { href: "/tools/ocr", label: "Free Online OCR" },
              { href: "/tools/invoice-parser", label: "Invoice Parser" },
              { href: "/tools/bank-statement-parser", label: "Bank Statement Parser" },
              { href: "/tools/pdf-to-json", label: "PDF to JSON" },
              { href: "/tools/scan-to-text", label: "Scan to Text" },
              { href: "/tools/handwriting-to-text", label: "Handwriting to Text" },
              { href: "/tools/make-pdf-searchable", label: "Make PDF Searchable" },
            ].map((tool) => (
              <Link
                key={tool.href}
                href={tool.href}
                className="rounded-xl border bg-card px-5 py-3.5 text-sm font-medium hover:border-primary/30 transition-colors flex items-center justify-between"
              >
                {tool.label}
                <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
              </Link>
            ))}
          </div>
          <div className="mt-6 text-center">
            <Link
              href="/tools"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline underline-offset-4"
            >
              View all 30+ free tools <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* SEO Content with Citations */}
      <section className="py-16 sm:py-20 border-t">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-xl sm:text-2xl font-bold mb-4">Why AI-Powered Document Extraction Is Replacing Manual Data Entry</h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            According to a <a href="https://www.mckinsey.com/capabilities/mckinsey-digital/our-insights/the-economic-potential-of-generative-ai-the-next-productivity-frontier" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">McKinsey study on generative AI (2023)</a>, knowledge workers spend 19% of their time searching for and gathering information — much of it locked in documents. Manual data entry costs organizations $15-25 per document when factoring in labor, error correction, and processing delays.
          </p>
          <p className="text-muted-foreground leading-relaxed mb-4">
            The global intelligent document processing (IDP) market was valued at $1.45 billion in 2022 and is projected to reach $12.81 billion by 2030 at a 31.1% CAGR (source: <a href="https://www.fortunebusinessinsights.com/intelligent-document-processing-market-106034" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">Fortune Business Insights, 2023</a>). This explosive growth reflects enterprises shifting from template-based OCR to AI-powered extraction.
          </p>
          <p className="text-muted-foreground leading-relaxed mb-4">
            Traditional document processing tools require manual template configuration for each document layout. Research published in <a href="https://ieeexplore.ieee.org/xpl/RecentIssue.jsp?punumber=34" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">IEEE Transactions on Pattern Analysis and Machine Intelligence</a> demonstrates that multimodal large language models achieve 15-30% higher accuracy than template-based approaches on real-world documents with varied layouts. Parsli leverages Google Gemini 2.5 Pro — a multimodal AI that understands both visual layout and textual semantics — eliminating the need for per-document-type templates entirely.
          </p>
          <p className="text-muted-foreground leading-relaxed mb-4">
            The <a href="https://www.aiim.org" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">Association for Intelligent Information Management (AIIM)</a> reports that organizations implementing intelligent document processing reduce document handling time by 50-70% and cut error rates from 4% (manual) to under 1% (AI-assisted). For teams processing 100+ documents monthly, this translates to 15-20 hours saved per week and measurable improvements in data quality.
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-12">
            Frequently asked questions
          </h2>
          <div className="divide-y rounded-2xl border bg-card">
            {faqs.map((faq) => (
              <details key={faq.q} className="group">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-6 py-5 text-sm font-semibold sm:text-base [&::-webkit-details-marker]:hidden">
                  {faq.q}
                  <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-90" />
                </summary>
                <div className="px-6 pb-5 text-sm leading-7 text-muted-foreground">
                  {faq.a}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 sm:py-24 bg-slate-950">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/20 text-primary mb-6">
            <Zap className="h-7 w-7" />
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Ready to stop entering data by hand?
          </h2>
          <p className="mt-4 text-lg leading-8 text-slate-400">
            Start extracting structured data from your documents in minutes. Free
            plan includes 30 pages/month — no credit card required.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <AuthButton
              className="h-12 px-8 text-base"
              showArrow
            >
              Start Free
            </AuthButton>
            <Button
              variant="outline"
              size="lg"
              className="h-12 px-7 text-base border-white/20 text-white hover:bg-white/10"
              asChild
            >
              <a
                href="https://calendly.com/talal-bytebeam/parsli-discovery-call"
                target="_blank"
                rel="noopener noreferrer"
              >
                Book a Demo
              </a>
            </Button>
          </div>
        </div>
      </section>

      {/* Related Links */}
      <section className="py-12 sm:py-16 border-t">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-lg font-semibold mb-6">Explore More</h2>
          <div className="flex flex-wrap gap-3">
            {[
              { href: "/pricing", label: "Pricing" },
              { href: "/docs", label: "Documentation" },
              { href: "/tools", label: "Free Tools" },
              { href: "/solutions", label: "Solutions" },
              { href: "/integrations", label: "Integrations" },
              { href: "/use-cases", label: "Use Cases" },
              { href: "/email-parser", label: "Email Parser" },
              { href: "/pdf-parser", label: "PDF Parser" },
              { href: "/ocr-software", label: "OCR Software" },
              { href: "/compare", label: "Comparisons" },
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="inline-flex items-center gap-1.5 rounded-lg border bg-card px-4 py-2 text-sm hover:border-primary/30 transition-colors"
              >
                {link.label} <ArrowRight className="h-3 w-3 text-muted-foreground" />
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
