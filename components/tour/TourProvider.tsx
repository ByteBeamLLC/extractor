"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  useRef,
} from "react"
import { usePathname, useRouter } from "next/navigation"
import { useActiveParser } from "@/components/extractor/parser-context"
import { useSession, useSupabaseClient } from "@/lib/supabase/hooks"
import { trackEvent } from "@/lib/analytics"
import { PARSER_TOUR_STEPS, type TourStepConfig } from "@/lib/tour/steps"

const TOUR_STORAGE_KEY = "parsli_tour_completed"

interface TourContextValue {
  isActive: boolean
  currentStepId: string | null
  currentStepIndex: number
  totalSteps: number
  currentStep: TourStepConfig | null
  startTour: () => void
  nextStep: () => void
  prevStep: () => void
  skipTour: () => void
  hasCompletedTour: () => boolean
}

const TourContext = createContext<TourContextValue>({
  isActive: false,
  currentStepId: null,
  currentStepIndex: 0,
  totalSteps: 0,
  currentStep: null,
  startTour: () => {},
  nextStep: () => {},
  prevStep: () => {},
  skipTour: () => {},
  hasCompletedTour: () => false,
})

export const useTour = () => useContext(TourContext)

export function TourProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const { parser } = useActiveParser()
  const session = useSession()
  const supabase = useSupabaseClient()

  const [isActive, setIsActive] = useState(false)
  const [stepIndex, setStepIndex] = useState(0)
  const [tourCompleted, setTourCompleted] = useState<boolean | null>(null)
  const fetchedRef = useRef(false)

  const steps = PARSER_TOUR_STEPS
  const currentStep = isActive ? (steps[stepIndex] ?? null) : null

  // Fetch tour_completed from Supabase on mount (once per session)
  useEffect(() => {
    if (!session?.user?.id || fetchedRef.current) return
    fetchedRef.current = true

    // Check localStorage first for instant response
    try {
      if (localStorage.getItem(TOUR_STORAGE_KEY) === "true") {
        setTourCompleted(true)
        return
      }
    } catch {}

    // Then check server
    supabase
      .from("profiles")
      .select("tour_completed")
      .eq("id", session.user.id)
      .single()
      .then(({ data }) => {
        const completed = data?.tour_completed ?? false
        setTourCompleted(completed)
        if (completed) {
          try {
            localStorage.setItem(TOUR_STORAGE_KEY, "true")
          } catch {}
        }
      })
  }, [session?.user?.id, supabase])

  const resolveStepPath = useCallback(
    (step: TourStepConfig) => {
      if (step.absolute) return step.route
      if (!parser) return null
      const basePath = `/parsers/${parser.id}`
      return step.route ? `${basePath}/${step.route}` : basePath
    },
    [parser]
  )

  const navigateToStep = useCallback(
    (step: TourStepConfig) => {
      const targetPath = resolveStepPath(step)
      if (!targetPath) return
      if (pathname !== targetPath) {
        router.push(targetPath)
      }
    },
    [resolveStepPath, pathname, router]
  )

  // Auto-sync step index when user navigates manually during an active tour
  useEffect(() => {
    if (!isActive) return

    // Try to match current pathname against any step
    const matchIndex = steps.findIndex((step) => {
      const stepPath = resolveStepPath(step)
      return stepPath !== null && pathname === stepPath
    })

    if (matchIndex >= 0 && matchIndex !== stepIndex) {
      setStepIndex(matchIndex)
    }
  }, [pathname, isActive, steps, stepIndex, resolveStepPath])

  const hasCompletedTour = useCallback(() => {
    // Use server-fetched state if available, fall back to localStorage
    if (tourCompleted !== null) return tourCompleted
    try {
      return localStorage.getItem(TOUR_STORAGE_KEY) === "true"
    } catch {
      return false
    }
  }, [tourCompleted])

  const startTour = useCallback(() => {
    setStepIndex(0)
    setIsActive(true)
    trackEvent("demo_started", { step_id: "welcome" })
    // Navigate to step 0's route if not already there
    const targetPath = steps[0].absolute ? steps[0].route : null
    if (targetPath && pathname !== targetPath) {
      router.push(targetPath)
    }
  }, [steps, pathname, router])

  const completeTour = useCallback(() => {
    setIsActive(false)
    setStepIndex(0)
    setTourCompleted(true)

    // Persist to localStorage
    try {
      localStorage.setItem(TOUR_STORAGE_KEY, "true")
    } catch {}

    // Persist to Supabase
    if (session?.user?.id) {
      supabase
        .from("profiles")
        .update({ tour_completed: true })
        .eq("id", session.user.id)
        .then(() => {})
    }
  }, [session?.user?.id, supabase])

  const nextStep = useCallback(() => {
    if (stepIndex < steps.length - 1) {
      const next = stepIndex + 1
      const nextStepConfig = steps[next]

      // For parser-relative steps, check if we have a parser.
      // If not (e.g. coming from dashboard welcome), don't navigate yet —
      // the user needs to create a parser first. Just advance the index
      // so auto-sync picks it up after parser creation + navigation.
      if (!nextStepConfig.absolute && !parser) {
        // Skip to overview step — it will auto-sync once user creates
        // a parser and navigates to it
        setStepIndex(next)
        return
      }

      setStepIndex(next)
      navigateToStep(nextStepConfig)
    } else {
      trackEvent("demo_completed", { total_steps: steps.length })
      completeTour()
    }
  }, [stepIndex, steps, navigateToStep, completeTour, parser])

  const prevStep = useCallback(() => {
    if (stepIndex > 0) {
      const prev = stepIndex - 1
      setStepIndex(prev)
      navigateToStep(steps[prev])
    }
  }, [stepIndex, steps, navigateToStep])

  const skipTour = useCallback(() => {
    trackEvent("demo_skipped", {
      skipped_at_step: currentStep?.id ?? "",
      skipped_at_step_index: stepIndex,
    })
    completeTour()
  }, [completeTour, currentStep, stepIndex])

  return (
    <TourContext.Provider
      value={{
        isActive,
        currentStepId: currentStep?.id ?? null,
        currentStepIndex: stepIndex,
        totalSteps: steps.length,
        currentStep,
        startTour,
        nextStep,
        prevStep,
        skipTour,
        hasCompletedTour,
      }}
    >
      {children}
      {/* Subtle backdrop to focus attention on the active step */}
      {isActive && (
        <div className="fixed inset-0 bg-black/20 z-[40] pointer-events-none" />
      )}
    </TourContext.Provider>
  )
}
