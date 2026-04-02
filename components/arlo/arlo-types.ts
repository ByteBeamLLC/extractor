export type ArloAnimation =
  | "idle"
  | "walking"
  | "thinking"
  | "typing"
  | "clicking"
  | "carrying"
  | "celebrating"
  | "sleeping"
  | "waving"

export interface ArloPosition {
  x: number
  y: number
}

export interface ArloMessage {
  id: string
  role: "user" | "arlo"
  content: string
  timestamp: number
  file?: { name: string; type: string; size: number }
}

export interface ArloAction {
  type: "navigate" | "click" | "type" | "upload" | "wait" | "speak" | "celebrate"
  target?: string // data-arlo-id selector
  value?: string // text to type, route to navigate to, message to speak
  duration?: number // ms
  file?: File
}

export interface ArloBrainResponse {
  message: string
  actions: ArloAction[]
  emotion?: "happy" | "excited" | "thinking" | "confused" | "proud"
}

export interface ArloDropZone {
  id: string
  element: HTMLElement
  label: string
  accepts?: string[] // file types
  onDrop?: (file: File) => void
}

export interface ArloContextValue {
  // Visibility
  isVisible: boolean
  isChatOpen: boolean
  toggleChat: () => void

  // Character state
  animation: ArloAnimation
  position: ArloPosition

  // Messages
  messages: ArloMessage[]
  sendMessage: (content: string, file?: File) => Promise<void>
  isProcessing: boolean

  // Automation
  registerDropZone: (zone: ArloDropZone) => void
  unregisterDropZone: (id: string) => void

  // First-time user
  isFirstTimeUser: boolean
  hasGreeted: boolean

  // Actions queue
  currentAction: ArloAction | null
  isExecutingActions: boolean

  // Responsive
  isMobile: boolean
}
