import type { Metadata } from "next"
import Link from "next/link"
import {
  Shield,
  Zap,
  UserX,
  Upload,
  RotateCw,
  Download,
  ArrowRight,
  Sparkles,
  Code2,
  Monitor,
  Smartphone,
  Tablet,
  Users,
  GraduationCap,
  Briefcase,
  Palette,
  Star,
} from "lucide-react"
import { PdfRotateTool } from "@/components/tools/PdfRotateTool"
import { AuthButton } from "@/components/marketing/shared/AuthButton"
import { Button } from "@/components/ui/button"
import { JsonLd } from "@/components/marketing/shared/JsonLd"
import { breadcrumbJsonLd } from "@/lib/seo/json-ld"

export const metadata: Metadata = {
  title: "Rotate PDF Pages — Free Online Tool",
  description:
    "Rotate PDF pages 90, 180, or 270 degrees instantly in your browser. Free, no sign-up, no file uploads to servers. Fix upside-down or sideways PDF pages.",
  keywords: [
    "rotate pdf",
    "rotate pdf pages",
    "rotate pdf online",
    "rotate pdf free",
    "pdf rotator",
    "turn pdf pages",
    "flip pdf pages",
    "rotate pdf 90 degrees",
    "rotate pdf no sign up",
    "rotate pdf online free",
  ],
  alternates: {
    canonical: "https://parsli.co/tools/pdf-rotate",
  },
  openGraph: {
    title: "Rotate PDF Pages — Free Online Tool",
    description:
      "Rotate PDF pages instantly in your browser. Free forever, no sign-up required, your data never leaves your device.",
    url: "https://parsli.co/tools/pdf-rotate",
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
      "No limits, no watermarks, no paywalls. Rotate as many PDF pages as you want.",
  },
]

const steps = [
  {
    icon: Upload,
    title: "Upload your PDF",
    description:
      "Drag and drop your PDF file or click to browse. Up to 50 MB.",
  },
  {
    icon: RotateCw,
    title: "Choose rotation",
    description:
      "Select individual pages or all pages, then choose 90, 180, or 270 degree rotation.",
  },
  {
    icon: Download,
    title: "Download",
    description:
      "Click rotate and download your PDF with the corrected page orientations.",
  },
]

const personas = [
  {
    icon: Briefcase,
    title: "Office Workers",
    description:
      "Fix sideways scanned documents, rotated contracts, and landscape pages that need to be portrait.",
  },
  {
    icon: GraduationCap,
    title: "Students",
    description:
      "Correct orientation of scanned notes, textbook pages, and assignment submissions.",
  },
  {
    icon: Palette,
    title: "Designers",
    description:
      "Rotate portfolio pages, design proofs, and presentation slides to the correct orientation.",
  },
  {
    icon: Users,
    title: "Admin Teams",
    description:
      "Fix batches of scanned documents with mixed orientations before archiving or distributing.",
  },
]

const faqs = [
  {
    q: "Is this PDF rotator really free?",
    a: "Yes, completely free with no limits. There are no hidden charges, no watermarks, and no sign-up required. We built this as a free utility for the community.",
  },
  {
    q: "Do you store or upload my PDF files?",
    a: "No. Your PDF is processed entirely in your browser using JavaScript. The file never leaves your device and is never sent to any server. Your data stays 100% private.",
  },
  {
    q: "Can I rotate individual pages?",
    a: "Yes. After uploading your PDF, you can select specific pages to rotate or rotate all pages at once. Each page can be rotated independently by 90, 180, or 270 degrees.",
  },
  {
    q: "What rotation angles are supported?",
    a: "You can rotate pages by 90 degrees (quarter turn clockwise), 180 degrees (upside down), or 270 degrees (quarter turn counter-clockwise).",
  },
  {
    q: "Will rotating pages affect text or image quality?",
    a: "No. The tool rotates pages by adjusting their orientation metadata. Text, images, and formatting remain exactly as they are — nothing is re-rendered or re-encoded.",
  },
  {
    q: "Does this work with scanned PDFs?",
    a: "Yes. This tool works with any PDF file, including scanned documents. It rotates the entire page regardless of whether it contains text, images, or scanned content.",
  },
  {
    q: "What's the difference between this and Parsli?",
    a: "This free tool rotates PDF pages. Parsli is a full AI-powered document extraction platform — it extracts structured data from documents and connects to Google Sheets, Zapier, Make, and 5,000+ apps.",
  },
  {
    q: "Can I rotate PDF pages on my phone?",
    a: "Yes. This tool works on iPhone, iPad, and Android devices. Open the page in your mobile browser, upload your PDF, choose rotation, and download the corrected file.",
  },
]

export default function PdfRotatePage() {
  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", url: "https://parsli.co" },
          { name: "Tools", url: "https://parsli.co/tools" },
          {
            name: "PDF Rotator",
            url: "https://parsli.co/tools/pdf-rotate",
          },
        ])}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          name: "Parsli PDF Rotator",
          description:
            "Free browser-based tool to rotate PDF pages by 90, 180, or 270 degrees. No sign-up required.",
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
            <RotateCw className="h-4 w-4 text-primary" />
            PDF Rotator
          </div>

          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight leading-[1.1] mb-4">
            Rotate PDF Pages
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

          <PdfRotateTool />

          <p className="mt-6 text-xs text-muted-foreground">
            100% client-side processing &middot; No data sent to any server
            &middot; Unlimited rotations
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
                Want to process PDFs via API?
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
              href="/tools/pdf-splitter"
              className="text-primary hover:underline underline-offset-4"
            >
              Split PDFs
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
            Why use this PDF rotator
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
              tool rotates pages in standard PDF files. The rotation is
              lossless — text and images are not re-rendered. For advanced
              document processing, try{" "}
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
            Fix page orientation, then use our other tools to finalize your
            document. Combine this with our{" "}
            <Link
              href="/tools/pdf-merger"
              className="text-primary hover:underline underline-offset-4"
            >
              PDF Merger
            </Link>{" "}
            to combine corrected documents, or use our{" "}
            <Link
              href="/tools/pdf-page-remover"
              className="text-primary hover:underline underline-offset-4"
            >
              PDF Page Remover
            </Link>{" "}
            to delete unwanted pages after rotating.
          </p>

          <h2 className="text-xl sm:text-2xl font-bold mt-10 mb-4">
            Try Parsli AI for document extraction
          </h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            Need to extract data from your PDFs — not just rotate them? Parsli
            uses Google&apos;s Gemini AI to pull structured data from invoices,
            receipts, contracts, and any document type. Define a custom schema,
            and the AI extracts exactly the fields you need.
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
            How to Rotate PDF Pages for Free
          </h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            Rotating PDF pages is a common need when dealing with scanned
            documents, mixed-orientation files, or pages that were saved in the
            wrong direction. A reliable PDF rotator fixes these issues without
            requiring you to recreate the document.
          </p>
          <p className="text-muted-foreground leading-relaxed mb-4">
            Most online PDF rotators upload your files to their servers or
            require an account. This tool is different — it runs entirely in
            your browser. Your PDF is processed on your device and never sent
            anywhere. It&apos;s completely free, with no limits on the number
            of rotations.
          </p>

          <h2 className="text-xl sm:text-2xl font-bold mt-10 mb-4">
            PDF Rotator: Free Tool vs AI Extraction
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
                  ["Rotate PDF pages", "Yes", "N/A"],
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
            Stop dealing with sideways and upside-down scans.
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
