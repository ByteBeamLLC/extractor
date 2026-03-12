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
  Landmark,
  ScanLine,
  FileText,
} from "lucide-react"
import { BankStatementParserTool } from "@/components/tools/BankStatementParserTool"
import { Button } from "@/components/ui/button"
import { AuthButton } from "@/components/marketing/shared/AuthButton"
import { JsonLd } from "@/components/marketing/shared/JsonLd"
import { breadcrumbJsonLd } from "@/lib/seo/json-ld"

export const metadata: Metadata = {
  title: "Free Bank Statement Parser — Extract Text from Statements | Parsli",
  description:
    "Extract text from bank statements instantly in your browser. Free, no sign-up, no file uploads to servers. Supports PDF and image statements. For structured transaction data, try Parsli AI.",
  keywords: [
    "bank statement parser",
    "bank statement text extraction",
    "extract text from bank statement",
    "bank statement ocr",
    "parse bank statement pdf",
    "bank statement reader",
    "bank statement data extraction",
    "free bank statement parser",
    "bank statement to text",
    "bank statement converter",
  ],
  alternates: {
    canonical: "https://parsli.co/tools/bank-statement-parser",
  },
  openGraph: {
    title: "Free Bank Statement Parser — Extract Text from Statements",
    description:
      "Extract text from bank statements instantly in your browser. Free forever, no sign-up required, your data never leaves your device.",
    url: "https://parsli.co/tools/bank-statement-parser",
  },
}

const features = [
  {
    icon: Shield,
    title: "Private & secure",
    description:
      "Your bank statement is processed entirely in your browser. Files never leave your device — critical for financial data.",
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
      "No limits, no watermarks, no paywalls. Parse as many statements as you want.",
  },
]

const steps = [
  {
    icon: Upload,
    title: "Upload your statement",
    description: "Drag and drop your bank statement PDF or image. Up to 50 MB.",
  },
  {
    icon: ScanLine,
    title: "Extract text automatically",
    description:
      "The tool extracts all text from your statement using PDF parsing or OCR for images.",
  },
  {
    icon: Download,
    title: "Copy or download",
    description:
      "Copy the extracted text to clipboard or download as a .txt file.",
  },
]

const personas = [
  {
    icon: BarChart3,
    title: "Accountants & Bookkeepers",
    description:
      "Extract transaction text from bank statements for reconciliation and data entry.",
  },
  {
    icon: Users,
    title: "Small Business Owners",
    description:
      "Pull text from monthly statements without expensive software or manual retyping.",
  },
  {
    icon: Building2,
    title: "Finance Teams",
    description:
      "Process bank statements for audits, compliance, and financial reporting workflows.",
  },
  {
    icon: GraduationCap,
    title: "Loan Officers & Underwriters",
    description:
      "Extract statement text to verify income, expenses, and financial history.",
  },
]

const faqs = [
  {
    q: "Is this bank statement parser really free?",
    a: "Yes, completely free with no limits. There are no hidden charges, no watermarks, and no sign-up required. We built this as a free utility for the community.",
  },
  {
    q: "Do you store or upload my bank statements?",
    a: "No. Your bank statement is processed entirely in your browser using JavaScript. The file never leaves your device and is never sent to any server. Your financial data stays 100% private.",
  },
  {
    q: "Is it safe to use for financial documents?",
    a: "Yes. Because all processing happens in your browser, your bank statement data never touches any server. This is the safest way to extract text from sensitive financial documents online.",
  },
  {
    q: "Does this extract structured transaction data?",
    a: "This free tool extracts raw text from bank statements. For structured transaction data — dates, descriptions, amounts, running balances — as JSON or spreadsheet, try Parsli AI which uses AI to understand statement layouts.",
  },
  {
    q: "What types of bank statements work best?",
    a: "This tool works with any PDF bank statement that has embedded text. Most statements downloaded from online banking work perfectly. Scanned paper statements use OCR, which may be less accurate.",
  },
  {
    q: "Can I parse statements from any bank?",
    a: "Yes. The tool extracts text from any bank statement regardless of the bank or format. It works with statements from Chase, Bank of America, Wells Fargo, Citi, and any other bank worldwide.",
  },
  {
    q: "What file formats are supported?",
    a: "You can upload PDF files, JPEG/JPG images, PNG images, and WebP images. PDF statements downloaded from your bank work best.",
  },
  {
    q: "What's the difference between this and Parsli AI?",
    a: "This free tool extracts raw text from bank statements. Parsli AI understands statement layouts and extracts structured transaction data — dates, descriptions, amounts, balances — as clean JSON. It also categorizes transactions and integrates with Google Sheets, Zapier, and 5,000+ apps.",
  },
  {
    q: "Can I process multiple months of statements?",
    a: "This tool processes one statement at a time. Multi-page PDFs are fully supported. For batch processing many statements automatically, try Parsli AI which supports bulk uploads and API integration.",
  },
  {
    q: "Can I use this on my phone?",
    a: "Yes. This tool works on iPhone, iPad, and Android devices. Open the page in your mobile browser, upload your statement, and extract the text instantly.",
  },
]

export default function BankStatementParserPage() {
  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", url: "https://parsli.co" },
          { name: "Tools", url: "https://parsli.co/tools" },
          {
            name: "Bank Statement Parser",
            url: "https://parsli.co/tools/bank-statement-parser",
          },
        ])}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          name: "Parsli Bank Statement Parser",
          description:
            "Free browser-based tool to extract text from bank statements. Supports PDF and image statements. No sign-up required.",
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
            <Landmark className="h-4 w-4 text-primary" />
            Bank Statement Parser
          </div>

          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight leading-[1.1] mb-4">
            Extract Text from Bank Statements
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-3">
            Free, instant, no sign-up
          </p>

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

          <BankStatementParserTool />

          <p className="mt-6 text-xs text-muted-foreground">
            100% client-side processing &middot; No data sent to any server
            &middot; Unlimited extractions
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
                Want to parse bank statements via API?
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                Automate bank statement processing with AI-powered extraction.
                Get structured transaction data with dates, amounts, balances,
                and categories. Integrate with your financial software.
              </p>
              <div className="flex items-center gap-4">
                <Link
                  href="/solutions/bank-statement-extraction"
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline underline-offset-4"
                >
                  Explore Bank Statement Extraction
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
            Processing invoices or receipts?{" "}
            <Link
              href="/tools/invoice-parser"
              className="text-primary hover:underline underline-offset-4"
            >
              Invoice Parser
            </Link>{" "}
            and{" "}
            <Link
              href="/tools/receipt-scanner"
              className="text-primary hover:underline underline-offset-4"
            >
              Receipt Scanner
            </Link>{" "}
            are built for that. Or try the{" "}
            <Link
              href="/tools/pdf-to-excel"
              className="text-primary hover:underline underline-offset-4"
            >
              PDF to Excel Converter
            </Link>{" "}
            to get statement data in a spreadsheet.
          </p>
        </div>
      </section>

      {/* 4. Why Use This Tool */}
      <section className="py-16 sm:py-20 bg-muted/30">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-12">
            Why use this bank statement parser
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
              tool extracts raw text from bank statements. For structured
              transaction data with dates, amounts, and balances — try{" "}
              <Link
                href="/solutions/bank-statement-extraction"
                className="text-primary hover:underline underline-offset-4"
              >
                Parsli AI
              </Link>{" "}
              for that.
            </p>
          </div>
        </div>
      </section>

      {/* 6. Educational Content */}
      <section className="py-16 sm:py-20 bg-muted/30">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-12">
            What this tool extracts
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="rounded-xl border bg-card p-6">
              <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Free text extraction
              </h3>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-0.5">&#10003;</span>
                  All visible text from the statement
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-0.5">&#10003;</span>
                  OCR for scanned/image statements
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-0.5">&#10003;</span>
                  Copy to clipboard or download as .txt
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-0.5">&#10003;</span>
                  Multi-page statement support
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-0.5">&#10003;</span>
                  100% private, runs in your browser
                </li>
              </ul>
            </div>
            <div className="rounded-xl border bg-card p-6">
              <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Parsli AI structured extraction
              </h3>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <ArrowRight className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
                  Transaction dates, descriptions, and amounts
                </li>
                <li className="flex items-start gap-2">
                  <ArrowRight className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
                  Running balances and account summaries
                </li>
                <li className="flex items-start gap-2">
                  <ArrowRight className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
                  Debit/credit categorization
                </li>
                <li className="flex items-start gap-2">
                  <ArrowRight className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
                  Account holder and bank details
                </li>
                <li className="flex items-start gap-2">
                  <ArrowRight className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
                  Custom schemas, API, Google Sheets, Zapier
                </li>
              </ul>
            </div>
          </div>

          {/* Tips */}
          <div className="mt-16 max-w-3xl mx-auto">
            <div className="flex items-center gap-2 mb-6">
              <Lightbulb className="h-5 w-5 text-primary" />
              <h3 className="text-xl font-bold">
                Tips for better bank statement extraction
              </h3>
            </div>
            <div className="space-y-6">
              <div>
                <h4 className="font-semibold mb-2">
                  Download statements directly from your bank
                </h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  PDF statements downloaded from online banking have embedded
                  text that extracts perfectly. Printed and scanned statements
                  require OCR and may be less accurate.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">
                  Your data never leaves your device
                </h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Unlike most tools, this parser runs entirely in your browser.
                  Your sensitive financial data is never uploaded to any server
                  — perfect for bank statements.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">
                  Multi-page statements are supported
                </h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  The tool extracts text from all pages in your statement PDF.
                  Long statements with many transactions are fully supported.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">
                  Need structured transactions? Use Parsli AI
                </h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  If you need individual transactions with dates, amounts, and
                  balances as structured data, Parsli AI handles that
                  automatically.
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
            How to Parse Bank Statements for Free
          </h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            Parsing bank statements is essential for accounting, loan
            underwriting, financial audits, and personal finance management.
            Whether you need to extract transaction data for bookkeeping,
            verify income for a loan application, or digitize paper statements,
            a reliable bank statement parser saves hours of manual work.
          </p>
          <p className="text-muted-foreground leading-relaxed mb-4">
            Most bank statement parsing tools require you to upload your files
            to their servers — a serious concern for sensitive financial data.
            This tool is different — it runs entirely in your browser. Your
            statement is processed on your own device and never sent anywhere.
          </p>

          <h2 className="text-xl sm:text-2xl font-bold mt-10 mb-4">
            When Do You Need AI-Powered Bank Statement Parsing?
          </h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            This free tool extracts raw text from bank statements. But if you
            need structured transaction data — dates, descriptions, amounts,
            running balances — you need AI that understands statement layouts.
          </p>
          <p className="text-muted-foreground leading-relaxed mb-4">
            Parsli uses Google&apos;s Gemini AI to understand bank statement
            structure. You define a schema with the exact fields you want, and
            the AI extracts structured data from any bank&apos;s format. The
            data flows automatically to Google Sheets, your accounting software,
            or any app via Zapier.
          </p>

          <h2 className="text-xl sm:text-2xl font-bold mt-10 mb-4">
            Free Text Extraction vs Parsli AI Extraction
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
                  ["Raw text extraction", "Yes", "Yes"],
                  ["Structured transactions (JSON)", "No", "Yes"],
                  ["Date/amount/balance parsing", "No", "Yes"],
                  ["Scanned / image statements", "OCR (basic)", "AI (advanced)"],
                  ["Custom extraction schema", "No", "Yes"],
                  ["Batch processing", "No", "Yes"],
                  ["Transaction categorization", "No", "Yes"],
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
            Stop manually entering bank transactions.
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

      {/* 12. Related Resources */}
      <section className="py-12 sm:py-16 border-t">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-lg font-semibold mb-6">Related Resources</h2>
          <div className="flex flex-wrap gap-3">
            {[
              { href: "/solutions/bank-statement-extraction", label: "Bank Statement Extraction" },
              { href: "/tools/invoice-parser", label: "Invoice Parser" },
              { href: "/tools/receipt-scanner", label: "Receipt Scanner" },
              { href: "/tools/pdf-to-excel", label: "PDF to Excel Converter" },
              { href: "/tools/pdf-table-extractor", label: "PDF Table Extractor" },
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
