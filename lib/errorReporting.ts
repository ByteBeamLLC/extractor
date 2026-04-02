/**
 * Production error reporting — catches errors and reports them to /api/error-report
 * which creates GitHub Issues for automated investigation by Claude Code.
 *
 * Usage:
 *   import { reportError } from "@/lib/errorReporting"
 *   reportError(error, { route: "/api/parsers/extract", userId: "..." })
 */

const REPORT_ENDPOINT = "/api/error-report"

// In-memory dedup: don't report the same error signature more than once per 5 minutes
const recentErrors = new Map<string, number>()
const DEDUP_WINDOW_MS = 5 * 60 * 1000

interface ErrorContext {
  /** The route or component where the error occurred */
  route?: string
  /** Which user hit this (for reproduction context, not PII) */
  userId?: string
  /** HTTP method if applicable */
  method?: string
  /** Any extra context that helps investigation */
  extra?: Record<string, unknown>
}

function fingerprint(error: unknown, ctx: ErrorContext): string {
  const msg = error instanceof Error ? error.message : String(error)
  // Collapse dynamic segments (UUIDs, numbers) so similar errors dedup
  const normalized = msg.replace(/[0-9a-f]{8,}/gi, "ID").replace(/\d+/g, "N")
  return `${ctx.route ?? "unknown"}::${normalized}`
}

export async function reportError(
  error: unknown,
  ctx: ErrorContext = {}
): Promise<void> {
  try {
    const fp = fingerprint(error, ctx)
    const now = Date.now()

    // Dedup check
    const lastSeen = recentErrors.get(fp)
    if (lastSeen && now - lastSeen < DEDUP_WINDOW_MS) return
    recentErrors.set(fp, now)

    // Clean old entries periodically
    if (recentErrors.size > 200) {
      for (const [key, ts] of recentErrors) {
        if (now - ts > DEDUP_WINDOW_MS) recentErrors.delete(key)
      }
    }

    const payload = {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      route: ctx.route,
      userId: ctx.userId,
      method: ctx.method,
      extra: ctx.extra,
      timestamp: new Date().toISOString(),
      fingerprint: fp,
    }

    // Determine base URL for server-side calls
    const baseUrl =
      typeof window !== "undefined"
        ? ""
        : process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"

    await fetch(`${baseUrl}${REPORT_ENDPOINT}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }).catch(() => {
      // Swallow — error reporting should never crash the app
    })
  } catch {
    // Never throw from error reporting
  }
}

/**
 * Wraps an API route handler with automatic error reporting.
 * Usage:
 *   export const POST = withErrorReporting("/api/my-route", async (req) => { ... })
 */
export function withErrorReporting(
  route: string,
  handler: (request: Request, context: any) => Promise<Response>
) {
  return async (request: Request, context: any): Promise<Response> => {
    try {
      return await handler(request, context)
    } catch (error) {
      console.error(`[${route}] Unhandled error:`, error)
      await reportError(error, { route, method: request.method })
      return new Response(
        JSON.stringify({ error: "Internal server error" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      )
    }
  }
}
