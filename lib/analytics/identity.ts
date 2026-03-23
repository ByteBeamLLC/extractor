/**
 * Anonymous identity system for tracking users across sessions before signup.
 *
 * Stores a persistent anonymous ID + session metadata in a first-party cookie
 * and localStorage (dual storage for resilience against cookie expiry / ITP).
 *
 * On signup, Mixpanel's identify() merges all anonymous history to the
 * authenticated profile automatically.
 */

const COOKIE_NAME = "_parsli_id"
const LS_KEY = "parsli_identity"
const COOKIE_MAX_AGE = 365 * 24 * 60 * 60 // 1 year
const SESSION_TIMEOUT_MS = 30 * 60 * 1000 // 30 minutes

export interface ParsliIdentity {
  anon_id: string
  first_seen: string
  first_referrer: string
  first_landing: string
  traffic_source: string
  session_count: number
  last_seen: string
  tool_uses: number
}

// ─── Cookie helpers (reuse pattern from attribution.ts) ───

function getCookieDomain(): string {
  if (typeof window === "undefined") return ""
  const hostname = window.location.hostname
  if (hostname.endsWith("parsli.co")) return ".parsli.co"
  return ""
}

function setCookie(name: string, value: string, maxAge: number) {
  const domain = getCookieDomain()
  const domainStr = domain ? `; domain=${domain}` : ""
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAge}; SameSite=Lax${domainStr}`
}

function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`))
  return match ? decodeURIComponent(match[1]) : null
}

// ─── Traffic source classification ───

const AI_CHATBOT_DOMAINS =
  /chatgpt\.com|openai\.com|perplexity\.ai|claude\.ai|anthropic\.com|copilot\.microsoft\.com|gemini\.google\.com|grok\.x\.com|you\.com|phind\.com|mistral\.ai|pi\.ai|poe\.com/i

const SOCIAL_DOMAINS =
  /twitter\.com|x\.com|linkedin\.com|facebook\.com|reddit\.com|tiktok\.com|instagram\.com|youtube\.com|threads\.net/i

const SEARCH_DOMAINS =
  /google\.|bing\.com|duckduckgo\.com|yahoo\.com|baidu\.com|yandex\./i

export function classifyTrafficSource(referrer: string, searchParams: URLSearchParams): string {
  const gclid = searchParams.get("gclid")
  const utmSource = searchParams.get("utm_source")
  const utmMedium = searchParams.get("utm_medium")

  // Paid search (Google Ads)
  if (gclid) return "google_ads"
  if (utmSource === "google" && utmMedium === "cpc") return "google_ads"

  // Paid social / other paid
  if (utmMedium === "cpc" || utmMedium === "paid" || utmMedium === "ppc") return "paid_other"

  // UTM-tagged campaigns
  if (utmSource && utmMedium === "email") return "email"
  if (utmSource && utmMedium === "social") return "social"

  // Referrer-based classification
  if (referrer) {
    try {
      const refHost = new URL(referrer).hostname
      if (AI_CHATBOT_DOMAINS.test(refHost)) return "ai_chatbot"
      if (SOCIAL_DOMAINS.test(refHost)) return "social"
      if (SEARCH_DOMAINS.test(refHost)) return "google_organic"
      // Known referral — not search/social/AI
      return "referral"
    } catch {
      // Malformed referrer — treat as direct
    }
  }

  // UTM source present but no referrer
  if (utmSource) return "campaign"

  return "direct"
}

// ─── UUID generator ───

function generateId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  // Fallback for older browsers
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === "x" ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

// ─── Read / write identity ───

function readIdentity(): ParsliIdentity | null {
  // Cookie first
  try {
    const cookieVal = getCookie(COOKIE_NAME)
    if (cookieVal) return JSON.parse(cookieVal)
  } catch {}

  // localStorage fallback
  try {
    const lsVal = localStorage.getItem(LS_KEY)
    if (lsVal) return JSON.parse(lsVal)
  } catch {}

  return null
}

function writeIdentity(identity: ParsliIdentity) {
  const json = JSON.stringify(identity)
  try {
    setCookie(COOKIE_NAME, json, COOKIE_MAX_AGE)
  } catch {}
  try {
    localStorage.setItem(LS_KEY, json)
  } catch {}
}

// ─── Public API ───

/**
 * Initializes or resumes the anonymous identity. Call on every page load.
 * Returns the identity and whether this is a new session.
 */
export function initIdentity(): { identity: ParsliIdentity; isNewSession: boolean } {
  if (typeof window === "undefined") {
    return { identity: createEmptyIdentity(), isNewSession: false }
  }

  const now = new Date().toISOString()
  const nowMs = Date.now()
  const referrer = document.referrer || ""
  const params = new URLSearchParams(window.location.search)
  const existing = readIdentity()

  if (existing) {
    // Returning user — check if this is a new session
    const lastSeenMs = new Date(existing.last_seen).getTime()
    const isNewSession = nowMs - lastSeenMs > SESSION_TIMEOUT_MS

    if (isNewSession) {
      existing.session_count += 1
    }
    existing.last_seen = now

    // Restore cookie from localStorage if cookie was cleared (ITP)
    writeIdentity(existing)

    return { identity: existing, isNewSession }
  }

  // Brand new user
  const trafficSource = classifyTrafficSource(referrer, params)
  const identity: ParsliIdentity = {
    anon_id: generateId(),
    first_seen: now,
    first_referrer: referrer,
    first_landing: window.location.pathname,
    traffic_source: trafficSource,
    session_count: 1,
    last_seen: now,
    tool_uses: 0,
  }

  writeIdentity(identity)
  return { identity, isNewSession: true }
}

/**
 * Get the current identity without modifying it.
 */
export function getIdentity(): ParsliIdentity | null {
  if (typeof window === "undefined") return null
  return readIdentity()
}

/**
 * Increment the tool usage counter. Call after each successful extraction.
 */
export function incrementToolUses(): number {
  const identity = readIdentity()
  if (!identity) return 0
  identity.tool_uses += 1
  identity.last_seen = new Date().toISOString()
  writeIdentity(identity)
  return identity.tool_uses
}

/**
 * Get the anonymous ID for use as Mixpanel $device_id.
 */
export function getAnonId(): string {
  const identity = readIdentity()
  return identity?.anon_id || "unknown"
}

function createEmptyIdentity(): ParsliIdentity {
  return {
    anon_id: "unknown",
    first_seen: "",
    first_referrer: "",
    first_landing: "",
    traffic_source: "direct",
    session_count: 0,
    last_seen: "",
    tool_uses: 0,
  }
}
