import type { Metadata } from "next"
import Link from "next/link"
import {
  Shield, Zap, UserX, Upload, Download, ArrowRight, Sparkles, FileText,
  Code2, Monitor, Smartphone, Tablet, Users, GraduationCap, Building2,
  Lightbulb, Star, FileJson, Briefcase,
} from "lucide-react"
import { PdfToJsonTool } from "@/components/tools/PdfToJsonTool"
import { AuthButton } from "@/components/marketing/shared/AuthButton"
import { Button } from "@/components/ui/button"
import { JsonLd } from "@/components/marketing/shared/JsonLd"
import { breadcrumbJsonLd } from "@/lib/seo/json-ld"

export const metadata: Metadata = {
  title: "PDF to JSON Converter — Free, Instant, No Sign-Up | Parsli",
  description:
    "Convert PDF documents to structured JSON data instantly. Free PDF to JSON converter runs in your browser — no sign-up, no server uploads. Perfect for developers and data pipelines.",
  keywords: [
    "pdf to json", "convert pdf to json", "pdf to json converter", "pdf json",
    "pdf to json online", "pdf to json free", "pdf to json api", "extract pdf to json",
    "pdf data to json", "pdf to json file",
  ],
  alternates: { canonical: "https://parsli.co/tools/pdf-to-json" },
  openGraph: {
    title: "PDF to JSON Converter — Free, Instant, No Sign-Up | Parsli",
    description: "Convert PDF documents to structured JSON data. Free, no sign-up required.",
    url: "https://parsli.co/tools/pdf-to-json",
  },
}

const features = [
  { icon: Shield, title: "Private & secure", description: "Your PDF is processed entirely in your browser. Nothing is uploaded to any server — your data stays on your device." },
  { icon: UserX, title: "No sign-up required", description: "Use it instantly. No account, no API key, no email. Just drop your PDF and get JSON." },
  { icon: Zap, title: "Free & unlimited", description: "No limits, no rate limiting, no paywalls. Convert as many PDFs to JSON as you need." },
]

const steps = [
  { icon: Upload, title: "Upload your PDF", description: "Drag and drop any text-based PDF. Up to 50 MB." },
  { icon: FileJson, title: "JSON is generated", description: "The tool extracts text from every page and structures it as clean, well-formed JSON with metadata." },
  { icon: Download, title: "Copy or download", description: "Copy the JSON to your clipboard or download as a .json file. Ready for your pipeline." },
]

const personas = [
  { icon: Code2, title: "Software Developers", description: "Extract document content as JSON for web apps, CMS imports, and content pipelines." },
  { icon: Briefcase, title: "Data Engineers", description: "Convert PDF reports to JSON for ETL pipelines, data lakes, and analytics platforms." },
  { icon: Building2, title: "API Integrators", description: "Get PDF content in JSON format for feeding into REST APIs, webhooks, and automation tools." },
  { icon: GraduationCap, title: "Researchers & Academics", description: "Extract structured data from research papers and publications for analysis." },
]

const faqs = [
  { q: "How does PDF to JSON conversion work?", a: "The tool reads your PDF using pdf.js (Mozilla's open-source PDF renderer), extracts text content from each page, and structures it into a JSON object with document metadata, page count, and per-page text with word and character counts." },
  { q: "Is this tool free?", a: "Yes, completely free with no limits. No account, no API key, no credit card. The tool runs entirely in your browser." },
  { q: "Do you store my files?", a: "No. All processing happens client-side in your browser. Your PDF never leaves your device." },
  { q: "What does the JSON output look like?", a: "The output includes a document object with fileName, fileSize, extractedAt timestamp, pageCount, and a pages array where each page has pageNumber, text content, charCount, and wordCount." },
  { q: "Can it extract structured fields (like invoice numbers)?", a: "This free tool extracts raw text as JSON. For structured field extraction (specific data points like amounts, dates, names), use Parsli AI where you define a custom schema and get exactly the JSON fields you need." },
  { q: "Does it handle scanned PDFs?", a: "This tool works with text-based PDFs that have embedded text. For scanned/image-based PDFs, use Parsli AI which includes OCR powered by Google Gemini." },
  { q: "Do you have a JSON extraction API?", a: "Yes. Parsli offers a REST API that extracts structured JSON from any document type. Define your schema, send documents via API, and get clean JSON back. Free for 30 pages/month." },
  { q: "What's the maximum file size?", a: "Up to 50 MB. Since processing happens in your browser, very large files may take longer depending on your device." },
  { q: "Can I use this for batch processing?", a: "This free tool processes one file at a time. For batch processing, Parsli AI handles thousands of documents via API, email forwarding, or webhooks." },
  { q: "Does this work on mobile?", a: "Yes. Works on any modern mobile browser. Upload your PDF and copy or download the JSON output." },
]

export default function PdfToJsonToolPage() {
  return (
    <>
      <JsonLd data={breadcrumbJsonLd([
        { name: "Home", url: "https://parsli.co" },
        { name: "Tools", url: "https://parsli.co/tools" },
        { name: "PDF to JSON", url: "https://parsli.co/tools/pdf-to-json" },
      ])} />
      <JsonLd data={{ "@context": "https://schema.org", "@type": "SoftwareApplication", name: "Parsli PDF to JSON Converter", description: "Free browser-based tool to convert PDF documents to structured JSON data. No sign-up required.", applicationCategory: "DeveloperApplication", operatingSystem: "Web Browser", offers: { "@type": "Offer", price: "0", priceCurrency: "USD" } }} />
      <JsonLd data={{ "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faqs.map((faq) => ({ "@type": "Question", name: faq.q, acceptedAnswer: { "@type": "Answer", text: faq.a } })) }} />

      <section className="relative pt-24 sm:pt-28 pb-16">
        <div className="absolute inset-0 -z-10"><div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-primary/5 rounded-full blur-3xl" /></div>
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border bg-card px-4 py-1.5 text-sm text-muted-foreground mb-6"><FileJson className="h-4 w-4 text-primary" />PDF to JSON</div>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight leading-[1.1] mb-4">Convert PDF to JSON</h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-3">Structured JSON from any PDF — free, instant, no sign-up</p>
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-10">
            <div className="flex items-center gap-0.5 text-yellow-500">{[...Array(5)].map((_, i) => (<Star key={i} className="h-3.5 w-3.5 fill-current" />))}</div>
            <span>Built for developers</span>
          </div>
          <PdfToJsonTool />
          <p className="mt-6 text-xs text-muted-foreground">100% client-side processing &middot; No data sent to any server &middot; Well-formed JSON output</p>
        </div>
      </section>

      <section className="py-10 sm:py-12 border-t">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-xl border bg-card p-6 sm:p-8 flex flex-col sm:flex-row items-start gap-5">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 text-primary shrink-0"><Code2 className="h-6 w-6" /></div>
            <div className="flex-1">
              <h2 className="font-semibold text-lg mb-1">Need structured JSON extraction via API?</h2>
              <p className="text-sm text-muted-foreground leading-relaxed mb-4">Parsli&apos;s API extracts custom-schema JSON from any document — invoices, receipts, contracts. Define the fields you need and get clean, typed JSON back via REST API.</p>
              <div className="flex items-center gap-4">
                <Link href="/solutions/document-parsing-api" className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline underline-offset-4">Explore API <ArrowRight className="h-3.5 w-3.5" /></Link>
                <Link href="/docs" className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">API Docs</Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="pb-10 sm:pb-12">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <p className="text-sm text-muted-foreground text-center leading-relaxed">
            Need XML instead? <Link href="/tools/pdf-to-xml" className="text-primary hover:underline underline-offset-4">PDF to XML</Link>. For spreadsheets, try <Link href="/tools/pdf-to-excel" className="text-primary hover:underline underline-offset-4">PDF to Excel</Link> or <Link href="/tools/pdf-to-google-sheets" className="text-primary hover:underline underline-offset-4">PDF to Google Sheets</Link>. Convert other formats with <Link href="/tools/excel-to-json" className="text-primary hover:underline underline-offset-4">Excel to JSON</Link>.
          </p>
        </div>
      </section>

      <section className="py-16 sm:py-20 bg-muted/30"><div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8"><h2 className="text-2xl sm:text-3xl font-bold text-center mb-12">Why use this PDF to JSON converter</h2><div className="grid md:grid-cols-3 gap-6">{features.map((f) => (<div key={f.title} className="rounded-xl border bg-card p-6 text-center"><div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 text-primary mb-4"><f.icon className="h-6 w-6" /></div><h3 className="font-semibold text-lg mb-2">{f.title}</h3><p className="text-sm text-muted-foreground leading-relaxed">{f.description}</p></div>))}</div></div></section>

      <section className="py-16 sm:py-20"><div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8"><h2 className="text-2xl sm:text-3xl font-bold text-center mb-12">How it works</h2><div className="grid md:grid-cols-3 gap-8">{steps.map((step, i) => (<div key={step.title} className="relative rounded-xl border bg-card p-6 text-center"><div className="absolute top-4 right-4 text-xs font-bold text-muted-foreground/40">{i + 1}</div><div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary mb-4"><step.icon className="h-6 w-6" /></div><h3 className="font-semibold text-lg mb-2">{step.title}</h3><p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p></div>))}</div></div></section>

      <section className="py-16 sm:py-20 bg-muted/30">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-12">What this tool handles</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="rounded-xl border bg-card p-6"><h3 className="font-semibold text-lg mb-4 flex items-center gap-2"><FileText className="h-5 w-5 text-primary" />Works great with</h3><ul className="space-y-3 text-sm text-muted-foreground">{["Text-based PDF documents", "Reports, articles, and whitepapers", "Multi-page documents with clear text", "Forms and structured documents", "Digital PDF exports from any software"].map((item) => (<li key={item} className="flex items-start gap-2"><span className="text-green-600 mt-0.5">&#10003;</span>{item}</li>))}</ul></div>
            <div className="rounded-xl border bg-card p-6"><h3 className="font-semibold text-lg mb-4 flex items-center gap-2"><Sparkles className="h-5 w-5 text-primary" />For these, try Parsli AI</h3><ul className="space-y-3 text-sm text-muted-foreground">{["Custom field extraction (invoice fields, etc.)", "Scanned PDFs requiring OCR", "Typed, schema-defined JSON output", "Batch API processing", "Automated webhook delivery"].map((item) => (<li key={item} className="flex items-start gap-2"><ArrowRight className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />{item}</li>))}</ul></div>
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-20"><div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8"><h2 className="text-2xl sm:text-3xl font-bold text-center mb-12">Perfect for</h2><div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">{personas.map((p) => (<div key={p.title} className="rounded-xl border bg-card p-5 hover:border-primary/30 transition-colors"><p.icon className="h-5 w-5 text-primary mb-3" /><h3 className="font-semibold text-sm mb-1">{p.title}</h3><p className="text-xs text-muted-foreground leading-relaxed">{p.description}</p></div>))}</div></div></section>

      <section className="py-16 sm:py-20"><div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8"><h2 className="text-2xl sm:text-3xl font-bold text-center mb-12">Frequently asked questions</h2><div className="grid sm:grid-cols-2 gap-6">{faqs.map((faq) => (<div key={faq.q} className="rounded-xl border bg-card p-5"><h3 className="font-semibold text-sm mb-2">{faq.q}</h3><p className="text-xs text-muted-foreground leading-relaxed">{faq.a}</p></div>))}</div></div></section>

      <section className="py-16 sm:py-20 bg-muted/30 border-t">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-xl sm:text-2xl font-bold mb-4">Why JSON Is the Standard for Document Data</h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            JSON (JavaScript Object Notation), specified in <a href="https://datatracker.ietf.org/doc/html/rfc8259" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">RFC 8259</a> and ECMA-404, has become the dominant data interchange format for modern applications. According to the Stack Overflow Developer Survey (2024), JSON is used by over 70% of professional developers for data exchange, far ahead of XML and CSV.
          </p>
          <p className="text-muted-foreground leading-relaxed mb-4">
            Postman&apos;s State of the API Report (2024) shows that 86% of APIs use JSON as their primary response format. This makes PDF-to-JSON conversion essential for feeding document data into modern applications, data pipelines, and AI/ML workflows.
          </p>
          <p className="text-muted-foreground leading-relaxed mb-4">
            The PDF specification (<a href="https://www.iso.org/standard/75839.html" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">ISO 32000-2:2020</a>) defines a portable format optimized for viewing, not data extraction. Converting PDF to JSON bridges this gap by making document content programmable and queryable.
          </p>

          <h2 className="text-xl sm:text-2xl font-bold mt-10 mb-4">Free Converter vs Parsli API</h2>
          <div className="border rounded-lg overflow-hidden mb-6">
            <table className="w-full text-sm">
              <thead className="bg-muted/50"><tr><th className="text-left px-4 py-2.5 font-semibold">Feature</th><th className="text-left px-4 py-2.5 font-semibold">Free Tool</th><th className="text-left px-4 py-2.5 font-semibold">Parsli API</th></tr></thead>
              <tbody>
                {[
                  ["Text extraction", "Raw text as JSON", "Structured fields"],
                  ["Custom schemas", "No", "Yes (any fields)"],
                  ["Scanned PDFs", "No", "Yes (OCR + AI)"],
                  ["API access", "No", "REST API"],
                  ["Batch processing", "One file", "Thousands/day"],
                  ["Webhook delivery", "No", "Yes"],
                  ["Price", "Free forever", "Free tier + paid"],
                ].map(([f, free, ai]) => (<tr key={f} className="border-t"><td className="px-4 py-2 font-medium">{f}</td><td className="px-4 py-2 text-muted-foreground">{free}</td><td className="px-4 py-2 text-muted-foreground">{ai}</td></tr>))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="py-12 sm:py-16"><div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8"><h2 className="text-lg font-semibold text-center mb-8">Works everywhere &mdash; no install needed</h2><div className="grid grid-cols-3 gap-6 max-w-md mx-auto">{[{ icon: Monitor, label: "Desktop", sub: "Chrome, Firefox, Safari, Edge" },{ icon: Smartphone, label: "Mobile", sub: "iOS, Android" },{ icon: Tablet, label: "Tablet", sub: "iPad, Android tablets" }].map((d) => (<div key={d.label} className="text-center"><d.icon className="h-6 w-6 mx-auto text-muted-foreground mb-2" /><p className="text-xs text-muted-foreground">{d.label}</p><p className="text-[10px] text-muted-foreground/60">{d.sub}</p></div>))}</div></div></section>

      <section className="py-16 sm:py-20 bg-muted/30 border-t">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 text-primary mb-6"><Sparkles className="h-7 w-7" /></div>
          <h2 className="text-2xl sm:text-3xl font-bold mb-4">Need structured JSON from documents?</h2>
          <p className="text-muted-foreground max-w-xl mx-auto mb-8 leading-relaxed">Parsli&apos;s API extracts custom-schema JSON from any document. Define your fields, send documents, get typed JSON back. Free up to 30 pages/month.</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <AuthButton className="text-base px-8 h-12" showArrow>Try Parsli Free</AuthButton>
            <Button variant="outline" size="lg" className="text-base px-8 h-12" asChild><a href="https://calendly.com/talal-bytebeam/parsli-discovery-call" target="_blank" rel="noopener noreferrer">Book a demo</a></Button>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">No credit card required &middot; 30 free pages/month</p>
        </div>
      </section>

      <section className="py-12 sm:py-16 border-t">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-lg font-semibold mb-6">Related Resources</h2>
          <div className="flex flex-wrap gap-3">
            {[
              { href: "/tools/pdf-to-xml", label: "PDF to XML" },
              { href: "/tools/pdf-to-text", label: "PDF to Text" },
              { href: "/tools/excel-to-json", label: "Excel to JSON" },
              { href: "/tools/pdf-to-excel", label: "PDF to Excel" },
              { href: "/solutions/document-parsing-api", label: "Document Parsing API" },
              { href: "/use-cases/pdf-to-json", label: "PDF to JSON Use Case" },
              { href: "/docs", label: "API Documentation" },
              { href: "/pricing", label: "Pricing" },
            ].map((link) => (<Link key={link.href} href={link.href} className="inline-flex items-center gap-1.5 rounded-lg border bg-card px-4 py-2 text-sm hover:border-primary/30 transition-colors">{link.label} <ArrowRight className="h-3 w-3 text-muted-foreground" /></Link>))}
          </div>
        </div>
      </section>
    </>
  )
}
