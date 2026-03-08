import { MarketingNavbar } from "@/components/marketing/MarketingNavbar"
import { MarketingFooter } from "@/components/marketing/MarketingFooter"

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <MarketingNavbar />
      <main className="min-h-screen">{children}</main>
      <MarketingFooter />
    </>
  )
}
