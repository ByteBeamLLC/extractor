import type { Metadata } from "next"
import Link from "next/link"
import {
  Shield, Zap, UserX, Upload, Download, ArrowRight, Sparkles, FileText,
  Code2, Monitor, Smartphone, Tablet, Users, GraduationCap, Building2,
  Lightbulb, Star, Search, Briefcase,
} from "lucide-react"
import { MakePdfSearchableTool } from "@/components/tools/MakePdfSearchableTool"
import { AuthButton } from "@/components/marketing/shared/AuthButton"
import { Button } from "@/components/ui/button"
import { JsonLd } from "@/components/marketing/shared/JsonLd"
import { breadcrumbJsonLd } from "@/lib/seo/json-ld"

export const metadata: Metadata = {
  title: "Make PDF Searchable — Free OCR for Scanned PDFs | Parsli",
  description:
    "Make scanned PDFs searchable with free OCR. Extract text from image-based PDFs so you can search, copy, and use the content. Runs in your browser — no sign-up required.",
  keywords: [
    "make pdf searchable", "searchable pdf", "ocr pdf", "make a pdf file searchable",
    "convert scanned pdf to searchable", "ocr searchable pdf", "scan to searchable pdf",
    "make pdf text searchable", "pdf ocr free", "searchable pdf converter",
  ],
  alternates: { canonical: "https://parsli.co/tools/make-pdf-searchable" },
  openGraph: {
    title: "Make PDF Searchable — Free OCR for Scanned PDFs | Parsli",
    description: "Make scanned PDFs searchable with free OCR. Extract text from image-based PDFs in your browser.",
    url: "https://parsli.co/tools/make-pdf-searchable",
  },
}

const features = [
  { icon: Shield, title: "Private & secure", description: "Your PDF is processed entirely in your browser using Tesseract.js OCR. Files never leave your device." },
  { icon: UserX, title: "No sign-up required", description: "Use it instantly. No account, no email, no credit card. Just upload your scanned PDF." },
  { icon: Zap, title: "Free & unlimited", description: "No limits, no watermarks, no paywalls. Process as many scanned PDFs as you need." },
]

const steps = [
  { icon: Upload, title: "Upload your scanned PDF", description: "Drag and drop a scanned or image-based PDF. Up to 20 MB." },
  { icon: Search, title: "OCR extracts the text", description: "Each page is rendered and processed with Tesseract OCR to extract all readable text." },
  { icon: Download, title: "Copy or download text", description: "Copy the searchable text to your clipboard or download as a .txt file. Content is now searchable and usable." },
]

const personas = [
  { icon: Building2, title: "Legal Professionals", description: "Make scanned contracts, court filings, and depositions searchable for review and discovery." },
  { icon: Users, title: "Government & Compliance", description: "Convert scanned public records and regulatory filings into searchable, accessible documents." },
  { icon: Briefcase, title: "Archivists & Records Managers", description: "Digitize and make searchable historical documents, old archives, and scanned records." },
  { icon: GraduationCap, title: "Accessibility Coordinators", description: "Make scanned PDFs accessible to screen readers by extracting the text layer." },
]

const faqs = [
  { q: "What does 'make PDF searchable' mean?", a: "A scanned PDF is essentially an image — you can see the text, but you can't select, search, or copy it. Making it 'searchable' means using OCR to read the image and extract the actual text content, so you can search within the document, copy text, and use it in other applications." },
  { q: "Is this tool free?", a: "Yes, completely free with no limits. No account, no sign-up, no credit card. The OCR processing happens in your browser using Tesseract.js." },
  { q: "Do you store my PDFs?", a: "No. All processing happens entirely in your browser. Your PDF never leaves your device. Pages are rendered to images locally and processed with Tesseract.js OCR — nothing is uploaded to any server." },
  { q: "How accurate is the OCR?", a: "For clear scans at 300 DPI, accuracy is typically 90–95% on printed text. Lower resolution or poor-quality scans may produce less accurate results. For the highest accuracy on difficult documents, Parsli AI uses Google Gemini which achieves 99%+ on most printed text." },
  { q: "Does this create a searchable PDF file?", a: "This tool extracts the text content as copyable/searchable plain text. For creating an actual PDF with an embedded text layer (PDF/A compliant), use Parsli AI which can output searchable PDFs with the OCR text layer." },
  { q: "How long does OCR take?", a: "Processing time depends on the number of pages and your device speed. Typically 5–15 seconds per page. Since OCR runs in your browser, faster devices process more quickly." },
  { q: "What about handwritten PDFs?", a: "This tool has limited handwriting support. For scanned handwritten documents, use our Handwriting to Text tool or Parsli AI for 95%+ accuracy on cursive and messy handwriting." },
  { q: "What file size limit?", a: "Up to 20 MB. OCR is more computationally intensive than text extraction, so we recommend a lower size limit for smooth browser-based processing." },
  { q: "Is this compliant with PDF/A archival standards?", a: "The PDF/A standard (ISO 19005) requires embedded searchable text for archival compliance. This free tool extracts text as a separate file. For PDF/A-compliant output with embedded text layers, use Parsli AI." },
  { q: "Does this work on mobile?", a: "Yes, but OCR is CPU-intensive. For best performance on multi-page scanned PDFs, use a desktop browser. Single-page PDFs work well on mobile." },
]

export default function MakePdfSearchableToolPage() {
  return (
    <>
      <JsonLd data={breadcrumbJsonLd([
        { name: "Home", url: "https://parsli.co" },
        { name: "Tools", url: "https://parsli.co/tools" },
        { name: "Make PDF Searchable", url: "https://parsli.co/tools/make-pdf-searchable" },
      ])} />
      <JsonLd data={{ "@context": "https://schema.org", "@type": "SoftwareApplication", name: "Parsli Make PDF Searchable", description: "Free tool to make scanned PDFs searchable using browser-based OCR. Extract text from image-based PDFs.", applicationCategory: "UtilitiesApplication", operatingSystem: "Web Browser", offers: { "@type": "Offer", price: "0", priceCurrency: "USD" } }} />
      <JsonLd data={{ "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faqs.map((faq) => ({ "@type": "Question", name: faq.q, acceptedAnswer: { "@type": "Answer", text: faq.a } })) }} />

      <section className="relative pt-24 sm:pt-28 pb-16">
        <div className="absolute inset-0 -z-10"><div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-primary/5 rounded-full blur-3xl" /></div>
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border bg-card px-4 py-1.5 text-sm text-muted-foreground mb-6"><Search className="h-4 w-4 text-primary" />Make PDF Searchable</div>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight leading-[1.1] mb-4">Make Scanned PDFs Searchable</h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-3">Free OCR — extract text from image-based PDFs</p>
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-10">
            <div className="flex items-center gap-0.5 text-yellow-500">{[...Array(5)].map((_, i) => (<Star key={i} className="h-3.5 w-3.5 fill-current" />))}</div>
            <span>Powered by Tesseract.js OCR</span>
          </div>
          <MakePdfSearchableTool />
          <p className="mt-6 text-xs text-muted-foreground">100% client-side OCR processing &middot; No data sent to any server &middot; Up to 20 MB</p>
        </div>
      </section>

      <section className="py-10 sm:py-12 border-t">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-xl border bg-card p-6 sm:p-8 flex flex-col sm:flex-row items-start gap-5">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 text-primary shrink-0"><Sparkles className="h-6 w-6" /></div>
            <div className="flex-1">
              <h2 className="font-semibold text-lg mb-1">Need true searchable PDFs with embedded text?</h2>
              <p className="text-sm text-muted-foreground leading-relaxed mb-4">Parsli AI creates actual searchable PDFs with an embedded OCR text layer — compliant with PDF/A archival standards. Process thousands of scanned documents automatically.</p>
              <div className="flex items-center gap-4">
                <Link href="/solutions/document-parsing-api" className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline underline-offset-4">Explore Parsli AI <ArrowRight className="h-3.5 w-3.5" /></Link>
                <Link href="/pricing" className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Pricing</Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="pb-10 sm:pb-12">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <p className="text-sm text-muted-foreground text-center leading-relaxed">
            For image files (not PDFs), use <Link href="/tools/ocr" className="text-primary hover:underline underline-offset-4">Free Online OCR</Link> or <Link href="/tools/image-to-text" className="text-primary hover:underline underline-offset-4">Image to Text</Link>. For text-based PDFs, try <Link href="/tools/pdf-to-text" className="text-primary hover:underline underline-offset-4">PDF to Text</Link>.
          </p>
        </div>
      </section>

      <section className="py-16 sm:py-20 bg-muted/30"><div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8"><h2 className="text-2xl sm:text-3xl font-bold text-center mb-12">Why use this tool</h2><div className="grid md:grid-cols-3 gap-6">{features.map((f) => (<div key={f.title} className="rounded-xl border bg-card p-6 text-center"><div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 text-primary mb-4"><f.icon className="h-6 w-6" /></div><h3 className="font-semibold text-lg mb-2">{f.title}</h3><p className="text-sm text-muted-foreground leading-relaxed">{f.description}</p></div>))}</div></div></section>

      <section className="py-16 sm:py-20"><div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8"><h2 className="text-2xl sm:text-3xl font-bold text-center mb-12">How it works</h2><div className="grid md:grid-cols-3 gap-8">{steps.map((step, i) => (<div key={step.title} className="relative rounded-xl border bg-card p-6 text-center"><div className="absolute top-4 right-4 text-xs font-bold text-muted-foreground/40">{i + 1}</div><div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary mb-4"><step.icon className="h-6 w-6" /></div><h3 className="font-semibold text-lg mb-2">{step.title}</h3><p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p></div>))}</div></div></section>

      <section className="py-16 sm:py-20 bg-muted/30">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-12">What this tool handles</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="rounded-xl border bg-card p-6"><h3 className="font-semibold text-lg mb-4 flex items-center gap-2"><FileText className="h-5 w-5 text-primary" />Works great with</h3><ul className="space-y-3 text-sm text-muted-foreground">{["Scanned PDFs from flatbed scanners", "PDFs created from phone camera photos", "Image-based PDFs with clear printed text", "Single or multi-page scanned documents", "Faxed documents saved as PDF"].map((item) => (<li key={item} className="flex items-start gap-2"><span className="text-green-600 mt-0.5">&#10003;</span>{item}</li>))}</ul></div>
            <div className="rounded-xl border bg-card p-6"><h3 className="font-semibold text-lg mb-4 flex items-center gap-2"><Sparkles className="h-5 w-5 text-primary" />For these, try Parsli AI</h3><ul className="space-y-3 text-sm text-muted-foreground">{["Low-quality or blurry scanned PDFs", "Handwritten scanned documents", "Embedded text layer in output PDF", "PDF/A archival compliance", "Batch OCR for hundreds of files"].map((item) => (<li key={item} className="flex items-start gap-2"><ArrowRight className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />{item}</li>))}</ul></div>
          </div>
          <div className="mt-16 max-w-3xl mx-auto">
            <div className="flex items-center gap-2 mb-6"><Lightbulb className="h-5 w-5 text-primary" /><h3 className="text-xl font-bold">Tips for best OCR results</h3></div>
            <div className="space-y-6">
              <div><h4 className="font-semibold mb-2">Scan at 300 DPI or higher</h4><p className="text-sm text-muted-foreground leading-relaxed">ABBYY and the Library of Congress both recommend 300 DPI as the minimum for reliable OCR. Higher DPI means more detail for the engine to work with.</p></div>
              <div><h4 className="font-semibold mb-2">Use grayscale mode</h4><p className="text-sm text-muted-foreground leading-relaxed">For text documents, grayscale scanning maximizes contrast and produces better OCR results than color scanning while keeping file sizes manageable.</p></div>
              <div><h4 className="font-semibold mb-2">Keep files under 10 pages for browser OCR</h4><p className="text-sm text-muted-foreground leading-relaxed">Browser-based OCR processes each page individually. For documents over 10 pages, consider using Parsli AI which runs OCR on dedicated servers for faster processing.</p></div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-20"><div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8"><h2 className="text-2xl sm:text-3xl font-bold text-center mb-12">Perfect for</h2><div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">{personas.map((p) => (<div key={p.title} className="rounded-xl border bg-card p-5 hover:border-primary/30 transition-colors"><p.icon className="h-5 w-5 text-primary mb-3" /><h3 className="font-semibold text-sm mb-1">{p.title}</h3><p className="text-xs text-muted-foreground leading-relaxed">{p.description}</p></div>))}</div></div></section>

      <section className="py-16 sm:py-20"><div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8"><h2 className="text-2xl sm:text-3xl font-bold text-center mb-12">Frequently asked questions</h2><div className="grid sm:grid-cols-2 gap-6">{faqs.map((faq) => (<div key={faq.q} className="rounded-xl border bg-card p-5"><h3 className="font-semibold text-sm mb-2">{faq.q}</h3><p className="text-xs text-muted-foreground leading-relaxed">{faq.a}</p></div>))}</div></div></section>

      <section className="py-16 sm:py-20 bg-muted/30 border-t">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-xl sm:text-2xl font-bold mb-4">Why Searchable PDFs Matter</h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            According to Adobe, over 2.5 trillion PDF documents exist worldwide, with a significant portion being scanned images with no searchable text layer (source: <a href="https://www.adobe.com/acrobat/about-adobe-pdf.html" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">Adobe Document Cloud</a>). These image-only PDFs are effectively invisible to search engines, compliance tools, and screen readers.
          </p>
          <p className="text-muted-foreground leading-relaxed mb-4">
            The <a href="https://www.iso.org/standard/38920.html" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">PDF/A standard (ISO 19005)</a> for long-term digital archiving requires that documents contain searchable text. Government agencies, law firms, and healthcare organizations are increasingly required to maintain searchable archives.
          </p>
          <p className="text-muted-foreground leading-relaxed mb-4">
            Accessibility standards also mandate searchable text. The <a href="https://www.w3.org/WAI/standards-guidelines/wcag/" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">WCAG 2.1 guidelines (W3C)</a> require that documents be machine-readable for screen readers. In the US, <a href="https://www.section508.gov/" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">Section 508</a> requires all federal documents to be accessible, which means scanned PDFs must have OCR text layers.
          </p>

          <h2 className="text-xl sm:text-2xl font-bold mt-10 mb-4">Free OCR vs Parsli AI</h2>
          <div className="border rounded-lg overflow-hidden mb-6">
            <table className="w-full text-sm">
              <thead className="bg-muted/50"><tr><th className="text-left px-4 py-2.5 font-semibold">Feature</th><th className="text-left px-4 py-2.5 font-semibold">Free Tool</th><th className="text-left px-4 py-2.5 font-semibold">Parsli AI</th></tr></thead>
              <tbody>
                {[
                  ["Extract text from scanned PDFs", "Yes", "Yes"],
                  ["Output format", "Plain text (.txt)", "Searchable PDF + JSON"],
                  ["Accuracy on printed text", "90–95%", "99%+"],
                  ["Handwritten text", "Limited", "95%+ (Gemini AI)"],
                  ["PDF/A compliance", "No", "Yes"],
                  ["Batch processing", "One at a time", "Via API"],
                  ["Integrations", "None", "Sheets, Zapier, Make"],
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
          <h2 className="text-2xl sm:text-3xl font-bold mb-4">Make all your scanned documents searchable.</h2>
          <p className="text-muted-foreground max-w-xl mx-auto mb-8 leading-relaxed">Parsli processes scanned PDFs with AI-powered OCR and creates searchable documents automatically. Extract structured data or just make content findable. Free up to 30 pages/month.</p>
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
              { href: "/tools/pdf-to-text", label: "PDF to Text" },
              { href: "/tools/image-to-text", label: "Image to Text" },
              { href: "/tools/scan-to-text", label: "Scan to Text" },
              { href: "/tools/handwriting-to-text", label: "Handwriting to Text" },
              { href: "/solutions/document-parsing-api", label: "Document Parsing API" },
              { href: "/pricing", label: "Pricing" },
            ].map((link) => (<Link key={link.href} href={link.href} className="inline-flex items-center gap-1.5 rounded-lg border bg-card px-4 py-2 text-sm hover:border-primary/30 transition-colors">{link.label} <ArrowRight className="h-3 w-3 text-muted-foreground" /></Link>))}
          </div>
        </div>
      </section>
    </>
  )
}
