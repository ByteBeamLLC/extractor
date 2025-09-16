"use client"

import { useRef } from "react"
import { Button } from "@/components/ui/button"
import { useTutorialGuide } from "./TutorialGuideContext"

export function GuideButton() {
  const { openGuide } = useTutorialGuide()
  const btnRef = useRef<HTMLButtonElement>(null)
  return (
    <Button
      ref={btnRef}
      type="button"
      aria-label="Open quick guide"
      onClick={openGuide}
      variant="outline"
      className="px-3 py-1.5 h-auto text-sm"
    >
      Guide
    </Button>
  )
}

