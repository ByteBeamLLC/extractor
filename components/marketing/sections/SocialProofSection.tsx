import { FileText, Zap, Sheet, Mail, Webhook, Code } from "lucide-react"
import { Marquee } from "@/components/ui/marquee"

const stats = [
  { value: "50,000+", label: "Documents Processed" },
  { value: "95%+", label: "Extraction Accuracy" },
  { value: "5,000+", label: "App Integrations" },
  { value: "<3s", label: "Average Processing Time" },
]

const integrationItems = [
  { icon: Sheet, label: "Google Sheets", color: "text-green-600" },
  { icon: Zap, label: "Zapier", color: "text-orange-500" },
  { icon: Mail, label: "Gmail", color: "text-red-500" },
  { icon: Webhook, label: "Webhooks", color: "text-blue-500" },
  { icon: Code, label: "REST API", color: "text-indigo-500" },
  { icon: FileText, label: "PDF", color: "text-rose-500" },
  { icon: Zap, label: "Make", color: "text-purple-500" },
  { icon: FileText, label: "Word & Excel", color: "text-sky-500" },
]

function IntegrationBadge({
  icon: Icon,
  label,
  color,
}: {
  icon: typeof Sheet
  label: string
  color: string
}) {
  return (
    <div className="flex items-center gap-2.5 rounded-full border bg-card px-4 py-2 shadow-sm">
      <Icon className={`h-4 w-4 ${color}`} />
      <span className="text-sm font-medium whitespace-nowrap">{label}</span>
    </div>
  )
}

export function SocialProofSection() {
  return (
    <section className="py-12 sm:py-16 border-y bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-2xl sm:text-3xl font-bold text-primary">
                {stat.value}
              </div>
              <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Integration marquee */}
        <div className="text-center">
          <p className="text-sm text-muted-foreground mb-6">
            Connects with the tools you already use
          </p>
          <div className="relative">
            <Marquee pauseOnHover className="[--duration:30s] [--gap:0.75rem]">
              {integrationItems.map((item) => (
                <IntegrationBadge
                  key={item.label}
                  icon={item.icon}
                  label={item.label}
                  color={item.color}
                />
              ))}
            </Marquee>
            {/* Fade edges */}
            <div className="pointer-events-none absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-muted/30 to-transparent" />
            <div className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-muted/30 to-transparent" />
          </div>
        </div>
      </div>
    </section>
  )
}
