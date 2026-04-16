import type { Metadata } from "next"
import { cookies } from "next/headers"
import { SupabaseProvider } from "@/components/providers/SupabaseProvider"
import { AuthDialogProvider } from "@/components/auth/AuthDialogContext"
import { createSupabaseServerComponentClient } from "@/lib/supabase/server"
import { GlobalErrorBoundary } from "@/components/GlobalErrorBoundary"
import { AppSidebar } from "@/components/app-sidebar"
import { SubscriptionProvider } from "@/components/billing/SubscriptionContext"
import { ActiveParserProvider } from "@/components/extractor/parser-context"
import { TourProvider } from "@/components/tour/TourProvider"
import { AnalyticsIdentifier } from "@/components/providers/AnalyticsIdentifier"
import { SignupConversionTracker } from "@/components/providers/SignupConversionTracker"
// AnonymousAuthGuard removed from global layout — middleware now gates
// protected routes, and anonymous sessions are created explicitly where
// needed (e.g. BridgeChat.tsx calls signInAnonymously).
import { NotificationAttributionTracker } from "@/components/notifications/NotificationAttributionTracker"
import { TimezoneCapture } from "@/components/notifications/TimezoneCapture"
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { ArloWrapper } from "@/components/arlo/ArloWrapper"

/**
 * Opt the authenticated app out of Google Translate.
 *
 * Google Translate (and most browser translation extensions that follow the
 * same pattern) wraps every text node in `<font>` elements after the page
 * mounts. That mutates the DOM out from under React, and the next render
 * pass crashes with `NotFoundError: Failed to execute 'insertBefore' on
 * 'Node'` — a well-documented framework-level incompatibility
 * (facebook/react#11538, #24865).
 *
 * Scoping this to the `(app)` route group only: marketing pages stay
 * translatable for international SEO, but the data-extraction UI — where
 * auto-translation of field names / document data would actually corrupt
 * extracted output — stays untouched by the translator.
 *
 * This is the canonical Google-documented opt-out and carries no runtime
 * cost. If crashes persist after deploy, the follow-up is to add a safety-
 * net monkey-patch on `Node.prototype.removeChild/insertBefore` per
 * facebook/react#11538, which is a heavier intervention we'll reach for
 * only if needed.
 */
export const metadata: Metadata = {
  other: {
    google: "notranslate",
  },
}

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = createSupabaseServerComponentClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  const cookieStore = await cookies()
  const defaultOpen = cookieStore.get("sidebar_state")?.value !== "false"

  return (
    <GlobalErrorBoundary>
      <SupabaseProvider initialSession={session}>
        <AnalyticsIdentifier />
        <SignupConversionTracker />
        <NotificationAttributionTracker />
        <TimezoneCapture />
        <AuthDialogProvider>
          <SubscriptionProvider>
          <ActiveParserProvider>
            <TourProvider>
              <SidebarProvider defaultOpen={defaultOpen}>
                <AppSidebar />
                <SidebarInset>
                  <header className="flex h-12 shrink-0 items-center gap-2 border-b px-4">
                    <SidebarTrigger className="-ml-1" />
                  </header>
                  <div className="flex-1">{children}</div>
                </SidebarInset>
                {/* <ArloWrapper /> — disabled: Arlo needs more work before re-enabling */}
              </SidebarProvider>
            </TourProvider>
          </ActiveParserProvider>
          </SubscriptionProvider>
        </AuthDialogProvider>
      </SupabaseProvider>
    </GlobalErrorBoundary>
  )
}
