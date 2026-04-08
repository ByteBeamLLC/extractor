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

/**
 * Normalize an arbitrary error value into a stable, human-readable string.
 *
 * Never throws. Never returns "[object Object]". Handles every shape we've seen
 * in production:
 *  - plain strings / numbers
 *  - Error instances
 *  - API error envelopes: { error }, { message }, { detail }, { msg }
 *  - Nested envelopes: { error: { message } }, { error: { code, message } }
 *  - Arrays of errors: { errors: [...] }
 *  - Supabase PostgrestError: { message, code, details, hint }
 *
 * Capped at 500 chars to keep issue titles/fingerprints stable.
 */
export function normalizeErrorMessage(value: unknown, fallback = "Unknown error"): string {
  if (value == null) return fallback
  if (typeof value === "string") return value.trim() || fallback
  if (typeof value === "number" || typeof value === "boolean") return String(value)

  if (value instanceof Error) {
    return value.message?.trim() || value.name || fallback
  }

  if (typeof value === "object") {
    const obj = value as Record<string, unknown>

    // Flat string fields — most common API envelope shapes
    const flatCandidate =
      pickString(obj.message) ||
      pickString(obj.error) ||
      pickString(obj.detail) ||
      pickString(obj.msg) ||
      pickString(obj.reason)
    if (flatCandidate) return truncate(flatCandidate)

    // Nested error object: { error: { message: "..." } }
    if (obj.error && typeof obj.error === "object") {
      const inner = obj.error as Record<string, unknown>
      const nested = pickString(inner.message) || pickString(inner.detail) || pickString(inner.code)
      if (nested) return truncate(nested)
    }

    // Array of errors: { errors: [{ message }, ...] }
    if (Array.isArray(obj.errors) && obj.errors.length > 0) {
      const first = obj.errors[0]
      if (typeof first === "string") return truncate(first)
      if (first && typeof first === "object") {
        const nested = pickString((first as Record<string, unknown>).message)
        if (nested) return truncate(nested)
      }
    }

    // Last resort: stringify. Some objects are circular or contain BigInt —
    // JSON.stringify throws on those, so we catch and fall through to the fallback.
    try {
      const json = JSON.stringify(obj)
      if (json && json !== "{}") return truncate(json)
    } catch {
      // circular or unserializable — fall through
    }
  }

  return fallback
}

function pickString(v: unknown): string | null {
  return typeof v === "string" && v.trim() ? v.trim() : null
}

function truncate(s: string): string {
  return s.length > 500 ? s.slice(0, 500) + "…" : s
}

/**
 * Extract a human-readable message from a JSON API error response body.
 * Thin wrapper over normalizeErrorMessage that returns a status-specific fallback.
 */
export function extractServerMessage(body: unknown, status: number): string {
  return normalizeErrorMessage(body, `Server error ${status}`)
}

/**
 * Known third-party / browser / platform noise that should NEVER reach the
 * issue tracker. Each entry documents the source; add new patterns with a
 * one-line explanation so future readers know why it's safe to drop.
 *
 * Only add errors here that:
 *   (1) are demonstrably not from our code, AND
 *   (2) have no actionable stack trace, AND
 *   (3) cannot be reproduced locally.
 */
const IGNORED_ERROR_PATTERNS: Array<{ pattern: RegExp; source: string }> = [
  // Outlook Safe Links / Defender for Office 365 link scanner. Outlook fetches
  // URLs with its own JS runtime to scan them; that runtime emits this exact
  // rejection which bubbles into the host page. Not from our code, no stack.
  { pattern: /Object Not Found Matching Id:\s*\d+/i, source: "outlook-safe-links" },
  // Chrome ResizeObserver polling artifact. Fires when a RO callback triggers
  // a layout pass that ends before the next frame. Benign and non-actionable.
  {
    pattern: /ResizeObserver loop (limit exceeded|completed with undelivered notifications)/i,
    source: "chrome-resize-observer",
  },
  // Opaque cross-origin script errors — no stack, no filename, no actionable info.
  // These come from third-party scripts (GTM tags, ad pixels) without CORS.
  { pattern: /^Script error\.?$/i, source: "cross-origin-script" },
  // Browser extension injected code — not our bundle.
  { pattern: /chrome-extension:|moz-extension:|safari-web-extension:/i, source: "browser-extension" },
  // Non-Error promise rejections from third-party SDKs that reject with
  // non-Error values. We can't fix third-party SDK behavior.
  { pattern: /Non-Error promise rejection captured/i, source: "non-error-rejection" },
  // Network aborts from user navigation away / tab close — not a bug.
  { pattern: /^(AbortError|The user aborted a request|cancelled)$/i, source: "user-aborted" },
]

/**
 * Returns a source tag if the error matches a known-noise pattern, or null
 * if it should be reported normally.
 *
 * Exported for test-by-example in code review; the primary caller is reportError.
 */
export function getIgnoredErrorSource(value: unknown): string | null {
  const message = normalizeErrorMessage(value, "")
  if (!message) return null
  for (const { pattern, source } of IGNORED_ERROR_PATTERNS) {
    if (pattern.test(message)) return source
  }
  return null
}

function fingerprint(error: unknown, ctx: ErrorContext): string {
  const msg = normalizeErrorMessage(error, "unknown")
  // Collapse dynamic segments (UUIDs, numbers) so similar errors dedup
  const normalized = msg.replace(/[0-9a-f]{8,}/gi, "ID").replace(/\d+/g, "N")
  return `${ctx.route ?? "unknown"}::${normalized}`
}

export async function reportError(
  error: unknown,
  ctx: ErrorContext = {}
): Promise<void> {
  try {
    // Drop known third-party / platform noise before it hits the tracker.
    // We do this BEFORE fingerprinting and dedup so filtered noise never
    // occupies a slot in the dedup map and never shows up in debug counts.
    const ignoredSource = getIgnoredErrorSource(error)
    if (ignoredSource) {
      if (typeof console !== "undefined") {
        // Single-line, debug-level so it doesn't spam prod consoles.
        console.debug(`[errorReporting] dropped noise: ${ignoredSource}`)
      }
      return
    }

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
      message: normalizeErrorMessage(error, "Unknown error"),
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
 * Typed error that serializes into a stable public envelope when thrown
 * inside a `withErrorReporting`-wrapped handler.
 *
 * Use this instead of `NextResponse.json({error}, {status})` when you want
 * the envelope shape + correlation id to match the one the wrapper
 * produces on unhandled throws. That way clients get one uniform error
 * contract across every route, and every failure is correlated by
 * `requestId` whether the throw was expected or a surprise.
 *
 *   throw new ApiError(402, "quota_exceeded", "Daily guest limit reached.")
 *
 * `status` defaults to 500 and `code` defaults to `"internal_error"` for
 * the case where a raw `throw new ApiError(...)` is used as a shorthand
 * fatal.
 */
export class ApiError extends Error {
  readonly status: number
  readonly code: string
  readonly extra?: Record<string, unknown>

  constructor(
    status: number,
    code: string,
    message: string,
    extra?: Record<string, unknown>,
  ) {
    super(message)
    this.name = "ApiError"
    this.status = status
    this.code = code
    this.extra = extra
  }
}

/**
 * Stable public envelope shape. Every `withErrorReporting`-wrapped route
 * returns this on failure — clients can rely on `error`, `code`, and
 * `requestId` being present.
 */
export interface ApiErrorEnvelope {
  error: string
  code: string
  requestId: string
  [k: string]: unknown
}

/**
 * Wraps an API route handler with automatic error reporting, correlation
 * ids, and a stable JSON envelope for failures.
 *
 * What this gives you for free:
 *   - Per-request `requestId` (UUID) in logs, reports, and the response
 *     envelope. Makes "user says it broke at 3:14pm" instantly triageable.
 *   - All unhandled throws are caught, reported with route/method/context,
 *     and returned as `{error, code: "internal_error", requestId}` at 500.
 *   - `ApiError` instances are mapped to their `status`/`code`/`message`
 *     and returned WITHOUT a reporter call — these are expected 4xx/5xx
 *     outcomes (quota, not-found, validation) and shouldn't pollute the
 *     issue tracker.
 *   - `X-Request-Id` header on every error response so proxies, logs,
 *     and browser devtools all show the same id.
 *
 * Usage:
 *
 *   export const POST = withErrorReporting(
 *     "/api/my-route",
 *     async (req, { params }) => {
 *       if (!someCheck) {
 *         throw new ApiError(400, "bad_input", "X is required")
 *       }
 *       const data = await doWork(req, params.id)
 *       return NextResponse.json({ data })
 *     }
 *   )
 *
 * For dynamic routes the second argument is `{ params }` as Next.js
 * passes it; the type parameter `TContext` preserves your route's param
 * typing through the wrapper.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type RouteHandlerContext = { params?: Record<string, any> }

export function withErrorReporting<
  TRequest extends Request = Request,
  TContext extends RouteHandlerContext = RouteHandlerContext,
>(
  route: string,
  handler: (request: TRequest, context: TContext) => Promise<Response>,
) {
  return async (request: TRequest, context: TContext): Promise<Response> => {
    const requestId =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`

    try {
      return await handler(request, context)
    } catch (error) {
      // ApiError: expected failure, NOT a reporter incident.
      if (error instanceof ApiError) {
        const envelope: ApiErrorEnvelope = {
          error: error.message,
          code: error.code,
          requestId,
          ...(error.extra ?? {}),
        }
        return new Response(JSON.stringify(envelope), {
          status: error.status,
          headers: {
            "Content-Type": "application/json",
            "X-Request-Id": requestId,
          },
        })
      }

      // Anything else: unhandled throw. Log, report, envelope, 500.
      console.error(`[${route}][${requestId}] Unhandled error:`, error)
      await reportError(error, {
        route,
        method: request.method,
        extra: {
          requestId,
          params: context?.params,
        },
      })

      const envelope: ApiErrorEnvelope = {
        error: "An unexpected error occurred. Please try again.",
        code: "internal_error",
        requestId,
      }
      return new Response(JSON.stringify(envelope), {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "X-Request-Id": requestId,
        },
      })
    }
  }
}
