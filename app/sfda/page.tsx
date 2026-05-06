import type { Metadata } from "next"
import Link from "next/link"
import * as Icons from "lucide-react"
import type { LucideIcon } from "lucide-react"
import {
  ArrowRight,
  ShieldCheck,
  Clock,
  FileCheck2,
  Sparkles,
} from "lucide-react"
import { BOOK_DEMO_URL, SFDA_TOOLS } from "@/lib/sfda/tools"
import { Button } from "@/components/ui/button"

const PAGE_URL = "https://bytebeam.co/sfda"

export const metadata: Metadata = {
  title: "SFDA Regulatory Tools — Bytebeam",
  description:
    "Three AI-built tools for SFDA labelling work. Generate SmPC and PIL drafts, translate to Arabic, and run dossier gap analysis — built for Module 1.3 submissions.",
  alternates: { canonical: PAGE_URL },
  openGraph: {
    title: "SFDA Regulatory Tools — Bytebeam",
    description:
      "Generate SmPC and PIL drafts, translate to Arabic, run dossier gap analysis. Built for SFDA Module 1.3 submissions.",
    url: PAGE_URL,
  },
}

const trustPoints = [
  {
    icon: ShieldCheck,
    title: "SFDA-aligned by design",
    description:
      "Outputs follow Module 1.3 structure and the QRD-derived layout adopted across GCC.",
  },
  {
    icon: Clock,
    title: "Hours, not weeks",
    description:
      "Replace the 60–80% of labelling work that's mechanical, keep the regulatory judgment with your team.",
  },
  {
    icon: FileCheck2,
    title: "Editable, audit-ready",
    description:
      "DOCX out for QPPV review. Audit trail retained for inspection-ready records.",
  },
]

export default function SfdaHubPage() {
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: "https://bytebeam.co",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "SFDA Tools",
        item: PAGE_URL,
      },
    ],
  }

  const collectionJsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Bytebeam SFDA Regulatory Tools",
    description: metadata.description,
    url: PAGE_URL,
    hasPart: SFDA_TOOLS.map((tool) => ({
      "@type": "SoftwareApplication",
      name: tool.name,
      url: `${PAGE_URL}/${tool.slug}`,
      applicationCategory: "BusinessApplication",
    })),
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionJsonLd) }}
      />

      {/* Hero */}
      <section className="relative pt-20 sm:pt-24 pb-16">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-primary/5 rounded-full blur-3xl" />
        </div>
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border bg-card px-4 py-1.5 text-sm text-muted-foreground mb-6">
            <Sparkles className="h-4 w-4 text-primary" />
            SFDA Regulatory Tools
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight leading-[1.1] mb-4">
            The SFDA labelling toolkit, built into one workflow
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Three tools that replace the mechanical 60–80% of SFDA Module 1.3 labelling work.
            Built around how Saudi RA teams actually submit.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <Button size="lg" asChild>
              <Link href={`/sfda/${SFDA_TOOLS[0].slug}`}>
                Try a tool free
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <a href={BOOK_DEMO_URL} target="_blank" rel="noopener noreferrer">
                Book a 30-min demo
              </a>
            </Button>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            One free run per tool · License sold via 30-min walkthrough
          </p>
        </div>
      </section>

      {/* Tool grid */}
      <section className="pb-16">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-5 md:grid-cols-3">
            {SFDA_TOOLS.map((tool, index) => {
              const Icon =
                (Icons as unknown as Record<string, LucideIcon>)[tool.icon] ??
                Icons.Wrench
              return (
                <Link
                  key={tool.slug}
                  href={`/sfda/${tool.slug}`}
                  className="group rounded-2xl border bg-card p-6 hover:border-primary/40 hover:shadow-md transition-all flex flex-col"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Icon className="h-5 w-5" aria-hidden />
                    </div>
                    <span className="text-xs font-mono text-muted-foreground/60">
                      0{index + 1}
                    </span>
                  </div>
                  <h2 className="text-lg font-semibold mb-2 inline-flex items-center gap-1.5 group-hover:text-primary transition-colors">
                    {tool.shortName}
                    <ArrowRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                  </h2>
                  <p className="text-sm text-muted-foreground leading-relaxed flex-1">
                    {tool.outcome}
                  </p>
                  <div className="mt-5 pt-4 border-t flex items-center justify-between text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1.5">
                      <FileCheck2 className="h-3.5 w-3.5" />
                      {tool.output.format}
                    </span>
                    <span className="font-medium text-foreground">
                      Try it →
                    </span>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      </section>

      {/* Trust strip */}
      <section className="py-16 sm:py-20 bg-muted/30 border-t">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-6 md:grid-cols-3">
            {trustPoints.map((point) => (
              <div
                key={point.title}
                className="rounded-xl border bg-card p-6"
              >
                <div className="inline-flex items-center justify-center w-11 h-11 rounded-lg bg-primary/10 text-primary mb-4">
                  <point.icon className="h-5 w-5" />
                </div>
                <h3 className="font-semibold text-base mb-1.5">
                  {point.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {point.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 sm:py-20 border-t">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 text-primary mb-6">
            <Sparkles className="h-7 w-7" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold mb-4">
            Built for the labelling work that doesn't scale by hiring.
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto mb-8 leading-relaxed">
            Variation cycles, Arabic re-translation, pre-submission QC — the
            mechanical work that eats senior RA time. Bytebeam ships the agents;
            your QPPV signs off. Walk through the output with us, then license
            it for your team.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" asChild>
              <a href={BOOK_DEMO_URL} target="_blank" rel="noopener noreferrer">
                Book a 30-min demo
                <ArrowRight className="h-4 w-4 ml-2" />
              </a>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href={`/sfda/${SFDA_TOOLS[0].slug}`}>
                Try a tool free first
              </Link>
            </Button>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            Sales-led license · Per-team pricing discussed on the call
          </p>
        </div>
      </section>
    </>
  )
}
