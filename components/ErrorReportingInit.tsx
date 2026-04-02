"use client"

import { useEffect } from "react"
import { reportError } from "@/lib/errorReporting"

/**
 * Catches ALL client-side errors users experience:
 *
 * 1. window.onerror — JS runtime errors (event handlers, setTimeout, etc.)
 * 2. unhandledrejection — unhandled promise rejections
 * 3. fetch interceptor — any API route returning 500+ (server crashes)
 *
 * The fetch interceptor is the key piece: when a user action hits an API route
 * and the server crashes, this catches it even if the client code "handles" the
 * error (e.g., shows a toast). No need to modify individual API route files.
 *
 * Mount once in the root layout.
 */
export function ErrorReportingInit() {
  useEffect(() => {
    // ─── 1. JS runtime errors ───
    function handleError(event: ErrorEvent) {
      reportError(event.error ?? event.message, {
        route: window.location.pathname,
        extra: {
          source: event.filename,
          line: event.lineno,
          col: event.colno,
          type: "window.onerror",
        },
      })
    }

    // ─── 2. Unhandled promise rejections ───
    function handleRejection(event: PromiseRejectionEvent) {
      reportError(event.reason, {
        route: window.location.pathname,
        extra: { type: "unhandledrejection" },
      })
    }

    // ─── 3. Fetch interceptor — catch server 500s from user's perspective ───
    const originalFetch = window.fetch
    window.fetch = async (...args: Parameters<typeof fetch>) => {
      const response = await originalFetch(...args)

      if (response.status >= 500) {
        const url =
          typeof args[0] === "string"
            ? args[0]
            : args[0] instanceof URL
              ? args[0].toString()
              : args[0] instanceof Request
                ? args[0].url
                : "unknown"

        // Only report our own API errors, not third-party failures
        const isOwnApi =
          url.startsWith("/api/") ||
          url.includes("parsli.co/api/") ||
          url.includes("localhost")

        if (isOwnApi) {
          // Try to read the error message from the response body
          let serverMessage = `Server error ${response.status}`
          try {
            const cloned = response.clone()
            const body = await cloned.json()
            if (body.error) serverMessage = body.error
          } catch {}

          reportError(new Error(serverMessage), {
            route: url,
            method: args[1]?.method ?? "GET",
            extra: {
              type: "fetch_500",
              status: response.status,
              page: window.location.pathname,
            },
          })
        }
      }

      return response
    }

    window.addEventListener("error", handleError)
    window.addEventListener("unhandledrejection", handleRejection)

    return () => {
      window.removeEventListener("error", handleError)
      window.removeEventListener("unhandledrejection", handleRejection)
      window.fetch = originalFetch
    }
  }, [])

  return null
}
