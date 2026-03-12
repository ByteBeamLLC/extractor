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
  FileText,
  Code2,
  Monitor,
  Smartphone,
  Tablet,
  Users,
  GraduationCap,
  Building2,
  Lightbulb,
  Star,
  ScanText,
  Briefcase,
} from "lucide-react"
import { PdfToTextTool } from "@/components/tools/PdfToTextTool"
import { AuthButton } from "@/components/marketing/shared/AuthButton"
import { Button } from "@/components/ui/button"
import { JsonLd } from "@/components/marketing/shared/JsonLd"
import { breadcrumbJsonLd } from "@/lib/seo/json-ld"

export const metadata: Metadata = {
  title: "PDF to Text Converter — Free, Instant, No Sign-Up | Parsli",
  description:
    "Extract text from PDF files instantly in your browser. Free, no sign-up, no file uploads to servers. Convert any text-based PDF to plain text in seconds.",
  keywords: [
    "pdf to text",
    "pdf to text converter",
    "extract text from pdf",
    "pdf to txt",
    "convert pdf to text",
    "pdf text extractor",
    "pdf to plain text",
    "pdf to text free",
    "pdf to text online",
    "pdf text extraction",
  ],
  alternates: {
    canonical: "https://parsli.co/tools/pdf-to-text",
  },
  openGraph: {
    title: "PDF to Text Converter — Free, Instant, No Sign-Up",
    description:
      "Extract text from PDF files instantly in your browser. Free forever, no sign-up required, your data never leaves your device.",
    url: "https://parsli.co/tools/pdf-to-text",
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
      "No limits, no watermarks, no paywalls. Extract text from as many PDFs as you want.",
  },
]

const steps = [
  {
    icon: Upload,
    title: "Upload your PDF",
    description: "Drag and drop your PDF or click to browse. Up to 50 MB.",
  },
  {
    icon: ScanText,
    title: "Text is extracted",
    description:
      "The tool reads embedded text from every page of your PDF automatically.",
  },
  {
    icon: Download,
    title: "Copy or download",
    description:
      "Copy the extracted text to your clipboard or download it as a .txt file.",
  },
]

const personas = [
  {
    icon: Briefcase,
    title: "Lawyers & Legal Teams",
    description:
      "Extract text from contracts, court filings, and legal documents for review, search, and analysis.",
  },
  {
    icon: Users,
    title: "Content & Marketing Teams",
    description:
      "Pull text from PDF reports, whitepapers, and ebooks for repurposing into blog posts and campaigns.",
  },
  {
    icon: GraduationCap,
    title: "Students & Academics",
    description:
      "Extract text from research papers, lecture notes, and textbook chapters for citing and studying.",
  },
  {
    icon: Building2,
    title: "Operations & Admin",
    description:
      "Convert PDF reports, manuals, and documentation into searchable plain text.",
  },
]

const faqs = [
  {
    q: "Is this PDF to text tool really free?",
    a: "Yes, completely free with no limits. There are no hidden charges, no watermarks, and no sign-up required. We built this as a free utility for the community.",
  },
  {
    q: "Do you store or upload my PDF files?",
    a: "No. Your PDF is processed entirely in your browser using pdf.js. The file never leaves your device and is never sent to any server. Your data stays 100% private.",
  },
  {
    q: "Does this use OCR?",
    a: "No. This tool extracts embedded text directly from the PDF file structure. It's faster and more accurate than OCR for text-based PDFs. For scanned PDFs (images of text), you need OCR — try our Image to Text tool or Parsli AI.",
  },
  {
    q: "What types of PDFs work best?",
    a: "This tool works best with text-based PDFs — documents where you can select and copy text. This includes most digital documents, reports, contracts, ebooks, and forms. Scanned documents (images of text) won't work with this tool.",
  },
  {
    q: "Can I extract text from a scanned PDF?",
    a: "No, this tool extracts embedded text only. Scanned PDFs contain images, not text. For scanned PDFs, use our Image to Text OCR tool or Parsli's AI-powered extraction which handles scans, photos, and complex layouts.",
  },
  {
    q: "Can I extract text from multiple pages?",
    a: "Yes. The tool extracts text from all pages in your PDF and combines them into a single text output, separated by page breaks.",
  },
  {
    q: "What's the difference between this and Parsli?",
    a: "This free tool extracts raw text from text-based PDFs. Parsli is a full AI-powered document extraction platform — it handles scanned documents, complex layouts, and lets you define custom schemas for extracting specific data fields. It also connects to Google Sheets, Zapier, Make, and 5,000+ apps automatically.",
  },
  {
    q: "What file size limit is there?",
    a: "Up to 50 MB. Since everything runs in your browser, very large files may take longer to process depending on your device.",
  },
  {
    q: "Does this preserve formatting?",
    a: "The tool extracts plain text content. Basic text flow and paragraph structure are preserved, but complex formatting (tables, columns, headers/footers) may not be perfectly maintained. For structured data extraction, try Parsli AI.",
  },
  {
    q: "Can I use this on my phone?",
    a: "Yes. This tool works on iPhone, iPad, and Android devices. Open the page in your mobile browser, upload your PDF, and copy or download the extracted text directly.",
  },
]

export default function PdfToTextToolPage() {
  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", url: "https://parsli.co" },
          { name: "Tools", url: "https://parsli.co/tools" },
          {
            name: "PDF to Text Converter",
            url: "https://parsli.co/tools/pdf-to-text",
          },
        ])}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          name: "Parsli PDF to Text Converter",
          description:
            "Free browser-based tool to extract text from PDF files. No sign-up required.",
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
            PDF to Text Converter
          </div>

          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight leading-[1.1] mb-4">
            Extract Text from PDF
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

          <PdfToTextTool />

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
                Need to extract PDF data via API?
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                Integrate AI-powered document extraction into your workflow.
                Batch-process hundreds of PDFs, get structured JSON output
                with custom schemas, and automate everything.
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
            Need to extract tables from PDFs?{" "}
            <Link
              href="/tools/pdf-to-excel"
              className="text-primary hover:underline underline-offset-4"
            >
              PDF to Excel
            </Link>{" "}
            converts tables to spreadsheets. For scanned documents, try{" "}
            <Link
              href="/tools/image-to-text"
              className="text-primary hover:underline underline-offset-4"
            >
              Image to Text (OCR)
            </Link>
            . Or see how Parsli compares to{" "}
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
            Why use this PDF to text converter
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
              tool extracts embedded text from PDFs. Scanned documents (images
              of text) require OCR &mdash; try{" "}
              <Link
                href="/tools/image-to-text"
                className="text-primary hover:underline underline-offset-4"
              >
                Image to Text
              </Link>{" "}
              or{" "}
              <Link
                href="/solutions/ai-ocr"
                className="text-primary hover:underline underline-offset-4"
              >
                Parsli AI
              </Link>{" "}
              for those.
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
                  Digital PDFs with selectable text
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-0.5">&#10003;</span>
                  Contracts, legal documents, and agreements
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-0.5">&#10003;</span>
                  Reports, whitepapers, and ebooks
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-0.5">&#10003;</span>
                  Academic papers and research articles
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-0.5">&#10003;</span>
                  Manuals, guides, and documentation
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
                  Structured data extraction (invoices, receipts)
                </li>
                <li className="flex items-start gap-2">
                  <ArrowRight className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
                  Custom extraction schemas for specific fields
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
                Tips for better PDF text extraction
              </h3>
            </div>
            <div className="space-y-6">
              <div>
                <h4 className="font-semibold mb-2">
                  Check if your PDF has selectable text
                </h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Open your PDF in any viewer and try to select text with your
                  cursor. If you can highlight and copy text, this tool will work
                  perfectly. If not, the PDF is likely a scanned image.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">
                  Text-based PDFs give the best results
                </h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Documents created digitally (Word exports, generated reports,
                  etc.) contain embedded text and will produce clean, accurate
                  extractions every time.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">
                  Complex layouts may need AI extraction
                </h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Multi-column layouts, tables, headers/footers, and sidebars
                  can result in jumbled text order. For structured extraction
                  from complex PDFs, use Parsli AI.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">
                  Password-protected PDFs need to be unlocked first
                </h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  If your PDF requires a password to open, you&apos;ll need to
                  remove the protection first before extracting text.
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

      {/* 9. SEO Content */}
      <section className="py-16 sm:py-20 bg-muted/30 border-t">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-xl sm:text-2xl font-bold mb-4">
            How to Extract Text from PDF for Free
          </h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            Extracting text from PDF files is one of the most common document
            tasks. Whether you need to pull content from a contract for review,
            extract text from a research paper for citing, or convert a PDF
            report into editable text, a reliable PDF to text converter saves
            hours of manual copying and pasting.
          </p>
          <p className="text-muted-foreground leading-relaxed mb-4">
            Most online converters require you to upload your files to their
            servers, create an account, or pay for a subscription. This tool is
            different &mdash; it runs entirely in your browser using pdf.js.
            Your PDF is processed on your own device and never sent anywhere.
            It&apos;s completely free, with no limits on the number of
            conversions.
          </p>

          <h2 className="text-xl sm:text-2xl font-bold mt-10 mb-4">
            When Do You Need AI-Powered PDF Extraction?
          </h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            This free tool extracts raw text from text-based PDFs. But
            real-world documents are often more complex &mdash; scanned papers,
            multi-column layouts, tables, or specific data fields you need
            pulled out. That&apos;s where AI-powered extraction comes in.
          </p>
          <p className="text-muted-foreground leading-relaxed mb-4">
            Parsli uses Google&apos;s Gemini AI to understand the full context
            of your documents. You define a schema &mdash; the exact fields you
            want extracted &mdash; and the AI pulls structured data from any
            document type, including scanned images, handwritten forms, and
            complex layouts. The extracted data flows automatically to Google
            Sheets, Zapier, Make, webhooks, or your own API.
          </p>

          <h2 className="text-xl sm:text-2xl font-bold mt-10 mb-4">
            PDF to Text: Free Tool vs AI Extraction
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
                  ["Preserves structure", "Basic", "Advanced"],
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
            Works everywhere &mdash; no install needed
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
            Stop copying text from PDFs one block at a time.
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
              { href: "/tools/pdf-to-excel", label: "PDF to Excel" },
              { href: "/tools/image-to-text", label: "Image to Text (OCR)" },
              { href: "/tools/screenshot-to-text", label: "Screenshot to Text" },
              { href: "/tools/photo-to-text", label: "Photo to Text" },
              { href: "/solutions/pdf-data-extraction", label: "PDF Data Extraction" },
              { href: "/use-cases/pdf-data-extraction", label: "PDF Extraction Use Case" },
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
