"use client"

// Lightweight analytics shim. Uses PostHog/Amplitude if present; no-ops otherwise.
// Call track(event, props) for client-side events.

type Props = Record<string, any>

export function track(event: string, props?: Props) {
  try {
    // PostHog
    const w = window as any
    if (w.posthog && typeof w.posthog.capture === "function") {
      w.posthog.capture(event, props)
      return
    }
    // Amplitude
    if (w.amplitude && typeof w.amplitude.track === "function") {
      w.amplitude.track(event, props)
      return
    }
  } catch {}
  // Fallback to console for debug
  try {
    if (process.env.NODE_ENV !== "production") {
      // eslint-disable-next-line no-console
      console.debug("analytics:", event, props || {})
    }
  } catch {}
}

