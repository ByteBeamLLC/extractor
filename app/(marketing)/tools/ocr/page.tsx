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
import { ImageToTextTool } from "@/components/tools/ImageToTextTool"
import { AuthButton } from "@/components/marketing/shared/AuthButton"
import { Button } from "@/components/ui/button"
import { JsonLd } from "@/components/marketing/shared/JsonLd"
import { breadcrumbJsonLd } from "@/lib/seo/json-ld"

export const metadata: Metadata = {
  title: "Free Online OCR Tool — Extract Text from Images Instantly | Parsli",
  description:
    "Free online OCR (Optical Character Recognition) tool. Extract text from images, scanned documents, and photos in your browser. No sign-up, no uploads to servers. Supports 12 languages.",
  keywords: [
    "online ocr",
    "ocr online free",
    "free ocr",
    "ocr tool",
    "ocr reader online",
    "ocr text recognition online",
    "ocr scanner",
    "free ocr text recognition",
    "optical character recognition online",
    "ocr software free",
  ],
  alternates: { canonical: "https://parsli.co/tools/ocr" },
  openGraph: {
    title: "Free Online OCR Tool — Extract Text from Images Instantly | Parsli",
    description:
      "Free online OCR tool. Extract text from images and scanned documents in your browser. No sign-up required.",
    url: "https://parsli.co/tools/ocr",
  },
}

const features = [
  {
    icon: Shield,
    title: "Private & secure",
    description:
      "Your files are processed entirely in your browser using Tesseract.js. Nothing is uploaded to any server.",
  },
  {
    icon: UserX,
    title: "No sign-up required",
    description:
      "Use it instantly. No account, no email, no credit card. Just drop your file and get text.",
  },
  {
    icon: Zap,
    title: "Free & unlimited",
    description:
      "No limits, no watermarks, no paywalls. Run OCR on as many images as you need.",
  },
]

const steps = [
  {
    icon: Upload,
    title: "Upload your image",
    description:
      "Drag and drop any image — JPG, PNG, GIF, BMP, or WebP. Scanned documents and photos work too.",
  },
  {
    icon: ScanText,
    title: "OCR reads the text",
    description:
      "Optical Character Recognition detects and extracts all readable text from your image in seconds.",
  },
  {
    icon: Download,
    title: "Copy or download",
    description:
      "Copy extracted text to your clipboard or download as a .txt file. Ready to use immediately.",
  },
]

const personas = [
  {
    icon: Code2,
    title: "Developers & Engineers",
    description:
      "Extract text from screenshots, UI mockups, and technical diagrams without typing a line.",
  },
  {
    icon: Briefcase,
    title: "Finance Teams",
    description:
      "Pull numbers from scanned invoices, receipts, and bank statements into editable text.",
  },
  {
    icon: Building2,
    title: "Legal Professionals",
    description:
      "Digitize scanned contracts, court documents, and correspondence for search and review.",
  },
  {
    icon: GraduationCap,
    title: "Students & Researchers",
    description:
      "Convert textbook pages, lecture slides, and research paper screenshots into editable text.",
  },
]

const faqs = [
  {
    q: "What is OCR?",
    a: "OCR stands for Optical Character Recognition — a technology that converts images of text (printed, handwritten, or typed) into machine-readable digital text. Originally developed at HP Labs in 1985, modern OCR uses pattern recognition and machine learning to achieve over 99% accuracy on printed text.",
  },
  {
    q: "Is this OCR tool really free?",
    a: "Yes, completely free with no limits. There are no hidden charges, no watermarks, and no sign-up required. The tool runs entirely in your browser using Tesseract.js, an open-source OCR engine.",
  },
  {
    q: "Do you store my files?",
    a: "No. Your image is processed entirely in your browser. The file never leaves your device and is never sent to any server. This is verifiable — the tool uses Tesseract.js, a client-side OCR library.",
  },
  {
    q: "What languages does the OCR support?",
    a: "12 languages: English, Arabic, French, German, Spanish, Italian, Portuguese, Russian, Chinese (Simplified & Traditional), Japanese, and Korean. Select your language before uploading for best results.",
  },
  {
    q: "How accurate is the OCR?",
    a: "For clear, printed text at 300 DPI or higher, accuracy is typically 90–95%. According to IEEE research, AI-based OCR approaches can exceed 99% accuracy on high-quality printed text. For complex documents or handwriting, our AI-powered extraction offers significantly better results.",
  },
  {
    q: "Can it read handwritten text?",
    a: "This free tool has limited handwriting support. For cursive, messy, or faded handwriting, use our dedicated Handwriting to Text tool or Parsli's AI extraction, which uses Google Gemini for 95%+ accuracy on handwriting.",
  },
  {
    q: "How does this compare to Tesseract?",
    a: "This tool actually uses Tesseract.js (the JavaScript port of Google's open-source Tesseract OCR engine) under the hood. The difference is you get a ready-to-use interface with no installation, no command-line setup, and no dependencies.",
  },
  {
    q: "Do you have an OCR API?",
    a: "This free tool is browser-only. For API access, Parsli offers a REST API that handles OCR with AI-powered extraction, custom schemas, and structured JSON output. It's free for up to 30 pages/month.",
  },
  {
    q: "What file formats are supported?",
    a: "JPG/JPEG, PNG, GIF, BMP, and WebP images. For PDF files, use our PDF to Text tool (text-based PDFs) or Make PDF Searchable tool (scanned PDFs).",
  },
  {
    q: "Does this work on mobile?",
    a: "Yes. The tool works on iPhone, iPad, and Android devices in any modern browser. Take a photo of a document and upload it directly.",
  },
]

export default function OcrToolPage() {
  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", url: "https://parsli.co" },
          { name: "Tools", url: "https://parsli.co/tools" },
          { name: "Free Online OCR", url: "https://parsli.co/tools/ocr" },
        ])}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          name: "Parsli Free Online OCR",
          description:
            "Free browser-based OCR tool to extract text from images and scanned documents. Supports 12 languages. No sign-up required.",
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
            acceptedAnswer: { "@type": "Answer", text: faq.a },
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
            Free Online OCR
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight leading-[1.1] mb-4">
            Free Online OCR Tool
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-3">
            Extract text from images instantly — no sign-up, no uploads to servers
          </p>
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-10">
            <div className="flex items-center gap-0.5 text-yellow-500">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="h-3.5 w-3.5 fill-current" />
              ))}
            </div>
            <span>Trusted by thousands of users</span>
          </div>
          <ImageToTextTool />
          <p className="mt-6 text-xs text-muted-foreground">
            100% client-side processing &middot; Powered by Tesseract.js &middot; No data sent to any server
          </p>
        </div>
      </section>

      {/* 2. API Upsell */}
      <section className="py-10 sm:py-12 border-t">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-xl border bg-card p-6 sm:p-8 flex flex-col sm:flex-row items-start gap-5">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 text-primary shrink-0">
              <Code2 className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <h2 className="font-semibold text-lg mb-1">Need OCR at scale via API?</h2>
              <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                Parsli&apos;s AI-powered OCR handles complex layouts, handwriting, and multi-page documents with 95%+ accuracy. Batch process thousands of files and get structured JSON output.
              </p>
              <div className="flex items-center gap-4">
                <Link href="/solutions/document-parsing-api" className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline underline-offset-4">
                  Explore API <ArrowRight className="h-3.5 w-3.5" />
                </Link>
                <Link href="/docs" className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                  Docs
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Cross-Sell */}
      <section className="pb-10 sm:pb-12">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <p className="text-sm text-muted-foreground text-center leading-relaxed">
            Need to extract text from PDFs? <Link href="/tools/pdf-to-text" className="text-primary hover:underline underline-offset-4">PDF to Text</Link> handles that. For scanned documents, try{" "}
            <Link href="/tools/scan-to-text" className="text-primary hover:underline underline-offset-4">Scan to Text</Link>. For handwritten content, use{" "}
            <Link href="/tools/handwriting-to-text" className="text-primary hover:underline underline-offset-4">Handwriting to Text</Link>. Compare Parsli to{" "}
            <Link href="/compare/abbyy" className="text-primary hover:underline underline-offset-4">ABBYY</Link> and{" "}
            <Link href="/compare/textract" className="text-primary hover:underline underline-offset-4">Amazon Textract</Link>.
          </p>
        </div>
      </section>

      {/* 4. Why Use This Tool */}
      <section className="py-16 sm:py-20 bg-muted/30">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-12">Why use this free OCR tool</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {features.map((f) => (
              <div key={f.title} className="rounded-xl border bg-card p-6 text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 text-primary mb-4">
                  <f.icon className="h-6 w-6" />
                </div>
                <h3 className="font-semibold text-lg mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. How It Works */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-12">How it works</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((step, i) => (
              <div key={step.title} className="relative rounded-xl border bg-card p-6 text-center">
                <div className="absolute top-4 right-4 text-xs font-bold text-muted-foreground/40">{i + 1}</div>
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary mb-4">
                  <step.icon className="h-6 w-6" />
                </div>
                <h3 className="font-semibold text-lg mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>
              </div>
            ))}
          </div>
          <div className="mt-8 rounded-lg border-l-4 border-primary bg-primary/5 px-6 py-4 max-w-2xl mx-auto">
            <p className="text-sm text-muted-foreground leading-relaxed">
              <span className="font-medium text-foreground">Note:</span> This tool works best with clear, high-resolution images of printed text. For complex documents, scanned PDFs, or handwritten content, try{" "}
              <Link href="/pricing" className="text-primary hover:underline underline-offset-4">Parsli AI</Link>.
            </p>
          </div>
        </div>
      </section>

      {/* 6. Educational Content */}
      <section className="py-16 sm:py-20 bg-muted/30">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-12">What this OCR tool handles</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="rounded-xl border bg-card p-6">
              <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" /> Works great with
              </h3>
              <ul className="space-y-3 text-sm text-muted-foreground">
                {["Clear photos of printed text and documents", "Screenshots with readable text content", "Scanned documents and book pages", "Business cards, labels, and signage", "Receipts, invoices, and forms"].map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="text-green-600 mt-0.5">&#10003;</span>{item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-xl border bg-card p-6">
              <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" /> For these, try Parsli AI
              </h3>
              <ul className="space-y-3 text-sm text-muted-foreground">
                {["Complex multi-column layouts and tables", "Handwritten or cursive text", "Low-quality or poorly lit photos", "Structured data extraction (specific fields)", "Batch processing and automation"].map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <ArrowRight className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />{item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="mt-16 max-w-3xl mx-auto">
            <div className="flex items-center gap-2 mb-6">
              <Lightbulb className="h-5 w-5 text-primary" />
              <h3 className="text-xl font-bold">Tips for better OCR results</h3>
            </div>
            <div className="space-y-6">
              <div>
                <h4 className="font-semibold mb-2">Use high-resolution images (300+ DPI)</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Higher resolution gives the OCR engine more detail. A 300 DPI scan produces significantly better results than a low-res thumbnail. According to ABBYY&apos;s documentation, 300 DPI is the minimum recommended resolution for reliable OCR.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Ensure good lighting and contrast</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Dark text on a light background with even lighting gives the best results. Avoid shadows, glare, and uneven lighting when photographing documents.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Select the correct language</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Tesseract&apos;s OCR engine is optimized per language. Selecting the correct language model before processing can improve accuracy by 10–15%, especially for non-Latin scripts.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. Perfect For */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-12">Perfect for</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {personas.map((p) => (
              <div key={p.title} className="rounded-xl border bg-card p-5 hover:border-primary/30 transition-colors">
                <p.icon className="h-5 w-5 text-primary mb-3" />
                <h3 className="font-semibold text-sm mb-1">{p.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{p.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 8. FAQ */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-12">Frequently asked questions</h2>
          <div className="grid sm:grid-cols-2 gap-6">
            {faqs.map((faq) => (
              <div key={faq.q} className="rounded-xl border bg-card p-5">
                <h3 className="font-semibold text-sm mb-2">{faq.q}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 9. SEO Content + Citations */}
      <section className="py-16 sm:py-20 bg-muted/30 border-t">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-xl sm:text-2xl font-bold mb-4">What Is OCR and How Does It Work?</h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            OCR (Optical Character Recognition) is the technology that converts images of text into machine-readable digital text. The concept dates back to the 1920s, but modern OCR gained traction when Hewlett-Packard Labs developed the Tesseract engine in 1985. Google later open-sourced Tesseract in 2006, making it the world&apos;s most widely used open-source OCR engine (source: <a href="https://github.com/tesseract-ocr/tesseract" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">Tesseract GitHub repository</a>).
          </p>
          <p className="text-muted-foreground leading-relaxed mb-4">
            This free tool uses Tesseract.js, a JavaScript port of the Tesseract engine that runs entirely in your browser. Your images are processed on your own device — nothing is uploaded to any server. It supports 12 languages and works with any modern browser on desktop, tablet, or mobile.
          </p>

          <h2 className="text-xl sm:text-2xl font-bold mt-10 mb-4">The OCR Market in 2026</h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            The global OCR market was valued at $13.38 billion in 2023 and is projected to reach $32.29 billion by 2030, growing at a CAGR of 13.7% (source: <a href="https://www.grandviewresearch.com/industry-analysis/optical-character-recognition-market" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">Grand View Research, 2024</a>). This growth is driven by increasing digitization demands, AI-enhanced accuracy, and the shift toward paperless workflows across industries including finance, healthcare, and legal.
          </p>
          <p className="text-muted-foreground leading-relaxed mb-4">
            Traditional template-based OCR matches individual characters against known patterns. Modern AI-powered OCR (like Parsli&apos;s engine, built on Google Gemini) understands document context, handles complex layouts, and extracts structured data — not just raw text. According to Gartner, by 2026 over 80% of enterprises will have adopted some form of intelligent document processing that goes beyond basic OCR.
          </p>

          <h2 className="text-xl sm:text-2xl font-bold mt-10 mb-4">Free Browser OCR vs AI-Powered Extraction</h2>
          <div className="border rounded-lg overflow-hidden mb-6">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left px-4 py-2.5 font-semibold">Feature</th>
                  <th className="text-left px-4 py-2.5 font-semibold">Free OCR Tool</th>
                  <th className="text-left px-4 py-2.5 font-semibold">Parsli AI</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["Clear printed text", "90–95% accuracy", "99%+ accuracy"],
                  ["Handwritten text", "Limited", "95%+ (Gemini AI)"],
                  ["Complex table layouts", "No", "Yes"],
                  ["Custom field extraction", "No", "Yes (schemas)"],
                  ["Multi-language", "12 languages", "100+ languages"],
                  ["Batch processing", "One at a time", "Thousands via API"],
                  ["Integrations", "None", "Sheets, Zapier, Make, API"],
                  ["Price", "Free forever", "Free tier + paid plans"],
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
          <h2 className="text-lg font-semibold text-center mb-8">Works everywhere &mdash; no install needed</h2>
          <div className="grid grid-cols-3 gap-6 max-w-md mx-auto">
            {[
              { icon: Monitor, label: "Desktop", sub: "Chrome, Firefox, Safari, Edge" },
              { icon: Smartphone, label: "Mobile", sub: "iOS, Android" },
              { icon: Tablet, label: "Tablet", sub: "iPad, Android tablets" },
            ].map((d) => (
              <div key={d.label} className="text-center">
                <d.icon className="h-6 w-6 mx-auto text-muted-foreground mb-2" />
                <p className="text-xs text-muted-foreground">{d.label}</p>
                <p className="text-[10px] text-muted-foreground/60">{d.sub}</p>
              </div>
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
          <h2 className="text-2xl sm:text-3xl font-bold mb-4">Need more than basic OCR?</h2>
          <p className="text-muted-foreground max-w-xl mx-auto mb-8 leading-relaxed">
            Parsli extracts structured data from any document — PDFs, images, scans, emails. Define custom schemas, automate with integrations, and process thousands of documents. Free up to 30 pages/month.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <AuthButton className="text-base px-8 h-12" showArrow>Try Parsli Free</AuthButton>
            <Button variant="outline" size="lg" className="text-base px-8 h-12" asChild>
              <a href="https://calendly.com/talal-bytebeam/parsli-discovery-call" target="_blank" rel="noopener noreferrer">Book a demo</a>
            </Button>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">No credit card required &middot; 30 free pages/month</p>
        </div>
      </section>

      {/* 12. Related Resources */}
      <section className="py-12 sm:py-16 border-t">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-lg font-semibold mb-6">Related Resources</h2>
          <div className="flex flex-wrap gap-3">
            {[
              { href: "/tools/image-to-text", label: "Image to Text" },
              { href: "/tools/pdf-to-text", label: "PDF to Text" },
              { href: "/tools/handwriting-to-text", label: "Handwriting to Text" },
              { href: "/tools/scan-to-text", label: "Scan to Text" },
              { href: "/tools/screenshot-to-text", label: "Screenshot to Text" },
              { href: "/tools/make-pdf-searchable", label: "Make PDF Searchable" },
              { href: "/solutions/document-parsing-api", label: "Document Parsing API" },
              { href: "/pricing", label: "Pricing" },
            ].map((link) => (
              <Link key={link.href} href={link.href} className="inline-flex items-center gap-1.5 rounded-lg border bg-card px-4 py-2 text-sm hover:border-primary/30 transition-colors">
                {link.label} <ArrowRight className="h-3 w-3 text-muted-foreground" />
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
