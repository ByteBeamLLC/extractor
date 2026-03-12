import type { Metadata } from "next"
import Link from "next/link"
import {
  Shield,
  Zap,
  UserX,
  Upload,
  ArrowUpDown,
  Download,
  ArrowRight,
  Sparkles,
  Code2,
  Monitor,
  Smartphone,
  Tablet,
  GraduationCap,
  Briefcase,
  Palette,
  Star,
  ImageIcon,
} from "lucide-react"
import { ImageToPdfTool } from "@/components/tools/ImageToPdfTool"
import { AuthButton } from "@/components/marketing/shared/AuthButton"
import { Button } from "@/components/ui/button"
import { JsonLd } from "@/components/marketing/shared/JsonLd"
import { breadcrumbJsonLd } from "@/lib/seo/json-ld"

export const metadata: Metadata = {
  title: "Image to PDF Converter — Free Online | Parsli",
  description:
    "Convert JPG, PNG, and other images to PDF instantly in your browser. Arrange image order, combine into one PDF. Free, no sign-up, no file uploads to servers.",
  keywords: [
    "image to pdf",
    "jpg to pdf",
    "png to pdf",
    "convert image to pdf",
    "image to pdf converter",
    "photo to pdf",
    "picture to pdf",
    "image to pdf online free",
    "jpg to pdf no sign up",
    "convert images to pdf free",
  ],
  alternates: {
    canonical: "https://parsli.co/tools/image-to-pdf",
  },
  openGraph: {
    title: "Image to PDF Converter — Free Online",
    description:
      "Convert images to PDF instantly in your browser. Free forever, no sign-up required, your data never leaves your device.",
    url: "https://parsli.co/tools/image-to-pdf",
  },
}

const features = [
  {
    icon: Shield,
    title: "Private & secure",
    description:
      "Your images are processed entirely in your browser. Files never leave your device.",
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
      "No limits, no watermarks, no paywalls. Convert as many images as you want.",
  },
]

const steps = [
  {
    icon: Upload,
    title: "Upload images",
    description:
      "Drag and drop JPG, PNG, or other image files. Upload multiple images at once.",
  },
  {
    icon: ArrowUpDown,
    title: "Arrange order",
    description:
      "Drag images in the list to reorder them. Each image becomes a page in the PDF.",
  },
  {
    icon: Download,
    title: "Download PDF",
    description:
      "Click convert and download your images as a single PDF document.",
  },
]

const personas = [
  {
    icon: GraduationCap,
    title: "Students",
    description:
      "Combine photos of handwritten notes, whiteboard captures, and diagrams into organized PDF study materials.",
  },
  {
    icon: Palette,
    title: "Designers",
    description:
      "Convert design mockups, screenshots, and portfolio images into professional PDF presentations.",
  },
  {
    icon: Briefcase,
    title: "Business Users",
    description:
      "Turn receipts, business cards, and document photos into shareable PDF files for records and reimbursements.",
  },
  {
    icon: Star,
    title: "Freelancers",
    description:
      "Package project screenshots, invoices, and deliverable previews into clean PDF documents for clients.",
  },
]

const faqs = [
  {
    q: "Is this image to PDF converter really free?",
    a: "Yes, completely free with no limits. There are no hidden charges, no watermarks, and no sign-up required. We built this as a free utility for the community.",
  },
  {
    q: "Do you store or upload my images?",
    a: "No. Your images are processed entirely in your browser using JavaScript. The files never leave your device and are never sent to any server. Your data stays 100% private.",
  },
  {
    q: "What image formats are supported?",
    a: "This tool supports JPG/JPEG, PNG, WebP, BMP, and GIF image formats. Most common image types from cameras, screenshots, and design tools are supported.",
  },
  {
    q: "Can I convert multiple images into one PDF?",
    a: "Yes. Upload as many images as you want and they will be combined into a single PDF document. Each image becomes one page. You can drag to reorder them before converting.",
  },
  {
    q: "Will my images lose quality?",
    a: "No. Images are embedded into the PDF at their original resolution. There is no re-compression or quality loss during the conversion process.",
  },
  {
    q: "Can I change the page order?",
    a: "Yes. After uploading your images, you can drag and drop them in the list to set the exact order you want. The final PDF will follow the order you set.",
  },
  {
    q: "What's the difference between this and Parsli?",
    a: "This free tool converts images to PDF. Parsli is a full AI-powered document extraction platform — it extracts structured data from images and documents, and connects to Google Sheets, Zapier, Make, and 5,000+ apps.",
  },
  {
    q: "Can I convert images to PDF on my phone?",
    a: "Yes. This tool works on iPhone, iPad, and Android devices. Open the page in your mobile browser, upload your photos, arrange the order, and download the PDF.",
  },
]

export default function ImageToPdfPage() {
  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", url: "https://parsli.co" },
          { name: "Tools", url: "https://parsli.co/tools" },
          {
            name: "Image to PDF",
            url: "https://parsli.co/tools/image-to-pdf",
          },
        ])}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          name: "Parsli Image to PDF Converter",
          description:
            "Free browser-based tool to convert JPG, PNG, and other images to PDF. No sign-up required.",
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
            <ImageIcon className="h-4 w-4 text-primary" />
            Image to PDF
          </div>

          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight leading-[1.1] mb-4">
            Convert Images to PDF
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

          <ImageToPdfTool />

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
                Want to extract text from images via API?
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                Integrate AI-powered document extraction into your workflow.
                Build automations, batch-process hundreds of images, and get
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
              href="/tools/pdf-rotate"
              className="text-primary hover:underline underline-offset-4"
            >
              Rotate PDF pages
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
            Why use this image to PDF converter
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
              tool converts images to PDF by embedding them at full resolution.
              It does not perform OCR or text extraction. For AI-powered text
              extraction from images, try{" "}
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

      {/* 6. Educational Content */}
      <section className="py-16 sm:py-20 bg-muted/30">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-xl sm:text-2xl font-bold mb-4">
            Works great with
          </h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            Convert your images to PDF, then use our other tools to refine the
            result. Combine this with our{" "}
            <Link
              href="/tools/pdf-merger"
              className="text-primary hover:underline underline-offset-4"
            >
              PDF Merger
            </Link>{" "}
            to combine image PDFs with other documents, or use our{" "}
            <Link
              href="/tools/pdf-compressor"
              className="text-primary hover:underline underline-offset-4"
            >
              PDF Compressor
            </Link>{" "}
            to reduce the final file size for sharing.
          </p>

          <h2 className="text-xl sm:text-2xl font-bold mt-10 mb-4">
            Try Parsli AI for image data extraction
          </h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            Need to extract text or data from your images — not just convert
            them to PDF? Parsli uses Google&apos;s Gemini AI to pull structured
            data from photos of receipts, invoices, handwritten notes, and any
            document type. Define a custom schema, and the AI extracts exactly
            the fields you need.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            Extracted data flows automatically to Google Sheets, Zapier, Make,
            webhooks, or your own API. No coding required.
          </p>
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
            How to Convert Images to PDF for Free
          </h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            Converting images to PDF is essential for organizing photos,
            creating shareable documents from screenshots, and packaging
            visual content into a professional format. Whether you need to
            convert a single JPG or combine dozens of PNGs, a reliable
            converter makes it effortless.
          </p>
          <p className="text-muted-foreground leading-relaxed mb-4">
            Most online image-to-PDF converters upload your files to remote
            servers or require an account. This tool is different — it runs
            entirely in your browser. Your images are processed on your device
            and never sent anywhere. It&apos;s completely free, with no limits
            on the number of conversions.
          </p>

          <h2 className="text-xl sm:text-2xl font-bold mt-10 mb-4">
            Image to PDF: Free Tool vs AI Extraction
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
                  ["Convert images to PDF", "Yes", "N/A"],
                  ["Extract data from images", "No", "Yes"],
                  ["OCR / text recognition", "No", "Yes"],
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
            Stop emailing loose images when you need a single document.
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
              { href: "/tools/pdf-merger", label: "PDF Merger" },
              { href: "/tools/pdf-splitter", label: "PDF Splitter" },
              { href: "/tools/pdf-compressor", label: "PDF Compressor" },
              { href: "/tools/pdf-rotate", label: "PDF Rotator" },
              { href: "/tools/pdf-page-remover", label: "PDF Page Remover" },
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
