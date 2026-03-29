import { NextResponse } from "next/server"
import { queryInsights, queryFunnel, type DateRange } from "@/lib/analytics/mixpanel-query"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const days = parseInt(searchParams.get("days") || "30", 10)

  // Check if API secret is configured
  if (!process.env.MIXPANEL_API_SECRET) {
    return NextResponse.json(
      { error: "MIXPANEL_API_SECRET env var is not set. Add it in Vercel → Settings → Environment Variables." },
      { status: 500 }
    )
  }

  const to = new Date().toISOString().split("T")[0]
  const from = new Date(Date.now() - days * 86400000).toISOString().split("T")[0]
  const dateRange: DateRange = { from, to }

  // Run all Mixpanel queries in parallel
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
  ] = await Promise.all([
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
  ])

  return NextResponse.json({
    dateRange: { from, to, days },
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
  })
}
