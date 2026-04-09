import { SupabaseProvider } from "@/components/providers/SupabaseProvider"
import { AuthDialogProvider } from "@/components/auth/AuthDialogContext"

/**
 * Handwriting tool needs Supabase + the auth dialog so the bridge chat can:
 *   1. signInAnonymously() before provisioning a parser/document
 *   2. openAuthDialog({ next: '/parsers/.../documents/...?tab=chat' }) when the
 *      user types a follow-up question and we hand them off to the app.
 *
 * We pass `initialSession={null}` deliberately — fetching cookies() server-side
 * would mark the page dynamic and tank its SEO performance. The browser client
 * picks up the existing session (anonymous or otherwise) on mount.
 */
export default function HandwritingToolLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SupabaseProvider initialSession={null}>
      <AuthDialogProvider>{children}</AuthDialogProvider>
    </SupabaseProvider>
  )
}
