"use client"

import { useEffect, useRef } from "react"
import {
  Sparkles,
  Table2,
  Users,
  FileText,
  Calendar,
  List,
  Play,
} from "lucide-react"
import { trackEvent } from "@/lib/analytics"
import { DemoModalButton } from "@/components/marketing/DemoModalButton"
import type { StructureSignal } from "@/lib/tools/analyze-structure"

const TYPE_ICONS: Record<string, typeof Sparkles> = {
  expense_table: Table2,
  contact_list: Users,
  key_value: FileText,
  dated_log: Calendar,
  itemized_list: List,
}

interface StructureBridgeBannerProps {
  structureSignal: StructureSignal | null
  lifetimeUses: number
}

export function StructureBridgeBanner({
  structureSignal,
  lifetimeUses,
}: StructureBridgeBannerProps) {
  const trackedRef = useRef(false)

  useEffect(() => {
    if (trackedRef.current) return
    trackedRef.current = true
    trackEvent("bridge_banner_shown", {
      location: "handwriting_tool",
      structure_type: structureSignal?.type ?? "none",
      structure_count: structureSignal?.count ?? 0,
      lifetime_tool_uses: lifetimeUses,
    })
  }, [structureSignal, lifetimeUses])

  const Icon = structureSignal
    ? TYPE_ICONS[structureSignal.type] ?? Sparkles
    : Sparkles

  const headline = structureSignal
    ? structureSignal.cta
    : "Need to extract data from documents at scale?"

  const detail = structureSignal
    ? structureSignal.ctaDetail
    : "Parsli turns any document into structured, exportable data — invoices, receipts, forms, and more. Free up to 30 pages/month."

  const handleCtaClick = () => {
    trackEvent("bridge_banner_cta_clicked", {
      location: "handwriting_tool",
      structure_type: structureSignal?.type ?? "none",
      lifetime_tool_uses: lifetimeUses,
    })
  }

  return (
    <div className="border-t bg-gradient-to-r from-teal-600 to-teal-500 px-6 py-5 animate-in fade-in slide-in-from-bottom-2 duration-300 rounded-b-2xl">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        {/* Icon + Text */}
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className="shrink-0 mt-0.5 w-9 h-9 rounded-lg bg-white/15 flex items-center justify-center">
            <Icon className="h-5 w-5 text-white" />
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-sm text-white leading-snug">
              {headline}
            </p>
            <p className="text-xs text-teal-100 mt-0.5 leading-relaxed">
              {detail}
            </p>
          </div>
        </div>

        {/* CTA */}
        <div className="shrink-0 sm:ml-2" onClick={handleCtaClick}>
          <DemoModalButton className="bg-white text-teal-700 hover:bg-teal-50 border-0 shadow-md hover:shadow-lg transition-all">
            See How It Works
          </DemoModalButton>
        </div>
      </div>
    </div>
  )
}
