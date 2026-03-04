"use client"

import { useState } from "react"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface WebhookFormProps {
  parserId: string
  onCreated: () => void
  onCancel: () => void
}

export function WebhookForm({ parserId, onCreated, onCancel }: WebhookFormProps) {
  const [name, setName] = useState("Webhook")
  const [url, setUrl] = useState("")
  const [method, setMethod] = useState("POST")
  const [authType, setAuthType] = useState("none")
  const [authToken, setAuthToken] = useState("")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSave = async () => {
    if (!url.trim()) return
    setSaving(true)
    setError(null)

    try {
      const res = await fetch(`/api/extractor/parsers/${parserId}/integrations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "webhook",
          name: name.trim(),
          config: {
            url: url.trim(),
            method,
            auth_type: authType,
            auth_token: authType !== "none" ? authToken : undefined,
            retry_count: 3,
          },
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

  return (
    <div className="space-y-4 py-2">
      <div className="space-y-1.5">
        <Label className="text-xs">Name</Label>
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="My Webhook" />
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs">URL</Label>
        <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://example.com/webhook" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs">Method</Label>
          <Select value={method} onValueChange={setMethod}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="POST">POST</SelectItem>
              <SelectItem value="PUT">PUT</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Authentication</Label>
          <Select value={authType} onValueChange={setAuthType}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              <SelectItem value="bearer">Bearer Token</SelectItem>
              <SelectItem value="basic">Basic Auth</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {authType !== "none" && (
        <div className="space-y-1.5">
          <Label className="text-xs">{authType === "bearer" ? "Bearer Token" : "Base64 Credentials"}</Label>
          <Input
            type="password"
            value={authToken}
            onChange={(e) => setAuthToken(e.target.value)}
            placeholder={authType === "bearer" ? "your-token" : "base64-encoded"}
          />
        </div>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex justify-end gap-2 pt-2">
        <Button variant="outline" onClick={onCancel}>Back</Button>
        <Button onClick={handleSave} disabled={!url.trim() || saving}>
          {saving && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
          Create Webhook
        </Button>
      </div>
    </div>
  )
}
