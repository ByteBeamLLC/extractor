import { ArrowRight, FileText, Zap, Sheet, Mail, Webhook, Code } from "lucide-react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { HeroExtraction } from "./HeroExtraction"
import { Marquee } from "@/components/ui/marquee"
import { APP_URL } from "@/lib/config"

const stats = [
  { value: "50,000+", label: "Documents Processed" },
  { value: "95%+", label: "Extraction Accuracy" },
  { value: "5,000+", label: "App Integrations" },
  { value: "<3s", label: "Average Processing Time" },
]

const integrationItems = [
  { icon: Sheet, label: "Google Sheets", color: "text-green-600" },
  { icon: Zap, label: "Zapier", color: "text-orange-500" },
  { icon: Mail, label: "Gmail", color: "text-red-500" },
  { icon: Webhook, label: "Webhooks", color: "text-blue-500" },
  { icon: Code, label: "REST API", color: "text-indigo-500" },
  { icon: FileText, label: "PDF", color: "text-rose-500" },
  { icon: Zap, label: "Make", color: "text-purple-500" },
  { icon: FileText, label: "Word & Excel", color: "text-sky-500" },
]

export function HeroSection() {
  return (
    <section className="relative overflow-hidden pt-20 sm:pt-24 lg:pt-28">
      {/* Background gradient */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 left-1/4 w-[600px] h-[400px] bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute top-20 right-0 w-[400px] h-[400px] bg-secondary/5 rounded-full blur-3xl" />
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* ─── Two-column hero ─── */}
        <div className="grid lg:grid-cols-[2fr_3fr] gap-8 lg:gap-10 items-center">
          {/* Left: Copy */}
          <div className="max-w-xl">
            <h1 className="text-4xl sm:text-5xl lg:text-[3.25rem] font-bold tracking-tight leading-[1.12] mb-4">
              Extract Structured Data from{" "}
              <span className="text-primary">Any Document</span> with AI
            </h1>

            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed mb-8">
              Turn PDFs, invoices, emails, and images into structured fields.
              Reduce manual entry time by up to 70% and cut processing costs
              from $15 to under $3 per document. Set up in under 2 minutes.
            </p>

            {/* CTA */}
            <Button size="lg" className="text-base px-7 h-11" asChild>
              <a href={`${APP_URL}/dashboard`}>
                Get Started Free
                <ArrowRight className="ml-2 h-4 w-4" />
              </a>
            </Button>

            <p className="mt-4 text-sm text-muted-foreground">
              No credit card required &middot; 30 free pages every month
            </p>
          </div>

          {/* Right: Extraction visual */}
          <div className="relative">
            <HeroExtraction />
            <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-3/4 h-10 bg-primary/8 blur-2xl rounded-full" />
          </div>
        </div>

        {/* ─── Stats strip ─── */}
        <div className="mt-10 lg:mt-12 pt-8 border-t">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((stat) => (
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

        {/* ─── Trusted by ─── */}
        <div className="mt-8 pt-6 border-t">
          <p className="text-xs text-muted-foreground text-center mb-4">
            Trusted by leading organizations
          </p>
          <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-12">
            {[
              { src: "/logos/carrefour.png", alt: "Carrefour", h: "h-8" },
              { src: "/logos/dld.png", alt: "Dubai Land Department", h: "h-16" },
              { src: "/logos/infoquest.png", alt: "InfoQuest", h: "h-8" },
              { src: "/logos/takhlees.png", alt: "Takhlees Government Services", h: "h-9" },
            ].map((logo) => (
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

        {/* ─── Integration marquee ─── */}
        <div className="mt-6 pb-8">
          <p className="text-xs text-muted-foreground text-center mb-3">
            Connects with the tools you already use
          </p>
          <div className="relative">
            <Marquee pauseOnHover className="[--duration:30s] [--gap:0.75rem]">
              {integrationItems.map((item) => (
                <div
                  key={item.label}
                  className="flex items-center gap-2 rounded-full border bg-card px-3 py-1.5 shadow-sm"
                >
                  <item.icon className={`h-3.5 w-3.5 ${item.color}`} />
                  <span className="text-xs font-medium whitespace-nowrap">{item.label}</span>
                </div>
              ))}
            </Marquee>
            <div className="pointer-events-none absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-background to-transparent" />
            <div className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-background to-transparent" />
          </div>
        </div>
      </div>
    </section>
  )
}
