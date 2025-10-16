"use client"

import {
  useSession as useSupabaseSession,
  useSupabaseClient as useSupabaseClientUntyped,
} from "@supabase/auth-helpers-react"

import type { Database } from "./types"

export function useSupabaseClient() {
  return useSupabaseClientUntyped<Database>()
}

export const useSession = useSupabaseSession
