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

/**
 * Creates a Supabase client with the service role key.
 * Bypasses RLS — use ONLY for public/unauthenticated API endpoints
 * (inbound webhooks, public API with API key auth, feed endpoints).
 */
export function createSupabaseServiceRoleClient() {
  const { createClient: createSupabaseClient } = require("@supabase/supabase-js")
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required")
  }

  return createSupabaseClient(supabaseUrl, serviceRoleKey)
}
