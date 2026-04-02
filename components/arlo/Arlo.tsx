"use client"

import { useEffect, useRef, useState } from "react"
import { ArloCharacter } from "./ArloCharacter"
import { ArloChat } from "./ArloChat"
import { useArlo } from "./ArloProvider"

/**
 * The main Arlo component.
 *
 * Renders the animated dog character floating on screen with a chat panel.
 * Arlo moves across the viewport using CSS transitions when executing actions.
 */
export function Arlo() {
  const {
    isVisible,
    isChatOpen,
    toggleChat,
    animation,
    position,
    messages,
    sendMessage,
    isProcessing,
    isExecutingActions,
  } = useArlo()

  const [speechBubble, setSpeechBubble] = useState<string | null>(null)
  const speechTimerRef = useRef<ReturnType<typeof setTimeout>>()

  // Show a brief speech bubble when Arlo adds a message during actions
  useEffect(() => {
    if (!isExecutingActions || messages.length === 0) return
    const lastMsg = messages[messages.length - 1]
    if (lastMsg.role === "arlo" && !isChatOpen) {
      setSpeechBubble(lastMsg.content)
      clearTimeout(speechTimerRef.current)
      speechTimerRef.current = setTimeout(() => setSpeechBubble(null), 4000)
    }
  }, [messages, isExecutingActions, isChatOpen])

  if (!isVisible) return null

  return (
    <>
      {/* Arlo's floating container */}
      <div
        className="fixed z-[9999] pointer-events-none"
        style={{
          left: position.x,
          top: position.y,
          transition: isExecutingActions
            ? "left 0.8s cubic-bezier(0.34, 1.56, 0.64, 1), top 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)"
            : "left 0.3s ease, top 0.3s ease",
        }}
      >
        {/* Speech bubble (shown during actions when chat is closed) */}
        {speechBubble && !isChatOpen && (
          <div
            className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-background border rounded-xl shadow-lg text-sm max-w-[200px] text-center pointer-events-auto animate-in fade-in slide-in-from-bottom-2 duration-300"
          >
            {speechBubble}
            {/* Triangle pointer */}
            <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-r-[6px] border-t-[6px] border-l-transparent border-r-transparent border-t-border" />
          </div>
        )}

        {/* The character */}
        <div className="pointer-events-auto">
          <ArloCharacter
            animation={animation}
            size={64}
            onClick={toggleChat}
          />
        </div>

        {/* Chat panel (anchored to the character) */}
        {isChatOpen && (
          <div
            className="absolute pointer-events-auto animate-in fade-in slide-in-from-bottom-4 duration-200"
            style={{
              bottom: "calc(100% + 12px)",
              right: 0,
            }}
          >
            <ArloChat
              messages={messages}
              isProcessing={isProcessing}
              onSendMessage={sendMessage}
              onClose={toggleChat}
            />
          </div>
        )}
      </div>

      {/* Arlo action overlay — dims the screen slightly during UI automation */}
      {isExecutingActions && (
        <div className="fixed inset-0 bg-black/5 z-[9998] pointer-events-none transition-opacity duration-300" />
      )}

      {/* Global styles for Arlo's movement trail */}
      <style>{`
        @keyframes arlo-trail-dot {
          0% { opacity: 0.6; transform: scale(1); }
          100% { opacity: 0; transform: scale(0); }
        }
      `}</style>
    </>
  )
}
