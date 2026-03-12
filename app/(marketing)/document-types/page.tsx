import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { AuthButton } from "@/components/marketing/shared/AuthButton"
import { documentTypes } from "@/lib/seo/document-types"

export const metadata: Metadata = {
  title: "Supported Document Types - Extract Data from Any Document | Parsli",
  description:
    "Extract structured data from invoices, receipts, emails, PDFs, bank statements, contracts, forms, and spreadsheets. See all supported document types.",
  alternates: {
    canonical: "https://parsli.co/document-types",
  },
  openGraph: {
    title: "Supported Document Types - Parsli",
    description:
      "Extract structured data from any document type with AI.",
    url: "https://parsli.co/document-types",
    images: [
      {
        url: "https://parsli.co/parsli-og.png",
        width: 1200,
        height: 630,
        alt: "Parsli Document Types",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Supported Document Types - Parsli",
    description:
      "Extract structured data from any document type with AI.",
    images: ["https://parsli.co/parsli-og.png"],
  },
}

export default function DocumentTypesPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative pt-28 pb-16 sm:pt-36 sm:pb-20">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-primary/5 rounded-full blur-3xl" />
        </div>
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight leading-[1.1] mb-6">
            Supported Document Types
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Parsli extracts structured data from any document type. PDF, image,
            email, or scanned — the AI handles it all.
          </p>
        </div>
      </section>

      {/* Document types grid */}
      <section className="pb-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-6 sm:grid-cols-2">
            {documentTypes.map((dt) => (
              <Link
                key={dt.slug}
                href={`/document-types/${dt.slug}`}
                className="group rounded-xl border bg-card p-6 hover:border-primary/30 transition-colors"
              >
                <h2 className="text-lg font-semibold mb-2 group-hover:text-primary transition-colors">
                  {dt.name}
                </h2>
                <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
                  {dt.heroDescription}
                </p>
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {dt.supportedFormats.slice(0, 4).map((fmt) => (
                    <span
                      key={fmt}
                      className="inline-block rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground"
                    >
                      {fmt}
                    </span>
                  ))}
                </div>
                <span className="inline-flex items-center gap-1 text-sm text-primary mt-3">
                  See extractable fields
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
