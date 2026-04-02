"use client"

import { useState } from "react"
import { Check, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"
import { APP_URL } from "@/lib/config"

const tiers = [
  {
    tier: "free",
    name: "Free",
    description: "Take Parsli for a spin. See what it can do.",
    pages: 30,
    monthlyPrice: 0,
    annualPricePerMonth: 0,
    cta: "Get Started Free",
    features: [
      "30 pages per month",
      "Up to 3 parsers",
      "AI extraction (Gemini 2.5 Pro)",
      "All document types",
      "REST API + webhooks",
      "CSV & JSON export",
    ],
  },
  {
    tier: "starter",
    name: "Starter",
    description: "Start automating your extractions.",
    pages: 250,
    monthlyPrice: 20,
    annualPricePerMonth: 16,
    cta: "Start Free Trial",
    prevTier: "Free",
    features: [
      "250 pages per month",
      "Up to 10 parsers",
      "Google Sheets sync",
      "Zapier & Make",
      "Email support",
    ],
  },
  {
    tier: "growth",
    name: "Growth",
    description: "For teams with regular document processing.",
    pages: 1_000,
    monthlyPrice: 49,
    annualPricePerMonth: 39,
    cta: "Start Free Trial",
    highlight: true,
    prevTier: "Starter",
    features: [
      "1,000 pages per month",
      "Up to 25 parsers",
      "Priority support",
    ],
  },
  {
    tier: "pro",
    name: "Pro",
    description: "For high-volume operations.",
    pages: 5_000,
    monthlyPrice: 99,
    annualPricePerMonth: 79,
    cta: "Start Free Trial",
    prevTier: "Growth",
    features: [
      "5,000 pages per month",
      "Up to 100 parsers",
      "Team collaboration",
      "Dedicated API",
      "SLA guarantee",
    ],
  },
]

interface PricingSectionProps {
  /** Render as full pricing page header (h1) vs landing page section (h2) */
  asPage?: boolean
}

export function PricingSection({ asPage }: PricingSectionProps) {
  const [annual, setAnnual] = useState(true)
  const Heading = asPage ? "h1" : "h2"

  return (
    <section
      id="pricing"
      className={cn("py-20 sm:py-24 lg:py-28", !asPage && "bg-muted/30")}
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-14">
          <Heading
            className={cn(
              "font-bold tracking-tight mb-4",
              asPage ? "text-4xl sm:text-5xl" : "text-3xl sm:text-4xl"
            )}
          >
            Simple, volume-based pricing
          </Heading>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
            Start free and scale as you grow. Pay only for the pages you
            process. No credit card required.
          </p>

          {/* Billing toggle */}
          <div className="flex items-center justify-center gap-3">
            <span
              className={cn(
                "text-sm font-medium transition-colors",
                !annual ? "text-foreground" : "text-muted-foreground"
              )}
            >
              Monthly
            </span>
            <Switch checked={annual} onCheckedChange={setAnnual} />
            <span
              className={cn(
                "text-sm font-medium transition-colors",
                annual ? "text-foreground" : "text-muted-foreground"
              )}
            >
              Annually
            </span>
            {annual && (
              <Badge
                variant="secondary"
                className="ml-1 bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-50"
              >
                Save up to 20%
              </Badge>
            )}
          </div>
        </div>

        {/* Pricing cards */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {tiers.map((tier) => {
            const price = annual ? tier.annualPricePerMonth : tier.monthlyPrice
            return (
              <div
                key={tier.tier}
                className={cn(
                  "relative rounded-2xl border bg-card p-6 flex flex-col transition-shadow",
                  tier.highlight
                    ? "border-primary shadow-lg ring-2 ring-primary/20"
                    : "hover:shadow-md"
                )}
              >
                {tier.highlight && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1">
                    Most Popular
                  </Badge>
                )}

                <div className="mb-5">
                  <h3 className="text-lg font-semibold">{tier.name}</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {tier.description}
                  </p>
                </div>

                <div className="mb-6">
                  {price === 0 ? (
                    <>
                      <span className="text-4xl font-bold">$0</span>
                      <p className="text-sm text-muted-foreground mt-1">
                        Free forever
                      </p>
                    </>
                  ) : (
                    <>
                      <span className="text-4xl font-bold">${price}</span>
                      <span className="text-base text-muted-foreground">
                        /mo
                      </span>
                      {annual && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Billed ${tier.annualPricePerMonth * 12}/year
                        </p>
                      )}
                      <p className="text-xs text-primary font-medium mt-0.5">
                        ${(price / tier.pages).toFixed(3)} per page
                      </p>
                    </>
                  )}
                </div>

                <Button
                  className="w-full mb-6"
                  variant={tier.highlight ? "default" : "outline"}
                  size="lg"
                  asChild
                >
                  <a
                    href={`${APP_URL}/dashboard?subscribe=${tier.tier}&billing=${annual ? "annual" : "monthly"}`}
                  >
                    {tier.cta}
                  </a>
                </Button>

                {tier.prevTier && (
                  <p className="text-xs font-medium text-muted-foreground mb-3">
                    Everything in {tier.prevTier}, plus:
                  </p>
                )}

                <ul className="space-y-2.5 flex-1">
                  {tier.features.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-start gap-2 text-sm"
                    >
                      <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            )
          })}
        </div>

        {/* Enterprise banner */}
        <div className="mt-10 rounded-2xl border bg-card p-8 sm:p-10 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="text-xl font-semibold mb-2">
              Business &amp; Enterprise
            </h3>
            <p className="text-muted-foreground max-w-lg">
              Need more than 5,000 pages/month? Our Business plan starts at{" "}
              <strong className="text-foreground">
                ${annual ? "199" : "249"}/month
              </strong>{" "}
              for 25,000 pages. Custom volumes available.
            </p>
          </div>
          <Button
            variant="outline"
            size="lg"
            className="shrink-0 whitespace-nowrap"
            asChild
          >
            <a href="mailto:talal@bytebeam.co">
              Contact Sales
              <ArrowRight className="ml-2 h-4 w-4" />
            </a>
          </Button>
        </div>
      </div>
    </section>
  )
}
