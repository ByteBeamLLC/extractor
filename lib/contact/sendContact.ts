export type ContactPayload = {
  reason: "question" | "issue" | "feedback" | "feature"
  email: string
  message: string
  exploreAutomation?: boolean
  process?: string
  monthlyVolume?: string
  successMetric?: string
  pageUrl?: string
  userAgent?: string
  source?: string
}

export async function sendContact(payload: ContactPayload, honeypot?: string) {
  const form = new FormData()
  form.append("payload", JSON.stringify(payload))
  // Honeypot: hidden field named `company`.
  form.append("company", honeypot ?? "")

  const res = await fetch("/api/contact", {
    method: "POST",
    body: form,
  })
  if (!res.ok) {
    const msg = await safeText(res)
    throw new Error(msg || "Contact failed")
  }
}

async function safeText(res: Response) {
  try {
    return await res.text()
  } catch {
    return ""
  }
}
