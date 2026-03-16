"use client"

import { useTour } from "./TourProvider"
import { PARSER_TOUR_STEPS } from "@/lib/tour/steps"
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
} from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, X } from "lucide-react"

interface TourStepProps {
  stepId: string
  side?: "top" | "bottom" | "left" | "right"
  align?: "start" | "center" | "end"
  /** Override the "Next" button label */
  nextLabel?: string
  /** Override the "Next" button action (e.g. open a dialog instead of navigating) */
  onNext?: () => void
  children: React.ReactNode
}

export function TourStep({
  stepId,
  side = "bottom",
  align = "start",
  nextLabel,
  onNext,
  children,
}: TourStepProps) {
  const {
    isActive,
    currentStepId,
    currentStepIndex,
    totalSteps,
    nextStep,
    prevStep,
    skipTour,
  } = useTour()

  const isCurrentStep = isActive && currentStepId === stepId

  if (!isCurrentStep) {
    return <>{children}</>
  }

  const stepConfig = PARSER_TOUR_STEPS.find((s) => s.id === stepId)
  if (!stepConfig) return <>{children}</>

  const isFirst = currentStepIndex === 0
  const isLast = currentStepIndex === totalSteps - 1

  const handleNext = onNext ?? nextStep
  const nextText = isLast ? "Done" : (nextLabel ?? "Next")

  return (
    <Popover open onOpenChange={() => {}}>
      <PopoverAnchor asChild>
        <div className="relative z-[41] rounded-xl ring-2 ring-primary/50 ring-offset-2 ring-offset-background transition-all">
          {children}
        </div>
      </PopoverAnchor>
      <PopoverContent
        side={side}
        align={align}
        sideOffset={12}
        className="z-[50] w-80 p-0 shadow-lg border-primary/20"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <div className="p-4 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-sm leading-tight">
              {stepConfig.title}
            </h3>
            <button
              onClick={skipTour}
              className="p-1 rounded-md hover:bg-muted transition-colors shrink-0 -mt-0.5 -mr-1"
              aria-label="Skip tour"
            >
              <X className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {stepConfig.description}
          </p>
          <div className="flex items-center justify-between pt-1">
            <span className="text-[10px] text-muted-foreground font-medium">
              {currentStepIndex + 1} of {totalSteps}
            </span>
            <div className="flex items-center gap-1.5">
              {isFirst ? (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs px-2"
                  onClick={skipTour}
                >
                  Skip tour
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs px-2"
                  onClick={prevStep}
                >
                  <ChevronLeft className="h-3 w-3 mr-0.5" />
                  Back
                </Button>
              )}
              <Button size="sm" className="h-7 text-xs px-3" onClick={handleNext}>
                {nextText}
                {!isLast && !nextLabel && <ChevronRight className="h-3 w-3 ml-0.5" />}
              </Button>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
