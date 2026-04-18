"use client"

import { Sparkles } from "lucide-react"
import { useSubscriptionOptional } from "@/components/billing/SubscriptionContext"

/**
 * Moment A — the "we've got you" card.
 *
 * Shown inline on the results surface once a free-tier user has their
 * first document processed under the 100-page first-doc-free perk.
 * Purpose is brand warmth + retention, not conversion — no CTA here.
 * The sidebar meter (app-sidebar.tsx) carries the persistent follow-up.
 *
 * Signal: `pageCount > 0 && creditsUsed === 0 && status === "completed"`.
 * A doc that processed successfully without burning credits can only have
 * come through the first_doc_free RPC branch, so we don't need a second
 * round trip to `billing_events` to disambiguate.
 */
export interface FirstDocFreeBannerProps {
  pageCount: number | null | undefined
  creditsUsed: number | null | undefined
  status: string | null | undefined
  /** Soft compact variant for dense list views (DocumentsPage). */
  compact?: boolean
}

export function FirstDocFreeBanner({
  pageCount,
  creditsUsed,
  status,
  compact = false,
}: FirstDocFreeBannerProps) {
  const sub = useSubscriptionOptional()

  // Gate precisely. Anything not matching the first-doc-free pattern stays
  // silent — we'd rather under-surface than falsely claim "on us" for a
  // doc that was actually charged.
  if (status !== "completed") return null
  if (!pageCount || pageCount <= 0) return null
  if (creditsUsed !== 0) return null

  // Hide on paid tiers. The "first document free" language is a free-tier
  // perk; showing it to a Starter+ subscriber is misleading.
  const tier = sub?.subscription?.tier
  if (tier && tier !== "free" && tier !== "anonymous") return null

  const remaining = sub?.subscription
    ? Math.max(sub.subscription.credits_free - sub.subscription.credits_used, 0)
    : null

  const pluralPages = pageCount === 1 ? "page" : "pages"
  const pluralRemaining = remaining === 1 ? "page" : "pages"

  return (
    <div
      className={
        compact
          ? "flex items-start gap-2.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm dark:border-emerald-900/50 dark:bg-emerald-950/30"
          : "flex items-start gap-3 rounded-xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-4 dark:border-emerald-900/50 dark:from-emerald-950/30 dark:to-transparent"
      }
    >
      <div
        className={
          compact
            ? "flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
            : "flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
        }
      >
        <Sparkles className={compact ? "h-3.5 w-3.5" : "h-4 w-4"} />
      </div>
      <div className="min-w-0">
        <p
          className={
            compact
              ? "text-sm font-semibold text-emerald-900 dark:text-emerald-100"
              : "text-sm font-semibold text-emerald-900 dark:text-emerald-100"
          }
        >
          Your first {pageCount} {pluralPages} are on us.
        </p>
        {remaining !== null && (
          <p
            className={
              compact
                ? "text-xs text-emerald-800/80 dark:text-emerald-200/70"
                : "text-sm text-emerald-800/80 mt-0.5 dark:text-emerald-200/70"
            }
          >
            You&apos;ve still got {remaining} free {pluralRemaining} this month — enjoy.
          </p>
        )}
      </div>
    </div>
  )
}
