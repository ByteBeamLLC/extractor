import { describe, expect, it } from "vitest"

import { mapPharmaResults, __private__ } from "@/features/agents/pharma/mappers"

describe("pharma mappers", () => {
  it("normalises identifiers, sections, and reasoning", () => {
    const payload = {
      identifiers: {
        drugName: " Widget ",
        variant: "",
        manufacturer: null,
        uniqueIdentifiers: [
          {
            label: "Batch",
            value: "A123",
            confidence: 0.92,
            sourceExcerpt: "page 3",
          },
          {
            label: null,
            value: " ",
          },
        ],
      },
      listing: {
        drugId: " SFDA-9 ",
        listingUrl: "https://example.test",
        diagnostics: [" ok  ", 123],
      },
      sections: {
        description: "Desc",
        composition: "Comp",
        howToUse: "Use",
        indication: "Ind",
        possibleSideEffects: "Effects",
        properties: "Props",
        storage: "Store",
      },
      reasoningTrace: [
        {
          step: "Check",
          reasoning: "Matches",
          evidence: ["Doc"],
          citations: ["Ref"],
        },
      ],
    }

    const result = mapPharmaResults(payload)

    expect(result).toEqual({
      drug_name: "Widget",
      variant_name: "-",
      manufacturer: "-",
      sfda_drug_id: "SFDA-9",
      sfda_listing_url: "https://example.test",
      unique_identifiers: "Batch: A123 (confidence 92%)\n• Evidence: page 3",
      listing_diagnostics: "ok",
      description: "Desc",
      composition: "Comp",
      how_to_use: "Use",
      indication: "Ind",
      possible_side_effects: "Effects",
      properties: "Props",
      storage: "Store",
      reasoning_trace: "Step: Check\nReasoning: Matches\nEvidence: Doc\nCitations: Ref",
    })
  })

  it("ensures string helper trims and defaults", () => {
    const { ensureString } = __private__
    expect(ensureString(" test ")).toBe("test")
    expect(ensureString(" ")).toBe("-")
    expect(ensureString(null)).toBe("-")
  })
})
