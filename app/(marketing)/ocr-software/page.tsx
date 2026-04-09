import type { Metadata } from "next"
import Link from "next/link"
import {
  ScanText, ArrowRight, Sparkles, Shield, Zap, Check, Brain,
  FileSpreadsheet, Code2, Workflow, FileText, Table, PenLine, Globe,
} from "lucide-react"
import { AuthButton } from "@/components/marketing/shared/AuthButton"
import { Button } from "@/components/ui/button"
import { JsonLd } from "@/components/marketing/shared/JsonLd"
import { breadcrumbJsonLd } from "@/lib/seo/json-ld"

export const metadata: Metadata = {
  title: "OCR Software — AI-Powered Text Recognition | Parsli",
  description:
    "AI OCR software that goes beyond text recognition. Extract structured data from scanned documents, images, and PDFs with 95%+ accuracy. Handles handwriting, tables, and complex layouts.",
  keywords: [
    "ocr software", "ocr software free", "best ocr software",
    "ai ocr software", "ocr text recognition", "optical character recognition software",
    "ocr solution", "ocr platform", "document ocr", "intelligent ocr",
  ],
  alternates: { canonical: "https://parsli.co/ocr-software" },
  openGraph: {
    title: "OCR Software — AI-Powered Text Recognition | Parsli",
    description: "AI OCR that goes beyond text recognition. Extract structured data from any document. Free plan.",
    url: "https://parsli.co/ocr-software",
  },
}

const capabilities = [
  { icon: Brain, title: "AI-Powered OCR", description: "Google Gemini 2.5 Pro understands document context — not just character shapes. Achieves 95%+ accuracy where traditional OCR tools struggle." },
  { icon: PenLine, title: "Handwriting Recognition", description: "Reads cursive, messy handwriting, and old documents. Far beyond what Tesseract or ABBYY can handle on handwritten content." },
  { icon: Table, title: "Table Detection", description: "Automatically finds and extracts tables with rows, columns, and headers. No manual zone drawing or template configuration." },
  { icon: Globe, title: "100+ Languages", description: "OCR support for over 100 languages including Arabic, Chinese, Japanese, Korean, Hindi, and all Latin-script languages." },
  { icon: FileText, title: "Any Document Format", description: "PDFs (native and scanned), images (JPG, PNG, TIFF), photos, faxes, Word docs. If it has text, Parsli reads it." },
  { icon: Code2, title: "Structured Output", description: "Unlike traditional OCR that returns raw text, Parsli outputs structured data matching your custom schema — JSON, CSV, or Google Sheets." },
]

const ocrTimeline = [
  { year: "1985", event: "HP Labs develops Tesseract OCR engine" },
  { year: "2006", event: "Google open-sources Tesseract — becomes industry standard" },
  { year: "2015", event: "Deep learning OCR (LSTM networks) improves accuracy on complex layouts" },
  { year: "2023", event: "Multimodal AI (GPT-4V, Gemini) enables document understanding beyond OCR" },
  { year: "2025", event: "AI-powered extraction replaces template-based OCR for most use cases" },
]

const faqs = [
  { q: "How is Parsli different from traditional OCR software?", a: "Traditional OCR (Tesseract, ABBYY, Adobe Acrobat) converts images to raw text. Parsli goes further: it understands document structure, extracts specific fields you define, handles tables and line items, and outputs structured data (JSON, CSV, Sheets) — not just a wall of text." },
  { q: "Is Parsli better than Tesseract?", a: "For raw text extraction from clear images, Tesseract works well. Parsli excels where Tesseract struggles: complex layouts, handwriting, tables, scanned documents, and — critically — structured field extraction. Parsli also requires zero setup (no installation, no training data)." },
  { q: "What about ABBYY FineReader?", a: "ABBYY is powerful desktop OCR software with good accuracy. Parsli is cloud-based with AI that understands document meaning (not just characters), offers custom schema extraction, and integrates with Google Sheets, Zapier, and APIs. No software installation needed." },
  { q: "Does Parsli handle handwritten text?", a: "Yes. Powered by Google Gemini, Parsli reads cursive, messy handwriting, and old documents with 95%+ accuracy. This is a major differentiator — most OCR software struggles significantly with handwritten content." },
  { q: "Is there a free OCR tool?", a: "Yes. Parsli offers a free browser-based OCR tool at /tools/ocr that uses Tesseract.js — no sign-up needed. For AI-powered OCR with structured extraction, the free plan includes 30 pages/month." },
  { q: "What accuracy does Parsli achieve?", a: "95%+ on most documents including scanned PDFs and photos. 98-99% on clean, well-formatted documents. For comparison, traditional OCR achieves 85-95% on printed text and much lower on handwriting or complex layouts." },
]

export default function OcrSoftwarePage() {
  return (
    <>
      <JsonLd data={breadcrumbJsonLd([
        { name: "Home", url: "https://parsli.co" },
        { name: "OCR Software", url: "https://parsli.co/ocr-software" },
      ])} />
      <JsonLd data={{ "@context": "https://schema.org", "@type": "SoftwareApplication", name: "Parsli OCR Software", description: "AI-powered OCR software that extracts structured data from scanned documents, images, and PDFs.", applicationCategory: "BusinessApplication", operatingSystem: "Web Browser", offers: { "@type": "Offer", price: "0", priceCurrency: "USD" } }} />
      <JsonLd data={{ "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faqs.map((faq) => ({ "@type": "Question", name: faq.q, acceptedAnswer: { "@type": "Answer", text: faq.a } })) }} />

      <section className="relative pt-24 sm:pt-32 pb-16 sm:pb-20">
        <div className="absolute inset-0 -z-10"><div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-primary/5 rounded-full blur-3xl" /></div>
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border bg-card px-4 py-1.5 text-sm text-muted-foreground mb-6"><ScanText className="h-4 w-4 text-primary" />OCR Software</div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.08] mb-5">AI OCR Software</h1>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-8 leading-relaxed">Beyond text recognition. Parsli&apos;s AI reads documents the way a human would — understanding layout, context, and meaning. Extract structured data, not just raw text.</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-4">
            <AuthButton className="text-base px-8 h-12" showArrow>Try AI OCR Free</AuthButton>
            <Button variant="outline" size="lg" className="text-base px-8 h-12" asChild><Link href="/tools/ocr">Try Free OCR Tool</Link></Button>
          </div>
          <p className="text-sm text-muted-foreground">No credit card required &middot; 30 free pages/month &middot; Free browser-based OCR tool available</p>
        </div>
      </section>

      <section className="py-8 border-y bg-muted/30">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 flex flex-wrap justify-center gap-8 text-sm text-muted-foreground">
          {[{ value: "95%+", label: "Accuracy on scans" },{ value: "100+", label: "Languages" },{ value: "Handwriting", label: "Cursive & print" }].map((m) => (
            <div key={m.label} className="text-center"><span className="text-2xl font-bold text-foreground">{m.value}</span><p className="mt-0.5">{m.label}</p></div>
          ))}
        </div>
      </section>

      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-center mb-14">Why Parsli&apos;s OCR is different</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {capabilities.map((c) => (
              <div key={c.title} className="rounded-2xl border bg-card p-7"><div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary mb-4"><c.icon className="h-5 w-5" /></div><h3 className="font-semibold text-lg mb-2">{c.title}</h3><p className="text-sm text-muted-foreground leading-relaxed">{c.description}</p></div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-20 bg-muted/30 border-t">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-10">Parsli AI vs Traditional OCR</h2>
          <div className="border rounded-xl overflow-hidden bg-card">
            <table className="w-full text-sm">
              <thead className="bg-muted/50"><tr><th className="text-left px-5 py-3 font-semibold">Capability</th><th className="text-left px-5 py-3 font-semibold text-primary">Parsli AI</th><th className="text-left px-5 py-3 font-semibold">Tesseract</th><th className="text-left px-5 py-3 font-semibold">ABBYY</th></tr></thead>
              <tbody>
                {[
                  ["Printed text accuracy", "98-99%", "90-95%", "95-98%"],
                  ["Handwriting recognition", "95%+", "Poor", "Moderate"],
                  ["Table extraction", "AI-detected", "No", "Template-based"],
                  ["Custom field extraction", "Yes (schemas)", "No", "Limited"],
                  ["Complex layouts", "Excellent", "Poor", "Good"],
                  ["Setup required", "None (cloud)", "Installation + config", "Installation + license"],
                  ["Integrations", "Sheets, Zapier, API", "None", "Limited"],
                  ["Languages", "100+", "100+", "200+"],
                  ["Price", "Free tier + $20/mo", "Free (open source)", "$$$"],
                ].map(([f, p, t, a]) => (<tr key={f} className="border-t"><td className="px-5 py-2.5 font-medium">{f}</td><td className="px-5 py-2.5 text-primary font-medium">{p}</td><td className="px-5 py-2.5 text-muted-foreground">{t}</td><td className="px-5 py-2.5 text-muted-foreground">{a}</td></tr>))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-xl sm:text-2xl font-bold mb-4">The History and Future of OCR Technology</h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            Optical Character Recognition has evolved dramatically since its origins. The <a href="https://github.com/tesseract-ocr/tesseract" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">Tesseract OCR engine</a>, developed at HP Labs in 1985 and open-sourced by Google in 2006, remains the most widely deployed open-source OCR engine. ABBYY, founded in 1989, built the commercial standard with FineReader.
          </p>
          <p className="text-muted-foreground leading-relaxed mb-4">
            But these tools share a fundamental limitation: they recognize characters, not documents. They output raw text without understanding what the text means. A 2024 research paper in <a href="https://ieeexplore.ieee.org/xpl/RecentIssue.jsp?punumber=34" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">IEEE Transactions on Pattern Analysis and Machine Intelligence</a> demonstrated that multimodal AI models achieve 15-30% higher accuracy than traditional OCR on real-world documents with complex layouts.
          </p>
          <p className="text-muted-foreground leading-relaxed mb-4">
            The global OCR market, valued at $13.38 billion in 2023, is projected to reach $32.29 billion by 2030 (source: <a href="https://www.grandviewresearch.com/industry-analysis/optical-character-recognition-market" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">Grand View Research</a>). Growth is driven by AI-enhanced OCR replacing template-based approaches across finance, healthcare, legal, and logistics.
          </p>

          <h2 className="text-xl sm:text-2xl font-bold mt-10 mb-6">OCR Technology Timeline</h2>
          <div className="space-y-4">
            {ocrTimeline.map((item) => (
              <div key={item.year} className="flex gap-4 items-start">
                <span className="text-sm font-bold text-primary whitespace-nowrap min-w-[3rem]">{item.year}</span>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.event}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-20 bg-muted/30 border-t">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-10">Free OCR Tools — No Sign-Up</h2>
          <p className="text-center text-muted-foreground mb-8 max-w-2xl mx-auto">Try Parsli&apos;s free browser-based OCR tools. 100% client-side processing — your files never leave your device.</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { href: "/tools/ocr", label: "Free Online OCR", desc: "Extract text from any image" },
              { href: "/tools/scan-to-text", label: "Scan to Text", desc: "Convert scanned docs to text" },
              { href: "/tools/make-pdf-searchable", label: "Make PDF Searchable", desc: "OCR for scanned PDFs" },
              { href: "/tools/image-to-text", label: "Image to Text", desc: "OCR for photos and screenshots" },
              { href: "/tools/handwriting-to-text", label: "Handwriting to Text", desc: "Read cursive and handwriting" },
              { href: "/tools/pdf-to-text", label: "PDF to Text", desc: "Extract text from PDFs" },
            ].map((tool) => (
              <Link key={tool.href} href={tool.href} className="rounded-xl border bg-card px-5 py-4 hover:border-primary/30 transition-colors group">
                <h3 className="font-semibold text-sm group-hover:text-primary transition-colors">{tool.label}</h3>
                <p className="text-xs text-muted-foreground mt-1">{tool.desc}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-20 bg-muted/30 border-t">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-10">OCR Glossary</h2>
          <p className="text-center text-muted-foreground mb-8 max-w-2xl mx-auto">Key terms in optical character recognition and document processing. For a deep dive, read our complete guide: <Link href="/guides/what-is-ocr" className="text-primary hover:underline">What Is OCR?</Link></p>
          <div className="grid gap-4">
            {[
              { term: "OCR (Optical Character Recognition)", definition: "Technology that converts images of text — from scans, photos, or PDFs — into machine-readable characters." },
              { term: "ICR (Intelligent Character Recognition)", definition: "An extension of OCR designed to read handwritten text using machine learning models." },
              { term: "IDP (Intelligent Document Processing)", definition: "The broader category that combines OCR with AI-powered document understanding, classification, and data extraction." },
              { term: "Zonal OCR", definition: "OCR that reads text from predefined coordinates on a page. Fast but breaks when document layouts change." },
              { term: "Document AI", definition: "AI models that understand document structure — tables, fields, relationships — beyond simple character recognition." },
            ].map((item) => (
              <div key={item.term} className="rounded-lg border bg-card px-5 py-4">
                <h3 className="font-semibold text-sm mb-1">{item.term}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{item.definition}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-20"><div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8"><h2 className="text-2xl sm:text-3xl font-bold text-center mb-12">Frequently asked questions</h2><div className="divide-y rounded-2xl border bg-card">{faqs.map((faq) => (<details key={faq.q} className="group"><summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-6 py-5 text-sm font-semibold sm:text-base [&::-webkit-details-marker]:hidden">{faq.q}<ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-90" /></summary><div className="px-6 pb-5 text-sm leading-7 text-muted-foreground">{faq.a}</div></details>))}</div></div></section>

      <section className="py-16 sm:py-24 bg-slate-950">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">OCR that understands your documents.</h2>
          <p className="mt-4 text-lg leading-8 text-slate-400">Stop getting raw text from OCR. Start getting structured data. Parsli&apos;s AI extracts exactly the fields you need. Free plan included.</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <AuthButton className="h-12 px-8 text-base" showArrow>Try AI OCR Free</AuthButton>
            <Button variant="outline" size="lg" className="h-12 px-7 text-base border-white/20 text-white hover:bg-white/10" asChild><a href="https://calendly.com/talal-bytebeam/parsli-discovery-call" target="_blank" rel="noopener noreferrer">Book a Demo</a></Button>
          </div>
        </div>
      </section>

      <section className="py-12 sm:py-16 border-t">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-lg font-semibold mb-6">Related</h2>
          <div className="flex flex-wrap gap-3">
            {[
              { href: "/guides/what-is-ocr", label: "What Is OCR?" },
              { href: "/solutions/document-parser", label: "AI Document Parser" },
              { href: "/solutions/intelligent-document-processing", label: "Intelligent Document Processing" },
              { href: "/email-parser", label: "Email Parser" },
              { href: "/pdf-parser", label: "PDF Parser" },
              { href: "/tools/ocr", label: "Free OCR Tool" },
              { href: "/tools/handwriting-to-text", label: "Handwriting to Text" },
              { href: "/compare/adobe-acrobat-ocr", label: "Parsli vs Adobe Acrobat OCR" },
              { href: "/compare/abbyy", label: "Parsli vs ABBYY" },
              { href: "/pricing", label: "Pricing" },
            ].map((link) => (<Link key={link.href} href={link.href} className="inline-flex items-center gap-1.5 rounded-lg border bg-card px-4 py-2 text-sm hover:border-primary/30 transition-colors">{link.label} <ArrowRight className="h-3 w-3 text-muted-foreground" /></Link>))}
          </div>
        </div>
      </section>
    </>
  )
}
