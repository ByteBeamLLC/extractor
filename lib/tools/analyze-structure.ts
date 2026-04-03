/**
 * Detects latent structure in extracted handwriting text.
 * Pure regex/code — zero LLM cost.
 *
 * Returns the strongest signal found, or null if the text
 * looks like plain prose (student notes, essays, etc.).
 */

export type StructureSignal = {
  type:
    | "expense_table"
    | "contact_list"
    | "itemized_list"
    | "key_value"
    | "dated_log"
  count: number
  cta: string
  ctaDetail: string
}

/* ── Pattern definitions ────────────────────────────────── */

// Currency amounts: 63.750 tl, ₹1,200, $450, 7.6 Cr, 400 cr+, 18,000 tl
const CURRENCY_RE =
  /(?:[\$€£₹₺¥]\s*[\d,.]+|[\d,.]+\s*(?:tl|TL|rs|Rs|INR|USD|EUR|GBP|cr|Cr|lakh|lakhs|crore|crores))\b/g

// Phone numbers: 10+ digit sequences, optionally with +, (), -, spaces
const PHONE_RE = /(?:\+?\d[\d\s\-().]{7,}\d)/g

// Bullet/list items: lines starting with •, -, *, or "1.", "2." etc.
const BULLET_RE = /^[\t ]*(?:[•\-\*▪▸►→➜]|\d{1,3}[.)]\s)/gm

// Key-value pairs: "Label: value" on its own line (letter followed by word chars, then colon)
const KV_RE = /^[\t ]*\p{L}[\p{L}\p{N}\s]{1,30}:\s+.+$/gmu

// Date patterns: DD/MM/YYYY, DD.MM.YYYY, DD-MM-YYYY, YYYY-MM-DD, Month DD YYYY
const DATE_RE =
  /\b(?:\d{1,2}[\/.\-]\d{1,2}[\/.\-]\d{2,4}|\d{4}[\/.\-]\d{1,2}[\/.\-]\d{1,2}|(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\w*\s+\d{1,2},?\s+\d{4})\b/gi

/* ── Helpers ─────────────────────────────────────────────── */

function countMatches(text: string, re: RegExp): number {
  const matches = text.match(re)
  return matches ? matches.length : 0
}

// Filter phone matches to only those that are plausibly phone numbers
// (at least 7 actual digits after stripping formatting)
function countPhones(text: string): number {
  const matches = text.match(PHONE_RE)
  if (!matches) return 0
  return matches.filter((m) => m.replace(/\D/g, "").length >= 7).length
}

/* ── Main function ──────────────────────────────────────── */

export function analyzeStructure(text: string): StructureSignal | null {
  if (!text || text.length < 50) return null

  const currencies = countMatches(text, CURRENCY_RE)
  const phones = countPhones(text)
  const bullets = countMatches(text, BULLET_RE)
  const kvPairs = countMatches(text, KV_RE)
  const dates = countMatches(text, DATE_RE)

  // Pick the strongest signal (order = conversion likelihood)

  if (currencies >= 3) {
    return {
      type: "expense_table",
      count: currencies,
      cta: `Detected ${currencies} amounts in your document`,
      ctaDetail: "Extract as a structured expense table you can export to spreadsheets",
    }
  }

  if (phones >= 3) {
    return {
      type: "contact_list",
      count: phones,
      cta: `Found ${phones} phone numbers in your text`,
      ctaDetail: "Extract names and numbers as a structured contact list",
    }
  }

  if (kvPairs >= 5) {
    return {
      type: "key_value",
      count: kvPairs,
      cta: `Detected ${kvPairs} data fields in your document`,
      ctaDetail: "Extract as structured key-value data you can export or integrate",
    }
  }

  if (dates >= 4) {
    return {
      type: "dated_log",
      count: dates,
      cta: `Found ${dates} dated entries in your document`,
      ctaDetail: "Extract as a structured timeline or log you can sort and filter",
    }
  }

  if (bullets >= 6) {
    return {
      type: "itemized_list",
      count: bullets,
      cta: `Found ${bullets} list items in your document`,
      ctaDetail: "Extract as structured data you can export to spreadsheets",
    }
  }

  return null
}
