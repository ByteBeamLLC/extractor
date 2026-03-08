import { Clock, AlertTriangle, TrendingDown } from "lucide-react"
import { SectionWrapper } from "@/components/marketing/shared/SectionWrapper"

const painPoints = [
  {
    icon: Clock,
    title: "Hours Wasted on Manual Entry",
    description:
      "Your team spends hours every week copying data from PDFs, invoices, and emails into spreadsheets. That time could be spent on work that actually grows your business.",
  },
  {
    icon: AlertTriangle,
    title: "Costly Data Entry Errors",
    description:
      "Manual data entry leads to typos, missed fields, and inconsistent formats. One wrong number on an invoice can cascade into accounting headaches.",
  },
  {
    icon: TrendingDown,
    title: "Can't Scale Document Processing",
    description:
      "As document volume grows, hiring more people to manually process them isn't sustainable. You need automation that scales with your business.",
  },
]

export function ProblemSection() {
  return (
    <SectionWrapper id="problem">
      <div className="text-center mb-14">
        <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
          Manual Data Entry is Killing Your Productivity
        </h2>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          If you&apos;re still copying data from documents by hand, you&apos;re losing time,
          money, and accuracy every single day.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {painPoints.map((point) => (
          <div
            key={point.title}
            className="relative rounded-xl border bg-card p-6 sm:p-8"
          >
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-destructive/10 text-destructive mb-5">
              <point.icon className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-semibold mb-3">{point.title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {point.description}
            </p>
          </div>
        ))}
      </div>
    </SectionWrapper>
  )
}
