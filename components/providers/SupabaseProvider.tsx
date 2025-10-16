"use client"

import { useState } from "react"
import type { Session } from "@supabase/supabase-js"
import { SessionContextProvider } from "@supabase/auth-helpers-react"

import { createSupabaseBrowserClient } from "@/lib/supabase/browser"

interface SupabaseProviderProps {
  initialSession: Session | null
  children: React.ReactNode
}

export function SupabaseProvider({ initialSession, children }: SupabaseProviderProps) {
  const [supabaseClient] = useState(() => createSupabaseBrowserClient())

  return (
    <SessionContextProvider supabaseClient={supabaseClient} initialSession={initialSession}>
      {children}
    </SessionContextProvider>
  )
}
