import {
  Sparkles,
  Layers,
  FileText,
  Zap,
  Code,
  Mail,
  Braces,
  ShieldCheck,
} from "lucide-react"
import { SectionWrapper } from "@/components/marketing/shared/SectionWrapper"

const features = [
  {
    icon: Sparkles,
    title: "AI-Powered Extraction",
    description:
      "Powered by Google Gemini 2.5 Pro, one of the most advanced AI models. Extracts data from complex layouts, tables, handwritten text, and more.",
  },
  {
    icon: Layers,
    title: "No-Code Schema Builder",
    description:
      "Define exactly what data you need with our visual schema builder. Add fields, set types, and configure extraction rules — no coding required.",
  },
  {
    icon: FileText,
    title: "Multi-Format Support",
    description:
      "Process PDFs, images (PNG, JPG, WebP), Word documents, Excel spreadsheets, and plain text. Built-in OCR for scanned documents.",
  },
  {
    icon: Zap,
    title: "Real-Time Integrations",
    description:
      "Connect to Google Sheets, Zapier, Make, and 5,000+ apps. Extracted data flows automatically to your existing workflow.",
  },
  {
    icon: Code,
    title: "REST API & Webhooks",
    description:
      "Full REST API with Bearer token auth. Inbound webhooks for easy document submission. Outbound webhooks for real-time delivery.",
  },
  {
    icon: Mail,
    title: "Gmail Inbox Automation",
    description:
      "Connect your Gmail to automatically extract data from email attachments. Process invoices, receipts, and documents as they arrive.",
  },
  {
    icon: Braces,
    title: "Structured JSON Output",
    description:
      "Get clean, consistent JSON output every time. Support for nested objects, tables, and arrays. Export as CSV for spreadsheets.",
  },
  {
    icon: ShieldCheck,
    title: "Enterprise-Grade Security",
    description:
      "Row-level security with Supabase. API keys stored as SHA-256 hashes. Read-only Gmail access. Your documents are always protected.",
  },
]

export function FeaturesSection() {
  return (
    <SectionWrapper id="features">
      <div className="text-center mb-14">
        <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
          Everything You Need to Automate Document Processing
        </h2>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          From AI extraction to integrations, Parsli handles the entire document
          processing pipeline so you don&apos;t have to.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {features.map((feature) => (
          <div
            key={feature.title}
            className="group rounded-xl border bg-card p-6 hover:border-primary/30 hover:shadow-md hover:shadow-primary/5 transition-all duration-200"
          >
            <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 text-primary mb-4 group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-200">
              <feature.icon className="h-5 w-5" />
            </div>
            <h3 className="font-semibold mb-2">{feature.title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {feature.description}
            </p>
          </div>
        ))}
      </div>
    </SectionWrapper>
  )
}
