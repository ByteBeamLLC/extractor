import Link from "next/link"
import { ArrowRight, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { HeroExtraction } from "./HeroExtraction"
import { APP_URL } from "@/lib/config"

export function HeroSection() {
  return (
    <section className="relative overflow-hidden pt-28 pb-20 sm:pt-36 sm:pb-28 lg:pt-44 lg:pb-32">
      {/* Background gradient */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute top-20 right-0 w-[400px] h-[400px] bg-secondary/5 rounded-full blur-3xl" />
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          {/* Badge */}
          <Badge
            variant="secondary"
            className="mb-6 px-4 py-1.5 text-sm font-medium"
          >
            <Sparkles className="mr-1.5 h-3.5 w-3.5" />
            Powered by AI
          </Badge>

          {/* H1 — primary SEO keyword */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.1] mb-6">
            Extract Structured Data from{" "}
            <span className="text-primary">Any Document</span> with AI
          </h1>

          {/* Subheading — secondary keywords */}
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
            Automatically parse PDFs, invoices, emails, and images into clean, structured
            data. No code required. Connect to Google Sheets, Zapier, and 5,000+ apps.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" className="text-base px-8 h-12" asChild>
              <a href={`${APP_URL}/dashboard`}>
                Get Started Free
                <ArrowRight className="ml-2 h-4 w-4" />
              </a>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="text-base px-8 h-12"
              asChild
            >
              <Link href="/docs">See How It Works</Link>
            </Button>
          </div>

          {/* Trust line */}
          <p className="mt-6 text-sm text-muted-foreground">
            No credit card required &middot; 30 free pages every month
          </p>
        </div>

        {/* Interactive extraction visualization */}
        <div className="mt-16 sm:mt-20 relative mx-auto max-w-5xl">
          <HeroExtraction />
          {/* Glow effect under the visual */}
          <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-3/4 h-16 bg-primary/10 blur-3xl rounded-full" />
        </div>
      </div>
    </section>
  )
}
