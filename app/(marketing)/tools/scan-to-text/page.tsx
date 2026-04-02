import type { Metadata } from "next"
import Link from "next/link"
import {
  Shield, Zap, UserX, Upload, Download, ArrowRight, Sparkles, FileText,
  Code2, Monitor, Smartphone, Tablet, Users, GraduationCap, Building2,
  Lightbulb, Star, ScanText, Briefcase,
} from "lucide-react"
import { ImageToTextTool } from "@/components/tools/ImageToTextTool"
import { AuthButton } from "@/components/marketing/shared/AuthButton"
import { Button } from "@/components/ui/button"
import { JsonLd } from "@/components/marketing/shared/JsonLd"
import { breadcrumbJsonLd } from "@/lib/seo/json-ld"

export const metadata: Metadata = {
  title: "Scan to Text Converter — Free, Instant, No Sign-Up | Parsli",
  description:
    "Convert scanned documents, photos, and images to editable text instantly. Free scan-to-text OCR runs in your browser — no sign-up, no server uploads. Supports 12 languages.",
  keywords: [
    "scan to text", "scan to text converter", "scan picture to text",
    "scan photo to text", "scan document to text", "convert scanned pdf to text",
    "scan image to text", "text from scan", "scanner to text", "scanned document to text",
  ],
  alternates: { canonical: "https://parsli.co/tools/scan-to-text" },
  openGraph: {
    title: "Scan to Text Converter — Free, Instant, No Sign-Up | Parsli",
    description: "Convert scanned documents and photos to editable text instantly. Free, no sign-up required.",
    url: "https://parsli.co/tools/scan-to-text",
  },
}

const features = [
  { icon: Shield, title: "Private & secure", description: "Your scanned document is processed entirely in your browser. Files never leave your device." },
  { icon: UserX, title: "No sign-up required", description: "Use it instantly. No account, no email, no credit card required." },
  { icon: Zap, title: "Free & unlimited", description: "No limits, no watermarks, no paywalls. Convert as many scans as you want." },
]

const steps = [
  { icon: Upload, title: "Upload your scan", description: "Drag and drop a scanned image — JPG, PNG, or photo from your phone. Works with any scan quality." },
  { icon: ScanText, title: "OCR reads the text", description: "Optical Character Recognition detects and extracts all readable text from your scanned document." },
  { icon: Download, title: "Copy or download", description: "Copy the extracted text to your clipboard or download as a .txt file instantly." },
]

const personas = [
  { icon: Briefcase, title: "Administrative Assistants", description: "Digitize scanned memos, forms, and correspondence without retyping every word." },
  { icon: Building2, title: "Archivists & Librarians", description: "Convert scanned historical documents, catalogs, and records into searchable digital text." },
  { icon: GraduationCap, title: "Students & Researchers", description: "Extract text from scanned textbook pages, journal articles, and research notes." },
  { icon: Users, title: "Small Business Owners", description: "Convert scanned invoices, contracts, and receipts into editable, searchable text." },
]

const faqs = [
  { q: "What is scan to text?", a: "Scan to text (also called OCR) is the process of converting a scanned image of a document into editable, searchable digital text. Instead of retyping content from a scanned PDF or photo, OCR software reads the text automatically." },
  { q: "Is this tool really free?", a: "Yes, completely free with no limits. No hidden charges, no watermarks, no sign-up. The tool uses Tesseract.js and runs entirely in your browser." },
  { q: "Do you store my scanned documents?", a: "No. All processing happens in your browser. Your files never leave your device and are never sent to any server. Your scanned documents stay 100% private." },
  { q: "What languages does it support?", a: "12 languages: English, Arabic, French, German, Spanish, Italian, Portuguese, Russian, Chinese (Simplified & Traditional), Japanese, and Korean." },
  { q: "Can it handle scanned PDFs?", a: "This tool works with images (JPG, PNG, etc.). For scanned PDFs, use our Make PDF Searchable tool which runs OCR on each PDF page, or try Parsli AI for the highest accuracy." },
  { q: "How accurate is scan to text conversion?", a: "For clear scans at 300 DPI or higher, accuracy is typically 90–95%. According to research published in Pattern Recognition journal, modern OCR engines achieve 95%+ on high-quality printed documents. Lower quality scans or unusual fonts may produce lower accuracy." },
  { q: "Can it read handwritten text from scans?", a: "This tool has limited handwriting support. For handwritten documents, use our dedicated Handwriting to Text tool which uses AI for 95%+ accuracy on cursive and messy handwriting." },
  { q: "What image formats are supported?", a: "JPG/JPEG, PNG, GIF, BMP, and WebP. For best results, scan at 300 DPI or higher with good contrast between text and background." },
  { q: "Can I process multiple scans at once?", a: "This free tool processes one image at a time. For batch scanning and processing hundreds of documents, Parsli AI offers API access and automated workflows." },
  { q: "Does this work on mobile?", a: "Yes. Take a photo of a document with your phone camera and upload it directly. Works on iPhone, iPad, and Android in any modern browser." },
]

export default function ScanToTextToolPage() {
  return (
    <>
      <JsonLd data={breadcrumbJsonLd([
        { name: "Home", url: "https://parsli.co" },
        { name: "Tools", url: "https://parsli.co/tools" },
        { name: "Scan to Text", url: "https://parsli.co/tools/scan-to-text" },
      ])} />
      <JsonLd data={{ "@context": "https://schema.org", "@type": "SoftwareApplication", name: "Parsli Scan to Text Converter", description: "Free browser-based tool to convert scanned documents and photos to editable text using OCR. Supports 12 languages.", applicationCategory: "UtilitiesApplication", operatingSystem: "Web Browser", offers: { "@type": "Offer", price: "0", priceCurrency: "USD" } }} />
      <JsonLd data={{ "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faqs.map((faq) => ({ "@type": "Question", name: faq.q, acceptedAnswer: { "@type": "Answer", text: faq.a } })) }} />

      <section className="relative pt-24 sm:pt-28 pb-16">
        <div className="absolute inset-0 -z-10"><div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-primary/5 rounded-full blur-3xl" /></div>
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border bg-card px-4 py-1.5 text-sm text-muted-foreground mb-6"><ScanText className="h-4 w-4 text-primary" />Scan to Text</div>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight leading-[1.1] mb-4">Convert Scanned Documents to Text</h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-3">Free scan-to-text OCR — instant, private, no sign-up</p>
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-10">
            <div className="flex items-center gap-0.5 text-yellow-500">{[...Array(5)].map((_, i) => (<Star key={i} className="h-3.5 w-3.5 fill-current" />))}</div>
            <span>Trusted by thousands of users</span>
          </div>
          <ImageToTextTool />
          <p className="mt-6 text-xs text-muted-foreground">100% client-side processing &middot; No data sent to any server &middot; Unlimited conversions</p>
        </div>
      </section>

      <section className="py-10 sm:py-12 border-t">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-xl border bg-card p-6 sm:p-8 flex flex-col sm:flex-row items-start gap-5">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 text-primary shrink-0"><Code2 className="h-6 w-6" /></div>
            <div className="flex-1">
              <h2 className="font-semibold text-lg mb-1">Processing thousands of scanned documents?</h2>
              <p className="text-sm text-muted-foreground leading-relaxed mb-4">Parsli&apos;s AI handles batch OCR with 95%+ accuracy on scanned PDFs, images, and faxes. Get structured data via API or send to Google Sheets automatically.</p>
              <div className="flex items-center gap-4">
                <Link href="/solutions/document-parsing-api" className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline underline-offset-4">Explore API <ArrowRight className="h-3.5 w-3.5" /></Link>
                <Link href="/docs" className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Docs</Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="pb-10 sm:pb-12">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <p className="text-sm text-muted-foreground text-center leading-relaxed">
            Already have a digital PDF? <Link href="/tools/pdf-to-text" className="text-primary hover:underline underline-offset-4">PDF to Text</Link> extracts embedded text directly. For handwritten scans, try <Link href="/tools/handwriting-to-text" className="text-primary hover:underline underline-offset-4">Handwriting to Text</Link>. See all <Link href="/tools" className="text-primary hover:underline underline-offset-4">free tools</Link>.
          </p>
        </div>
      </section>

      <section className="py-16 sm:py-20 bg-muted/30">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-12">Why use this scan to text converter</h2>
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
              <ul className="space-y-3 text-sm text-muted-foreground">{["Scanned documents at 300 DPI or higher", "Photos of printed text and book pages", "Flatbed scanner output (TIFF, PNG, JPG)", "Scanned receipts, invoices, and forms", "Photocopied documents and faxes"].map((item) => (<li key={item} className="flex items-start gap-2"><span className="text-green-600 mt-0.5">&#10003;</span>{item}</li>))}</ul>
            </div>
            <div className="rounded-xl border bg-card p-6">
              <h3 className="font-semibold text-lg mb-4 flex items-center gap-2"><Sparkles className="h-5 w-5 text-primary" />For these, try Parsli AI</h3>
              <ul className="space-y-3 text-sm text-muted-foreground">{["Low-quality or blurry scans", "Handwritten documents and cursive", "Multi-page scanned PDFs", "Structured data extraction from scans", "Automated scan-to-spreadsheet workflows"].map((item) => (<li key={item} className="flex items-start gap-2"><ArrowRight className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />{item}</li>))}</ul>
            </div>
          </div>
          <div className="mt-16 max-w-3xl mx-auto">
            <div className="flex items-center gap-2 mb-6"><Lightbulb className="h-5 w-5 text-primary" /><h3 className="text-xl font-bold">Tips for better scan results</h3></div>
            <div className="space-y-6">
              <div><h4 className="font-semibold mb-2">Scan at 300 DPI minimum</h4><p className="text-sm text-muted-foreground leading-relaxed">The recommended scanning resolution for OCR is 300 DPI (dots per inch). According to the Library of Congress digitization guidelines, 300 DPI provides sufficient detail for reliable text recognition on standard printed documents.</p></div>
              <div><h4 className="font-semibold mb-2">Use a flat, clean original</h4><p className="text-sm text-muted-foreground leading-relaxed">Wrinkled, folded, or stained documents reduce OCR accuracy. If possible, flatten the document and clean the scanner glass before scanning.</p></div>
              <div><h4 className="font-semibold mb-2">Use grayscale for text documents</h4><p className="text-sm text-muted-foreground leading-relaxed">For text-only documents, grayscale scanning produces better OCR results than color because it maximizes contrast between text and background.</p></div>
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
          <h2 className="text-xl sm:text-2xl font-bold mb-4">The True Cost of Manual Retyping</h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            According to AIIM (Association for Intelligent Information Management), organizations spend an average of $20 in labor to file a single paper document, and $120 to find a misfiled document. The average office worker spends 2.5 hours per day searching for information locked in physical or scanned documents (source: <a href="https://www.aiim.org" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">AIIM Industry Watch reports</a>).
          </p>
          <p className="text-muted-foreground leading-relaxed mb-4">
            Scan-to-text technology eliminates the retyping bottleneck. A study by IDC Research found that document digitization reduces document retrieval time by up to 75% and cuts storage costs by 50–80% compared to paper filing systems. For organizations processing hundreds of scanned documents monthly, even a free OCR tool saves dozens of hours.
          </p>

          <h2 className="text-xl sm:text-2xl font-bold mt-10 mb-4">Scan to Text: Free Tool vs AI Extraction</h2>
          <div className="border rounded-lg overflow-hidden mb-6">
            <table className="w-full text-sm">
              <thead className="bg-muted/50"><tr><th className="text-left px-4 py-2.5 font-semibold">Feature</th><th className="text-left px-4 py-2.5 font-semibold">Free Scan to Text</th><th className="text-left px-4 py-2.5 font-semibold">Parsli AI</th></tr></thead>
              <tbody>
                {[
                  ["Clear scanned text", "90–95% accuracy", "99%+ accuracy"],
                  ["Low-quality scans", "Variable", "High accuracy"],
                  ["Handwritten text", "Limited", "95%+ (AI-powered)"],
                  ["Custom field extraction", "No", "Yes (schemas)"],
                  ["Multi-page PDFs", "No", "Yes"],
                  ["Batch processing", "One at a time", "Via API"],
                  ["Export options", "Copy / .txt", "JSON, CSV, Sheets, API"],
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
          <h2 className="text-2xl sm:text-3xl font-bold mb-4">Stop retyping scanned documents by hand.</h2>
          <p className="text-muted-foreground max-w-xl mx-auto mb-8 leading-relaxed">Parsli extracts structured data from any document — PDFs, images, scans, emails. Define custom schemas and automate with integrations. Free up to 30 pages/month.</p>
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
              { href: "/tools/ocr", label: "Free Online OCR" },
              { href: "/tools/image-to-text", label: "Image to Text" },
              { href: "/tools/pdf-to-text", label: "PDF to Text" },
              { href: "/tools/handwriting-to-text", label: "Handwriting to Text" },
              { href: "/tools/make-pdf-searchable", label: "Make PDF Searchable" },
              { href: "/tools/photo-to-text", label: "Photo to Text" },
              { href: "/compare/abbyy", label: "Parsli vs ABBYY" },
              { href: "/pricing", label: "Pricing" },
            ].map((link) => (<Link key={link.href} href={link.href} className="inline-flex items-center gap-1.5 rounded-lg border bg-card px-4 py-2 text-sm hover:border-primary/30 transition-colors">{link.label} <ArrowRight className="h-3 w-3 text-muted-foreground" /></Link>))}
          </div>
        </div>
      </section>
    </>
  )
}
