"use client"

import { useNotificationAttribution } from "@/lib/hooks/useNotificationAttribution"

/**
 * Mount this once inside the authenticated app layout. It listens for
 * `?nid=...&utm_source=...` on every navigation and records the
 * notification click + Mixpanel attribution event.
 *
 * Renders nothing.
 */
export function NotificationAttributionTracker() {
  useNotificationAttribution()
  return null
}
