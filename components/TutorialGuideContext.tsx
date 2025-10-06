"use client"

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
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
  const [dontShowAgain, setDontShowAgain] = useState(false)

  // On first load, show the guide unless previously dismissed
  useEffect(() => {
    try {
      const seen = typeof window !== "undefined" ? window.localStorage.getItem("bb_tutorial_seen") : null
      if (!seen) setOpen(true)
    } catch {}
  }, [])

  const openGuide = useCallback(() => setOpen(true), [])
  const closeGuide = useCallback(() => {
    // Close without persisting; persistence handled by onOpenChange when checkbox is enabled
    setOpen(false)
  }, [])

  const value = useMemo(() => ({ open, openGuide, closeGuide }), [open, openGuide, closeGuide])

  return (
    <TutorialGuideContext.Provider value={value}>
      {children}
      <Dialog
        open={open}
        onOpenChange={(next) => {
          // Persist preference if closing and checkbox is checked
          if (!next) {
            try {
              if (dontShowAgain && typeof window !== "undefined") {
                window.localStorage.setItem("bb_tutorial_seen", "1")
              }
            } catch {}
          }
          setOpen(next)
        }}
      >
        <TutorialGuideModal
          open={open}
          onClose={closeGuide}
          dontShowAgain={dontShowAgain}
          setDontShowAgain={setDontShowAgain}
        />
      </Dialog>
    </TutorialGuideContext.Provider>
  )
}

function TutorialGuideModal({
  open,
  onClose,
  dontShowAgain,
  setDontShowAgain,
}: {
  open: boolean
  onClose: () => void
  dontShowAgain: boolean
  setDontShowAgain: (v: boolean) => void
}) {
  const titleId = "bb-guide-title"
  const descId = "bb-guide-description"

  return (
    <DialogContent
      className="sm:max-w-[640px] p-6"
      showCloseButton={true}
      aria-labelledby={titleId}
      aria-describedby={descId}
    >
      {/* Header: optional illustration + title/subhead */}
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
              Get started with SheetIt by Bytebeam
            </DialogTitle>
            <DialogDescription id={descId} className="text-[14px] sm:text-[15px] leading-relaxed">
              Turn PDFs & images into a table—no code.
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

      {/* Footer */}
      <DialogFooter className="mt-2">
        <div className="flex w-full items-center gap-3">
          {/* Right: actions (first in DOM for correct tab order) */}
          {/* <div className="order-2 ml-auto flex items-center gap-2">
            <Button
              variant="default"
              className="h-11"
              autoFocus
              onClick={() => {
                onClose()
              }}
            >
              Start with a Template
            </Button>
            <Button
              variant="ghost"
              className="h-11"
              onClick={() => {
                onClose()
              }}
            >
              Upload a File
            </Button>
            <Button variant="ghost" asChild>
              <a href="#" onClick={(e) => e.preventDefault()} className="focus-visible:outline-none">Use a sample file</a>
            </Button>
            <Button variant="ghost" asChild>
              <a href="https://docs.bytebeam.ai" target="_blank" rel="noreferrer" className="focus-visible:outline-none">Docs</a>
            </Button>
          </div> */}

          {/* Left: don't show again (last in DOM tab order) */}
          {/* <label className="order-1 inline-flex items-center gap-2 text-sm text-muted-foreground select-none">
            <Checkbox
              checked={dontShowAgain}
              onCheckedChange={(v) => setDontShowAgain(Boolean(v))}
              aria-label="Don't show again"
            />
            <span>Don’t show again</span>
          </label> */}
        </div>
      </DialogFooter>
    </DialogContent>
  )
}
