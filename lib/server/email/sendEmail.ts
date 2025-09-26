import { ensureServerOnly } from "../ensureServerOnly"

ensureServerOnly("lib/server/email/sendEmail")

type Attachment = {
  filename: string
  content: string // base64
  contentType?: string
}

export async function sendSupportEmail(options: {
  to: string
  from?: string
  subject: string
  html: string
  text?: string
  attachments?: Attachment[]
}) {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    // No email provider configured; skip silently
    return { skipped: true }
  }

  const from = options.from || "no-reply@bytebeam.ai"
  const payload = {
    from,
    to: [options.to],
    subject: options.subject,
    html: options.html,
    text: options.text,
    attachments: options.attachments,
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  })

  if (!res.ok) {
    const msg = await safeText(res)
    throw new Error(msg || `Email send failed (${res.status})`)
  }

  return await res.json()
}

async function safeText(res: Response) {
  try {
    return await res.text()
  } catch {
    return ""
  }
}

export function escapeHtml(input: string) {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
}
