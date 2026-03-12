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
  title: "Handwriting to Text Converter — Free OCR, No Sign-Up | Parsli",
  description:
    "Convert handwritten notes to digital text instantly using OCR in your browser. Free, no sign-up, no file uploads to servers. Upload a photo of your handwriting and extract text.",
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
    title: "Handwriting to Text Converter — Free OCR, No Sign-Up",
    description:
      "Convert handwritten notes to digital text instantly using OCR. Free forever, no sign-up required, your data never leaves your device.",
    url: "https://parsli.co/tools/handwriting-to-text",
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
    title: "OCR recognizes text",
    description:
      "The tool uses optical character recognition to detect and convert your handwriting to digital text.",
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
    q: "Do you store or upload my images?",
    a: "No. Your image is processed entirely in your browser using JavaScript and Tesseract.js. The file never leaves your device and is never sent to any server. Your data stays 100% private.",
  },
  {
    q: "How accurate is handwriting recognition?",
    a: "Accuracy depends heavily on handwriting clarity. Neat, well-spaced print handwriting works best. Cursive, messy, or very small handwriting may produce lower accuracy. For best results, use a clear photo with good lighting.",
  },
  {
    q: "What languages does it support?",
    a: "12 languages: English, Arabic, French, German, Spanish, Italian, Portuguese, Russian, Chinese (Simplified & Traditional), Japanese, and Korean. Select the language before uploading your image.",
  },
  {
    q: "What image formats are supported?",
    a: "JPG/JPEG, PNG, GIF, BMP, and WebP. For best results, use a high-resolution photo with clear, even lighting.",
  },
  {
    q: "Does this work with cursive handwriting?",
    a: "It can recognize some cursive handwriting, but accuracy is lower compared to print handwriting. The clearer and more separated the letters are, the better the recognition. For difficult handwriting, Parsli's AI-powered extraction offers significantly better accuracy.",
  },
  {
    q: "What tips improve handwriting recognition?",
    a: "Use good lighting with no shadows or glare. Hold the camera directly above the page to avoid skewing. Use dark ink on white paper. Write clearly with good spacing between words. Crop the image to just the text area.",
  },
  {
    q: "What's the difference between this and Parsli?",
    a: "This free tool does basic OCR-based handwriting recognition. Parsli is a full AI-powered document extraction platform using Google's Gemini AI — it handles messy handwriting, complex forms, and lets you define custom schemas for what data to extract. It also connects to Google Sheets, Zapier, Make, and 5,000+ apps.",
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
            "Free browser-based tool to convert handwritten notes to digital text using OCR. No sign-up required.",
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
            Free OCR &mdash; instant, no sign-up
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
                Need AI-powered handwriting recognition?
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                Parsli&apos;s AI extraction handles messy handwriting, complex
                forms, and multi-field documents. Define custom schemas and
                automate your workflow.
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
              <span className="font-medium text-foreground">Note:</span> This
              tool works best with neat, well-spaced print handwriting. For
              cursive, messy, or complex handwritten documents, try{" "}
              <Link
                href="/solutions/ai-ocr"
                className="text-primary hover:underline underline-offset-4"
              >
                Parsli AI
              </Link>{" "}
              for significantly better accuracy.
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
                  Clear print handwriting on white paper
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-0.5">&#10003;</span>
                  Well-lit photos of notes and lists
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-0.5">&#10003;</span>
                  Whiteboard writing with dark markers
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-0.5">&#10003;</span>
                  Block letters and separated characters
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-0.5">&#10003;</span>
                  High-contrast handwritten text
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
                  Cursive and messy handwriting
                </li>
                <li className="flex items-start gap-2">
                  <ArrowRight className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
                  Handwritten forms with specific fields
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
                  Batch processing stacks of handwritten documents
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
            Most handwriting recognition tools require app installations, cloud
            uploads, or paid subscriptions. This tool is different &mdash; it
            runs entirely in your browser using Tesseract.js OCR. Your image is
            processed on your own device and never sent anywhere. It&apos;s
            completely free, with no limits.
          </p>

          <h2 className="text-xl sm:text-2xl font-bold mt-10 mb-4">
            When Do You Need AI-Powered Handwriting Recognition?
          </h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            This free tool handles clear print handwriting reasonably well. But
            real-world handwriting is often messy, cursive, or mixed with
            printed text on forms. That&apos;s where AI-powered recognition
            comes in.
          </p>
          <p className="text-muted-foreground leading-relaxed mb-4">
            Parsli uses Google&apos;s Gemini AI to understand the full context
            of your documents. It can read difficult handwriting, extract
            specific fields from handwritten forms, and process stacks of
            documents automatically. The extracted data flows to Google Sheets,
            Zapier, Make, webhooks, or your own API.
          </p>

          <h2 className="text-xl sm:text-2xl font-bold mt-10 mb-4">
            Handwriting Recognition: Free OCR vs AI Extraction
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
                  ["Print handwriting", "Good", "Excellent"],
                  ["Cursive handwriting", "Basic", "Advanced"],
                  ["Form field extraction", "No", "Yes"],
                  ["Custom extraction schema", "No", "Yes"],
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
