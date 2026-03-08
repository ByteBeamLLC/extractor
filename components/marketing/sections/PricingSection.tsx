"use client"

import { useState } from "react"
import { Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"
import { APP_URL } from "@/lib/config"

const tiers = [
  {
    tier: "free",
    name: "Free",
    pages: 30,
    monthlyPrice: 0,
    annualPricePerMonth: 0,
    features: [
      "30 pages per month",
      "Up to 3 parsers",
      "AI-powered extraction",
      "Webhook integrations",
      "API access",
    ],
  },
  {
    tier: "starter",
    name: "Starter",
    pages: 100,
    monthlyPrice: 33,
    annualPricePerMonth: 27,
    features: [
      "100 pages per month",
      "Up to 10 parsers",
      "AI-powered extraction",
      "All integrations",
      "API access",
      "Email support",
    ],
  },
  {
    tier: "growth",
    name: "Growth",
    pages: 500,
    monthlyPrice: 59,
    annualPricePerMonth: 49,
    features: [
      "500 pages per month",
      "Up to 25 parsers",
      "AI-powered extraction",
      "All integrations",
      "API access",
      "Priority support",
    ],
    highlight: true,
  },
  {
    tier: "pro",
    name: "Pro",
    pages: 2_000,
    monthlyPrice: 99,
    annualPricePerMonth: 79,
    features: [
      "2,000 pages per month",
      "Up to 100 parsers",
      "AI-powered extraction",
      "All integrations",
      "API access",
      "Priority support",
      "Team collaboration",
    ],
  },
  {
    tier: "business",
    name: "Business",
    pages: 10_000,
    monthlyPrice: 349,
    annualPricePerMonth: 279,
    features: [
      "10,000 pages per month",
      "Unlimited parsers",
      "AI-powered extraction",
      "All integrations",
      "Dedicated API",
      "24/7 support",
      "Custom integrations",
      "SLA guarantee",
    ],
  },
]

export function PricingSection() {
  const [annual, setAnnual] = useState(true)

  return (
    <section id="pricing" className="py-20 sm:py-24 lg:py-28 bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
            Simple, Page-Based Pricing
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
            Pay only for what you use. Start free with 30 pages per month.
            Price per page decreases as your volume increases.
          </p>

          <div className="flex items-center justify-center gap-3">
            <span
              className={cn(
                "text-sm font-medium",
                !annual && "text-foreground",
                annual && "text-muted-foreground"
              )}
            >
              Monthly
            </span>
            <Switch checked={annual} onCheckedChange={setAnnual} />
            <span
              className={cn(
                "text-sm font-medium",
                annual && "text-foreground",
                !annual && "text-muted-foreground"
              )}
            >
              Annual
            </span>
            {annual && (
              <Badge variant="secondary" className="ml-1 text-xs">
                Save up to 20%
              </Badge>
            )}
          </div>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
          {tiers.map((tier) => {
            const price = annual ? tier.annualPricePerMonth : tier.monthlyPrice
            return (
              <div
                key={tier.tier}
                className={cn(
                  "border rounded-xl p-6 bg-card flex flex-col",
                  tier.highlight &&
                    "border-primary shadow-lg ring-1 ring-primary relative"
                )}
              >
                {tier.highlight && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">
                    Most Popular
                  </Badge>
                )}

                <div className="mb-4">
                  <h3 className="text-lg font-semibold">{tier.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {tier.pages.toLocaleString()} pages/month
                  </p>
                </div>

                <div className="mb-6">
                  {price === 0 ? (
                    <div className="text-3xl font-bold">Free</div>
                  ) : (
                    <>
                      <div className="text-3xl font-bold">
                        ${price}
                        <span className="text-sm font-normal text-muted-foreground">
                          /mo
                        </span>
                      </div>
                      {annual && (
                        <p className="text-xs text-muted-foreground mt-1">
                          ${tier.annualPricePerMonth * 12}/year billed annually
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-0.5">
                        ${(price / tier.pages).toFixed(3)} per page
                      </p>
                    </>
                  )}
                </div>

                <ul className="space-y-2 mb-6 flex-1">
                  {tier.features.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-center gap-2 text-sm"
                    >
                      <Check className="h-4 w-4 text-primary shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>

                <Button
                  className="w-full"
                  variant={tier.highlight ? "default" : "outline"}
                  asChild
                >
                  <a href={`${APP_URL}/dashboard?subscribe=${tier.tier}&billing=${annual ? "annual" : "monthly"}`}>
                    {tier.tier === "free" ? "Get Started Free" : "Start Free Trial"}
                  </a>
                </Button>
              </div>
            )
          })}
        </div>

        <div className="mt-12 text-center">
          <p className="text-muted-foreground mb-4">
            Need more than 10,000 pages per month?
          </p>
          <Button variant="outline" asChild>
            <a href="mailto:talal@bytebeam.co">Contact Sales</a>
          </Button>
        </div>
      </div>
    </section>
  )
}
