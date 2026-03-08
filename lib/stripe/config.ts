import Stripe from "stripe"

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  typescript: true,
})

/**
 * Pricing tiers — ~30% cheaper than Parseur.
 *
 * After creating products + prices in the Stripe Dashboard,
 * paste the real price IDs into .env as shown in .env.example.
 */
export type PlanTier = "free" | "starter" | "growth" | "pro" | "business"

export interface PlanDefinition {
  tier: PlanTier
  name: string
  pages: number
  maxParsers: number
  monthlyPrice: number
  annualPricePerMonth: number
  /** Stripe Price ID for monthly billing */
  stripePriceIdMonthly: string | null
  /** Stripe Price ID for annual billing */
  stripePriceIdAnnual: string | null
  features: string[]
  highlight?: boolean
}

export const PLANS: Record<PlanTier, PlanDefinition> = {
  free: {
    tier: "free",
    name: "Free",
    pages: 30,
    maxParsers: 3,
    monthlyPrice: 0,
    annualPricePerMonth: 0,
    stripePriceIdMonthly: null,
    stripePriceIdAnnual: null,
    features: [
      "30 pages per month",
      "Up to 3 parsers",
      "AI-powered extraction",
      "Webhook integrations",
      "API access",
    ],
  },
  starter: {
    tier: "starter",
    name: "Starter",
    pages: 100,
    maxParsers: 10,
    monthlyPrice: 33,
    annualPricePerMonth: 27,
    stripePriceIdMonthly: process.env.STRIPE_PRICE_STARTER_MONTHLY || "",
    stripePriceIdAnnual: process.env.STRIPE_PRICE_STARTER_ANNUAL || "",
    features: [
      "100 pages per month",
      "Up to 10 parsers",
      "AI-powered extraction",
      "All integrations",
      "API access",
      "Email support",
    ],
  },
  growth: {
    tier: "growth",
    name: "Growth",
    pages: 500,
    maxParsers: 25,
    monthlyPrice: 59,
    annualPricePerMonth: 49,
    stripePriceIdMonthly: process.env.STRIPE_PRICE_GROWTH_MONTHLY || "",
    stripePriceIdAnnual: process.env.STRIPE_PRICE_GROWTH_ANNUAL || "",
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
  pro: {
    tier: "pro",
    name: "Pro",
    pages: 2_000,
    maxParsers: 100,
    monthlyPrice: 99,
    annualPricePerMonth: 79,
    stripePriceIdMonthly: process.env.STRIPE_PRICE_PRO_MONTHLY || "",
    stripePriceIdAnnual: process.env.STRIPE_PRICE_PRO_ANNUAL || "",
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
  business: {
    tier: "business",
    name: "Business",
    pages: 10_000,
    maxParsers: 999,
    monthlyPrice: 349,
    annualPricePerMonth: 279,
    stripePriceIdMonthly: process.env.STRIPE_PRICE_BUSINESS_MONTHLY || "",
    stripePriceIdAnnual: process.env.STRIPE_PRICE_BUSINESS_ANNUAL || "",
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
}

/** Resolve a plan from a Stripe Price ID */
export function planFromPriceId(priceId: string): PlanDefinition | undefined {
  return Object.values(PLANS).find(
    (p) =>
      p.stripePriceIdMonthly === priceId || p.stripePriceIdAnnual === priceId
  )
}

/** Resolve a plan from a tier name */
export function planFromTier(tier: string): PlanDefinition {
  return PLANS[tier as PlanTier] ?? PLANS.free
}
