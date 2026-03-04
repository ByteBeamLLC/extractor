import { NextResponse, type NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  const hostname = request.headers.get("host") ?? ""
  const { pathname } = request.nextUrl

  // Determine if we're on the extractor subdomain
  const isExtractorSubdomain =
    hostname.startsWith("extractor.") ||
    hostname.startsWith("extractor-") || // Vercel preview URLs
    process.env.NEXT_PUBLIC_FORCE_EXTRACTOR === "true" // Dev override

  if (isExtractorSubdomain) {
    // Don't rewrite API routes, _next, or static assets
    if (
      pathname.startsWith("/api/") ||
      pathname.startsWith("/_next/") ||
      pathname.startsWith("/static/") ||
      pathname.includes(".")
    ) {
      return NextResponse.next()
    }

    // Already under /extractor — pass through
    if (pathname.startsWith("/extractor")) {
      return NextResponse.next()
    }

    // Rewrite to /extractor/* route group
    const url = request.nextUrl.clone()
    url.pathname = `/extractor${pathname}`
    return NextResponse.rewrite(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
}
