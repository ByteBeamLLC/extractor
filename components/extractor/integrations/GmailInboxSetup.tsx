"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Mail, Loader2, CheckCircle2, AlertCircle, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useSupabaseClient } from "@/lib/supabase/hooks"
import type { ParserIntegration } from "@/lib/extractor/types"

interface GmailInboxSetupProps {
  parserId: string
  onCreated: () => void
  onCancel: () => void
  existingIntegration?: ParserIntegration | null
}

export function GmailInboxSetup({ parserId, onCreated, onCancel, existingIntegration }: GmailInboxSetupProps) {
  const supabase = useSupabaseClient()
  const searchParams = useSearchParams()
  const [fromFilter, setFromFilter] = useState(existingIntegration?.config?.from_filter ?? "")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const gmailConnected = searchParams.get("gmailConnected") === "true"
  const gmailError = searchParams.get("gmailError")
  const isConnected = !!existingIntegration?.config?.gmail_address || gmailConnected

  // Load existing from_filter from sessionStorage (saved before OAuth redirect)
  useEffect(() => {
    if (gmailConnected && !existingIntegration?.config?.from_filter) {
      const saved = sessionStorage.getItem(`gmail_from_filter_${parserId}`)
      if (saved) {
        setFromFilter(saved)
        sessionStorage.removeItem(`gmail_from_filter_${parserId}`)
      }
    }
  }, [gmailConnected, parserId, existingIntegration])

  const handleConnect = () => {
    // Save from_filter to sessionStorage before OAuth redirect
    if (fromFilter.trim()) {
      sessionStorage.setItem(`gmail_from_filter_${parserId}`, fromFilter.trim())
    }
    window.location.href = `/api/extractor/auth/gmail/connect?parserId=${parserId}`
  }

  const handleSaveFilter = async () => {
    if (!fromFilter.trim()) {
      setError("From address filter is required")
      return
    }

    setSaving(true)
    setError(null)

    try {
      if (existingIntegration) {
        // Update existing integration
        const { error: dbError } = await supabase
          .from("parser_integrations" as any)
          .update({
            config: { ...existingIntegration.config, from_filter: fromFilter.trim() },
            is_active: true,
            updated_at: new Date().toISOString(),
          } as any)
          .eq("id", existingIntegration.id)

        if (dbError) throw dbError
      } else {
        // Post-OAuth: update the newly created integration with from_filter
        const { data: integration } = await supabase
          .from("parser_integrations" as any)
          .select("*")
          .eq("parser_id", parserId)
          .eq("type", "gmail_inbox")
          .single()

        if (integration) {
          const { error: dbError } = await supabase
            .from("parser_integrations" as any)
            .update({
              config: { ...(integration as any).config, from_filter: fromFilter.trim() },
              is_active: true,
              updated_at: new Date().toISOString(),
            } as any)
            .eq("id", (integration as any).id)

          if (dbError) throw dbError
        }
      }

      onCreated()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save")
    } finally {
      setSaving(false)
    }
  }

  // Show error from OAuth callback
  if (gmailError) {
    return (
      <div className="space-y-4 py-2">
        <div className="p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm font-medium text-red-800 dark:text-red-200 flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            Gmail connection failed
          </p>
          <p className="text-xs text-red-700 dark:text-red-300 mt-1">
            {gmailError === "access_denied"
              ? "You denied access to your Gmail account."
              : `Error: ${gmailError}`}
          </p>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onCancel}>Back</Button>
          <Button onClick={handleConnect}>Try Again</Button>
        </div>
      </div>
    )
  }

  // Connected state — show filter setup
  if (isConnected) {
    return (
      <div className="space-y-4 py-2">
        <div className="p-4 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg">
          <p className="text-sm font-medium text-green-800 dark:text-green-200 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            Gmail connected
            {existingIntegration?.config?.gmail_address && (
              <span className="font-normal">as {existingIntegration.config.gmail_address}</span>
            )}
          </p>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs">Only process emails from</Label>
          <Input
            type="email"
            placeholder="e.g. invoices@supplier.com"
            value={fromFilter}
            onChange={(e) => setFromFilter(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Only emails from this address with attachments will be processed.
          </p>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={onCancel}>Back</Button>
          <Button onClick={handleSaveFilter} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
            {existingIntegration ? "Save" : "Activate"}
          </Button>
        </div>
      </div>
    )
  }

  // Initial state — connect Gmail
  return (
    <div className="space-y-4 py-2">
      <div className="p-4 bg-muted/50 rounded-lg space-y-3">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-red-100 dark:bg-red-950/50 flex items-center justify-center">
            <Mail className="h-5 w-5 text-red-600 dark:text-red-400" />
          </div>
          <div>
            <p className="text-sm font-medium">Connect Gmail</p>
            <p className="text-xs text-muted-foreground">
              Automatically extract data from email attachments
            </p>
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          We&apos;ll only read your emails (read-only access). Attachments matching your
          filter will be automatically processed every 5 minutes.
        </p>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs">Only process emails from</Label>
        <Input
          type="email"
          placeholder="e.g. invoices@supplier.com"
          value={fromFilter}
          onChange={(e) => setFromFilter(e.target.value)}
        />
        <p className="text-xs text-muted-foreground">
          You can set this after connecting too.
        </p>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex justify-end gap-2 pt-2">
        <Button variant="outline" onClick={onCancel}>Back</Button>
        <Button onClick={handleConnect}>
          <ExternalLink className="h-4 w-4 mr-1" />
          Connect Gmail Account
        </Button>
      </div>
    </div>
  )
}
