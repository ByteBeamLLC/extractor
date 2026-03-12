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
  Image as ImageIcon,
  ScanText,
  Languages,
  Briefcase,
} from "lucide-react"
import { ImageToTextTool } from "@/components/tools/ImageToTextTool"
import { AuthButton } from "@/components/marketing/shared/AuthButton"
import { Button } from "@/components/ui/button"
import { JsonLd } from "@/components/marketing/shared/JsonLd"
import { breadcrumbJsonLd } from "@/lib/seo/json-ld"

export const metadata: Metadata = {
  title: "Image to Text (OCR) — Free, Instant, No Sign-Up | Parsli",
  description:
    "Extract text from images instantly using OCR in your browser. Free, no sign-up, no file uploads to servers. Supports JPG, PNG, GIF, BMP, WebP and 12 languages.",
  keywords: [
    "image to text",
    "ocr online free",
    "image to text converter",
    "extract text from image",
    "ocr free",
    "image ocr",
    "picture to text",
    "text from image",
    "ocr online",
    "image text extractor",
  ],
  alternates: {
    canonical: "https://parsli.co/tools/image-to-text",
  },
  openGraph: {
    title: "Image to Text (OCR) — Free, Instant, No Sign-Up",
    description:
      "Extract text from images instantly using OCR in your browser. Free forever, no sign-up required, your data never leaves your device.",
    url: "https://parsli.co/tools/image-to-text",
  },
}

const features = [
  {
    icon: Shield,
    title: "Private & secure",
    description:
      "Your image is processed entirely in your browser. Files never leave your device.",
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
      "No limits, no watermarks, no paywalls. Extract text from as many images as you want.",
  },
]

const steps = [
  {
    icon: Upload,
    title: "Upload your image",
    description:
      "Drag and drop your image or click to browse. Supports JPG, PNG, GIF, BMP, and WebP.",
  },
  {
    icon: ScanText,
    title: "OCR extracts text",
    description:
      "The tool uses optical character recognition to detect and extract all text from your image.",
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
    title: "Office Workers",
    description:
      "Extract text from scanned documents, business cards, and printed materials without retyping.",
  },
  {
    icon: Users,
    title: "Content Creators",
    description:
      "Grab text from images, infographics, and social media screenshots for repurposing.",
  },
  {
    icon: GraduationCap,
    title: "Students & Researchers",
    description:
      "Digitize notes from textbook photos, whiteboards, and lecture slides instantly.",
  },
  {
    icon: Building2,
    title: "Small Businesses",
    description:
      "Convert printed invoices, receipts, and labels into editable digital text.",
  },
]

const faqs = [
  {
    q: "Is this OCR tool really free?",
    a: "Yes, completely free with no limits. There are no hidden charges, no watermarks, and no sign-up required. We built this as a free utility for the community.",
  },
  {
    q: "Do you store or upload my images?",
    a: "No. Your image is processed entirely in your browser using JavaScript and Tesseract.js. The file never leaves your device and is never sent to any server. Your data stays 100% private.",
  },
  {
    q: "What image formats are supported?",
    a: "JPG/JPEG, PNG, GIF, BMP, and WebP. For best OCR results, use high-resolution images with clear, well-lit text.",
  },
  {
    q: "What languages does the OCR support?",
    a: "12 languages: English, Arabic, French, German, Spanish, Italian, Portuguese, Russian, Chinese (Simplified & Traditional), Japanese, and Korean. Select the language before uploading your image.",
  },
  {
    q: "How accurate is the text extraction?",
    a: "Accuracy depends on image quality. Clear, high-resolution images with printed text yield 90%+ accuracy. Handwritten text, low-resolution photos, or unusual fonts may produce lower accuracy. For complex documents, try Parsli's AI-powered extraction.",
  },
  {
    q: "Does this work with handwritten text?",
    a: "It can recognize some handwritten text, but accuracy varies widely based on handwriting clarity. For better handwriting recognition, try our dedicated Handwriting to Text tool or Parsli's AI extraction.",
  },
  {
    q: "What's the maximum file size?",
    a: "Up to 20 MB. Since everything runs in your browser, very large images may take longer to process depending on your device.",
  },
  {
    q: "What's the difference between this and Parsli?",
    a: "This free tool does basic OCR text extraction from images. Parsli is a full AI-powered document extraction platform — it handles complex layouts, multi-page documents, and lets you define custom schemas for exactly what data to extract. It also connects to Google Sheets, Zapier, Make, and 5,000+ apps automatically.",
  },
  {
    q: "Can I extract text from a PDF?",
    a: "This tool is designed for images. For PDFs, use our dedicated PDF to Text tool which extracts embedded text directly, or Parsli AI for scanned PDFs that need OCR.",
  },
  {
    q: "Can I use this on my phone?",
    a: "Yes. This tool works on iPhone, iPad, and Android devices. Open the page in your mobile browser, upload your image, and copy or download the extracted text.",
  },
]

export default function ImageToTextToolPage() {
  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", url: "https://parsli.co" },
          { name: "Tools", url: "https://parsli.co/tools" },
          {
            name: "Image to Text (OCR)",
            url: "https://parsli.co/tools/image-to-text",
          },
        ])}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          name: "Parsli Image to Text OCR",
          description:
            "Free browser-based OCR tool to extract text from images. Supports 12 languages. No sign-up required.",
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
            <ScanText className="h-4 w-4 text-primary" />
            Image to Text (OCR)
          </div>

          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight leading-[1.1] mb-4">
            Extract Text from Images
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-3">
            Free OCR — instant, no sign-up
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

          <ImageToTextTool />

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
                Need OCR at scale via API?
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                Integrate AI-powered document extraction into your workflow.
                Batch-process hundreds of images, get structured JSON output
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
            Need to extract text from PDFs?{" "}
            <Link
              href="/tools/pdf-to-text"
              className="text-primary hover:underline underline-offset-4"
            >
              PDF to Text
            </Link>{" "}
            extracts embedded text directly. For handwritten notes, try{" "}
            <Link
              href="/tools/handwriting-to-text"
              className="text-primary hover:underline underline-offset-4"
            >
              Handwriting to Text
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
            Why use this image to text converter
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
              tool works best with clear, high-resolution images of printed
              text. For complex documents, scanned PDFs, or handwritten content
              that needs high accuracy, try{" "}
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
                  Clear photos of printed text and documents
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-0.5">&#10003;</span>
                  Screenshots with readable text content
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-0.5">&#10003;</span>
                  Scanned documents and book pages
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-0.5">&#10003;</span>
                  Business cards and labels
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-0.5">&#10003;</span>
                  Signs, menus, and printed materials
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
                  Complex multi-column document layouts
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
                Tips for better OCR results
              </h3>
            </div>
            <div className="space-y-6">
              <div>
                <h4 className="font-semibold mb-2">
                  Use high-resolution images
                </h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Higher resolution means more detail for the OCR engine to work
                  with. A 300 DPI scan or a sharp photo will produce significantly
                  better results than a low-res thumbnail.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">
                  Ensure good lighting and contrast
                </h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Dark text on a light background with even lighting gives the
                  best results. Avoid shadows, glare, and uneven lighting when
                  photographing documents.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">
                  Select the correct language
                </h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  The OCR engine is optimized for specific languages. Selecting
                  the correct language before processing significantly improves
                  accuracy, especially for non-Latin scripts.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">
                  Crop to the text area
                </h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  If your image contains a lot of non-text content (graphics,
                  photos, decorative elements), cropping to just the text area
                  before uploading improves accuracy and speed.
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
            How to Extract Text from Images for Free
          </h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            Extracting text from images &mdash; known as OCR (Optical Character
            Recognition) &mdash; is one of the most common document digitization
            tasks. Whether you need to grab text from a photo of a whiteboard,
            convert a scanned receipt into editable text, or extract content from
            a screenshot, a reliable image to text converter saves you from
            tedious manual retyping.
          </p>
          <p className="text-muted-foreground leading-relaxed mb-4">
            Most online OCR tools require you to upload your files to their
            servers, create an account, or pay for a subscription. This tool is
            different &mdash; it runs entirely in your browser using Tesseract.js.
            Your image is processed on your own device and never sent anywhere.
            It&apos;s completely free, with no limits on the number of
            extractions.
          </p>

          <h2 className="text-xl sm:text-2xl font-bold mt-10 mb-4">
            When Do You Need AI-Powered OCR?
          </h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            This free OCR tool handles clear images with printed text well. But
            real-world documents are often more complex &mdash; poor lighting,
            skewed angles, mixed languages, or structured data you need
            extracted into specific fields. That&apos;s where AI-powered
            extraction comes in.
          </p>
          <p className="text-muted-foreground leading-relaxed mb-4">
            Parsli uses Google&apos;s Gemini AI to understand the full context of
            your documents. You define a schema &mdash; the exact fields you want
            extracted &mdash; and the AI pulls structured data from any document
            type, including low-quality images, handwritten forms, and complex
            layouts. The extracted data flows automatically to Google Sheets,
            Zapier, Make, webhooks, or your own API.
          </p>

          <h2 className="text-xl sm:text-2xl font-bold mt-10 mb-4">
            Image to Text: Free OCR vs AI Extraction
          </h2>
          <div className="border rounded-lg overflow-hidden mb-6">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left px-4 py-2.5 font-semibold">
                    Feature
                  </th>
                  <th className="text-left px-4 py-2.5 font-semibold">
                    Free OCR Tool
                  </th>
                  <th className="text-left px-4 py-2.5 font-semibold">
                    Parsli AI
                  </th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["Clear printed text", "Yes", "Yes"],
                  ["Handwritten text", "Basic", "Advanced"],
                  ["Custom extraction schema", "No", "Yes"],
                  ["Complex layouts", "Basic", "Advanced"],
                  ["Multi-language support", "12 languages", "50+ languages"],
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
            Stop retyping text from images by hand.
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
              { href: "/tools/pdf-to-text", label: "PDF to Text" },
              { href: "/tools/handwriting-to-text", label: "Handwriting to Text" },
              { href: "/tools/screenshot-to-text", label: "Screenshot to Text" },
              { href: "/tools/photo-to-text", label: "Photo to Text" },
              { href: "/tools/pdf-to-excel", label: "PDF to Excel" },
              { href: "/solutions/ai-ocr", label: "AI OCR Solution" },
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
