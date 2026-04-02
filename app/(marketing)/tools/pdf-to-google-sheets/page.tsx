import type { Metadata } from "next"
import Link from "next/link"
import {
  Shield, Zap, UserX, Upload, Download, ArrowRight, Sparkles, FileText,
  Code2, Monitor, Smartphone, Tablet, Users, GraduationCap, Building2,
  Lightbulb, Star, FileSpreadsheet, Briefcase, Table,
} from "lucide-react"
import { PdfToExcelTool } from "@/components/tools/PdfToExcelTool"
import { AuthButton } from "@/components/marketing/shared/AuthButton"
import { Button } from "@/components/ui/button"
import { JsonLd } from "@/components/marketing/shared/JsonLd"
import { breadcrumbJsonLd } from "@/lib/seo/json-ld"

export const metadata: Metadata = {
  title: "PDF to Google Sheets Converter — Free, Instant | Parsli",
  description:
    "Convert PDF tables and data to Google Sheets format instantly. Free PDF to Google Sheets converter runs in your browser. Download as CSV and import directly into Google Sheets.",
  keywords: [
    "convert pdf to google sheets", "pdf to google sheets", "pdf to google spreadsheet",
    "pdf to google sheets converter", "import pdf to google sheets", "pdf to google sheets free",
    "import pdf into google sheets", "pdf table to google sheets", "pdf data to google sheets",
    "convert pdf to spreadsheet",
  ],
  alternates: { canonical: "https://parsli.co/tools/pdf-to-google-sheets" },
  openGraph: {
    title: "PDF to Google Sheets Converter — Free, Instant | Parsli",
    description: "Convert PDF data to Google Sheets format. Free, no sign-up required.",
    url: "https://parsli.co/tools/pdf-to-google-sheets",
  },
}

const features = [
  { icon: Shield, title: "Private & secure", description: "Your PDF is processed entirely in your browser. Files never leave your device — nothing is uploaded to any server." },
  { icon: UserX, title: "No sign-up required", description: "Use it instantly. No Google account linking, no permissions, no email required." },
  { icon: Zap, title: "Free & unlimited", description: "No limits, no watermarks, no paywalls. Convert as many PDFs as you need." },
]

const steps = [
  { icon: Upload, title: "Upload your PDF", description: "Drag and drop any PDF with tables or structured data. Text-based PDFs work instantly." },
  { icon: Table, title: "Tables are extracted", description: "The tool detects table structure and extracts data into rows and columns, preserving formatting." },
  { icon: FileSpreadsheet, title: "Open in Google Sheets", description: "Download as CSV or Excel, then open in Google Sheets. Or use Parsli AI for direct Google Sheets sync." },
]

const personas = [
  { icon: Briefcase, title: "Accountants & Bookkeepers", description: "Extract financial data from PDF bank statements, invoices, and reports into Google Sheets for analysis." },
  { icon: Users, title: "Data Analysts", description: "Pull tabular data from PDF reports and research documents into Sheets for visualization and formulas." },
  { icon: GraduationCap, title: "Project Managers", description: "Convert PDF timesheets, status reports, and budget documents into editable spreadsheets." },
  { icon: Building2, title: "Small Business Owners", description: "Get invoice data, expense reports, and vendor statements into Google Sheets without retyping." },
]

const faqs = [
  { q: "How do I convert a PDF to Google Sheets?", a: "Upload your PDF here, download the extracted data as CSV or Excel, then open that file in Google Sheets (File > Import). For automated PDF-to-Sheets syncing, Parsli AI connects directly to your Google Sheets." },
  { q: "Is this converter free?", a: "Yes, completely free with no limits. No account, no sign-up, no credit card. The tool runs in your browser and never uploads your files." },
  { q: "Will it preserve my table formatting?", a: "Yes. The tool detects rows, columns, and headers from your PDF tables. The extracted data maintains the original structure so it's ready to use in Google Sheets." },
  { q: "Can it handle scanned PDFs?", a: "This free tool works best with text-based (digital) PDFs. For scanned PDFs that need OCR, use Parsli AI which uses Google Gemini for 95%+ accuracy on scanned documents." },
  { q: "Do you access my Google account?", a: "No. This tool doesn't connect to Google at all. It extracts data from your PDF and gives you a downloadable CSV/Excel file that you import into Google Sheets yourself." },
  { q: "What about multi-page PDFs?", a: "The tool extracts data from all pages of your PDF. Multi-page tables are combined into a single output file." },
  { q: "Can I automate PDF to Google Sheets?", a: "Yes — Parsli AI has a native Google Sheets integration. Set up a parser with a schema, and extracted data flows to your spreadsheet automatically. Free for up to 30 pages/month." },
  { q: "Why not just copy-paste from PDF?", a: "Copy-pasting from PDFs typically breaks table formatting — columns misalign, data ends up in wrong cells, and numbers merge with text. This tool extracts structured data that preserves your table layout." },
  { q: "What's the file size limit?", a: "Up to 50 MB. Since everything runs in your browser, very large files may take a moment depending on your device." },
  { q: "Does this work on mobile?", a: "Yes. Works on iPhone, iPad, and Android devices in any modern browser. Download the CSV and open it in the Google Sheets mobile app." },
]

export default function PdfToGoogleSheetsToolPage() {
  return (
    <>
      <JsonLd data={breadcrumbJsonLd([
        { name: "Home", url: "https://parsli.co" },
        { name: "Tools", url: "https://parsli.co/tools" },
        { name: "PDF to Google Sheets", url: "https://parsli.co/tools/pdf-to-google-sheets" },
      ])} />
      <JsonLd data={{ "@context": "https://schema.org", "@type": "SoftwareApplication", name: "Parsli PDF to Google Sheets Converter", description: "Free tool to convert PDF tables and data to Google Sheets format. Download as CSV/Excel and import into Sheets.", applicationCategory: "UtilitiesApplication", operatingSystem: "Web Browser", offers: { "@type": "Offer", price: "0", priceCurrency: "USD" } }} />
      <JsonLd data={{ "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faqs.map((faq) => ({ "@type": "Question", name: faq.q, acceptedAnswer: { "@type": "Answer", text: faq.a } })) }} />

      <section className="relative pt-24 sm:pt-28 pb-16">
        <div className="absolute inset-0 -z-10"><div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-primary/5 rounded-full blur-3xl" /></div>
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border bg-card px-4 py-1.5 text-sm text-muted-foreground mb-6"><FileSpreadsheet className="h-4 w-4 text-primary" />PDF to Google Sheets</div>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight leading-[1.1] mb-4">Convert PDF to Google Sheets</h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-3">Extract tables and data from PDFs — download and open in Sheets</p>
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-10">
            <div className="flex items-center gap-0.5 text-yellow-500">{[...Array(5)].map((_, i) => (<Star key={i} className="h-3.5 w-3.5 fill-current" />))}</div>
            <span>Trusted by thousands of users</span>
          </div>
          <PdfToExcelTool />
          <p className="mt-6 text-xs text-muted-foreground">100% client-side processing &middot; Download as CSV or Excel &middot; Import into Google Sheets</p>
        </div>
      </section>

      <section className="py-10 sm:py-12 border-t">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-xl border bg-card p-6 sm:p-8 flex flex-col sm:flex-row items-start gap-5">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 text-primary shrink-0"><FileSpreadsheet className="h-6 w-6" /></div>
            <div className="flex-1">
              <h2 className="font-semibold text-lg mb-1">Want PDFs to sync directly to Google Sheets?</h2>
              <p className="text-sm text-muted-foreground leading-relaxed mb-4">Parsli&apos;s native Google Sheets integration sends extracted data to your spreadsheet automatically. Set up a parser once, then email or upload documents — data appears in Sheets in seconds.</p>
              <div className="flex items-center gap-4">
                <Link href="/integrations/google-sheets" className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline underline-offset-4">Google Sheets Integration <ArrowRight className="h-3.5 w-3.5" /></Link>
                <Link href="/docs" className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Docs</Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="pb-10 sm:pb-12">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <p className="text-sm text-muted-foreground text-center leading-relaxed">
            Need Excel format? <Link href="/tools/pdf-to-excel" className="text-primary hover:underline underline-offset-4">PDF to Excel</Link> does that. To extract specific tables, try <Link href="/tools/pdf-table-extractor" className="text-primary hover:underline underline-offset-4">PDF Table Extractor</Link>. For text-only extraction, use <Link href="/tools/pdf-to-text" className="text-primary hover:underline underline-offset-4">PDF to Text</Link>.
          </p>
        </div>
      </section>

      <section className="py-16 sm:py-20 bg-muted/30">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-12">Why use this PDF to Google Sheets converter</h2>
          <div className="grid md:grid-cols-3 gap-6">{features.map((f) => (<div key={f.title} className="rounded-xl border bg-card p-6 text-center"><div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 text-primary mb-4"><f.icon className="h-6 w-6" /></div><h3 className="font-semibold text-lg mb-2">{f.title}</h3><p className="text-sm text-muted-foreground leading-relaxed">{f.description}</p></div>))}</div>
        </div>
      </section>

      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-12">How it works</h2>
          <div className="grid md:grid-cols-3 gap-8">{steps.map((step, i) => (<div key={step.title} className="relative rounded-xl border bg-card p-6 text-center"><div className="absolute top-4 right-4 text-xs font-bold text-muted-foreground/40">{i + 1}</div><div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary mb-4"><step.icon className="h-6 w-6" /></div><h3 className="font-semibold text-lg mb-2">{step.title}</h3><p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p></div>))}</div>
        </div>
      </section>

      <section className="py-16 sm:py-20 bg-muted/30">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-12">What this tool handles</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="rounded-xl border bg-card p-6">
              <h3 className="font-semibold text-lg mb-4 flex items-center gap-2"><FileText className="h-5 w-5 text-primary" />Works great with</h3>
              <ul className="space-y-3 text-sm text-muted-foreground">{["PDF tables with clear row/column structure", "Bank statements and financial reports", "Invoices with line items", "Data exports and report downloads", "Government forms and tax documents"].map((item) => (<li key={item} className="flex items-start gap-2"><span className="text-green-600 mt-0.5">&#10003;</span>{item}</li>))}</ul>
            </div>
            <div className="rounded-xl border bg-card p-6">
              <h3 className="font-semibold text-lg mb-4 flex items-center gap-2"><Sparkles className="h-5 w-5 text-primary" />For these, try Parsli AI</h3>
              <ul className="space-y-3 text-sm text-muted-foreground">{["Scanned PDFs needing OCR", "Complex multi-table layouts", "Automatic Sheets syncing (no download)", "Custom extraction schemas", "Batch processing via API"].map((item) => (<li key={item} className="flex items-start gap-2"><ArrowRight className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />{item}</li>))}</ul>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-12">Perfect for</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">{personas.map((p) => (<div key={p.title} className="rounded-xl border bg-card p-5 hover:border-primary/30 transition-colors"><p.icon className="h-5 w-5 text-primary mb-3" /><h3 className="font-semibold text-sm mb-1">{p.title}</h3><p className="text-xs text-muted-foreground leading-relaxed">{p.description}</p></div>))}</div>
        </div>
      </section>

      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-12">Frequently asked questions</h2>
          <div className="grid sm:grid-cols-2 gap-6">{faqs.map((faq) => (<div key={faq.q} className="rounded-xl border bg-card p-5"><h3 className="font-semibold text-sm mb-2">{faq.q}</h3><p className="text-xs text-muted-foreground leading-relaxed">{faq.a}</p></div>))}</div>
        </div>
      </section>

      <section className="py-16 sm:py-20 bg-muted/30 border-t">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-xl sm:text-2xl font-bold mb-4">Why PDF to Google Sheets Is One of the Most Common Office Tasks</h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            Google Sheets has over 900 million users worldwide (source: <a href="https://workspace.google.com/blog/" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">Google Workspace Blog, 2024</a>), making it the most popular cloud spreadsheet application. Yet the PDF format — created by Adobe in 1993 and standardized as ISO 32000 in 2008 — was designed for viewing, not for data extraction.
          </p>
          <p className="text-muted-foreground leading-relaxed mb-4">
            According to Zapier&apos;s State of Business Automation report (2024), PDF-to-spreadsheet conversion is one of the top 10 most frequently automated office tasks. A McKinsey Global Institute study found that knowledge workers spend 19% of their working time searching for and gathering information from documents — much of it locked in PDFs.
          </p>

          <h2 className="text-xl sm:text-2xl font-bold mt-10 mb-4">Free Converter vs Parsli AI: Google Sheets Integration</h2>
          <div className="border rounded-lg overflow-hidden mb-6">
            <table className="w-full text-sm">
              <thead className="bg-muted/50"><tr><th className="text-left px-4 py-2.5 font-semibold">Feature</th><th className="text-left px-4 py-2.5 font-semibold">Free Converter</th><th className="text-left px-4 py-2.5 font-semibold">Parsli AI + Sheets</th></tr></thead>
              <tbody>
                {[
                  ["Table extraction", "Yes (text PDFs)", "Yes (all PDFs)"],
                  ["Scanned PDF support", "No", "Yes (OCR)"],
                  ["Google Sheets sync", "Manual import", "Automatic"],
                  ["Custom field mapping", "No", "Yes (schemas)"],
                  ["Batch processing", "One at a time", "Via API / email"],
                  ["Real-time updates", "No", "Yes"],
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
          <h2 className="text-2xl sm:text-3xl font-bold mb-4">Stop copy-pasting from PDFs into Sheets.</h2>
          <p className="text-muted-foreground max-w-xl mx-auto mb-8 leading-relaxed">Parsli syncs PDF data directly to Google Sheets. Define what fields you need, and extracted data flows to your spreadsheet automatically. Free up to 30 pages/month.</p>
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
              { href: "/tools/pdf-to-excel", label: "PDF to Excel" },
              { href: "/tools/pdf-table-extractor", label: "PDF Table Extractor" },
              { href: "/tools/pdf-to-text", label: "PDF to Text" },
              { href: "/tools/pdf-to-json", label: "PDF to JSON" },
              { href: "/integrations/google-sheets", label: "Google Sheets Integration" },
              { href: "/solutions/pdf-to-excel", label: "PDF to Excel Solution" },
              { href: "/guides/pdf-to-google-sheets-automation", label: "Automation Guide" },
              { href: "/pricing", label: "Pricing" },
            ].map((link) => (<Link key={link.href} href={link.href} className="inline-flex items-center gap-1.5 rounded-lg border bg-card px-4 py-2 text-sm hover:border-primary/30 transition-colors">{link.label} <ArrowRight className="h-3 w-3 text-muted-foreground" /></Link>))}
          </div>
        </div>
      </section>
    </>
  )
}
