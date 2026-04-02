"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react"
import { usePathname, useRouter } from "next/navigation"
import type {
  ArloAction,
  ArloAnimation,
  ArloContextValue,
  ArloDropZone,
  ArloMessage,
  ArloPosition,
  ArloBrainResponse,
} from "./arlo-types"
import { executeActions } from "./arlo-actions"
import {
  ARLO_FIRST_TIME_GREETING,
  getRandomPhrase,
  ARLO_GREETINGS,
} from "./arlo-personality"
import { useActiveParser } from "@/components/extractor/parser-context"

const ARLO_GREETED_KEY = "arlo_has_greeted"
const ARLO_VISIBLE_KEY = "arlo_visible"

const ArloContext = createContext<ArloContextValue>({
  isVisible: true,
  isChatOpen: false,
  toggleChat: () => {},
  animation: "idle",
  position: { x: 0, y: 0 },
  messages: [],
  sendMessage: async () => {},
  isProcessing: false,
  registerDropZone: () => {},
  unregisterDropZone: () => {},
  isFirstTimeUser: false,
  hasGreeted: false,
  currentAction: null,
  isExecutingActions: false,
})

export const useArlo = () => useContext(ArloContext)

interface ArloProviderProps {
  children: React.ReactNode
  isFirstTimeUser?: boolean
}

export function ArloProvider({ children, isFirstTimeUser = false }: ArloProviderProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { parser } = useActiveParser()

  // Core state
  const [isVisible, setIsVisible] = useState(true)
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [animation, setAnimation] = useState<ArloAnimation>("idle")
  const [position, setPosition] = useState<ArloPosition>({ x: 0, y: 0 })
  const [messages, setMessages] = useState<ArloMessage[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [hasGreeted, setHasGreeted] = useState(false)
  const [currentAction, setCurrentAction] = useState<ArloAction | null>(null)
  const [isExecutingActions, setIsExecutingActions] = useState(false)

  // Drop zones registry
  const dropZonesRef = useRef<Map<string, ArloDropZone>>(new Map())

  // Pending file for upload actions
  const pendingFileRef = useRef<File | null>(null)

  // Position ref for the action engine
  const positionRef = useRef(position)
  useEffect(() => {
    positionRef.current = position
  }, [position])

  // Initialize position to bottom-right of viewport
  useEffect(() => {
    const initPos = {
      x: window.innerWidth - 100,
      y: window.innerHeight - 100,
    }
    setPosition(initPos)

    // Check visibility preference
    try {
      const hidden = localStorage.getItem(ARLO_VISIBLE_KEY) === "false"
      if (hidden) setIsVisible(false)
    } catch {}
  }, [])

  // Sleep timer — Arlo falls asleep after 2 minutes of no interaction
  const sleepTimerRef = useRef<ReturnType<typeof setTimeout>>()
  const resetSleepTimer = useCallback(() => {
    if (animation === "sleeping") setAnimation("idle")
    clearTimeout(sleepTimerRef.current)
    sleepTimerRef.current = setTimeout(() => {
      if (!isChatOpen && !isExecutingActions) {
        setAnimation("sleeping")
      }
    }, 120_000) // 2 minutes
  }, [isChatOpen, isExecutingActions, animation])

  useEffect(() => {
    resetSleepTimer()
    return () => clearTimeout(sleepTimerRef.current)
  }, [resetSleepTimer])

  // First-time user greeting
  useEffect(() => {
    if (!isFirstTimeUser || hasGreeted) return

    try {
      if (localStorage.getItem(ARLO_GREETED_KEY) === "true") {
        setHasGreeted(true)
        return
      }
    } catch {}

    // Delay greeting so the page renders first
    const timer = setTimeout(() => {
      setAnimation("waving")
      setMessages([
        {
          id: crypto.randomUUID(),
          role: "arlo",
          content: ARLO_FIRST_TIME_GREETING,
          timestamp: Date.now(),
        },
      ])
      setIsChatOpen(true)
      setHasGreeted(true)

      try {
        localStorage.setItem(ARLO_GREETED_KEY, "true")
      } catch {}

      // Return to idle after waving
      setTimeout(() => setAnimation("idle"), 3000)
    }, 1500)

    return () => clearTimeout(timer)
  }, [isFirstTimeUser, hasGreeted])

  // Toggle chat
  const toggleChat = useCallback(() => {
    setIsChatOpen((prev) => {
      const next = !prev
      if (next) {
        resetSleepTimer()
        // If no messages yet, add a greeting
        if (messages.length === 0) {
          setMessages([
            {
              id: crypto.randomUUID(),
              role: "arlo",
              content: getRandomPhrase(ARLO_GREETINGS),
              timestamp: Date.now(),
            },
          ])
        }
      }
      return next
    })
  }, [messages.length, resetSleepTimer])

  // Register / unregister drop zones
  const registerDropZone = useCallback((zone: ArloDropZone) => {
    dropZonesRef.current.set(zone.id, zone)
  }, [])

  const unregisterDropZone = useCallback((id: string) => {
    dropZonesRef.current.delete(id)
  }, [])

  // Send message to Arlo
  const sendMessage = useCallback(
    async (content: string, file?: File) => {
      resetSleepTimer()

      // Add user message
      const userMsg: ArloMessage = {
        id: crypto.randomUUID(),
        role: "user",
        content,
        timestamp: Date.now(),
        file: file ? { name: file.name, type: file.type, size: file.size } : undefined,
      }
      setMessages((prev) => [...prev, userMsg])

      // Store file for potential upload action
      if (file) pendingFileRef.current = file

      setIsProcessing(true)
      setAnimation("thinking")

      try {
        const res = await fetch("/api/arlo/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: content,
            history: messages.slice(-8).map((m) => ({
              role: m.role,
              content: m.content,
              file: m.file,
            })),
            context: {
              currentPath: pathname,
              hasParser: !!parser,
              parserId: parser?.id,
              parserName: parser?.name,
              parserFieldCount: parser?.fields?.length,
              parserDocCount: parser?.document_count,
              isFirstTimeUser,
              hasFile: !!file,
              fileName: file?.name,
            },
          }),
        })

        const data: ArloBrainResponse = await res.json()

        // Add Arlo's response
        const arloMsg: ArloMessage = {
          id: crypto.randomUUID(),
          role: "arlo",
          content: data.message,
          timestamp: Date.now(),
        }
        setMessages((prev) => [...prev, arloMsg])
        setAnimation("idle")
        setIsProcessing(false)

        // Execute actions if any
        if (data.actions && data.actions.length > 0) {
          setIsExecutingActions(true)

          await executeActions(data.actions, {
            onNavigate: (path) => router.push(path),
            onPositionChange: (pos) => setPosition(pos),
            onAnimationChange: (anim) => setAnimation(anim as ArloAnimation),
            onSpeak: (message) => {
              setMessages((prev) => [
                ...prev,
                {
                  id: crypto.randomUUID(),
                  role: "arlo",
                  content: message,
                  timestamp: Date.now(),
                },
              ])
            },
            onActionStart: (action) => setCurrentAction(action),
            onActionEnd: () => setCurrentAction(null),
            getCurrentPosition: () => positionRef.current,
            getDropZones: () => dropZonesRef.current,
            pendingFile: pendingFileRef.current,
          })

          pendingFileRef.current = null
          setIsExecutingActions(false)

          // Return to default position after actions
          setTimeout(() => {
            setPosition({
              x: window.innerWidth - 100,
              y: window.innerHeight - 100,
            })
          }, 1000)
        }
      } catch (error) {
        console.error("[Arlo] Chat error:", error)
        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: "arlo",
            content: "Oops, I tripped over something. Can you try that again?",
            timestamp: Date.now(),
          },
        ])
        setAnimation("idle")
        setIsProcessing(false)
      }
    },
    [messages, pathname, parser, isFirstTimeUser, router, resetSleepTimer]
  )

  return (
    <ArloContext.Provider
      value={{
        isVisible,
        isChatOpen,
        toggleChat,
        animation,
        position,
        messages,
        sendMessage,
        isProcessing,
        registerDropZone,
        unregisterDropZone,
        isFirstTimeUser,
        hasGreeted,
        currentAction,
        isExecutingActions,
      }}
    >
      {children}
    </ArloContext.Provider>
  )
}
