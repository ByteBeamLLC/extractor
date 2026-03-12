import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { AuthButton } from "@/components/marketing/shared/AuthButton"

const tools = [
  {
    slug: "pdf-to-excel",
    title: "PDF to Excel Converter",
    description:
      "Upload a PDF and get a clean Excel or CSV download. AI-powered table extraction preserves rows, columns, and headers.",
  },
]

export const metadata: Metadata = {
  title: "Free Document Parsing Tools - PDF Converter, OCR & More | Parsli",
  description:
    "Free online tools for PDF to Excel conversion, data extraction, and OCR. No signup required. Powered by AI.",
  alternates: {
    canonical: "https://parsli.co/tools",
  },
  openGraph: {
    title: "Free Document Parsing Tools",
    description:
      "Free online tools for PDF conversion, data extraction, and OCR.",
    url: "https://parsli.co/tools",
    images: [
      {
        url: "https://parsli.co/parsli-og.png",
        width: 1200,
        height: 630,
        alt: "Parsli Free Tools",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Free Document Parsing Tools",
    description:
      "Free online tools for PDF conversion, data extraction, and OCR.",
    images: ["https://parsli.co/parsli-og.png"],
  },
}

export default function ToolsPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative pt-28 pb-16 sm:pt-36 sm:pb-20">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-primary/5 rounded-full blur-3xl" />
        </div>
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight leading-[1.1] mb-6">
            Free Document Parsing Tools
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Convert, extract, and parse documents instantly. No signup required.
          </p>
        </div>
      </section>

      {/* Tools grid */}
      <section className="pb-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-6 sm:grid-cols-2">
            {tools.map((tool) => (
              <Link
                key={tool.slug}
                href={`/tools/${tool.slug}`}
                className="group rounded-xl border bg-card p-6 hover:border-primary/30 transition-colors"
              >
                <h2 className="text-lg font-semibold mb-2 group-hover:text-primary transition-colors">
                  {tool.title}
                </h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {tool.description}
                </p>
                <span className="inline-flex items-center gap-1 text-sm text-primary mt-4">
                  Use tool
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
              Need to automate document processing?
            </h2>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Parsli automates extraction at scale. Free forever up to 30
              pages/month.
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
