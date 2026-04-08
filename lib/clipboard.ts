/**
 * Robust copy-to-clipboard utility.
 *
 * Why this exists:
 * ----------------
 * `navigator.clipboard.writeText()` is the modern API but it rejects in a
 * surprising number of real-world scenarios we see in production:
 *
 *   - Safari when the call isn't in the same task as a user gesture (e.g.
 *     after an `await`, after a `setTimeout`, inside a promise chain).
 *   - iOS Safari when the page has lost focus (tab switch, PiP, etc.).
 *   - Any non-secure context (http://), which we still see from stale ad
 *     destinations and old blog links.
 *   - Cross-origin iframes without the `clipboard-write` permission policy.
 *   - In-app WebViews: Outlook for Mac, Slack, Facebook/Instagram browsers.
 *   - Firefox with `dom.events.asyncClipboard.clipboardItem = false` and
 *     similar hardened profiles.
 *
 * When writeText rejects, it raises `NotAllowedError: Write permission denied`
 * — which then surfaces as an unhandled promise rejection in every call site
 * that forgot a try/catch. That is the literal root cause of issue #65, and
 * the pattern exists in 28+ files. A utility is the only scalable fix.
 *
 * Design:
 * -------
 * 1. Try `navigator.clipboard.writeText` first when we're in a secure context
 *    and the API is present.
 * 2. Fall back to the hidden-textarea + `document.execCommand("copy")`
 *    technique. This works in every browser we care about including all of
 *    the edge cases above except when the page has no focus at all.
 * 3. Never throw. Always return a boolean so the caller can give the user
 *    meaningful feedback ("Copied!" vs "Couldn't copy — press Cmd/Ctrl+C").
 * 4. Never report errors. Clipboard failures are a UX concern, not an
 *    engineering incident — we don't want them in the issue tracker.
 *
 * Usage:
 * ------
 *   if (await copyToClipboard(text)) {
 *     setCopied(true)
 *     setTimeout(() => setCopied(false), 2000)
 *   } else {
 *     toast.error("Couldn't copy automatically — press Cmd/Ctrl+C")
 *   }
 */

/**
 * Attempt to copy the given text to the user's clipboard.
 *
 * Guarantees:
 *   - Never throws.
 *   - Never rejects.
 *   - Returns `true` if either the async clipboard API or the legacy
 *     execCommand fallback succeeded.
 *   - Returns `false` if both strategies failed (very rare; typically
 *     means the page has no focus at all).
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return false
  }

  // Strategy 1: modern async clipboard API. Wrapped in a try/catch because
  // `writeText` rejects on permission issues, stale user gesture, loss of
  // focus, insecure context, and several browser-specific quirks.
  if (
    window.isSecureContext &&
    typeof navigator !== "undefined" &&
    navigator.clipboard?.writeText
  ) {
    try {
      await navigator.clipboard.writeText(text)
      return true
    } catch {
      // Fall through to the execCommand fallback.
    }
  }

  // Strategy 2: hidden-textarea + execCommand fallback. Works in every
  // browser we care about including WebViews and non-secure contexts.
  return copyViaTextarea(text)
}

/**
 * Legacy fallback using a hidden textarea and document.execCommand("copy").
 *
 * This is deprecated in the HTML spec but every browser still implements it
 * and the major in-app WebViews rely on it. It is the only path that works
 * inside Outlook for Mac's embedded browser and several other constrained
 * environments, so we keep it as a first-class fallback rather than a
 * polyfill afterthought.
 */
function copyViaTextarea(text: string): boolean {
  const textarea = document.createElement("textarea")
  textarea.value = text
  // Position off-screen but still in the document flow — fixed + opacity 0
  // keeps it invisible while remaining focusable, which some browsers
  // (notably older Safari) require for execCommand("copy") to succeed.
  textarea.style.position = "fixed"
  textarea.style.top = "0"
  textarea.style.left = "0"
  textarea.style.width = "1px"
  textarea.style.height = "1px"
  textarea.style.padding = "0"
  textarea.style.border = "none"
  textarea.style.outline = "none"
  textarea.style.boxShadow = "none"
  textarea.style.background = "transparent"
  textarea.style.opacity = "0"
  textarea.setAttribute("readonly", "")
  textarea.setAttribute("aria-hidden", "true")

  // Preserve the caller's active element so keyboard focus isn't stolen.
  const previouslyFocused = document.activeElement as HTMLElement | null

  document.body.appendChild(textarea)
  try {
    textarea.focus({ preventScroll: true })
    textarea.select()
    // Some browsers clear the selection unless we set the range explicitly.
    textarea.setSelectionRange(0, text.length)
    // eslint-disable-next-line deprecation/deprecation
    const ok = document.execCommand("copy")
    return ok === true
  } catch {
    return false
  } finally {
    document.body.removeChild(textarea)
    if (previouslyFocused && typeof previouslyFocused.focus === "function") {
      try {
        previouslyFocused.focus({ preventScroll: true })
      } catch {
        // best-effort — some elements can't be refocused
      }
    }
  }
}
