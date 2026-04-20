import { MarketingNavbar } from "@/components/marketing/MarketingNavbar"
import { MarketingFooter } from "@/components/marketing/MarketingFooter"
import { MarketingPageTracker } from "@/components/marketing/MarketingPageTracker"
import { AnnouncementBar } from "@/components/marketing/AnnouncementBar"

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <MarketingPageTracker />
      <AnnouncementBar />
      <MarketingNavbar />
      <main className="min-h-screen">{children}</main>
      <MarketingFooter />
    </>
  )
}
