"use client"

import { useState } from "react"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import {
  FileText,
  MoreVertical,
  Trash2,
  Pause,
  Play,
  Copy,
  ExternalLink,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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

interface ParserCardProps {
  parser: Parser
  onDeleted: () => void
}

export function ParserCard({ parser, onDeleted }: ParserCardProps) {
  const supabase = useSupabaseClient()
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const fieldCount = parser.fields?.length ?? 0
  const lastActive = parser.last_processed_at
    ? formatDistanceToNow(new Date(parser.last_processed_at), { addSuffix: true })
    : null

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      await supabase.from("parsers").delete().eq("id", parser.id)
      onDeleted()
    } catch {
      // silently fail
    } finally {
      setIsDeleting(false)
      setShowDeleteDialog(false)
    }
  }

  const handleToggleStatus = async () => {
    const newStatus = parser.status === "active" ? "paused" : "active"
    await supabase
      .from("parsers")
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq("id", parser.id)
    onDeleted() // reload
  }

  return (
    <>
      <Link
        href={`/extractor/parsers/${parser.id}`}
        className="block group"
      >
        <div className="border rounded-xl p-5 bg-card hover:shadow-md transition-shadow h-full flex flex-col">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div className="min-w-0">
                <h3 className="font-semibold truncate group-hover:text-primary transition-colors">
                  {parser.name}
                </h3>
                {parser.description && (
                  <p className="text-xs text-muted-foreground truncate">
                    {parser.description}
                  </p>
                )}
              </div>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.preventDefault()}>
                <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={(e) => { e.preventDefault(); handleToggleStatus() }}>
                  {parser.status === "active" ? (
                    <><Pause className="h-4 w-4 mr-2" /> Pause</>
                  ) : (
                    <><Play className="h-4 w-4 mr-2" /> Resume</>
                  )}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={(e) => { e.preventDefault(); setShowDeleteDialog(true) }}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="flex items-center gap-2 mt-auto pt-3">
            <Badge variant={parser.status === "active" ? "default" : "secondary"} className="text-xs">
              {parser.status}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {fieldCount} field{fieldCount !== 1 ? "s" : ""}
            </span>
            <span className="text-xs text-muted-foreground">
              {parser.document_count} doc{parser.document_count !== 1 ? "s" : ""}
            </span>
          </div>

          {lastActive && (
            <p className="text-xs text-muted-foreground mt-2">
              Last active {lastActive}
            </p>
          )}
        </div>
      </Link>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete parser?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete &ldquo;{parser.name}&rdquo; and all its
              integrations, API keys, and processing history. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
