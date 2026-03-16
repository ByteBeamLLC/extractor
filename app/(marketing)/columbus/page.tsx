import type { Metadata } from "next"
import Link from "next/link"
import {
  MapPin,
  Truck,
  FileText,
  AlertTriangle,
  Check,
  ArrowRight,
  ChevronDown,
  Upload,
  Sparkles,
  Download,
  Building2,
  Plane,
  Train,
  Clock,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { AuthButton } from "@/components/marketing/shared/AuthButton"
import { JsonLd } from "@/components/marketing/shared/JsonLd"
import { breadcrumbJsonLd, faqJsonLd } from "@/lib/seo/json-ld"

export const metadata: Metadata = {
  title:
    "Document Automation for Columbus, Ohio 3PLs & Logistics Companies | Parsli",
  description:
    "Automate BOL and freight invoice processing for Columbus 3PLs. AI-powered document extraction built for the I-70/I-71 logistics corridor. Handles faded thermal prints. Start free.",
  keywords: [
    "Columbus 3PL document automation",
    "Columbus logistics document processing",
    "Ohio 3PL automation",
    "Columbus bill of lading processing",
    "Columbus freight invoice automation",
    "Rickenbacker logistics automation",
    "Columbus warehouse document processing",
  ],
  alternates: {
    canonical: "https://parsli.co/columbus",
  },
  openGraph: {
    title: "Document Automation for Columbus, Ohio 3PLs & Logistics Companies",
    description:
      "Automate BOL and freight invoice processing for Columbus 3PLs. AI extraction built for the I-70/I-71 logistics corridor.",
    url: "https://parsli.co/columbus",
  },
}

const painPoints = [
  {
    icon: FileText,
    title: "Non-Standardized BOLs from Hundreds of Shippers",
    description:
      "Columbus 3PLs handle freight from diverse industries — automotive, consumer goods, food, pharmaceuticals. Every shipper sends a different BOL format. Your clerks waste time figuring out where data lives on each form.",
  },
  {
    icon: AlertTriangle,
    title: "Faded Thermal Dock Prints",
    description:
      "Rickenbacker-area warehouses run high-volume receiving docks. Thermal BOL prints fade in hours, especially in Ohio summers. By the time your data entry team gets to them, half the text is unreadable.",
  },
  {
    icon: Clock,
    title: "Scaling Data Entry in a Tight Labor Market",
    description:
      "Columbus unemployment is near historic lows. Finding data entry clerks who can keep up with 300+ BOLs per day is harder and more expensive every year. Automation is the only scalable solution.",
  },
]

const documentTypes = [
  {
    name: "Bills of Lading",
    description: "Shipper, consignee, weight, freight class, PRO number",
    href: "/document-types/bills-of-lading",
  },
  {
    name: "Freight Invoices",
    description: "Carrier, rates, surcharges, accessorial charges, totals",
    href: "/document-types/freight-invoices",
  },
  {
    name: "Packing Lists",
    description: "Item descriptions, quantities, weights, dimensions",
    href: "/use-cases/pdf-data-extraction",
  },
  {
    name: "Delivery Notes",
    description: "Recipient, delivery date, signature, exceptions",
    href: "/use-cases/document-automation",
  },
  {
    name: "Customs Forms",
    description: "HS codes, declared values, country of origin",
    href: "/use-cases/pdf-data-extraction",
  },
]

const solutions = [
  {
    pain: "Non-standardized BOLs",
    solution: "AI reads any carrier's BOL format without templates",
    link: "/use-cases/bill-of-lading-parsing",
    linkText: "BOL Parsing",
  },
  {
    pain: "Faded thermal prints",
    solution:
      "Google Gemini 2.5 Pro reads dock-quality scans that break traditional OCR",
    link: "/solutions/logistics-document-automation",
    linkText: "Logistics Automation",
  },
  {
    pain: "Labor-intensive scaling",
    solution:
      "Process 300+ documents per day with zero additional headcount",
    link: "/blog/cost-of-manual-data-entry-3pl",
    linkText: "See the Cost Analysis",
  },
]

const faqs = [
  {
    question: "Do you serve Columbus-area 3PLs and logistics companies?",
    answer:
      "Yes. Parsli is built for exactly the kind of high-volume document processing that Columbus 3PLs handle daily. Whether you're near Rickenbacker, in the I-70 corridor, or anywhere in Central Ohio, Parsli automates BOL and freight invoice data entry that's currently done by hand.",
  },
  {
    question: "Can Parsli handle 300+ BOLs per day?",
    answer:
      "Yes. There's no daily processing limit beyond your plan's monthly page quota. Most Columbus 3PLs on Growth or Pro plans process 300-500+ documents per day without issues. Each document is processed in seconds, not minutes.",
  },
  {
    question: "Does it integrate with our WMS or TMS?",
    answer:
      "Yes. Parsli pushes extracted data to any system via REST API, webhooks, Zapier (5,000+ apps), Make, or Google Sheets. If your WMS or TMS has an API or accepts webhooks, Parsli connects to it.",
  },
  {
    question: "Can it read faded thermal BOL prints from the dock?",
    answer:
      "Yes. Parsli uses Google Gemini 2.5 Pro, which reads faded thermal prints, low-contrast warehouse scans, and even handwritten annotations significantly better than traditional OCR engines. No image pre-processing required.",
  },
  {
    question: "How does pricing work for high-volume operations?",
    answer:
      "Parsli offers volume-based plans from Free (30 pages/month) to Business (15,000 pages/month at $349/mo). For Columbus 3PLs processing 500+ documents daily, the Business plan delivers document processing at under $0.03 per page. Contact us for custom enterprise volumes.",
  },
  {
    question:
      "What's the difference between Parsli and enterprise solutions like Shipamax?",
    answer:
      "Shipamax targets enterprise freight forwarders with custom implementations and enterprise-only pricing. Parsli offers the same AI-powered logistics document extraction with self-service pricing starting free. No sales calls, no implementation timeline — sign up and start extracting in minutes.",
  },
]

const blogResources = [
  {
    href: "/blog/bill-of-lading-requirements-complete-guide",
    title: "BOL Requirements: Complete FMCSA Guide",
  },
  {
    href: "/blog/bol-errors-prevention-guide",
    title: "12 Common BOL Errors That Cost Thousands",
  },
  {
    href: "/blog/cost-of-manual-data-entry-3pl",
    title: "The Hidden Cost of Manual Data Entry for 3PLs",
  },
  {
    href: "/blog/ohio-freight-regulations-2026",
    title: "Ohio Freight Regulations 2026",
  },
  {
    href: "/blog/columbus-logistics-hub-3pl-guide",
    title: "Columbus: America's Fastest-Growing Logistics Hub",
  },
  {
    href: "/blog/freight-invoice-processing-automation",
    title: "How to Automate Freight Invoice Processing",
  },
]

export default function ColumbusPage() {
  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", url: "https://parsli.co" },
          { name: "Columbus", url: "https://parsli.co/columbus" },
        ])}
      />
      <JsonLd data={faqJsonLd(faqs)} />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "LocalBusiness",
          name: "Parsli",
          description:
            "AI-powered document automation for logistics companies in Columbus, Ohio.",
          url: "https://parsli.co/columbus",
          areaServed: {
            "@type": "City",
            name: "Columbus",
            addressRegion: "OH",
            addressCountry: "US",
          },
          serviceType: "Document Data Extraction",
        }}
      />

      {/* 1. Hero */}
      <section className="relative pt-28 pb-16 sm:pt-36 sm:pb-20">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-primary/5 rounded-full blur-3xl" />
        </div>
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <Badge variant="secondary" className="mb-6">
            <MapPin className="h-3 w-3 mr-1" />
            Columbus, Ohio
          </Badge>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight leading-[1.1] mb-6">
            Document Automation for Columbus Logistics Companies
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
            Columbus sits at the intersection of I-70 and I-71, within a 1-day
            drive of 50% of the US population. Your 3PL moves freight for the
            entire Eastern US — let AI handle the paperwork.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <AuthButton className="text-base px-8 h-12" showArrow>
              Get Started Free
            </AuthButton>
            <Button
              size="lg"
              variant="outline"
              className="text-base px-8 h-12"
              asChild
            >
              <Link href="/solutions/logistics-document-automation">
                See How It Works
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* 2. Local Context — Columbus Logistics Stats */}
      <section className="py-16 sm:py-20 bg-muted/30">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-4">
            Why Columbus Is a Top 10 US Logistics Hub
          </h2>
          <p className="text-center text-muted-foreground max-w-2xl mx-auto mb-12">
            Central Ohio&apos;s logistics infrastructure generates massive
            document processing needs that manual data entry can&apos;t keep up
            with.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="rounded-xl border bg-card p-6 text-center">
              <Plane className="h-6 w-6 text-primary mx-auto mb-3" />
              <p className="text-2xl font-bold mb-1">Rickenbacker</p>
              <p className="text-sm text-muted-foreground">
                International cargo airport — one of the only dedicated cargo
                airports in the US
              </p>
            </div>
            <div className="rounded-xl border bg-card p-6 text-center">
              <Truck className="h-6 w-6 text-primary mx-auto mb-3" />
              <p className="text-2xl font-bold mb-1">I-70 / I-71</p>
              <p className="text-sm text-muted-foreground">
                Two major interstates intersect in Columbus, connecting East
                Coast to Midwest
              </p>
            </div>
            <div className="rounded-xl border bg-card p-6 text-center">
              <Train className="h-6 w-6 text-primary mx-auto mb-3" />
              <p className="text-2xl font-bold mb-1">NS / CSX</p>
              <p className="text-sm text-muted-foreground">
                Norfolk Southern and CSX rail lines with intermodal terminals
                serving Central Ohio
              </p>
            </div>
            <div className="rounded-xl border bg-card p-6 text-center">
              <Building2 className="h-6 w-6 text-primary mx-auto mb-3" />
              <p className="text-2xl font-bold mb-1">FTZ #138</p>
              <p className="text-sm text-muted-foreground">
                Foreign Trade Zone at Rickenbacker — duty deferral for
                import/export operations
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Companies Like Yours */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-4">
            Built for Companies Like Yours
          </h2>
          <p className="text-center text-muted-foreground max-w-2xl mx-auto mb-8">
            Columbus-area 3PLs like ODW Logistics, FST Logistics, Crane
            Worldwide, AIT Worldwide, Highlight Motor Freight, and NFI
            Industries process hundreds of shipping documents every day. If your
            team is still keying BOL data by hand, Parsli can help.
          </p>
          <div className="rounded-xl border bg-card p-6 sm:p-8">
            <div className="grid sm:grid-cols-3 gap-6 text-center">
              <div>
                <p className="text-3xl font-bold text-primary mb-1">300+</p>
                <p className="text-sm text-muted-foreground">
                  BOLs processed per day by a typical mid-size Columbus 3PL
                </p>
              </div>
              <div>
                <p className="text-3xl font-bold text-primary mb-1">12.7 min</p>
                <p className="text-sm text-muted-foreground">
                  Average manual processing time per document
                </p>
              </div>
              <div>
                <p className="text-3xl font-bold text-primary mb-1">{"< 1 min"}</p>
                <p className="text-sm text-muted-foreground">
                  Processing time with Parsli AI extraction
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Pain Points */}
      <section className="py-16 sm:py-20 bg-muted/30">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-12">
            The Document Processing Challenge
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {painPoints.map((point) => (
              <div key={point.title} className="rounded-xl border bg-card p-6">
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-destructive/10 text-destructive mb-4">
                  <point.icon className="h-5 w-5" />
                </div>
                <h3 className="font-semibold mb-2">{point.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {point.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. Solution — How Parsli Solves Each Pain */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-12">
            How Parsli Solves Each Challenge
          </h2>
          <div className="space-y-6">
            {solutions.map((s) => (
              <div
                key={s.pain}
                className="rounded-xl border bg-card p-6 flex flex-col sm:flex-row items-start gap-4"
              >
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-green-500/10 text-green-600 shrink-0">
                  <Check className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground mb-1">
                    <span className="line-through">{s.pain}</span>
                  </p>
                  <p className="font-semibold mb-2">{s.solution}</p>
                  <Link
                    href={s.link}
                    className="inline-flex items-center gap-1 text-sm text-primary hover:underline underline-offset-4"
                  >
                    {s.linkText}
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. Document Types Grid */}
      <section className="py-16 sm:py-20 bg-muted/30">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-4">
            Documents We Automate
          </h2>
          <p className="text-center text-muted-foreground max-w-2xl mx-auto mb-12">
            Every document type your Columbus 3PL handles daily — extracted and
            structured automatically.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {documentTypes.map((doc) => (
              <Link
                key={doc.name}
                href={doc.href}
                className="group rounded-xl border bg-card p-5 hover:border-primary/30 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <FileText className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-sm mb-1 group-hover:text-primary transition-colors">
                      {doc.name}
                    </h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {doc.description}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 7. How It Works */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-12">
            How It Works
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Upload,
                step: "1",
                title: "Forward Documents",
                description:
                  "Scan BOLs at the dock, forward carrier emails, or send via API. Parsli ingests from any source.",
              },
              {
                icon: Sparkles,
                step: "2",
                title: "AI Extracts Data",
                description:
                  "Define your schema once — shipper, consignee, weight, freight class — and the AI extracts from any format.",
              },
              {
                icon: Download,
                step: "3",
                title: "Data Flows to Your Systems",
                description:
                  "Extracted data pushes to your WMS, TMS, or accounting system via API, webhooks, Zapier, or Google Sheets.",
              },
            ].map((step) => (
              <div
                key={step.step}
                className="relative rounded-xl border bg-card p-6 text-center"
              >
                <div className="absolute top-4 right-4 text-xs font-bold text-muted-foreground/40">
                  {step.step}
                </div>
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary mb-4">
                  <step.icon className="h-6 w-6" />
                </div>
                <h3 className="font-semibold text-lg mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 8. FAQ */}
      <section className="py-16 sm:py-20 bg-muted/30">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-12">
            Frequently Asked Questions
          </h2>
          <div className="divide-y rounded-xl border bg-card">
            {faqs.map((faq, i) => (
              <details key={i} className="group">
                <summary className="flex items-center justify-between gap-4 px-6 py-5 cursor-pointer list-none text-sm sm:text-base font-medium">
                  {faq.question}
                  <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
                </summary>
                <div className="px-6 pb-5 text-sm text-muted-foreground leading-relaxed">
                  {faq.answer}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* 9. Related Resources */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-4">
            Logistics Resources
          </h2>
          <p className="text-center text-muted-foreground max-w-2xl mx-auto mb-8">
            Guides, regulations, and insights for Columbus 3PLs.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {blogResources.map((resource) => (
              <Link
                key={resource.href}
                href={resource.href}
                className="group rounded-xl border bg-card p-5 hover:border-primary/30 transition-colors"
              >
                <h3 className="font-semibold text-sm mb-1 group-hover:text-primary transition-colors">
                  {resource.title}
                </h3>
                <span className="inline-flex items-center gap-1 text-xs text-primary mt-1">
                  Read article <ArrowRight className="h-3 w-3" />
                </span>
              </Link>
            ))}
          </div>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/industries/logistics"
              className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline underline-offset-4"
            >
              Logistics Industry Page <ArrowRight className="h-3.5 w-3.5" />
            </Link>
            <Link
              href="/tools/bol-parser"
              className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline underline-offset-4"
            >
              Free BOL Parser Tool <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* 10. Final CTA */}
      <section className="py-16 sm:py-20 bg-muted/30 border-t">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 text-primary mb-6">
            <Sparkles className="h-7 w-7" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold mb-4">
            Ready to Automate Your Columbus 3PL Paperwork?
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto mb-8">
            Join logistics teams across Central Ohio who use Parsli to eliminate
            manual BOL and freight invoice data entry. Start free — no credit
            card, no sales call.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <AuthButton className="text-base px-8 h-12" showArrow>
              Get Started Free
            </AuthButton>
            <Button
              size="lg"
              variant="outline"
              className="text-base px-8 h-12"
              asChild
            >
              <Link href="/pricing">View Pricing</Link>
            </Button>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            30 free pages/month &middot; No credit card required &middot; Set up
            in under 5 minutes
          </p>
        </div>
      </section>
    </>
  )
}
