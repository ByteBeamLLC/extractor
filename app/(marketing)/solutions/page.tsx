import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { AuthButton } from "@/components/marketing/shared/AuthButton"
import { solutions } from "@/lib/seo/solutions"

export const metadata: Metadata = {
  title: "Solutions - AI Document Extraction for Every Need | Parsli",
  description:
    "Purpose-built document extraction solutions for PDF to Excel, invoice parsing, bank statements, and more. No-code setup, API access, and integrations included.",
  alternates: {
    canonical: "https://parsli.co/solutions",
  },
  openGraph: {
    title: "Solutions - Parsli",
    description:
      "Purpose-built document extraction solutions for common business needs.",
    url: "https://parsli.co/solutions",
    images: [
      {
        url: "https://parsli.co/parsli-og.png",
        width: 1200,
        height: 630,
        alt: "Parsli Solutions",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Solutions - Parsli",
    description:
      "Purpose-built document extraction solutions for common business needs.",
    images: ["https://parsli.co/parsli-og.png"],
  },
}

export default function SolutionsPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative pt-28 pb-16 sm:pt-36 sm:pb-20">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-primary/5 rounded-full blur-3xl" />
        </div>
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight leading-[1.1] mb-6">
            Solutions
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Purpose-built document extraction solutions for common business
            needs. No-code setup with full API access.
          </p>
        </div>
      </section>

      {/* Solutions grid */}
      <section className="pb-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-6 sm:grid-cols-2">
            {solutions.map((sol) => (
              <Link
                key={sol.slug}
                href={`/solutions/${sol.slug}`}
                className="group rounded-xl border bg-card p-6 hover:border-primary/30 transition-colors"
              >
                <h2 className="text-lg font-semibold mb-2 group-hover:text-primary transition-colors">
                  {sol.h1}{" "}
                  <span className="text-primary">{sol.h1Accent}</span>
                </h2>
                <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
                  {sol.subtitle}
                </p>
                <span className="inline-flex items-center gap-1 text-sm text-primary mt-3">
                  Learn more
                  <ArrowRight className="h-3 w-3" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="pb-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl border bg-muted/30 p-10 text-center">
            <h2 className="text-2xl font-bold mb-3">
              Start extracting data for free
            </h2>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Free forever up to 30 pages/month. No credit card required.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <AuthButton href="/login" className="text-base px-8 h-12" showArrow>
                Try it for free
              </AuthButton>
              <Button variant="outline" size="lg" className="text-base px-8 h-12" asChild>
                <a
                  href="https://calendly.com/talal-bytebeam/parsli-discovery-call"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Book a demo
                </a>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
