import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// Routes that require authentication (served on app subdomain)
const protectedRoutes = ["/dashboard", "/settings", "/parsers"]

// Marketing routes (served on main domain)
const marketingRoutes = [
  "/",
  "/docs",
  "/pricing",
  "/use-cases",
  "/integrations",
  "/alternative",
  "/solutions",
  "/tools",
  "/blog",
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
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req: request, res })
  const {
    data: { session },
  } = await supabase.auth.getSession()

  const pathname = request.nextUrl.pathname
  const host = request.headers.get("host") || ""

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

    // Protected route without session → show login page on app subdomain
    if (isProtected && !session) {
      const loginUrl = new URL("/login", request.url)
      // Preserve query params (e.g. ?template=invoice-parsing) in redirect
      const search = request.nextUrl.search
      loginUrl.searchParams.set("next", pathname + search)
      return NextResponse.redirect(loginUrl)
    }

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
  if (isProtected && !session) {
    const redirectUrl = new URL("/login", request.url)
    const search = request.nextUrl.search
    redirectUrl.searchParams.set("next", pathname + search)
    return NextResponse.redirect(redirectUrl)
  }

  return res
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|parsli-icon.png|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
