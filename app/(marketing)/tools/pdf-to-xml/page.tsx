import type { Metadata } from "next"
import Link from "next/link"
import {
  Shield, Zap, UserX, Upload, Download, ArrowRight, Sparkles, FileText,
  Code2, Monitor, Smartphone, Tablet, Users, GraduationCap, Building2,
  Lightbulb, Star, FileCode, Briefcase,
} from "lucide-react"
import { PdfToXmlTool } from "@/components/tools/PdfToXmlTool"
import { AuthButton } from "@/components/marketing/shared/AuthButton"
import { Button } from "@/components/ui/button"
import { JsonLd } from "@/components/marketing/shared/JsonLd"
import { breadcrumbJsonLd } from "@/lib/seo/json-ld"

export const metadata: Metadata = {
  title: "PDF to XML Converter — Free, Instant, No Sign-Up | Parsli",
  description:
    "Convert PDF documents to structured XML format instantly. Free PDF to XML converter runs in your browser — no sign-up, no server uploads. Perfect for enterprise data integration.",
  keywords: [
    "pdf to xml", "pdf to xml converter", "convert pdf to xml", "pdf to xml free",
    "pdf to xml file converter", "pdf to xml format", "pdf to xml online",
    "convert pdf to xml free", "pdf xml converter", "pdf to xml conversion",
  ],
  alternates: { canonical: "https://parsli.co/tools/pdf-to-xml" },
  openGraph: {
    title: "PDF to XML Converter — Free, Instant, No Sign-Up | Parsli",
    description: "Convert PDF documents to structured XML format. Free, no sign-up required.",
    url: "https://parsli.co/tools/pdf-to-xml",
  },
}

const features = [
  { icon: Shield, title: "Private & secure", description: "Your PDF is processed entirely in your browser. Files never leave your device — nothing is uploaded to any server." },
  { icon: UserX, title: "No sign-up required", description: "Use it instantly. No account, no registration, no email required." },
  { icon: Zap, title: "Free & unlimited", description: "No limits, no watermarks, no paywalls. Convert as many PDFs to XML as you need." },
]

const steps = [
  { icon: Upload, title: "Upload your PDF", description: "Drag and drop any text-based PDF document. Up to 50 MB." },
  { icon: FileCode, title: "XML is generated", description: "The tool extracts text from every page and outputs well-formed XML with document metadata." },
  { icon: Download, title: "Copy or download", description: "Copy the XML to your clipboard or download as a .xml file. All XML special characters are properly escaped." },
]

const personas = [
  { icon: Building2, title: "Enterprise IT Teams", description: "Convert PDF reports to XML for ERP imports, system integrations, and data warehouse ingestion." },
  { icon: Briefcase, title: "Healthcare Data Engineers", description: "Extract document content as XML for HL7/FHIR pipelines and clinical data workflows." },
  { icon: Users, title: "Government & Compliance", description: "Convert PDF filings to XML format required by regulatory systems and e-government platforms." },
  { icon: GraduationCap, title: "Financial Reporting Teams", description: "Extract PDF financial data as XML for XBRL reporting and regulatory submission." },
]

const faqs = [
  { q: "How does PDF to XML conversion work?", a: "The tool reads your PDF using pdf.js, extracts text content from each page, and structures it as well-formed XML with document metadata (filename, page count, timestamps) and per-page content elements. All XML special characters are properly escaped." },
  { q: "Is this tool free?", a: "Yes, completely free with no limits. No account, no sign-up, no credit card. Everything runs in your browser." },
  { q: "Do you store my files?", a: "No. All processing happens client-side in your browser. Your PDF never leaves your device and is never sent to any server." },
  { q: "Is the XML output well-formed?", a: "Yes. The output is valid XML with proper encoding declaration, escaped special characters (&, <, >, etc.), and structured element hierarchy." },
  { q: "Can it extract structured fields as XML elements?", a: "This free tool outputs page text as content elements. For custom XML field extraction (specific data points from invoices, forms, etc.), use Parsli AI where you define a schema and get structured output." },
  { q: "Does it handle scanned PDFs?", a: "This tool works with text-based PDFs. For scanned/image-based PDFs needing OCR, use Parsli AI which includes AI-powered text recognition." },
  { q: "Why convert PDF to XML?", a: "XML is the standard format for enterprise data interchange. Industries like healthcare (HL7), finance (XBRL), government (e-filing), and publishing (DITA) require XML for system integration and regulatory compliance." },
  { q: "What about PDF to JSON instead?", a: "If you need JSON format, use our PDF to JSON tool. JSON is preferred for web APIs and modern applications, while XML is standard in enterprise, healthcare, and government systems." },
  { q: "What's the maximum file size?", a: "Up to 50 MB. Since processing happens in your browser, very large files may take longer." },
  { q: "Does this work on mobile?", a: "Yes. Works on any modern mobile browser. Upload your PDF and copy or download the XML output." },
]

export default function PdfToXmlToolPage() {
  return (
    <>
      <JsonLd data={breadcrumbJsonLd([
        { name: "Home", url: "https://parsli.co" },
        { name: "Tools", url: "https://parsli.co/tools" },
        { name: "PDF to XML", url: "https://parsli.co/tools/pdf-to-xml" },
      ])} />
      <JsonLd data={{ "@context": "https://schema.org", "@type": "SoftwareApplication", name: "Parsli PDF to XML Converter", description: "Free browser-based tool to convert PDF documents to structured XML format. No sign-up required.", applicationCategory: "DeveloperApplication", operatingSystem: "Web Browser", offers: { "@type": "Offer", price: "0", priceCurrency: "USD" } }} />
      <JsonLd data={{ "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faqs.map((faq) => ({ "@type": "Question", name: faq.q, acceptedAnswer: { "@type": "Answer", text: faq.a } })) }} />

      <section className="relative pt-24 sm:pt-28 pb-16">
        <div className="absolute inset-0 -z-10"><div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-primary/5 rounded-full blur-3xl" /></div>
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border bg-card px-4 py-1.5 text-sm text-muted-foreground mb-6"><FileCode className="h-4 w-4 text-primary" />PDF to XML</div>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight leading-[1.1] mb-4">Convert PDF to XML</h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-3">Structured XML from any PDF — free, instant, no sign-up</p>
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-10">
            <div className="flex items-center gap-0.5 text-yellow-500">{[...Array(5)].map((_, i) => (<Star key={i} className="h-3.5 w-3.5 fill-current" />))}</div>
            <span>Well-formed XML output</span>
          </div>
          <PdfToXmlTool />
          <p className="mt-6 text-xs text-muted-foreground">100% client-side processing &middot; No data sent to any server &middot; Valid XML with proper escaping</p>
        </div>
      </section>

      <section className="py-10 sm:py-12 border-t">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-xl border bg-card p-6 sm:p-8 flex flex-col sm:flex-row items-start gap-5">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 text-primary shrink-0"><Code2 className="h-6 w-6" /></div>
            <div className="flex-1">
              <h2 className="font-semibold text-lg mb-1">Need structured XML extraction via API?</h2>
              <p className="text-sm text-muted-foreground leading-relaxed mb-4">Parsli&apos;s API extracts custom-schema data from any document type. Define XML-compatible field structures and integrate with enterprise systems via REST API or webhooks.</p>
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
            Prefer JSON? <Link href="/tools/pdf-to-json" className="text-primary hover:underline underline-offset-4">PDF to JSON</Link>. For spreadsheets, try <Link href="/tools/pdf-to-excel" className="text-primary hover:underline underline-offset-4">PDF to Excel</Link>. For plain text, use <Link href="/tools/pdf-to-text" className="text-primary hover:underline underline-offset-4">PDF to Text</Link>.
          </p>
        </div>
      </section>

      <section className="py-16 sm:py-20 bg-muted/30"><div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8"><h2 className="text-2xl sm:text-3xl font-bold text-center mb-12">Why use this PDF to XML converter</h2><div className="grid md:grid-cols-3 gap-6">{features.map((f) => (<div key={f.title} className="rounded-xl border bg-card p-6 text-center"><div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 text-primary mb-4"><f.icon className="h-6 w-6" /></div><h3 className="font-semibold text-lg mb-2">{f.title}</h3><p className="text-sm text-muted-foreground leading-relaxed">{f.description}</p></div>))}</div></div></section>

      <section className="py-16 sm:py-20"><div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8"><h2 className="text-2xl sm:text-3xl font-bold text-center mb-12">How it works</h2><div className="grid md:grid-cols-3 gap-8">{steps.map((step, i) => (<div key={step.title} className="relative rounded-xl border bg-card p-6 text-center"><div className="absolute top-4 right-4 text-xs font-bold text-muted-foreground/40">{i + 1}</div><div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary mb-4"><step.icon className="h-6 w-6" /></div><h3 className="font-semibold text-lg mb-2">{step.title}</h3><p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p></div>))}</div></div></section>

      <section className="py-16 sm:py-20 bg-muted/30">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-12">What this tool handles</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="rounded-xl border bg-card p-6"><h3 className="font-semibold text-lg mb-4 flex items-center gap-2"><FileText className="h-5 w-5 text-primary" />Works great with</h3><ul className="space-y-3 text-sm text-muted-foreground">{["Text-based PDF documents", "Reports, filings, and regulatory documents", "Multi-page documents with structured content", "PDF exports from enterprise software", "Digital forms and templates"].map((item) => (<li key={item} className="flex items-start gap-2"><span className="text-green-600 mt-0.5">&#10003;</span>{item}</li>))}</ul></div>
            <div className="rounded-xl border bg-card p-6"><h3 className="font-semibold text-lg mb-4 flex items-center gap-2"><Sparkles className="h-5 w-5 text-primary" />For these, try Parsli AI</h3><ul className="space-y-3 text-sm text-muted-foreground">{["Custom element/field mapping", "Scanned PDFs requiring OCR", "XBRL-compatible financial data", "Batch conversion via API", "Automated XML delivery via webhooks"].map((item) => (<li key={item} className="flex items-start gap-2"><ArrowRight className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />{item}</li>))}</ul></div>
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-20"><div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8"><h2 className="text-2xl sm:text-3xl font-bold text-center mb-12">Perfect for</h2><div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">{personas.map((p) => (<div key={p.title} className="rounded-xl border bg-card p-5 hover:border-primary/30 transition-colors"><p.icon className="h-5 w-5 text-primary mb-3" /><h3 className="font-semibold text-sm mb-1">{p.title}</h3><p className="text-xs text-muted-foreground leading-relaxed">{p.description}</p></div>))}</div></div></section>

      <section className="py-16 sm:py-20"><div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8"><h2 className="text-2xl sm:text-3xl font-bold text-center mb-12">Frequently asked questions</h2><div className="grid sm:grid-cols-2 gap-6">{faqs.map((faq) => (<div key={faq.q} className="rounded-xl border bg-card p-5"><h3 className="font-semibold text-sm mb-2">{faq.q}</h3><p className="text-xs text-muted-foreground leading-relaxed">{faq.a}</p></div>))}</div></div></section>

      <section className="py-16 sm:py-20 bg-muted/30 border-t">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-xl sm:text-2xl font-bold mb-4">Why XML Still Matters in 2026</h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            XML (Extensible Markup Language), standardized by the <a href="https://www.w3.org/XML/" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">W3C since 1998</a>, remains the backbone of enterprise data interchange. While JSON dominates web APIs, XML is the required format in several mission-critical industries.
          </p>
          <p className="text-muted-foreground leading-relaxed mb-4">
            According to MuleSoft&apos;s Connectivity Benchmark Report (2024), 47% of enterprise integrations still use XML-based formats. In healthcare, the <a href="https://www.hl7.org/fhir/" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">HL7 FHIR standard</a> supports both XML and JSON, but legacy clinical systems predominantly use XML. The IRS processes over 150 million tax returns annually through its XML-based MeF (Modernized e-File) system. Financial regulators worldwide require <a href="https://www.xbrl.org/" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">XBRL</a> (XML-based) for financial reporting.
          </p>

          <h2 className="text-xl sm:text-2xl font-bold mt-10 mb-4">Free Converter vs Parsli API</h2>
          <div className="border rounded-lg overflow-hidden mb-6">
            <table className="w-full text-sm">
              <thead className="bg-muted/50"><tr><th className="text-left px-4 py-2.5 font-semibold">Feature</th><th className="text-left px-4 py-2.5 font-semibold">Free Tool</th><th className="text-left px-4 py-2.5 font-semibold">Parsli API</th></tr></thead>
              <tbody>
                {[
                  ["Text extraction", "Page-level XML", "Custom elements"],
                  ["Scanned PDFs", "No", "Yes (OCR + AI)"],
                  ["Custom XML schema", "No", "Yes"],
                  ["API access", "No", "REST API"],
                  ["Batch processing", "One file", "Thousands/day"],
                  ["XBRL/HL7 mapping", "No", "Custom schemas"],
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
          <h2 className="text-2xl sm:text-3xl font-bold mb-4">Need enterprise-grade document extraction?</h2>
          <p className="text-muted-foreground max-w-xl mx-auto mb-8 leading-relaxed">Parsli extracts structured data from any document into any format — JSON, XML, CSV. Connect to your systems via API and webhooks. Free up to 30 pages/month.</p>
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
              { href: "/tools/pdf-to-json", label: "PDF to JSON" },
              { href: "/tools/pdf-to-text", label: "PDF to Text" },
              { href: "/tools/pdf-to-excel", label: "PDF to Excel" },
              { href: "/tools/pdf-to-google-sheets", label: "PDF to Google Sheets" },
              { href: "/solutions/document-parsing-api", label: "Document Parsing API" },
              { href: "/docs", label: "API Documentation" },
              { href: "/pricing", label: "Pricing" },
            ].map((link) => (<Link key={link.href} href={link.href} className="inline-flex items-center gap-1.5 rounded-lg border bg-card px-4 py-2 text-sm hover:border-primary/30 transition-colors">{link.label} <ArrowRight className="h-3 w-3 text-muted-foreground" /></Link>))}
          </div>
        </div>
      </section>
    </>
  )
}
