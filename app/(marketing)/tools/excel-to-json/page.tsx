import type { Metadata } from "next"
import Link from "next/link"
import {
  Shield,
  Zap,
  UserX,
  Upload,
  FileJson2,
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
import { ExcelToJsonTool } from "@/components/tools/ExcelToJsonTool"
import { AuthButton } from "@/components/marketing/shared/AuthButton"
import { Button } from "@/components/ui/button"
import { JsonLd } from "@/components/marketing/shared/JsonLd"
import { breadcrumbJsonLd } from "@/lib/seo/json-ld"

export const metadata: Metadata = {
  title: "Excel to JSON Converter — Free, Instant, No Sign-Up",
  description:
    "Convert Excel spreadsheets (.xlsx, .xls) to JSON instantly in your browser. Free, no sign-up, no file uploads to servers. Your data stays private.",
  keywords: [
    "excel to json converter",
    "excel to json free",
    "convert excel to json",
    "xlsx to json",
    "spreadsheet to json",
    "excel to json online",
    "excel to json no sign up",
    "xls to json",
    "convert spreadsheet to json",
    "excel json converter free",
  ],
  alternates: {
    canonical: "https://parsli.co/tools/excel-to-json",
  },
  openGraph: {
    title: "Excel to JSON Converter — Free, Instant, No Sign-Up",
    description:
      "Convert Excel files to JSON instantly in your browser. Free forever, no sign-up required, your data never leaves your device.",
    url: "https://parsli.co/tools/excel-to-json",
  },
}

const features = [
  {
    icon: Shield,
    title: "Private & secure",
    description:
      "Your Excel file is processed entirely in your browser. Files never leave your device.",
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
    title: "Upload your Excel file",
    description: "Drag and drop your .xlsx or .xls file, or click to browse. Up to 50 MB.",
  },
  {
    icon: Table,
    title: "Auto-convert to JSON",
    description:
      "The first row becomes object keys. Each subsequent row becomes a JSON object in the array.",
  },
  {
    icon: Download,
    title: "Copy or download",
    description:
      "Copy the JSON to your clipboard or download it as a .json file. That's it.",
  },
]

const personas = [
  {
    icon: Code2,
    title: "Developers & Engineers",
    description:
      "Quickly convert spreadsheet data into JSON for APIs, databases, and config files.",
  },
  {
    icon: BarChart3,
    title: "Data Analysts",
    description:
      "Transform Excel exports into JSON format for data pipelines and visualization tools.",
  },
  {
    icon: Users,
    title: "Product & Project Managers",
    description:
      "Convert spreadsheet-based specs, lists, and trackers into structured JSON data.",
  },
  {
    icon: GraduationCap,
    title: "Students & Researchers",
    description:
      "Turn research data from Excel into JSON for academic tools and web applications.",
  },
]

const faqs = [
  {
    q: "Is this tool really free?",
    a: "Yes, completely free with no limits. There are no hidden charges, no watermarks, and no sign-up required. We built this as a free utility for the community.",
  },
  {
    q: "Do you store or upload my Excel files?",
    a: "No. Your Excel file is processed entirely in your browser using JavaScript. The file never leaves your device and is never sent to any server. Your data stays 100% private.",
  },
  {
    q: "How does the Excel to JSON conversion work?",
    a: "The tool reads the first sheet of your Excel file. The first row is used as the keys (property names) for each JSON object. Every subsequent row becomes an object in the resulting JSON array.",
  },
  {
    q: "What if my Excel file has multiple sheets?",
    a: "Currently, the tool converts the first sheet. If you need data from other sheets, you can copy the data into the first sheet or use Parsli's API for multi-sheet extraction.",
  },
  {
    q: "Does it handle numbers and dates correctly?",
    a: "Yes. Numbers remain as numeric values in JSON (not strings). Dates are converted based on how Excel stores them. For complex date formatting, you may want to check the output.",
  },
  {
    q: "What Excel formats are supported?",
    a: "Both .xlsx (modern Excel) and .xls (legacy Excel 97-2003) formats are supported.",
  },
  {
    q: "What's the difference between this and Parsli?",
    a: "This free tool does direct Excel-to-JSON conversion. Parsli is a full AI-powered document extraction platform — it handles PDFs, images, scanned documents, and lets you define custom schemas for exactly what data to extract.",
  },
  {
    q: "Can I convert Excel to JSON on my phone?",
    a: "Yes. This tool works on iPhone, iPad, and Android devices. Open the page in your mobile browser, upload your Excel file, and copy or download the JSON output.",
  },
  {
    q: "What file size limit is there?",
    a: "Up to 50 MB. Since everything runs in your browser, very large files may take longer to process depending on your device.",
  },
  {
    q: "Is the JSON output minified or pretty-printed?",
    a: "The JSON output is pretty-printed with 2-space indentation for readability. When you copy or download it, you get the same formatted output.",
  },
]

export default function ExcelToJsonToolPage() {
  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", url: "https://parsli.co" },
          { name: "Tools", url: "https://parsli.co/tools" },
          {
            name: "Excel to JSON Converter",
            url: "https://parsli.co/tools/excel-to-json",
          },
        ])}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          name: "Parsli Excel to JSON Converter",
          description:
            "Free browser-based tool to convert Excel spreadsheets to JSON. No sign-up required.",
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
            <FileJson2 className="h-4 w-4 text-primary" />
            Excel to JSON Converter
          </div>

          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight leading-[1.1] mb-4">
            Convert Excel to JSON
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

          <ExcelToJsonTool />

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
                Need to extract structured JSON from any document?
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                Parsli&apos;s AI extracts structured JSON from PDFs, images, invoices,
                and more. Define custom schemas, automate workflows, and
                integrate with your stack via API.
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
              href="/tools/json-to-excel"
              className="text-primary hover:underline underline-offset-4"
            >
              JSON to Excel
            </Link>
            ,{" "}
            <Link
              href="/tools/excel-to-csv"
              className="text-primary hover:underline underline-offset-4"
            >
              Excel to CSV
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
            Why use this Excel to JSON converter
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
              tool converts the first sheet of your Excel file. The first row
              is used as JSON keys. For multi-sheet or complex extraction, try{" "}
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
                  Spreadsheets with headers in the first row
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-0.5">&#10003;</span>
                  Data exports from CRMs, ERPs, and databases
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-0.5">&#10003;</span>
                  Contact lists, product catalogs, inventory sheets
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-0.5">&#10003;</span>
                  Configuration data and lookup tables
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-0.5">&#10003;</span>
                  Simple, flat data structures
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
                  Extracting data from PDFs and images
                </li>
                <li className="flex items-start gap-2">
                  <ArrowRight className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
                  Scanned documents requiring OCR
                </li>
                <li className="flex items-start gap-2">
                  <ArrowRight className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
                  Custom JSON schemas with validation
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

          {/* Tips */}
          <div className="mt-16 max-w-3xl mx-auto">
            <div className="flex items-center gap-2 mb-6">
              <Lightbulb className="h-5 w-5 text-primary" />
              <h3 className="text-xl font-bold">
                Tips for better Excel to JSON conversion
              </h3>
            </div>
            <div className="space-y-6">
              <div>
                <h4 className="font-semibold mb-2">
                  Use clear header names in the first row
                </h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  The first row of your spreadsheet becomes the JSON key names.
                  Use descriptive, consistent names like &quot;first_name&quot; or
                  &quot;email&quot; for clean JSON output.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">
                  Keep data in a single sheet
                </h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  This tool converts the first sheet. If your data spans
                  multiple sheets, consolidate it first or use Parsli for
                  multi-sheet handling.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">
                  Remove empty rows and columns
                </h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Empty rows will create objects with empty values. Clean up
                  your spreadsheet before converting for the best JSON output.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">
                  Numbers stay as numbers
                </h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Numeric cells are preserved as JSON numbers, not strings.
                  Text cells remain as strings. This gives you properly typed
                  JSON data.
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
            How to Convert Excel to JSON for Free
          </h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            Converting Excel spreadsheets to JSON is a common task for
            developers, data analysts, and anyone working with web APIs.
            Whether you need to import spreadsheet data into a database,
            configure a web application, or feed data into a pipeline, a
            reliable Excel to JSON converter saves time and eliminates manual
            formatting.
          </p>
          <p className="text-muted-foreground leading-relaxed mb-4">
            Most online converters require you to upload your files to their
            servers, create an account, or pay for a subscription. This tool is
            different — it runs entirely in your browser using JavaScript. Your
            Excel file is processed on your own device and never sent anywhere.
            It&apos;s completely free, with no limits on conversions.
          </p>

          <h2 className="text-xl sm:text-2xl font-bold mt-10 mb-4">
            When Do You Need AI-Powered Document Extraction?
          </h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            This free converter handles straightforward Excel-to-JSON
            conversion. But if you need to extract structured data from PDFs,
            images, scanned documents, or complex layouts — that&apos;s where
            AI-powered extraction comes in.
          </p>
          <p className="text-muted-foreground leading-relaxed mb-4">
            Parsli uses Google&apos;s Gemini AI to understand the full context of
            your documents. You define a schema — the exact fields you want
            extracted — and the AI pulls structured JSON from any document
            type. The extracted data flows automatically to Google Sheets,
            Zapier, Make, webhooks, or your own API.
          </p>

          <h2 className="text-xl sm:text-2xl font-bold mt-10 mb-4">
            Excel to JSON: Free Tool vs AI Extraction
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
                  ["Excel files (.xlsx/.xls)", "Yes", "Yes"],
                  ["PDFs & images", "No", "Yes"],
                  ["Custom JSON schemas", "No", "Yes"],
                  ["Multi-sheet support", "First sheet", "All sheets"],
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
            Stop reformatting spreadsheet data by hand.
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
              { href: "/tools/json-to-excel", label: "JSON to Excel Converter" },
              { href: "/tools/excel-to-csv", label: "Excel to CSV Converter" },
              { href: "/tools/csv-to-excel", label: "CSV to Excel Converter" },
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
