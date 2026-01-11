"use client"

import React, { createContext, useCallback, useContext, useMemo, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { ListChecks, Upload, Eye, ChevronDown } from "lucide-react"

type TutorialContextValue = {
  open: boolean
  openGuide: () => void
  closeGuide: () => void
}

const TutorialGuideContext = createContext<TutorialContextValue | undefined>(undefined)

export function useTutorialGuide() {
  const ctx = useContext(TutorialGuideContext)
  if (!ctx) throw new Error("useTutorialGuide must be used within TutorialGuideProvider")
  return ctx
}

export function TutorialGuideProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)

  const openGuide = useCallback(() => setOpen(true), [])
  const closeGuide = useCallback(() => setOpen(false), [])

  const value = useMemo(() => ({ open, openGuide, closeGuide }), [open, openGuide, closeGuide])

  return (
    <TutorialGuideContext.Provider value={value}>
      {children}
      <Dialog open={open} onOpenChange={setOpen}>
        <TutorialGuideModal />
      </Dialog>
    </TutorialGuideContext.Provider>
  )
}

function TutorialGuideModal() {
  const titleId = "bb-guide-title"
  const descId = "bb-guide-description"

  return (
    <DialogContent
      className="sm:max-w-[640px] p-6"
      showCloseButton={true}
      aria-labelledby={titleId}
      aria-describedby={descId}
    >
      {/* Header */}
      <DialogHeader className="text-left">
        <div className="grid gap-3 sm:grid-cols-[96px_1fr] sm:gap-4 items-start">
          <img
            src="/bytebeam-logo-icon.png"
            alt=""
            aria-hidden="true"
            className="hidden sm:block w-24 h-24 rounded-md object-contain"
          />
          <div className="space-y-1">
            <DialogTitle id={titleId} className="text-[20px] sm:text-[22px] font-semibold">
              Get started with Bytebeam
            </DialogTitle>
            <DialogDescription id={descId} className="text-[14px] sm:text-[15px] leading-relaxed">
              Extract structured data from documents and images using AI.
            </DialogDescription>
          </div>
        </div>
      </DialogHeader>

      {/* Body: 3-step quick start */}
      <div className="space-y-4 max-w-[65ch]">
        <div className="space-y-2">
          <p className="text-sm font-medium text-foreground">Do this:</p>

          {/* Step 1 */}
          <div className="flex items-start gap-3 border border-border rounded-md p-3 hover:bg-accent/40 transition-colors">
            <ListChecks className="size-5 text-muted-foreground mt-0.5" aria-hidden="true" />
            <div className="space-y-1">
              <p className="font-medium leading-none">1. Choose fields</p>
              <p className="text-sm text-muted-foreground">
                Pick a template or click <span className="font-medium">Columns → Add Column</span> to define your
                fields (name + type).
              </p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="flex items-start gap-3 border border-border rounded-md p-3 hover:bg-accent/40 transition-colors">
            <Upload className="size-5 text-muted-foreground mt-0.5" aria-hidden="true" />
            <div className="space-y-1">
              <p className="font-medium leading-none">2. Upload documents</p>
              <p className="text-sm text-muted-foreground">
                Use <span className="font-medium">Upload Documents</span> in the sidebar. Each file becomes a row.
              </p>
            </div>
          </div>

          {/* Step 3 */}
          <div className="flex items-start gap-3 border border-border rounded-md p-3 hover:bg-accent/40 transition-colors">
            <Eye className="size-5 text-muted-foreground mt-0.5" aria-hidden="true" />
            <div className="space-y-1">
              <p className="font-medium leading-none">3. Review & export</p>
              <p className="text-sm text-muted-foreground">
                Tweak values or switch to <span className="font-medium">Transform</span> for calculations,
                classifications, or AI prompts. Export as CSV.
              </p>
            </div>
          </div>
        </div>

        {/* Tips (collapsible) */}
        <Collapsible>
          <CollapsibleTrigger className="group flex items-center gap-2 text-sm font-medium text-foreground hover:underline">
            <ChevronDown className="size-4 transition-transform group-data-[state=open]:rotate-180" aria-hidden="true" />
            Tips
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-2">
            <ul className="list-disc pl-5 space-y-1.5 text-sm text-muted-foreground">
              <li>Use clear field names (e.g., invoice_number, total_amount).</li>
              <li>Add a one-line description to each field for better extraction.</li>
              <li>Create multiple Tabs for different document types.</li>
            </ul>
          </CollapsibleContent>
        </Collapsible>
      </div>
    </DialogContent>
  )
}
