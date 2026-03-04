"use client"

import { Progress } from "@/components/ui/progress"
import type { ExtractorSubscription } from "@/lib/extractor/types"

interface CreditUsageBarProps {
  subscription: ExtractorSubscription
}

export function CreditUsageBar({ subscription }: CreditUsageBarProps) {
  const { credits_free, credits_used } = subscription
  const percentage = credits_free > 0 ? Math.min((credits_used / credits_free) * 100, 100) : 0
  const remaining = Math.max(credits_free - credits_used, 0)

  return (
    <div className="p-4 bg-card border rounded-lg">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium">Monthly Usage</span>
        <span className="text-sm text-muted-foreground">
          {credits_used} / {credits_free} pages used
        </span>
      </div>
      <Progress value={percentage} className="h-2" />
      <p className="text-xs text-muted-foreground mt-1.5">
        {remaining} page{remaining !== 1 ? "s" : ""} remaining this month
      </p>
    </div>
  )
}
