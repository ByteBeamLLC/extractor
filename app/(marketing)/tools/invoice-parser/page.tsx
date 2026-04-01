import type { Metadata } from "next"
import Link from "next/link"
import {
  Shield,
  Zap,
  UserX,
  Upload,
  FileText,
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
  ScanLine,
} from "lucide-react"
import { InvoiceParserTool } from "@/components/tools/InvoiceParserTool"
import { Button } from "@/components/ui/button"
import { AuthButton } from "@/components/marketing/shared/AuthButton"
import { JsonLd } from "@/components/marketing/shared/JsonLd"
import { breadcrumbJsonLd } from "@/lib/seo/json-ld"

export const metadata: Metadata = {
  title: "Free Invoice Parser — Extract Data Online",
  description:
    "Extract text from invoices instantly in your browser. Free, no sign-up, no file uploads to servers. Supports PDF and image invoices. For structured data extraction, try Parsli AI.",
  keywords: [
    "invoice parser",
    "invoice text extraction",
    "extract text from invoice",
    "invoice ocr free",
    "invoice data extraction",
    "parse invoice pdf",
    "invoice scanner online",
    "free invoice parser",
    "invoice reader",
    "invoice to text",
  ],
  alternates: {
    canonical: "https://parsli.co/tools/invoice-parser",
  },
  openGraph: {
    title: "Free Invoice Parser — Extract Data Online",
    description:
      "Extract text from invoices instantly in your browser. Free forever, no sign-up required, your data never leaves your device.",
    url: "https://parsli.co/tools/invoice-parser",
  },
}

const features = [
  {
    icon: Shield,
    title: "Private & secure",
    description:
      "Your invoice is processed entirely in your browser. Files never leave your device.",
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
      "No limits, no watermarks, no paywalls. Parse as many invoices as you want.",
  },
]

const steps = [
  {
    icon: Upload,
    title: "Upload your invoice",
    description: "Drag and drop your invoice PDF or photo. Up to 50 MB.",
  },
  {
    icon: ScanLine,
    title: "Extract text automatically",
    description:
      "The tool extracts all text from your invoice using PDF parsing or OCR.",
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
      "Quickly extract text from invoices for data entry, reconciliation, and record-keeping.",
  },
  {
    icon: Users,
    title: "Small Business Owners",
    description:
      "Pull text from supplier invoices without expensive software or manual retyping.",
  },
  {
    icon: Building2,
    title: "Finance Teams",
    description:
      "Extract invoice text for validation, compliance checks, and AP workflows.",
  },
  {
    icon: GraduationCap,
    title: "Freelancers & Contractors",
    description:
      "Parse client invoices and receipts to track income and expenses.",
  },
]

const faqs = [
  {
    q: "Is this invoice parser really free?",
    a: "Yes, completely free with no limits. There are no hidden charges, no watermarks, and no sign-up required. We built this as a free utility for the community.",
  },
  {
    q: "Do you store or upload my invoices?",
    a: "No. Your invoice is processed entirely in your browser using JavaScript. The file never leaves your device and is never sent to any server. Your data stays 100% private.",
  },
  {
    q: "What types of invoices work best?",
    a: "This tool works with any PDF invoice that has embedded text, as well as photo/image invoices using OCR. For best OCR results, use clear, well-lit photos.",
  },
  {
    q: "Does this extract structured data like line items and totals?",
    a: "This free tool extracts raw text from invoices. For structured data extraction — line items, totals, vendor info, dates, tax amounts — as JSON or spreadsheet, try Parsli AI which uses artificial intelligence to understand invoice layouts.",
  },
  {
    q: "Can I parse invoices in languages other than English?",
    a: "The PDF text extraction works with any language. The OCR engine supports multiple languages including English, Spanish, French, German, Arabic, Chinese, Japanese, and more.",
  },
  {
    q: "What file formats are supported?",
    a: "You can upload PDF files, JPEG/JPG images, PNG images, and WebP images. For PDF invoices, text is extracted directly. For image invoices, OCR (optical character recognition) is used.",
  },
  {
    q: "What's the difference between this and Parsli AI?",
    a: "This free tool extracts raw text from invoices. Parsli AI goes much further — it understands invoice layouts, extracts structured data (vendor name, line items, totals, tax, dates), outputs clean JSON, and integrates with Google Sheets, Zapier, and 5,000+ apps.",
  },
  {
    q: "Can I process multiple invoices at once?",
    a: "This tool processes one invoice at a time. For batch processing hundreds of invoices automatically, try Parsli AI which supports bulk uploads, email forwarding, and API integration.",
  },
  {
    q: "How accurate is the OCR for image invoices?",
    a: "OCR accuracy depends on image quality. Clear, well-lit photos with good contrast produce the best results. For complex or poor-quality images, Parsli AI uses advanced AI models for significantly higher accuracy.",
  },
  {
    q: "Can I use this on my phone?",
    a: "Yes. This tool works on iPhone, iPad, and Android devices. Open the page in your mobile browser, upload a photo of your invoice, and extract the text instantly.",
  },
]

export default function InvoiceParserPage() {
  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", url: "https://parsli.co" },
          { name: "Tools", url: "https://parsli.co/tools" },
          {
            name: "Invoice Parser",
            url: "https://parsli.co/tools/invoice-parser",
          },
        ])}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          name: "Parsli Invoice Parser",
          description:
            "Free browser-based tool to extract text from invoices. Supports PDF and image invoices. No sign-up required.",
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
            <FileText className="h-4 w-4 text-primary" />
            Invoice Parser
          </div>

          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight leading-[1.1] mb-4">
            Extract Text from Invoices
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

          <InvoiceParserTool />

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
                Want to parse invoices via API?
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                Automate invoice processing with AI-powered extraction. Get
                structured JSON with line items, totals, vendor details, and
                more. Integrate with your accounting software.
              </p>
              <div className="flex items-center gap-4">
                <Link
                  href="/solutions/invoice-parsing"
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline underline-offset-4"
                >
                  Explore Invoice Parsing
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
            Need to extract tables from PDFs?{" "}
            <Link
              href="/tools/pdf-to-excel"
              className="text-primary hover:underline underline-offset-4"
            >
              PDF to Excel Converter
            </Link>{" "}
            and{" "}
            <Link
              href="/tools/pdf-table-extractor"
              className="text-primary hover:underline underline-offset-4"
            >
              PDF Table Extractor
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

      {/* 4. Why Use This Tool */}
      <section className="py-16 sm:py-20 bg-muted/30">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-12">
            Why use this invoice parser
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
              tool extracts raw text from invoices. For structured data like
              line items, totals, and vendor info as JSON — try{" "}
              <Link
                href="/solutions/invoice-parsing"
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
                  All visible text from the invoice
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-0.5">&#10003;</span>
                  OCR for image/photo invoices
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-0.5">&#10003;</span>
                  Copy to clipboard or download as .txt
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-0.5">&#10003;</span>
                  Multi-page PDF support
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
                  Vendor name, address, and contact info
                </li>
                <li className="flex items-start gap-2">
                  <ArrowRight className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
                  Line items with descriptions, quantities, prices
                </li>
                <li className="flex items-start gap-2">
                  <ArrowRight className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
                  Subtotals, tax, discounts, and total amounts
                </li>
                <li className="flex items-start gap-2">
                  <ArrowRight className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
                  Invoice number, date, due date, PO number
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
                Tips for better invoice text extraction
              </h3>
            </div>
            <div className="space-y-6">
              <div>
                <h4 className="font-semibold mb-2">
                  Use digital PDFs when possible
                </h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  PDFs generated by accounting software have embedded text that
                  extracts perfectly. Scanned or photographed invoices use OCR,
                  which may be less accurate.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">
                  Take clear, well-lit photos
                </h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  If you&apos;re photographing a paper invoice, use good
                  lighting and avoid shadows. Flat, head-on photos produce the
                  best OCR results.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">
                  Check for multi-page invoices
                </h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  The tool extracts text from all pages in a PDF. For image
                  invoices, upload one page at a time.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">
                  Need structured data? Use Parsli AI
                </h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  If you need line items, totals, and vendor details as
                  structured JSON rather than raw text, Parsli AI handles that
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
            How to Parse Invoices for Free
          </h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            Parsing invoices is one of the most common document processing
            tasks for businesses. Whether you need to extract data from
            supplier invoices, validate payment details, or digitize paper
            invoices, a reliable invoice parser saves hours of manual work.
          </p>
          <p className="text-muted-foreground leading-relaxed mb-4">
            Most invoice parsing tools require you to upload your files to
            their servers, create an account, or pay for a subscription. This
            tool is different — it runs entirely in your browser. Your invoice
            is processed on your own device and never sent anywhere. It&apos;s
            completely free, with no limits.
          </p>

          <h2 className="text-xl sm:text-2xl font-bold mt-10 mb-4">
            When Do You Need AI-Powered Invoice Parsing?
          </h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            This free tool extracts raw text from invoices. But if you need
            structured data — line items, totals, tax amounts, vendor details
            — you need AI that understands invoice layouts.
          </p>
          <p className="text-muted-foreground leading-relaxed mb-4">
            Parsli uses Google&apos;s Gemini AI to understand invoice
            structure. You define a schema with the exact fields you want, and
            the AI extracts structured data from any invoice format. The data
            flows automatically to Google Sheets, Zapier, Make, webhooks, or
            your own API.
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
                  ["Structured data (JSON)", "No", "Yes"],
                  ["Line item extraction", "No", "Yes"],
                  ["Scanned / image invoices", "OCR (basic)", "AI (advanced)"],
                  ["Custom extraction schema", "No", "Yes"],
                  ["Batch processing", "No", "Yes"],
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
            Stop re-keying invoice data into spreadsheets.
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
              { href: "/solutions/invoice-parsing", label: "Invoice Parsing Solution" },
              { href: "/use-cases/invoice-processing", label: "Invoice Processing Use Case" },
              { href: "/tools/receipt-scanner", label: "Receipt Scanner" },
              { href: "/tools/pdf-to-excel", label: "PDF to Excel Converter" },
              { href: "/tools/bank-statement-parser", label: "Bank Statement Parser" },
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
