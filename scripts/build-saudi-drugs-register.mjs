#!/usr/bin/env node
/**
 * Compacts the Saudi market drugs JSONL into a knowledge-hub-friendly digest.
 *
 * Source: /Users/talalbazerbachi/Documents/GitHub/sfda-sdi-submisions/pharma_drugs/drugs.jsonl
 *   (12,796 SFDA drug rows, scraped from sdi.sfda.gov.sa)
 *
 * Output: data/saudi-drugs-register.md — a markdown file the user uploads once
 *   to the Bytebeam Knowledge Hub. The "Drug Trade Name Conflict Checker (SFDA)"
 *   schema references it via `{kb:Saudi Drug Register}` in transformation prompts.
 *
 * Strategy:
 *   - Group by scientific_name (INN). For each INN, list the unique trade_stems
 *     and their dominant ATC code. ~2,365 INN groups, fits well under the
 *     transformation runtime's 100K-token knowledge-context cap.
 *   - Append a flat alphabetical index of every unique trade_stem in the market
 *     so the LLM can also do a quick "is this stem already taken anywhere?"
 *     lookup without scanning every INN.
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = resolve(__dirname, "..")

const SOURCE =
  process.env.SAUDI_DRUGS_JSONL ||
  "/Users/talalbazerbachi/Documents/GitHub/sfda-sdi-submisions/pharma_drugs/drugs.jsonl"
const OUT = resolve(REPO_ROOT, "data/saudi-drugs-register.md")

function normalizeStem(stem) {
  return (stem || "").trim().toUpperCase().replace(/\s+/g, " ")
}

function normalizeInn(inn) {
  return (inn || "UNKNOWN INN").trim().toUpperCase().replace(/\s+/g, " ")
}

function pickDominant(map) {
  let best = null
  let bestCount = -1
  for (const [k, v] of map) {
    if (v > bestCount) {
      best = k
      bestCount = v
    }
  }
  return best
}

const raw = readFileSync(SOURCE, "utf8")
const rows = raw.split("\n").filter(Boolean).map((l) => JSON.parse(l))

/** Map<inn, { atcCounts: Map<atc,count>, stems: Set<stem> }> */
const byInn = new Map()
const allStems = new Set()

for (const r of rows) {
  const inn = normalizeInn(r.scientific_name)
  const stem = normalizeStem(r.trade_stem)
  const atc = (r.atc_code_1 || "").trim().toUpperCase()

  if (!byInn.has(inn)) {
    byInn.set(inn, { atcCounts: new Map(), stems: new Set() })
  }
  const entry = byInn.get(inn)
  if (atc) entry.atcCounts.set(atc, (entry.atcCounts.get(atc) || 0) + 1)
  if (stem) {
    entry.stems.add(stem)
    allStems.add(stem)
  }
}

const innKeys = Array.from(byInn.keys()).sort()

const lines = []
lines.push("# Saudi Drug Market — Compact Register")
lines.push("")
lines.push(
  `Snapshot of every drug currently registered with the Saudi FDA (sdi.sfda.gov.sa). Compiled from ${rows.length.toLocaleString()} drug records into ${innKeys.length.toLocaleString()} INN groups.`
)
lines.push("")
lines.push(
  "Use this register to (a) understand which trade-stems are already taken in the Saudi market and (b) see how brands are conventionally named within each therapeutic class. Format below: each line is one INN with its dominant ATC code and the comma-separated set of trade-stems already registered against it."
)
lines.push("")
lines.push("## INN → registered trade stems")
lines.push("")

for (const inn of innKeys) {
  const { atcCounts, stems } = byInn.get(inn)
  const dominantAtc = pickDominant(atcCounts)
  const stemList = Array.from(stems).sort().join(", ")
  const atcSuffix = dominantAtc ? ` [ATC ${dominantAtc}]` : ""
  lines.push(`- **${inn}**${atcSuffix} :: ${stemList || "(no stems recorded)"}`)
}

lines.push("")
lines.push("## All trade stems registered in the Saudi market (alphabetical)")
lines.push("")
lines.push(
  "Quick lookup of every brand stem already in use across all INNs. A proposed new name should not match any of these on either an orthographic or phonetic axis."
)
lines.push("")
const sortedStems = Array.from(allStems).sort()
lines.push(sortedStems.join(", "))
lines.push("")

const out = lines.join("\n")
mkdirSync(dirname(OUT), { recursive: true })
writeFileSync(OUT, out, "utf8")

const tokens = Math.round(out.length / 4)
console.log(`Wrote ${OUT}`)
console.log(`Bytes: ${(out.length / 1024).toFixed(0)} KB`)
console.log(`Approx tokens: ${tokens.toLocaleString()}`)
console.log(`INNs: ${innKeys.length.toLocaleString()}, unique stems: ${sortedStems.length.toLocaleString()}`)
