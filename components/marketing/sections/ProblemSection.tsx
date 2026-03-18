import { Clock, AlertTriangle, TrendingDown, Quote } from "lucide-react"
import { SectionWrapper } from "@/components/marketing/shared/SectionWrapper"

const painPoints = [
  {
    icon: Clock,
    title: "Hours Wasted on Manual Entry",
    stat: "6+ hrs/week",
    statLabel: "lost to repetitive tasks",
    description:
      "Nearly 60% of workers estimate they could save six or more hours per week if repetitive tasks like data entry were automated.",
    source: "Smartsheet, 2017",
  },
  {
    icon: AlertTriangle,
    title: "Costly Data Entry Errors",
    stat: "$15",
    statLabel: "cost per invoice, manually",
    description:
      "Manual invoice processing costs $15 per document on average. A single data entry error can cost up to $53.50 to rectify — and the average error rate is 1 in every 100 entries.",
    source: "IOFM / Aberdeen Group",
  },
  {
    icon: TrendingDown,
    title: "Can't Scale Document Processing",
    stat: "2x",
    statLabel: "more invoices per FTE with automation",
    description:
      "Automated teams process 23,333 invoices per FTE annually versus 6,082 for manual teams. As volume grows, hiring more people isn't sustainable — automation is.",
    source: "IOFM",
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
          According to McKinsey, 45% of the activities employees are paid to do
          can be automated with technologies that already exist. The U.S. Bureau
          of Labor Statistics projects a{" "}
          <strong className="text-foreground">25% decline</strong> in data entry
          jobs by 2032 as automation replaces manual processes{" "}
          <span className="text-xs text-muted-foreground/70">
            (<cite>BLS.gov, Occupational Outlook Handbook</cite>)
          </span>
          . If you&apos;re still copying data from documents by hand,
          you&apos;re losing time, money, and accuracy every single day.
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
            <div className="mb-3">
              <span className="text-2xl font-bold text-primary">
                {point.stat}
              </span>
              <span className="text-xs text-muted-foreground ml-1.5">
                {point.statLabel}
              </span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {point.description}
            </p>
            <p className="mt-2 text-xs text-muted-foreground/70">
              <cite>Source: {point.source}</cite>
            </p>
          </div>
        ))}
      </div>

      {/* Expert quote */}
      <figure className="mt-12 rounded-xl bg-muted/50 p-8 max-w-3xl mx-auto">
        <blockquote className="border-l-4 border-primary pl-6">
          <p className="text-base italic text-foreground/80">
            &ldquo;Wherever a document, form, email, or text — however simple
            or rich — enters a business process, there is a potential use case
            for intelligent document extraction.&rdquo;
          </p>
        </blockquote>
        <figcaption className="mt-4 flex items-center gap-3 pl-6">
          <Quote className="h-5 w-5 text-primary/50" />
          <div>
            <p className="text-sm font-medium">Craig Le Clair</p>
            <p className="text-xs text-muted-foreground">
              VP &amp; Principal Analyst, Forrester Research
            </p>
          </div>
        </figcaption>
      </figure>
    </SectionWrapper>
  )
}
