import { SectionWrapper } from "@/components/marketing/shared/SectionWrapper"

const steps = [
  {
    number: "01",
    title: "Create a Parser",
    description:
      "Give your parser a name like \"Invoice Parser\" or \"Receipt Scanner\". Each parser is a reusable template for a specific document type.",
  },
  {
    number: "02",
    title: "Define Your Schema",
    description:
      "Tell the AI what data to extract. Add fields like invoice number, vendor name, total amount. Set types (text, number, date, table) for clean output.",
  },
  {
    number: "03",
    title: "Upload & Extract",
    description:
      "Upload a document or connect Gmail for automatic processing. The AI extracts your data in seconds with high accuracy and confidence scoring.",
  },
  {
    number: "04",
    title: "Connect & Automate",
    description:
      "Send extracted data to Google Sheets, Zapier, Make, or your own app via webhooks and API. Automate your entire document workflow.",
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

      <div className="grid md:grid-cols-4 gap-6 lg:gap-8">
        {steps.map((step, index) => (
          <div key={step.number} className="relative">
            {/* Connector line — extends from current icon to next icon across the grid gap */}
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
