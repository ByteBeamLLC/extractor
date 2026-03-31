import type { Metadata } from "next"
import Link from "next/link"
import {
  Shield,
  Zap,
  UserX,
  Upload,
  Download,
  ArrowRight,
  Sparkles,
  Code2,
  Monitor,
  Smartphone,
  Tablet,
  Users,
  GraduationCap,
  Building2,
  Briefcase,
  Lightbulb,
  Star,
  UserCircle,
  ScanLine,
  FileText,
} from "lucide-react"
import { ResumeParserTool } from "@/components/tools/ResumeParserTool"
import { Button } from "@/components/ui/button"
import { AuthButton } from "@/components/marketing/shared/AuthButton"
import { JsonLd } from "@/components/marketing/shared/JsonLd"
import { breadcrumbJsonLd } from "@/lib/seo/json-ld"

export const metadata: Metadata = {
  title: "Free Resume Parser — Extract Data Online",
  description:
    "Extract text from resumes and CVs instantly in your browser. Free, no sign-up, no file uploads to servers. Supports PDF and image resumes. For structured candidate data, try Parsli AI.",
  keywords: [
    "resume parser",
    "resume text extraction",
    "extract text from resume",
    "cv parser free",
    "resume data extraction",
    "parse resume pdf",
    "resume reader online",
    "free resume parser",
    "cv to text",
    "resume scanner",
  ],
  alternates: {
    canonical: "https://parsli.co/tools/resume-parser",
  },
  openGraph: {
    title: "Free Resume Parser — Extract Data Online",
    description:
      "Extract text from resumes and CVs instantly in your browser. Free forever, no sign-up required, your data never leaves your device.",
    url: "https://parsli.co/tools/resume-parser",
  },
}

const features = [
  {
    icon: Shield,
    title: "Private & secure",
    description:
      "Your resume is processed entirely in your browser. Files never leave your device — important for sensitive personal data.",
  },
  {
    icon: UserX,
    title: "No sign-up required",
    description:
      "Use it instantly in your browser. No account, no email, no nonsense.",
  },
  {
    icon: Zap,
    title: "Free & unlimited",
    description:
      "No limits, no watermarks, no paywalls. Parse as many resumes as you want.",
  },
]

const steps = [
  {
    icon: Upload,
    title: "Upload a resume",
    description: "Drag and drop a resume PDF or image. Up to 50 MB.",
  },
  {
    icon: ScanLine,
    title: "Extract text automatically",
    description:
      "The tool extracts all text from the resume using PDF parsing or OCR for images.",
  },
  {
    icon: Download,
    title: "Copy or download",
    description:
      "Copy the extracted text to clipboard or download as a .txt file.",
  },
]

const personas = [
  {
    icon: Users,
    title: "Recruiters & HR Teams",
    description:
      "Extract text from candidate resumes quickly for ATS entry, screening, and comparison.",
  },
  {
    icon: Building2,
    title: "Staffing Agencies",
    description:
      "Process large volumes of resumes and CVs without manual retyping.",
  },
  {
    icon: Briefcase,
    title: "Hiring Managers",
    description:
      "Pull text from resumes to quickly search for skills, experience, and qualifications.",
  },
  {
    icon: GraduationCap,
    title: "Job Seekers",
    description:
      "Extract text from your own resume to paste into application forms and job portals.",
  },
]

const faqs = [
  {
    q: "Is this resume parser really free?",
    a: "Yes, completely free with no limits. There are no hidden charges, no watermarks, and no sign-up required. We built this as a free utility for the community.",
  },
  {
    q: "Do you store or upload my resumes?",
    a: "No. Your resume is processed entirely in your browser using JavaScript. The file never leaves your device and is never sent to any server. Candidate data stays 100% private.",
  },
  {
    q: "Does this extract structured candidate data?",
    a: "This free tool extracts raw text from resumes. For structured data — name, email, phone, skills, work experience, education — as JSON, try Parsli AI which uses AI to understand resume layouts and sections.",
  },
  {
    q: "What resume formats work best?",
    a: "This tool works with any PDF resume that has embedded text (most modern resumes). Image/scanned resumes use OCR. Complex multi-column layouts may have text ordering issues — Parsli AI handles these better.",
  },
  {
    q: "Can I parse resumes in languages other than English?",
    a: "The PDF text extraction works with any language. The OCR engine supports multiple languages including English, Spanish, French, German, Arabic, Chinese, Japanese, and more.",
  },
  {
    q: "What file formats are supported?",
    a: "You can upload PDF files, JPEG/JPG images, PNG images, and WebP images. PDF resumes work best as they have embedded text.",
  },
  {
    q: "What's the difference between this and Parsli AI?",
    a: "This free tool extracts raw text from resumes. Parsli AI understands resume structure and extracts structured data — name, contact info, skills, experience, education, certifications — as clean JSON. It also integrates with Google Sheets, Zapier, and 5,000+ apps for ATS workflows.",
  },
  {
    q: "Can I process multiple resumes at once?",
    a: "This tool processes one resume at a time. For batch processing hundreds of resumes automatically, try Parsli AI which supports bulk uploads, email forwarding, and API integration.",
  },
  {
    q: "Does this work with multi-column resume layouts?",
    a: "Text is extracted in reading order, but complex multi-column layouts may result in mixed-up text ordering. For resumes with sidebars, graphics, or multi-column designs, Parsli AI produces significantly better results.",
  },
  {
    q: "Can I use this on my phone?",
    a: "Yes. This tool works on iPhone, iPad, and Android devices. Open the page in your mobile browser, upload a resume photo or PDF, and extract the text instantly.",
  },
]

export default function ResumeParserPage() {
  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", url: "https://parsli.co" },
          { name: "Tools", url: "https://parsli.co/tools" },
          {
            name: "Resume Parser",
            url: "https://parsli.co/tools/resume-parser",
          },
        ])}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          name: "Parsli Resume Parser",
          description:
            "Free browser-based tool to extract text from resumes and CVs. Supports PDF and image files. No sign-up required.",
          applicationCategory: "UtilitiesApplication",
          operatingSystem: "Web Browser",
          offers: {
            "@type": "Offer",
            price: "0",
            priceCurrency: "USD",
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

      {/* 1. Hero + Tool */}
      <section className="relative pt-24 sm:pt-28 pb-16">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-primary/5 rounded-full blur-3xl" />
        </div>

        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border bg-card px-4 py-1.5 text-sm text-muted-foreground mb-6">
            <UserCircle className="h-4 w-4 text-primary" />
            Resume Parser
          </div>

          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight leading-[1.1] mb-4">
            Extract Text from Resumes
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-3">
            Free, instant, no sign-up
          </p>

          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-10">
            <div className="flex items-center gap-0.5 text-yellow-500">
              <Star className="h-3.5 w-3.5 fill-current" />
              <Star className="h-3.5 w-3.5 fill-current" />
              <Star className="h-3.5 w-3.5 fill-current" />
              <Star className="h-3.5 w-3.5 fill-current" />
              <Star className="h-3.5 w-3.5 fill-current" />
            </div>
            <span>Trusted by thousands of users</span>
          </div>

          <ResumeParserTool />

          <p className="mt-6 text-xs text-muted-foreground">
            100% client-side processing &middot; No data sent to any server
            &middot; Unlimited extractions
          </p>
        </div>
      </section>

      {/* 2. API / Product Upsell */}
      <section className="py-10 sm:py-12 border-t">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-xl border bg-card p-6 sm:p-8 flex flex-col sm:flex-row items-start gap-5">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 text-primary shrink-0">
              <Code2 className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <h2 className="font-semibold text-lg mb-1">
                Want to parse resumes via API?
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                Automate resume processing with AI-powered extraction. Get
                structured JSON with candidate name, skills, experience,
                education, and contact info. Build ATS integrations and
                hiring workflows.
              </p>
              <div className="flex items-center gap-4">
                <Link
                  href="/solutions/document-parsing-api"
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline underline-offset-4"
                >
                  Explore API
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
                <Link
                  href="/docs"
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  Docs
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Cross-Sell Links */}
      <section className="pb-10 sm:pb-12">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <p className="text-sm text-muted-foreground text-center leading-relaxed">
            Need to extract data from other documents?{" "}
            <Link
              href="/tools/invoice-parser"
              className="text-primary hover:underline underline-offset-4"
            >
              Invoice Parser
            </Link>
            ,{" "}
            <Link
              href="/tools/ai-summarizer"
              className="text-primary hover:underline underline-offset-4"
            >
              AI Document Summarizer
            </Link>
            , and{" "}
            <Link
              href="/tools/pdf-to-excel"
              className="text-primary hover:underline underline-offset-4"
            >
              PDF to Excel Converter
            </Link>{" "}
            are available too.
          </p>
        </div>
      </section>

      {/* 4. Why Use This Tool */}
      <section className="py-16 sm:py-20 bg-muted/30">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-12">
            Why use this resume parser
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {features.map((f) => (
              <div
                key={f.title}
                className="rounded-xl border bg-card p-6 text-center"
              >
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 text-primary mb-4">
                  <f.icon className="h-6 w-6" />
                </div>
                <h3 className="font-semibold text-lg mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {f.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. How It Works */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-12">
            How it works
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((step, i) => (
              <div
                key={step.title}
                className="relative rounded-xl border bg-card p-6 text-center"
              >
                <div className="absolute top-4 right-4 text-xs font-bold text-muted-foreground/40">
                  {i + 1}
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

          {/* Note callout */}
          <div className="mt-8 rounded-lg border-l-4 border-primary bg-primary/5 px-6 py-4 max-w-2xl mx-auto">
            <p className="text-sm text-muted-foreground leading-relaxed">
              <span className="font-medium text-foreground">Note:</span> This
              tool extracts raw text from resumes. For structured candidate
              data like skills, experience, and education — try{" "}
              <Link
                href="/dashboard"
                className="text-primary hover:underline underline-offset-4"
              >
                Parsli AI
              </Link>{" "}
              for that.
            </p>
          </div>
        </div>
      </section>

      {/* 6. Educational Content */}
      <section className="py-16 sm:py-20 bg-muted/30">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-12">
            What this tool extracts
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="rounded-xl border bg-card p-6">
              <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Free text extraction
              </h3>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-0.5">&#10003;</span>
                  All visible text from the resume
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-0.5">&#10003;</span>
                  OCR for image/scanned resumes
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-0.5">&#10003;</span>
                  Copy to clipboard or download as .txt
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-0.5">&#10003;</span>
                  Works with any resume format
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-0.5">&#10003;</span>
                  100% private, runs in your browser
                </li>
              </ul>
            </div>
            <div className="rounded-xl border bg-card p-6">
              <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Parsli AI structured extraction
              </h3>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <ArrowRight className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
                  Name, email, phone, and location
                </li>
                <li className="flex items-start gap-2">
                  <ArrowRight className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
                  Skills list and proficiency levels
                </li>
                <li className="flex items-start gap-2">
                  <ArrowRight className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
                  Work experience with dates, titles, companies
                </li>
                <li className="flex items-start gap-2">
                  <ArrowRight className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
                  Education, certifications, and languages
                </li>
                <li className="flex items-start gap-2">
                  <ArrowRight className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
                  Custom schemas, API, Google Sheets, Zapier
                </li>
              </ul>
            </div>
          </div>

          {/* Tips */}
          <div className="mt-16 max-w-3xl mx-auto">
            <div className="flex items-center gap-2 mb-6">
              <Lightbulb className="h-5 w-5 text-primary" />
              <h3 className="text-xl font-bold">
                Tips for better resume text extraction
              </h3>
            </div>
            <div className="space-y-6">
              <div>
                <h4 className="font-semibold mb-2">
                  Use PDF resumes over images
                </h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  PDF resumes with embedded text extract perfectly. Image-based
                  resumes require OCR, which may have accuracy issues with
                  decorative fonts and complex layouts.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">
                  Simple layouts extract best
                </h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Single-column resumes produce the cleanest text output.
                  Multi-column layouts, sidebars, and graphics can cause text
                  ordering issues — Parsli AI handles these better.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">
                  Check for special characters
                </h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Some resume templates use special Unicode characters for
                  bullets and icons. These may appear differently in the
                  extracted text.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">
                  Need structured data? Use Parsli AI
                </h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  If you need structured candidate data — name, skills,
                  experience, education — rather than raw text, Parsli AI
                  handles that with custom schemas.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. Perfect For */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-12">
            Perfect for
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {personas.map((p) => (
              <div
                key={p.title}
                className="rounded-xl border bg-card p-5 hover:border-primary/30 transition-colors"
              >
                <p.icon className="h-5 w-5 text-primary mb-3" />
                <h3 className="font-semibold text-sm mb-1">{p.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {p.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 8. FAQ */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-12">
            Frequently asked questions
          </h2>
          <div className="grid sm:grid-cols-2 gap-6">
            {faqs.map((faq) => (
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

      {/* 9. SEO Content + Comparison Table */}
      <section className="py-16 sm:py-20 bg-muted/30 border-t">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-xl sm:text-2xl font-bold mb-4">
            How to Parse Resumes for Free
          </h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            Resume parsing is essential for recruiters, HR teams, and staffing
            agencies processing large volumes of applications. Whether you need
            to extract candidate information for your ATS, compare
            qualifications, or digitize paper resumes, a reliable resume parser
            saves hours of manual data entry.
          </p>
          <p className="text-muted-foreground leading-relaxed mb-4">
            Most resume parsing tools require server uploads, accounts, and
            subscriptions — raising privacy concerns for candidate data. This
            tool is different — it runs entirely in your browser. Resume data
            is processed on your own device and never sent anywhere.
          </p>

          <h2 className="text-xl sm:text-2xl font-bold mt-10 mb-4">
            When Do You Need AI-Powered Resume Parsing?
          </h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            This free tool extracts raw text from resumes. But if you need
            structured candidate data — name, contact info, skills, work
            history, education — you need AI that understands resume layouts.
          </p>
          <p className="text-muted-foreground leading-relaxed mb-4">
            Parsli uses Google&apos;s Gemini AI to understand resume structure.
            You define a schema with the exact fields you want, and the AI
            extracts structured candidate data from any resume format. The data
            flows automatically to Google Sheets, your ATS, or any app via
            Zapier.
          </p>

          <h2 className="text-xl sm:text-2xl font-bold mt-10 mb-4">
            Free Text Extraction vs Parsli AI Extraction
          </h2>
          <div className="border rounded-lg overflow-hidden mb-6">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left px-4 py-2.5 font-semibold">
                    Feature
                  </th>
                  <th className="text-left px-4 py-2.5 font-semibold">
                    Free Tool
                  </th>
                  <th className="text-left px-4 py-2.5 font-semibold">
                    Parsli AI
                  </th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["Raw text extraction", "Yes", "Yes"],
                  ["Structured data (JSON)", "No", "Yes"],
                  ["Skills extraction", "No", "Yes"],
                  ["Work experience parsing", "No", "Yes"],
                  ["Multi-column layouts", "Basic", "Advanced"],
                  ["Custom extraction schema", "No", "Yes"],
                  ["Batch processing", "No", "Yes"],
                  ["API access", "No", "Yes"],
                  ["Price", "Free", "Free tier + paid plans"],
                ].map(([feature, free, ai]) => (
                  <tr key={feature} className="border-t">
                    <td className="px-4 py-2 font-medium">{feature}</td>
                    <td className="px-4 py-2 text-muted-foreground">{free}</td>
                    <td className="px-4 py-2 text-muted-foreground">{ai}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* 10. Works Everywhere */}
      <section className="py-12 sm:py-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-lg font-semibold text-center mb-8">
            Works everywhere — no install needed
          </h2>
          <div className="grid grid-cols-3 gap-6 max-w-md mx-auto">
            <div className="text-center">
              <Monitor className="h-6 w-6 mx-auto text-muted-foreground mb-2" />
              <p className="text-xs text-muted-foreground">Desktop</p>
              <p className="text-[10px] text-muted-foreground/60">
                Chrome, Firefox, Safari, Edge
              </p>
            </div>
            <div className="text-center">
              <Smartphone className="h-6 w-6 mx-auto text-muted-foreground mb-2" />
              <p className="text-xs text-muted-foreground">Mobile</p>
              <p className="text-[10px] text-muted-foreground/60">
                iOS, Android
              </p>
            </div>
            <div className="text-center">
              <Tablet className="h-6 w-6 mx-auto text-muted-foreground mb-2" />
              <p className="text-xs text-muted-foreground">Tablet</p>
              <p className="text-[10px] text-muted-foreground/60">
                iPad, Android tablets
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 11. Final CTA */}
      <section className="py-16 sm:py-20 bg-muted/30 border-t">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 text-primary mb-6">
            <Sparkles className="h-7 w-7" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold mb-4">
            Stop copying candidate details from resumes manually.
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto mb-8 leading-relaxed">
            Parsli extracts structured data from any document — PDFs, images,
            scans, emails. Define custom schemas and automate with integrations.
            Free forever up to 30 pages/month.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <AuthButton className="text-base px-8 h-12" showArrow>
              Try Parsli Free
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
          <p className="mt-4 text-sm text-muted-foreground">
            No credit card required &middot; 30 free pages/month
          </p>
        </div>
      </section>

      {/* 12. Related Resources */}
      <section className="py-12 sm:py-16 border-t">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-lg font-semibold mb-6">Related Resources</h2>
          <div className="flex flex-wrap gap-3">
            {[
              { href: "/tools/ai-summarizer", label: "AI Document Summarizer" },
              { href: "/tools/invoice-parser", label: "Invoice Parser" },
              { href: "/tools/pdf-to-excel", label: "PDF to Excel Converter" },
              { href: "/tools/pdf-table-extractor", label: "PDF Table Extractor" },
              { href: "/solutions/document-parsing-api", label: "Document Parsing API" },
              { href: "/use-cases/resume-parsing", label: "Resume Parsing Use Case" },
              { href: "/docs", label: "Documentation" },
              { href: "/pricing", label: "Pricing" },
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="inline-flex items-center gap-1.5 rounded-lg border bg-card px-4 py-2 text-sm hover:border-primary/30 transition-colors"
              >
                {link.label}
                <ArrowRight className="h-3 w-3 text-muted-foreground" />
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
