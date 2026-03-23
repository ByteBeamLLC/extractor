import type { Metadata } from "next"
import Link from "next/link"
import {
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
  PenLine,
  ScanText,
  Briefcase,
  Globe,
  ShieldCheck,
  Quote,
  BookOpen,
} from "lucide-react"
import { HandwritingToTextTool } from "@/components/tools/HandwritingToTextTool"
import { ToolPageTracker } from "@/components/tools/ToolPageTracker"
import { AuthButton } from "@/components/marketing/shared/AuthButton"
import { Button } from "@/components/ui/button"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { JsonLd } from "@/components/marketing/shared/JsonLd"
import { breadcrumbJsonLd } from "@/lib/seo/json-ld"

export const metadata: Metadata = {
  title: "Handwriting to Text Converter Online Free — AI-Powered | Parsli",
  description:
    "Convert handwriting to text instantly with AI. Upload a photo, scan handwritten notes, cursive, or messy writing — get editable text in seconds. 100% free, no sign-up.",
  keywords: [
    "handwriting to text",
    "handwriting to text converter",
    "convert handwriting to text",
    "scan handwriting to text",
    "handwriting recognition online",
    "handwriting ocr",
    "cursive ocr",
    "handwritten notes to text",
    "handwriting extraction",
    "handwriting to text converter online free",
    "handwriting reader",
    "turn handwriting into text",
    "handwriting to text ai",
    "handwritten to text converter",
    "transcribe handwriting to text",
  ],
  alternates: {
    canonical: "https://parsli.co/tools/handwriting-to-text",
  },
  openGraph: {
    title: "Handwriting to Text Converter — Free AI-Powered, No Sign-Up",
    description:
      "Convert handwriting to text instantly with AI. Scan handwritten notes, cursive, or messy writing. Free, no sign-up.",
    url: "https://parsli.co/tools/handwriting-to-text",
  },
}

const features = [
  {
    icon: Sparkles,
    title: "AI-powered handwriting recognition",
    description:
      "Powered by Google Gemini AI — not traditional OCR. Handles cursive OCR, messy notes, and handwriting extraction with context-aware accuracy.",
  },
  {
    icon: UserX,
    title: "No sign-up required",
    description:
      "Convert handwriting to text instantly in your browser. No account, no email, no app download. Just upload and go.",
  },
  {
    icon: Zap,
    title: "100% free, no limits",
    description:
      "No limits, no watermarks, no paywalls. Scan handwriting to text as many times as you need — free forever.",
  },
]

const steps = [
  {
    icon: Upload,
    title: "Upload or scan handwriting",
    description:
      "Take a photo of your handwritten notes or scan a handwritten document. Drag and drop the image or click to upload. Supports JPG, PNG, GIF, BMP, and WebP.",
  },
  {
    icon: ScanText,
    title: "AI converts handwriting to text",
    description:
      "Google Gemini AI reads your handwriting — print, cursive, or messy — and accurately transcribes it to editable digital text in seconds.",
  },
  {
    icon: Download,
    title: "Copy or download your text",
    description:
      "Copy the extracted text to your clipboard or download it as a .txt file. Use it in any document, email, or application.",
  },
]

const personas = [
  {
    icon: GraduationCap,
    title: "Students",
    description:
      "Digitize lecture notes, study materials, and handwritten assignments into searchable text.",
  },
  {
    icon: Briefcase,
    title: "Professionals",
    description:
      "Convert meeting notes, whiteboard brainstorms, and sticky notes into digital text.",
  },
  {
    icon: Users,
    title: "Writers & Journalists",
    description:
      "Transform handwritten drafts, interview notes, and journal entries into editable text.",
  },
  {
    icon: Building2,
    title: "Healthcare & Field Workers",
    description:
      "Digitize handwritten forms, patient notes, and field reports quickly.",
  },
]

const faqs = [
  {
    q: "Is this handwriting recognition tool free?",
    a: "Yes, completely free with no limits. There are no hidden charges, no watermarks, and no sign-up required. We built this as a free utility for the community.",
  },
  {
    q: "Do you store my images?",
    a: "No. Your image is sent securely to Google Gemini for processing and is never stored, logged, or used for training. It is discarded immediately after extraction.",
  },
  {
    q: "How accurate is handwriting recognition?",
    a: "Very accurate. This tool uses Google Gemini AI, which excels at reading both print and cursive handwriting. For best results, use a clear photo with good lighting and dark ink on white paper.",
  },
  {
    q: "What languages does it support?",
    a: "Gemini AI supports 100+ languages and automatically detects the language in your image. No manual language selection needed.",
  },
  {
    q: "What image formats are supported?",
    a: "JPG/JPEG, PNG, GIF, BMP, and WebP. For best results, use a high-resolution photo with clear, even lighting.",
  },
  {
    q: "Does this work with cursive handwriting?",
    a: "Yes. Gemini AI handles cursive handwriting significantly better than traditional OCR. It understands context and can interpret connected letters, making it effective for most cursive styles.",
  },
  {
    q: "What tips improve handwriting recognition?",
    a: "Use good lighting with no shadows or glare. Hold the camera directly above the page to avoid skewing. Use dark ink on white paper. Write clearly with good spacing between words. Crop the image to just the text area.",
  },
  {
    q: "What's the difference between this and Parsli?",
    a: "This free tool converts handwriting to plain text. Parsli goes further — it lets you define custom schemas to extract specific fields, process documents in bulk, and automate workflows via Google Sheets, Zapier, Make, webhooks, and API.",
  },
  {
    q: "Can I convert handwritten notes from a notebook?",
    a: "Yes. Take a clear, well-lit photo of the notebook page and upload it. For best results, flatten the page and avoid shadows from the notebook binding.",
  },
  {
    q: "Can I use this on my phone?",
    a: "Yes. This tool works on iPhone, iPad, and Android devices. You can take a photo of your handwritten notes directly from your camera and upload it right away.",
  },
  {
    q: "Can I scan handwriting and convert to text with this tool?",
    a: "Yes. Take a photo or scan your handwritten page, then upload the image. The AI reads and transcribes the handwriting to text automatically. No app download needed — it works directly in your browser.",
  },
  {
    q: "Does this work as a cursive to text converter?",
    a: "Yes. Unlike traditional OCR that struggles with connected letters, our AI-powered cursive OCR understands word shapes and context. It handles cursive, print, mixed styles, and even messy handwriting accurately.",
  },
  {
    q: "Can I convert a handwritten scanned document to text?",
    a: "Yes. Upload any scanned handwritten document — letters, forms, notes, or manuscripts. The AI extracts all readable text and lets you copy or download it. Supports JPG, PNG, GIF, BMP, and WebP formats.",
  },
  {
    q: "Is this a free handwriting to text converter with no limits?",
    a: "Yes, completely free with no usage limits, no watermarks, and no sign-up required. Convert as many handwritten pages as you need. We built this as a free community tool powered by Google Gemini AI.",
  },
]

export default function HandwritingToTextToolPage() {
  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", url: "https://parsli.co" },
          { name: "Tools", url: "https://parsli.co/tools" },
          {
            name: "Handwriting to Text",
            url: "https://parsli.co/tools/handwriting-to-text",
          },
        ])}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          name: "Parsli Handwriting to Text Converter",
          description:
            "Free AI-powered tool to convert handwritten notes to digital text using Google Gemini. No sign-up required.",
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
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "HowTo",
          name: "How to Convert Handwriting to Text Online",
          description:
            "Convert handwritten notes, cursive writing, or messy handwriting to editable digital text using AI-powered recognition.",
          step: [
            {
              "@type": "HowToStep",
              name: "Upload a photo of your handwriting",
              text: "Take a photo of your handwritten notes, letter, or form. Drag and drop the image or click to upload. Supports JPG, PNG, GIF, BMP, and WebP.",
              position: 1,
            },
            {
              "@type": "HowToStep",
              name: "AI recognizes and extracts text",
              text: "Google Gemini AI analyzes your image, recognizing both print and cursive handwriting in 100+ languages, and converts it to digital text.",
              position: 2,
            },
            {
              "@type": "HowToStep",
              name: "Copy or download your text",
              text: "Copy the extracted text to your clipboard or download it as a .txt file. Use it in any document, email, or application.",
              position: 3,
            },
          ],
          tool: {
            "@type": "HowToTool",
            name: "Parsli Handwriting to Text Converter",
          },
          totalTime: "PT30S",
        }}
      />

      <ToolPageTracker toolName="handwriting-to-text" />

      {/* 1. Hero + Tool */}
      <section className="relative pt-24 sm:pt-28 pb-16">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-primary/5 rounded-full blur-3xl" />
        </div>

        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border bg-card px-4 py-1.5 text-sm text-muted-foreground mb-6">
            <PenLine className="h-4 w-4 text-primary" />
            Handwriting to Text
          </div>

          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight leading-[1.1] mb-4">
            Handwriting to Text Converter Online
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-3">
            Scan handwriting and convert to text instantly with AI &mdash; free,
            no sign-up
          </p>

          {/* Trust signals */}
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground mb-10">
            <span className="inline-flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              Powered by Gemini AI
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Globe className="h-3.5 w-3.5 text-primary" />
              100+ languages
            </span>
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-primary" />
              Private &amp; secure
            </span>
          </div>

          <HandwritingToTextTool />

          <p className="mt-6 text-xs text-muted-foreground">
            Powered by Google Gemini AI &middot; No sign-up required
            &middot; Free conversions
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
                Need structured data extraction?
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                Parsli goes beyond plain text — define custom schemas to extract
                specific fields, process documents in bulk, and automate
                workflows with integrations.
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
            Working with printed text instead? Try our{" "}
            <Link
              href="/tools/image-to-text"
              className="text-primary hover:underline underline-offset-4"
            >
              Image to Text (OCR)
            </Link>{" "}
            tool. For photos of documents, use{" "}
            <Link
              href="/tools/photo-to-text"
              className="text-primary hover:underline underline-offset-4"
            >
              Photo to Text
            </Link>
            . Need to extract text from screenshots?{" "}
            <Link
              href="/tools/screenshot-to-text"
              className="text-primary hover:underline underline-offset-4"
            >
              Screenshot to Text
            </Link>
            . Or convert{" "}
            <Link
              href="/tools/pdf-to-text"
              className="text-primary hover:underline underline-offset-4"
            >
              PDF to Text
            </Link>
            . See how Parsli compares to{" "}
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
            Why Use Our AI Handwriting to Text Converter
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
            How to Convert Handwriting to Text
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
              <span className="font-medium text-foreground">Tip:</span> This
              tool extracts plain text. Need to extract specific fields like
              names, dates, or amounts from handwritten forms?{" "}
              <Link
                href="/solutions/ai-ocr"
                className="text-primary hover:underline underline-offset-4"
              >
                Try Parsli
              </Link>{" "}
              for structured data extraction with custom schemas.
            </p>
          </div>
        </div>
      </section>

      {/* 6. Educational Content */}
      <section className="py-16 sm:py-20 bg-muted/30">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-12">
            Scan Handwriting to Text &mdash; What This Tool Handles
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
                  Print and cursive handwriting (cursive OCR)
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-0.5">&#10003;</span>
                  Photos of handwritten notes, lists, and journals
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-0.5">&#10003;</span>
                  Scanned handwritten documents and forms
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-0.5">&#10003;</span>
                  Whiteboard writing with dark markers
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-0.5">&#10003;</span>
                  Messy, fast, or hard-to-read handwriting
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-0.5">&#10003;</span>
                  Handwritten images in 100+ languages (auto-detected)
                </li>
              </ul>
            </div>
            <div className="rounded-xl border bg-card p-6">
              <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Need more? Try Parsli
              </h3>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <ArrowRight className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
                  Extract specific fields from handwritten forms
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
                  Batch processing stacks of documents
                </li>
                <li className="flex items-start gap-2">
                  <ArrowRight className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
                  PDFs, emails, invoices, and more
                </li>
              </ul>
            </div>
          </div>

          {/* Tips */}
          <div className="mt-16 max-w-3xl mx-auto">
            <div className="flex items-center gap-2 mb-6">
              <Lightbulb className="h-5 w-5 text-primary" />
              <h3 className="text-xl font-bold">
                Tips for better handwriting recognition
              </h3>
            </div>
            <div className="space-y-6">
              <div>
                <h4 className="font-semibold mb-2">
                  Write clearly with good spacing
                </h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Print handwriting with clear separation between words and
                  letters produces the best results. Avoid overlapping characters
                  and maintain consistent letter sizes.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">
                  Use good lighting and a flat surface
                </h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Photograph your notes in bright, even lighting without shadows
                  or glare. Flatten the page on a table and hold the camera
                  directly above for the best angle.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">
                  Dark ink on white paper works best
                </h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  High contrast between the writing and background significantly
                  improves recognition accuracy. Black or dark blue ink on white
                  paper is ideal.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">
                  Crop to just the text area
                </h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  If your photo includes a lot of background, desk, or
                  non-text content, cropping to just the handwritten text area
                  before uploading improves both accuracy and processing speed.
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
            Who Uses a Handwriting to Text Converter?
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

      {/* 7b. Cursive OCR & Handwriting Recognition */}
      <section className="py-16 sm:py-20 bg-muted/30">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold mb-6">
            Cursive OCR &amp; Handwriting Recognition Online
          </h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            Traditional OCR (optical character recognition) struggles with
            cursive handwriting because connected letters blur the boundaries
            between characters. Our handwriting reader uses Google Gemini AI
            instead of traditional OCR &mdash; it understands context, word
            shapes, and natural language patterns to accurately transcribe
            handwriting to text, even when the writing is messy or heavily
            cursive.
          </p>
          <p className="text-muted-foreground leading-relaxed mb-6">
            Whether you need to convert handwritten notes from a lecture,
            translate handwriting to text from an old letter, or extract text
            from handwritten forms, this AI-powered handwriting extraction tool
            handles it. It works with any script style &mdash; print, cursive,
            mixed, or shorthand &mdash; and auto-detects 100+ languages without
            manual selection.
          </p>
          <h3 className="text-lg font-semibold mb-3">
            What makes AI better than traditional handwriting OCR?
          </h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="text-green-600 mt-0.5 shrink-0">&#10003;</span>
              <span>
                <strong className="text-foreground">Context-aware reading</strong>{" "}
                &mdash; understands words from surrounding context, not just
                isolated character shapes
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600 mt-0.5 shrink-0">&#10003;</span>
              <span>
                <strong className="text-foreground">Cursive &amp; connected letters</strong>{" "}
                &mdash; handles joined-up writing that breaks traditional OCR
                engines
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600 mt-0.5 shrink-0">&#10003;</span>
              <span>
                <strong className="text-foreground">Messy handwriting tolerance</strong>{" "}
                &mdash; reads sloppy, fast, or inconsistent handwriting far
                better than pattern-matching OCR
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600 mt-0.5 shrink-0">&#10003;</span>
              <span>
                <strong className="text-foreground">Multi-language support</strong>{" "}
                &mdash; auto-detects and transcribes handwriting in 100+
                languages, including mixed-language documents
              </span>
            </li>
          </ul>
        </div>
      </section>

      {/* 7c. Testimonials */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-12">
            What Users Say About This Handwriting Converter
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                quote:
                  "I photographed 40 pages of lecture notes and had them all in text in under 10 minutes. Way faster than retyping and surprisingly accurate on my messy cursive.",
                name: "Emily R.",
                role: "University Student",
              },
              {
                quote:
                  "We use this to digitize handwritten field inspection reports from our technicians. It handles their rushed handwriting really well — saves our office staff hours every week.",
                name: "Marcus T.",
                role: "Operations Manager",
              },
              {
                quote:
                  "I tried three other handwriting OCR tools before finding this one. It's the only one that accurately read my grandmother's old cursive letters. And it's free!",
                name: "Sarah K.",
                role: "Genealogy Researcher",
              },
            ].map((t) => (
              <div
                key={t.name}
                className="rounded-xl border bg-card p-6 flex flex-col"
              >
                <Quote className="h-5 w-5 text-primary/30 mb-3" />
                <p className="text-sm text-muted-foreground leading-relaxed flex-1 mb-4">
                  &ldquo;{t.quote}&rdquo;
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-bold">
                    {t.name[0]}
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.role}</p>
                  </div>
                  <div className="ml-auto flex gap-0.5 text-yellow-500">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-3 w-3 fill-current" />
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 8. FAQ — Accordion */}
      <section className="py-16 sm:py-20 bg-muted/30">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-12">
            Handwriting to Text &mdash; Frequently Asked Questions
          </h2>
          <Accordion type="multiple" className="space-y-3">
            {faqs.map((faq, i) => (
              <AccordionItem
                key={i}
                value={`faq-${i}`}
                className="rounded-xl border bg-card px-6 data-[state=open]:shadow-sm"
              >
                <AccordionTrigger className="text-sm font-semibold text-left py-4 hover:no-underline">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground leading-relaxed pb-4">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* 9. SEO Content */}
      <section className="py-16 sm:py-20 bg-muted/30 border-t">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-xl sm:text-2xl font-bold mb-4">
            Free Handwriting to Text Converter Online &mdash; No Sign-Up
          </h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            Converting handwritten notes to digital text is essential for
            students, professionals, and anyone who prefers writing by hand but
            needs searchable, editable digital text. Whether you need to
            scan handwriting to text from lecture notes, turn handwriting into
            text from meeting whiteboards, or convert handwritten notes from a
            journal, this free handwriting to text converter online saves hours
            of manual retyping.
          </p>
          <p className="text-muted-foreground leading-relaxed mb-4">
            Most handwriting recognition tools require app installations or
            paid subscriptions. This handwriting to text converter is
            different &mdash; it uses Google&apos;s Gemini AI for accurate
            recognition of both print and cursive handwriting, acting as
            an intelligent handwriting reader rather than a basic OCR scanner.
            Just upload a photo and the AI extracts your handwritten text in
            seconds. It&apos;s completely free, with no sign-up required.
          </p>

          <h2 className="text-xl sm:text-2xl font-bold mt-10 mb-4">
            Turn Handwritten Notes into Text &mdash; Common Use Cases
          </h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            People use our handwriting extraction tool to convert scanned
            handwriting to text from a wide range of sources: handwritten
            notes from class, meeting minutes on paper, handwritten letters,
            field inspection forms, patient intake sheets, sticky notes, and
            even drawings with annotations. If you can photograph it, this
            tool can transcribe handwriting to text from it.
          </p>
          <p className="text-muted-foreground leading-relaxed mb-4">
            The AI handles handwritten scanned documents, photos taken with a
            phone camera, screenshots of handwritten text in images, and even
            low-resolution scans. For the best results when you scan
            handwritten notes to text, use good lighting and dark ink on white
            paper.
          </p>

          <h2 className="text-xl sm:text-2xl font-bold mt-10 mb-4">
            When Do You Need Structured Handwriting Extraction?
          </h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            This free tool converts handwriting to plain text. But if you need
            to extract specific fields — names, dates, amounts, addresses —
            from handwritten forms, that&apos;s where Parsli comes in. Parsli
            goes beyond a simple handwritten to text converter: it lets you
            define custom schemas for exactly what data to extract.
          </p>
          <p className="text-muted-foreground leading-relaxed mb-4">
            Parsli processes stacks of handwritten documents automatically and
            sends the extracted data to Google Sheets, Zapier, Make, webhooks,
            or your own API &mdash; perfect for businesses that need to convert
            handwritten notes to text at scale.
          </p>

          <h2 className="text-xl sm:text-2xl font-bold mt-10 mb-4">
            Free Handwriting to Text Tool vs Parsli Platform
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
                  ["Handwriting recognition", "AI-powered", "AI-powered"],
                  ["Output format", "Plain text", "Structured JSON"],
                  ["Form field extraction", "No", "Yes"],
                  ["Custom extraction schema", "No", "Yes"],
                  ["Batch processing", "No", "Yes"],
                  ["Automated workflows", "No", "Yes"],
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

      {/* 10. Related Guides */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 mb-8">
            <BookOpen className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-bold">
              Related Guides
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              {
                href: "/guides/extract-data-from-handwritten-documents",
                title: "Extract Data from Handwritten Documents",
                desc: "Compare ICR, OCR, and AI methods for handwriting extraction at scale.",
              },
              {
                href: "/guides/extract-data-from-scanned-documents",
                title: "Extract Data from Scanned Documents",
                desc: "How OCR and AI work together to pull structured data from scans.",
              },
              {
                href: "/blog/ocr-vs-ai-document-extraction",
                title: "OCR vs AI Document Extraction",
                desc: "Why traditional OCR alone is no longer enough in 2026.",
              },
              {
                href: "/guides/extract-data-from-pdfs-without-code",
                title: "Extract Data from PDFs Without Code",
                desc: "No-code tools for structured data extraction from any PDF.",
              },
              {
                href: "/blog/best-invoice-ocr-software",
                title: "Best Invoice OCR Software (2026)",
                desc: "Honest comparison of top OCR and parsing tools.",
              },
              {
                href: "/guides/pdf-to-json-extraction",
                title: "PDF to JSON Extraction",
                desc: "Convert PDFs to structured JSON for APIs and databases.",
              },
            ].map((guide) => (
              <Link
                key={guide.href}
                href={guide.href}
                className="group rounded-xl border bg-card p-5 hover:border-primary/30 transition-colors"
              >
                <h3 className="text-sm font-semibold mb-1 group-hover:text-primary transition-colors">
                  {guide.title}
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {guide.desc}
                </p>
              </Link>
            ))}
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
            Stop transcribing handwritten notes manually.
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
              { href: "/tools/image-to-text", label: "Image to Text (OCR)" },
              { href: "/tools/photo-to-text", label: "Photo to Text" },
              { href: "/tools/screenshot-to-text", label: "Screenshot to Text" },
              { href: "/tools/pdf-to-text", label: "PDF to Text" },
              { href: "/tools/pdf-to-excel", label: "PDF to Excel" },
              { href: "/tools/invoice-parser", label: "Invoice Parser" },
              { href: "/tools/receipt-scanner", label: "Receipt Scanner" },
              { href: "/solutions/ai-ocr", label: "AI OCR Solution" },
              { href: "/use-cases/invoice-parsing", label: "Invoice Parsing" },
              { href: "/docs", label: "API Documentation" },
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
