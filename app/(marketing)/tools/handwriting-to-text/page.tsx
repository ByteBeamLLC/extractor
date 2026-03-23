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
} from "lucide-react"
import { HandwritingToTextTool } from "@/components/tools/HandwritingToTextTool"
import { AuthButton } from "@/components/marketing/shared/AuthButton"
import { Button } from "@/components/ui/button"
import { JsonLd } from "@/components/marketing/shared/JsonLd"
import { breadcrumbJsonLd } from "@/lib/seo/json-ld"

export const metadata: Metadata = {
  title: "Handwriting to Text Converter — Free AI-Powered, No Sign-Up | Parsli",
  description:
    "Convert handwritten notes to digital text instantly using AI-powered recognition. Free, no sign-up required. Upload a photo of your handwriting and extract text with Gemini AI.",
  keywords: [
    "handwriting to text",
    "handwriting to text converter",
    "handwriting recognition",
    "handwriting ocr",
    "convert handwriting to text",
    "handwritten notes to text",
    "handwriting scanner",
    "handwriting to digital text",
    "handwriting reader",
    "handwriting to text free",
  ],
  alternates: {
    canonical: "https://parsli.co/tools/handwriting-to-text",
  },
  openGraph: {
    title: "Handwriting to Text Converter — Free AI-Powered, No Sign-Up",
    description:
      "Convert handwritten notes to digital text instantly using Gemini AI. Free forever, no sign-up required.",
    url: "https://parsli.co/tools/handwriting-to-text",
  },
}

const features = [
  {
    icon: Sparkles,
    title: "AI-powered accuracy",
    description:
      "Powered by Google Gemini AI for superior handwriting recognition, including cursive and messy notes.",
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
      "No limits, no watermarks, no paywalls. Convert as many handwritten notes as you want.",
  },
]

const steps = [
  {
    icon: Upload,
    title: "Upload a photo",
    description:
      "Take a photo of your handwritten notes or drag and drop an image. Supports JPG, PNG, and more.",
  },
  {
    icon: ScanText,
    title: "AI recognizes text",
    description:
      "Google Gemini AI analyzes your image and accurately converts handwriting to digital text.",
  },
  {
    icon: Download,
    title: "Copy or download",
    description:
      "Copy the recognized text to your clipboard or download it as a .txt file.",
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
            Convert Handwriting to Text
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-3">
            AI-powered &mdash; instant, no sign-up
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
            Working with printed text instead?{" "}
            <Link
              href="/tools/image-to-text"
              className="text-primary hover:underline underline-offset-4"
            >
              Image to Text (OCR)
            </Link>{" "}
            handles printed content. For photos, try{" "}
            <Link
              href="/tools/photo-to-text"
              className="text-primary hover:underline underline-offset-4"
            >
              Photo to Text
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
            Why use this handwriting converter
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
                  Print and cursive handwriting
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-0.5">&#10003;</span>
                  Photos of notes, lists, and journals
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-0.5">&#10003;</span>
                  Whiteboard writing with dark markers
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-0.5">&#10003;</span>
                  Messy or fast handwriting
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-0.5">&#10003;</span>
                  100+ languages, auto-detected
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
            How to Convert Handwriting to Text for Free
          </h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            Converting handwritten notes to digital text is essential for
            students, professionals, and anyone who prefers writing by hand but
            needs searchable, editable digital text. Whether you&apos;re
            digitizing lecture notes, converting meeting whiteboard photos, or
            archiving handwritten journals, a reliable handwriting to text
            converter saves hours of manual retyping.
          </p>
          <p className="text-muted-foreground leading-relaxed mb-4">
            Most handwriting recognition tools require app installations or
            paid subscriptions. This tool is different &mdash; it uses
            Google&apos;s Gemini AI for accurate recognition of both print and
            cursive handwriting. Just upload a photo, and the AI extracts your
            text in seconds. It&apos;s completely free, with no sign-up required.
          </p>

          <h2 className="text-xl sm:text-2xl font-bold mt-10 mb-4">
            When Do You Need Structured Data Extraction?
          </h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            This free tool converts handwriting to plain text. But if you need
            to extract specific fields — names, dates, amounts, addresses —
            from handwritten forms, that&apos;s where Parsli comes in.
          </p>
          <p className="text-muted-foreground leading-relaxed mb-4">
            Parsli lets you define custom schemas for exactly what data to
            extract. It processes stacks of documents automatically and sends
            the extracted data to Google Sheets, Zapier, Make, webhooks, or
            your own API.
          </p>

          <h2 className="text-xl sm:text-2xl font-bold mt-10 mb-4">
            Free Tool vs Parsli Platform
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
