/**
 * Standard HTTP headers for QuickBooks-adjacent routes.
 *
 * Per Intuit's security requirements:
 *   "Caching is disabled on all SSL pages and all pages that contain sensitive
 *    data by using value no-cache and no-store instead of private in the
 *    Cache-Control header."
 *   https://developer.intuit.com/app/developer/qbo/docs/go-live/publish-app/security-requirements
 *
 * We apply these headers to every response that touches QBO data or tokens:
 *   - OAuth callback (contains code + state in URL)
 *   - Reference data endpoint (returns vendor/customer/account lists)
 *   - Config endpoint (returns integration config)
 *   - Disconnect endpoint
 *
 * Next.js's default for dynamic routes is usually safe, but being explicit
 * defends against future caching proxies / CDN misconfiguration.
 */

export const QBO_NO_CACHE_HEADERS: Readonly<Record<string, string>> = Object.freeze({
  "Cache-Control": "no-cache, no-store, must-revalidate, private",
  Pragma: "no-cache",
  Expires: "0",
})
