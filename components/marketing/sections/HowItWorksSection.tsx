import { SectionWrapper } from "@/components/marketing/shared/SectionWrapper"

const steps = [
  {
    number: "01",
    title: "Upload or Forward Documents",
    description:
      "Upload PDFs, images, or emails. Or set up email forwarding and API ingestion to automate document intake from any source.",
  },
  {
    number: "02",
    title: "AI Extracts Your Data",
    description:
      "Define your fields — amounts, dates, vendor names, line items — with the visual schema builder. The AI extracts them from any format automatically.",
  },
  {
    number: "03",
    title: "Data Flows to Your Apps",
    description:
      "Extracted data pushes to Google Sheets, your CRM, ERP, or any app via Zapier, Make, webhooks, or REST API. Fully automated.",
  },
]

export function HowItWorksSection() {
  return (
    <SectionWrapper id="how-it-works" className="bg-muted/30">
      <div className="text-center mb-14">
        <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
          Get Started in Minutes, Not Days
        </h2>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          No complex setup. No training data required. Parsli works out of the box
          with any document type.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
        {steps.map((step, index) => (
          <div key={step.number} className="relative">
            {index < steps.length - 1 && (
              <div className="hidden md:block absolute top-8 h-px bg-border" style={{ left: "calc(50% + 2.5rem)", right: "calc(-50% + 0.5rem)" }} />
            )}
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary text-primary-foreground text-xl font-bold mb-5">
                {step.number}
              </div>
              <h3 className="text-lg font-semibold mb-3">{step.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {step.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </SectionWrapper>
  )
}
