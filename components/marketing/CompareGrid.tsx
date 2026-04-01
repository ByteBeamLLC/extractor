"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Check, X, ChevronRight } from "lucide-react"

const filterTabs = [
  { key: "all", label: "All" },
  { key: "cost", label: "Save Money" },
  { key: "ai", label: "Better AI" },
  { key: "easy", label: "Easier Setup" },
  { key: "complete", label: "More Complete" },
]

const angleToCategory: Record<string, string> = {
  cost: "cost",
  pricing_transparency: "cost",
  technology: "ai",
  instant_accuracy: "ai",
  modernization: "ai",
  simplicity: "easy",
  accessibility: "easy",
  self_service: "easy",
  ease: "easy",
  "ease-of-use": "easy",
  completeness: "complete",
  flexibility: "complete",
  features: "complete",
  purpose: "complete",
}

export interface CompetitorCardData {
  slug: string
  competitor: string
  attackAngle: string
  logo: string | null
  winCount: number
  totalRows: number
  topWins: string[]
}

export function CompareGrid({
  competitors,
}: {
  competitors: CompetitorCardData[]
}) {
  const [active, setActive] = useState("all")

  const filtered =
    active === "all"
      ? competitors
      : competitors.filter((c) => angleToCategory[c.attackAngle] === active)

  return (
    <section className="pb-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* Filter tabs */}
        <div className="flex justify-center gap-2 mb-10 flex-wrap">
          {filterTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActive(tab.key)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                active === tab.key
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Scorecard grid */}
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((comp) => (
            <Link
              key={comp.slug}
              href={`/compare/${comp.slug}`}
              className="group flex flex-col rounded-2xl border bg-card overflow-hidden transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5"
            >
              {/* Logo matchup */}
              <div className="flex items-center justify-center gap-5 px-5 pt-6 pb-4">
                <div className="flex flex-col items-center gap-1.5">
                  <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center overflow-hidden">
                    <Image
                      src="/parsli-icon.png"
                      alt="Parsli"
                      width={26}
                      height={26}
                      className="object-contain"
                    />
                  </div>
                </div>

                <span className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-widest">
                  vs
                </span>

                <div className="flex flex-col items-center gap-1.5">
                  <div className="h-11 w-11 rounded-xl bg-muted flex items-center justify-center overflow-hidden">
                    {comp.logo ? (
                      <Image
                        src={comp.logo}
                        alt={comp.competitor}
                        width={26}
                        height={26}
                        className="object-contain"
                      />
                    ) : (
                      <span className="text-sm font-bold text-muted-foreground">
                        {comp.competitor.charAt(0)}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Comparison rows */}
              <div className="px-5 pb-4 space-y-2.5 flex-1">
                {comp.topWins.map((feature, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <div className="h-4.5 w-4.5 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                        <Check className="h-3 w-3 text-emerald-600" strokeWidth={3} />
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {feature}
                      </span>
                    </div>
                    <div className="h-4.5 w-4.5 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                      <X className="h-3 w-3 text-red-400" strokeWidth={3} />
                    </div>
                  </div>
                ))}
              </div>

              {/* Footer */}
              <div className="mt-auto flex items-center justify-between border-t px-5 py-3.5 bg-muted/30">
                <span className="font-semibold text-sm">
                  Parsli vs. {comp.competitor}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    {comp.winCount}/{comp.totalRows}
                  </span>
                  <ChevronRight className="h-4 w-4 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
            </Link>
          ))}
        </div>

        {filtered.length === 0 && (
          <p className="text-center text-muted-foreground py-12">
            No comparisons in this category yet.
          </p>
        )}
      </div>
    </section>
  )
}
