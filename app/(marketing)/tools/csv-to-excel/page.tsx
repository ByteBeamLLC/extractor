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
import { CsvToExcelTool } from "@/components/tools/CsvToExcelTool"
import { AuthButton } from "@/components/marketing/shared/AuthButton"
import { Button } from "@/components/ui/button"
import { JsonLd } from "@/components/marketing/shared/JsonLd"
import { breadcrumbJsonLd } from "@/lib/seo/json-ld"

export const metadata: Metadata = {
  title: "CSV to Excel Converter — Free, Instant, No Sign-Up | Parsli",
  description:
    "Convert CSV files to Excel spreadsheets (.xlsx) instantly in your browser. Free, no sign-up, no file uploads to servers. Upload a file or paste CSV directly.",
  keywords: [
    "csv to excel converter",
    "csv to excel free",
    "convert csv to excel",
    "csv to xlsx",
    "csv to spreadsheet",
    "csv to excel online",
    "csv to excel no sign up",
    "csv converter free",
    "csv to excel download",
    "convert csv to xlsx",
  ],
  alternates: {
    canonical: "https://parsli.co/tools/csv-to-excel",
  },
  openGraph: {
    title: "CSV to Excel Converter — Free, Instant, No Sign-Up",
    description:
      "Convert CSV files to Excel spreadsheets instantly in your browser. Free forever, no sign-up required, your data never leaves your device.",
    url: "https://parsli.co/tools/csv-to-excel",
  },
}

const features = [
  {
    icon: Shield,
    title: "Private & secure",
    description:
      "Your CSV data is processed entirely in your browser. Files never leave your device.",
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
      "No limits, no watermarks, no paywalls. Convert as many files as you want.",
  },
]

const steps = [
  {
    icon: Upload,
    title: "Upload or paste CSV",
    description: "Upload a .csv file or paste your CSV data directly into the editor.",
  },
  {
    icon: Table,
    title: "Preview parsed data",
    description:
      "See a preview of your data in a table with auto-detected rows and columns.",
  },
  {
    icon: Download,
    title: "Download Excel",
    description:
      "Download your data as a clean .xlsx file with auto-sized columns. That's it.",
  },
]

const personas = [
  {
    icon: BarChart3,
    title: "Data Analysts",
    description:
      "Convert CSV exports into Excel for pivot tables, charts, formulas, and advanced analysis.",
  },
  {
    icon: Building2,
    title: "Business & Operations",
    description:
      "Turn CSV data exports from SaaS tools into Excel for sharing, filtering, and presentations.",
  },
  {
    icon: Code2,
    title: "Developers & Engineers",
    description:
      "Convert CSV outputs from scripts, logs, and data pipelines into Excel for stakeholder reports.",
  },
  {
    icon: GraduationCap,
    title: "Students & Researchers",
    description:
      "Transform CSV datasets into Excel for statistical analysis, charting, and academic work.",
  },
]

const faqs = [
  {
    q: "Is this tool really free?",
    a: "Yes, completely free with no limits. There are no hidden charges, no watermarks, and no sign-up required. We built this as a free utility for the community.",
  },
  {
    q: "Do you store or upload my CSV files?",
    a: "No. Your CSV is processed entirely in your browser using JavaScript. The data never leaves your device and is never sent to any server. Your data stays 100% private.",
  },
  {
    q: "Can I paste CSV instead of uploading a file?",
    a: "Yes! You can either upload a .csv file or switch to paste mode and paste your CSV data directly. Both methods produce the same Excel output.",
  },
  {
    q: "What CSV delimiter does this tool support?",
    a: "The tool automatically detects standard comma-separated values. It handles quoted fields (values containing commas), newlines within quotes, and standard CSV formatting.",
  },
  {
    q: "Why convert CSV to Excel?",
    a: "Excel offers features that CSV doesn't — formatting, formulas, charts, pivot tables, multiple sheets, and filtering. Converting to Excel lets you work with your data more effectively.",
  },
  {
    q: "Are columns auto-sized in the Excel output?",
    a: "Yes. The tool automatically adjusts column widths based on content length, so the downloaded Excel file is immediately readable without manual column resizing.",
  },
  {
    q: "What's the difference between this and Parsli?",
    a: "This free tool does direct CSV-to-Excel conversion. Parsli is a full AI-powered document extraction platform — it extracts structured data from PDFs, images, and scanned documents and exports to Excel, CSV, or Google Sheets.",
  },
  {
    q: "Can I convert CSV to Excel on my phone?",
    a: "Yes. This tool works on iPhone, iPad, and Android devices. Open the page in your mobile browser, upload or paste your CSV, and download the Excel file directly.",
  },
  {
    q: "What file size limit is there?",
    a: "Up to 50 MB for file uploads. Since everything runs in your browser, very large files may take longer to process depending on your device.",
  },
  {
    q: "Does it handle special characters and Unicode?",
    a: "Yes. The tool supports UTF-8 encoded CSV files, which includes international characters, accents, emojis, and special symbols. They're preserved correctly in the Excel output.",
  },
]

export default function CsvToExcelToolPage() {
  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", url: "https://parsli.co" },
          { name: "Tools", url: "https://parsli.co/tools" },
          {
            name: "CSV to Excel Converter",
            url: "https://parsli.co/tools/csv-to-excel",
          },
        ])}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          name: "Parsli CSV to Excel Converter",
          description:
            "Free browser-based tool to convert CSV files to Excel spreadsheets. No sign-up required.",
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

      {/* 1. Hero + Tool */}
      <section className="relative pt-24 sm:pt-28 pb-16">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-primary/5 rounded-full blur-3xl" />
        </div>

        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border bg-card px-4 py-1.5 text-sm text-muted-foreground mb-6">
            <FileSpreadsheet className="h-4 w-4 text-primary" />
            CSV to Excel Converter
          </div>

          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight leading-[1.1] mb-4">
            Convert CSV to Excel
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

          <CsvToExcelTool />

          <p className="mt-6 text-xs text-muted-foreground">
            100% client-side processing &middot; No data sent to any server
            &middot; Unlimited conversions
          </p>
        </div>
      </section>

      {/* 2. API / Product Upsell */}
      <section className="py-10 sm:py-12 border-t">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-xl border bg-card p-6 sm:p-8 flex flex-col sm:flex-row items-start gap-5">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 text-primary shrink-0">
              <Code2 className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <h2 className="font-semibold text-lg mb-1">
                Need to extract data from documents into spreadsheets?
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                Parsli&apos;s AI extracts structured data from PDFs, images,
                invoices, and more. Export directly to Excel, CSV, or Google
                Sheets. Automate with API or integrations.
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

      {/* 3. Cross-Sell Links */}
      <section className="pb-10 sm:pb-12">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <p className="text-sm text-muted-foreground text-center leading-relaxed">
            Need other conversions? Try our{" "}
            <Link
              href="/tools/excel-to-csv"
              className="text-primary hover:underline underline-offset-4"
            >
              Excel to CSV
            </Link>
            ,{" "}
            <Link
              href="/tools/excel-to-json"
              className="text-primary hover:underline underline-offset-4"
            >
              Excel to JSON
            </Link>
            , or{" "}
            <Link
              href="/tools/pdf-to-excel"
              className="text-primary hover:underline underline-offset-4"
            >
              PDF to Excel
            </Link>{" "}
            converters. Or see all{" "}
            <Link
              href="/tools"
              className="text-primary hover:underline underline-offset-4"
            >
              free tools
            </Link>
            .
          </p>
        </div>
      </section>

      {/* 4. Why Use This Tool */}
      <section className="py-16 sm:py-20 bg-muted/30">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-12">
            Why use this CSV to Excel converter
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

      {/* 5. How It Works */}
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

          {/* Note callout */}
          <div className="mt-8 rounded-lg border-l-4 border-primary bg-primary/5 px-6 py-4 max-w-2xl mx-auto">
            <p className="text-sm text-muted-foreground leading-relaxed">
              <span className="font-medium text-foreground">Note:</span> This
              tool converts standard comma-separated CSV data to Excel. For
              extracting data from PDFs, images, or scanned documents into
              spreadsheets, try{" "}
              <Link
                href="/solutions/document-parsing-api"
                className="text-primary hover:underline underline-offset-4"
              >
                Parsli AI
              </Link>
              .
            </p>
          </div>
        </div>
      </section>

      {/* 6. Educational Content */}
      <section className="py-16 sm:py-20 bg-muted/30">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
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
                  CSV exports from databases and SaaS tools
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-0.5">&#10003;</span>
                  Data pipeline outputs and log files
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-0.5">&#10003;</span>
                  Google Sheets and other spreadsheet exports
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-0.5">&#10003;</span>
                  Contact lists, mailing lists, transaction data
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-0.5">&#10003;</span>
                  Any standard comma-separated data
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
                  Extracting tables from PDFs and images
                </li>
                <li className="flex items-start gap-2">
                  <ArrowRight className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
                  Scanned documents requiring OCR
                </li>
                <li className="flex items-start gap-2">
                  <ArrowRight className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
                  Custom extraction schemas with validation
                </li>
                <li className="flex items-start gap-2">
                  <ArrowRight className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
                  Direct export to Google Sheets
                </li>
                <li className="flex items-start gap-2">
                  <ArrowRight className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
                  Batch processing hundreds of documents
                </li>
              </ul>
            </div>
          </div>

          {/* Tips */}
          <div className="mt-16 max-w-3xl mx-auto">
            <div className="flex items-center gap-2 mb-6">
              <Lightbulb className="h-5 w-5 text-primary" />
              <h3 className="text-xl font-bold">
                Tips for better CSV to Excel conversion
              </h3>
            </div>
            <div className="space-y-6">
              <div>
                <h4 className="font-semibold mb-2">
                  Excel adds formatting and features
                </h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Converting CSV to Excel lets you use formulas, pivot tables,
                  conditional formatting, charts, and filters that aren&apos;t
                  available in plain CSV files.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">
                  Use standard CSV format for best results
                </h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Standard comma-separated values with optional quoted fields
                  work best. The tool handles quoted fields containing commas
                  and newlines correctly.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">
                  Headers become column names
                </h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  If your CSV has a header row, those values become the column
                  headers in Excel. The tool preserves the structure exactly as
                  it appears in your CSV.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">
                  Paste CSV directly for quick conversions
                </h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Don&apos;t have a CSV file? Switch to paste mode and type or
                  paste your comma-separated data directly. The tool converts
                  it to Excel just the same.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. Perfect For */}
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

      {/* 8. FAQ */}
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

      {/* 9. SEO Content + Comparison Table */}
      <section className="py-16 sm:py-20 bg-muted/30 border-t">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-xl sm:text-2xl font-bold mb-4">
            How to Convert CSV to Excel for Free
          </h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            CSV (Comma-Separated Values) is the most universal data format,
            but it lacks the features that make Excel powerful — formulas,
            formatting, charts, pivot tables, and multi-sheet workbooks.
            Converting CSV to Excel gives you all these capabilities while
            keeping your data intact.
          </p>
          <p className="text-muted-foreground leading-relaxed mb-4">
            While you can open CSV files directly in Excel, this often causes
            issues with encoding, number formatting, and leading zeros. This
            tool properly converts your CSV to a native .xlsx file, preserving
            your data accurately. And it runs entirely in your browser — no
            Excel installation needed.
          </p>

          <h2 className="text-xl sm:text-2xl font-bold mt-10 mb-4">
            When Do You Need AI-Powered Document Extraction?
          </h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            This free converter handles straightforward CSV-to-Excel
            conversion. But if your data is trapped in PDFs, images, invoices,
            or scanned documents and you need it in a spreadsheet — that&apos;s
            where AI-powered extraction comes in.
          </p>
          <p className="text-muted-foreground leading-relaxed mb-4">
            Parsli uses Google&apos;s Gemini AI to understand document context
            and extract exactly the fields you need. Export directly to Excel,
            CSV, Google Sheets, or integrate via API for automated workflows.
          </p>

          <h2 className="text-xl sm:text-2xl font-bold mt-10 mb-4">
            CSV to Excel: Free Tool vs AI Extraction
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
                  ["CSV to Excel", "Yes", "Yes"],
                  ["PDFs & images to Excel", "No", "Yes"],
                  ["Custom extraction schemas", "No", "Yes"],
                  ["Auto-sized columns", "Yes", "Yes"],
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

      {/* 10. Works Everywhere */}
      <section className="py-12 sm:py-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-lg font-semibold text-center mb-8">
            Works everywhere — no install needed
          </h2>
          <div className="grid grid-cols-3 gap-6 max-w-md mx-auto">
            <div className="text-center">
              <Monitor className="h-6 w-6 mx-auto text-muted-foreground mb-2" />
              <p className="text-xs text-muted-foreground">Desktop</p>
              <p className="text-[10px] text-muted-foreground/60">
                Chrome, Firefox, Safari, Edge
              </p>
            </div>
            <div className="text-center">
              <Smartphone className="h-6 w-6 mx-auto text-muted-foreground mb-2" />
              <p className="text-xs text-muted-foreground">Mobile</p>
              <p className="text-[10px] text-muted-foreground/60">
                iOS, Android
              </p>
            </div>
            <div className="text-center">
              <Tablet className="h-6 w-6 mx-auto text-muted-foreground mb-2" />
              <p className="text-xs text-muted-foreground">Tablet</p>
              <p className="text-[10px] text-muted-foreground/60">
                iPad, Android tablets
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 11. Final CTA */}
      <section className="py-16 sm:py-20 bg-muted/30 border-t">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 text-primary mb-6">
            <Sparkles className="h-7 w-7" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold mb-4">
            Stop cleaning up CSV imports in Excel manually.
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

      {/* 12. Related Links */}
      <section className="py-12 sm:py-16 border-t">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-lg font-semibold mb-6">Related Resources</h2>
          <div className="flex flex-wrap gap-3">
            {[
              { href: "/tools/excel-to-csv", label: "Excel to CSV Converter" },
              { href: "/tools/excel-to-json", label: "Excel to JSON Converter" },
              { href: "/tools/json-to-excel", label: "JSON to Excel Converter" },
              { href: "/tools/pdf-to-excel", label: "PDF to Excel Converter" },
              { href: "/solutions/document-parsing-api", label: "Document Parsing API" },
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
