function ensureString(value: unknown): string {
  if (typeof value !== "string") return "-"
  const trimmed = value.trim()
  return trimmed.length === 0 ? "-" : trimmed
}

function buildUniqueIdentifierLines(identifiers: any): string[] {
  const items = Array.isArray(identifiers?.uniqueIdentifiers)
    ? identifiers.uniqueIdentifiers
    : []

  return items
    .map((item: any) => {
      const ensure = (value: unknown) => ensureString(value)
      const label = ensure(item?.label)
      const value = ensure(item?.value)
      if (value === "-") return null

      const confidence = typeof item?.confidence === "number"
        ? ` (confidence ${(item.confidence * 100).toFixed(0)}%)`
        : ""
      const source = ensure(item?.sourceExcerpt)
      const evidence = source !== "-" ? `\n• Evidence: ${source}` : ""
      const labelPrefix = label !== "-" ? `${label}: ` : ""
      return `${labelPrefix}${value}${confidence}${evidence}`.trim()
    })
    .filter((entry: string | null): entry is string => typeof entry === "string" && entry.length > 0)
}

function buildReasoningTrace(trace: any): string[] {
  if (!Array.isArray(trace)) return []

  return trace
    .map((entry: any) => {
      const step = ensureString(entry?.step)
      const reasoning = ensureString(entry?.reasoning)
      const evidence = Array.isArray(entry?.evidence) && entry.evidence.length > 0
        ? `Evidence: ${entry.evidence.join("; ")}`
        : ""
      const citations = Array.isArray(entry?.citations) && entry.citations.length > 0
        ? `Citations: ${entry.citations.join(", ")}`
        : ""
      const parts = [
        step === "-" ? null : `Step: ${step}`,
        reasoning === "-" ? null : `Reasoning: ${reasoning}`,
        evidence || null,
        citations || null,
      ].filter((chunk): chunk is string => Boolean(chunk && chunk.trim().length > 0))
      if (parts.length === 0) return null
      return parts.join("\n")
    })
    .filter((entry: string | null): entry is string => Boolean(entry && entry.trim().length > 0))
}

export function mapPharmaResults(payload: any): Record<string, any> {
  const identifiers = payload?.identifiers || {}
  const listing = payload?.listing || {}
  const sections = payload?.sections || {}

  const uniqueIdentifierLines = buildUniqueIdentifierLines(identifiers)
  const uniqueIdentifiersText = uniqueIdentifierLines.length > 0
    ? uniqueIdentifierLines.join("\n\n")
    : "-"

  const diagnostics = Array.isArray(listing?.diagnostics)
    ? listing.diagnostics
        .map((entry: unknown) => (typeof entry === "string" ? entry.trim() : ""))
        .filter((entry: string) => entry.length > 0)
    : []

  const reasoningTrace = buildReasoningTrace(payload?.reasoningTrace)
  const reasoningTraceText = reasoningTrace.length > 0 ? reasoningTrace.join("\n\n") : "-"

  return {
    drug_name: ensureString(identifiers.drugName),
    variant_name: ensureString(identifiers.variant),
    manufacturer: ensureString(identifiers.manufacturer),
    sfda_drug_id: ensureString(listing.drugId),
    sfda_listing_url: ensureString(listing.listingUrl),
    unique_identifiers: uniqueIdentifiersText,
    listing_diagnostics: diagnostics.length > 0 ? diagnostics.join("\n") : "-",
    description: ensureString(sections.description),
    composition: ensureString(sections.composition),
    how_to_use: ensureString(sections.howToUse),
    indication: ensureString(sections.indication),
    possible_side_effects: ensureString(sections.possibleSideEffects),
    properties: ensureString(sections.properties),
    storage: ensureString(sections.storage),
    reasoning_trace: reasoningTraceText,
  }
}

export const __private__ = {
  ensureString,
  buildUniqueIdentifierLines,
  buildReasoningTrace,
}
