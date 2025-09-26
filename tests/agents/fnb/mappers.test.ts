import { describe, expect, it } from "vitest"

import { mapFnbResults, selectFnbTranslationSource } from "@/features/agents/fnb/mappers"

describe("fnb mappers", () => {
  it("chooses product_initial_language when available", () => {
    const extraction = { product_initial_language: { name: "Label" }, fallback: true }
    expect(selectFnbTranslationSource(extraction)).toEqual({ name: "Label" })
  })

  it("falls back to raw extraction when no localized version exists", () => {
    const extraction = { name: "Label" }
    expect(selectFnbTranslationSource(extraction)).toBe(extraction)
  })

  it("produces UI-friendly result bundles", () => {
    const extraction = { foo: "bar" }
    const translation = { english_product_info: { foo: "bar" } }
    const result = mapFnbResults({ extraction, translation })

    expect(result).toEqual({
      fnb_extraction: extraction,
      fnb_translation: translation,
    })
  })
})
