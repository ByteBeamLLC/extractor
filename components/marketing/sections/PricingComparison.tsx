"use client"

import { useState } from "react"
import { Check, Minus, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { APP_URL } from "@/lib/config"

type CellValue = boolean | string

interface ComparisonRow {
  feature: string
  values: CellValue[]
}

interface ComparisonCategory {
  name: string
  rows: ComparisonRow[]
}

const tierNames = ["Free", "Starter", "Growth", "Pro", "Business"]
const tierKeys = ["free", "starter", "growth", "pro", "business"]

const categories: ComparisonCategory[] = [
  {
    name: "Core Features",
    rows: [
      {
        feature: "Pages per month",
        values: ["30", "250", "1,000", "5,000", "25,000"],
      },
      {
        feature: "Parsers",
        values: ["3", "10", "25", "100", "Unlimited"],
      },
      {
        feature: "AI extraction (Gemini 2.5 Pro)",
        values: [true, true, true, true, true],
      },
      {
        feature: "Supported document types",
        values: ["All", "All", "All", "All", "All"],
      },
      {
        feature: "No-code schema builder",
        values: [true, true, true, true, true],
      },
      {
        feature: "Team collaboration",
        values: [false, false, false, true, true],
      },
    ],
  },
  {
    name: "Import & Export",
    rows: [
      { feature: "File upload", values: [true, true, true, true, true] },
      { feature: "REST API", values: [true, true, true, true, true] },
      {
        feature: "Email forwarding (auto-import)",
        values: [true, true, true, true, true],
      },
      { feature: "Webhooks", values: [true, true, true, true, true] },
      {
        feature: "CSV & JSON export",
        values: [true, true, true, true, true],
      },
      { feature: "Google Sheets", values: [true, true, true, true, true] },
      { feature: "Zapier", values: [true, true, true, true, true] },
      {
        feature: "Make (Integromat)",
        values: [true, true, true, true, true],
      },
      {
        feature: "Dedicated API",
        values: [false, false, false, true, true],
      },
      {
        feature: "Custom integrations",
        values: [false, false, false, false, true],
      },
    ],
  },
  {
    name: "Support & Security",
    rows: [
      {
        feature: "AI self-serve support",
        values: [true, true, true, true, true],
      },
      {
        feature: "Email support",
        values: [false, true, true, true, true],
      },
      {
        feature: "Priority support",
        values: [false, false, true, true, true],
      },
      {
        feature: "24/7 dedicated support",
        values: [false, false, false, false, true],
      },
      {
        feature: "SLA guarantee",
        values: [false, false, false, true, true],
      },
      {
        feature: "Data privacy compliance",
        values: [true, true, true, true, true],
      },
    ],
  },
]

function CellDisplay({ value }: { value: CellValue }) {
  if (typeof value === "string") {
    return <span className="text-sm font-medium">{value}</span>
  }
  return value ? (
    <Check className="h-4 w-4 text-primary mx-auto" />
  ) : (
    <Minus className="h-4 w-4 text-muted-foreground/30 mx-auto" />
  )
}

export function PricingComparison() {
  const [expanded, setExpanded] = useState<Set<string>>(
    new Set(["Core Features"])
  )

  const toggle = (name: string) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      next.has(name) ? next.delete(name) : next.add(name)
      return next
    })
  }

  return (
    <section className="py-20 sm:py-24 lg:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-center mb-12">
          Compare plans and features
        </h2>

        <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
          <div className="min-w-[700px]">
            {/* Tier header row */}
            <div className="grid grid-cols-6 gap-0 mb-3 px-6">
              <div />
              {tierNames.map((name) => (
                <div key={name} className="text-center px-2">
                  <p
                    className={cn(
                      "text-sm font-semibold",
                      name === "Growth" && "text-primary"
                    )}
                  >
                    {name}
                  </p>
                </div>
              ))}
            </div>

            {/* Categories */}
            <div className="rounded-xl border bg-card overflow-hidden">
              {categories.map((cat, ci) => {
                const isOpen = expanded.has(cat.name)
                return (
                  <div
                    key={cat.name}
                    className={cn(ci > 0 && "border-t")}
                  >
                    <button
                      onClick={() => toggle(cat.name)}
                      className="w-full flex items-center justify-between px-6 py-4 bg-muted/50 hover:bg-muted/70 transition-colors"
                    >
                      <span className="text-sm font-semibold">
                        {cat.name}
                      </span>
                      <span className="flex items-center gap-2 text-sm text-muted-foreground">
                        {isOpen ? "Hide" : "Show"}
                        <ChevronDown
                          className={cn(
                            "h-4 w-4 transition-transform duration-200",
                            isOpen && "rotate-180"
                          )}
                        />
                      </span>
                    </button>
                    {isOpen &&
                      cat.rows.map((row, ri) => (
                        <div
                          key={row.feature}
                          className={cn(
                            "grid grid-cols-6 gap-0 px-6 py-3 items-center border-t border-border/50",
                            ri % 2 === 1 && "bg-muted/20"
                          )}
                        >
                          <p className="text-sm">{row.feature}</p>
                          {row.values.map((val, vi) => (
                            <div key={vi} className="text-center">
                              <CellDisplay value={val} />
                            </div>
                          ))}
                        </div>
                      ))}
                  </div>
                )
              })}
            </div>

            {/* CTA row */}
            <div className="grid grid-cols-6 gap-0 mt-4 px-6">
              <div />
              {tierNames.map((name, i) => (
                <div key={name} className="text-center px-2">
                  <Button
                    size="sm"
                    variant={name === "Growth" ? "default" : "outline"}
                    className="w-full text-xs"
                    asChild
                  >
                    <a
                      href={
                        name === "Business"
                          ? "mailto:talal@bytebeam.co"
                          : `${APP_URL}/dashboard?subscribe=${tierKeys[i]}&billing=annual`
                      }
                    >
                      {name === "Business" ? "Contact Sales" : "Get Started"}
                    </a>
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <p className="text-center text-sm text-muted-foreground mt-8">
          All plans include all document types, schema builder, and core
          integrations.{" "}
          <a
            href="mailto:talal@bytebeam.co"
            className="text-primary underline underline-offset-2"
          >
            Contact us
          </a>{" "}
          for custom plans.
        </p>
      </div>
    </section>
  )
}
