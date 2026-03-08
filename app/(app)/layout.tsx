import { cookies } from "next/headers"
import { SupabaseProvider } from "@/components/providers/SupabaseProvider"
import { AuthDialogProvider } from "@/components/auth/AuthDialogContext"
import { createSupabaseServerComponentClient } from "@/lib/supabase/server"
import { GlobalErrorBoundary } from "@/components/GlobalErrorBoundary"
import { AppSidebar } from "@/components/app-sidebar"
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar"

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
        <AuthDialogProvider>
          <SidebarProvider defaultOpen={defaultOpen}>
            <AppSidebar />
            <SidebarInset>
              <header className="flex h-12 shrink-0 items-center gap-2 border-b px-4">
                <SidebarTrigger className="-ml-1" />
              </header>
              <div className="flex-1">{children}</div>
            </SidebarInset>
          </SidebarProvider>
        </AuthDialogProvider>
      </SupabaseProvider>
    </GlobalErrorBoundary>
  )
}
