import type { Metadata } from "next"
import { GeistMono } from "geist/font/mono"
import { Analytics } from "@vercel/analytics/next"
import "../globals.css"
import { SupabaseProvider } from "@/components/providers/SupabaseProvider"
import { AuthDialogProvider } from "@/components/auth/AuthDialogContext"
import { createSupabaseServerComponentClient } from "@/lib/supabase/server"
import { GlobalErrorBoundary } from "@/components/GlobalErrorBoundary"
import { ExtractorNav } from "@/components/extractor/ExtractorNav"

const inter = { variable: "" } as const

export const metadata: Metadata = {
  title: "Bytebeam Extractor",
  description:
    "Extract structured data from emails, PDFs, images, and documents. AI-powered parsing with integrations for Zapier, Make, Google Sheets, and more.",
  applicationName: "Bytebeam Extractor",
  icons: {
    icon: [{ url: "/bytebeam-logo-icon.png", type: "image/png" }],
    shortcut: "/bytebeam-logo-icon.png",
    apple: "/bytebeam-logo-icon.png",
  },
}

export default async function ExtractorLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = createSupabaseServerComponentClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  return (
    <html lang="en">
      <body className={`font-sans ${inter.variable} ${GeistMono.variable}`}>
        <GlobalErrorBoundary>
          <SupabaseProvider initialSession={session}>
            <AuthDialogProvider>
              <ExtractorNav />
              <main className="pt-14 min-h-screen bg-background">
                {children}
              </main>
              <Analytics />
            </AuthDialogProvider>
          </SupabaseProvider>
        </GlobalErrorBoundary>
      </body>
    </html>
  )
}
