"use client"

import { useState, useEffect } from "react"
import dynamic from "next/dynamic"
import { Play, X } from "lucide-react"
import { Button } from "@/components/ui/button"

const InteractiveDemo = dynamic(
  () =>
    import("@/components/marketing/InteractiveDemo").then(
      (mod) => mod.default
    ),
  { ssr: false }
)

export function DemoModalButton({
  children = "See How It Works",
  className,
}: {
  children?: React.ReactNode
  className?: string
}) {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
    return () => {
      document.body.style.overflow = ""
    }
  }, [open])

  return (
    <>
      <Button
        variant="outline"
        size="lg"
        className={className}
        onClick={() => setOpen(true)}
      >
        <Play className="mr-2 h-4 w-4" />
        {children}
      </Button>

      {open && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-label="Interactive product tour"
        >
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => setOpen(false)}
          />
          <div className="relative w-full max-w-5xl animate-in zoom-in-95 fade-in duration-200">
            <button
              onClick={() => setOpen(false)}
              className="absolute -top-10 right-0 sm:-top-2 sm:-right-10 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 shadow-md hover:bg-white transition-colors"
              aria-label="Close tour"
            >
              <X className="h-4 w-4" />
            </button>
            <InteractiveDemo />
          </div>
        </div>
      )}
    </>
  )
}
