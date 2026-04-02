import type { Metadata } from "next"
import Link from "next/link"
import {
  Shield,
  Zap,
  UserX,
  Upload,
  FileSpreadsheet,
  Download,
  ArrowRight,
  Sparkles,
  Table,
  FileText,
  Code2,
  Monitor,
  Smartphone,
  Tablet,
  Users,
  GraduationCap,
  Building2,
  BarChart3,
  Lightbulb,
  Star,
} from "lucide-react"
import { PdfToExcelTool } from "@/components/tools/PdfToExcelTool"
import { AuthButton } from "@/components/marketing/shared/AuthButton"
import { Button } from "@/components/ui/button"
import { JsonLd } from "@/components/marketing/shared/JsonLd"
import { breadcrumbJsonLd } from "@/lib/seo/json-ld"

export const metadata: Metadata = {
  title: "PDF to Excel Converter — Free, Instant, No Sign-Up",
  description:
    "Convert PDF tables to Excel (.xlsx) instantly in your browser. Free, no sign-up, no file uploads to servers. Your data stays private. Works with invoices, bank statements, reports, and more.",
  keywords: [
    "pdf to excel converter",
    "pdf to excel free",
    "convert pdf to excel",
    "pdf to xlsx",
    "pdf table to excel",
    "pdf to spreadsheet",
    "extract table from pdf",
    "pdf to excel online free",
    "pdf to excel no sign up",
    "pdf converter free",
  ],
  alternates: {
    canonical: "https://parsli.co/tools/pdf-to-excel",
  },
  openGraph: {
    title: "PDF to Excel Converter — Free, Instant, No Sign-Up",
    description:
      "Convert PDF tables to Excel instantly in your browser. Free forever, no sign-up required, your data never leaves your device.",
    url: "https://parsli.co/tools/pdf-to-excel",
  },
}

const features = [
  {
    icon: Shield,
    title: "Private & secure",
    description:
      "Your PDF is processed entirely in your browser. Files never leave your device.",
  },
  {
    icon: UserX,
    title: "No sign-up required",
    description:
      "Use it instantly in your browser. No account, no email, no nonsense.",
  },
  {
    icon: Zap,
    title: "Free & unlimited",
    description:
      "No limits, no watermarks, no paywalls. Convert as many PDFs as you want.",
  },
]

const steps = [
  {
    icon: Upload,
    title: "Upload your PDF",
    description: "Drag and drop your PDF or click to browse. Up to 50 MB.",
  },
  {
    icon: Table,
    title: "Auto-detect tables",
    description:
      "The tool detects rows and columns from your PDF layout automatically.",
  },
  {
    icon: Download,
    title: "Download Excel",
    description:
      "Preview the data, then download as a clean .xlsx file. That's it.",
  },
]

const personas = [
  {
    icon: BarChart3,
    title: "Accountants & Finance Teams",
    description:
      "Extract data from invoices, bank statements, and financial reports without manual entry.",
  },
  {
    icon: Users,
    title: "Small Business Owners",
    description:
      "Quickly convert supplier invoices and receipts into spreadsheets for bookkeeping.",
  },
  {
    icon: GraduationCap,
    title: "Students & Researchers",
    description:
      "Pull data tables from academic papers and reports into Excel for analysis.",
  },
  {
    icon: Building2,
    title: "Operations & Admin",
    description:
      "Convert PDF reports, price lists, and catalogs into editable spreadsheets.",
  },
]

const faqs = [
  {
    q: "Is this tool really free?",
    a: "Yes, completely free with no limits. There are no hidden charges, no watermarks, and no sign-up required. We built this as a free utility for the community.",
  },
  {
    q: "Do you store or upload my PDF files?",
    a: "No. Your PDF is processed entirely in your browser using JavaScript. The file never leaves your device and is never sent to any server. Your data stays 100% private.",
  },
  {
    q: "What types of PDFs work best?",
    a: "This tool works best with PDFs that contain text-based tables — invoices, bank statements, financial reports, data exports, and similar structured documents. It extracts the text positions and reconstructs the table layout.",
  },
  {
    q: "Does this work with scanned PDFs or images?",
    a: "No. This tool extracts text that's embedded in the PDF. Scanned documents (images of text) require OCR, which this tool doesn't include. For scanned PDFs, try Parsli's AI-powered extraction which handles images, scans, and complex layouts.",
  },
  {
    q: "What if the table layout doesn't look right?",
    a: "Simple, well-structured tables convert accurately. But complex PDF layouts — merged cells, multi-column pages, nested tables, or inconsistent spacing — can be challenging for rule-based extraction. For complex documents, Parsli's AI extraction understands document context and handles these cases automatically.",
  },
  {
    q: "Can I convert multiple pages?",
    a: "Yes. Multi-page PDFs are supported. If all pages have the same table structure, they're combined into one sheet. If pages have different layouts, each page becomes a separate Excel sheet.",
  },
  {
    q: "What's the difference between this and Parsli?",
    a: "This free tool does simple table extraction from text-based PDFs. Parsli is a full AI-powered document extraction platform — it handles scanned documents, complex layouts, images, and lets you define custom schemas for exactly what data to extract. It also connects to Google Sheets, Zapier, Make, and 5,000+ apps automatically.",
  },
  {
    q: "What file size limit is there?",
    a: "Up to 50 MB. Since everything runs in your browser, very large files may take longer to process depending on your device.",
  },
  {
    q: "How do I convert a PDF to Excel without installing software?",
    a: "Just open this page, drag and drop your PDF file, and click Download. The conversion happens entirely in your browser — no software to install, no account to create, and no files uploaded to any server. It works on any device with a modern browser.",
  },
  {
    q: "Can I convert a PDF to Excel on my phone?",
    a: "Yes. This tool works on iPhone, iPad, and Android devices. Open the page in your mobile browser, upload your PDF, and download the Excel file directly to your device.",
  },
]

export default function PdfToExcelToolPage() {
  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", url: "https://parsli.co" },
          { name: "Tools", url: "https://parsli.co/tools" },
          {
            name: "PDF to Excel Converter",
            url: "https://parsli.co/tools/pdf-to-excel",
          },
        ])}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          name: "Parsli PDF to Excel Converter",
          description:
            "Free browser-based tool to convert PDF tables to Excel spreadsheets. No sign-up required.",
          applicationCategory: "UtilitiesApplication",
          operatingSystem: "Web Browser",
          offers: {
            "@type": "Offer",
            price: "0",
            priceCurrency: "USD",
          },
        }}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: faqs.map((faq) => ({
            "@type": "Question",
            name: faq.q,
            acceptedAnswer: {
              "@type": "Answer",
              text: faq.a,
            },
          })),
        }}
      />

      {/* ═══════ 1. Hero + Tool ═══════ */}
      <section className="relative pt-24 sm:pt-28 pb-16">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-primary/5 rounded-full blur-3xl" />
        </div>

        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border bg-card px-4 py-1.5 text-sm text-muted-foreground mb-6">
            <FileSpreadsheet className="h-4 w-4 text-primary" />
            PDF to Excel Converter
          </div>

          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight leading-[1.1] mb-4">
            Convert PDF to Excel
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-3">
            Free, instant, no sign-up
          </p>

          {/* Social proof */}
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-10">
            <div className="flex items-center gap-0.5 text-yellow-500">
              <Star className="h-3.5 w-3.5 fill-current" />
              <Star className="h-3.5 w-3.5 fill-current" />
              <Star className="h-3.5 w-3.5 fill-current" />
              <Star className="h-3.5 w-3.5 fill-current" />
              <Star className="h-3.5 w-3.5 fill-current" />
            </div>
            <span>Trusted by thousands of users</span>
          </div>

          <PdfToExcelTool />

          <p className="mt-6 text-xs text-muted-foreground">
            100% client-side processing &middot; No data sent to any server
            &middot; Unlimited conversions
          </p>
        </div>
      </section>

      {/* ═══════ 2. API / Product Upsell (EARLY) ═══════ */}
      <section className="py-10 sm:py-12 border-t">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-xl border bg-card p-6 sm:p-8 flex flex-col sm:flex-row items-start gap-5">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 text-primary shrink-0">
              <Code2 className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <h2 className="font-semibold text-lg mb-1">
                Want to extract PDF data via API?
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                Integrate AI-powered document extraction into your workflow.
                Build automations, batch-process hundreds of documents, and get
                structured JSON output with custom schemas.
              </p>
              <div className="flex items-center gap-4">
                <Link
                  href="/solutions/document-parsing-api"
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline underline-offset-4"
                >
                  Explore API
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
                <Link
                  href="/docs"
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  Docs
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════ 3. Cross-Sell Links ═══════ */}
      <section className="pb-10 sm:pb-12">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <p className="text-sm text-muted-foreground text-center leading-relaxed">
            Converting bank statements? Try our dedicated{" "}
            <Link
              href="/tools/bank-statement-to-excel"
              className="text-primary hover:underline underline-offset-4"
            >
              Bank Statement to Excel
            </Link>{" "}
            and{" "}
            <Link
              href="/tools/bank-statement-to-csv"
              className="text-primary hover:underline underline-offset-4"
            >
              Bank Statement to CSV
            </Link>{" "}
            tools. Processing invoices or bank statements at scale?{" "}
            <Link
              href="/solutions/invoice-parsing"
              className="text-primary hover:underline underline-offset-4"
            >
              Invoice Parsing
            </Link>{" "}
            and{" "}
            <Link
              href="/solutions/bank-statement-extraction"
              className="text-primary hover:underline underline-offset-4"
            >
              Bank Statement Extraction
            </Link>{" "}
            are built for that. Or see how Parsli compares to{" "}
            <Link
              href="/compare/docparser"
              className="text-primary hover:underline underline-offset-4"
            >
              Docparser
            </Link>{" "}
            and{" "}
            <Link
              href="/compare/nanonets"
              className="text-primary hover:underline underline-offset-4"
            >
              Nanonets
            </Link>
            .
          </p>
        </div>
      </section>

      {/* ═══════ 4. Why Use This Tool ═══════ */}
      <section className="py-16 sm:py-20 bg-muted/30">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-12">
            Why use this PDF to Excel converter
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {features.map((f) => (
              <div
                key={f.title}
                className="rounded-xl border bg-card p-6 text-center"
              >
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 text-primary mb-4">
                  <f.icon className="h-6 w-6" />
                </div>
                <h3 className="font-semibold text-lg mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {f.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ 5. How It Works ═══════ */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-12">
            How it works
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((step, i) => (
              <div
                key={step.title}
                className="relative rounded-xl border bg-card p-6 text-center"
              >
                <div className="absolute top-4 right-4 text-xs font-bold text-muted-foreground/40">
                  {i + 1}
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

          {/* Important notes callout */}
          <div className="mt-8 rounded-lg border-l-4 border-primary bg-primary/5 px-6 py-4 max-w-2xl mx-auto">
            <p className="text-sm text-muted-foreground leading-relaxed">
              <span className="font-medium text-foreground">Note:</span> This
              tool works best with text-based PDFs that have clear table
              structures. Scanned documents and images require OCR — try{" "}
              <Link
                href="/solutions/pdf-to-excel"
                className="text-primary hover:underline underline-offset-4"
              >
                Parsli AI
              </Link>{" "}
              for those.
            </p>
          </div>
        </div>
      </section>

      {/* ═══════ 6. Educational Content ═══════ */}
      <section className="py-16 sm:py-20 bg-muted/30">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          {/* What this tool handles vs Parsli AI */}
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-12">
            What this tool handles
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="rounded-xl border bg-card p-6">
              <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Works great with
              </h3>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-0.5">&#10003;</span>
                  Invoices with line item tables
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-0.5">&#10003;</span>
                  Bank and financial statements
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-0.5">&#10003;</span>
                  Data exports and reports
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-0.5">&#10003;</span>
                  Price lists and product catalogs
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-0.5">&#10003;</span>
                  Simple, well-structured table layouts
                </li>
              </ul>
            </div>
            <div className="rounded-xl border bg-card p-6">
              <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                For these, try Parsli AI
              </h3>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <ArrowRight className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
                  Scanned documents and images (OCR)
                </li>
                <li className="flex items-start gap-2">
                  <ArrowRight className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
                  Complex multi-column layouts
                </li>
                <li className="flex items-start gap-2">
                  <ArrowRight className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
                  Custom data extraction schemas
                </li>
                <li className="flex items-start gap-2">
                  <ArrowRight className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
                  Automated workflows (Sheets, Zapier, API)
                </li>
                <li className="flex items-start gap-2">
                  <ArrowRight className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
                  Batch processing hundreds of documents
                </li>
              </ul>
            </div>
          </div>

          {/* Tips for better conversion */}
          <div className="mt-16 max-w-3xl mx-auto">
            <div className="flex items-center gap-2 mb-6">
              <Lightbulb className="h-5 w-5 text-primary" />
              <h3 className="text-xl font-bold">
                Tips for better PDF to Excel conversion
              </h3>
            </div>
            <div className="space-y-6">
              <div>
                <h4 className="font-semibold mb-2">
                  Use text-based PDFs, not scanned images
                </h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  If you can select and copy text in your PDF, this tool will work
                  well. If the PDF is a scanned image, you&apos;ll need OCR — try
                  Parsli AI for that.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">
                  Clean table structure converts best
                </h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  PDFs with clear, grid-like tables — consistent columns, uniform
                  row heights, no merged cells — produce the most accurate
                  results.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">
                  Check for special characters and currencies
                </h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  The tool auto-detects numbers, currencies ($, €, £), and
                  percentages. If your PDF uses unusual formatting, double-check
                  the Excel output.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">
                  Multi-page documents are supported
                </h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Pages with the same table structure are combined into one sheet.
                  Different layouts get separate sheets — check all tabs in your
                  downloaded file.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════ 7. Perfect For (User Personas) ═══════ */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-12">
            Perfect for
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {personas.map((p) => (
              <div
                key={p.title}
                className="rounded-xl border bg-card p-5 hover:border-primary/30 transition-colors"
              >
                <p.icon className="h-5 w-5 text-primary mb-3" />
                <h3 className="font-semibold text-sm mb-1">{p.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {p.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ 8. FAQ ═══════ */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-12">
            Frequently asked questions
          </h2>
          <div className="grid sm:grid-cols-2 gap-6">
            {faqs.map((faq) => (
              <div key={faq.q} className="rounded-xl border bg-card p-5">
                <h3 className="font-semibold text-sm mb-2">{faq.q}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {faq.a}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ 9. SEO Comparison Table + Content ═══════ */}
      <section className="py-16 sm:py-20 bg-muted/30 border-t">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-xl sm:text-2xl font-bold mb-4">
            How to Convert PDF to Excel for Free
          </h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            Converting PDF files to Excel spreadsheets is one of the most common
            document tasks for businesses and individuals. Whether you need to
            extract financial data from bank statements, pull line items from
            invoices, or convert reports into editable spreadsheets, a reliable
            PDF to Excel converter saves hours of manual data entry.
          </p>
          <p className="text-muted-foreground leading-relaxed mb-4">
            Most online converters require you to upload your files to their
            servers, create an account, or pay for a subscription. This tool is
            different — it runs entirely in your browser using JavaScript. Your
            PDF is processed on your own device and never sent anywhere. It&apos;s
            completely free, with no limits on the number of conversions.
          </p>

          <h2 className="text-xl sm:text-2xl font-bold mt-10 mb-4">
            When Do You Need AI-Powered PDF Extraction?
          </h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            This free converter handles text-based PDFs with clear table
            structures. But real-world documents are often more complex —
            scanned papers, inconsistent layouts, merged cells, or data spread
            across multiple sections. That&apos;s where AI-powered extraction
            comes in.
          </p>
          <p className="text-muted-foreground leading-relaxed mb-4">
            Parsli uses Google&apos;s Gemini AI to understand the full context of
            your documents. You define a schema — the exact fields you want
            extracted — and the AI pulls structured data from any document type,
            including scanned images, handwritten forms, and complex layouts.
            The extracted data flows automatically to Google Sheets, Zapier,
            Make, webhooks, or your own API.
          </p>

          <h2 className="text-xl sm:text-2xl font-bold mt-10 mb-4">
            PDF to Excel: Free Tool vs AI Extraction
          </h2>
          <div className="border rounded-lg overflow-hidden mb-6">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left px-4 py-2.5 font-semibold">
                    Feature
                  </th>
                  <th className="text-left px-4 py-2.5 font-semibold">
                    Free Tool
                  </th>
                  <th className="text-left px-4 py-2.5 font-semibold">
                    Parsli AI
                  </th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["Text-based PDFs", "Yes", "Yes"],
                  ["Scanned PDFs / images", "No", "Yes"],
                  ["Custom extraction schema", "No", "Yes"],
                  ["Complex layouts", "Basic", "Advanced"],
                  ["Automated workflows", "No", "Yes"],
                  ["Google Sheets integration", "No", "Yes"],
                  ["API access", "No", "Yes"],
                  ["Price", "Free", "Free tier + paid plans"],
                ].map(([feature, free, ai]) => (
                  <tr key={feature} className="border-t">
                    <td className="px-4 py-2 font-medium">{feature}</td>
                    <td className="px-4 py-2 text-muted-foreground">{free}</td>
                    <td className="px-4 py-2 text-muted-foreground">{ai}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ═══════ 10. Works Everywhere ═══════ */}
      <section className="py-12 sm:py-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-lg font-semibold text-center mb-8">
            Works everywhere — no install needed
          </h2>
          <div className="grid grid-cols-3 gap-6 max-w-md mx-auto">
            <div className="text-center">
              <Monitor className="h-6 w-6 mx-auto text-muted-foreground mb-2" />
              <p className="text-xs text-muted-foreground">
                Desktop
              </p>
              <p className="text-[10px] text-muted-foreground/60">
                Chrome, Firefox, Safari, Edge
              </p>
            </div>
            <div className="text-center">
              <Smartphone className="h-6 w-6 mx-auto text-muted-foreground mb-2" />
              <p className="text-xs text-muted-foreground">
                Mobile
              </p>
              <p className="text-[10px] text-muted-foreground/60">
                iOS, Android
              </p>
            </div>
            <div className="text-center">
              <Tablet className="h-6 w-6 mx-auto text-muted-foreground mb-2" />
              <p className="text-xs text-muted-foreground">
                Tablet
              </p>
              <p className="text-[10px] text-muted-foreground/60">
                iPad, Android tablets
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════ 11. Final CTA ═══════ */}
      <section className="py-16 sm:py-20 bg-muted/30 border-t">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 text-primary mb-6">
            <Sparkles className="h-7 w-7" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold mb-4">
            Stop re-keying data from PDFs manually.
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto mb-8 leading-relaxed">
            Parsli extracts structured data from any document — PDFs, images,
            scans, emails. Define custom schemas and automate with integrations.
            Free forever up to 30 pages/month.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <AuthButton className="text-base px-8 h-12" showArrow>
              Try Parsli Free
            </AuthButton>
            <Button variant="outline" size="lg" className="text-base px-8 h-12" asChild>
              <a
                href="https://calendly.com/talal-bytebeam/parsli-discovery-call"
                target="_blank"
                rel="noopener noreferrer"
              >
                Book a demo
              </a>
            </Button>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            No credit card required &middot; 30 free pages/month
          </p>
        </div>
      </section>

      {/* ═══════ 12. Related Links ═══════ */}
      <section className="py-12 sm:py-16 border-t">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-lg font-semibold mb-6">Related Resources</h2>
          <div className="flex flex-wrap gap-3">
            {[
              { href: "/tools/pdf-to-google-sheets", label: "PDF to Google Sheets" },
              { href: "/tools/pdf-to-json", label: "PDF to JSON" },
              { href: "/tools/pdf-to-xml", label: "PDF to XML" },
              { href: "/solutions/pdf-to-excel", label: "PDF to Excel Solution" },
              { href: "/use-cases/pdf-to-excel", label: "PDF to Excel Use Case" },
              { href: "/use-cases/pdf-data-extraction", label: "PDF Data Extraction" },
              { href: "/blog/extract-data-pdf-to-excel", label: "How to Extract PDF Data" },
              { href: "/docs", label: "Documentation" },
              { href: "/pricing", label: "Pricing" },
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="inline-flex items-center gap-1.5 rounded-lg border bg-card px-4 py-2 text-sm hover:border-primary/30 transition-colors"
              >
                {link.label}
                <ArrowRight className="h-3 w-3 text-muted-foreground" />
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
