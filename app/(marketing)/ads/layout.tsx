import Image from "next/image"

/**
 * Dedicated layout for Google Ads landing pages.
 *
 * Strips MarketingNavbar and MarketingFooter to eliminate exit links.
 * Research shows removing navigation increases landing page conversions
 * by 100-336% (HubSpot, VWO, Career Point College studies).
 *
 * Only shows: non-clickable logo + minimal legal footer.
 */
export default function AdsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* Minimal header — logo only, no navigation links */}
      <header className="fixed top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex h-14 max-w-7xl items-center px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <Image
              src="/parsli-icon.png"
              alt="Parsli"
              width={28}
              height={28}
              className="rounded-md"
            />
            <span className="text-lg font-semibold tracking-tight">
              Parsli
            </span>
          </div>
        </div>
      </header>

      {/* Page content with top padding for fixed header */}
      <main className="min-h-screen pt-14">{children}</main>

      {/* Minimal footer — legal links only */}
      <footer className="border-t py-6">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex items-center justify-between text-xs text-muted-foreground">
          <span>&copy; {new Date().getFullYear()} Parsli</span>
          <div className="flex gap-4">
            <a href="/privacy" className="hover:text-foreground">
              Privacy
            </a>
            <a href="/terms" className="hover:text-foreground">
              Terms
            </a>
          </div>
        </div>
      </footer>
    </>
  )
}
