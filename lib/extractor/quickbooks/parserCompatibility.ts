/**
 * Determine whether a parser can drive a QuickBooks integration.
 *
 * QBO needs structured fields (vendor name, total, etc.) to build Bills,
 * Invoices, and Receipts. Two parser configurations are incompatible:
 *
 *   1. `extraction_type === "full_content"` — the parser captures raw
 *      document text rather than a structured object. There's no path to
 *      map raw text to QBO entity fields.
 *
 *   2. `extraction_type === "fields"` but `fields.length === 0` — the
 *      parser is in the right mode but has no fields defined yet.
 *
 * The UI uses this to gate the QuickBooks setup BEFORE OAuth so users don't
 * waste a round-trip discovering their parser is unusable. A null/undefined
 * parser is treated as `no_fields` (the safe default — render the same "needs
 * fields" message as if the parser had an empty schema).
 */

import type { Parser } from "@/lib/extractor/types"

export type QboCompatibilityCheck =
  | { ok: true }
  | { ok: false; reason: "full_content" | "no_fields" }

export function checkQboParserCompatibility(
  parser: Pick<Parser, "extraction_type" | "fields"> | null | undefined
): QboCompatibilityCheck {
  if (!parser) return { ok: false, reason: "no_fields" }
  if (parser.extraction_type === "full_content") {
    return { ok: false, reason: "full_content" }
  }
  if (!parser.fields || parser.fields.length === 0) {
    return { ok: false, reason: "no_fields" }
  }
  return { ok: true }
}
