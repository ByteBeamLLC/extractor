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

  if (!supabaseClient) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="max-w-md space-y-3 text-center">
          <h2 className="text-xl font-semibold">Configuration required</h2>
          <p className="text-sm text-muted-foreground">
            Supabase credentials are missing. Set <code className="font-mono">NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
            <code className="font-mono">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> in your Vercel environment, then redeploy.
          </p>
        </div>
      </div>
    )
  }

  return (
    <SessionContextProvider supabaseClient={supabaseClient} initialSession={initialSession}>
      {children}
    </SessionContextProvider>
  )
}
