import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// Routes that require authentication (served on app subdomain)
const protectedRoutes = ["/dashboard", "/settings", "/parsers", "/subscribe"]

// Marketing routes (served on main domain)
const marketingRoutes = [
  "/",
  "/docs",
  "/pricing",
  "/use-cases",
  "/integrations",
  "/compare",
  "/solutions",
  "/tools",
  "/blog",
  "/industries",
  "/document-types",
  "/legal",
  "/terms",
  "/privacy",
]

const APP_HOSTNAME = process.env.NEXT_PUBLIC_APP_URL
  ? new URL(process.env.NEXT_PUBLIC_APP_URL).hostname
  : null // e.g. "app.parsli.co"

const SITE_HOSTNAME = process.env.NEXT_PUBLIC_SITE_URL
  ? new URL(process.env.NEXT_PUBLIC_SITE_URL).hostname
  : null // e.g. "parsli.co"

function isAppSubdomain(host: string): boolean {
  if (APP_HOSTNAME && host.startsWith(APP_HOSTNAME)) return true
  // In development, treat localhost as both — rely on path-based routing
  return false
}

function isMarketingDomain(host: string): boolean {
  if (SITE_HOSTNAME && host.startsWith(SITE_HOSTNAME)) return true
  return false
}

export async function middleware(request: NextRequest) {
  const host = request.headers.get("host") || ""
  const pathname = request.nextUrl.pathname

  // ─── www → non-www redirect (fixes "alternate page with proper canonical" in GSC) ───
  if (host.startsWith("www.")) {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://parsli.co"
    const url = new URL(pathname + request.nextUrl.search, siteUrl)
    return NextResponse.redirect(url, 301)
  }

  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req: request, res })
  const {
    data: { session },
  } = await supabase.auth.getSession()

  const isApp = isAppSubdomain(host)
  const isMarketing = isMarketingDomain(host)
  const isProtected = protectedRoutes.some((route) => pathname.startsWith(route))
  const isMarketingRoute = marketingRoutes.some(
    (route) => pathname === route || (route !== "/" && pathname.startsWith(route))
  )

  // ─── app.parsli.co ───
  if (isApp) {
    // Root of app subdomain → redirect to dashboard
    if (pathname === "/") {
      return NextResponse.redirect(new URL("/dashboard", request.url))
    }

    // Block marketing routes on app subdomain → redirect to main site
    if (isMarketingRoute && pathname !== "/") {
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://parsli.co"
      return NextResponse.redirect(new URL(pathname, siteUrl))
    }

    // Let unauthenticated users through — AnonymousAuthGuard will create a session client-side
    return res
  }

  // ─── parsli.co (marketing) ───
  if (isMarketing) {
    // Block app routes on marketing domain → redirect to app subdomain
    if (isProtected) {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://app.parsli.co"
      const search = request.nextUrl.search
      return NextResponse.redirect(new URL(pathname + search, appUrl))
    }

    return res
  }

  // ─── Development / fallback (localhost) ───
  // Let unauthenticated users through — AnonymousAuthGuard will create a session client-side
  return res
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|parsli-icon.png|sitemap\\.xml|robots\\.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp|xml)$).*)",
  ],
}
