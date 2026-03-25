import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import {
  ArrowRight,
  BookOpen,
  Brain,
  Building2,
  Camera,
  Check,
  ChevronDown,
  FileJson2,
  FileText,
  GraduationCap,
  Heart,
  PenLine,
  Scale,
  Scroll,
  Smartphone,
  Sparkles,
  Star,
  Stethoscope,
  Upload,
  Workflow,
  X,
  Zap,
} from "lucide-react"
import { AuthButton } from "@/components/marketing/shared/AuthButton"
import { Button } from "@/components/ui/button"
import { JsonLd } from "@/components/marketing/shared/JsonLd"
import { LPTracker } from "@/components/lp/LPTracker"
import { HeroDemo } from "@/components/lp/HeroDemo"

/* ------------------------------------------------------------------ */
/*  UTM-aware CTA helper                                              */
/* ------------------------------------------------------------------ */
const SIGNUP_BASE = "/dashboard?template=handwriting-extraction"
const FREE_TOOL = "/tools/handwriting-to-text"

export const metadata: Metadata = {
  title:
    "Cursive & Handwriting to Text Converter | AI That Reads Any Handwriting | Parsli",
  description:
    "Can AI read cursive? Yes. Convert cursive, messy handwriting, and old handwritten notes to text with 95%+ accuracy. Take a photo, get structured text in seconds. Free — no signup required.",
  keywords: [
    "handwriting to text",
    "cursive to text",
    "can ai read cursive",
    "cursive reader",
    "cursive decoder",
    "handwriting to text converter",
    "convert handwriting to text",
    "scan handwriting to text",
    "handwritten notes to text",
    "handwriting ocr",
    "best ocr for handwriting",
    "bad handwriting reader",
    "ai transcribe old handwriting",
    "cursive translator",
    "hand written notes to word",
    "handwritten notes to word",
    "turn paper notes into digital",
    "take picture of writing and convert to text",
    "writing to text converter",
    "scan cursive to text",
    "ai that reads handwriting",
    "copy handwriting text from image",
    "cursive to text ai",
    "read this cursive for me",
    "ocr for handwriting",
    "ai handwriting",
    "identify handwriting",
  ],
  robots: { index: true, follow: true },
  alternates: { canonical: "https://parsli.co/lp/handwriting-to-text" },
  openGraph: {
    title: "AI Cursive & Handwriting to Text Converter | Parsli",
    description:
      "Convert cursive, messy handwriting, and old notes to text with 95%+ accuracy. Take a photo, get text in seconds. Free tool — no signup.",
    url: "https://parsli.co/lp/handwriting-to-text",
  },
}

/* ------------------------------------------------------------------ */
/*  Data                                                              */
/* ------------------------------------------------------------------ */

const logos = [
  { src: "/logos/carrefour.png", alt: "Carrefour", h: "h-8" },
  { src: "/logos/dld.png", alt: "Dubai Land Department", h: "h-16" },
  { src: "/logos/infoquest.png", alt: "InfoQuest", h: "h-8" },
  {
    src: "/logos/takhlees.png",
    alt: "Takhlees Government Services",
    h: "h-9",
  },
]

const heroBullets = [
  "Reads cursive, messy, and mixed handwriting",
  "Take a photo or upload a scan — works instantly",
  "Get structured fields, not just a wall of text",
]

const metrics = [
  { value: "95%+", label: "Accuracy on cursive & print" },
  { value: "10s", label: "Per page — photo to text" },
  { value: "100+", label: "Languages supported" },
]

const cursiveCapabilities = [
  {
    icon: PenLine,
    title: "Cursive & connected script",
    description:
      "Accurately reads flowing cursive, joined letters, and connected script that template-based OCR tools completely miss.",
  },
  {
    icon: Scroll,
    title: "Old & faded handwriting",
    description:
      "Transcribe old letters, historical documents, and faded handwriting. Works on grandmother's letters, vintage recipes, and century-old records.",
  },
  {
    icon: Sparkles,
    title: "Bad & messy handwriting",
    description:
      "AI trained to decipher rushed notes, sloppy handwriting, and hard-to-read scrawl that other tools give up on.",
  },
  {
    icon: Camera,
    title: "Photo to text — any angle",
    description:
      "Snap a picture with your phone. The AI handles camera angles, lighting variations, paper textures, and shadows automatically.",
  },
]

const differentiators = [
  {
    icon: Brain,
    title: "AI that reads like a human",
    description:
      "Powered by Google Gemini AI — not template OCR. Understands context to decode cursive, messy handwriting, and mixed print/handwritten pages that other tools can't read.",
  },
  {
    icon: FileJson2,
    title: "Structured data, not raw text",
    description:
      "Extract names, dates, amounts, addresses, and notes into clean fields. Export as JSON, Word, send to Google Sheets, or push to your API automatically.",
  },
  {
    icon: Workflow,
    title: "One page or thousands",
    description:
      "Convert a single photo of cursive into text, or process thousands of handwritten forms with reusable schemas, batch uploads, and automation.",
  },
]

const useCases = [
  {
    icon: Heart,
    title: "Old letters & family documents",
    description:
      "Transcribe grandmother's cursive letters, old family recipes, historical correspondence, and vintage documents you can barely read. Preserve family history digitally.",
  },
  {
    icon: GraduationCap,
    title: "Student notes to digital text",
    description:
      "Convert handwritten lecture notes, study cards, and class notes to searchable digital text or Word documents. Study smarter, not harder.",
  },
  {
    icon: BookOpen,
    title: "Genealogy & historical research",
    description:
      "Digitize old census records, church registers, handwritten diaries, and historical manuscripts. AI reads faded ink and archaic cursive styles.",
  },
  {
    icon: Smartphone,
    title: "Photo of notes to text",
    description:
      "Snap a picture of your whiteboard, sticky notes, meeting notes, or paper journal. Get clean, editable text on your phone in seconds.",
  },
  {
    icon: Stethoscope,
    title: "Healthcare & patient forms",
    description:
      "Extract patient names, dates, insurance IDs, and handwritten notes from intake sheets into structured records — no retyping into your EHR.",
  },
  {
    icon: Building2,
    title: "Field reports & inspections",
    description:
      "Convert technician notes, site observations, and checklist comments into structured records your operations team can act on.",
  },
  {
    icon: Scale,
    title: "Legal & compliance documents",
    description:
      "Digitize handwritten affidavits, court forms, witness statements, and signed contracts into searchable, structured text.",
  },
  {
    icon: FileText,
    title: "Paper forms to spreadsheets",
    description:
      "Turn stacks of handwritten forms, surveys, and applications into structured spreadsheet data. Extract specific fields automatically.",
  },
]

const steps = [
  {
    step: "1",
    title: "Upload a photo, scan, or PDF",
    description:
      "Take a photo with your phone, drag and drop a scan, or forward documents via email. Works with any image of handwriting.",
  },
  {
    step: "2",
    title: "AI reads and extracts text",
    description:
      "Parsli's AI decodes cursive, messy writing, and mixed documents — then maps the text to structured fields you define (or just get the full text).",
  },
  {
    step: "3",
    title: "Copy, download, or automate",
    description:
      "Copy the text, download as Word/JSON/CSV, send to Google Sheets, or automate with Zapier, Make, webhooks, or API.",
  },
]

const comparison = [
  {
    feature: "Cursive handwriting accuracy",
    parsli: true,
    competitor: false,
    manual: false,
    parsliLabel: "95%+ with AI context",
    competitorLabel: "Often fails on cursive",
    manualLabel: "Varies by reader",
  },
  {
    feature: "Old & faded handwriting",
    parsli: true,
    competitor: false,
    manual: true,
    parsliLabel: "AI enhances & reads",
    competitorLabel: "Poor results",
    manualLabel: "Slow, error-prone",
  },
  {
    feature: "Structured field extraction",
    parsli: true,
    competitor: false,
    manual: true,
    parsliLabel: "Custom schemas",
    competitorLabel: "Plain text only",
    manualLabel: "Manual entry",
  },
  {
    feature: "Photo from phone",
    parsli: true,
    competitor: true,
    manual: false,
    parsliLabel: "Any angle, any lighting",
    competitorLabel: "Needs flat, clear scan",
    manualLabel: "N/A",
  },
  {
    feature: "Export to Word / Sheets",
    parsli: true,
    competitor: false,
    manual: true,
    parsliLabel: "JSON, CSV, Sheets, Zapier",
    competitorLabel: "Text file only",
    manualLabel: "Manual typing",
  },
  {
    feature: "Free to try",
    parsli: true,
    competitor: false,
    manual: true,
    parsliLabel: "Free tool + 30pg/mo",
    competitorLabel: "Paid only",
    manualLabel: "Free but hours of work",
  },
]

const testimonials = [
  {
    quote:
      "I tried three other handwriting OCR tools before finding Parsli. It's the only one that accurately read my grandmother's old cursive letters. I was able to preserve decades of family history.",
    name: "Sarah K.",
    role: "Genealogy Researcher",
    rating: 5,
  },
  {
    quote:
      "I photographed 40 pages of lecture notes and had them all in text in under 10 minutes. Way faster than retyping and surprisingly accurate on my messy cursive.",
    name: "Emily R.",
    role: "University Student",
    rating: 5,
  },
  {
    quote:
      "We process hundreds of handwritten field reports every week. Parsli handles our technicians' rushed handwriting better than anything else we've tried — saves our office staff hours.",
    name: "Marcus T.",
    role: "Operations Manager",
    rating: 5,
  },
]

const pricingTiers = [
  {
    name: "Free",
    price: "$0",
    period: "",
    pages: "30 pages/month",
    features: [
      "AI cursive & handwriting reading",
      "3 parsers",
      "API access",
      "Webhook integrations",
    ],
  },
  {
    name: "Starter",
    price: "$20",
    period: "/mo",
    pages: "250 pages/month",
    features: [
      "Everything in Free",
      "10 parsers",
      "All integrations",
      "Email support",
    ],
  },
  {
    name: "Growth",
    price: "$49",
    period: "/mo",
    pages: "1,000 pages/month",
    features: [
      "Everything in Starter",
      "25 parsers",
      "Priority support",
      "Google Sheets sync",
    ],
    highlight: true,
  },
  {
    name: "Pro",
    price: "$199",
    period: "/mo",
    pages: "5,000 pages/month",
    features: [
      "Everything in Growth",
      "100 parsers",
      "Team collaboration",
      "Bulk processing",
    ],
  },
]

const faqs = [
  {
    q: "Can AI read cursive handwriting?",
    a: "Yes. Parsli uses Google Gemini AI which excels at reading cursive, connected script, and flowing handwriting. Unlike template-based OCR that matches individual characters, our AI understands letter context and word patterns — the same way a human reads cursive. It achieves 95%+ accuracy on most cursive styles.",
  },
  {
    q: "How do I convert handwritten notes to text?",
    a: "Take a photo of your handwritten notes with your phone, or upload a scan/PDF. Parsli's AI reads the handwriting and converts it to editable digital text in about 10 seconds per page. You can copy the text, download as a Word document or CSV, or send it directly to Google Sheets.",
  },
  {
    q: "Can I take a picture of writing and convert it to text?",
    a: "Yes. Just snap a photo with your iPhone or Android camera — no special scanning app needed. The AI handles camera angles, varying lighting, paper textures, and even shadows. For best results, make sure the writing is reasonably visible, but it doesn't need to be a perfectly flat, well-lit scan.",
  },
  {
    q: "What's the best OCR for handwriting?",
    a: "Traditional OCR tools struggle with handwriting because they match individual characters. AI-powered tools like Parsli use contextual understanding to read handwriting the way humans do. Parsli is particularly strong on cursive, messy handwriting, and old/faded documents — and unlike most OCR tools, it extracts structured fields, not just a wall of text.",
  },
  {
    q: "Can it read bad or messy handwriting?",
    a: "Yes — this is where AI shines over traditional OCR. The AI uses surrounding context, word patterns, and document structure to decode even rushed, sloppy, or hard-to-read handwriting. It works well on doctor's notes, technician field reports, and other notoriously messy writing.",
  },
  {
    q: "Can it transcribe old or faded handwriting?",
    a: "Yes. The AI handles old letters, historical documents, faded ink, and archaic handwriting styles. It's used by genealogy researchers to transcribe family letters, old census records, and vintage documents. The AI adapts to different historical writing styles and can read text that's partially faded.",
  },
  {
    q: "How do I turn paper notes into digital text?",
    a: "Three ways: (1) Take a photo with your phone and upload it. (2) Use a scanner and upload the PDF. (3) Set up email forwarding to automatically process documents you send. The AI converts your paper notes to editable digital text you can copy, download as Word, or send to Google Sheets.",
  },
  {
    q: "Is this different from Google Lens or phone OCR?",
    a: "Google Lens gives you plain text from a single image. Parsli goes further: it extracts structured fields (names, dates, amounts) from handwritten documents, handles multi-page documents, processes batches, and integrates with your workflow tools. It also handles cursive and messy handwriting significantly better.",
  },
  {
    q: "How does pricing work?",
    a: "The free converter tool requires no signup at all — just upload and get text. For ongoing use, the free plan gives you 30 pages/month (no credit card). Paid plans start at $20/month for 250 pages. Each document page counts as one credit regardless of complexity.",
  },
  {
    q: "What file formats are supported?",
    a: "PDF, JPG, PNG, GIF, TIFF, BMP, and WebP. Photos from any smartphone camera work great. For multi-page documents, PDF is recommended. You can also forward documents via email for automatic processing.",
  },
]

/* ------------------------------------------------------------------ */
/*  Page                                                              */
/* ------------------------------------------------------------------ */
export default function HandwritingToTextLP() {
  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          name: "Parsli — AI Cursive & Handwriting to Text Converter",
          description:
            "AI-powered tool that reads cursive, messy handwriting, and old documents. Convert handwriting to structured text with 95%+ accuracy. Free to try.",
          applicationCategory: "BusinessApplication",
          operatingSystem: "Web Browser",
          offers: {
            "@type": "Offer",
            price: "0",
            priceCurrency: "USD",
            description: "Free converter tool + 30 pages/month free tier",
          },
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: "4.8",
            ratingCount: "120",
            bestRating: "5",
          },
        }}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: faqs.map((faq) => ({
            "@type": "Question",
            name: faq.q,
            acceptedAnswer: {
              "@type": "Answer",
              text: faq.a,
            },
          })),
        }}
      />

      <LPTracker page="handwriting-to-text" />

      {/* ======================== HERO ======================== */}
      <section className="relative overflow-hidden border-b bg-[linear-gradient(180deg,#fbfcff_0%,#f8f4eb_45%,#f8f9fa_100%)] pt-24 pb-16 sm:pt-32 sm:pb-20">
        <div className="absolute inset-0 -z-10">
          <div className="absolute left-1/2 top-12 h-[24rem] w-[24rem] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute right-0 top-28 h-[20rem] w-[20rem] rounded-full bg-amber-200/40 blur-3xl" />
        </div>

        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
            {/* Left — Copy */}
            <div className="max-w-2xl">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/15 bg-white/85 px-4 py-1.5 text-sm text-muted-foreground shadow-sm backdrop-blur">
                <PenLine className="h-4 w-4 text-primary" />
                AI Cursive & Handwriting Reader
              </div>

              <h1 className="text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl lg:text-[3.35rem] lg:leading-[1.05]">
                Yes, AI can read your cursive.{" "}
                <span className="text-primary">Try it free.</span>
              </h1>

              <p className="mt-5 max-w-xl text-lg leading-8 text-slate-600">
                Convert cursive, messy handwriting, old letters, and scribbled
                notes to text in seconds. Just upload a photo or scan — the AI
                decodes handwriting that other tools can&apos;t read.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                <Button
                  size="lg"
                  className="h-12 px-8 text-base gap-2"
                  asChild
                >
                  <Link href={FREE_TOOL}>
                    <Camera className="h-4 w-4" />
                    Try Free Converter — No Signup
                  </Link>
                </Button>
                <AuthButton
                  variant="outline"
                  className="h-12 px-7 text-base bg-white/80"
                  showArrow
                  href={SIGNUP_BASE}
                >
                  Start Free Account
                </AuthButton>
              </div>

              <p className="mt-4 text-sm text-muted-foreground">
                Free converter works instantly. No account needed. No credit
                card.
              </p>

              <div className="mt-8 grid gap-3 sm:grid-cols-3">
                {heroBullets.map((bullet) => (
                  <div
                    key={bullet}
                    className="rounded-2xl border border-slate-200/80 bg-white/80 p-4 shadow-sm backdrop-blur"
                  >
                    <div className="mb-2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <Check className="h-4 w-4" />
                    </div>
                    <p className="text-sm leading-6 text-slate-700">{bullet}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Right — Interactive demo */}
            <HeroDemo />
          </div>

          {/* Logo bar */}
          <div className="mt-12 border-t pt-8">
            <p className="text-center text-xs uppercase tracking-[0.24em] text-muted-foreground">
              Trusted by teams processing handwritten documents at scale
            </p>
            <div className="mt-5 flex flex-wrap items-center justify-center gap-8 sm:gap-12">
              {logos.map((logo) => (
                <Image
                  key={logo.alt}
                  src={logo.src}
                  alt={logo.alt}
                  width={140}
                  height={48}
                  className={`${logo.h} w-auto object-contain opacity-70 grayscale`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ======================== METRICS ======================== */}
      <section className="border-b bg-slate-950 py-10">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-3 gap-6 text-center">
            {metrics.map((m) => (
              <div key={m.label}>
                <p className="text-3xl font-bold text-white sm:text-4xl">
                  {m.value}
                </p>
                <p className="mt-1 text-sm text-slate-400">{m.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ======================== CURSIVE & OLD HANDWRITING ======================== */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary">
              Can AI read cursive? Yes.
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
              Reads cursive, messy, old, and faded handwriting
            </h2>
            <p className="mt-4 text-lg leading-8 text-muted-foreground">
              Traditional OCR fails on cursive because it matches individual
              characters. Parsli&apos;s AI understands context, word patterns,
              and writing flow — the way a human reads handwriting.
            </p>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {cursiveCapabilities.map((item) => (
              <div
                key={item.title}
                className="rounded-[1.75rem] border bg-card p-6 shadow-sm"
              >
                <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <item.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-base font-semibold">{item.title}</h3>
                <p className="mt-2 text-sm leading-7 text-muted-foreground">
                  {item.description}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-10 text-center">
            <Button size="lg" className="h-12 px-8 text-base gap-2" asChild>
              <Link href={FREE_TOOL}>
                <Upload className="h-4 w-4" />
                Upload Your Handwriting — Free
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ======================== DIFFERENTIATORS ======================== */}
      <section className="border-y bg-muted/30 py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary">
              Beyond plain text conversion
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
              Other handwriting tools stop at transcription
            </h2>
            <p className="mt-4 text-lg leading-8 text-muted-foreground">
              They give you a wall of text. Then you still retype every name,
              date, and amount into your spreadsheet. Parsli extracts the exact
              fields you need and sends them where they belong — automatically.
            </p>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {differentiators.map((item) => (
              <div
                key={item.title}
                className="rounded-[1.75rem] border bg-card p-7 shadow-sm"
              >
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <item.icon className="h-6 w-6" />
                </div>
                <h3 className="mt-5 text-xl font-semibold">{item.title}</h3>
                <p className="mt-3 text-sm leading-7 text-muted-foreground">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ======================== HOW IT WORKS ======================== */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary">
              How it works
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
              Photo to text in 3 steps
            </h2>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {steps.map((item) => (
              <div
                key={item.step}
                className="rounded-[1.5rem] border bg-card p-6 shadow-sm"
              >
                <div className="flex gap-4">
                  <div className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground font-bold">
                    {item.step}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">{item.title}</h3>
                    <p className="mt-2 text-sm leading-7 text-muted-foreground">
                      {item.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-10 text-center">
            <Button size="lg" className="h-12 px-8 text-base gap-2" asChild>
              <Link href={FREE_TOOL}>
                Read My Handwriting Now — Free
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ======================== USE CASES ======================== */}
      <section className="border-y bg-muted/30 py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary">
              For everyone with handwriting to read
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
              Personal projects to business workflows
            </h2>
          </div>

          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {useCases.map((item) => (
              <div
                key={item.title}
                className="rounded-[1.5rem] border bg-white p-5 shadow-sm"
              >
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white">
                  <item.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-3 text-base font-semibold">{item.title}</h3>
                <p className="mt-2 text-sm leading-7 text-muted-foreground">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ======================== COMPARISON TABLE ======================== */}
      <section className="bg-slate-950 py-16 sm:py-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary">
              How Parsli compares
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Parsli vs other handwriting OCR tools
            </h2>
          </div>

          <div className="mt-10 overflow-hidden rounded-[1.75rem] border border-white/10 bg-white/5">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="px-5 py-4 font-semibold text-slate-300">
                      Feature
                    </th>
                    <th className="px-5 py-4 font-semibold text-primary">
                      Parsli
                    </th>
                    <th className="px-5 py-4 font-semibold text-slate-400">
                      Other OCR tools
                    </th>
                    <th className="px-5 py-4 font-semibold text-slate-400">
                      Manual retyping
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {comparison.map((row) => (
                    <tr
                      key={row.feature}
                      className="border-t border-white/5"
                    >
                      <td className="px-5 py-3.5 font-medium text-slate-200">
                        {row.feature}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          {row.parsli ? (
                            <Check className="h-4 w-4 text-emerald-400" />
                          ) : (
                            <X className="h-4 w-4 text-red-400" />
                          )}
                          <span className="text-slate-300">
                            {row.parsliLabel}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          {row.competitor ? (
                            <Check className="h-4 w-4 text-emerald-400" />
                          ) : (
                            <X className="h-4 w-4 text-red-400" />
                          )}
                          <span className="text-slate-400">
                            {row.competitorLabel}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          {row.manual ? (
                            <Check className="h-4 w-4 text-emerald-400" />
                          ) : (
                            <X className="h-4 w-4 text-red-400" />
                          )}
                          <span className="text-slate-400">
                            {row.manualLabel}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* ======================== TESTIMONIALS ======================== */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-center text-3xl font-bold tracking-tight sm:text-4xl">
            People who needed their handwriting read
          </h2>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {testimonials.map((t) => (
              <div
                key={t.name}
                className="rounded-[1.5rem] border bg-card p-6 flex flex-col"
              >
                <div className="flex gap-0.5 text-yellow-500 mb-4">
                  {[...Array(t.rating)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-current" />
                  ))}
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed flex-1 mb-4">
                  &ldquo;{t.quote}&rdquo;
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-bold">
                    {t.name[0]}
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ======================== PRICING ======================== */}
      <section className="border-y bg-muted/30 py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary">
              Simple pricing
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
              Free converter. Free tier. Scale when ready.
            </h2>
            <p className="mt-4 text-lg leading-8 text-muted-foreground">
              Try the converter tool free with no signup. Create an account for
              30 free pages/month. Upgrade only when you need more volume.
            </p>
          </div>

          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {pricingTiers.map((tier) => (
              <div
                key={tier.name}
                className={`rounded-[1.5rem] border bg-card p-6 flex flex-col ${
                  tier.highlight
                    ? "border-primary shadow-lg ring-1 ring-primary relative"
                    : ""
                }`}
              >
                {tier.highlight && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground">
                    Most Popular
                  </span>
                )}
                <div className="mb-4">
                  <h3 className="text-lg font-semibold">{tier.name}</h3>
                  <p className="text-sm text-muted-foreground">{tier.pages}</p>
                </div>
                <div className="mb-6">
                  <span className="text-3xl font-bold">{tier.price}</span>
                  <span className="text-sm text-muted-foreground">
                    {tier.period}
                  </span>
                </div>
                <ul className="space-y-2 mb-6 flex-1">
                  {tier.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-primary shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <AuthButton
                  variant={tier.highlight ? "default" : "outline"}
                  className="w-full"
                  href={SIGNUP_BASE}
                >
                  {tier.name === "Free"
                    ? "Get Started Free"
                    : "Start Free Trial"}
                </AuthButton>
              </div>
            ))}
          </div>

          <p className="mt-8 text-center text-sm text-muted-foreground">
            Need more than 5,000 pages/month? Business plan at $499/month covers
            25,000 pages.{" "}
            <a
              href="mailto:talal@bytebeam.co"
              className="text-primary hover:underline"
            >
              Contact sales
            </a>{" "}
            for custom volumes.
          </p>
        </div>
      </section>

      {/* ======================== FAQ ======================== */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-center text-3xl font-bold tracking-tight sm:text-4xl">
            Frequently asked questions
          </h2>
          <div className="mt-10 divide-y rounded-[1.5rem] border bg-card">
            {faqs.map((faq) => (
              <details key={faq.q} className="group">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-6 py-5 text-sm font-semibold sm:text-base [&::-webkit-details-marker]:hidden">
                  {faq.q}
                  <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
                </summary>
                <div className="px-6 pb-5 text-sm leading-7 text-muted-foreground">
                  {faq.a}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ======================== FINAL CTA ======================== */}
      <section className="border-t bg-slate-950 py-16 sm:py-24">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/20 text-primary">
            <Zap className="h-7 w-7" />
          </div>
          <h2 className="mt-6 text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Stop squinting at handwriting. Let AI read it.
          </h2>
          <p className="mt-4 text-lg leading-8 text-slate-400">
            Upload one page of cursive or messy handwriting. See it decoded in 10
            seconds. No signup needed.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Button
              size="lg"
              className="h-12 px-8 text-base gap-2"
              asChild
            >
              <Link href={FREE_TOOL}>
                <Camera className="h-4 w-4" />
                Try Free Converter Now
              </Link>
            </Button>
            <AuthButton
              variant="outline"
              className="h-12 px-7 text-base border-white/20 text-white hover:bg-white/10"
              showArrow
              href={SIGNUP_BASE}
            >
              Create Free Account
            </AuthButton>
          </div>
          <p className="mt-5 text-sm text-slate-500">
            Free converter needs no account. Free tier: 30 pages/month. Cancel
            anytime.
          </p>
        </div>
      </section>
    </>
  )
}
