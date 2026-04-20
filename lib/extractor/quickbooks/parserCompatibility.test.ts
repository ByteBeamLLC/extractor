import { describe, expect, it } from "vitest"
import { checkQboParserCompatibility } from "./parserCompatibility"
import type { Parser } from "@/lib/extractor/types"
import type { SchemaField } from "@/lib/schema"

const stringField: SchemaField = { id: "f1", name: "Vendor", type: "string" }

function parserBase(overrides: Partial<Parser> = {}): Pick<Parser, "extraction_type" | "fields"> {
  return {
    extraction_type: "fields",
    fields: [stringField],
    ...overrides,
  }
}

describe("checkQboParserCompatibility", () => {
  it("returns ok for a fields-mode parser with at least one field", () => {
    expect(checkQboParserCompatibility(parserBase())).toEqual({ ok: true })
  })

  it("returns ok for a fields-mode parser with many fields", () => {
    expect(
      checkQboParserCompatibility(
        parserBase({
          fields: [
            { id: "vendor", name: "Vendor", type: "string" },
            { id: "total", name: "Total", type: "number" },
            { id: "date", name: "Date", type: "date" },
          ],
        })
      )
    ).toEqual({ ok: true })
  })

  it("returns full_content reason for a full_content parser even with fields defined", () => {
    // Edge case: parser was previously fields-mode and has leftover fields,
    // but is now switched to full_content. Still incompatible — full_content
    // means QBO can't map.
    expect(
      checkQboParserCompatibility(
        parserBase({
          extraction_type: "full_content",
          fields: [stringField],
        })
      )
    ).toEqual({ ok: false, reason: "full_content" })
  })

  it("returns full_content reason for a full_content parser with no fields", () => {
    expect(
      checkQboParserCompatibility(
        parserBase({ extraction_type: "full_content", fields: [] })
      )
    ).toEqual({ ok: false, reason: "full_content" })
  })

  it("prioritizes full_content over no_fields when both apply", () => {
    // The full_content message is more specific (and the actionable fix is
    // different — switch mode vs add fields). Ensure we surface that one.
    expect(
      checkQboParserCompatibility(
        parserBase({ extraction_type: "full_content", fields: [] })
      )
    ).toEqual({ ok: false, reason: "full_content" })
  })

  it("returns no_fields for a fields-mode parser with empty fields array", () => {
    expect(
      checkQboParserCompatibility(parserBase({ fields: [] }))
    ).toEqual({ ok: false, reason: "no_fields" })
  })

  it("returns no_fields for a fields-mode parser with null fields", () => {
    expect(
      checkQboParserCompatibility(
        parserBase({ fields: null as unknown as SchemaField[] })
      )
    ).toEqual({ ok: false, reason: "no_fields" })
  })

  it("treats null/undefined parser as no_fields (safe default)", () => {
    // The setup component renders before the parser context is loaded; we
    // need to render SOMETHING reasonable rather than crash. Default to the
    // "needs fields" message so the user can navigate away.
    expect(checkQboParserCompatibility(null)).toEqual({ ok: false, reason: "no_fields" })
    expect(checkQboParserCompatibility(undefined)).toEqual({ ok: false, reason: "no_fields" })
  })
})
