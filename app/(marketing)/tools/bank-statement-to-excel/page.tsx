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
  Building2,
  Lightbulb,
  Star,
  Landmark,
  Calculator,
} from "lucide-react"
import { PdfToExcelTool } from "@/components/tools/PdfToExcelTool"
import { AuthButton } from "@/components/marketing/shared/AuthButton"
import { Button } from "@/components/ui/button"
import { JsonLd } from "@/components/marketing/shared/JsonLd"
import { breadcrumbJsonLd } from "@/lib/seo/json-ld"

export const metadata: Metadata = {
  title: "Bank Statement to Excel Converter — Free, Instant, No Sign-Up | Parsli",
  description:
    "Convert bank statement PDFs to Excel (.xlsx) instantly in your browser. Free, no sign-up, no file uploads to servers. Works with statements from any bank. Extract transactions into a spreadsheet for bookkeeping and reconciliation.",
  keywords: [
    "bank statement to excel",
    "convert bank statements to excel",
    "pdf bank statement to excel",
    "bank statement converter",
    "bank statement to spreadsheet",
    "bank statement excel converter",
    "convert bank statement pdf to excel",
    "bank statement to xlsx",
    "bank statement pdf to spreadsheet",
    "free bank statement converter",
  ],
  alternates: {
    canonical: "https://parsli.co/tools/bank-statement-to-excel",
  },
  openGraph: {
    title: "Bank Statement to Excel Converter — Free, Instant, No Sign-Up",
    description:
      "Convert bank statement PDFs to Excel instantly in your browser. Free forever, no sign-up required, your data never leaves your device.",
    url: "https://parsli.co/tools/bank-statement-to-excel",
  },
}

const features = [
  {
    icon: Shield,
    title: "Private & secure",
    description:
      "Your bank statement is processed entirely in your browser. Financial data never leaves your device — no server uploads, ever.",
  },
  {
    icon: UserX,
    title: "No sign-up required",
    description:
      "Use it instantly. No account, no email, no credit card. Just upload your statement and download the Excel file.",
  },
  {
    icon: Zap,
    title: "Free & unlimited",
    description:
      "No limits, no watermarks, no paywalls. Convert as many bank statements to Excel as you need.",
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
      "The tool detects rows and columns from your statement layout — dates, descriptions, amounts, and balances.",
  },
  {
    icon: Download,
    title: "Download as Excel",
    description:
      "Preview the extracted data, then download as a clean .xlsx file ready for bookkeeping or analysis.",
  },
]

const personas = [
  {
    icon: Calculator,
    title: "Accountants & Bookkeepers",
    description:
      "Convert client bank statements to Excel for reconciliation, categorization, and import into accounting software like QuickBooks or Xero.",
  },
  {
    icon: Users,
    title: "Small Business Owners",
    description:
      "Turn monthly bank statements into spreadsheets for expense tracking, cash flow analysis, and tax preparation.",
  },
  {
    icon: Landmark,
    title: "Loan Officers & Underwriters",
    description:
      "Convert applicant bank statements to Excel to verify income, analyze spending patterns, and assess creditworthiness.",
  },
  {
    icon: Building2,
    title: "Finance Teams & Auditors",
    description:
      "Extract statement data into Excel for audit trails, compliance reviews, and financial reporting across multiple accounts.",
  },
]

const faqs = [
  {
    q: "Is this bank statement to Excel converter really free?",
    a: "Yes, completely free with no limits. There are no hidden charges, no watermarks, and no sign-up required. Convert as many bank statements as you want.",
  },
  {
    q: "Do you store or upload my bank statements?",
    a: "No. Your bank statement PDF is processed entirely in your browser using JavaScript. The file never leaves your device and is never sent to any server. Your financial data stays 100% private.",
  },
  {
    q: "Which banks' statements work with this tool?",
    a: "This tool works with PDF statements from any bank — Chase, Bank of America, Wells Fargo, Citi, Capital One, TD Bank, PNC, US Bank, and any other bank worldwide. If your bank provides PDF statements with embedded text, this tool will convert them.",
  },
  {
    q: "Does it extract individual transactions?",
    a: "This tool detects and extracts table structures from your bank statement PDF, including transaction rows with dates, descriptions, and amounts. For AI-powered extraction that understands statement layouts and categorizes transactions automatically, try Parsli AI.",
  },
  {
    q: "What if my bank statement is a scanned document?",
    a: "This tool works best with text-based PDF statements downloaded directly from your online banking portal. Scanned paper statements (images of text) require OCR, which this tool doesn't include. For scanned statements, try Parsli's AI-powered extraction.",
  },
  {
    q: "Can I convert multiple months of statements?",
    a: "You can convert one PDF at a time, but multi-page PDFs are fully supported. If your bank provides a single PDF with multiple months, it will all be converted. For batch processing many statement files, try Parsli AI.",
  },
  {
    q: "How do I download my bank statement as a PDF?",
    a: "Log in to your bank's online portal or mobile app. Navigate to Statements or Documents, select the month you need, and download the PDF. Most banks keep 12-24 months of statements available for download. Downloaded PDFs have embedded text that converts perfectly.",
  },
  {
    q: "Can I open the Excel file in Google Sheets?",
    a: "Yes. The .xlsx file works with Microsoft Excel, Google Sheets, LibreOffice Calc, Apple Numbers, and any other spreadsheet application. In Google Sheets, just go to File > Open and select the downloaded file.",
  },
  {
    q: "What's the difference between this tool and Parsli AI?",
    a: "This free tool does rule-based table extraction from text-based PDF statements. Parsli AI uses Google's Gemini to understand statement layouts intelligently — it extracts structured transaction data, categorizes expenses, and integrates with Google Sheets, QuickBooks, Zapier, and 5,000+ apps.",
  },
  {
    q: "Can I convert a bank statement to Excel on my phone?",
    a: "Yes. This tool works on iPhone, iPad, and Android devices. Open the page in your mobile browser, upload your statement PDF, and download the Excel file directly to your device.",
  },
]

export default function BankStatementToExcelPage() {
  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", url: "https://parsli.co" },
          { name: "Tools", url: "https://parsli.co/tools" },
          {
            name: "Bank Statement to Excel",
            url: "https://parsli.co/tools/bank-statement-to-excel",
          },
        ])}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          name: "Parsli Bank Statement to Excel Converter",
          description:
            "Free browser-based tool to convert bank statement PDFs to Excel spreadsheets. No sign-up required, no data uploaded to servers.",
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
            Bank Statement to Excel
          </div>

          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight leading-[1.1] mb-4">
            Convert Bank Statements to Excel
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
                Need structured transaction data from bank statements?
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                Parsli AI extracts individual transactions with dates, amounts,
                balances, and categories. Automate bank statement processing
                with custom schemas, batch uploads, and direct integration with
                your accounting tools.
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
            Need CSV instead of Excel?{" "}
            <Link
              href="/tools/bank-statement-to-csv"
              className="text-primary hover:underline underline-offset-4"
            >
              Bank Statement to CSV
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
            Why use this bank statement to Excel converter
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
              <span className="font-medium text-foreground">Tip:</span> For
              best results, download your bank statement as a PDF directly from
              your bank&apos;s online portal. These have embedded text that
              converts cleanly. Scanned paper statements require OCR — try{" "}
              <Link
                href="/solutions/bank-statement-extraction"
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
                  Credit card statements with transaction tables
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-0.5">&#10003;</span>
                  Business account statements with multiple pages
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-0.5">&#10003;</span>
                  Statements downloaded from online banking portals
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-0.5">&#10003;</span>
                  Statements with clear tabular transaction layouts
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
                  Scanned or photographed paper statements
                </li>
                <li className="flex items-start gap-2">
                  <ArrowRight className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
                  Statements with non-standard or complex layouts
                </li>
                <li className="flex items-start gap-2">
                  <ArrowRight className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
                  Automatic transaction categorization (rent, groceries, payroll)
                </li>
                <li className="flex items-start gap-2">
                  <ArrowRight className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
                  Direct export to Google Sheets, QuickBooks, or Zapier
                </li>
                <li className="flex items-start gap-2">
                  <ArrowRight className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
                  Batch processing hundreds of statements via API
                </li>
              </ul>
            </div>
          </div>

          {/* Tips for better conversion */}
          <div className="mt-16 max-w-3xl mx-auto">
            <div className="flex items-center gap-2 mb-6">
              <Lightbulb className="h-5 w-5 text-primary" />
              <h3 className="text-xl font-bold">
                Tips for converting bank statements to Excel
              </h3>
            </div>
            <div className="space-y-6">
              <div>
                <h4 className="font-semibold mb-2">
                  Download statements from online banking, don&apos;t scan them
                </h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  PDF statements downloaded from your bank&apos;s website or app
                  have embedded, selectable text that extracts cleanly into
                  Excel. Scanning a paper statement creates an image-based PDF
                  that this tool can&apos;t read. Most banks let you download
                  statements from the last 12 to 24 months.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">
                  Check column alignment after conversion
                </h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Bank statements vary in layout. Some have four columns (date,
                  description, debit, credit) while others combine debits and
                  credits into one amount column. After downloading the Excel
                  file, quickly check that columns aligned correctly.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">
                  Format numbers as currency in Excel
                </h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  The extracted values are text-based. In Excel, select the
                  amount columns and format them as Currency or Number to enable
                  SUM, AVERAGE, and other calculations. Google Sheets does this
                  automatically in most cases.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">
                  Multi-page statements are fully supported
                </h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Long statements with dozens of transactions spanning multiple
                  pages are handled automatically. Pages with the same table
                  structure are combined into one sheet. Check all tabs if your
                  statement has different sections.
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
            How to Convert Bank Statements to Excel for Free
          </h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            Converting bank statements to Excel is one of the most common tasks
            in accounting, bookkeeping, and financial analysis. Whether you need
            to reconcile transactions, track business expenses, prepare tax
            documents, or verify income for a loan application, having your bank
            data in a spreadsheet makes everything easier.
          </p>
          <p className="text-muted-foreground leading-relaxed mb-4">
            Most online bank statement converters require you to upload your
            files to their servers — a major privacy concern when dealing with
            financial data containing account numbers, balances, and transaction
            history. This tool is different: it runs entirely in your browser
            using JavaScript. Your bank statement PDF is processed on your own
            device and never transmitted anywhere. It&apos;s completely free,
            with no limits on the number of conversions.
          </p>

          <h2 className="text-xl sm:text-2xl font-bold mt-10 mb-4">
            When Do You Need AI-Powered Bank Statement Extraction?
          </h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            This free converter handles text-based PDF bank statements with
            clear table layouts. But real-world statements can be challenging —
            varying formats across banks, multi-section layouts, merged cells
            for running balances, or scanned paper statements from clients.
            That&apos;s where AI-powered extraction becomes essential.
          </p>
          <p className="text-muted-foreground leading-relaxed mb-4">
            Parsli uses Google&apos;s Gemini AI to understand bank statement
            structure intelligently. You define a schema — transaction date,
            description, amount, balance, category — and the AI extracts
            structured data from any bank&apos;s format. It handles scanned
            statements, irregular layouts, and even handwritten notes. The
            extracted data flows automatically to Google Sheets, your accounting
            software, or any app via Zapier and Make.
          </p>

          <h2 className="text-xl sm:text-2xl font-bold mt-10 mb-4">
            Free Tool vs Parsli AI for Bank Statements
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
                  ["Structured transaction data", "Basic table extraction", "Date, amount, balance, category"],
                  ["Any bank format", "Common layouts", "All formats (AI-powered)"],
                  ["Transaction categorization", "No", "Yes"],
                  ["Google Sheets integration", "No", "Yes"],
                  ["Batch processing", "One at a time", "Hundreds via API"],
                  ["QuickBooks / Xero export", "No", "Via Zapier / Make"],
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
            Stop manually entering bank transactions into spreadsheets.
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto mb-8 leading-relaxed">
            Parsli extracts structured transaction data from any bank statement
            — dates, amounts, balances, and categories. Automate reconciliation
            with Google Sheets, QuickBooks, and 5,000+ apps. Free forever up to
            30 pages/month.
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
              { href: "/tools/bank-statement-to-csv", label: "Bank Statement to CSV" },
              { href: "/tools/bank-statement-parser", label: "Bank Statement Parser" },
              { href: "/tools/pdf-to-excel", label: "PDF to Excel Converter" },
              { href: "/solutions/bank-statement-extraction", label: "AI Bank Statement Extraction" },
              { href: "/tools/invoice-parser", label: "Invoice Parser" },
              { href: "/tools/receipt-scanner", label: "Receipt Scanner" },
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
