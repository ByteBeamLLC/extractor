import type { Metadata } from "next"
import Link from "next/link"
import {
  Shield,
  Zap,
  UserX,
  Upload,
  Scissors,
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
  Briefcase,
  Lightbulb,
  Star,
} from "lucide-react"
import { PdfSplitterTool } from "@/components/tools/PdfSplitterTool"
import { AuthButton } from "@/components/marketing/shared/AuthButton"
import { Button } from "@/components/ui/button"
import { JsonLd } from "@/components/marketing/shared/JsonLd"
import { breadcrumbJsonLd } from "@/lib/seo/json-ld"

export const metadata: Metadata = {
  title: "Split PDF — Free, Instant, No Sign-Up | Parsli",
  description:
    "Split PDF files into individual pages or extract page ranges instantly in your browser. Free, no sign-up, no file uploads to servers. Download as a ZIP file.",
  keywords: [
    "split pdf",
    "pdf splitter",
    "split pdf online",
    "extract pages from pdf",
    "split pdf free",
    "pdf page extractor",
    "separate pdf pages",
    "split pdf no sign up",
    "split pdf into pages",
    "pdf splitter online free",
  ],
  alternates: {
    canonical: "https://parsli.co/tools/pdf-splitter",
  },
  openGraph: {
    title: "Split PDF — Free, Instant, No Sign-Up",
    description:
      "Split PDF files into individual pages or extract page ranges instantly. Free forever, no sign-up required, your data never leaves your device.",
    url: "https://parsli.co/tools/pdf-splitter",
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
      "No limits, no watermarks, no paywalls. Split as many PDFs as you want.",
  },
]

const steps = [
  {
    icon: Upload,
    title: "Upload your PDF",
    description:
      "Drag and drop your PDF or click to browse. Up to 50 MB.",
  },
  {
    icon: Scissors,
    title: "Choose split mode",
    description:
      "Split all pages into individual PDFs or extract a specific page range.",
  },
  {
    icon: Download,
    title: "Download ZIP",
    description:
      "Get all split pages as a neat ZIP file. One click, done.",
  },
]

const personas = [
  {
    icon: Briefcase,
    title: "Professionals",
    description:
      "Extract specific pages from contracts, proposals, and reports for sharing.",
  },
  {
    icon: Users,
    title: "HR & Admin",
    description:
      "Separate multi-page documents into individual forms, applications, or records.",
  },
  {
    icon: GraduationCap,
    title: "Students & Educators",
    description:
      "Pull specific chapters or pages from textbooks and study materials.",
  },
  {
    icon: Building2,
    title: "Legal Teams",
    description:
      "Extract exhibits, clauses, or specific sections from lengthy contracts.",
  },
]

const faqs = [
  {
    q: "Is this PDF splitter really free?",
    a: "Yes, completely free with no limits. There are no hidden charges, no watermarks, and no sign-up required.",
  },
  {
    q: "Do you store or upload my PDF files?",
    a: "No. Your PDF is processed entirely in your browser using JavaScript. The file never leaves your device and is never sent to any server.",
  },
  {
    q: "What split modes are available?",
    a: "Two modes: split every page into a separate PDF, or extract a specific page range (e.g., pages 3 to 7) as a single PDF. Both are downloaded as a ZIP file.",
  },
  {
    q: "What format is the output?",
    a: "You get a ZIP file containing individual PDF files — one per page (split all) or one PDF for the range you selected.",
  },
  {
    q: "Will splitting affect the quality?",
    a: "No. Pages are copied directly from the source PDF without re-encoding. All text, images, and formatting are preserved exactly.",
  },
  {
    q: "Does this work with scanned PDFs?",
    a: "Yes. The splitter works with any valid PDF file, whether it contains text or scanned images. It simply separates the pages.",
  },
  {
    q: "What's the difference between this and Parsli?",
    a: "This free tool splits PDF files into pages. Parsli is a full AI-powered document extraction platform — it extracts structured data from documents and connects to Google Sheets, Zapier, Make, and 5,000+ apps.",
  },
  {
    q: "Can I split a PDF on my phone?",
    a: "Yes. This tool works on iPhone, iPad, and Android devices. Open the page in your mobile browser, upload your PDF, and download the ZIP file.",
  },
  {
    q: "What file size limit is there?",
    a: "Up to 50 MB. Since everything runs in your browser, very large files may take longer to process depending on your device.",
  },
  {
    q: "Can I split a PDF without installing software?",
    a: "Yes. Just open this page, upload your PDF, choose your split mode, and download. No software to install, no account to create.",
  },
]

export default function PdfSplitterPage() {
  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", url: "https://parsli.co" },
          { name: "Tools", url: "https://parsli.co/tools" },
          {
            name: "PDF Splitter",
            url: "https://parsli.co/tools/pdf-splitter",
          },
        ])}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          name: "Parsli PDF Splitter",
          description:
            "Free browser-based tool to split PDF files into individual pages or page ranges. No sign-up required.",
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
            <Scissors className="h-4 w-4 text-primary" />
            PDF Splitter
          </div>

          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight leading-[1.1] mb-4">
            Split PDF Pages
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

          <PdfSplitterTool />

          <p className="mt-6 text-xs text-muted-foreground">
            100% client-side processing &middot; No data sent to any server
            &middot; Unlimited splits
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
                Want to extract data from PDFs via API?
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

      {/* 3. Cross-Sell Links */}
      <section className="pb-10 sm:pb-12">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <p className="text-sm text-muted-foreground text-center leading-relaxed">
            Need more PDF tools?{" "}
            <Link
              href="/tools/pdf-merger"
              className="text-primary hover:underline underline-offset-4"
            >
              Merge PDFs
            </Link>
            ,{" "}
            <Link
              href="/tools/pdf-compressor"
              className="text-primary hover:underline underline-offset-4"
            >
              Compress PDFs
            </Link>
            , or{" "}
            <Link
              href="/tools/pdf-page-remover"
              className="text-primary hover:underline underline-offset-4"
            >
              Remove PDF pages
            </Link>
            . Or extract data with{" "}
            <Link
              href="/tools/pdf-to-excel"
              className="text-primary hover:underline underline-offset-4"
            >
              PDF to Excel
            </Link>
            .
          </p>
        </div>
      </section>

      {/* 4. Why Use This Tool */}
      <section className="py-16 sm:py-20 bg-muted/30">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-12">
            Why use this PDF splitter
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
              tool splits standard PDF files by page. It does not extract text
              or data — for that, try{" "}
              <Link
                href="/tools/pdf-to-excel"
                className="text-primary hover:underline underline-offset-4"
              >
                PDF to Excel
              </Link>{" "}
              or{" "}
              <Link
                href="/"
                className="text-primary hover:underline underline-offset-4"
              >
                Parsli AI
              </Link>
              .
            </p>
          </div>
        </div>
      </section>

      {/* 6. Perfect For */}
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

      {/* 7. FAQ */}
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

      {/* 8. SEO Comparison Table */}
      <section className="py-16 sm:py-20 bg-muted/30 border-t">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-xl sm:text-2xl font-bold mb-4">
            How to Split a PDF for Free
          </h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            Splitting PDF files is essential when you need to extract specific
            pages or break a large document into smaller parts. Whether you need
            to send only certain pages to a colleague or archive individual
            sections, a reliable PDF splitter gets it done fast.
          </p>
          <p className="text-muted-foreground leading-relaxed mb-4">
            Most online PDF splitters require you to upload files to their
            servers. This tool is different — it runs entirely in your browser.
            Your PDF is processed on your device and never sent anywhere.
            It&apos;s completely free, with no limits.
          </p>

          <h2 className="text-xl sm:text-2xl font-bold mt-10 mb-4">
            When Do You Need AI-Powered PDF Processing?
          </h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            This free splitter separates PDF pages. But if you need to extract
            data from those pages — parse tables, read invoice fields, or pull
            structured data — that&apos;s where AI-powered extraction comes in.
          </p>
          <p className="text-muted-foreground leading-relaxed mb-4">
            Parsli uses Google&apos;s Gemini AI to understand the full context
            of your documents. Define a schema, and the AI extracts structured
            data from any document type, including scanned images and complex
            layouts.
          </p>

          <h2 className="text-xl sm:text-2xl font-bold mt-10 mb-4">
            PDF Splitter: Free Tool vs AI Extraction
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
                  ["Split PDF pages", "Yes", "N/A"],
                  ["Extract data from PDFs", "No", "Yes"],
                  ["Scanned PDFs / images", "No", "Yes"],
                  ["Custom extraction schema", "No", "Yes"],
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

      {/* 9. Works Everywhere */}
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

      {/* 10. Final CTA */}
      <section className="py-16 sm:py-20 bg-muted/30 border-t">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 text-primary mb-6">
            <Sparkles className="h-7 w-7" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold mb-4">
            Stop sending entire documents when you only need a few pages.
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

      {/* 11. Related Links */}
      <section className="py-12 sm:py-16 border-t">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-lg font-semibold mb-6">Related Resources</h2>
          <div className="flex flex-wrap gap-3">
            {[
              { href: "/tools/pdf-merger", label: "PDF Merger" },
              { href: "/tools/pdf-compressor", label: "PDF Compressor" },
              { href: "/tools/pdf-rotate", label: "PDF Rotator" },
              { href: "/tools/pdf-page-remover", label: "PDF Page Remover" },
              { href: "/tools/image-to-pdf", label: "Image to PDF" },
              { href: "/tools/pdf-to-excel", label: "PDF to Excel" },
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
