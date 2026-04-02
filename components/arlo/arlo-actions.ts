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

/** Get a position just above an element (where Arlo would "land") */
export function getElementTopPosition(el: HTMLElement, arloSize: number = 64): ArloPosition {
  const rect = el.getBoundingClientRect()
  return {
    x: rect.left + rect.width / 2 - arloSize / 2,
    y: rect.top - arloSize - 8,
  }
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

/** Programmatically trigger a file upload on a drop zone */
export async function uploadToDropZone(arloId: string, file: File): Promise<boolean> {
  const el = findArloElement(arloId)
  if (!el) return false

  // Find the file input within or near the drop zone
  const fileInput = el.querySelector('input[type="file"]') as HTMLInputElement | null
  if (fileInput) {
    // Create a DataTransfer to set files
    const dt = new DataTransfer()
    dt.items.add(file)
    fileInput.files = dt.files
    fileInput.dispatchEvent(new Event("change", { bubbles: true }))
    return true
  }

  // Fallback: simulate a drop event
  const dropEvent = new DragEvent("drop", {
    bubbles: true,
    cancelable: true,
    dataTransfer: createDataTransfer(file),
  })
  el.dispatchEvent(new DragEvent("dragover", { bubbles: true, cancelable: true }))
  el.dispatchEvent(dropEvent)
  return true
}

/** Create a DataTransfer with a file */
function createDataTransfer(file: File): DataTransfer {
  const dt = new DataTransfer()
  dt.items.add(file)
  return dt
}

/** Sleep helper */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
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
    getCurrentPosition: () => ArloPosition
    getDropZones: () => Map<string, ArloDropZone>
    pendingFile: File | null
  }
): Promise<void> {
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
          const el = findArloElement(action.target)
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
          const el = findArloElement(action.target)
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
        if (file) {
          // Find the nearest drop zone
          const dropZone = action.target
            ? findArloElement(action.target)
            : findPageDropZone()

          if (dropZone) {
            const targetPos = getElementTopPosition(dropZone)
            const walkTime = getWalkDuration(callbacks.getCurrentPosition(), targetPos)

            // Pick up the document
            callbacks.onAnimationChange("carrying")
            await sleep(400)

            // Walk to the drop zone
            callbacks.onPositionChange(targetPos)
            await sleep(walkTime)

            // Drop the file
            callbacks.onAnimationChange("clicking")
            const arloId = dropZone.getAttribute("data-arlo-id")
            if (arloId) {
              await uploadToDropZone(arloId, file)
            }
            await sleep(500)
            callbacks.onAnimationChange("celebrating")
            await sleep(800)
            callbacks.onAnimationChange("idle")
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
