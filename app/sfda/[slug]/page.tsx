import type { Metadata } from "next"
import { notFound } from "next/navigation"
import Link from "next/link"
import * as Icons from "lucide-react"
import type { LucideIcon } from "lucide-react"
import {
  CheckCircle2,
  XCircle,
  ArrowRight,
  ChevronRight,
  Sparkles,
  ShieldCheck,
  FileOutput,
  Star,
} from "lucide-react"
import {
  BOOK_DEMO_URL,
  SFDA_TOOLS,
  getSfdaTool,
  getAllSfdaToolSlugs,
  getOtherSfdaTools,
} from "@/lib/sfda/tools"
import { SfdaToolDemo } from "@/components/sfda/SfdaToolDemo"
import { Button } from "@/components/ui/button"

interface Props {
  params: { slug: string }
}

export function generateStaticParams() {
  return getAllSfdaToolSlugs().map((slug) => ({ slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const tool = getSfdaTool(params.slug)
  if (!tool) return {}
  const url = `https://bytebeam.co/sfda/${tool.slug}`
  return {
    title: `${tool.name} — Bytebeam`,
    description: tool.metaDescription,
    alternates: { canonical: url },
    openGraph: {
      title: tool.name,
      description: tool.metaDescription,
      url,
    },
  }
}

function getIcon(name: string): LucideIcon {
  return (
    (Icons as unknown as Record<string, LucideIcon>)[name] ?? Icons.Wrench
  )
}

export default function SfdaToolPage({ params }: Props) {
  const tool = getSfdaTool(params.slug)
  if (!tool) notFound()

  const url = `https://bytebeam.co/sfda/${tool.slug}`
  const ToolIcon = getIcon(tool.icon)
  const otherTools = getOtherSfdaTools(tool.slug)

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://bytebeam.co" },
      { "@type": "ListItem", position: 2, name: "SFDA Tools", item: "https://bytebeam.co/sfda" },
      { "@type": "ListItem", position: 3, name: tool.name, item: url },
    ],
  }

  const softwareJsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: tool.name,
    description: tool.metaDescription,
    url,
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web Browser",
  }

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: tool.faqs.map((faq) => ({
      "@type": "Question",
      name: faq.q,
      acceptedAnswer: { "@type": "Answer", text: faq.a },
    })),
  }

  const howToJsonLd = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: `How to use ${tool.name}`,
    description: tool.outcome,
    step: tool.steps.map((step, i) => ({
      "@type": "HowToStep",
      position: i + 1,
      name: step.title,
      text: step.description,
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
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(howToJsonLd) }}
      />

      {/* Breadcrumb */}
      <div className="border-b">
        <nav
          aria-label="Breadcrumb"
          className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-3 flex items-center gap-1.5 text-xs text-muted-foreground"
        >
          <Link href="/sfda" className="hover:text-foreground transition-colors">
            SFDA Tools
          </Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-foreground font-medium">{tool.shortName}</span>
        </nav>
      </div>

      {/* ════════ Hero + Tool ════════ */}
      <section id="tool" className="relative pt-12 sm:pt-16 pb-12 scroll-mt-20">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-primary/5 rounded-full blur-3xl" />
        </div>
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 rounded-full border bg-card px-4 py-1.5 text-sm text-muted-foreground mb-6">
              <ToolIcon className="h-4 w-4 text-primary" />
              {tool.badgeLabel}
            </div>
            <h1 className="text-3xl sm:text-5xl font-bold tracking-tight leading-[1.1] mb-4">
              {tool.outcome}
            </h1>
            <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto mb-3">
              {tool.description}
            </p>
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-8">
              <div className="flex items-center gap-0.5 text-yellow-500">
                <Star className="h-3.5 w-3.5 fill-current" />
                <Star className="h-3.5 w-3.5 fill-current" />
                <Star className="h-3.5 w-3.5 fill-current" />
                <Star className="h-3.5 w-3.5 fill-current" />
                <Star className="h-3.5 w-3.5 fill-current" />
              </div>
              <span>Built for SFDA Module 1.3 submissions</span>
            </div>
          </div>

          <SfdaToolDemo
            toolSlug={tool.slug}
            toolName={tool.name}
            ctaLabel={tool.ctaLabel}
            inputs={tool.inputs}
            outputLabel={tool.output.label}
            outputFormat={tool.output.format}
          />

          <p className="mt-5 text-xs text-muted-foreground text-center">
            One free run per tool · Audit trail retained · Walk through the
            output with our team to license for your full portfolio
          </p>
        </div>
      </section>

      {/* ════════ Why use this ════════ */}
      <section className="py-16 sm:py-20 bg-muted/30 border-t">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-12">
            Why teams pick this over a manual draft
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {tool.features.map((feature) => {
              const Icon = getIcon(feature.icon)
              return (
                <div
                  key={feature.title}
                  className="rounded-xl border bg-card p-6"
                >
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 text-primary mb-4">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ════════ How it works ════════ */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-12">
            How it works
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {tool.steps.map((step, i) => {
              const Icon = getIcon(step.icon)
              return (
                <div
                  key={step.title}
                  className="relative rounded-xl border bg-card p-6"
                >
                  <div className="absolute top-4 right-4 text-xs font-bold text-muted-foreground/30">
                    {String(i + 1).padStart(2, "0")}
                  </div>
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary mb-4">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{step.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {step.description}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ════════ Inputs / Output ════════ */}
      <section className="py-16 sm:py-20 bg-muted/30 border-t">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 rounded-xl border bg-card p-6">
              <div className="flex items-center gap-2 mb-5">
                <ToolIcon className="h-5 w-5 text-primary" />
                <h2 className="font-semibold text-lg">What goes in</h2>
              </div>
              <ul className="space-y-4">
                {tool.inputs.map((input) => (
                  <li key={input.id} className="flex gap-3">
                    <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                    <div>
                      <p className="font-medium text-sm flex items-center gap-2">
                        {input.label}
                        {!input.required && (
                          <span className="text-[10px] uppercase tracking-wide text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                            Optional
                          </span>
                        )}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {input.description}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-xl border bg-primary/5 p-6">
              <div className="flex items-center gap-2 mb-5">
                <FileOutput className="h-5 w-5 text-primary" />
                <h2 className="font-semibold text-lg">What comes out</h2>
              </div>
              <p className="text-sm font-medium mb-1">{tool.output.label}</p>
              <p className="text-xs text-muted-foreground mb-4">
                Format: {tool.output.format}
              </p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground border-t pt-4">
                <ShieldCheck className="h-3.5 w-3.5" />
                Editable, audit-trailed
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ════════ Use cases + Out of scope ════════ */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-2">
            <div>
              <h2 className="text-2xl font-bold tracking-tight mb-6">
                When teams use this
              </h2>
              <ul className="space-y-3">
                {tool.useCases.map((uc, i) => (
                  <li key={i} className="flex gap-3 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                    <span className="text-muted-foreground leading-relaxed">
                      {uc}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h2 className="text-2xl font-bold tracking-tight mb-6">
                What this tool does <em className="text-muted-foreground">not</em> do
              </h2>
              <ul className="space-y-3">
                {tool.outOfScope.map((s, i) => (
                  <li key={i} className="flex gap-3 text-sm">
                    <XCircle className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                    <span className="text-muted-foreground leading-relaxed">
                      {s}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ════════ Personas ════════ */}
      <section className="py-16 sm:py-20 bg-muted/30 border-t">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-12">
            Built for
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {tool.personas.map((persona) => {
              const Icon = getIcon(persona.icon)
              return (
                <div
                  key={persona.title}
                  className="rounded-xl border bg-card p-5 hover:border-primary/30 transition-colors"
                >
                  <Icon className="h-5 w-5 text-primary mb-3" />
                  <h3 className="font-semibold text-sm mb-1.5">
                    {persona.title}
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {persona.description}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ════════ FAQ ════════ */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-12">
            Frequently asked questions
          </h2>
          <div className="grid sm:grid-cols-2 gap-5">
            {tool.faqs.map((faq) => (
              <div key={faq.q} className="rounded-xl border bg-card p-5">
                <h3 className="font-semibold text-sm mb-2">{faq.q}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {faq.a}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════ Final CTA ════════ */}
      <section className="py-16 sm:py-20 bg-muted/30 border-t">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 text-primary mb-6">
            <Sparkles className="h-7 w-7" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold mb-4">
            License {tool.shortName} for your team
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto mb-8 leading-relaxed">
            Run one free preview to see the output on your own document. To run
            it across your portfolio, integrate with your QMS, or license for
            your team — walk through the output with us in a 30-min call.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" asChild>
              <a
                href={BOOK_DEMO_URL}
                target="_blank"
                rel="noopener noreferrer"
              >
                Book a 30-min demo
                <ArrowRight className="h-4 w-4 ml-2" />
              </a>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="#tool">
                Try it free first
              </Link>
            </Button>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            Sales-led license · Per-team pricing discussed on the call · No self-serve checkout
          </p>
        </div>
      </section>

      {/* ════════ Related tools ════════ */}
      <section className="py-16 border-t">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-lg font-semibold mb-6">Other SFDA tools</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {otherTools.map((other) => {
              const Icon = getIcon(other.icon)
              return (
                <Link
                  key={other.slug}
                  href={`/sfda/${other.slug}`}
                  className="group rounded-xl border bg-card p-5 hover:border-primary/40 transition-colors flex gap-4"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm mb-1 inline-flex items-center gap-1.5">
                      {other.shortName}
                      <ArrowRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                    </p>
                    <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                      {other.outcome}
                    </p>
                  </div>
                </Link>
              )
            })}
          </div>
          <div className="mt-6">
            <Link
              href="/sfda"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline underline-offset-4"
            >
              See all SFDA tools
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
