"use client"

import { useCallback, useEffect, useState } from "react"
import { formatDistanceToNow } from "date-fns"
import {
  Plus,
  Key,
  Trash2,
  Copy,
  Check,
  Loader2,
  AlertTriangle,
  Code,
  ExternalLink,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { useSession, useSupabaseClient } from "@/lib/supabase/hooks"
import type { Parser } from "@/lib/extractor/types"

interface ApiKeyManagerProps {
  parser: Parser
}

interface ApiKeyDisplay {
  id: string
  name: string
  key_prefix: string
  last_used_at: string | null
  created_at: string
}

export function ApiKeyManager({ parser }: ApiKeyManagerProps) {
  const session = useSession()
  const supabase = useSupabaseClient()
  const [keys, setKeys] = useState<ApiKeyDisplay[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [newKeyName, setNewKeyName] = useState("")
  const [creating, setCreating] = useState(false)
  const [newPlainKey, setNewPlainKey] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const loadKeys = useCallback(async () => {
    if (!session?.user?.id) return
    const res = await fetch(`/api/extractor/parsers/${parser.id}/api-keys`)
    const data = await res.json()
    setKeys(data.keys ?? [])
    setLoading(false)
  }, [parser.id, session?.user?.id])

  useEffect(() => {
    loadKeys()
  }, [loadKeys])

  const handleCreate = async () => {
    setCreating(true)
    try {
      const res = await fetch(`/api/extractor/parsers/${parser.id}/api-keys`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newKeyName.trim() || "Default" }),
      })
      const data = await res.json()
      if (data.key?.api_key) {
        setNewPlainKey(data.key.api_key)
        loadKeys()
      }
    } finally {
      setCreating(false)
    }
  }

  const handleRevoke = async (keyId: string) => {
    await fetch(`/api/extractor/parsers/${parser.id}/api-keys/${keyId}`, {
      method: "DELETE",
    })
    loadKeys()
  }

  const handleCopyKey = async () => {
    if (!newPlainKey) return
    await navigator.clipboard.writeText(newPlainKey)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const baseUrl = typeof window !== "undefined" ? window.location.origin : ""
  const webhookUrl = parser.inbound_webhook_token
    ? `${baseUrl}/api/extractor/inbound/webhook/${parser.inbound_webhook_token}`
    : null

  return (
    <div className="space-y-8">
      {/* API Keys Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">API Keys</h3>
            <p className="text-sm text-muted-foreground">
              Use API keys to submit documents programmatically.
            </p>
          </div>
          <Button onClick={() => { setShowCreateDialog(true); setNewPlainKey(null); setNewKeyName("") }}>
            <Plus className="h-4 w-4 mr-2" />
            Create Key
          </Button>
        </div>

        {loading ? (
          <div className="py-8 text-center">
            <Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground" />
          </div>
        ) : keys.length === 0 ? (
          <div className="border-2 border-dashed rounded-lg p-6 text-center">
            <Key className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No API keys created yet.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {keys.map((key) => (
              <div key={key.id} className="flex items-center justify-between p-3 border rounded-lg bg-card">
                <div className="flex items-center gap-3">
                  <Key className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <span className="text-sm font-medium">{key.name}</span>
                    <span className="text-xs text-muted-foreground ml-2 font-mono">{key.key_prefix}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {key.last_used_at && (
                    <span className="text-xs text-muted-foreground">
                      Used {formatDistanceToNow(new Date(key.last_used_at), { addSuffix: true })}
                    </span>
                  )}
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleRevoke(key.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Inbound Webhook URL */}
      {webhookUrl && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold">Inbound Webhook</h3>
          <p className="text-sm text-muted-foreground">
            Send documents to this URL to trigger extraction. No API key needed — the URL itself authenticates.
          </p>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-xs bg-muted p-2.5 rounded border font-mono break-all">
              POST {webhookUrl}
            </code>
            <Button
              variant="outline"
              size="icon"
              onClick={async () => {
                await navigator.clipboard.writeText(webhookUrl)
              }}
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* API Usage Example */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold">Quick Start</h3>
        <div className="bg-muted/50 rounded-lg p-4 font-mono text-xs space-y-1 overflow-x-auto">
          <p className="text-muted-foreground"># Extract data from a document</p>
          <p>curl -X POST {baseUrl}/api/extractor/v1/extract \</p>
          <p className="pl-4">-H &quot;Authorization: Bearer ext_YOUR_API_KEY&quot; \</p>
          <p className="pl-4">-H &quot;Content-Type: application/json&quot; \</p>
          <p className="pl-4">-d &apos;{`{"file":{"name":"invoice.pdf","type":"application/pdf","data":"BASE64_DATA"}}`}&apos;</p>
        </div>
      </div>

      {/* Create key dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{newPlainKey ? "API Key Created" : "Create API Key"}</DialogTitle>
            <DialogDescription>
              {newPlainKey
                ? "Copy your API key now. It won't be shown again."
                : "Give your API key a name for identification."}
            </DialogDescription>
          </DialogHeader>

          {newPlainKey ? (
            <div className="space-y-4 py-2">
              <div className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg">
                <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
                <span className="text-sm text-amber-800 dark:text-amber-200">
                  This is the only time this key will be shown. Store it securely.
                </span>
              </div>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-xs bg-muted p-2.5 rounded border font-mono break-all">
                  {newPlainKey}
                </code>
                <Button variant="outline" size="icon" onClick={handleCopyKey}>
                  {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3 py-2">
              <div className="space-y-1.5">
                <Label className="text-xs">Key Name</Label>
                <Input
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  placeholder="e.g. Production, Development"
                />
              </div>
            </div>
          )}

          <DialogFooter>
            {newPlainKey ? (
              <Button onClick={() => setShowCreateDialog(false)}>Done</Button>
            ) : (
              <>
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>Cancel</Button>
                <Button onClick={handleCreate} disabled={creating}>
                  {creating && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
                  Create Key
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
