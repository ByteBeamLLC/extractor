import type { AnalyticsEventMap, AnalyticsEvent } from "./events"

declare global {
  interface Window {
    dataLayer: Record<string, unknown>[]
  }
}

type MixpanelModule = typeof import("mixpanel-browser")

/**
 * Single module-level init promise. Resolves to the loaded module AFTER
 * `mp.default.init()` has been called, or resolves to `null` if:
 *   - we're on the server (no window),
 *   - NEXT_PUBLIC_MIXPANEL_TOKEN is missing,
 *   - dynamic import fails (e.g., offline, CSP),
 *   - init() itself throws.
 *
 * All public helpers await this promise before calling into mixpanel-browser.
 * This eliminates the race condition that caused #67/#68, where `identify()`
 * and `start_session_recording()` could run on an instance whose `config`
 * hadn't been populated yet (Mixpanel shares the config key names
 * `record_sessions_percent` and `before_identify` with PostHog because PostHog
 * forked its SDK from Mixpanel — so these errors surfaced as undefined
 * property reads deep inside the SDK).
 *
 * If init fails for any reason, every subsequent helper silently no-ops.
 * We intentionally do NOT call reportError from this module: this IS the
 * analytics path and importing the reporter risks circular module loads
 * in edge cases, and analytics failures should never create issues on
 * their own (they'd create a feedback loop since reporter failures can
 * also try to identify users).
 */
let initPromise: Promise<MixpanelModule | null> | null = null

function getInitPromise(): Promise<MixpanelModule | null> {
  if (initPromise) return initPromise

  if (typeof window === "undefined") {
    initPromise = Promise.resolve(null)
    return initPromise
  }

  const token = process.env.NEXT_PUBLIC_MIXPANEL_TOKEN
  if (!token) {
    initPromise = Promise.resolve(null)
    return initPromise
  }

  // Pin the Mixpanel identity cookie to the registrable domain so
  // distinct_id is shared across parsli.co ↔ app.parsli.co. Without this,
  // Mixpanel's default cross-subdomain logic picks `.co` (a TLD, which
  // browsers reject), falls back to host-only, and the funnel splits at
  // the subdomain boundary. In dev (localhost / preview URLs) we leave it
  // unset — Mixpanel's default host-scoped cookie is correct there.
  const hostname = window.location.hostname
  const cookieDomain = hostname.endsWith("parsli.co") ? ".parsli.co" : undefined

  initPromise = import("mixpanel-browser")
    .then((mp) => {
      try {
        mp.default.init(token, {
          track_pageview: true,
          persistence: "cookie",
          api_host: "/mp",
          cross_subdomain_cookie: true,
          ...(cookieDomain ? { cookie_domain: cookieDomain } : {}),
          // Session replay — records all sessions (marketing, tools, ads, and app).
          record_sessions_percent: 100,
          // Show text so replays are readable. Sensitive data (extraction
          // results, document previews) is protected by mp-mask/mp-block
          // classes on those components.
          record_mask_all_text: false,
          record_mask_all_inputs: true,
        })
        return mp
      } catch (err) {
        console.warn("[analytics] mixpanel init failed, disabling:", err)
        return null
      }
    })
    .catch((err) => {
      console.warn("[analytics] mixpanel module load failed, disabling:", err)
      return null
    })

  return initPromise
}

/**
 * Initializes the analytics subsystem. Idempotent and safe to call from
 * multiple effects. Returns a promise so callers may await it when strict
 * ordering is needed, but every public helper already awaits init internally
 * so calling `initAnalytics()` fire-and-forget is also correct.
 */
export function initAnalytics(): Promise<void> {
  return getInitPromise().then(() => undefined)
}

/**
 * Identifies the current user in Mixpanel and pushes user properties to the
 * GTM dataLayer. The dataLayer push happens immediately (GTM is independent
 * of Mixpanel); the Mixpanel identify waits on init.
 */
export function identifyUser(
  userId: string,
  traits: { email?: string; [key: string]: unknown }
) {
  if (typeof window === "undefined") return

  // GTM path — independent of Mixpanel, runs immediately.
  window.dataLayer = window.dataLayer || []
  window.dataLayer.push({
    event: "user_identified",
    user_id: userId,
    ...traits,
  })

  // Mixpanel path — wait for init, then identify.
  void getInitPromise().then((mp) => {
    if (!mp) return
    try {
      mp.default.identify(userId)
      mp.default.people.set({
        $email: traits.email,
        ...traits,
      })
    } catch (err) {
      console.warn("[analytics] identify failed:", err)
    }
  })
}

/**
 * Resets analytics identity on sign-out.
 */
export function resetAnalytics() {
  if (typeof window === "undefined") return
  void getInitPromise().then((mp) => {
    if (!mp) return
    try {
      mp.default.reset()
    } catch (err) {
      console.warn("[analytics] reset failed:", err)
    }
  })
}

/**
 * Starts Mixpanel session recording for the current user.
 * Called after identify() in the authenticated app layout.
 */
export function startSessionRecording() {
  if (typeof window === "undefined") return
  void getInitPromise().then((mp) => {
    if (!mp) return
    try {
      mp.default.start_session_recording()
    } catch (err) {
      console.warn("[analytics] start_session_recording failed:", err)
    }
  })
}

/**
 * Registers Mixpanel super properties that auto-attach to every future event.
 * Used for attribution data so keyword/campaign context persists across the
 * entire funnel.
 */
export function registerSuperProperties(props: Record<string, unknown>) {
  if (typeof window === "undefined") return
  void getInitPromise().then((mp) => {
    if (!mp) return
    try {
      mp.default.register(props)
    } catch (err) {
      console.warn("[analytics] register failed:", err)
    }
  })
}

/**
 * Tracks an event to both GTM dataLayer (for GA4 + Google Ads) and Mixpanel.
 * The dataLayer push happens immediately so GA4/Google Ads tracking continues
 * to work even if Mixpanel is unavailable.
 */
export function trackEvent<E extends AnalyticsEvent>(
  name: E,
  properties: AnalyticsEventMap[E]
) {
  if (typeof window === "undefined") return

  // GTM path — independent of Mixpanel, runs immediately.
  window.dataLayer = window.dataLayer || []
  window.dataLayer.push({
    event: name,
    ...properties,
  })

  // Mixpanel path — wait for init, then track.
  void getInitPromise().then((mp) => {
    if (!mp) return
    try {
      mp.default.track(name, properties)
    } catch (err) {
      console.warn("[analytics] track failed:", err)
    }
  })
}
