"use client"

import { createContext, useCallback, useContext, useMemo, useState } from "react"
import { FileText, Loader2, Check, AlertCircle } from "lucide-react"

import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { trackEvent } from "@/lib/analytics"
import { useSession } from "@/lib/supabase/hooks"
import type { QuotaErrorBody } from "@/lib/extractor/billing/quota-response"
import type { PlanTier } from "@/lib/stripe/config"

/**
 * Upgrade dialog — the post-402 conversion surface.
 *
 * Shown when an upload fails the credit reservation because the user's
 * current plan can't cover the document they tried to process. The copy
 * follows the Airtable / Cursor / GitHub Copilot pattern documented in
 * the paywall research: specific-number headline, plan name on the CTA,
 * three benefit bullets, soft dismiss. No packs, no fake urgency.
 *
 * Context mirrors `AuthDialogContext` so any component can call
 * `useUpgradeDialog().openUpgradeDialog(err)` after a failed fetch.
 */

interface OpenUpgradeDialogInput {
  /** The parsed 402 response body from an upload endpoint. */
  quota: QuotaErrorBody
  /** Original filename, for the headline. Optional — fallback copy used if missing. */
  fileName?: string
  /** Where the wall was hit; used for analytics segmentation. */
  source?: string
}

interface UpgradeDialogContextValue {
  openUpgradeDialog: (input: OpenUpgradeDialogInput) => void
  closeUpgradeDialog: () => void
}

const UpgradeDialogContext = createContext<UpgradeDialogContextValue | undefined>(undefined)

type Billing = "monthly" | "annual"

export function UpgradeDialogProvider({ children }: { children: React.ReactNode }) {
  const session = useSession()
  const [open, setOpen] = useState(false)
  const [quota, setQuota] = useState<QuotaErrorBody | null>(null)
  const [fileName, setFileName] = useState<string | undefined>(undefined)
  const [source, setSource] = useState<string | undefined>(undefined)
  const [billing, setBilling] = useState<Billing>("monthly")
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const [checkoutError, setCheckoutError] = useState<string | null>(null)

  const openUpgradeDialog = useCallback((input: OpenUpgradeDialogInput) => {
    setQuota(input.quota)
    setFileName(input.fileName)
    setSource(input.source)
    setBilling("monthly")
    setCheckoutError(null)
    setOpen(true)
    // Paywall-impression event. Makes funnel analysis tractable.
    trackEvent("upgrade_dialog_shown", {
      user_id: session?.user?.id ?? "",
      source: input.source ?? "unknown",
      reason: input.quota.reason,
      pages_needed: input.quota.pages_needed,
      pages_remaining: input.quota.pages_remaining,
      current_tier: input.quota.current_tier,
      recommended_tier: input.quota.recommended_plan?.tier ?? null,
    })
  }, [session?.user?.id])

  const closeUpgradeDialog = useCallback(() => {
    setOpen(false)
  }, [])

  const handleUpgrade = useCallback(async () => {
    if (!quota?.recommended_plan) return
    const tier: PlanTier = quota.recommended_plan.tier
    setCheckoutLoading(true)
    setCheckoutError(null)
    trackEvent("upgrade_dialog_cta_clicked", {
      user_id: session?.user?.id ?? "",
      source: source ?? "unknown",
      tier,
      billing,
      pages_needed: quota.pages_needed,
    })
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier, billing }),
      })
      const data = await res.json()
      if (!res.ok || !data.url) {
        throw new Error(data.error ?? "Could not start checkout. Please try again.")
      }
      // Full navigation — Stripe-hosted checkout page lives on a different
      // origin and completes the flow via the success_url webhook round-trip.
      window.location.href = data.url
    } catch (err) {
      setCheckoutError(err instanceof Error ? err.message : "Could not start checkout.")
      setCheckoutLoading(false)
    }
  }, [quota, billing, source, session?.user?.id])

  return (
    <UpgradeDialogContext.Provider
      value={useMemo(
        () => ({ openUpgradeDialog, closeUpgradeDialog }),
        [openUpgradeDialog, closeUpgradeDialog]
      )}
    >
      {children}
      <Dialog
        open={open}
        onOpenChange={(next) => {
          setOpen(next)
          if (!next) {
            setCheckoutError(null)
            trackEvent("upgrade_dialog_dismissed", {
              user_id: session?.user?.id ?? "",
              source: source ?? "unknown",
              tier: quota?.recommended_plan?.tier ?? null,
            })
          }
        }}
      >
        <DialogContent className="sm:max-w-[440px] p-0 gap-0 overflow-hidden">
          {quota && (
            <UpgradeDialogBody
              quota={quota}
              fileName={fileName}
              billing={billing}
              onBillingChange={setBilling}
              checkoutLoading={checkoutLoading}
              checkoutError={checkoutError}
              onUpgrade={handleUpgrade}
              onDismiss={() => setOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </UpgradeDialogContext.Provider>
  )
}

export function useUpgradeDialog() {
  const ctx = useContext(UpgradeDialogContext)
  if (!ctx) {
    throw new Error("useUpgradeDialog must be used within an UpgradeDialogProvider")
  }
  return ctx
}

// ── Dialog body ────────────────────────────────────────────────────────

interface BodyProps {
  quota: QuotaErrorBody
  fileName?: string
  billing: Billing
  onBillingChange: (next: Billing) => void
  checkoutLoading: boolean
  checkoutError: string | null
  onUpgrade: () => void
  onDismiss: () => void
}

function UpgradeDialogBody({
  quota,
  fileName,
  billing,
  onBillingChange,
  checkoutLoading,
  checkoutError,
  onUpgrade,
  onDismiss,
}: BodyProps) {
  const plan = quota.recommended_plan

  // Headline formula — specific number + target plan name. Research
  // shows this pattern (Airtable / Cursor / GitHub Copilot) outperforms
  // generic "upgrade for more" copy by 15-25% on modal engagement.
  const headline = plan
    ? `Your ${quota.pages_needed}-page ${shortFileType(fileName)} needs ${plan.name}.`
    : `Your ${quota.pages_needed}-page file is larger than our Business plan.`

  const subline = plan
    ? `${plan.name} gives you ${plan.pages.toLocaleString()} pages a month — plenty of room to keep extracting.`
    : "Let's talk — we'll get you set up on a custom plan that fits."

  const price = plan
    ? billing === "annual"
      ? plan.annual_price_per_month
      : plan.monthly_price
    : 0

  return (
    <div>
      {/* Header */}
      <div className="px-6 pt-7 pb-5 bg-gradient-to-b from-primary/5 to-transparent text-center">
        <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-primary/10">
          <FileText className="h-5 w-5 text-primary" />
        </div>
        <h2 className="text-lg font-semibold tracking-tight leading-snug">
          {headline}
        </h2>
        <p className="mt-1.5 text-sm text-muted-foreground">{subline}</p>
      </div>

      {/* Body */}
      <div className="px-6 pb-6 space-y-4">
        {plan ? (
          <>
            {/* Billing toggle. Monthly/annual is the single paywall test
                with the most public evidence behind it (RevenueCat &
                Superwall benchmarks). Keep it compact, not a form. */}
            <div className="flex items-center justify-center gap-1 rounded-full border bg-muted/40 p-1 text-xs">
              <button
                type="button"
                onClick={() => onBillingChange("monthly")}
                className={cn(
                  "rounded-full px-3 py-1.5 font-medium transition",
                  billing === "monthly"
                    ? "bg-background shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Monthly
              </button>
              <button
                type="button"
                onClick={() => onBillingChange("annual")}
                className={cn(
                  "rounded-full px-3 py-1.5 font-medium transition flex items-center gap-1.5",
                  billing === "annual"
                    ? "bg-background shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Annual
                <span className="text-[10px] font-semibold text-emerald-600">
                  save 20%
                </span>
              </button>
            </div>

            {/* Benefits list. Capped at 3 features by buildQuotaErrorBody
                to keep the modal scannable. */}
            <ul className="space-y-2">
              {plan.features.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm">
                  <Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>

            {/* Primary CTA — plan name + price on button. Research
                shows price-on-button outperforms generic "Upgrade" by
                9–15% in B2B SaaS (Appcues 2023 benchmarks). */}
            <Button
              className="w-full h-11 font-medium"
              disabled={checkoutLoading}
              onClick={onUpgrade}
            >
              {checkoutLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Starting checkout…
                </>
              ) : (
                <>
                  Upgrade to {plan.name} — ${price}/mo
                </>
              )}
            </Button>

            {checkoutError && (
              <p className="flex items-start gap-1.5 text-xs text-destructive">
                <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                {checkoutError}
              </p>
            )}

            <div className="text-center">
              <button
                type="button"
                onClick={onDismiss}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Not now, I&apos;ll use a smaller file
              </button>
            </div>

            <p className="text-[11px] text-center text-muted-foreground pt-2 border-t">
              Cancel anytime. {quota.pages_remaining > 0 ? `You still have ${quota.pages_remaining} free ${quota.pages_remaining === 1 ? "page" : "pages"} this month.` : "Your quota resets on the next billing cycle."}
            </p>
          </>
        ) : (
          <>
            {/* File exceeds largest plan — route to "contact us" via
                the marketing pricing page. */}
            <Button
              className="w-full h-11"
              onClick={() => {
                window.location.href = "/pricing#contact"
              }}
            >
              Talk to us about a custom plan
            </Button>
            <div className="text-center">
              <button
                type="button"
                onClick={onDismiss}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Not now
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

/**
 * Turn a filename into a short noun for the headline. Keeps the copy
 * specific ("your 400-page statement needs Growth") without leaking
 * awkward raw filenames into the UI.
 */
function shortFileType(fileName?: string): string {
  if (!fileName) return "file"
  const lower = fileName.toLowerCase()
  if (lower.endsWith(".pdf")) return "document"
  if (lower.endsWith(".png") || lower.endsWith(".jpg") || lower.endsWith(".jpeg") || lower.endsWith(".webp")) return "image"
  if (lower.endsWith(".xlsx") || lower.endsWith(".xls") || lower.endsWith(".csv")) return "spreadsheet"
  if (lower.endsWith(".docx") || lower.endsWith(".doc")) return "document"
  return "file"
}
