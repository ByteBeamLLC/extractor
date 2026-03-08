"use client"

import { useCallback, useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import {
  User,
  CreditCard,
  Loader2,
  CheckCircle,
  KeyRound,
  ExternalLink,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { useSession, useSupabaseClient } from "@/lib/supabase/hooks"
import { useAuthDialog } from "@/components/auth/AuthDialogContext"
import type { ExtractorSubscription } from "@/lib/extractor/types"

const TIER_LABELS: Record<string, string> = {
  free: "Free",
  starter: "Starter",
  growth: "Growth",
  pro: "Pro",
  business: "Business",
}

export default function SettingsPage() {
  const session = useSession()
  const supabase = useSupabaseClient()
  const { openAuthDialog } = useAuthDialog()

  const [subscription, setSubscription] = useState<ExtractorSubscription | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [fullName, setFullName] = useState("")
  const [portalLoading, setPortalLoading] = useState(false)
  const searchParams = useSearchParams()
  const checkoutSuccess = searchParams.get("checkout") === "success"

  const load = useCallback(async () => {
    if (!session?.user?.id) return
    const { data } = await supabase
      .from("extractor_subscriptions")
      .select("*")
      .eq("user_id", session.user.id)
      .maybeSingle()
    setSubscription(data)
    setFullName((session.user.user_metadata?.full_name as string) || "")
    setLoading(false)
  }, [session?.user?.id, supabase])

  useEffect(() => {
    load()
  }, [load])

  const handleSave = async () => {
    if (!session) return
    setSaving(true)
    setSaved(false)
    try {
      await supabase.auth.updateUser({
        data: { full_name: fullName.trim() },
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } finally {
      setSaving(false)
    }
  }

  const handleManageSubscription = async () => {
    setPortalLoading(true)
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      }
    } finally {
      setPortalLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-3rem)]">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const tier = subscription?.tier || "free"
  const creditsUsed = subscription?.credits_used ?? 0
  const creditsFree = subscription?.credits_free ?? 30
  const usagePercent = creditsFree > 0 ? Math.round((creditsUsed / creditsFree) * 100) : 0
  const creditsRemaining = Math.max(0, creditsFree - creditsUsed)
  const isPaid = tier !== "free"

  return (
    <div className="mx-auto max-w-2xl p-6 space-y-6">
      <h1 className="text-2xl font-bold">Account Settings</h1>

      {checkoutSuccess && (
        <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
          <CheckCircle className="h-4 w-4 shrink-0" />
          Subscription activated! Your plan has been upgraded.
        </div>
      )}

      <Tabs defaultValue="profile">
        <TabsList className="w-full">
          <TabsTrigger value="profile" className="flex-1 gap-1.5">
            <User className="h-4 w-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="billing" className="flex-1 gap-1.5">
            <CreditCard className="h-4 w-4" />
            Usage & Billing
          </TabsTrigger>
        </TabsList>

        {/* Profile */}
        <TabsContent value="profile">
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="space-y-2">
                <Label>Full Name</Label>
                <Input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Your name"
                />
              </div>
              <div className="space-y-2">
                <Label>Email Address</Label>
                <Input value={session?.user?.email ?? ""} disabled />
              </div>
              <div className="pt-2">
                <Button
                  onClick={() => openAuthDialog("forgot-password")}
                  variant="outline"
                  size="sm"
                >
                  <KeyRound className="h-4 w-4 mr-1.5" />
                  Change Password
                </Button>
              </div>
              <div className="flex items-center gap-2 pt-2">
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : null}
                  Save Changes
                </Button>
                {saved && (
                  <span className="text-sm text-emerald-600 flex items-center gap-1">
                    <CheckCircle className="h-4 w-4" /> Saved!
                  </span>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Usage & Billing */}
        <TabsContent value="billing">
          <Card>
            <CardContent className="pt-6 space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-lg">Current Plan</p>
                  <p className="text-sm text-muted-foreground">
                    {creditsFree.toLocaleString()} pages / month
                  </p>
                </div>
                <Badge variant={isPaid ? "default" : "secondary"}>
                  {TIER_LABELS[tier] || "Free"}
                </Badge>
              </div>

              {/* Credit usage */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Pages Used</span>
                  <span className="font-medium">
                    {creditsUsed.toLocaleString()} / {creditsFree.toLocaleString()}
                  </span>
                </div>
                <Progress value={usagePercent} />
                <p className="text-xs text-muted-foreground">
                  {creditsRemaining.toLocaleString()} pages remaining this month
                </p>
              </div>

              {/* Info rows */}
              {subscription?.credits_reset_at && (
                <div className="text-sm">
                  <p className="text-muted-foreground">Credits reset</p>
                  <p className="font-medium">
                    {new Date(subscription.credits_reset_at).toLocaleDateString()}
                  </p>
                </div>
              )}

              {subscription?.max_parsers && (
                <div className="text-sm">
                  <p className="text-muted-foreground">Parser limit</p>
                  <p className="font-medium">
                    {subscription.max_parsers >= 999
                      ? "Unlimited"
                      : `${subscription.max_parsers} parsers`}
                  </p>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                {isPaid && subscription?.stripe_customer_id ? (
                  <Button
                    onClick={handleManageSubscription}
                    disabled={portalLoading}
                  >
                    {portalLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                    ) : (
                      <ExternalLink className="h-4 w-4 mr-1.5" />
                    )}
                    Manage Subscription
                  </Button>
                ) : (
                  <Button asChild>
                    <a href="/pricing">Upgrade Plan</a>
                  </Button>
                )}
                {isPaid && (
                  <Button variant="outline" asChild>
                    <a href="/pricing">Change Plan</a>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
