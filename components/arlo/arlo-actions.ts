/**
 * Arlo UI Automation Engine
 *
 * Finds elements by data-arlo-id, calculates positions for Arlo to walk to,
 * and programmatically interacts with the UI (click, type, navigate, upload).
 */

import type { ArloAction, ArloDropZone, ArloPosition } from "./arlo-types"

/** Find a DOM element by its data-arlo-id attribute */
export function findArloElement(arloId: string): HTMLElement | null {
  return document.querySelector(`[data-arlo-id="${arloId}"]`)
}

/** Get the center position of an element relative to the viewport */
export function getElementCenter(el: HTMLElement): ArloPosition {
  const rect = el.getBoundingClientRect()
  return {
    x: rect.left + rect.width / 2,
    y: rect.top + rect.height / 2,
  }
}

/** Get a position just above an element (where Arlo would "land"), clamped to viewport */
export function getElementTopPosition(el: HTMLElement, arloSize: number = 64): ArloPosition {
  const rect = el.getBoundingClientRect()
  const vw = window.innerWidth
  const vh = window.innerHeight

  // Position above the element by default
  let x = rect.left + rect.width / 2 - arloSize / 2
  let y = rect.top - arloSize - 8

  // If not enough room above, position to the side or below
  if (y < 8) {
    y = rect.bottom + 8
  }

  // Clamp to viewport bounds with padding
  x = Math.max(8, Math.min(vw - arloSize - 8, x))
  y = Math.max(8, Math.min(vh - arloSize - 8, y))

  return { x, y }
}

/** Calculate distance between two positions */
export function getDistance(a: ArloPosition, b: ArloPosition): number {
  return Math.sqrt(Math.pow(b.x - a.x, 2) + Math.pow(b.y - a.y, 2))
}

/** Calculate walk duration based on distance (pixels -> ms). Min 400ms, max 2000ms */
export function getWalkDuration(from: ArloPosition, to: ArloPosition): number {
  const dist = getDistance(from, to)
  // ~300px/sec speed
  const duration = (dist / 300) * 1000
  return Math.max(400, Math.min(2000, duration))
}

/** Find the nearest registered drop zone to a given position */
export function findNearestDropZone(
  zones: Map<string, ArloDropZone>,
  position: ArloPosition
): ArloDropZone | null {
  let nearest: ArloDropZone | null = null
  let nearestDist = Infinity

  for (const zone of zones.values()) {
    if (!zone.element.isConnected) continue
    const center = getElementCenter(zone.element)
    const dist = getDistance(position, center)
    if (dist < nearestDist) {
      nearestDist = dist
      nearest = zone
    }
  }

  return nearest
}

/** Find any drop zone visible on the current page */
export function findPageDropZone(): HTMLElement | null {
  // Priority order: main upload zone first, then sidebar
  const mainZone = findArloElement("main-upload-zone")
  if (mainZone && mainZone.offsetParent !== null) return mainZone

  const sidebarZone = findArloElement("sidebar-upload-zone")
  if (sidebarZone && sidebarZone.offsetParent !== null) return sidebarZone

  return null
}

/** Programmatically click an element with a visual highlight */
export async function clickElement(arloId: string): Promise<boolean> {
  const el = findArloElement(arloId)
  if (!el) return false

  // Add a brief highlight effect
  el.style.transition = "box-shadow 0.3s ease"
  el.style.boxShadow = "0 0 0 3px rgba(245, 182, 66, 0.5)"

  await sleep(200)

  // Trigger click
  el.click()

  // Remove highlight after a moment
  await sleep(500)
  el.style.boxShadow = ""

  return true
}

/** Programmatically type into an input element, character by character */
export async function typeIntoElement(arloId: string, text: string): Promise<boolean> {
  const el = findArloElement(arloId)
  if (!el) return false

  // Focus the element
  if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
    el.focus()

    // Add highlight
    el.style.transition = "box-shadow 0.3s ease"
    el.style.boxShadow = "0 0 0 3px rgba(245, 182, 66, 0.5)"

    // Type character by character
    for (let i = 0; i < text.length; i++) {
      const currentValue = el.value + text[i]

      // Use native input setter to trigger React's onChange
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype,
        "value"
      )?.set || Object.getOwnPropertyDescriptor(
        window.HTMLTextAreaElement.prototype,
        "value"
      )?.set

      if (nativeInputValueSetter) {
        nativeInputValueSetter.call(el, currentValue)
      }

      el.dispatchEvent(new Event("input", { bubbles: true }))
      el.dispatchEvent(new Event("change", { bubbles: true }))

      // Typing speed: 30-60ms per character
      await sleep(30 + Math.random() * 30)
    }

    // Remove highlight
    await sleep(300)
    el.style.boxShadow = ""

    return true
  }

  return false
}

/** Upload a file directly via the extract API, bypassing DOM events */
export async function uploadFileViaApi(parserId: string, file: File): Promise<boolean> {
  const arrayBuffer = await file.arrayBuffer()
  const base64 = btoa(
    new Uint8Array(arrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), "")
  )

  const res = await fetch(`/api/parsers/${parserId}/extract`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      file: { name: file.name, type: file.type, data: base64, size: file.size },
      file_name: file.name,
      file_type: file.type,
      file_size: file.size,
      source_type: "upload",
    }),
  })

  return res.ok
}

/** Sleep helper */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/** Poll for a DOM element by data-arlo-id until it appears or timeout */
export async function waitForElement(
  arloId: string,
  timeoutMs: number = 5000,
  intervalMs: number = 200
): Promise<HTMLElement | null> {
  const start = Date.now()
  while (Date.now() - start < timeoutMs) {
    const el = findArloElement(arloId)
    if (el && el.offsetParent !== null) return el
    await sleep(intervalMs)
  }
  return findArloElement(arloId) // last attempt
}

/**
 * Execute a sequence of Arlo actions with callbacks for animation state changes.
 */
export async function executeActions(
  actions: ArloAction[],
  callbacks: {
    onNavigate: (path: string) => void
    onPositionChange: (pos: ArloPosition) => void
    onAnimationChange: (anim: string) => void
    onSpeak: (message: string) => void
    onActionStart: (action: ArloAction, index: number) => void
    onActionEnd: (action: ArloAction, index: number) => void
    onCloseChat: () => void
    getCurrentPosition: () => ArloPosition
    getDropZones: () => Map<string, ArloDropZone>
    pendingFile: File | null
    parserId: string | null
  }
): Promise<void> {
  // Close chat panel while executing actions
  callbacks.onCloseChat()

  for (let i = 0; i < actions.length; i++) {
    const action = actions[i]
    callbacks.onActionStart(action, i)

    switch (action.type) {
      case "navigate": {
        if (action.value) {
          callbacks.onAnimationChange("walking")
          await sleep(300)
          callbacks.onNavigate(action.value)
          await sleep(800) // Wait for page transition
          callbacks.onAnimationChange("idle")
        }
        break
      }

      case "click": {
        if (action.target) {
          const el = await waitForElement(action.target)
          if (el) {
            // Walk to the element
            const targetPos = getElementTopPosition(el)
            const walkTime = getWalkDuration(callbacks.getCurrentPosition(), targetPos)
            callbacks.onAnimationChange("walking")
            callbacks.onPositionChange(targetPos)
            await sleep(walkTime)

            // Click it
            callbacks.onAnimationChange("clicking")
            await clickElement(action.target)
            await sleep(400)
            callbacks.onAnimationChange("idle")
          }
        }
        break
      }

      case "type": {
        if (action.target && action.value) {
          const el = await waitForElement(action.target)
          if (el) {
            // Walk to the input
            const targetPos = getElementTopPosition(el)
            const walkTime = getWalkDuration(callbacks.getCurrentPosition(), targetPos)
            callbacks.onAnimationChange("walking")
            callbacks.onPositionChange(targetPos)
            await sleep(walkTime)

            // Type into it
            callbacks.onAnimationChange("typing")
            await typeIntoElement(action.target, action.value)
            await sleep(300)
            callbacks.onAnimationChange("idle")
          }
        }
        break
      }

      case "upload": {
        const file = callbacks.pendingFile
        const parserId = callbacks.parserId
        if (file && parserId) {
          callbacks.onAnimationChange("carrying")
          await sleep(600)

          // Upload directly via the extract API
          callbacks.onAnimationChange("thinking")
          const ok = await uploadFileViaApi(parserId, file)
          if (ok) {
            callbacks.onAnimationChange("celebrating")
            callbacks.onSpeak("Document uploaded! Refreshing...")
            await sleep(1000)
            // Navigate to documents page to show the result
            callbacks.onNavigate(`/parsers/${parserId}/documents`)
            await sleep(800)
            callbacks.onAnimationChange("idle")
          } else {
            callbacks.onAnimationChange("idle")
            callbacks.onSpeak("Hmm, the upload didn't go through. Try uploading manually?")
            await sleep(1500)
          }
        }
        break
      }

      case "wait": {
        await sleep(action.duration ?? 1000)
        break
      }

      case "speak": {
        if (action.value) {
          callbacks.onSpeak(action.value)
          await sleep(2000)
        }
        break
      }

      case "celebrate": {
        callbacks.onAnimationChange("celebrating")
        await sleep(1500)
        callbacks.onAnimationChange("idle")
        break
      }
    }

    callbacks.onActionEnd(action, i)
  }
}
