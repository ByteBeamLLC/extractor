"use client"

import { useState } from "react"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { IntegrationType } from "@/lib/extractor/types"

interface ZapierMakeFormProps {
  parserId: string
  type: IntegrationType
  label: string
  onCreated: () => void
  onCancel: () => void
}

export function ZapierMakeForm({ parserId, type, label, onCreated, onCancel }: ZapierMakeFormProps) {
  const [name, setName] = useState(label)
  const [webhookUrl, setWebhookUrl] = useState("")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSave = async () => {
    if (!webhookUrl.trim()) return
    setSaving(true)
    setError(null)

    try {
      const res = await fetch(`/api/extractor/parsers/${parserId}/integrations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          name: name.trim(),
          config: { webhook_url: webhookUrl.trim() },
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? "Failed to create")
      }

      onCreated()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create")
    } finally {
      setSaving(false)
    }
  }

  const getPlaceholder = () => {
    switch (type) {
      case "zapier": return "https://hooks.zapier.com/hooks/catch/..."
      case "make": return "https://hook.make.com/..."
      case "power_automate": return "https://prod-xx.westus.logic.azure.com/..."
      default: return "https://..."
    }
  }

  const getHelpText = () => {
    switch (type) {
      case "zapier":
        return "Create a Zap with 'Webhooks by Zapier' as trigger, choose 'Catch Hook', and paste the webhook URL here."
      case "make":
        return "Create a scenario with 'Webhooks' module as trigger, choose 'Custom webhook', and paste the URL here."
      case "power_automate":
        return "Create a flow with 'When an HTTP request is received' trigger and paste the HTTP POST URL here."
      default:
        return ""
    }
  }

  return (
    <div className="space-y-4 py-2">
      <div className="space-y-1.5">
        <Label className="text-xs">Name</Label>
        <Input value={name} onChange={(e) => setName(e.target.value)} />
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs">{label} Webhook URL</Label>
        <Input
          value={webhookUrl}
          onChange={(e) => setWebhookUrl(e.target.value)}
          placeholder={getPlaceholder()}
        />
      </div>

      <p className="text-xs text-muted-foreground">{getHelpText()}</p>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex justify-end gap-2 pt-2">
        <Button variant="outline" onClick={onCancel}>Back</Button>
        <Button onClick={handleSave} disabled={!webhookUrl.trim() || saving}>
          {saving && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
          Create Integration
        </Button>
      </div>
    </div>
  )
}
