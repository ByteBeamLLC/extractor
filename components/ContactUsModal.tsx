"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AutomationNudge } from "./AutomationNudge"
import { sendContact, type ContactPayload } from "@/lib/contact/sendContact"
import { track } from "@/lib/analytics"

type Reason = "question" | "issue" | "feedback" | "feature"

export function ContactUsModal({
  open,
  onClose,
  returnFocusRef,
  source = "topbar",
}: {
  open: boolean
  onClose: () => void
  returnFocusRef?: React.RefObject<HTMLElement>
  source?: string
}) {
  const [reason, setReason] = useState<Reason>("question")
  const [email, setEmail] = useState("")
  const [message, setMessage] = useState("")
  // reduced form: no file/upload/logs
  const [explore, setExplore] = useState(false)
  const [process, setProcess] = useState("")
  const [volume, setVolume] = useState("")
  const [successMetric, setSuccessMetric] = useState("")
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [company, setCompany] = useState("") // honeypot

  // initial focus handled via autoFocus on Reason select

  // Use build-inlined public env
  const { BOOKING_URL } = require("@/lib/publicEnv") as { BOOKING_URL: string }

  useEffect(() => {
    if (open) track("contact_opened", { source })
  }, [open, source])

  // Initial focus handled via autoFocus on Reason select

  const emailValid = useMemo(() => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email), [email])
  const messageValid = useMemo(() => message.trim().length >= 10, [message])
  const formValid = emailValid && messageValid && !loading

  const dirty = (
    !!email || !!message || explore || !!process || !!volume || !!successMetric
  )

  const handleRequestClose = useCallback(() => {
    if (dirty && !sent) {
      const ok = window.confirm("Discard your message?")
      if (!ok) return false
    }
    onClose()
    // restore focus
    if (returnFocusRef?.current) {
      try { returnFocusRef.current.focus() } catch {}
    }
    return true
  }, [dirty, sent, onClose, returnFocusRef])

  // Esc key safety close via dialog handles; ensure focus restoration on unmount
  useEffect(() => {
    if (!open) return
    return () => {
      if (returnFocusRef?.current) {
        try { returnFocusRef.current.focus() } catch {}
      }
    }
  }, [open, returnFocusRef])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!emailValid || !messageValid) return
    setLoading(true)
    try {
      const payload: ContactPayload = {
        reason,
        email,
        message,
        exploreAutomation: explore,
        process: explore ? process : undefined,
        monthlyVolume: explore ? (volume || "") : undefined,
        successMetric: explore ? successMetric : undefined,
        pageUrl: typeof window !== 'undefined' ? window.location.href : undefined,
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
        source,
      }
      await sendContact(payload, company)
      setSent(true)
      track("contact_submit", {
        reason,
        exploreAutomation: explore,
      })
    } catch (err: any) {
      const msg = err?.message || "Failed to send"
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog
      open={open}
      // Intercept outside/esc close: Radix passes onOpenChange(false), we gate it
      onOpenChange={(next) => {
        if (!next) {
          const ok = handleRequestClose()
          if (!ok) return
        }
      }}
    >
      <DialogContent
        className="sm:max-w-3xl p-0"
        showCloseButton={true}
        aria-labelledby="contact-title"
        aria-describedby="contact-description"
      >
        <div className="flex items-start justify-between gap-3 border-b p-5">
          <div>
            <DialogTitle id="contact-title" className="text-base md:text-lg">How can we help?</DialogTitle>
            <DialogDescription id="contact-description" className="text-xs md:text-sm">
              Send feedback, ask a question, or say hello. No sales pitch—promise.
            </DialogDescription>
            <div className="mt-3">
              <Button asChild size="sm">
                <a
                  href="https://www.linkedin.com/in/talalbazerbachi/"
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => track("founder_chat_clicked_from_header")}
                >
                  Chat with founder
                </a>
              </Button>
            </div>
          </div>
        </div>
        {!sent ? (
          <form onSubmit={handleSubmit} className="grid md:grid-cols-2 gap-6 p-5" aria-labelledby="contact-title">
            <input
              type="text"
              name="company"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              className="sr-only"
              tabIndex={-1}
              aria-hidden
              autoComplete="organization"
            />

            {/* LEFT: Support Form */}
            <div className="space-y-4">
              <div className="space-y-1">
                <Label>Reason</Label>
                <Select value={reason} onValueChange={(v) => setReason(v as Reason)}>
                  <SelectTrigger autoFocus>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="question">Ask a question</SelectItem>
                    <SelectItem value="issue">Report an issue</SelectItem>
                    <SelectItem value="feedback">Share feedback</SelectItem>
                    <SelectItem value="feature">Request a feature</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label htmlFor="contact-email">Email</Label>
                <Input
                  id="contact-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  aria-invalid={!emailValid}
                />
                {!emailValid && email.length > 0 && (
                  <p className="text-xs text-destructive">Enter a valid email</p>
                )}
              </div>

              <div className="space-y-1">
                <Label htmlFor="contact-message">Message</Label>
                <Textarea
                  id="contact-message"
                  required
                  rows={5}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="What’s on your mind? If you’re reporting an issue, tell us what happened and, if possible, paste the last job ID."
                  aria-invalid={!messageValid}
                />
                {!messageValid && message.length > 0 && (
                  <p className="text-xs text-destructive">Message should be at least 10 characters</p>
                )}
              </div>

              {/* No additional options in the simplified form */}

              <div className="flex items-center gap-3 pt-2">
                <Button type="submit" disabled={!formValid}>
                  {loading ? "Sending…" : "Send message"}
                </Button>
                <a
                  href={BOOKING_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm underline text-muted-foreground"
                  onClick={() => track("scheduler_clicked_from_contact")}
                >
                  Book a quick chat
                </a>
              </div>

              <p className="text-xs text-muted-foreground">
                We’ll only use your info to follow up. No spam. You can opt out anytime. By sending, you agree to our Terms & Privacy.
              </p>

              {error && (
                <div className="text-xs text-destructive">
                  {error} — If this keeps happening, email us: {" "}
                  <a className="underline" href={`mailto:support@bytebeam.ai?subject=${encodeURIComponent("ByteBeam Support")}`}>
                    support@bytebeam.ai
                  </a>
                </div>
              )}
            </div>

            {/* RIGHT: Discoverable nudge */}
            <AutomationNudge
              explore={explore}
              setExplore={setExplore}
              process={process}
              setProcess={setProcess}
              volume={volume}
              setVolume={setVolume}
              successMetric={successMetric}
              setSuccessMetric={setSuccessMetric}
              onPanelOpened={() => track("automation_panel_opened")}
            />
          </form>
        ) : (
          <div className="p-10 text-center">
            <h3 className="text-base md:text-lg font-semibold mb-2">Thanks—message sent!</h3>
            <p className="text-xs md:text-sm text-muted-foreground mb-6">
              We’ll reply shortly. If you want, you can also pick a time for a quick intro.
            </p>
            <div className="flex justify-center gap-3">
              <Button variant="outline" onClick={handleRequestClose}>Close</Button>
              <a href={BOOKING_URL} target="_blank" rel="noreferrer" className="inline-flex items-center rounded-md bg-foreground text-background px-4 py-2">
                Open scheduler
              </a>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
