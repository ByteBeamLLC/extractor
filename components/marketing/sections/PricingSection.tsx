"use client"

import { useState, useMemo } from "react"
import { Check, ArrowRight, Ban, Bot } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"
import { APP_URL } from "@/lib/config"

/* ------------------------------------------------------------------ */
/*  Plan definitions                                                   */
/* ------------------------------------------------------------------ */

const allPlans = [
  {
    tier: "free" as const,
    name: "Free",
    pages: 30,
    monthlyPrice: 0,
    annualPricePerMonth: 0,
    sliderDescription:
      "Start on our free tier, which includes 30 pages every month.",
    cardDescription: "Take Parsli for a spin. See what it can do.",
    cardFeatures: [
      "30 pages per month",
      "Up to 3 parsers",
      "AI extraction (Gemini 2.5 Pro)",
      "All document types",
      "REST API + webhooks",
      "CSV & JSON export",
    ],
  },
  {
    tier: "starter" as const,
    name: "Starter",
    pages: 250,
    monthlyPrice: 20,
    annualPricePerMonth: 16,
    sliderDescription:
      "Our entry plan. Start automating your document extractions.",
    cardDescription: "Start automating your extractions.",
    prevTier: "Free",
    cardFeatures: [
      "250 pages per month",
      "Up to 10 parsers",
      "Google Sheets sync",
      "Zapier & Make",
      "Email support",
    ],
  },
  {
    tier: "growth" as const,
    name: "Growth",
    pages: 1_000,
    monthlyPrice: 49,
    annualPricePerMonth: 39,
    sliderDescription:
      "For growing teams with regular document processing needs.",
    cardDescription: "For teams with regular document processing.",
    highlight: true,
    prevTier: "Starter",
    cardFeatures: [
      "1,000 pages per month",
      "Up to 25 parsers",
      "Priority support",
    ],
  },
  {
    tier: "pro" as const,
    name: "Pro",
    pages: 5_000,
    monthlyPrice: 99,
    annualPricePerMonth: 79,
    sliderDescription:
      "For high-volume operations. Lowest cost per page.",
    cardDescription: "For high-volume operations.",
    prevTier: "Growth",
    cardFeatures: [
      "5,000 pages per month",
      "Up to 100 parsers",
      "Team collaboration",
      "Dedicated API",
      "SLA guarantee",
    ],
  },
  {
    tier: "business" as const,
    name: "Business",
    pages: 25_000,
    monthlyPrice: 249,
    annualPricePerMonth: 199,
    sliderDescription:
      "For large organizations. Custom plans available.",
    cardDescription: "For enterprise needs.",
    cardFeatures: [],
  },
]

/* ------------------------------------------------------------------ */
/*  Slider helpers                                                     */
/* ------------------------------------------------------------------ */

const pageStops = [
  20, 30, 50, 100, 150, 200, 250, 500, 750, 1_000, 2_000, 3_000, 5_000,
  10_000, 25_000,
]

function planForPages(pages: number) {
  if (pages <= 30) return allPlans[0]
  if (pages <= 250) return allPlans[1]
  if (pages <= 1_000) return allPlans[2]
  if (pages <= 5_000) return allPlans[3]
  return allPlans[4]
}

type FeatureStatus = "included" | "excluded" | "info"

interface IncludedFeature {
  label: string
  status: FeatureStatus
}

function whatsIncluded(
  tierIndex: number,
  plan: (typeof allPlans)[number]
): IncludedFeature[] {
  return [
    { label: "1 page = 1 credit", status: "included" },
    {
      label: `${plan.pages.toLocaleString()} credits valid for a month`,
      status: "included",
    },
    { label: "Credits renew every month", status: "included" },
    { label: "Cancel at any time", status: "included" },
    {
      label: "Invite team members",
      status: tierIndex >= 3 ? "included" : "excluded",
    },
    {
      label: "Priority support",
      status: tierIndex >= 2 ? "included" : "excluded",
    },
    { label: "AI and self-serve support", status: "info" },
  ]
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

interface PricingSectionProps {
  asPage?: boolean
}

export function PricingSection({ asPage }: PricingSectionProps) {
  const [annual, setAnnual] = useState(true)
  const [sliderIndex, setSliderIndex] = useState(0)

  const Heading = asPage ? "h1" : "h2"

  // Slider-derived state
  const pages = pageStops[sliderIndex]
  const plan = useMemo(() => planForPages(pages), [pages])
  const price = annual ? plan.annualPricePerMonth : plan.monthlyPrice
  const tierIndex = allPlans.indexOf(plan)
  const features = useMemo(
    () => whatsIncluded(tierIndex, plan),
    [tierIndex, plan]
  )

  return (
    <section
      id="pricing"
      className={cn("py-20 sm:py-24 lg:py-28", !asPage && "bg-muted/30")}
    >
      <div
        className={cn(
          "mx-auto px-4 sm:px-6 lg:px-8",
          asPage ? "max-w-4xl" : "max-w-6xl"
        )}
      >
        {/* ———— Header ———— */}
        <div className="text-center mb-12">
          <Heading
            className={cn(
              "font-bold tracking-tight mb-6",
              asPage ? "text-4xl sm:text-5xl" : "text-3xl sm:text-4xl"
            )}
          >
            Simple volume-based pricing
          </Heading>

          {/* Billing toggle with colored "Annually" pill */}
          <div className="relative inline-flex items-center justify-center gap-3">
            {annual && (
              <span className="absolute -top-8 right-0 text-xs font-bold text-teal-600 whitespace-nowrap">
                Get 2+ months free!
                <svg
                  className="absolute -bottom-3 right-6 w-5 h-4 text-teal-600"
                  viewBox="0 0 20 16"
                  fill="none"
                >
                  <path
                    d="M10 14c0-6-4-10-8-12"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  <path
                    d="M2 2l-1 4 4-1"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
            )}
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
                "text-sm font-semibold transition-all rounded-full px-3 py-0.5",
                annual
                  ? "bg-amber-500 text-white"
                  : "text-muted-foreground"
              )}
            >
              Annually
            </span>
          </div>
        </div>

        {asPage ? (
          /* ============================================================ */
          /*  PRICING PAGE — Slider + dynamic card + what's included      */
          /* ============================================================ */
          <>
            {/* Slider */}
            <div className="text-center mb-12">
              <p className="text-muted-foreground mb-6">
                How many pages do you process per month? Move the slider.
              </p>
              <div className="max-w-2xl mx-auto mb-3">
                <input
                  type="range"
                  min={0}
                  max={pageStops.length - 1}
                  step={1}
                  value={sliderIndex}
                  onChange={(e) => setSliderIndex(Number(e.target.value))}
                  className="w-full h-2 rounded-full appearance-none cursor-pointer bg-gradient-to-r from-teal-200 to-teal-100 [&::-webkit-slider-thumb]:h-7 [&::-webkit-slider-thumb]:w-7 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:border-[3px] [&::-webkit-slider-thumb]:border-teal-500 [&::-webkit-slider-thumb]:shadow-lg"
                />
              </div>
              <p className="text-lg font-bold tabular-nums">
                {pages.toLocaleString()} pages / month
              </p>
            </div>

            {/* Dynamic plan card + What's included panel */}
            <div className="grid md:grid-cols-2 gap-0 rounded-2xl overflow-hidden border max-w-3xl mx-auto shadow-sm">
              {/* Left — Plan card */}
              <div className="bg-card p-8 sm:p-10">
                <div className="relative border rounded-xl px-8 pt-10 pb-8">
                  <span className="absolute -top-3.5 left-6 bg-card px-3 text-sm font-bold text-muted-foreground">
                    {plan.name} plan
                  </span>

                  <p className="text-6xl font-bold tracking-tight mb-1">
                    ${price}
                  </p>
                  <p className="text-sm text-muted-foreground mb-5">
                    {price === 0
                      ? "Free forever"
                      : annual
                        ? "Monthly price in USD (billed annually)"
                        : "Monthly price in USD"}
                  </p>
                  <p className="text-sm text-muted-foreground mb-6">
                    {plan.sliderDescription}
                  </p>

                  <Button
                    size="lg"
                    className="w-full text-base font-semibold bg-amber-500 hover:bg-amber-600 text-white shadow-md"
                    asChild
                  >
                    <a
                      href={
                        plan.tier === "business"
                          ? "mailto:talal@bytebeam.co"
                          : `${APP_URL}/dashboard?subscribe=${plan.tier}&billing=${annual ? "annual" : "monthly"}`
                      }
                    >
                      {plan.tier === "business"
                        ? "Contact sales"
                        : "Get started"}
                    </a>
                  </Button>

                  <p className="text-xs text-muted-foreground mt-4 text-center">
                    All prices exclusive of VAT/GST, where applicable.
                  </p>
                </div>
              </div>

              {/* Right — What's included (teal panel like Parseur) */}
              <div className="bg-teal-600 text-white p-8 sm:p-10 flex flex-col justify-center">
                <h3 className="text-2xl sm:text-3xl font-bold mb-6">
                  What&apos;s included?
                </h3>
                <ul className="space-y-4">
                  {features.map((f) => (
                    <li
                      key={f.label}
                      className="flex items-center gap-3 text-sm"
                    >
                      {f.status === "included" && (
                        <Check className="h-5 w-5 text-teal-200 shrink-0" />
                      )}
                      {f.status === "excluded" && (
                        <Ban className="h-5 w-5 text-white/40 shrink-0" />
                      )}
                      {f.status === "info" && (
                        <Bot className="h-5 w-5 text-teal-200 shrink-0" />
                      )}
                      <span
                        className={cn(
                          f.status === "excluded" && "text-white/40"
                        )}
                      >
                        {f.label}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </>
        ) : (
          /* ============================================================ */
          /*  LANDING PAGE — Card grid                                    */
          /* ============================================================ */
          <>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-10 text-center -mt-4">
              Start free and scale as you grow. Pay only for the pages you
              process. No credit card required.
            </p>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {allPlans.slice(0, 4).map((tier) => {
                const cardPrice = annual
                  ? tier.annualPricePerMonth
                  : tier.monthlyPrice
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
                        {tier.cardDescription}
                      </p>
                    </div>

                    <div className="mb-6">
                      {cardPrice === 0 ? (
                        <>
                          <span className="text-4xl font-bold">$0</span>
                          <p className="text-sm text-muted-foreground mt-1">
                            Free forever
                          </p>
                        </>
                      ) : (
                        <>
                          <span className="text-4xl font-bold">
                            ${cardPrice}
                          </span>
                          <span className="text-base text-muted-foreground">
                            /mo
                          </span>
                          {annual && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Billed ${tier.annualPricePerMonth * 12}/year
                            </p>
                          )}
                          <p className="text-xs text-teal-600 font-medium mt-0.5">
                            ${(cardPrice / tier.pages).toFixed(3)} per page
                          </p>
                        </>
                      )}
                    </div>

                    <Button
                      className={cn(
                        "w-full mb-6",
                        tier.highlight
                          ? "bg-amber-500 hover:bg-amber-600 text-white"
                          : ""
                      )}
                      variant={tier.highlight ? "default" : "outline"}
                      size="lg"
                      asChild
                    >
                      <a
                        href={`${APP_URL}/dashboard?subscribe=${tier.tier}&billing=${annual ? "annual" : "monthly"}`}
                      >
                        {tier.tier === "free"
                          ? "Get Started Free"
                          : "Start Free Trial"}
                      </a>
                    </Button>

                    {tier.prevTier && (
                      <p className="text-xs font-medium text-muted-foreground mb-3">
                        Everything in {tier.prevTier}, plus:
                      </p>
                    )}

                    <ul className="space-y-2.5 flex-1">
                      {tier.cardFeatures.map((feature) => (
                        <li
                          key={feature}
                          className="flex items-start gap-2 text-sm"
                        >
                          <Check className="h-4 w-4 text-teal-500 shrink-0 mt-0.5" />
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
                  Need more than 5,000 pages/month? Our Business plan starts
                  at{" "}
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
          </>
        )}
      </div>
    </section>
  )
}
