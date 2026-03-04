"use client"

import { Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

const PRICING_TIERS = [
  {
    name: "Free",
    pages: 50,
    price: 0,
    pricePerPage: "Free",
    features: [
      "50 pages per month",
      "Up to 5 parsers",
      "AI-powered extraction",
      "Webhook integrations",
      "Google Sheets export",
      "API access",
    ],
    cta: "Get Started",
    highlight: false,
  },
  {
    name: "Starter",
    pages: 500,
    price: 29,
    pricePerPage: "$0.058",
    features: [
      "500 pages per month",
      "Unlimited parsers",
      "AI-powered extraction",
      "All integrations",
      "API access",
      "Priority support",
    ],
    cta: "Coming Soon",
    highlight: true,
  },
  {
    name: "Pro",
    pages: 2000,
    price: 79,
    pricePerPage: "$0.040",
    features: [
      "2,000 pages per month",
      "Unlimited parsers",
      "AI-powered extraction",
      "All integrations",
      "API access",
      "Priority support",
      "Team collaboration",
    ],
    cta: "Coming Soon",
    highlight: false,
  },
  {
    name: "Enterprise",
    pages: 10000,
    price: 249,
    pricePerPage: "$0.025",
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
    cta: "Contact Us",
    highlight: false,
  },
]

export default function PricingPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold mb-3">Simple, page-based pricing</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Pay only for what you use. Start free with 50 pages per month.
          Price per page decreases as your volume increases.
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {PRICING_TIERS.map((tier) => (
          <div
            key={tier.name}
            className={cn(
              "border rounded-xl p-6 bg-card flex flex-col",
              tier.highlight && "border-primary shadow-lg ring-1 ring-primary relative"
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
              {tier.price === 0 ? (
                <div className="text-3xl font-bold">Free</div>
              ) : (
                <>
                  <div className="text-3xl font-bold">
                    ${tier.price}
                    <span className="text-sm font-normal text-muted-foreground">/mo</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {tier.pricePerPage} per page
                  </p>
                </>
              )}
            </div>

            <ul className="space-y-2 mb-6 flex-1">
              {tier.features.map((feature) => (
                <li key={feature} className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-primary shrink-0" />
                  {feature}
                </li>
              ))}
            </ul>

            <Button
              className="w-full"
              variant={tier.highlight ? "default" : "outline"}
              disabled={tier.cta === "Coming Soon"}
            >
              {tier.cta}
            </Button>
          </div>
        ))}
      </div>

      <div className="mt-16 text-center">
        <h2 className="text-xl font-semibold mb-3">Need more pages?</h2>
        <p className="text-muted-foreground mb-6 max-w-lg mx-auto">
          We offer custom volume pricing for businesses processing 10,000+ pages per month.
          The more you use, the less you pay per page.
        </p>
        <Button variant="outline" asChild>
          <a href="mailto:support@bytebeam.ai">Contact Sales</a>
        </Button>
      </div>
    </div>
  )
}
