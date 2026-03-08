import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// Routes that require authentication
const protectedRoutes = ["/dashboard", "/settings", "/parsers"]

// Routes that are always public
const publicRoutes = [
  "/",
  "/docs",
  "/pricing",
  "/use-cases",
  "/integrations",
  "/alternative",
  "/blog",
  "/legal",
  "/auth/callback",
  "/reset-password",
]

export async function middleware(request: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req: request, res })
  const {
    data: { session },
  } = await supabase.auth.getSession()

  const pathname = request.nextUrl.pathname

  // Check if route requires auth
  const isProtected = protectedRoutes.some((route) => pathname.startsWith(route))

  if (isProtected && !session) {
    const redirectUrl = new URL("/", request.url)
    redirectUrl.searchParams.set("authRequired", "true")
    redirectUrl.searchParams.set("next", pathname)
    return NextResponse.redirect(redirectUrl)
  }

  return res
}

export const config = {
  matcher: [
    // Match all routes except static files, API routes, and _next
    "/((?!api|_next/static|_next/image|favicon.ico|parsli-icon.png|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
