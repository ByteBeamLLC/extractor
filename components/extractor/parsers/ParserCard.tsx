"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import {
  FileText,
  MoreVertical,
  Trash2,
  Pause,
  Play,
  Sparkles,
  ListChecks,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
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

interface StatusBreakdown {
  completed: number
  error: number
  processing: number
  pending: number
}

interface ParserCardProps {
  parser: Parser
  statusBreakdown?: StatusBreakdown
  onDeleted: () => void
}

export function ParserCard({ parser, statusBreakdown, onDeleted }: ParserCardProps) {
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

  const totalDocs = parser.document_count ?? 0

  return (
    <>
      <Link
        href={`/parsers/${parser.id}`}
        className="block group"
      >
        <div className="border rounded-xl p-5 bg-card hover:shadow-md transition-shadow h-full flex flex-col">
          {/* Header: name + menu */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div className="min-w-0">
                <h3 className="font-semibold truncate group-hover:text-primary transition-colors">
                  {parser.name}
                </h3>
                {parser.inbound_email && (
                  <p className="text-[11px] text-muted-foreground/70 font-mono truncate">
                    {parser.inbound_email}
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

          {/* Document status breakdown */}
          <div className="space-y-1.5 mb-3">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <FileText className="h-3.5 w-3.5" />
              <span className="font-medium">{totalDocs} document{totalDocs !== 1 ? "s" : ""}</span>
            </div>
            {statusBreakdown && totalDocs > 0 && (
              <div className="pl-5 space-y-0.5">
                {statusBreakdown.completed > 0 && (
                  <div className="flex items-center gap-1.5 text-[11px]">
                    <CheckCircle2 className="h-3 w-3 text-green-500" />
                    <span className="text-muted-foreground">{statusBreakdown.completed} Processed</span>
                  </div>
                )}
                {statusBreakdown.error > 0 && (
                  <div className="flex items-center gap-1.5 text-[11px]">
                    <XCircle className="h-3 w-3 text-red-500" />
                    <span className="text-muted-foreground">{statusBreakdown.error} Failed</span>
                  </div>
                )}
                {statusBreakdown.processing > 0 && (
                  <div className="flex items-center gap-1.5 text-[11px]">
                    <Clock className="h-3 w-3 text-blue-500" />
                    <span className="text-muted-foreground">{statusBreakdown.processing} Processing</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* AI Engine + Fields */}
          <div className="space-y-1.5 mb-3">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Sparkles className="h-3.5 w-3.5 text-amber-500" />
              <span>AI Engine</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <ListChecks className="h-3.5 w-3.5" />
              <span>{fieldCount} field{fieldCount !== 1 ? "s" : ""}</span>
            </div>
          </div>

          {/* Footer: status + last active */}
          <div className="flex items-center justify-between mt-auto pt-3 border-t">
            <Badge variant={parser.status === "active" ? "default" : "secondary"} className="text-[10px]">
              {parser.status}
            </Badge>
            {lastActive && (
              <span className="text-[11px] text-muted-foreground">
                {lastActive}
              </span>
            )}
          </div>
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
