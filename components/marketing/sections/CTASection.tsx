import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { APP_URL } from "@/lib/config"

export function CTASection() {
  return (
    <section className="py-20 sm:py-24 lg:py-28 bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-2xl border bg-card p-10 sm:p-16 text-center overflow-hidden">
          {/* Background decoration */}
          <div className="absolute inset-0 -z-10">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-secondary/5 rounded-full blur-3xl" />
          </div>

          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
            Stop Manual Data Entry Today
          </h2>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-4">
            Companies using document automation see an average{" "}
            <strong className="text-foreground">248% ROI over three years</strong>{" "}
            with payback in under six months{" "}
            <span className="text-xs text-muted-foreground/70">
              (<cite>Forrester TEI, 2023</cite>)
            </span>
            .
          </p>
          <p className="text-sm text-muted-foreground max-w-lg mx-auto mb-8">
            Free forever up to 30 pages/month. No credit card required. Set up in under 2 minutes.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" className="text-base px-8 h-12" asChild>
              <a
                href={`${APP_URL}/login?mode=signup`}
                data-cta-location="cta_section_primary"
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
              className="text-base px-8 h-12"
              asChild
            >
              <Link
                href="/pricing"
                data-cta-location="cta_section_secondary"
                data-cta-name="See Pricing"
                data-cta-destination="pricing"
              >
                See Pricing
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
