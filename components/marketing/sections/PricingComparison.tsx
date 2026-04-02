"use client"

import { Check, Minus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { APP_URL } from "@/lib/config"

/* ------------------------------------------------------------------ */
/*  Data                                                               */
/* ------------------------------------------------------------------ */

type CellValue = boolean | string

const tiers = [
  {
    name: "Free tier",
    key: "free",
    description: "Take Parsli for a spin. See what it can do.",
    cta: "Start free trial",
    accent: true,
  },
  {
    name: "Base tier",
    key: "starter",
    description: "Our range of entry plans. Start automating your extractions.",
    cta: "Start free trial",
  },
  {
    name: "Scale tier",
    key: "business",
    description: "Our range of heavy-duty plans. Lowest cost per page.",
    cta: "Start free trial",
    highlighted: true,
  },
  {
    name: "Enterprise tier",
    key: "enterprise",
    description: "Custom plans for large organizations.",
    cta: "Request a quote",
  },
]

interface Row {
  feature: string
  values?: CellValue[]
  isCategory?: boolean
}

const rows: Row[] = [
  {
    feature: "Pages processed / month",
    values: ["Up to 30", "Up to 5,000", "Up to 100,000", "Up to 1 million"],
  },
  {
    feature: "Multiple parsers",
    values: ["3", "Unlimited", "Unlimited", "Unlimited"],
  },
  {
    feature: "Extracted fields",
    values: ["Unlimited", "Unlimited", "Unlimited", "Unlimited"],
  },
  {
    feature: "AI parsing engine",
    values: [true, true, true, true],
  },
  {
    feature: "No-code schema builder",
    values: [true, true, true, true],
  },
  {
    feature: "Advanced post-processing",
    values: [false, true, true, true],
  },
  {
    feature: "Multi-user accounts",
    values: ["1 user", "1 user", "Up to 100", "Unlimited"],
  },
  {
    feature: "Document retention",
    values: ["30 days", "1 year", "Unlimited", "Unlimited"],
  },
  // Category: Integrations
  { feature: "Integrations", isCategory: true },
  {
    feature: "Excel, CSV, and JSON",
    values: [true, true, true, true],
  },
  {
    feature: "Google Sheets",
    values: [true, true, true, true],
  },
  { feature: "Zapier", values: [true, true, true, true] },
  { feature: "Make.com", values: [true, true, true, true] },
  { feature: "Webhooks", values: [true, true, true, true] },
  { feature: "API", values: [true, true, true, true] },
  // Category: Support
  {
    feature: "Support, Billing, and Compliance",
    isCategory: true,
  },
  {
    feature: "24/7 AI and self-serve support",
    values: [true, true, true, true],
  },
  {
    feature: "Chat and email support",
    values: [false, true, true, true],
  },
  {
    feature: "Priority customer support",
    values: [false, false, true, true],
  },
  {
    feature: "Payment by credit card",
    values: [true, true, true, true],
  },
  {
    feature: "Data privacy compliance",
    values: [true, true, true, true],
  },
  {
    feature: "SLA guarantee",
    values: [false, false, true, true],
  },
  {
    feature: "Custom integrations",
    values: [false, false, false, true],
  },
]

/* ------------------------------------------------------------------ */
/*  Cell renderer                                                      */
/* ------------------------------------------------------------------ */

function CellDisplay({
  value,
  isAccentColumn,
}: {
  value: CellValue
  isAccentColumn?: boolean
}) {
  if (typeof value === "string") {
    return (
      <span
        className={cn(
          "text-sm font-medium",
          isAccentColumn && "text-teal-600"
        )}
      >
        {value}
      </span>
    )
  }
  return value ? (
    <Check
      className={cn(
        "h-4 w-4 mx-auto",
        isAccentColumn ? "text-teal-500" : "text-primary"
      )}
    />
  ) : (
    <Minus className="h-4 w-4 text-muted-foreground/25 mx-auto" />
  )
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function PricingComparison() {
  return (
    <section className="py-20 sm:py-24 lg:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
          <div className="min-w-[800px]">
            {/* ———— Tier tab headers ———— */}
            <div className="grid grid-cols-5 gap-0 mb-4">
              <div />
              {tiers.map((tier) => (
                <div
                  key={tier.key}
                  className={cn(
                    "px-3 pb-4 text-center border-b-2",
                    tier.accent
                      ? "border-teal-500"
                      : tier.highlighted
                        ? "border-primary"
                        : "border-transparent"
                  )}
                >
                  <p
                    className={cn(
                      "text-sm font-bold mb-1",
                      tier.accent
                        ? "text-teal-600"
                        : tier.highlighted
                          ? "text-primary"
                          : "text-foreground"
                    )}
                  >
                    {tier.name}
                  </p>
                  <p className="text-xs text-muted-foreground leading-snug">
                    {tier.description}
                  </p>
                </div>
              ))}
            </div>

            {/* ———— Feature rows ———— */}
            <div className="rounded-xl border bg-card overflow-hidden">
              {rows.map((row, ri) => {
                if (row.isCategory) {
                  return (
                    <div
                      key={row.feature}
                      className={cn(
                        "px-6 py-3.5 font-semibold text-sm bg-muted/60",
                        ri > 0 && "border-t"
                      )}
                    >
                      {row.feature}
                    </div>
                  )
                }

                return (
                  <div
                    key={row.feature}
                    className="grid grid-cols-5 gap-0 px-6 py-3 items-center border-t border-border/40"
                  >
                    <p className="text-sm">{row.feature}</p>
                    {row.values!.map((val, vi) => (
                      <div key={vi} className="text-center">
                        <CellDisplay
                          value={val}
                          isAccentColumn={tiers[vi].accent}
                        />
                      </div>
                    ))}
                  </div>
                )
              })}
            </div>

            {/* ———— CTA buttons per tier ———— */}
            <div className="grid grid-cols-5 gap-0 mt-5">
              <div />
              {tiers.map((tier) => (
                <div key={tier.key} className="text-center px-2">
                  <Button
                    size="sm"
                    variant={tier.highlighted ? "default" : "outline"}
                    className={cn(
                      "w-full text-xs font-semibold",
                      tier.highlighted &&
                        "bg-amber-500 hover:bg-amber-600 text-white border-amber-500"
                    )}
                    asChild
                  >
                    <a
                      href={
                        tier.key === "enterprise"
                          ? "mailto:talal@bytebeam.co"
                          : `${APP_URL}/dashboard?subscribe=${tier.key}&billing=annual`
                      }
                    >
                      {tier.cta}
                    </a>
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
