"use client"

import { useEffect } from "react"
import { reportError, extractServerMessage } from "@/lib/errorReporting"

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
    // ─── Chunk error detection & recovery ───
    function isChunkLoadError(error: unknown): boolean {
      const msg = error instanceof Error ? error.message : String(error ?? '')
      return (
        msg.includes('ChunkLoadError') ||
        msg.includes('Loading chunk') ||
        msg.includes('Loading CSS chunk') ||
        (msg.includes('Failed to fetch dynamically imported module') && msg.includes('/_next/'))
      )
    }

    function handleChunkLoadRecovery(): void {
      const STORAGE_KEY = 'parsli_chunk_reload'
      const MAX_RELOADS = 2
      const WINDOW_MS = 30_000

      try {
        const raw = sessionStorage.getItem(STORAGE_KEY)
        const state = raw ? JSON.parse(raw) : { count: 0, firstAt: 0 }
        const now = Date.now()

        if (now - state.firstAt > WINDOW_MS) {
          state.count = 0
          state.firstAt = now
        }

        state.count++
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state))

        if (state.count <= MAX_RELOADS) {
          window.location.reload()
          return
        }
        // Exceeded max reloads — fall through to error boundary
      } catch {
        // sessionStorage unavailable — reload once
        window.location.reload()
      }
    }

    // ─── 1. JS runtime errors ───
    function handleError(event: ErrorEvent) {
      if (isChunkLoadError(event.error ?? event.message)) {
        handleChunkLoadRecovery()
        return
      }
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
      if (isChunkLoadError(event.reason)) {
        handleChunkLoadRecovery()
        return
      }
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
          // Parse the response body once, derive the message through the
          // shared normalizer, and carry the raw envelope (truncated) as
          // extra.responseBody so we can diagnose upstream failures without
          // losing diagnostic information to "[object Object]" coercion.
          let serverMessage = `Server error ${response.status}`
          let responseBodyForContext: string | undefined
          try {
            const cloned = response.clone()
            const body = await cloned.json()
            serverMessage = extractServerMessage(body, response.status)
            try {
              const json = JSON.stringify(body)
              responseBodyForContext =
                json.length > 1000 ? json.slice(0, 1000) + "…" : json
            } catch {
              // circular / BigInt — keep the normalized message, drop the body
            }
          } catch {
            // Not JSON (e.g., Vercel HTML error page). Fall back to text.
            try {
              const cloned = response.clone()
              const text = await cloned.text()
              if (text) {
                responseBodyForContext =
                  text.length > 1000 ? text.slice(0, 1000) + "…" : text
              }
            } catch {}
          }

          reportError(new Error(serverMessage), {
            route: url,
            method: args[1]?.method ?? "GET",
            extra: {
              type: "fetch_500",
              status: response.status,
              page: window.location.pathname,
              responseBody: responseBodyForContext,
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
