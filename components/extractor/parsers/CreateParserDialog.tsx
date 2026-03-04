"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useSession, useSupabaseClient } from "@/lib/supabase/hooks"

interface CreateParserDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated: () => void
}

export function CreateParserDialog({ open, onOpenChange, onCreated }: CreateParserDialogProps) {
  const router = useRouter()
  const session = useSession()
  const supabase = useSupabaseClient()

  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const resetForm = () => {
    setName("")
    setDescription("")
    setError(null)
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) resetForm()
    onOpenChange(newOpen)
  }

  const handleCreate = async () => {
    if (!session?.user?.id || !name.trim()) return

    setIsCreating(true)
    setError(null)

    try {
      // Generate a unique webhook token
      const webhookToken = crypto.randomUUID().replace(/-/g, "")
      // Generate an inbound email (for future use)
      const emailHash = crypto.randomUUID().replace(/-/g, "").slice(0, 12)

      const { data, error: insertError } = await supabase
        .from("parsers")
        .insert({
          user_id: session.user.id,
          name: name.trim(),
          description: description.trim() || null,
          fields: [],
          extraction_mode: "ai",
          inbound_email: `${emailHash}@parse.extractor.bytebeam.co`,
          inbound_webhook_token: webhookToken,
        })
        .select("id")
        .single()

      if (insertError) throw insertError

      onCreated()
      router.push(`/extractor/parsers/${data.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create parser")
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Create Parser</DialogTitle>
          <DialogDescription>
            Give your parser a name, then define the fields you want to extract.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="parser-name">Name</Label>
            <Input
              id="parser-name"
              placeholder="e.g. Invoice Parser, Lead Extractor"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="parser-desc">Description (optional)</Label>
            <Textarea
              id="parser-desc"
              placeholder="What kind of documents will this parser handle?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </div>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}
        </div>

        <DialogFooter>
          <Button
            onClick={handleCreate}
            disabled={!name.trim() || isCreating}
          >
            {isCreating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Create Parser
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
