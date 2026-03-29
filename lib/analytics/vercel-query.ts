/**
 * Vercel Web Analytics API client (server-side only).
 * Queries page views, visitors, referrers, browsers, etc.
 *
 * Required env: VERCEL_API_TOKEN (from Vercel → Settings → Tokens)
 *
 * Docs: https://vercel.com/docs/analytics/api
 */

const BASE_URL = "https://vercel.com/api/web/insights"

function getHeaders(): Record<string, string> {
  const token = process.env.VERCEL_API_TOKEN
  if (!token) throw new Error("VERCEL_API_TOKEN is not set")
  return {
    Authorization: `Bearer ${token}`,
  }
}

type TimeseriesEntry = { key: string; total: number; devices: number }
type TopEntry = { key: string; total: number; devices: number }

export type VercelTimeseriesData = {
  data: TimeseriesEntry[]
}

export type VercelTopData = {
  data: TopEntry[]
}

async function fetchVercel(
  endpoint: string,
  params: Record<string, string>
): Promise<unknown | null> {
  const teamId = process.env.VERCEL_TEAM_ID
  const projectId = process.env.VERCEL_PROJECT_ID

  const searchParams = new URLSearchParams(params)
  if (teamId) searchParams.set("teamId", teamId)
  if (projectId) searchParams.set("projectId", projectId)
  // Filter to parsli.co domain
  searchParams.set("filter", JSON.stringify({ host: "parsli.co" }))

  const url = `${BASE_URL}/${endpoint}?${searchParams}`
  const res = await fetch(url, {
    headers: getHeaders(),
    next: { revalidate: 300 },
  })

  if (!res.ok) {
    const text = await res.text()
    console.error(`Vercel ${endpoint} error:`, res.status, text)
    return null
  }

  return res.json()
}

/* ── Timeseries: page views + visitors over time ── */

export async function getTimeseries(params: {
  from: string
  to: string
  granularity?: "day" | "hour" | "month"
}): Promise<VercelTimeseriesData | null> {
  return fetchVercel("timeseries", {
    from: params.from,
    to: params.to,
    ...(params.granularity && { granularity: params.granularity }),
  }) as Promise<VercelTimeseriesData | null>
}

/* ── Top pages, referrers, countries, browsers, OS, devices ── */

export async function getTop(params: {
  from: string
  to: string
  type: "path" | "referrer" | "country" | "browser" | "os" | "device"
  limit?: number
}): Promise<VercelTopData | null> {
  return fetchVercel("stats", {
    from: params.from,
    to: params.to,
    type: params.type,
    ...(params.limit && { limit: params.limit.toString() }),
  }) as Promise<VercelTopData | null>
}
