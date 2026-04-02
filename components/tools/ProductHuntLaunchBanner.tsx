"use client"

import { useState, useEffect } from "react"
import { trackEvent } from "@/lib/analytics"
import { Rocket, Check, Loader2 } from "lucide-react"

const LS_KEY_DISMISSED = "ph_launch_banner_dismissed"
const LS_KEY_SUBMITTED = "ph_launch_email_submitted"

export function ProductHuntLaunchBanner() {
  const [email, setEmail] = useState("")
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle")
  const [errorMsg, setErrorMsg] = useState("")
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const dismissed = localStorage.getItem(LS_KEY_DISMISSED)
    const submitted = localStorage.getItem(LS_KEY_SUBMITTED)
    if (!dismissed && !submitted) {
      setVisible(true)
      trackEvent("ph_banner_shown", { location: "handwriting_tool" })
    } else if (submitted) {
      // Show the "already subscribed" state
      setVisible(true)
      setStatus("success")
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return

    setStatus("submitting")
    setErrorMsg("")

    try {
      const res = await fetch("/api/waitlist/product-hunt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || "Something went wrong")
      }

      trackEvent("ph_banner_email_submitted", {
        location: "handwriting_tool",
      })
      localStorage.setItem(LS_KEY_SUBMITTED, "true")
      setStatus("success")
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Something went wrong")
      setStatus("error")
    }
  }

  if (!visible) return null

  return (
    <div className="mt-6 rounded-2xl border-2 border-[#FF6154]/20 bg-gradient-to-br from-[#FF6154]/5 via-white to-[#FF6154]/5 p-5 sm:p-6 relative overflow-hidden">
      {/* Decorative corner accent */}
      <div className="absolute -top-8 -right-8 w-24 h-24 bg-[#FF6154]/5 rounded-full blur-2xl" />

      <div className="relative flex flex-col items-center text-center gap-4">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 rounded-full bg-[#FF6154]/10 px-3.5 py-1.5">
          <Rocket className="h-4 w-4 text-[#FF6154]" />
          <span className="text-xs font-bold uppercase tracking-wider text-[#FF6154]">
            Coming to Product Hunt
          </span>
        </div>

        {/* Copy */}
        <div>
          <h3 className="text-lg font-bold text-foreground mb-1">
            Parsli is launching soon
          </h3>
          <p className="text-sm text-muted-foreground max-w-md">
            Get notified on launch day and receive{" "}
            <span className="font-semibold text-[#FF6154]">3 months free</span>{" "}
            of Parsli Pro.
          </p>
        </div>

        {/* Form or success */}
        {status === "success" ? (
          <div className="flex items-center gap-2 rounded-xl bg-green-50 border border-green-200 px-4 py-2.5">
            <Check className="h-4 w-4 text-green-600" />
            <span className="text-sm font-medium text-green-700">
              You&apos;re on the list! We&apos;ll email you on launch day.
            </span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="w-full max-w-sm">
            <div className="flex gap-2">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  if (status === "error") setStatus("idle")
                }}
                placeholder="your@email.com"
                className="flex-1 h-10 rounded-lg border border-border bg-white px-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#FF6154]/30 focus:border-[#FF6154]/50"
              />
              <button
                type="submit"
                disabled={status === "submitting"}
                className="h-10 px-4 rounded-lg bg-[#FF6154] text-white text-sm font-semibold hover:bg-[#E5564A] transition-colors disabled:opacity-60 flex items-center gap-1.5 whitespace-nowrap"
              >
                {status === "submitting" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Rocket className="h-3.5 w-3.5" />
                    Notify Me
                  </>
                )}
              </button>
            </div>
            {status === "error" && (
              <p className="text-xs text-destructive mt-1.5">{errorMsg}</p>
            )}
          </form>
        )}
      </div>
    </div>
  )
}
