import { cookies } from "next/headers"
import { createRouteHandlerClient, createServerComponentClient } from "@supabase/auth-helpers-nextjs"

import type { Database } from "./types"

export function createSupabaseServerClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase environment variables are missing on the server")
  }

  return createRouteHandlerClient<Database>(
    { cookies },
    {
      supabaseUrl,
      supabaseKey: supabaseAnonKey,
    },
  )
}

export function createSupabaseServerComponentClient() {
  return createServerComponentClient<Database>({ cookies })
}

// Alias for API routes
export const createClient = createSupabaseServerClient
