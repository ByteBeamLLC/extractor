import { NextRequest, NextResponse } from "next/server"

export const runtime = "nodejs"

// Simple in-memory rate limit: 5 submits / 15 min / IP
const limitWindowMs = 15 * 60 * 1000
const limitMax = 5
const rateMap = new Map<string, number[]>()

function getIp(req: NextRequest) {
  const xf = req.headers.get("x-forwarded-for") || ""
  const ip = xf.split(",")[0].trim() || (req as any).ip || "unknown"
  return ip
}

function rateLimited(ip: string) {
  const now = Date.now()
  const arr = rateMap.get(ip) || []
  const filtered = arr.filter((t) => now - t < limitWindowMs)
  filtered.push(now)
  rateMap.set(ip, filtered)
  return filtered.length > limitMax
}

function emailValid(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

// (No file handling in simplified flow)

export async function POST(req: NextRequest) {
  const ip = getIp(req)
  if (rateLimited(ip)) {
    return new NextResponse("Rate limit exceeded. Try again later.", { status: 429 })
  }

  try {
    const form = await req.formData()
    const honeypot = (form.get("company") as string) || ""
    if (honeypot.trim().length > 0) {
      // Honeypot hit: pretend OK
      return NextResponse.json({ ok: true })
    }

    const payloadStr = (form.get("payload") as string) || "{}"
    const payload = JSON.parse(payloadStr)

    const { email, message, exploreAutomation } = payload || {}
    if (!email || !emailValid(email)) return new NextResponse("Invalid email", { status: 400 })
    if (!message || String(message).trim().length < 10) return new NextResponse("Message too short", { status: 400 })

    // Forward to Google Apps Script Web App (Sheets)
    const sheetUrl = process.env.GOOGLE_SHEETS_WEBAPP_URL
    const sheetSecret = process.env.GOOGLE_SHEETS_SECRET

    if (!sheetUrl) {
      return new NextResponse("Sheets endpoint not configured", { status: 500 })
    }

    // Revert: send to the original sheet script schema
    const body = JSON.stringify({
      reason: payload.reason,
      email: payload.email,
      message: payload.message,
      exploreAutomation: !!payload.exploreAutomation,
      process: payload.process ?? "",
      monthlyVolume: payload.monthlyVolume ?? "",
      successMetric: payload.successMetric ?? "",
      pageUrl: payload.pageUrl ?? "",
      userAgent: payload.userAgent ?? "",
      ip,
      ts: Date.now(),
      secret: sheetSecret || undefined,
    })

    const resp = await fetch(sheetUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
    })
    if (!resp.ok) {
      const t = await resp.text().catch(() => "")
      return new NextResponse(t || "Sheets forwarding failed", { status: 502 })
    }

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    const msg = err?.message || "Bad Request"
    return new NextResponse(msg, { status: 400 })
  }
}
