"use client"

import { useState, useMemo } from "react"
import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { APP_URL } from "@/lib/config"

const plans = [
  { name: "Free", pages: 30, price: 0 },
  { name: "Starter", pages: 250, price: 16 },
  { name: "Growth", pages: 1_000, price: 39 },
  { name: "Pro", pages: 5_000, price: 79 },
  { name: "Business", pages: 25_000, price: 199 },
  { name: "Scale 50k", pages: 50_000, price: 499 },
  { name: "Scale 100k", pages: 100_000, price: 899 },
]

function recommendPlan(totalPages: number) {
  for (const plan of plans) {
    if (plan.pages >= totalPages) return plan
  }
  return plans[plans.length - 1]
}

export function SavingsCalculator() {
  const [docsPerMonth, setDocsPerMonth] = useState(1000)
  const [pagesPerDoc, setPagesPerDoc] = useState(3)
  const [minutesPerDoc, setMinutesPerDoc] = useState(10)
  const [hourlyRate, setHourlyRate] = useState(28)

  const calc = useMemo(() => {
    const totalPages = docsPerMonth * pagesPerDoc
    const manualHours = (docsPerMonth * minutesPerDoc) / 60
    const manualCost = manualHours * hourlyRate

    const plan = recommendPlan(totalPages)

    // With Parsli: ~1 minute per doc for review/QA
    const parsliHours = (docsPerMonth * 1) / 60
    const parsliLabor = parsliHours * hourlyRate
    const parsliTotal = plan.price + parsliLabor

    const monthlySavings = manualCost - parsliTotal
    const yearlySavings = monthlySavings * 12
    const savingsPercent =
      manualCost > 0
        ? Math.round((monthlySavings / manualCost) * 100)
        : 0

    return {
      totalPages,
      manualHours: Math.round(manualHours * 10) / 10,
      manualCost: Math.round(manualCost),
      parsliHours: Math.round(parsliHours * 10) / 10,
      parsliLabor: Math.round(parsliLabor),
      plan,
      parsliTotal: Math.round(parsliTotal),
      monthlySavings: Math.round(Math.max(0, monthlySavings)),
      yearlySavings: Math.round(Math.max(0, yearlySavings)),
      savingsPercent: Math.max(0, savingsPercent),
    }
  }, [docsPerMonth, pagesPerDoc, minutesPerDoc, hourlyRate])

  return (
    <section className="py-20 sm:py-24 lg:py-28 bg-muted/30">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-start">
          {/* Left — sliders */}
          <div>
            <p className="text-sm font-semibold text-primary uppercase tracking-wider mb-3">
              ROI Calculator
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-2">
              Is it worth it?{" "}
              <span className="text-primary">Yes!</span>
            </h2>
            <p className="text-muted-foreground mb-8">
              Adjust the sliders to match your use case and see how much you
              could save by automating with Parsli.
            </p>

            <div className="space-y-8">
              <RangeSlider
                label="Documents to process per month"
                value={docsPerMonth}
                onChange={setDocsPerMonth}
                min={10}
                max={5000}
                step={10}
                display={docsPerMonth.toLocaleString()}
                sublabel={`That's about ${Math.round(docsPerMonth / 22)} per business day`}
              />
              <RangeSlider
                label="Average pages per document"
                value={pagesPerDoc}
                onChange={setPagesPerDoc}
                min={1}
                max={20}
                step={1}
                display={`${pagesPerDoc}`}
                sublabel="For emails, assume 1 page"
              />
              <RangeSlider
                label="Minutes spent per document (manually)"
                value={minutesPerDoc}
                onChange={setMinutesPerDoc}
                min={2}
                max={30}
                step={1}
                display={`${minutesPerDoc} min`}
                sublabel="Including data entry, review, and corrections"
              />
              <RangeSlider
                label="Average yearly salary of employees (gross)"
                value={hourlyRate}
                onChange={setHourlyRate}
                min={15}
                max={75}
                step={1}
                display={`$${(hourlyRate * 2080).toLocaleString()}`}
                sublabel={`That's about $${(hourlyRate * 2080).toLocaleString()} per year, or $${hourlyRate} per hour`}
              />
            </div>
          </div>

          {/* Right — results */}
          <div className="lg:sticky lg:top-24">
            <div className="rounded-2xl bg-teal-600 text-white p-8 sm:p-10">
              <p className="text-sm font-medium opacity-80 mb-1">
                With Parsli, you could save
              </p>
              <p className="text-5xl sm:text-6xl font-bold tracking-tight">
                ${calc.yearlySavings.toLocaleString()}
              </p>
              <p className="text-lg opacity-80 mb-8">per year</p>

              {/* Comparison breakdown */}
              <div className="rounded-xl bg-white/10 backdrop-blur-sm p-5 space-y-3 text-sm">
                <div className="grid grid-cols-3 gap-2 pb-3 border-b border-white/20">
                  <div />
                  <p className="text-center font-medium opacity-70 text-xs uppercase tracking-wide">
                    Without Parsli
                  </p>
                  <p className="text-center font-medium opacity-70 text-xs uppercase tracking-wide">
                    With Parsli
                  </p>
                </div>
                <div className="grid grid-cols-3 gap-2 items-center">
                  <p className="opacity-80">Employee time</p>
                  <p className="text-center font-medium">
                    {calc.manualHours} hrs/mo
                  </p>
                  <p className="text-center font-medium">
                    {calc.parsliHours} hrs/mo
                  </p>
                </div>
                <div className="grid grid-cols-3 gap-2 items-center">
                  <p className="opacity-80">Labor cost</p>
                  <p className="text-center font-medium">
                    ${calc.manualCost.toLocaleString()}/mo
                  </p>
                  <p className="text-center font-medium">
                    ${calc.parsliLabor.toLocaleString()}/mo
                  </p>
                </div>
                <div className="grid grid-cols-3 gap-2 items-center">
                  <p className="opacity-80">Parsli cost</p>
                  <p className="text-center font-medium">$0/mo</p>
                  <p className="text-center font-medium">
                    ${calc.plan.price}/mo
                  </p>
                </div>
                <div className="grid grid-cols-3 gap-2 items-center pt-3 border-t border-white/20 font-semibold">
                  <p>Total cost</p>
                  <p className="text-center">
                    ${calc.manualCost.toLocaleString()}/mo
                  </p>
                  <p className="text-center">
                    ${calc.parsliTotal.toLocaleString()}/mo
                  </p>
                </div>
                <div className="text-center pt-2">
                  <span className="text-xs font-medium bg-white/20 rounded-full px-3 py-1">
                    {calc.savingsPercent}% savings &middot;{" "}
                    {calc.plan.name} plan
                  </span>
                </div>
              </div>

              <Button
                size="lg"
                className="w-full mt-6 text-base font-semibold bg-amber-500 hover:bg-amber-600 text-white shadow-md"
                asChild
              >
                <a
                  href={`${APP_URL}/login?mode=signup`}
                  data-cta-location="savings_calculator"
                  data-cta-name={`Sign up and save $${calc.yearlySavings.toLocaleString()}`}
                  data-cta-destination="signup"
                >
                  Sign up and save $
                  {calc.yearlySavings.toLocaleString()}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </a>
              </Button>
              <p className="text-xs text-center opacity-60 mt-3">
                No credit card required
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function RangeSlider({
  label,
  value,
  onChange,
  min,
  max,
  step,
  display,
  sublabel,
}: {
  label: string
  value: number
  onChange: (v: number) => void
  min: number
  max: number
  step: number
  display: string
  sublabel?: string
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between mb-3">
        <label className="text-sm font-medium">{label}</label>
        <span className="text-base font-bold tabular-nums">{display}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-2 bg-teal-100 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-teal-500 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:shadow-md"
      />
      {sublabel && (
        <p className="text-xs text-muted-foreground mt-1.5">{sublabel}</p>
      )}
    </div>
  )
}
