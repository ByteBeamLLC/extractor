import { Resend } from "resend"
import type { ReactElement } from "react"
import { reportError } from "@/lib/errorReporting"

let client: Resend | null = null

function getClient(): Resend | null {
  if (client) return client
  const key = process.env.RESEND_API_KEY
  if (!key) return null
  client = new Resend(key)
  return client
}

export interface SendEmailOptions {
  to: string | string[]
  subject: string
  /** React Email component instance — pass <MyTemplate {...props} />. */
  react: ReactElement
  /** Plain-text fallback. Strongly recommended for deliverability. */
  text?: string
  replyTo?: string
  /** Resend email tags — useful for filtering in the Resend dashboard. */
  tags?: { name: string; value: string }[]
}

export interface SendEmailResult {
  success: boolean
  id?: string
  error?: string
}

/**
 * Sends a transactional email via Resend.
 *
 * Returns `{success: false}` (rather than throwing) so callers can fail
 * gracefully — email failures must NEVER take down the calling code path
 * (extraction worker, cron, etc.).
 */
export async function sendEmail(opts: SendEmailOptions): Promise<SendEmailResult> {
  const resend = getClient()
  if (!resend) {
    console.warn("[email] RESEND_API_KEY not set — skipping send")
    return { success: false, error: "RESEND_API_KEY not configured" }
  }

  const from = process.env.EMAIL_FROM || "Parsli <noreply@parsli.co>"

  try {
    const { data, error } = await resend.emails.send({
      from,
      to: opts.to,
      subject: opts.subject,
      react: opts.react,
      text: opts.text,
      replyTo: opts.replyTo,
      tags: opts.tags,
    })

    if (error) {
      reportError(new Error(`Resend error: ${error.message}`), {
        route: "lib/email/send",
        extra: { subject: opts.subject, to: opts.to },
      })
      return { success: false, error: error.message }
    }

    return { success: true, id: data?.id }
  } catch (err) {
    reportError(err, {
      route: "lib/email/send",
      extra: { subject: opts.subject, to: opts.to },
    })
    return {
      success: false,
      error: err instanceof Error ? err.message : "Unknown error",
    }
  }
}
