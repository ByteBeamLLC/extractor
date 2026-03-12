import Link from "next/link"
import { ArrowRight } from "lucide-react"

const popularTools = [
  {
    href: "/tools/pdf-to-excel",
    title: "PDF to Excel",
    description: "Convert PDF tables to clean Excel spreadsheets.",
  },
  {
    href: "/tools/invoice-parser",
    title: "Invoice Parser",
    description: "Extract vendor info, line items, and totals from invoices.",
  },
  {
    href: "/tools/image-to-text",
    title: "Image to Text (OCR)",
    description: "Extract text from images using AI-powered OCR.",
  },
  {
    href: "/tools/bank-statement-parser",
    title: "Bank Statement Parser",
    description: "Extract transactions and balances from bank statements.",
  },
  {
    href: "/tools/receipt-scanner",
    title: "Receipt Scanner",
    description: "Scan receipts and extract transaction details.",
  },
  {
    href: "/tools/pdf-merger",
    title: "PDF Merger",
    description: "Combine multiple PDF files into a single document.",
  },
]

export function FreeToolsSection() {
  return (
    <section className="py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <p className="text-sm font-semibold text-primary text-center mb-3">
          Free Tools
        </p>
        <h2 className="text-2xl sm:text-3xl font-bold text-center mb-4">
          22 free document tools — no sign-up required
        </h2>
        <p className="text-center text-muted-foreground max-w-2xl mx-auto mb-12">
          PDF processing, OCR text extraction, data conversion, and document
          parsing. Everything runs in your browser — your files never leave your
          device.
        </p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl mx-auto">
          {popularTools.map((tool) => (
            <Link
              key={tool.href}
              href={tool.href}
              className="group rounded-xl border bg-card p-5 hover:border-primary/30 transition-colors"
            >
              <h3 className="font-semibold mb-1 group-hover:text-primary transition-colors">
                {tool.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {tool.description}
              </p>
              <span className="inline-flex items-center gap-1 text-sm text-primary mt-3">
                Try free <ArrowRight className="h-3 w-3" />
              </span>
            </Link>
          ))}
        </div>
        <div className="text-center mt-8">
          <Link
            href="/tools"
            className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline underline-offset-4"
          >
            View all 22 free tools
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  )
}
