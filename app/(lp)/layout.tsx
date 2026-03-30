import Link from "next/link"
import Image from "next/image"
import { MarketingPageTracker } from "@/components/marketing/MarketingPageTracker"

export default function LandingPageLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <MarketingPageTracker />
      {/* Minimal header — logo only, no navigation */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-sm border-b">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 h-14 flex items-center">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/parsli-icon.png"
              alt="Parsli"
              width={28}
              height={28}
              className="rounded-md"
            />
            <span className="font-semibold text-lg">Parsli</span>
          </Link>
        </div>
      </header>
      <main className="min-h-screen">{children}</main>
    </>
  )
}
