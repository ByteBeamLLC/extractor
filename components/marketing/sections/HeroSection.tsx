"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import dynamic from "next/dynamic"
import { ArrowRight, Play } from "lucide-react"
import { Button } from "@/components/ui/button"
import { APP_URL } from "@/lib/config"
import { AdHeroDemo } from "@/components/lp/AdHeroDemo"

const InteractiveDemo = dynamic(
  () => import("@/components/marketing/InteractiveDemo").then((m) => m.InteractiveDemo),
  { ssr: false, loading: () => <div className="h-[420px] rounded-xl border bg-muted/30 animate-pulse" /> }
)

const WORDS = ["Email", "Invoice", "PDF", "Document", "Receipt", "Spreadsheet", "Image"]
const HOLD_MS = 3000
const FADE_MS = 400

function RotatingWord() {
  const [index, setIndex] = useState(0)
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false)
      setTimeout(() => {
        setIndex((i) => (i + 1) % WORDS.length)
        setVisible(true)
      }, FADE_MS)
    }, HOLD_MS)
    return () => clearInterval(interval)
  }, [])

  return (
    <span className="relative inline-block">
      <span
        className={`text-primary transition-all duration-400 inline-block ${
          visible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2"
        }`}
      >
        {WORDS[index]}
      </span>
    </span>
  )
}

const logos = [
  { src: "/logos/carrefour.png", alt: "Carrefour", h: "h-8" },
  { src: "/logos/dld.png", alt: "Dubai Land Department", h: "h-16" },
  { src: "/logos/infoquest.png", alt: "InfoQuest", h: "h-8" },
  { src: "/logos/takhlees.png", alt: "Takhlees Government Services", h: "h-9" },
]

export function HeroSection() {
  const [showDemoModal, setShowDemoModal] = useState(false)

  useEffect(() => {
    if (showDemoModal) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
    return () => { document.body.style.overflow = "" }
  }, [showDemoModal])

  return (
    <>
      <section className="relative overflow-hidden pt-20 sm:pt-24 lg:pt-28">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 left-1/4 w-[600px] h-[400px] bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute top-20 right-0 w-[400px] h-[400px] bg-secondary/5 rounded-full blur-3xl" />
        </div>

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Two-column hero */}
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* Left: Copy */}
            <div className="max-w-xl">
              <h1 className="text-4xl sm:text-5xl lg:text-[3.25rem] font-bold tracking-tight leading-[1.12] mb-4 whitespace-pre-line">
                {"Extract Data From\nAny "}
                <RotatingWord />
                {"\nAutomatically"}
              </h1>

              <p className="text-base sm:text-lg text-muted-foreground leading-relaxed mb-8">
                AI reads your documents, emails, and invoices like a human — and
                pushes structured data to your apps in seconds. No templates, no
                rules, no code.
              </p>

              <div className="flex flex-wrap items-center gap-3">
                <Button size="lg" className="text-base px-7 h-11" asChild>
                  <a
                    href={`${APP_URL}/login?mode=signup`}
                    data-cta-location="hero_primary"
                    data-cta-name="Start Free — No Credit Card"
                    data-cta-destination="signup"
                  >
                    Start Free — No Credit Card
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </a>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="text-base px-6 h-11"
                  onClick={() => setShowDemoModal(true)}
                  data-cta-location="hero_secondary"
                  data-cta-name="See How It Works"
                  data-cta-destination="demo"
                >
                  <Play className="mr-2 h-4 w-4" />
                  See How It Works
                </Button>
              </div>

              <p className="mt-4 text-sm text-muted-foreground">
                Free forever (30 pages/mo). Set up in under 2 minutes.
              </p>
            </div>

            {/* Right: Live extraction demo */}
            <div className="hidden lg:block relative">
              <AdHeroDemo />
              <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-3/4 h-10 bg-primary/8 blur-2xl rounded-full" />
            </div>
          </div>

          {/* Stats strip — outcome focused */}
          <div className="mt-10 lg:mt-12 pt-8 border-t">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[
                { value: "90%", label: "Less Manual Work" },
                { value: "<3s", label: "To Process Any Document" },
                { value: "6+ hrs", label: "Saved Per Week" },
                { value: "$0.08", label: "Per Page (vs $15 Manual)" },
              ].map((stat) => (
                <div key={stat.label} className="text-center">
                  <div className="text-xl sm:text-2xl font-bold text-primary">
                    {stat.value}
                  </div>
                  <div className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Social proof */}
          <div className="mt-8 pt-6 border-t pb-8">
            <p className="text-xs text-muted-foreground text-center mb-4">
              Trusted by teams in logistics, finance, and e-commerce
            </p>
            <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-12">
              {logos.map((logo) => (
                <Image
                  key={logo.alt}
                  src={logo.src}
                  alt={logo.alt}
                  width={140}
                  height={40}
                  priority
                  className={`${logo.h} w-auto object-contain opacity-70 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-200`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Demo Modal */}
      {showDemoModal && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-label="Interactive product tour"
        >
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowDemoModal(false)}
          />
          <div className="relative w-full max-w-5xl animate-in zoom-in-95 fade-in duration-200">
            <button
              onClick={() => setShowDemoModal(false)}
              className="absolute -top-10 right-0 sm:-top-2 sm:-right-10 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 shadow-md hover:bg-white transition-colors"
              aria-label="Close tour"
            >
              ✕
            </button>
            <InteractiveDemo />
          </div>
        </div>
      )}
    </>
  )
}
