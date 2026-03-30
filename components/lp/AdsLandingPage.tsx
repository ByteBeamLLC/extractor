"use client"

import Image from "next/image"
import dynamic from "next/dynamic"
import { useEffect, useState } from "react"
import {
  Check,
  ChevronDown,
  ArrowRight,
  Upload,
  Sparkles,
  Download,
  Zap,
  Clock,
  ShieldCheck,
  DollarSign,
  Mail,
  FileText,
  Plug,
  Brain,
  Settings,
  BarChart3,
  RefreshCw,
  ArrowRightLeft,
  Table2,
  FileSpreadsheet,
  Timer,
  TrendingDown,
  Layers,
  Lock,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { APP_URL } from "@/lib/config"
import { LPTracker } from "./LPTracker"
import { cn } from "@/lib/utils"

const InteractiveDemo = dynamic(
  () => import("@/components/marketing/InteractiveDemo").then((m) => m.InteractiveDemo),
  { ssr: false, loading: () => <div className="h-[420px] rounded-xl border bg-muted/30 animate-pulse" /> }
)

// ─── Icon registry (maps string names to components for Server→Client serialization) ───

const iconMap: Record<string, LucideIcon> = {
  Zap, Clock, ShieldCheck, DollarSign, Mail, FileText, Plug, Brain,
  Settings, BarChart3, RefreshCw, ArrowRightLeft, Table2, FileSpreadsheet,
  Timer, TrendingDown, Layers, Lock, Upload, Sparkles, Download,
}

function resolveIcon(name: string): LucideIcon {
  return iconMap[name] || Sparkles
}

// ─── Types ───

interface HeroProps {
  badge: string
  headline: string
  subheadline: string
  ctaText: string
  ctaHref: string
}

interface Stat {
  value: string
  label: string
  icon: string
}

interface PainPoint {
  text: string
}

interface HowItWorksStep {
  step: string
  title: string
  description: string
}

interface Feature {
  title: string
  description: string
  icon: string
}

interface ComparisonRow {
  feature: string
  them: string
  parsli: string
}

interface FAQ {
  question: string
  answer: string
}

export interface AdsLandingPageProps {
  /** Unique page identifier for tracking (e.g. "email-parser") */
  page: string
  hero: HeroProps
  stats?: Stat[]
  painPoints?: { title: string; subtitle: string; items: PainPoint[] }
  howItWorks?: { title: string; steps: HowItWorksStep[] }
  features?: { title: string; subtitle?: string; items: Feature[] }
  comparison?: { title: string; subtitle?: string; rows: ComparisonRow[] }
  faqs?: FAQ[]
  finalCta?: { title: string; subtitle: string; ctaText: string; ctaHref: string }
}

// ─── Logos ───

const logos = [
  { src: "/logos/carrefour.png", alt: "Carrefour", h: "h-8" },
  { src: "/logos/dld.png", alt: "Dubai Land Department", h: "h-16" },
  { src: "/logos/infoquest.png", alt: "InfoQuest", h: "h-8" },
  { src: "/logos/takhlees.png", alt: "Takhlees Government Services", h: "h-9" },
]

// ─── Mini pricing (inline — no external link) ───

const plans = [
  { name: "Free", price: "$0", pages: "30 pages/mo", highlight: false },
  { name: "Starter", price: "$16", pages: "250 pages/mo", highlight: false },
  { name: "Growth", price: "$39", pages: "1,000 pages/mo", highlight: true },
  { name: "Pro", price: "$79", pages: "5,000 pages/mo", highlight: false },
]

// ─── Inline CTA block (reused 3+ times on the page) ───

function InlineCTA({ href, text }: { href: string; text: string }) {
  return (
    <div className="text-center py-10">
      <Button size="lg" className="text-base px-8 h-13" asChild>
        <a href={`${APP_URL}${href}`}>
          {text}
          <ArrowRight className="ml-2 h-4 w-4" />
        </a>
      </Button>
      <p className="mt-3 text-xs text-muted-foreground">
        No credit card required. Cancel anytime.
      </p>
    </div>
  )
}

// ─── Component ───

export function AdsLandingPage({
  page,
  hero,
  stats,
  painPoints,
  howItWorks,
  features,
  comparison,
  faqs,
  finalCta,
}: AdsLandingPageProps) {
  const defaultCta = {
    title: "Start extracting data in minutes",
    subtitle:
      "Free forever up to 30 pages/month. No credit card required. Set up in under 2 minutes.",
    ctaText: "Start Free — 30 Pages/Month",
    ctaHref: hero.ctaHref,
  }
  const cta = { ...defaultCta, ...finalCta }

  // Sticky mobile CTA — show after scrolling past hero
  const [showSticky, setShowSticky] = useState(false)
  useEffect(() => {
    function onScroll() {
      setShowSticky(window.scrollY > 600)
    }
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  return (
    <>
      <LPTracker page={page} />

      {/* ═══ Hero ═══ */}
      <section className="relative min-h-[70vh] flex items-center justify-center">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-primary/5 rounded-full blur-3xl" />
        </div>
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-20 text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary mb-6">
            {hero.badge}
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.08] mb-6">
            {hero.headline}
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            {hero.subheadline}
          </p>
          <Button size="lg" className="text-base px-8 h-13" asChild>
            <a href={`${APP_URL}${hero.ctaHref}`}>
              {hero.ctaText}
              <ArrowRight className="ml-2 h-4 w-4" />
            </a>
          </Button>
          <p className="mt-4 text-sm text-muted-foreground">
            No credit card required. Set up in under 2 minutes.
          </p>
        </div>
      </section>

      {/* ═══ Social Proof ═══ */}
      <section className="py-10 border-y bg-muted/20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-muted-foreground mb-6">
            Trusted by teams at
          </p>
          <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-12 opacity-70">
            {logos.map((logo) => (
              <Image
                key={logo.alt}
                src={logo.src}
                alt={logo.alt}
                width={120}
                height={48}
                className={cn("object-contain", logo.h)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ═══ Stats ═══ */}
      {stats && stats.length > 0 && (
        <section className="py-14 sm:py-16">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-8">
              {stats.map((stat) => {
                const Icon = resolveIcon(stat.icon)
                return (
                  <div key={stat.label} className="text-center">
                    <Icon className="h-6 w-6 text-primary mx-auto mb-2" />
                    <p className="text-3xl font-bold">{stat.value}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {stat.label}
                    </p>
                  </div>
                )
              })}
            </div>
          </div>
        </section>
      )}

      {/* ═══ Pain Points ═══ */}
      {painPoints && (
        <section className="py-16 sm:py-20 bg-muted/30">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-center mb-4">
              {painPoints.title}
            </h2>
            <p className="text-center text-muted-foreground mb-10 max-w-2xl mx-auto">
              {painPoints.subtitle}
            </p>
            <div className="grid sm:grid-cols-2 gap-4">
              {painPoints.items.map((item, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 rounded-xl border bg-card p-5"
                >
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-destructive/10 text-destructive text-sm font-bold">
                    !
                  </span>
                  <p className="text-sm leading-relaxed">{item.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ═══ How It Works ═══ */}
      {howItWorks && (
        <section className="py-16 sm:py-20">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-center mb-12">
              {howItWorks.title}
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              {howItWorks.steps.map((step, i) => {
                const icons = [Upload, Sparkles, Download]
                const Icon = icons[i] || Sparkles
                return (
                  <div key={step.step} className="text-center">
                    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
                      <Icon className="h-7 w-7 text-primary" />
                    </div>
                    <p className="text-xs font-semibold text-primary mb-2">
                      Step {step.step}
                    </p>
                    <h3 className="text-lg font-semibold mb-2">{step.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                )
              })}
            </div>
          </div>
        </section>
      )}

      {/* ═══ Interactive Demo ═══ */}
      <section className="py-16 sm:py-20 bg-muted/30">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-center mb-4">
            See Parsli in action
          </h2>
          <p className="text-center text-muted-foreground mb-10 max-w-2xl mx-auto">
            Click through the interactive tour — from creating a parser to extracting structured data.
          </p>
          <InteractiveDemo />
          <InlineCTA href={hero.ctaHref} text={hero.ctaText} />
        </div>
      </section>

      {/* ═══ Features ═══ */}
      {features && (
        <section className="py-16 sm:py-20">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-center mb-4">
              {features.title}
            </h2>
            {features.subtitle && (
              <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
                {features.subtitle}
              </p>
            )}
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.items.map((feature) => {
                const Icon = resolveIcon(feature.icon)
                return (
                  <div
                    key={feature.title}
                    className="rounded-xl border bg-card p-6"
                  >
                    <Icon className="h-6 w-6 text-primary mb-3" />
                    <h3 className="font-semibold mb-2">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                )
              })}
            </div>
          </div>
        </section>
      )}

      {/* ═══ Comparison Table ═══ */}
      {comparison && (
        <section className="py-16 sm:py-20">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-center mb-4">
              {comparison.title}
            </h2>
            {comparison.subtitle && (
              <p className="text-center text-muted-foreground mb-10">
                {comparison.subtitle}
              </p>
            )}
            <div className="overflow-x-auto rounded-xl border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-4 py-3 text-left font-medium">
                      Feature
                    </th>
                    <th className="px-4 py-3 text-center font-medium text-muted-foreground">
                      Others
                    </th>
                    <th className="px-4 py-3 text-center font-medium text-primary">
                      Parsli
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {comparison.rows.map((row, i) => (
                    <tr key={i} className="border-b last:border-0">
                      <td className="px-4 py-3">{row.feature}</td>
                      <td className="px-4 py-3 text-center text-muted-foreground">
                        {row.them}
                      </td>
                      <td className="px-4 py-3 text-center font-medium">
                        {row.parsli}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Mid-page CTA #3 — after comparison */}
            <InlineCTA href={hero.ctaHref} text={hero.ctaText} />
          </div>
        </section>
      )}

      {/* ═══ Mini Pricing ═══ */}
      <section className="py-16 sm:py-20 bg-muted/30">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-center mb-4">
            Simple, transparent pricing
          </h2>
          <p className="text-center text-muted-foreground mb-10">
            Start free. Upgrade when you need more pages. Cancel anytime.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={cn(
                  "rounded-xl border p-5 text-center",
                  plan.highlight
                    ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                    : "bg-card"
                )}
              >
                <p className="text-sm font-medium mb-1">{plan.name}</p>
                <p className="text-2xl font-bold">
                  {plan.price}
                  {plan.price !== "$0" && (
                    <span className="text-sm font-normal text-muted-foreground">
                      /mo
                    </span>
                  )}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {plan.pages}
                </p>
              </div>
            ))}
          </div>
          <p className="text-center text-xs text-muted-foreground mt-4">
            Annual pricing shown. All plans include API access, webhooks, and integrations.
          </p>
        </div>
      </section>

      {/* ═══ FAQ ═══ */}
      {faqs && faqs.length > 0 && (
        <section className="py-16 sm:py-20">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-center mb-10">
              Frequently asked questions
            </h2>
            <div className="space-y-4">
              {faqs.map((faq, i) => (
                <FAQItem key={i} question={faq.question} answer={faq.answer} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ═══ Final CTA ═══ */}
      <section className="py-16 sm:py-20 bg-muted/30">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
            {cta.title}
          </h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto">
            {cta.subtitle}
          </p>
          <Button size="lg" className="text-base px-10 h-13" asChild>
            <a href={`${APP_URL}${cta.ctaHref}`}>
              {cta.ctaText}
              <ArrowRight className="ml-2 h-4 w-4" />
            </a>
          </Button>
          <p className="mt-3 text-xs text-muted-foreground">
            No credit card required. Cancel anytime.
          </p>
        </div>
      </section>

      {/* ═══ Sticky Mobile CTA ═══ */}
      <div
        className={cn(
          "fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur px-4 py-3 transition-transform duration-300 sm:hidden",
          showSticky ? "translate-y-0" : "translate-y-full"
        )}
      >
        <Button size="lg" className="w-full text-base h-12" asChild>
          <a href={`${APP_URL}${hero.ctaHref}`}>
            {hero.ctaText}
            <ArrowRight className="ml-2 h-4 w-4" />
          </a>
        </Button>
      </div>
    </>
  )
}

// ─── FAQ Accordion Item ───

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="rounded-xl border bg-card">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-5 py-4 text-left"
      >
        <span className="font-medium text-sm">{question}</span>
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-muted-foreground transition-transform",
            open && "rotate-180"
          )}
        />
      </button>
      {open && (
        <div className="px-5 pb-4">
          <p className="text-sm text-muted-foreground leading-relaxed">
            {answer}
          </p>
        </div>
      )}
    </div>
  )
}
