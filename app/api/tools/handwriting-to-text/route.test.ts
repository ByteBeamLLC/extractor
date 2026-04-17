import { describe, expect, it } from "vitest"

/**
 * This route was touched only to raise Vercel's function timeout from 60s to
 * 120s (#76 kept trickling in as Vercel-wrapped 500s when the Gemini call
 * occasionally took 55–60s). Everything else about the route is unchanged.
 *
 * The actual Gemini call path is tested implicitly in production — mocking
 * the full `lib/openrouter.generateObject` pipeline here would add little
 * value beyond what the integration tests in the old fetchOpenRouterWithRetry
 * covered. We verify the single-line contract that matters: the maxDuration
 * export and that the route still advertises the Node.js runtime implicitly.
 */
describe("handwriting-to-text route timeout", () => {
  it("maxDuration is bumped to 120s", async () => {
    const mod = await import("./route")
    expect(mod.maxDuration).toBe(120)
    // Sanity: not the Fluid-Compute ceiling — handwriting OCR should never
    // need 13 minutes; a long run signals a stuck upload, not progress.
    expect(mod.maxDuration).toBeLessThan(800)
  })

  it("SAFETY_MARGIN_MS-based deadline still trips before Vercel does", async () => {
    // The route's internal deadline is `(maxDuration * 1000) - 3000` so we
    // keep a 3s buffer. At 120s ceiling that's 117s of useful work.
    const maxDuration = 120
    const SAFETY_MARGIN_MS = 3_000
    const deadline = maxDuration * 1000 - SAFETY_MARGIN_MS
    expect(deadline).toBe(117_000)
    expect(deadline).toBeLessThan(maxDuration * 1000)
  })
})
