import { NextResponse } from "next/server"
import { queryInsights, queryFunnel, type DateRange } from "@/lib/analytics/mixpanel-query"
import { getTimeseries, getTop } from "@/lib/analytics/vercel-query"
import { createClient } from "@supabase/supabase-js"

// Protect with service role — only authenticated admins
function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function GET(req: Request) {
  // Verify auth via cookie
  const { searchParams } = new URL(req.url)
  const days = parseInt(searchParams.get("days") || "30", 10)

  const to = new Date().toISOString().split("T")[0]
  const from = new Date(Date.now() - days * 86400000).toISOString().split("T")[0]
  const dateRange: DateRange = { from, to }

  // Run all queries in parallel
  const [
    sessionsOverTime,
    trafficSources,
    topPages,
    toolViews,
    signupsOverTime,
    ctaClicks,
    conversionFunnel,
    hwtFunnel,
    lpPerformance,
    activationMetrics,
    vercelTimeseries,
    vercelTopPages,
    vercelReferrers,
    vercelCountries,
    vercelBrowsers,
    vercelDevices,
  ] = await Promise.all([
    // Mixpanel
    queryInsights({
      events: [{ name: "session_started", math: "unique" }],
      dateRange,
      unit: "day",
      chartType: "line",
    }),
    queryInsights({
      events: [{ name: "session_started", math: "unique" }],
      dateRange,
      chartType: "bar",
      breakdown: { propertyName: "traffic_source" },
    }),
    queryInsights({
      events: [{ name: "page_viewed", math: "total" }],
      dateRange,
      chartType: "bar",
      breakdown: { propertyName: "page_path" },
    }),
    queryInsights({
      events: [{ name: "tool_page_viewed", math: "unique" }],
      dateRange,
      chartType: "bar",
      breakdown: { propertyName: "tool_name" },
    }),
    queryInsights({
      events: [
        { name: "sign_up_started", math: "unique" },
        { name: "sign_up_completed", math: "unique" },
      ],
      dateRange,
      unit: "day",
      chartType: "line",
    }),
    queryInsights({
      events: [{ name: "cta_clicked", math: "total" }],
      dateRange,
      chartType: "bar",
      breakdown: { propertyName: "cta_location" },
    }),
    queryFunnel({
      steps: [
        "session_started",
        "tool_page_viewed",
        "sign_up_started",
        "sign_up_completed",
        "parser_created",
        "first_value",
      ],
      dateRange,
      conversionDays: days,
    }),
    queryFunnel({
      steps: ["hwt_upload", "hwt_extraction_start", "hwt_extraction_success", "hwt_copy"],
      dateRange,
      conversionDays: 1,
    }),
    queryInsights({
      events: [
        { name: "lp_viewed", math: "unique" },
        { name: "lp_cta_clicked", math: "unique" },
      ],
      dateRange,
      chartType: "bar",
      breakdown: { propertyName: "lp_page" },
    }),
    queryInsights({
      events: [
        { name: "demo_started", math: "unique" },
        { name: "demo_completed", math: "unique" },
        { name: "first_value", math: "unique" },
        { name: "parser_created", math: "total" },
      ],
      dateRange,
      chartType: "bar",
    }),
    // Vercel
    getTimeseries({ from, to, granularity: "day" }).catch(() => null),
    getTop({ from, to, type: "path", limit: 15 }).catch(() => null),
    getTop({ from, to, type: "referrer", limit: 10 }).catch(() => null),
    getTop({ from, to, type: "country", limit: 10 }).catch(() => null),
    getTop({ from, to, type: "browser", limit: 5 }).catch(() => null),
    getTop({ from, to, type: "device", limit: 5 }).catch(() => null),
  ])

  return NextResponse.json({
    dateRange: { from, to, days },
    mixpanel: {
      sessionsOverTime,
      trafficSources,
      topPages,
      toolViews,
      signupsOverTime,
      ctaClicks,
      conversionFunnel,
      hwtFunnel,
      lpPerformance,
      activationMetrics,
    },
    vercel: {
      timeseries: vercelTimeseries,
      topPages: vercelTopPages,
      referrers: vercelReferrers,
      countries: vercelCountries,
      browsers: vercelBrowsers,
      devices: vercelDevices,
    },
  })
}
