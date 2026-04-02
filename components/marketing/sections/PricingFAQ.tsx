"use client"

import { useState } from "react"
import { Plus } from "lucide-react"
import { cn } from "@/lib/utils"

const pricingFaqItems = [
  {
    question: "How does page-based pricing work?",
    answer:
      'Each document you upload counts based on its number of pages. A 3-page invoice uses 3 pages from your monthly allowance. Your page count resets every 30 days. If you exceed your limit, extractions pause until the next reset or you upgrade.',
  },
  {
    question: 'What counts as a "page"?',
    answer:
      "One page equals one side of a document. A single-page invoice is 1 page. A 5-page contract is 5 pages. For images, each image counts as 1 page. For emails, each email body counts as 1 page.",
  },
  {
    question: "Can I try Parsli for free?",
    answer:
      "Yes! The Free plan includes 30 pages per month, up to 3 parsers, and full access to all features including API access and integrations. No credit card required. Your first document is always free.",
  },
  {
    question: "What happens if I exceed my page limit?",
    answer:
      "Extractions pause until your monthly allowance resets or you upgrade to a higher plan. Your existing data and parsers remain fully accessible. You'll get a notification before hitting your limit.",
  },
  {
    question: "Can I change or cancel my plan anytime?",
    answer:
      "Yes. You can upgrade, downgrade, or cancel your subscription at any time. Upgrades take effect immediately. Downgrades and cancellations take effect at the start of your next billing cycle. No long-term contracts or cancellation fees.",
  },
  {
    question: "What document types does Parsli support?",
    answer:
      "Parsli supports PDFs, images (JPG, PNG, TIFF), Microsoft Word (.docx), Excel spreadsheets (.xlsx), and email messages. Our AI handles scanned documents, photos of documents, and digitally-created files.",
  },
  {
    question: "How accurate is the AI extraction?",
    answer:
      "Parsli uses Google Gemini 2.5 Pro, one of the most advanced AI models available. For structured documents like invoices, accuracy typically exceeds 95%. The schema builder lets you define exactly what to extract, and you can review results before exporting.",
  },
  {
    question: "Is my data secure?",
    answer:
      "Yes. All data is encrypted in transit and at rest. Documents are processed securely and you can delete them at any time. We use Supabase with row-level security. We never share your data with third parties.",
  },
  {
    question: "Do I need technical skills to use Parsli?",
    answer:
      "No. The no-code schema builder lets anyone define extraction fields with point-and-click. For developers, we also offer a full REST API, webhooks, and integrations with Zapier, Make, and Google Sheets.",
  },
  {
    question: "What integrations are available?",
    answer:
      "All plans include REST API, webhooks, CSV/JSON export, email forwarding (auto-import), Google Sheets, Zapier, and Make (Integromat). Business plans can request custom integrations.",
  },
]

export function PricingFAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  return (
    <section className="py-20 sm:py-24 lg:py-28">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-center mb-4">
          Frequently asked questions
        </h2>
        <p className="text-center text-muted-foreground mb-12">
          Can&apos;t find the answer you&apos;re looking for?{" "}
          <a
            href="mailto:support@parsli.co"
            className="text-primary underline underline-offset-2"
          >
            Contact us
          </a>{" "}
          today.
        </p>

        <div className="grid sm:grid-cols-2 gap-x-8 gap-y-0">
          {pricingFaqItems.map((item, index) => (
            <div key={index} className="border-b">
              <button
                onClick={() =>
                  setOpenIndex(openIndex === index ? null : index)
                }
                className="flex w-full items-center justify-between gap-4 py-5 text-left"
              >
                <span className="text-sm font-medium pr-4">
                  {item.question}
                </span>
                <Plus
                  className={cn(
                    "h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200",
                    openIndex === index && "rotate-45"
                  )}
                />
              </button>
              <div
                className={cn(
                  "overflow-hidden transition-all duration-200",
                  openIndex === index ? "max-h-80 pb-5" : "max-h-0"
                )}
              >
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {item.answer}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
