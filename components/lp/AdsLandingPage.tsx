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
  Play,
  Quote,
  X,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { APP_URL } from "@/lib/config"
import { LPTracker } from "./LPTracker"
import { cn } from "@/lib/utils"
import { AdHeroAnimation } from "./AdHeroAnimation"
import type { AdHeroAnimationProps } from "./AdHeroAnimation"
import { AdHeroDemo } from "./AdHeroDemo"

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

// ─── Rotating Word (used in hero headline) ───

function RotatingWord({ words }: { words: string[] }) {
  const [index, setIndex] = useState(0)
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false)
      setTimeout(() => {
        setIndex((i) => (i + 1) % words.length)
        setVisible(true)
      }, 400)
    }, 3000)
    return () => clearInterval(interval)
  }, [words.length])

  return (
    <span className="relative inline-block">
      <span
        className={`text-primary transition-all duration-400 inline-block ${
          visible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2"
        }`}
      >
        {words[index]}
      </span>
    </span>
  )
}

// ─── Types ───

interface HeroProps {
  badge: string
  headline: string
  subheadline: string
  ctaText: string
  ctaHref: string
  /** Optional secondary CTA (e.g. "Watch Demo", "Book a Call") */
  secondaryCtaText?: string
  secondaryCtaHref?: string
  /** Trust micro-line shown below CTAs (e.g. "Join 500+ teams...") */
  trustLine?: string
  /** Words that rotate in the headline — use {word} in headline as placeholder */
  rotatingWords?: string[]
}

interface Testimonial {
  quote: string
  name: string
  role: string
  company: string
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
  /** Props for the animated document extraction visual in the hero */
  heroAnimation?: AdHeroAnimationProps
  /** Use the full image-based demo (like handwriting LP) instead of the small mockup animation */
  useHeroDemo?: boolean
  stats?: Stat[]
  painPoints?: { title: string; subtitle: string; items: PainPoint[] }
  howItWorks?: { title: string; steps: HowItWorksStep[] }
  features?: { title: string; subtitle?: string; items: Feature[] }
  comparison?: { title: string; subtitle?: string; rows: ComparisonRow[] }
  faqs?: FAQ[]
  finalCta?: { title: string; subtitle: string; ctaText: string; ctaHref: string }
  /** Customer testimonials — shown after How It Works */
  testimonials?: Testimonial[]
  /** Set to true to hide the interactive demo section */
  hideDemo?: boolean
  /** Custom heading/subtitle for the demo section */
  demoSection?: { title: string; subtitle: string }
  /** Set to true to hide the mini pricing section */
  hidePricing?: boolean
  /** Custom social proof headline (defaults to "Trusted by teams at") */
  socialProofHeadline?: string
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
  heroAnimation,
  useHeroDemo,
  stats,
  painPoints,
  howItWorks,
  features,
  comparison,
  faqs,
  finalCta,
  testimonials,
  hideDemo,
  hidePricing,
  demoSection,
  socialProofHeadline,
}: AdsLandingPageProps) {
  const defaultCta = {
    title: "Start extracting data in minutes",
    subtitle:
      "Free forever up to 30 pages/month. No credit card required. Set up in under 2 minutes.",
    ctaText: "Start Free — 30 Pages/Month",
    ctaHref: hero.ctaHref,
  }
  const cta = { ...defaultCta, ...finalCta }

  // Demo modal
  const [showDemoModal, setShowDemoModal] = useState(false)

  // Lock body scroll when modal is open
  useEffect(() => {
    if (showDemoModal) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
    return () => { document.body.style.overflow = "" }
  }, [showDemoModal])

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
      <section className="relative min-h-[70vh] flex items-center">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-primary/5 rounded-full blur-3xl" />
        </div>
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-20">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left — copy */}
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary mb-6">
                {hero.badge}
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-[3.25rem] font-bold tracking-tight leading-[1.12] mb-6 whitespace-pre-line">
                {hero.rotatingWords && hero.headline.includes("{word}") ? (
                  <>
                    {hero.headline.split("{word}")[0]}
                    <RotatingWord words={hero.rotatingWords} />
                    {hero.headline.split("{word}")[1]}
                  </>
                ) : (
                  hero.headline
                )}
              </h1>
              <p className="text-lg text-muted-foreground mb-8 max-w-xl">
                {hero.subheadline}
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <Button size="lg" className="text-base px-8 h-13" asChild>
                  <a href={`${APP_URL}${hero.ctaHref}`}>
                    {hero.ctaText}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </a>
                </Button>
                {hero.secondaryCtaText && (
                  <Button
                    size="lg"
                    variant="outline"
                    className="text-base px-6 h-13"
                    onClick={() => setShowDemoModal(true)}
                  >
                    <Play className="mr-2 h-4 w-4" />
                    {hero.secondaryCtaText}
                  </Button>
                )}
              </div>
              <p className="mt-4 text-sm text-muted-foreground">
                {hero.trustLine || "No credit card required. Set up in under 2 minutes."}
              </p>
            </div>
            {/* Right — animation */}
            <div className="hidden lg:block">
              {useHeroDemo ? (
                <AdHeroDemo />
              ) : heroAnimation ? (
                <AdHeroAnimation {...heroAnimation} />
              ) : null}
            </div>
          </div>
        </div>
      </section>

      {/* ═══ Social Proof ═══ */}
      <section className="py-10 border-y bg-muted/20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-muted-foreground mb-6">
            {socialProofHeadline || "Trusted by teams at"}
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
        <section id="how-it-works" className="py-16 sm:py-20 scroll-mt-16">
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
      {!hideDemo && (
        <section className="py-16 sm:py-20 relative overflow-hidden border-y bg-gradient-to-b from-slate-50 to-blue-50/50">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 relative">
            <div className="text-center mb-10">
              <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary mb-4">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
                </span>
                Interactive Tour — Click Through It
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3">
                {demoSection?.title || "See exactly what you'll get"}
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                {demoSection?.subtitle || "Walk through the full workflow in 60 seconds — from creating a parser to seeing extracted data."}
              </p>
            </div>
            <InteractiveDemo />
            <InlineCTA href={hero.ctaHref} text={hero.ctaText} />
          </div>
        </section>
      )}

      {/* ═══ Testimonials ═══ */}
      {testimonials && testimonials.length > 0 && (
        <section className="py-16 sm:py-20 bg-muted/30">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-center mb-10">
              What our customers say
            </h2>
            <div className={cn(
              "grid gap-6",
              testimonials.length === 1 ? "max-w-xl mx-auto" : "sm:grid-cols-2"
            )}>
              {testimonials.map((t, i) => (
                <div key={i} className="rounded-xl border bg-card p-6 relative">
                  <Quote className="h-8 w-8 text-primary/15 absolute top-4 right-4" />
                  <p className="text-sm leading-relaxed mb-4 italic text-foreground/80">
                    &ldquo;{t.quote}&rdquo;
                  </p>
                  <div>
                    <p className="text-sm font-semibold">{t.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {t.role}, {t.company}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

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
      {!hidePricing && <section className="py-16 sm:py-20 bg-muted/30">
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
      </section>}

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
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button size="lg" className="text-base px-10 h-13" asChild>
              <a href={`${APP_URL}${cta.ctaHref}`}>
                {cta.ctaText}
                <ArrowRight className="ml-2 h-4 w-4" />
              </a>
            </Button>
            {hero.secondaryCtaText && hero.secondaryCtaHref && (
              <Button size="lg" variant="outline" className="text-base px-6 h-13" asChild>
                <a href={hero.secondaryCtaHref}>
                  <Play className="mr-2 h-4 w-4" />
                  {hero.secondaryCtaText}
                </a>
              </Button>
            )}
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            No credit card required. Cancel anytime.
          </p>
          {testimonials && testimonials.length > 0 && (
            <p className="mt-6 text-sm text-muted-foreground italic max-w-md mx-auto">
              &ldquo;{testimonials[0].quote.length > 100 ? testimonials[0].quote.slice(0, 100) + "..." : testimonials[0].quote}&rdquo;
              <span className="block mt-1 text-xs not-italic font-medium text-foreground/60">
                — {testimonials[0].name}, {testimonials[0].company}
              </span>
            </p>
          )}
        </div>
      </section>

      {/* ═══ Demo Modal ═══ */}
      {showDemoModal && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-label="Interactive product tour"
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => setShowDemoModal(false)}
          />
          {/* Modal content */}
          <div className="relative w-full max-w-5xl animate-in zoom-in-95 fade-in duration-200">
            <button
              onClick={() => setShowDemoModal(false)}
              className="absolute -top-10 right-0 sm:-top-2 sm:-right-10 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 shadow-md hover:bg-white transition-colors"
              aria-label="Close tour"
            >
              <X className="h-4 w-4" />
            </button>
            <InteractiveDemo />
          </div>
        </div>
      )}

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
