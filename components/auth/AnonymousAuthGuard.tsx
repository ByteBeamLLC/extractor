"use client"

import { useEffect, useState } from "react"
import { Loader2 } from "lucide-react"
import { useSession, useSupabaseClient } from "@/lib/supabase/hooks"

export function AnonymousAuthGuard({ children }: { children: React.ReactNode }) {
  const session = useSession()
  const supabase = useSupabaseClient()
  const [isCreating, setIsCreating] = useState(false)

  useEffect(() => {
    if (session || isCreating) return

    let cancelled = false

    async function createAnonymousSession() {
      setIsCreating(true)
      try {
        const { error } = await supabase.auth.signInAnonymously()
        if (error && !cancelled) {
          console.error("[AnonymousAuthGuard] Failed:", error.message)
        }
      } catch (err) {
        if (!cancelled) console.error("[AnonymousAuthGuard] Unexpected error:", err)
      } finally {
        if (!cancelled) setIsCreating(false)
      }
    }

    createAnonymousSession()
    return () => { cancelled = true }
  }, [session, supabase, isCreating])

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return <>{children}</>
}
