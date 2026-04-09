import { APP_URL } from "@/lib/config"

/**
 * Build an absolute URL on the app origin (app.parsli.co in production).
 *
 * In production the marketing site (parsli.co) and the app (app.parsli.co)
 * run on different origins. Any cross-origin link — OAuth redirects, email
 * CTAs, bridge handoffs — must use an absolute URL on the app origin.
 *
 * In development both run on localhost:3000, so this just prepends the path.
 */
export function buildAppUrl(path: string): string {
  // Ensure single leading slash, no double-slash join
  const cleanPath = path.startsWith("/") ? path : `/${path}`
  return `${APP_URL}${cleanPath}`
}
