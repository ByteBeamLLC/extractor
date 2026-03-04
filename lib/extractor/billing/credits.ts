import type { SupabaseClient } from "@supabase/supabase-js"
import type { ExtractorSubscription } from "@/lib/extractor/types"

/**
 * Get or create subscription for a user
 */
export async function getOrCreateSubscription(
  userId: string,
  supabase: SupabaseClient
): Promise<ExtractorSubscription> {
  const { data: existing } = await supabase
    .from("extractor_subscriptions")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle()

  if (existing) {
    // Check if credits need reset
    if (new Date(existing.credits_reset_at) < new Date()) {
      const { data: updated } = await supabase
        .from("extractor_subscriptions")
        .update({
          credits_used: 0,
          credits_reset_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id)
        .select("*")
        .single()
      return updated ?? existing
    }
    return existing
  }

  // Create new subscription with free tier
  const { data: created } = await supabase
    .from("extractor_subscriptions")
    .insert({
      user_id: userId,
      credits_free: 50,
      credits_used: 0,
      credits_reset_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    })
    .select("*")
    .single()

  return created!
}

/**
 * Check if user has available credits
 */
export async function checkCredits(
  userId: string,
  pagesNeeded: number,
  supabase: SupabaseClient
): Promise<{ allowed: boolean; remaining: number; subscription: ExtractorSubscription }> {
  const subscription = await getOrCreateSubscription(userId, supabase)
  const remaining = Math.max(subscription.credits_free - subscription.credits_used, 0)
  return {
    allowed: remaining >= pagesNeeded,
    remaining,
    subscription,
  }
}

/**
 * Deduct credits after successful extraction
 */
export async function deductCredits(
  subscriptionId: string,
  currentUsed: number,
  pagesUsed: number,
  supabase: SupabaseClient
): Promise<void> {
  await supabase
    .from("extractor_subscriptions")
    .update({
      credits_used: currentUsed + pagesUsed,
      updated_at: new Date().toISOString(),
    })
    .eq("id", subscriptionId)
}
