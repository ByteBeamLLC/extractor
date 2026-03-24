"use client"

import { useState } from "react"
import { FileText, ExternalLink, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface GoogleDocsSetupProps {
  parserId: string
  onCreated: () => void
  onCancel: () => void
}

export function GoogleDocsSetup({ parserId, onCreated, onCancel }: GoogleDocsSetupProps) {
  const [folderId, setFolderId] = useState("")

  const handleConnect = () => {
    // Redirect to Google OAuth consent screen
    // The folder ID can be set after connection via the integration card
    window.location.href = `/api/auth/google-docs/connect?parserId=${parserId}`
  }

  return (
    <div className="space-y-4 py-2">
      <div className="flex items-start gap-3 p-4 bg-primary/5 border border-primary/20 rounded-lg">
        <FileText className="h-5 w-5 text-primary shrink-0 mt-0.5" />
        <div className="text-sm">
          <p className="font-medium">Save to Google Docs</p>
          <p className="text-muted-foreground mt-1">
            After each extraction, a Google Doc will be created in your Drive with the extracted data
            formatted as a readable document.
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="folder-id">Google Drive Folder ID (optional)</Label>
        <Input
          id="folder-id"
          placeholder="e.g. 1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2wtEs"
          value={folderId}
          onChange={(e) => setFolderId(e.target.value)}
        />
        <p className="text-xs text-muted-foreground">
          Leave empty to save to your Drive root. You can find the folder ID in the Google Drive URL.
        </p>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={handleConnect}>
          <ExternalLink className="h-4 w-4 mr-2" />
          Connect Google Drive
        </Button>
      </div>
    </div>
  )
}
