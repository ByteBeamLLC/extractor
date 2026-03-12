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
  MonitorSmartphone,
  ScanText,
  Briefcase,
} from "lucide-react"
import { ScreenshotToTextTool } from "@/components/tools/ScreenshotToTextTool"
import { AuthButton } from "@/components/marketing/shared/AuthButton"
import { Button } from "@/components/ui/button"
import { JsonLd } from "@/components/marketing/shared/JsonLd"
import { breadcrumbJsonLd } from "@/lib/seo/json-ld"

export const metadata: Metadata = {
  title: "Screenshot to Text — Free OCR, Instant, No Sign-Up | Parsli",
  description:
    "Extract text from screenshots instantly using OCR in your browser. Free, no sign-up, no file uploads to servers. Copy text from any screenshot in seconds.",
  keywords: [
    "screenshot to text",
    "screenshot to text converter",
    "extract text from screenshot",
    "copy text from screenshot",
    "screenshot ocr",
    "screenshot text extractor",
    "screenshot to text online",
    "screenshot to text free",
    "grab text from screenshot",
    "screenshot text reader",
  ],
  alternates: {
    canonical: "https://parsli.co/tools/screenshot-to-text",
  },
  openGraph: {
    title: "Screenshot to Text — Free OCR, Instant, No Sign-Up",
    description:
      "Extract text from screenshots instantly using OCR in your browser. Free forever, no sign-up required, your data never leaves your device.",
    url: "https://parsli.co/tools/screenshot-to-text",
  },
}

const features = [
  {
    icon: Shield,
    title: "Private & secure",
    description:
      "Your screenshot is processed entirely in your browser. Files never leave your device.",
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
      "No limits, no watermarks, no paywalls. Extract text from as many screenshots as you want.",
  },
]

const steps = [
  {
    icon: Upload,
    title: "Upload your screenshot",
    description:
      "Drag and drop your screenshot or click to browse. Paste from clipboard works too.",
  },
  {
    icon: ScanText,
    title: "OCR extracts text",
    description:
      "The tool uses optical character recognition to detect and extract all text from your screenshot.",
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
    title: "Developers & IT",
    description:
      "Extract error messages, log output, and code snippets from screenshots for debugging and documentation.",
  },
  {
    icon: Users,
    title: "Customer Support",
    description:
      "Pull text from customer screenshots to quickly understand and resolve issues without retyping.",
  },
  {
    icon: GraduationCap,
    title: "Students & Researchers",
    description:
      "Grab text from online lecture slides, web pages, and application windows for notes and citations.",
  },
  {
    icon: Building2,
    title: "Marketing & Sales",
    description:
      "Extract competitor pricing, ad copy, and content from screenshots for analysis and reporting.",
  },
]

const faqs = [
  {
    q: "Is this screenshot to text tool free?",
    a: "Yes, completely free with no limits. There are no hidden charges, no watermarks, and no sign-up required. We built this as a free utility for the community.",
  },
  {
    q: "Do you store or upload my screenshots?",
    a: "No. Your screenshot is processed entirely in your browser using JavaScript and Tesseract.js. The file never leaves your device and is never sent to any server. Your data stays 100% private.",
  },
  {
    q: "What image formats are supported?",
    a: "JPG/JPEG, PNG, GIF, BMP, and WebP. Most screenshots are saved as PNG, which works perfectly with this tool.",
  },
  {
    q: "How accurate is the text extraction?",
    a: "Very accurate for screenshots with clear, rendered text. Since screenshots contain digitally-rendered text (not handwritten or printed), OCR accuracy is typically 95%+ for standard fonts and sizes.",
  },
  {
    q: "Can I extract text from a screenshot of a website?",
    a: "Yes. Website screenshots with standard text typically produce very accurate results. The tool handles various font sizes, colors, and backgrounds well.",
  },
  {
    q: "Can I extract text from a screenshot of code?",
    a: "Yes. Code screenshots with monospace fonts are recognized well. The tool preserves spacing and indentation in most cases.",
  },
  {
    q: "What about screenshots with small text?",
    a: "Smaller text may reduce accuracy. For best results, take screenshots at full resolution or zoom in on the text area before screenshotting. Higher resolution always produces better OCR results.",
  },
  {
    q: "What's the difference between this and Parsli?",
    a: "This free tool does basic OCR text extraction from screenshots. Parsli is a full AI-powered document extraction platform — it handles complex layouts, structured data, and lets you define custom schemas. It connects to Google Sheets, Zapier, Make, and 5,000+ apps automatically.",
  },
  {
    q: "Can I extract text from a screenshot on my phone?",
    a: "Yes. This tool works on iPhone, iPad, and Android devices. Take a screenshot on your phone, open this page in your browser, and upload it to extract the text.",
  },
  {
    q: "Why not just copy and paste the text directly?",
    a: "Sometimes you can't — text might be in an image, a locked application, a PDF viewer that doesn't allow copying, a video frame, or someone else's screenshot. This tool lets you extract text from any visual content.",
  },
]

export default function ScreenshotToTextToolPage() {
  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", url: "https://parsli.co" },
          { name: "Tools", url: "https://parsli.co/tools" },
          {
            name: "Screenshot to Text",
            url: "https://parsli.co/tools/screenshot-to-text",
          },
        ])}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          name: "Parsli Screenshot to Text",
          description:
            "Free browser-based tool to extract text from screenshots using OCR. No sign-up required.",
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
            <MonitorSmartphone className="h-4 w-4 text-primary" />
            Screenshot to Text
          </div>

          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight leading-[1.1] mb-4">
            Extract Text from Screenshots
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

          <ScreenshotToTextTool />

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
                Need to extract data from documents via API?
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
            Working with photos instead of screenshots?{" "}
            <Link
              href="/tools/photo-to-text"
              className="text-primary hover:underline underline-offset-4"
            >
              Photo to Text
            </Link>{" "}
            is optimized for camera photos. For PDFs, try{" "}
            <Link
              href="/tools/pdf-to-text"
              className="text-primary hover:underline underline-offset-4"
            >
              PDF to Text
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
            Why use this screenshot to text tool
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
              <span className="font-medium text-foreground">Tip:</span>{" "}
              Screenshots with digitally-rendered text produce the most accurate
              results. For photos of printed or handwritten text, try{" "}
              <Link
                href="/tools/image-to-text"
                className="text-primary hover:underline underline-offset-4"
              >
                Image to Text
              </Link>{" "}
              or{" "}
              <Link
                href="/tools/handwriting-to-text"
                className="text-primary hover:underline underline-offset-4"
              >
                Handwriting to Text
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
                  Website and application screenshots
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-0.5">&#10003;</span>
                  Error messages and log output
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-0.5">&#10003;</span>
                  Chat and email screenshots
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-0.5">&#10003;</span>
                  Social media posts and comments
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-0.5">&#10003;</span>
                  Code snippets and terminal output
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
                  Structured data extraction from screenshots
                </li>
                <li className="flex items-start gap-2">
                  <ArrowRight className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
                  Complex multi-column layouts
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
                  Batch processing hundreds of images
                </li>
              </ul>
            </div>
          </div>

          {/* Tips */}
          <div className="mt-16 max-w-3xl mx-auto">
            <div className="flex items-center gap-2 mb-6">
              <Lightbulb className="h-5 w-5 text-primary" />
              <h3 className="text-xl font-bold">
                Tips for better screenshot text extraction
              </h3>
            </div>
            <div className="space-y-6">
              <div>
                <h4 className="font-semibold mb-2">
                  Take full-resolution screenshots
                </h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Avoid resizing or compressing your screenshots before uploading.
                  Full-resolution images preserve text clarity and produce more
                  accurate OCR results.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">
                  Crop to the relevant area
                </h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  If your screenshot contains navigation bars, ads, or other
                  non-text elements, cropping to just the text area before
                  uploading improves accuracy and reduces noise in the output.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">
                  Standard fonts work best
                </h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Screenshots with standard web and system fonts produce the most
                  accurate results. Highly stylized, decorative, or very small
                  fonts may be harder to recognize.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">
                  Select the right language
                </h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  If your screenshot contains text in a non-English language,
                  select the correct language from the dropdown before uploading
                  for significantly better accuracy.
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
            How to Extract Text from Screenshots for Free
          </h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            Extracting text from screenshots is a common need for developers,
            support teams, students, and professionals. Whether you need to copy
            an error message from a screenshot, grab text from a locked
            application, or extract content from a social media post, a
            screenshot to text tool eliminates the need for manual retyping.
          </p>
          <p className="text-muted-foreground leading-relaxed mb-4">
            Most online OCR tools require uploads to external servers, account
            creation, or paid subscriptions. This tool is different &mdash; it
            runs entirely in your browser using Tesseract.js. Your screenshot is
            processed on your own device and never sent anywhere. It&apos;s
            completely free, with no limits.
          </p>

          <h2 className="text-xl sm:text-2xl font-bold mt-10 mb-4">
            When Do You Need AI-Powered Extraction?
          </h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            This free tool handles most screenshots with clear, rendered text.
            But when you need to extract structured data, process screenshots
            at scale, or handle complex layouts with tables and forms,
            AI-powered extraction is the way to go.
          </p>
          <p className="text-muted-foreground leading-relaxed mb-4">
            Parsli uses Google&apos;s Gemini AI to understand the full context
            of your documents. You define a schema &mdash; the exact fields you
            want extracted &mdash; and the AI pulls structured data from any
            image type. The extracted data flows automatically to Google Sheets,
            Zapier, Make, webhooks, or your own API.
          </p>

          <h2 className="text-xl sm:text-2xl font-bold mt-10 mb-4">
            Screenshot to Text: Free OCR vs AI Extraction
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
                  ["Screenshot text", "Yes", "Yes"],
                  ["Structured data extraction", "No", "Yes"],
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
            Stop retyping text from screenshots.
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
              { href: "/tools/handwriting-to-text", label: "Handwriting to Text" },
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
