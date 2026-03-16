const COOKIE_NAME = "_parsli_attr"
const LS_KEY = "parsli_attribution"
const COOKIE_MAX_AGE = 90 * 24 * 60 * 60 // 90 days in seconds

export interface AttributionData {
  gclid?: string
  utm_source?: string
  utm_medium?: string
  utm_campaign?: string
  utm_term?: string
  utm_content?: string
  landing_page?: string
  captured_at?: string
}

function getCookieDomain(): string {
  if (typeof window === "undefined") return ""
  const hostname = window.location.hostname
  // Use .parsli.co in production so cookie works across subdomains
  if (hostname.endsWith("parsli.co")) return ".parsli.co"
  return "" // localhost or other dev domains — omit domain to default to current host
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

function deleteCookie(name: string) {
  const domain = getCookieDomain()
  const domainStr = domain ? `; domain=${domain}` : ""
  document.cookie = `${name}=; path=/; max-age=0${domainStr}`
}

/**
 * Reads gclid + UTM params from the current URL and stores them
 * in a cookie and localStorage. Only writes if gclid or utm_source is present.
 */
export function captureAttribution() {
  if (typeof window === "undefined") return

  const params = new URLSearchParams(window.location.search)
  const gclid = params.get("gclid") || undefined
  const utm_source = params.get("utm_source") || undefined
  const utm_medium = params.get("utm_medium") || undefined
  const utm_campaign = params.get("utm_campaign") || undefined
  const utm_term = params.get("utm_term") || undefined
  const utm_content = params.get("utm_content") || undefined

  // Only store if we have something meaningful
  if (!gclid && !utm_source) return

  const data: AttributionData = {
    gclid,
    utm_source,
    utm_medium,
    utm_campaign,
    utm_term,
    utm_content,
    landing_page: window.location.pathname,
    captured_at: new Date().toISOString(),
  }

  const json = JSON.stringify(data)

  try {
    setCookie(COOKIE_NAME, json, COOKIE_MAX_AGE)
  } catch {}

  try {
    localStorage.setItem(LS_KEY, json)
  } catch {}
}

/**
 * Reads stored attribution data. Tries cookie first, falls back to localStorage.
 */
export function getAttribution(): AttributionData | null {
  if (typeof window === "undefined") return null

  try {
    const cookieVal = getCookie(COOKIE_NAME)
    if (cookieVal) return JSON.parse(cookieVal)
  } catch {}

  try {
    const lsVal = localStorage.getItem(LS_KEY)
    if (lsVal) return JSON.parse(lsVal)
  } catch {}

  return null
}

/**
 * Removes attribution data from both stores.
 */
export function clearAttribution() {
  if (typeof window === "undefined") return

  try {
    deleteCookie(COOKIE_NAME)
  } catch {}

  try {
    localStorage.removeItem(LS_KEY)
  } catch {}
}
