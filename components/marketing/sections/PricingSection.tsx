"use client"

import { useState, useMemo } from "react"
import { Check, ArrowRight, Ban, Bot, HeadsetIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"
import { APP_URL } from "@/lib/config"

/* ------------------------------------------------------------------ */
/*  Plan definitions — ~30-60 % cheaper than Parseur at every tier     */
/* ------------------------------------------------------------------ */
/*  Parseur comparison (annual):                                       */
/*    Parseur Micro  100pg  $39  → Parsli Starter 250pg  $16  (59%)   */
/*    Parseur Starter 1kpg $99  → Parsli Growth  1kpg   $39  (61%)   */
/*    Parseur Premium 3kpg $199 → Parsli Pro     5kpg   $79  (60%)   */
/*    Parseur Pro    10kpg $399 → Parsli Biz    25kpg  $199  (50%)   */
/*    Parseur 50k   50kpg $1499 → Parsli 50k   50kpg  $499  (67%)   */
/*    Parseur 100k 100kpg $2799 → Parsli 100k 100kpg  $899  (68%)   */
/* ------------------------------------------------------------------ */

interface Plan {
  tier: string
  name: string
  pages: number
  monthlyPrice: number
  annualPricePerMonth: number
  description: string
  isCustom?: boolean
  /** tier-index for feature gating: 0=free … 7=enterprise */
  level: number
}

const sliderPlans: Plan[] = [
  {
    tier: "free",
    name: "Free",
    pages: 30,
    monthlyPrice: 0,
    annualPricePerMonth: 0,
    description: "Start on our free tier, which includes 30 pages every month.",
    level: 0,
  },
  {
    tier: "starter",
    name: "Starter",
    pages: 250,
    monthlyPrice: 20,
    annualPricePerMonth: 16,
    description: "Our entry plan. Start automating your document extractions.",
    level: 1,
  },
  {
    tier: "growth",
    name: "Growth",
    pages: 1_000,
    monthlyPrice: 49,
    annualPricePerMonth: 39,
    description:
      "For growing teams with regular document processing needs.",
    level: 2,
  },
  {
    tier: "pro",
    name: "Pro",
    pages: 5_000,
    monthlyPrice: 99,
    annualPricePerMonth: 79,
    description: "For high-volume operations. Lowest cost per page.",
    level: 3,
  },
  {
    tier: "business",
    name: "Business",
    pages: 25_000,
    monthlyPrice: 249,
    annualPricePerMonth: 199,
    description: "For large teams processing tens of thousands of pages.",
    level: 4,
  },
  {
    tier: "scale50k",
    name: "Scale 50k",
    pages: 50_000,
    monthlyPrice: 649,
    annualPricePerMonth: 499,
    description:
      "Heavy-duty plan for operations teams. 67% cheaper than Parseur.",
    level: 5,
  },
  {
    tier: "scale100k",
    name: "Scale 100k",
    pages: 100_000,
    monthlyPrice: 1_149,
    annualPricePerMonth: 899,
    description:
      "Enterprise-grade volume at a fraction of the cost. 68% cheaper than Parseur.",
    level: 6,
  },
  {
    tier: "enterprise",
    name: "Enterprise",
    pages: Infinity,
    monthlyPrice: 0,
    annualPricePerMonth: 0,
    description: "",
    isCustom: true,
    level: 7,
  },
]

/* ---- page stops for the slider ---- */

const pageStops = [
  20, 30, 50, 100, 150, 200, 250, 500, 750, 1_000, 2_000, 3_000, 5_000,
  10_000, 15_000, 25_000, 35_000, 50_000, 75_000, 100_000, 150_000,
]

function planForPages(pages: number): Plan {
  if (pages <= 30) return sliderPlans[0]
  if (pages <= 250) return sliderPlans[1]
  if (pages <= 1_000) return sliderPlans[2]
  if (pages <= 5_000) return sliderPlans[3]
  if (pages <= 25_000) return sliderPlans[4]
  if (pages <= 50_000) return sliderPlans[5]
  if (pages <= 100_000) return sliderPlans[6]
  return sliderPlans[7] // enterprise
}

/* ---- "What's included?" features ---- */

type FeatureStatus = "included" | "excluded" | "info"

interface IncludedFeature {
  label: string
  status: FeatureStatus
}

function whatsIncluded(plan: Plan): IncludedFeature[] {
  const l = plan.level
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
      status: l >= 3 ? "included" : "excluded",
    },
    {
      label: "Advanced post-processing",
      status: l >= 2 ? "included" : "excluded",
    },
    {
      label: l >= 4 ? "Priority support" : "AI and self-serve support",
      status: "info",
    },
  ]
}

/* ---- landing-page card tiers (first 4 only) ---- */

const cardPlans = sliderPlans.slice(0, 4).map((p, i, arr) => ({
  ...p,
  highlight: p.tier === "growth",
  prevTier: i > 0 ? arr[i - 1].name : undefined,
  cardDescription:
    p.tier === "free"
      ? "Take Parsli for a spin. See what it can do."
      : p.tier === "starter"
        ? "Start automating your extractions."
        : p.tier === "growth"
          ? "For teams with regular document processing."
          : "For high-volume operations.",
  cardFeatures:
    p.tier === "free"
      ? [
          "30 pages per month",
          "Up to 3 parsers",
          "AI extraction (Gemini 2.5 Pro)",
          "All document types",
          "REST API + webhooks",
          "CSV & JSON export",
        ]
      : p.tier === "starter"
        ? [
            "250 pages per month",
            "Up to 10 parsers",
            "Google Sheets sync",
            "Zapier & Make",
            "Email support",
          ]
        : p.tier === "growth"
          ? ["1,000 pages per month", "Up to 25 parsers", "Priority support"]
          : [
              "5,000 pages per month",
              "Up to 100 parsers",
              "Team collaboration",
              "Dedicated API",
              "SLA guarantee",
            ],
}))

/* ================================================================== */
/*  Component                                                          */
/* ================================================================== */

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
  const features = useMemo(() => whatsIncluded(plan), [plan])
  const isFree = plan.level === 0
  const isCustom = !!plan.isCustom
  const perPage =
    !isFree && !isCustom ? (price / plan.pages).toFixed(plan.pages >= 25_000 ? 3 : 2) : null
  const isLastStop = sliderIndex === pageStops.length - 1

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

          {/* Billing toggle */}
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
          /*  PRICING PAGE — Slider + dynamic card                        */
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
              <p className="text-lg font-bold tabular-nums inline-block bg-muted/60 rounded px-3 py-1">
                {isLastStop
                  ? "100,000+ pages / month"
                  : `${pages.toLocaleString()} pages / month`}
              </p>
            </div>

            {/* Plan card + What's included */}
            <div className="grid md:grid-cols-2 gap-0 rounded-2xl overflow-hidden border max-w-3xl mx-auto shadow-sm">
              {/* ---- Left: Plan card ---- */}
              <div className="bg-card p-8 sm:p-10">
                {isCustom ? (
                  /* High-volume card */
                  <div className="flex flex-col justify-center h-full text-center">
                    <h3 className="text-3xl sm:text-4xl font-bold mb-3">
                      High volume?
                    </h3>
                    <p className="text-muted-foreground text-sm mb-6">
                      Sign up to check our high-volume pricing options,
                      including up to 1M pages per month.
                    </p>
                    <Button
                      size="lg"
                      className="w-full text-base font-semibold bg-amber-500 hover:bg-amber-600 text-white shadow-md"
                      asChild
                    >
                      <a href="mailto:talal@bytebeam.co">Get started</a>
                    </Button>
                    <p className="text-sm text-muted-foreground mt-4">
                      Start with 30 pages per month for free
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      All prices exclusive of VAT/GST, where applicable.
                    </p>
                  </div>
                ) : (
                  /* Standard plan card */
                  <div className="relative border rounded-xl px-8 pt-10 pb-8">
                    <span className="absolute -top-3.5 left-6 bg-card px-3 text-sm font-bold text-muted-foreground">
                      {plan.name} plan
                    </span>

                    {/* Strikethrough monthly price when annual */}
                    {annual && !isFree && (
                      <p className="text-lg text-muted-foreground/50 line-through tabular-nums">
                        ${plan.monthlyPrice}
                      </p>
                    )}

                    <p className="text-6xl font-bold tracking-tight">
                      ${isFree ? "0" : price.toLocaleString()}
                    </p>
                    <p className="text-sm text-muted-foreground mb-1">
                      {isFree
                        ? "Free forever"
                        : annual
                          ? "Monthly price in USD, when paid annually"
                          : "Monthly price in USD"}
                    </p>

                    {/* $/page */}
                    {perPage && (
                      <p className="text-base font-bold mb-5 tabular-nums">
                        ${perPage} / page
                      </p>
                    )}
                    {isFree && <div className="mb-5" />}

                    <Button
                      size="lg"
                      className="w-full text-base font-semibold bg-amber-500 hover:bg-amber-600 text-white shadow-md"
                      asChild
                    >
                      <a
                        href={
                          plan.level >= 5
                            ? "mailto:talal@bytebeam.co"
                            : `${APP_URL}/dashboard?subscribe=${plan.tier}&billing=${annual ? "annual" : "monthly"}`
                        }
                      >
                        {plan.level >= 5 ? "Contact sales" : "Get started"}
                      </a>
                    </Button>

                    {!isFree && (
                      <p className="text-sm text-muted-foreground mt-4 text-center">
                        Start with 30 pages per month for free
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1 text-center">
                      All prices exclusive of VAT/GST, where applicable.
                    </p>
                  </div>
                )}
              </div>

              {/* ---- Right: What's included ---- */}
              <div
                className={cn(
                  "p-8 sm:p-10 flex flex-col justify-center text-white",
                  isFree || isCustom
                    ? "bg-teal-600"
                    : "bg-sky-600"
                )}
              >
                <h3 className="text-2xl sm:text-3xl font-bold mb-6">
                  What&apos;s included?
                </h3>
                <ul className="space-y-4">
                  {(isCustom
                    ? /* enterprise features */
                      [
                        { label: "1 page = 1 credit", status: "included" as FeatureStatus },
                        { label: "1,200,000+ credits valid for a year", status: "included" as FeatureStatus },
                        { label: "Credits renew every year", status: "included" as FeatureStatus },
                        { label: "Cancel at any time", status: "included" as FeatureStatus },
                        { label: "Invite team members", status: "included" as FeatureStatus },
                        { label: "Advanced post-processing", status: "included" as FeatureStatus },
                        { label: "Priority support", status: "info" as FeatureStatus },
                      ]
                    : features
                  ).map((f) => (
                    <li
                      key={f.label}
                      className="flex items-center gap-3 text-sm"
                    >
                      {f.status === "included" && (
                        <Check
                          className={cn(
                            "h-5 w-5 shrink-0",
                            isFree || isCustom
                              ? "text-teal-200"
                              : "text-sky-200"
                          )}
                        />
                      )}
                      {f.status === "excluded" && (
                        <Ban className="h-5 w-5 text-white/40 shrink-0" />
                      )}
                      {f.status === "info" && (
                        <HeadsetIcon
                          className={cn(
                            "h-5 w-5 shrink-0",
                            isFree || isCustom
                              ? "text-teal-200"
                              : "text-sky-200"
                          )}
                        />
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
              {cardPlans.map((tier) => {
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
                          {annual && (
                            <span className="text-sm text-muted-foreground/50 line-through mr-2">
                              ${tier.monthlyPrice}
                            </span>
                          )}
                          <span className="text-4xl font-bold">
                            ${cardPrice}
                          </span>
                          <span className="text-base text-muted-foreground">
                            /mo
                          </span>
                          <p className="text-xs text-teal-600 font-bold mt-0.5">
                            ${(cardPrice / tier.pages).toFixed(
                              tier.pages >= 1_000 ? 3 : 2
                            )}{" "}
                            / page
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
                  Need more than 5,000 pages/month? Plans up to 100,000+
                  pages available.{" "}
                  <strong className="text-foreground">
                    Up to 68% cheaper than Parseur.
                  </strong>
                </p>
              </div>
              <Button
                variant="outline"
                size="lg"
                className="shrink-0 whitespace-nowrap"
                asChild
              >
                <a href="/pricing">
                  See All Plans
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
