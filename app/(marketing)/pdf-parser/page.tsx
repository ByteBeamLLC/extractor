import type { Metadata } from "next"
import Link from "next/link"
import {
  FileText, ArrowRight, Sparkles, Shield, Zap, Check, Brain,
  FileSpreadsheet, Code2, Workflow, Upload, Table, ScanText, Layers,
} from "lucide-react"
import { AuthButton } from "@/components/marketing/shared/AuthButton"
import { Button } from "@/components/ui/button"
import { JsonLd } from "@/components/marketing/shared/JsonLd"
import { breadcrumbJsonLd } from "@/lib/seo/json-ld"

export const metadata: Metadata = {
  title: "AI PDF Parser — Extract Structured Data from Any PDF | Parsli",
  description:
    "AI-powered PDF parser that extracts tables, text, and structured data from any PDF. Handles scanned PDFs, complex layouts, and multi-page documents. Free plan included.",
  keywords: [
    "pdf parser", "pdf parsing software", "pdf data extraction",
    "parse pdf", "pdf parsing tool", "ai pdf parser", "pdf parser api",
    "extract data from pdf", "pdf parsing", "pdf document parser",
  ],
  alternates: { canonical: "https://parsli.co/pdf-parser" },
  openGraph: {
    title: "AI PDF Parser — Extract Structured Data from Any PDF | Parsli",
    description: "Parse any PDF into structured data. AI-powered, handles scans and complex layouts. Free plan.",
    url: "https://parsli.co/pdf-parser",
  },
}

const capabilities = [
  { icon: Brain, title: "AI Document Understanding", description: "Google Gemini 2.5 Pro reads PDFs the way a human would — understanding context, layout, and meaning. No templates to configure or zones to draw." },
  { icon: Table, title: "Table Extraction", description: "Detects and extracts tables with rows, columns, and headers preserved. Handles multi-page tables, merged cells, and nested line items." },
  { icon: ScanText, title: "Scanned PDF Support", description: "Built-in OCR handles scanned documents, photos, and image-based PDFs. No separate OCR tool needed." },
  { icon: Layers, title: "Custom Schemas", description: "Define exactly what fields to extract with the no-code schema builder. Set field types, mark required fields, and get consistent output." },
  { icon: FileSpreadsheet, title: "Multiple Output Formats", description: "Get extracted data as JSON, CSV, or auto-filled Google Sheets. Download or push to integrations automatically." },
  { icon: Code2, title: "REST API", description: "Upload PDFs via API, get structured JSON back. Batch process thousands of documents programmatically." },
]

const documentTypes = [
  "Invoices", "Bank Statements", "Receipts", "Contracts", "Purchase Orders",
  "Bills of Lading", "Tax Forms", "Insurance Claims", "Financial Reports",
  "Medical Records", "Delivery Notes", "Resumes / CVs",
]

const faqs = [
  { q: "What types of PDFs can Parsli parse?", a: "Any PDF — native (text-based), scanned (image-based), or mixed. Invoices, bank statements, contracts, forms, reports, receipts, and any other structured document. The AI adapts to any layout without templates." },
  { q: "How accurate is the PDF parsing?", a: "95%+ accuracy on most document types. For well-formatted documents like invoices and bank statements, accuracy is typically 98-99%. Scanned documents achieve 95%+ with built-in OCR." },
  { q: "Do I need to set up templates?", a: "No. Unlike traditional PDF parsers (Docparser, Parseur) that require template zones, Parsli uses AI that understands document context. You define a schema (what fields you want), and the AI finds them regardless of layout." },
  { q: "Can it handle multi-page PDFs?", a: "Yes. Parsli processes all pages and handles tables that span multiple pages. Data is extracted from the entire document in a single operation." },
  { q: "Is there a PDF parsing API?", a: "Yes. The REST API supports PDF upload, processing, and JSON result retrieval. Batch-process thousands of PDFs programmatically. Included on all plans." },
  { q: "How does this compare to pdfplumber or PyPDF?", a: "Libraries like pdfplumber require coding and break on layout changes. Parsli is no-code — define a schema and the AI handles extraction. It also handles scanned PDFs (which pdfplumber cannot) and outputs to Sheets, Zapier, etc." },
]

export default function PdfParserPage() {
  return (
    <>
      <JsonLd data={breadcrumbJsonLd([
        { name: "Home", url: "https://parsli.co" },
        { name: "PDF Parser", url: "https://parsli.co/pdf-parser" },
      ])} />
      <JsonLd data={{ "@context": "https://schema.org", "@type": "SoftwareApplication", name: "Parsli PDF Parser", description: "AI-powered PDF parsing software that extracts structured data from any PDF document.", applicationCategory: "BusinessApplication", operatingSystem: "Web Browser", offers: { "@type": "Offer", price: "0", priceCurrency: "USD" } }} />
      <JsonLd data={{ "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faqs.map((faq) => ({ "@type": "Question", name: faq.q, acceptedAnswer: { "@type": "Answer", text: faq.a } })) }} />

      <section className="relative pt-24 sm:pt-32 pb-16 sm:pb-20">
        <div className="absolute inset-0 -z-10"><div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-primary/5 rounded-full blur-3xl" /></div>
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border bg-card px-4 py-1.5 text-sm text-muted-foreground mb-6"><FileText className="h-4 w-4 text-primary" />PDF Parser</div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.08] mb-5">AI PDF Parser</h1>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-8 leading-relaxed">Extract structured data from any PDF — invoices, bank statements, contracts, forms. AI handles the layout. You define what fields you need.</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-4">
            <AuthButton className="text-base px-8 h-12" showArrow>Start Parsing PDFs Free</AuthButton>
            <Button variant="outline" size="lg" className="text-base px-8 h-12" asChild><Link href="/features">See All Features</Link></Button>
          </div>
          <p className="text-sm text-muted-foreground">No credit card required &middot; 30 free pages/month &middot; Handles scanned PDFs</p>
        </div>
      </section>

      <section className="py-8 border-y bg-muted/30">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 flex flex-wrap justify-center gap-8 text-sm text-muted-foreground">
          {[{ value: "95%+", label: "Accuracy" },{ value: "< 3s", label: "Per page" },{ value: "Any layout", label: "No templates needed" }].map((m) => (
            <div key={m.label} className="text-center"><span className="text-2xl font-bold text-foreground">{m.value}</span><p className="mt-0.5">{m.label}</p></div>
          ))}
        </div>
      </section>

      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-center mb-14">What makes Parsli&apos;s PDF parser different</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {capabilities.map((c) => (
              <div key={c.title} className="rounded-2xl border bg-card p-7"><div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary mb-4"><c.icon className="h-5 w-5" /></div><h3 className="font-semibold text-lg mb-2">{c.title}</h3><p className="text-sm text-muted-foreground leading-relaxed">{c.description}</p></div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-20 bg-muted/30 border-t">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-10">Parses any document type</h2>
          <div className="flex flex-wrap justify-center gap-3">
            {documentTypes.map((type) => (<span key={type} className="inline-flex items-center gap-1.5 rounded-full border bg-card px-4 py-2 text-sm"><Check className="h-3.5 w-3.5 text-primary" />{type}</span>))}
          </div>
          <div className="mt-6 text-center"><Link href="/document-types" className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline underline-offset-4">See all document types <ArrowRight className="h-3.5 w-3.5" /></Link></div>
        </div>
      </section>

      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-10">Parsli vs Traditional PDF Parsers</h2>
          <div className="border rounded-xl overflow-hidden bg-card">
            <table className="w-full text-sm">
              <thead className="bg-muted/50"><tr><th className="text-left px-5 py-3 font-semibold">Feature</th><th className="text-left px-5 py-3 font-semibold text-primary">Parsli</th><th className="text-left px-5 py-3 font-semibold">Docparser / Parseur</th><th className="text-left px-5 py-3 font-semibold">pdfplumber / Code</th></tr></thead>
              <tbody>
                {[
                  ["Extraction method", "AI (Gemini 2.5 Pro)", "Template zones", "Code rules"],
                  ["Setup required", "Define schema (2 min)", "Draw zones per template", "Write parsing code"],
                  ["Handles layout changes", "Automatically", "Breaks (new template)", "Breaks (new code)"],
                  ["Scanned PDFs", "Built-in OCR", "Some (add-on)", "No (separate OCR)"],
                  ["Table extraction", "AI-detected", "Manual zone", "Code-dependent"],
                  ["Google Sheets", "Native", "CSV export", "Manual"],
                  ["API", "REST API + webhooks", "Limited", "You build it"],
                  ["Free tier", "30 pages/month", "Limited trial", "Open source"],
                ].map(([f, p, d, c]) => (<tr key={f} className="border-t"><td className="px-5 py-2.5 font-medium">{f}</td><td className="px-5 py-2.5 text-primary font-medium">{p}</td><td className="px-5 py-2.5 text-muted-foreground">{d}</td><td className="px-5 py-2.5 text-muted-foreground">{c}</td></tr>))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-20 bg-muted/30 border-t">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-xl sm:text-2xl font-bold mb-4">The Evolution of PDF Parsing</h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            PDF (Portable Document Format), created by Adobe co-founder John Warnock in 1993 and standardized as <a href="https://www.iso.org/standard/75839.html" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">ISO 32000</a>, was designed to preserve visual fidelity across devices — not for data extraction. This fundamental design choice means that extracting structured data from PDFs has always been a challenge.
          </p>
          <p className="text-muted-foreground leading-relaxed mb-4">
            First-generation PDF parsers used coordinate-based extraction (drawing zones on a template). Second-generation tools like pdfplumber and Tabula used layout analysis algorithms. Third-generation tools — like Parsli — use multimodal AI that understands both visual layout and textual content, achieving what the International Association for AI Research calls &ldquo;document understanding&rdquo; rather than mere text extraction.
          </p>
          <p className="text-muted-foreground leading-relaxed mb-4">
            According to Grand View Research, the document parsing market is growing at 13.7% CAGR through 2030, driven primarily by AI-powered approaches replacing template-based tools. Organizations processing 100+ PDFs monthly save an average of 15-20 hours per week by switching from manual extraction to AI parsing (source: <a href="https://www.aiim.org" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">AIIM Industry Watch</a>).
          </p>
        </div>
      </section>

      <section className="py-16 sm:py-20"><div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8"><h2 className="text-2xl sm:text-3xl font-bold text-center mb-12">Frequently asked questions</h2><div className="divide-y rounded-2xl border bg-card">{faqs.map((faq) => (<details key={faq.q} className="group"><summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-6 py-5 text-sm font-semibold sm:text-base [&::-webkit-details-marker]:hidden">{faq.q}<ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-90" /></summary><div className="px-6 pb-5 text-sm leading-7 text-muted-foreground">{faq.a}</div></details>))}</div></div></section>

      <section className="py-16 sm:py-24 bg-slate-950">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">Stop wrestling with PDF data.</h2>
          <p className="mt-4 text-lg leading-8 text-slate-400">Upload your first PDF. Define what fields you need. Get structured data back in seconds. Free plan included.</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <AuthButton className="h-12 px-8 text-base" showArrow>Start Parsing PDFs Free</AuthButton>
            <Button variant="outline" size="lg" className="h-12 px-7 text-base border-white/20 text-white hover:bg-white/10" asChild><a href="https://calendly.com/talal-bytebeam/parsli-discovery-call" target="_blank" rel="noopener noreferrer">Book a Demo</a></Button>
          </div>
        </div>
      </section>

      <section className="py-12 sm:py-16 border-t">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-lg font-semibold mb-6">Related</h2>
          <div className="flex flex-wrap gap-3">
            {[
              { href: "/email-parser", label: "Email Parser" },
              { href: "/ocr-software", label: "OCR Software" },
              { href: "/features", label: "All Features" },
              { href: "/tools/pdf-to-excel", label: "Free PDF to Excel" },
              { href: "/tools/pdf-to-json", label: "Free PDF to JSON" },
              { href: "/tools/pdf-to-xml", label: "Free PDF to XML" },
              { href: "/solutions/document-parsing-api", label: "Document Parsing API" },
              { href: "/compare/docparser", label: "Parsli vs Docparser" },
              { href: "/pricing", label: "Pricing" },
            ].map((link) => (<Link key={link.href} href={link.href} className="inline-flex items-center gap-1.5 rounded-lg border bg-card px-4 py-2 text-sm hover:border-primary/30 transition-colors">{link.label} <ArrowRight className="h-3 w-3 text-muted-foreground" /></Link>))}
          </div>
        </div>
      </section>
    </>
  )
}
