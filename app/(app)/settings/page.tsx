"use client"

import { useCallback, useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import {
  User,
  CreditCard,
  Bell,
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
import { Switch } from "@/components/ui/switch"
import { useSession, useSupabaseClient } from "@/lib/supabase/hooks"
import { usePushSubscription } from "@/lib/hooks/usePushSubscription"
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
  const [emailNotifEnabled, setEmailNotifEnabled] = useState(true)
  const [emailNotifSaving, setEmailNotifSaving] = useState(false)
  const push = usePushSubscription()
  const searchParams = useSearchParams()
  const checkoutSuccess = searchParams.get("checkout") === "success"
  const initialTab = searchParams.get("tab") === "notifications" ? "notifications" : "profile"

  const load = useCallback(async () => {
    if (!session?.user?.id) return
    const { data } = await supabase
      .from("extractor_subscriptions")
      .select("*")
      .eq("user_id", session.user.id)
      .maybeSingle()
    setSubscription(data)
    // Default ON if the column is null (older accounts before the migration).
    // Cast: Supabase generated types are stale and don't know about the new column yet.
    setEmailNotifEnabled(
      (data as ExtractorSubscription | null)?.notification_email_enabled ?? true
    )
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

  const handleToggleEmailNotif = async (next: boolean) => {
    // Optimistic update — feels instant, revert if the server rejects.
    const prev = emailNotifEnabled
    setEmailNotifEnabled(next)
    setEmailNotifSaving(true)
    try {
      const res = await fetch("/api/user/notification-preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notification_email_enabled: next }),
      })
      if (!res.ok) throw new Error("Failed to update preference")
    } catch {
      setEmailNotifEnabled(prev)
    } finally {
      setEmailNotifSaving(false)
    }
  }

  const [testEmailStatus, setTestEmailStatus] = useState<
    "idle" | "sending" | "sent" | "error"
  >("idle")
  const [testPushStatus, setTestPushStatus] = useState<
    "idle" | "sending" | "sent" | "error"
  >("idle")

  const handleSendTestEmail = async () => {
    setTestEmailStatus("sending")
    try {
      const res = await fetch("/api/notifications/email/test", { method: "POST" })
      const data = await res.json()
      setTestEmailStatus(res.ok && data.ok ? "sent" : "error")
    } catch {
      setTestEmailStatus("error")
    }
    setTimeout(() => setTestEmailStatus("idle"), 4000)
  }

  const handleSendTestPush = async () => {
    setTestPushStatus("sending")
    try {
      const res = await fetch("/api/notifications/push/test", { method: "POST" })
      const data = await res.json()
      setTestPushStatus(res.ok && data.result?.sent > 0 ? "sent" : "error")
    } catch {
      setTestPushStatus("error")
    }
    setTimeout(() => setTestPushStatus("idle"), 4000)
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

      <Tabs defaultValue={initialTab}>
        <TabsList className="w-full">
          <TabsTrigger value="profile" className="flex-1 gap-1.5">
            <User className="h-4 w-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex-1 gap-1.5">
            <Bell className="h-4 w-4" />
            Notifications
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

        {/* Notifications */}
        <TabsContent value="notifications">
          <Card>
            <CardContent className="pt-6 space-y-6">
              {/* Email */}
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <p className="font-semibold">Email me when extractions finish</p>
                    <p className="text-sm text-muted-foreground">
                      If you navigate away while a document is still processing,
                      we&apos;ll send you an email a few minutes later so you
                      don&apos;t miss the result.
                    </p>
                  </div>
                  <Switch
                    checked={emailNotifEnabled}
                    onCheckedChange={handleToggleEmailNotif}
                    disabled={emailNotifSaving}
                    aria-label="Toggle extraction-ready email notifications"
                  />
                </div>
                {emailNotifEnabled && (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleSendTestEmail}
                      disabled={testEmailStatus === "sending"}
                    >
                      {testEmailStatus === "sending" ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                      ) : null}
                      Send test email
                    </Button>
                    {testEmailStatus === "sent" && (
                      <span className="text-xs text-emerald-600">
                        Sent — check your inbox
                      </span>
                    )}
                    {testEmailStatus === "error" && (
                      <span className="text-xs text-red-600">
                        Failed — check Resend config
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Browser push — only render if the browser actually supports it */}
              {push.supported && (
                <>
                  <div className="border-t" />
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <p className="font-semibold">Browser notifications</p>
                        <p className="text-sm text-muted-foreground">
                          Get an instant notification the moment your extraction
                          finishes — even if this tab is in the background.
                        </p>
                        {push.permission === "denied" && (
                          <p className="text-xs text-amber-600 pt-1">
                            Notifications are blocked for this site. Re-enable them
                            in your browser&apos;s site settings to use this.
                          </p>
                        )}
                        {push.error && (
                          <p className="text-xs text-red-600 pt-1">
                            {push.error}
                          </p>
                        )}
                      </div>
                      <Switch
                        checked={push.subscribed}
                        onCheckedChange={(next) =>
                          next ? push.enable() : push.disable()
                        }
                        disabled={push.busy || push.permission === "denied"}
                        aria-label="Toggle browser push notifications"
                      />
                    </div>
                    {push.subscribed && (
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleSendTestPush}
                          disabled={testPushStatus === "sending"}
                        >
                          {testPushStatus === "sending" ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                          ) : null}
                          Send test notification
                        </Button>
                        {testPushStatus === "sent" && (
                          <span className="text-xs text-emerald-600">
                            Sent — check your notifications
                          </span>
                        )}
                        {testPushStatus === "error" && (
                          <span className="text-xs text-red-600">
                            Failed — check VAPID config
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </>
              )}
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
