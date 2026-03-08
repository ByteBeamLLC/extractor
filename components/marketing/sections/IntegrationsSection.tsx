import Link from "next/link"
import { Sheet, Zap, Mail, Webhook, Code, ArrowRight } from "lucide-react"
import { SectionWrapper } from "@/components/marketing/shared/SectionWrapper"

const integrations = [
  {
    icon: Sheet,
    name: "Google Sheets",
    description:
      "Pull extracted data directly into Google Sheets with a simple IMPORTDATA formula. Auto-refreshes with every extraction.",
    href: "/integrations/google-sheets",
    color: "text-green-600",
    bgColor: "bg-green-50 dark:bg-green-950/50",
  },
  {
    icon: Zap,
    name: "Zapier",
    description:
      "Connect to 5,000+ apps through Zapier. Trigger automations every time a document is processed.",
    href: "/integrations/zapier",
    color: "text-orange-500",
    bgColor: "bg-orange-50 dark:bg-orange-950/50",
  },
  {
    icon: Zap,
    name: "Make (Integromat)",
    description:
      "Build powerful visual automations with Make. Send extracted data to any scenario via webhooks.",
    href: "/integrations/make",
    color: "text-purple-500",
    bgColor: "bg-purple-50 dark:bg-purple-950/50",
  },
  {
    icon: Mail,
    name: "Gmail",
    description:
      "Auto-extract data from email attachments. Connect your inbox and process invoices, receipts, and documents as they arrive.",
    href: "/integrations/gmail",
    color: "text-red-500",
    bgColor: "bg-red-50 dark:bg-red-950/50",
  },
  {
    icon: Webhook,
    name: "Webhooks",
    description:
      "Send extracted data to any HTTP endpoint in real-time. Inbound webhooks for document submission, outbound for data delivery.",
    href: "/integrations/webhooks",
    color: "text-blue-500",
    bgColor: "bg-blue-50 dark:bg-blue-950/50",
  },
  {
    icon: Code,
    name: "REST API",
    description:
      "Full-featured REST API for developers. Send documents programmatically and receive structured JSON. Bearer token auth.",
    href: "/integrations/api",
    color: "text-indigo-500",
    bgColor: "bg-indigo-50 dark:bg-indigo-950/50",
  },
]

export function IntegrationsSection() {
  return (
    <SectionWrapper id="integrations">
      <div className="text-center mb-14">
        <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
          Connect to Your Favorite Tools
        </h2>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Extracted data flows automatically to the tools you already use.
          No manual exports, no copy-pasting.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {integrations.map((integration) => (
          <Link
            key={integration.name}
            href={integration.href}
            className="group rounded-xl border bg-card p-6 hover:border-primary/30 hover:shadow-md transition-all duration-200"
          >
            <div
              className={`inline-flex items-center justify-center w-12 h-12 rounded-lg ${integration.bgColor} ${integration.color} mb-4`}
            >
              <integration.icon className="h-6 w-6" />
            </div>
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              {integration.name}
              <ArrowRight className="h-4 w-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200 text-primary" />
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {integration.description}
            </p>
          </Link>
        ))}
      </div>
    </SectionWrapper>
  )
}
