/**
 * Mixpanel Query API client (server-side only).
 * Uses the Data Export API with project API secret for auth.
 *
 * Required env: MIXPANEL_API_SECRET (from Project Settings → API Secret)
 */

const BASE_URL = "https://mixpanel.com/api/query"

function getAuthHeaders(): Record<string, string> {
  const secret = process.env.MIXPANEL_API_SECRET
  if (!secret) throw new Error("MIXPANEL_API_SECRET is not set")
  return {
    Authorization: `Basic ${Buffer.from(`${secret}:`).toString("base64")}`,
    "Content-Type": "application/json",
    Accept: "application/json",
  }
}

export type DateRange = {
  from: string // ISO date
  to: string // ISO date
}

export type InsightsMetric = {
  event_name: string
  math: "total" | "unique"
}

/* ── Generic query runner ── */

async function queryMixpanel(endpoint: string, body: Record<string, unknown>) {
  const projectId = process.env.MIXPANEL_PROJECT_ID || "4002064"
  const res = await fetch(`${BASE_URL}/${endpoint}?project_id=${projectId}`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(body),
    next: { revalidate: 300 }, // cache 5 min
  })

  if (!res.ok) {
    const text = await res.text()
    console.error(`Mixpanel ${endpoint} error:`, res.status, text)
    return null
  }

  return res.json()
}

/* ── Insights: event counts / trends ── */

export async function queryInsights(params: {
  events: { name: string; math: "total" | "unique" }[]
  dateRange: DateRange
  unit?: "hour" | "day" | "week" | "month"
  chartType?: "line" | "bar" | "table"
  breakdown?: { propertyName: string; resource?: "event" | "user" }
}) {
  const metrics = params.events.map((e) => ({
    eventName: e.name,
    measurement: { type: "basic", math: e.math },
  }))

  const body: Record<string, unknown> = {
    metrics,
    dateRange: {
      type: "absolute",
      from: params.dateRange.from,
      to: params.dateRange.to,
    },
    chartType: params.chartType || "line",
  }

  if (params.unit) body.unit = params.unit
  if (params.breakdown) {
    body.breakdowns = [
      {
        metric: {
          type: "property",
          propertyName: params.breakdown.propertyName,
          resource: params.breakdown.resource || "event",
        },
      },
    ]
  }

  return queryMixpanel("insights", body)
}

/* ── Funnels ── */

export async function queryFunnel(params: {
  steps: string[]
  dateRange: DateRange
  conversionDays?: number
}) {
  const metrics = params.steps.map((eventName) => ({ eventName }))

  return queryMixpanel("funnels", {
    metrics,
    dateRange: {
      type: "absolute",
      from: params.dateRange.from,
      to: params.dateRange.to,
    },
    conversionTime: { unit: "day", value: params.conversionDays || 30 },
    chartType: "steps",
  })
}

/* ── Convenience: get multiple event totals for a date range ── */

export async function getEventCounts(
  events: string[],
  dateRange: DateRange
): Promise<Record<string, number>> {
  const result = await queryInsights({
    events: events.map((name) => ({ name, math: "total" })),
    dateRange,
    chartType: "bar",
  })

  if (!result?.results) return {}

  const counts: Record<string, number> = {}
  for (const [key, values] of Object.entries(result.results)) {
    const eventName = key.replace(/ - Total$/, "")
    counts[eventName] =
      typeof values === "number"
        ? values
        : Array.isArray(values)
          ? (values as number[]).reduce((a, b) => a + b, 0)
          : 0
  }
  return counts
}
