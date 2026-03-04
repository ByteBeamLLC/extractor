"use client"

import { useCallback, useEffect, useState } from "react"
import { Loader2 } from "lucide-react"
import { useSession, useSupabaseClient } from "@/lib/supabase/hooks"
import { CreditUsageBar } from "@/components/extractor/dashboard/CreditUsageBar"
import type { ExtractorSubscription } from "@/lib/extractor/types"

export default function SettingsPage() {
  const session = useSession()
  const supabase = useSupabaseClient()
  const [subscription, setSubscription] = useState<ExtractorSubscription | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!session?.user?.id) return
    const { data } = await supabase
      .from("extractor_subscriptions")
      .select("*")
      .eq("user_id", session.user.id)
      .maybeSingle()
    setSubscription(data)
    setLoading(false)
  }, [session?.user?.id, supabase])

  useEffect(() => {
    load()
  }, [load])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>

      {/* Usage */}
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold mb-3">Usage & Credits</h2>
          {subscription ? (
            <CreditUsageBar subscription={subscription} />
          ) : (
            <p className="text-sm text-muted-foreground">
              No subscription found. Create a parser to get started with 50 free pages/month.
            </p>
          )}
        </div>

        {/* Account */}
        <div>
          <h2 className="text-lg font-semibold mb-3">Account</h2>
          <div className="space-y-2">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <span className="text-sm">Email</span>
              <span className="text-sm text-muted-foreground">
                {session?.user?.email ?? "Not signed in"}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <span className="text-sm">Plan</span>
              <span className="text-sm text-muted-foreground">Free (50 pages/month)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
