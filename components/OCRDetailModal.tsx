"use client"

import { ExtractionJob, SchemaDefinition } from "@/lib/schema"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { DocumentMissionControl } from "@/components/mission-control/DocumentMissionControl"

interface OCRDetailModalProps {
  job: ExtractionJob | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onMarkdownChange?: (markdown: string) => void
  schema?: SchemaDefinition | null
  onUpdateResults?: (jobId: string, results: Record<string, any>) => void
}

export function OCRDetailModal({
  job,
  open,
  onOpenChange,
  schema,
  onUpdateResults
}: OCRDetailModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!w-[95vw] !max-w-[95vw] !h-[95vh] !max-h-[95vh] p-0 m-0">
        <DialogHeader className="px-6 py-4 border-b flex-shrink-0">
          <DialogTitle>Document Viewer</DialogTitle>
          <DialogDescription>
            {job
              ? `${job.fileName ?? "Untitled"} · ${job.status === "completed" ? "Completed" : job.status}`
              : "Select a job to view its document and extraction results."}
          </DialogDescription>
        </DialogHeader>

        {/* Full Mission Control View */}
        <div className="flex-1 overflow-hidden min-h-0">
          {job ? (
            <DocumentMissionControl
              job={job}
              schema={schema ?? null}
              onUpdateResults={onUpdateResults}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center text-muted-foreground">
              <p>Select a document to view Mission Control.</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
