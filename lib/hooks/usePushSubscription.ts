"use client"

import { useCallback, useEffect, useState } from "react"

export interface PushSubscriptionState {
  /** True if the browser supports both `serviceWorker` and `PushManager`. */
  supported: boolean
  /** Current Notification permission, or "unsupported" if APIs are missing. */
  permission: NotificationPermission | "unsupported"
  /** True if there's a live PushSubscription registered with this browser. */
  subscribed: boolean
  /** True while a subscribe/unsubscribe operation is in flight. */
  busy: boolean
  /** Last error message from a failed enable/disable attempt. */
  error: string | null
}

export interface PushSubscriptionApi extends PushSubscriptionState {
  enable: () => Promise<void>
  disable: () => Promise<void>
}

const SW_PATH = "/push-sw.js"

/**
 * Manages the browser's Web Push subscription state for the current user.
 *
 * Handles permission prompting, service-worker registration,
 * `PushManager.subscribe`, and POSTing the resulting subscription to the
 * server. Also handles the inverse on disable.
 *
 * Read `supported` first — on iOS Safari (outside PWAs) and in-app browsers
 * the toggle should be hidden entirely rather than shown as broken.
 */
export function usePushSubscription(): PushSubscriptionApi {
  const [supported, setSupported] = useState(false)
  const [permission, setPermission] = useState<
    NotificationPermission | "unsupported"
  >("unsupported")
  const [subscribed, setSubscribed] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (typeof window === "undefined") return
    if (
      !("serviceWorker" in navigator) ||
      !("PushManager" in window) ||
      !("Notification" in window)
    ) {
      setSupported(false)
      return
    }
    setSupported(true)
    setPermission(Notification.permission)

    // Check current subscription state without registering anything
    navigator.serviceWorker
      .getRegistration(SW_PATH)
      .then((reg) => {
        if (!reg) {
          setSubscribed(false)
          return
        }
        return reg.pushManager.getSubscription().then((sub) => {
          setSubscribed(!!sub)
        })
      })
      .catch(() => {
        setSubscribed(false)
      })
  }, [])

  const enable = useCallback(async () => {
    if (!supported || busy) return
    setBusy(true)
    setError(null)
    try {
      let perm = Notification.permission
      if (perm === "default") {
        perm = await Notification.requestPermission()
      }
      setPermission(perm)
      if (perm !== "granted") {
        throw new Error(
          perm === "denied"
            ? "Notifications are blocked. Enable them in your browser settings to receive alerts."
            : "Notification permission was not granted"
        )
      }

      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
      if (!vapidKey) {
        throw new Error("VAPID public key is not configured on this deployment")
      }

      const reg = await navigator.serviceWorker.register(SW_PATH)
      await navigator.serviceWorker.ready

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      })

      const res = await fetch("/api/notifications/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscription: sub.toJSON() }),
      })

      if (!res.ok) {
        // Roll back the local subscription so the next enable attempt is clean
        await sub.unsubscribe().catch(() => undefined)
        throw new Error("Failed to register the subscription with the server")
      }

      setSubscribed(true)
    } catch (err: any) {
      setError(err?.message ?? "Failed to enable notifications")
      setSubscribed(false)
    } finally {
      setBusy(false)
    }
  }, [supported, busy])

  const disable = useCallback(async () => {
    if (!supported || busy) return
    setBusy(true)
    setError(null)
    try {
      const reg = await navigator.serviceWorker.getRegistration(SW_PATH)
      const sub = await reg?.pushManager.getSubscription()
      if (sub) {
        await sub.unsubscribe().catch(() => undefined)
        await fetch("/api/notifications/push/unsubscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        })
      } else {
        // No local sub — wipe whatever the server may have for this account
        await fetch("/api/notifications/push/unsubscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        })
      }
      setSubscribed(false)
    } catch (err: any) {
      setError(err?.message ?? "Failed to disable notifications")
    } finally {
      setBusy(false)
    }
  }, [supported, busy])

  return { supported, permission, subscribed, busy, error, enable, disable }
}

/**
 * Converts a base64url-encoded VAPID public key into a Uint8Array backed
 * by a real ArrayBuffer (not SharedArrayBuffer). PushManager.subscribe
 * needs `applicationServerKey: BufferSource`, and the strict TS lib types
 * reject `Uint8Array<ArrayBufferLike>` because it could be a SharedArrayBuffer.
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/")
  const raw = atob(base64)
  const buffer = new ArrayBuffer(raw.length)
  const output = new Uint8Array(buffer)
  for (let i = 0; i < raw.length; i++) {
    output[i] = raw.charCodeAt(i)
  }
  return output
}
