"use client"

import { useEffect, useRef } from "react"
import { ArrowRight, Zap } from "lucide-react"
import { trackEvent } from "@/lib/analytics"

interface FileSizeBridgeBannerProps {
  toolName: string
}

export function FileSizeBridgeBanner({ toolName }: FileSizeBridgeBannerProps) {
  const trackedRef = useRef(false)

  useEffect(() => {
    if (trackedRef.current) return
    trackedRef.current = true
    trackEvent("bridge_banner_shown", {
      location: toolName,
      reason: "file_too_large",
    })
  }, [toolName])

  return (
    <div className="border-t bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className="shrink-0 mt-0.5 w-9 h-9 rounded-lg bg-white/15 flex items-center justify-center">
            <Zap className="h-5 w-5 text-white" />
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-sm text-white leading-snug">
              This file exceeds the limit for this free tool
            </p>
            <p className="text-xs text-blue-100 mt-0.5 leading-relaxed">
              Process files of any size on Parsli — free for up to 30
              pages/month, no credit card required.
            </p>
          </div>
        </div>
        <div className="shrink-0 sm:ml-2">
          <a
            href="https://app.parsli.co"
            onClick={() =>
              trackEvent("bridge_banner_cta_clicked", {
                location: toolName,
                reason: "file_too_large",
              })
            }
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-white text-blue-700 hover:bg-blue-50 border-0 shadow-md hover:shadow-lg transition-all px-5 py-2.5 text-sm font-medium"
            data-cta-location={`bridge_banner_file_size_${toolName}`}
            data-cta-name="Get Started Free"
            data-cta-destination="signup"
          >
            Get Started Free
            <ArrowRight className="h-4 w-4" />
          </a>
        </div>
      </div>
    </div>
  )
}
