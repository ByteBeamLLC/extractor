"use client"

import { useEffect } from "react"
import { initAnalytics } from "@/lib/analytics"
import { captureAttribution } from "@/lib/analytics/attribution"

export function AnalyticsProvider() {
  useEffect(() => {
    initAnalytics()
    captureAttribution()
  }, [])

  return null
}
