"use client"

import { useState } from "react"
import { Loader2, Trash2, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useSupabaseClient } from "@/lib/supabase/hooks"
import type { Parser } from "@/lib/extractor/types"

interface ParserSettingsProps {
  parser: Parser
  onUpdate: (updates: Partial<Parser>) => Promise<void>
  onDeleted: () => void
}

export function ParserSettings({ parser, onUpdate, onDeleted }: ParserSettingsProps) {
  const supabase = useSupabaseClient()
  const [name, setName] = useState(parser.name)
  const [description, setDescription] = useState(parser.description ?? "")
  const [saving, setSaving] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    await onUpdate({
      name: name.trim(),
      description: description.trim() || null,
    })
    setSaving(false)
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    await supabase.from("parsers").delete().eq("id", parser.id)
    setIsDeleting(false)
    setShowDeleteDialog(false)
    onDeleted()
  }

  const hasChanges = name.trim() !== parser.name || (description.trim() || null) !== parser.description

  return (
    <div className="max-w-xl space-y-8">
      {/* General settings */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">General</h3>

        <div className="space-y-1.5">
          <Label>Name</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </div>

        <div className="space-y-1.5">
          <Label>Description</Label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            placeholder="What does this parser do?"
          />
        </div>

        {hasChanges && (
          <Button onClick={handleSave} disabled={saving || !name.trim()}>
            {saving && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
            Save Changes
          </Button>
        )}
      </div>

      {/* Inbound email (future) */}
      {parser.inbound_email && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold">Email Forwarding</h3>
          <p className="text-sm text-muted-foreground">
            Forward emails to this address to automatically parse attachments.
          </p>
          <div className="p-3 bg-muted/50 rounded-lg">
            <code className="text-sm font-mono">{parser.inbound_email}</code>
          </div>
          <p className="text-xs text-muted-foreground">
            Email forwarding will be available in a future update.
          </p>
        </div>
      )}

      {/* Danger zone */}
      <div className="space-y-3 pt-4 border-t">
        <h3 className="text-lg font-semibold text-destructive">Danger Zone</h3>
        <div className="border border-destructive/20 rounded-lg p-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Delete Parser</p>
            <p className="text-xs text-muted-foreground">
              Permanently delete this parser, its integrations, and all history.
            </p>
          </div>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setShowDeleteDialog(true)}
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Delete
          </Button>
        </div>
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete parser?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete &ldquo;{parser.name}&rdquo; and all associated
              data. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete Parser"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
