"use client"

import { useState } from "react"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { SectionWrapper } from "@/components/marketing/shared/SectionWrapper"
import { faqItems } from "@/lib/seo/faq-data"

export function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  return (
    <SectionWrapper id="faq">
      <div className="text-center mb-14">
        <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
          Frequently Asked Questions
        </h2>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Everything you need to know about Parsli. Can&apos;t find the answer
          you&apos;re looking for?{" "}
          <a
            href="mailto:support@parsli.co"
            className="text-primary underline underline-offset-2"
          >
            Contact us
          </a>
          .
        </p>
      </div>

      <div className="mx-auto max-w-3xl divide-y rounded-xl border bg-card">
        {faqItems.map((item, index) => (
          <div key={index}>
            <button
              onClick={() =>
                setOpenIndex(openIndex === index ? null : index)
              }
              className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
            >
              <span className="text-sm sm:text-base font-medium">
                {item.question}
              </span>
              <ChevronDown
                className={cn(
                  "h-5 w-5 shrink-0 text-muted-foreground transition-transform duration-200",
                  openIndex === index && "rotate-180"
                )}
              />
            </button>
            <div
              className={cn(
                "overflow-hidden transition-all duration-200",
                openIndex === index ? "max-h-96 pb-5" : "max-h-0"
              )}
            >
              <p className="px-6 text-sm text-muted-foreground leading-relaxed">
                {item.answer}
              </p>
            </div>
          </div>
        ))}
      </div>
    </SectionWrapper>
  )
}
