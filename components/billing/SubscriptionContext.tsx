"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react"
import type { RealtimeChannel } from "@supabase/supabase-js"
import { useSession, useSupabaseClient } from "@/lib/supabase/hooks"
import type { ExtractorSubscription } from "@/lib/extractor/types"

/**
 * Single source of truth for the authenticated user's extractor_subscriptions
 * row. Fetches once on mount, then subscribes to Postgres Realtime for
 * instant UPDATE/INSERT propagation. Every consumer (sidebar, parser list,
 * settings, future surfaces) reads from this one hook.
 *
 * Why: prior to this provider, three components each ran their own one-shot
 * fetch on mount and never refreshed, so `credits_used`, `tier`, and
 * `notification_*` would drift from the DB until a hard reload. That caused
 * the "0/30 stuck counter" bug where the background worker deducted credits
 * correctly but the sidebar kept showing the initial snapshot.
 *
 * RLS is enforced by Realtime — each client only receives events for its
 * own row (auth.uid() = user_id).
 */

type SubscriptionContextValue = {
  subscription: ExtractorSubscription | null
  loading: boolean
  refetch: () => Promise<void>
}

const SubscriptionContext = createContext<SubscriptionContextValue | null>(null)

export function SubscriptionProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const session = useSession()
  const supabase = useSupabaseClient()
  const userId = session?.user?.id ?? null

  const [subscription, setSubscription] = useState<ExtractorSubscription | null>(
    null
  )
  const [loading, setLoading] = useState(true)
  const channelRef = useRef<RealtimeChannel | null>(null)

  const fetchSubscription = useCallback(async () => {
    if (!userId) {
      setSubscription(null)
      setLoading(false)
      return
    }
    const { data } = await supabase
      .from("extractor_subscriptions")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle()
    setSubscription((data as ExtractorSubscription | null) ?? null)
    setLoading(false)
  }, [userId, supabase])

  // Initial fetch whenever the authenticated user changes (including sign-in/out).
  useEffect(() => {
    setLoading(true)
    fetchSubscription()
  }, [fetchSubscription])

  // Realtime: subscribe to UPDATE + INSERT on this user's row.
  // The migration 20260407160000 enabled REPLICA IDENTITY FULL and added the
  // table to the supabase_realtime publication so these events are delivered.
  useEffect(() => {
    if (!userId) return

    const channel = supabase
      .channel(`extractor-subscription-${userId}`)
      .on(
        "postgres_changes" as any,
        {
          event: "UPDATE",
          schema: "public",
          table: "extractor_subscriptions",
          filter: `user_id=eq.${userId}`,
        },
        (payload: any) => {
          const next = payload.new as ExtractorSubscription
          // Merge to preserve any fields we had that aren't in the payload,
          // though REPLICA IDENTITY FULL means payload.new has everything.
          setSubscription((prev) => (prev ? { ...prev, ...next } : next))
        }
      )
      .on(
        "postgres_changes" as any,
        {
          event: "INSERT",
          schema: "public",
          table: "extractor_subscriptions",
          filter: `user_id=eq.${userId}`,
        },
        (payload: any) => {
          setSubscription(payload.new as ExtractorSubscription)
        }
      )
      .subscribe()

    channelRef.current = channel

    return () => {
      supabase.removeChannel(channel)
      channelRef.current = null
    }
  }, [userId, supabase])

  return (
    <SubscriptionContext.Provider
      value={{ subscription, loading, refetch: fetchSubscription }}
    >
      {children}
    </SubscriptionContext.Provider>
  )
}

/**
 * Read the live subscription for the current user. Throws if called outside
 * the provider — use `useSubscriptionOptional` in components that render in
 * both marketing and app contexts.
 */
export function useSubscription() {
  const ctx = useContext(SubscriptionContext)
  if (!ctx) {
    throw new Error("useSubscription must be used within <SubscriptionProvider>")
  }
  return ctx
}

/**
 * Non-throwing variant: returns `null` when no provider is mounted. Useful for
 * components shared between marketing (no provider) and app (provider wraps
 * the tree) routes.
 */
export function useSubscriptionOptional() {
  return useContext(SubscriptionContext)
}
