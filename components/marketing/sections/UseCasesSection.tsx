import Link from "next/link"
import { FileText, Mail, Receipt, FileSpreadsheet, Building2, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { SectionWrapper } from "@/components/marketing/shared/SectionWrapper"
import { APP_URL } from "@/lib/config"

const useCases = [
  {
    icon: FileText,
    title: "Invoice Parsing",
    description: "Extract vendor names, amounts, line items, and due dates from invoices automatically.",
    href: "/use-cases/invoice-parsing",
    keyword: "invoice parsing software",
  },
  {
    icon: Mail,
    title: "Email Data Extraction",
    description: "Parse incoming emails and attachments into structured data. Auto-process from Gmail.",
    href: "/use-cases/email-parsing",
    keyword: "email parser software",
  },
  {
    icon: Receipt,
    title: "Receipt Scanning",
    description: "Scan receipts and extract store name, items, totals, and payment methods instantly.",
    href: "/use-cases/receipt-scanning",
    keyword: "receipt scanning software",
  },
  {
    icon: FileSpreadsheet,
    title: "PDF to Excel",
    description: "Convert PDF tables and data directly into Excel or Google Sheets format.",
    href: "/use-cases/pdf-to-excel",
    keyword: "pdf to excel converter",
  },
  {
    icon: FileText,
    title: "PDF Data Extraction",
    description: "Extract structured data from any PDF — scanned or digital. Built-in OCR included.",
    href: "/use-cases/pdf-data-extraction",
    keyword: "pdf data extraction software",
  },
  {
    icon: Building2,
    title: "Document Automation",
    description: "Automate entire document workflows from ingestion to data delivery. No code required.",
    href: "/use-cases/document-automation",
    keyword: "document automation software",
  },
]

export function UseCasesSection() {
  return (
    <SectionWrapper id="use-cases" className="bg-muted/30">
      <div className="text-center mb-14">
        <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
          Whatever you're extracting, Parsli handles it
        </h2>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Invoices, emails, receipts, PDFs — any document with data you need.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {useCases.map((useCase) => (
          <Link
            key={useCase.title}
            href={useCase.href}
            className="group rounded-xl border bg-card p-6 hover:border-primary/30 hover:shadow-md transition-all duration-200"
          >
            <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 text-primary mb-4">
              <useCase.icon className="h-5 w-5" />
            </div>
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              {useCase.title}
              <ArrowRight className="h-4 w-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200 text-primary" />
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {useCase.description}
            </p>
          </Link>
        ))}
      </div>

      <div className="text-center mt-10">
        <Button size="lg" className="text-base px-8 h-11" asChild>
          <a href={`${APP_URL}/login?mode=signup`}>
            Start Free — No Credit Card
            <ArrowRight className="ml-2 h-4 w-4" />
          </a>
        </Button>
      </div>
    </SectionWrapper>
  )
}
