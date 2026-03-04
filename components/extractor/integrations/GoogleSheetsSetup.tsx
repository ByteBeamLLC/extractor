"use client"

import { useState } from "react"
import { Loader2, Copy, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface GoogleSheetsSetupProps {
  parserId: string
  onCreated: () => void
  onCancel: () => void
}

export function GoogleSheetsSetup({ parserId, onCreated, onCancel }: GoogleSheetsSetupProps) {
  const [name, setName] = useState("Google Sheets")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [feedUrl, setFeedUrl] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const handleCreate = async () => {
    setSaving(true)
    setError(null)

    try {
      const res = await fetch(`/api/extractor/parsers/${parserId}/integrations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "google_sheets",
          name: name.trim(),
          config: {},
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Failed to create")

      // Build the feed URL
      const token = data.integration?.config?.feed_url_token
      const baseUrl = window.location.origin
      const url = `${baseUrl}/api/extractor/parsers/${parserId}/feed?token=${token}&format=csv`
      setFeedUrl(url)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create")
    } finally {
      setSaving(false)
    }
  }

  const handleCopy = async () => {
    if (!feedUrl) return
    const formula = `=IMPORTDATA("${feedUrl}")`
    await navigator.clipboard.writeText(formula)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (feedUrl) {
    return (
      <div className="space-y-4 py-2">
        <div className="p-4 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg">
          <p className="text-sm font-medium text-green-800 dark:text-green-200 mb-2">
            Google Sheets integration created!
          </p>
          <p className="text-xs text-green-700 dark:text-green-300 mb-3">
            Paste the following formula into cell A1 of your Google Spreadsheet:
          </p>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-xs bg-white dark:bg-gray-900 p-2 rounded border font-mono break-all">
              =IMPORTDATA(&quot;{feedUrl}&quot;)
            </code>
            <Button variant="outline" size="icon" onClick={handleCopy}>
              {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        <div className="flex justify-end">
          <Button onClick={onCreated}>Done</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 py-2">
      <div className="space-y-1.5">
        <Label className="text-xs">Name</Label>
        <Input value={name} onChange={(e) => setName(e.target.value)} />
      </div>

      <div className="p-3 bg-muted/50 rounded-lg text-sm text-muted-foreground">
        This creates a live CSV feed URL. Use Google Sheets&apos; <code className="font-mono text-xs">IMPORTDATA()</code> formula
        to pull your parsed data directly into a spreadsheet.
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex justify-end gap-2 pt-2">
        <Button variant="outline" onClick={onCancel}>Back</Button>
        <Button onClick={handleCreate} disabled={saving}>
          {saving && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
          Create Feed
        </Button>
      </div>
    </div>
  )
}
