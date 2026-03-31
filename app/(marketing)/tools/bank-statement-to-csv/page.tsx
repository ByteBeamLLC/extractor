import type { Metadata } from "next"
import Link from "next/link"
import {
  Shield,
  Zap,
  UserX,
  Upload,
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
  Building2,
  BarChart3,
  Lightbulb,
  Star,
  Database,
} from "lucide-react"
import { PdfToExcelTool } from "@/components/tools/PdfToExcelTool"
import { AuthButton } from "@/components/marketing/shared/AuthButton"
import { Button } from "@/components/ui/button"
import { JsonLd } from "@/components/marketing/shared/JsonLd"
import { breadcrumbJsonLd } from "@/lib/seo/json-ld"

export const metadata: Metadata = {
  title: "Bank Statement to CSV — Free Converter",
  description:
    "Convert bank statement PDFs to CSV format instantly in your browser. Free, no sign-up, no file uploads. Download as Excel (.xlsx) and save as CSV. Works with statements from any bank for QuickBooks, Xero, and accounting imports.",
  keywords: [
    "bank statement to csv",
    "convert bank statement to csv",
    "bank statement pdf to csv",
    "bank statement csv converter",
    "bank statement csv",
    "bank statement to csv free",
    "convert bank statement pdf to csv",
    "bank statement csv download",
    "bank statement to quickbooks csv",
    "bank statement converter csv",
  ],
  alternates: {
    canonical: "https://parsli.co/tools/bank-statement-to-csv",
  },
  openGraph: {
    title: "Bank Statement to CSV — Free Converter",
    description:
      "Convert bank statement PDFs to CSV-compatible format instantly in your browser. Free forever, no sign-up required, your data never leaves your device.",
    url: "https://parsli.co/tools/bank-statement-to-csv",
  },
}

const features = [
  {
    icon: Shield,
    title: "Private & secure",
    description:
      "Your bank statement is processed entirely in your browser. Financial data never leaves your device — no cloud uploads, ever.",
  },
  {
    icon: UserX,
    title: "No sign-up required",
    description:
      "Use it instantly. No account, no email, no credit card. Upload your statement and download the file.",
  },
  {
    icon: Zap,
    title: "Free & unlimited",
    description:
      "No limits, no watermarks, no paywalls. Convert as many bank statements as you need, completely free.",
  },
]

const steps = [
  {
    icon: Upload,
    title: "Upload your bank statement",
    description:
      "Drag and drop your bank statement PDF or click to browse. Works with statements from any bank.",
  },
  {
    icon: Table,
    title: "Auto-detect transactions",
    description:
      "The tool detects table rows and columns from your statement — dates, descriptions, debits, credits, and balances.",
  },
  {
    icon: Download,
    title: "Download and save as CSV",
    description:
      "Download as .xlsx, then save as CSV from Excel or Google Sheets. Or use the data directly — .xlsx works everywhere CSV does.",
  },
]

const personas = [
  {
    icon: BarChart3,
    title: "Accountants & Bookkeepers",
    description:
      "Convert client bank statements to CSV for bulk import into QuickBooks, Xero, FreshBooks, or Wave accounting software.",
  },
  {
    icon: Users,
    title: "Small Business Owners",
    description:
      "Get bank transaction data in CSV format for expense tracking, tax prep, and import into budgeting tools.",
  },
  {
    icon: Database,
    title: "Developers & Data Analysts",
    description:
      "Extract bank statement data into a flat file format for analysis in Python, R, SQL databases, or custom scripts.",
  },
  {
    icon: Building2,
    title: "Finance Teams & Controllers",
    description:
      "Convert statements to CSV for automated reconciliation workflows, ERP imports, and financial system integrations.",
  },
]

const faqs = [
  {
    q: "Is this bank statement to CSV converter really free?",
    a: "Yes, completely free with no limits. There are no hidden charges, no watermarks, and no sign-up required. Convert as many bank statements as you need.",
  },
  {
    q: "Do you store or upload my bank statements?",
    a: "No. Your bank statement PDF is processed entirely in your browser using JavaScript. The file never leaves your device and is never sent to any server. Your financial data stays 100% private.",
  },
  {
    q: "Does this tool export directly to CSV?",
    a: "This tool exports to .xlsx (Excel) format, which you can then save as CSV. In Excel: File > Save As > CSV. In Google Sheets: File > Download > Comma-separated values (.csv). The .xlsx format also works directly with QuickBooks, Xero, and most accounting software.",
  },
  {
    q: "Which banks' statements work with this tool?",
    a: "This tool works with PDF statements from any bank — Chase, Bank of America, Wells Fargo, Citi, Capital One, HSBC, Barclays, and any other bank worldwide. If your bank provides PDF statements with embedded text, this tool will convert them.",
  },
  {
    q: "Can I import the CSV into QuickBooks or Xero?",
    a: "Yes. Once you have the CSV file, you can import it into QuickBooks (Banking > Upload transactions), Xero (Bank accounts > Import a statement), or any other accounting software that accepts CSV bank statement imports. You may need to map columns to match your software's expected format.",
  },
  {
    q: "What if my bank statement is a scanned document?",
    a: "This tool works best with text-based PDF statements downloaded directly from your online banking portal. Scanned paper statements (images of text) require OCR, which this tool doesn't include. For scanned statements, try Parsli's AI-powered extraction which handles images and complex layouts.",
  },
  {
    q: "How do I download my bank statement as a PDF?",
    a: "Log in to your bank's online portal or mobile app. Navigate to Statements or Documents, select the month you need, and click Download or Save as PDF. Most banks keep 12-24 months of statements available. Downloaded PDFs have embedded text that converts cleanly.",
  },
  {
    q: "What CSV format does this produce?",
    a: "The tool extracts table data from your bank statement into structured rows and columns. After saving as CSV, you get a standard comma-separated file that any spreadsheet, database, or programming language can read. Column headers depend on your bank's statement format.",
  },
  {
    q: "What's the difference between this tool and Parsli AI?",
    a: "This free tool does rule-based table extraction from text-based PDF statements. Parsli AI uses Google's Gemini to understand bank statement layouts intelligently — it extracts structured transaction data, categorizes expenses automatically, and exports directly to CSV, Google Sheets, QuickBooks, or any app via Zapier.",
  },
  {
    q: "Can I use this on my phone?",
    a: "Yes. This tool works on iPhone, iPad, and Android devices. Open the page in your mobile browser, upload your bank statement PDF, and download the file directly to your device.",
  },
]

export default function BankStatementToCsvPage() {
  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", url: "https://parsli.co" },
          { name: "Tools", url: "https://parsli.co/tools" },
          {
            name: "Bank Statement to CSV",
            url: "https://parsli.co/tools/bank-statement-to-csv",
          },
        ])}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          name: "Parsli Bank Statement to CSV Converter",
          description:
            "Free browser-based tool to convert bank statement PDFs to CSV-compatible spreadsheet format. No sign-up required, no data uploaded to servers.",
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
            <Database className="h-4 w-4 text-primary" />
            Bank Statement to CSV
          </div>

          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight leading-[1.1] mb-4">
            Convert Bank Statements to CSV
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
            &middot; Download as .xlsx, then save as CSV
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
                Need to export bank statement data directly to CSV or Google Sheets?
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                Parsli AI extracts structured transactions — dates, amounts,
                balances, categories — and exports directly to CSV, Google
                Sheets, or your accounting software. No manual conversion steps
                needed.
              </p>
              <div className="flex items-center gap-4">
                <Link
                  href="/solutions/bank-statement-extraction"
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline underline-offset-4"
                >
                  Explore AI Bank Statement Extraction
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
            Prefer Excel format?{" "}
            <Link
              href="/tools/bank-statement-to-excel"
              className="text-primary hover:underline underline-offset-4"
            >
              Bank Statement to Excel
            </Link>
            . Want to extract raw text?{" "}
            <Link
              href="/tools/bank-statement-parser"
              className="text-primary hover:underline underline-offset-4"
            >
              Bank Statement Parser
            </Link>
            . Or convert any PDF:{" "}
            <Link
              href="/tools/pdf-to-excel"
              className="text-primary hover:underline underline-offset-4"
            >
              PDF to Excel Converter
            </Link>
            .
          </p>
        </div>
      </section>

      {/* ═══════ 4. Why Use This Tool ═══════ */}
      <section className="py-16 sm:py-20 bg-muted/30">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-12">
            Why use this bank statement to CSV converter
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
              <span className="font-medium text-foreground">How to get CSV:</span>{" "}
              This tool downloads an .xlsx file. To convert to CSV: open in
              Excel and use <span className="font-medium text-foreground">File &gt; Save As &gt; CSV</span>,
              or open in Google Sheets and use{" "}
              <span className="font-medium text-foreground">File &gt; Download &gt; CSV</span>.
              For direct CSV export, try{" "}
              <Link
                href="/solutions/bank-statement-extraction"
                className="text-primary hover:underline underline-offset-4"
              >
                Parsli AI
              </Link>
              .
            </p>
          </div>
        </div>
      </section>

      {/* ═══════ 6. Educational Content ═══════ */}
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
                  Monthly checking and savings statements
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-0.5">&#10003;</span>
                  Credit card statements with tabular data
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-0.5">&#10003;</span>
                  Business account statements for accounting imports
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-0.5">&#10003;</span>
                  Statements downloaded from any online banking portal
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-0.5">&#10003;</span>
                  Any PDF with structured transaction tables
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
                  Direct CSV export without manual conversion steps
                </li>
                <li className="flex items-start gap-2">
                  <ArrowRight className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
                  Scanned or photographed paper statements
                </li>
                <li className="flex items-start gap-2">
                  <ArrowRight className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
                  Automatic transaction categorization for bookkeeping
                </li>
                <li className="flex items-start gap-2">
                  <ArrowRight className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
                  QuickBooks, Xero, and FreshBooks compatible CSV format
                </li>
                <li className="flex items-start gap-2">
                  <ArrowRight className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
                  Batch processing and API for automated workflows
                </li>
              </ul>
            </div>
          </div>

          {/* Tips for better conversion */}
          <div className="mt-16 max-w-3xl mx-auto">
            <div className="flex items-center gap-2 mb-6">
              <Lightbulb className="h-5 w-5 text-primary" />
              <h3 className="text-xl font-bold">
                Tips for converting bank statements to CSV
              </h3>
            </div>
            <div className="space-y-6">
              <div>
                <h4 className="font-semibold mb-2">
                  Download statements from online banking first
                </h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Log in to your bank&apos;s website or app and download your
                  statement as a PDF. These digital PDFs have embedded text that
                  extracts perfectly. Scanned paper statements produce lower
                  quality results because they&apos;re images, not text.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">
                  Check if your bank already offers CSV downloads
                </h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Some banks let you download transactions directly as CSV from
                  their portal — look for &quot;Export&quot; or &quot;Download
                  transactions&quot; options. If your bank only provides PDF
                  statements, this tool bridges that gap.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">
                  Saving .xlsx as CSV in one step
                </h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  After downloading the .xlsx file: in Excel, press Ctrl+Shift+S
                  (or Cmd+Shift+S on Mac), select &quot;CSV (Comma
                  delimited)&quot; as the format, and save. In Google Sheets,
                  open the file and use File &gt; Download &gt; Comma-separated
                  values (.csv).
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">
                  Map CSV columns for your accounting software
                </h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  QuickBooks and Xero expect specific column orders (date,
                  description, amount). After converting, you may need to
                  rearrange columns in your spreadsheet before importing. Parsli
                  AI can export in your software&apos;s expected format
                  automatically.
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
            How to Convert Bank Statements to CSV for Free
          </h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            CSV (comma-separated values) is the universal format for importing
            financial data into accounting software, databases, and analytics
            tools. Whether you need to import bank transactions into QuickBooks,
            load statement data into a SQL database, or analyze spending in
            Python or R, converting your bank statement PDF to CSV is the first
            step.
          </p>
          <p className="text-muted-foreground leading-relaxed mb-4">
            The challenge is that banks typically provide statements as PDFs —
            great for reading and printing, but not for data processing. Most
            online converters require you to upload sensitive financial documents
            to their servers. This tool is different: it processes your bank
            statement entirely in your browser. Your PDF never leaves your
            device.
          </p>

          <h2 className="text-xl sm:text-2xl font-bold mt-10 mb-4">
            When Do You Need AI-Powered Bank Statement to CSV Conversion?
          </h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            This free tool extracts tables from text-based PDF bank statements.
            But if you need clean, categorized transaction data in a specific
            CSV format for your accounting software — or you&apos;re processing
            dozens of statements from different banks — you need AI that
            understands statement layouts.
          </p>
          <p className="text-muted-foreground leading-relaxed mb-4">
            Parsli uses Google&apos;s Gemini AI to intelligently parse bank
            statements from any bank. It extracts structured transaction data —
            dates, descriptions, amounts, running balances — and categorizes
            each transaction (payroll, rent, utilities, etc.). The data exports
            directly to CSV in the format your accounting software expects,
            or flows to Google Sheets, Zapier, and Make automatically.
          </p>

          <h2 className="text-xl sm:text-2xl font-bold mt-10 mb-4">
            Free Tool vs Parsli AI for Bank Statement CSV
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
                  ["Text-based PDF statements", "Yes", "Yes"],
                  ["Scanned / image statements", "No", "Yes"],
                  ["Direct CSV export", "Via Save As", "Native CSV download"],
                  ["QuickBooks / Xero format", "Manual column mapping", "Auto-formatted"],
                  ["Transaction categorization", "No", "Yes"],
                  ["Any bank format", "Common layouts", "All formats (AI-powered)"],
                  ["Batch processing", "One at a time", "Hundreds via API"],
                  ["Google Sheets integration", "No", "Yes"],
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
            Stop copying bank transactions by hand.
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto mb-8 leading-relaxed">
            Parsli extracts structured transaction data from any bank statement
            and exports directly to CSV, Google Sheets, or your accounting
            software. Categorize expenses automatically. Free forever up to 30
            pages/month.
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
              { href: "/tools/bank-statement-to-excel", label: "Bank Statement to Excel" },
              { href: "/tools/bank-statement-parser", label: "Bank Statement Parser" },
              { href: "/tools/pdf-to-excel", label: "PDF to Excel Converter" },
              { href: "/solutions/bank-statement-extraction", label: "AI Bank Statement Extraction" },
              { href: "/tools/csv-to-excel", label: "CSV to Excel Converter" },
              { href: "/tools/excel-to-csv", label: "Excel to CSV Converter" },
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
