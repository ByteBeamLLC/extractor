/**
 * Flattens a parser's schema tree into a list of (id, label, isList) entries
 * suitable for the QuickBooks mapping UI dropdowns.
 *
 * Conventions:
 *   - Object children render as "Parent → Child"
 *   - Lists/tables emit themselves as a list-typed entry, plus their row's
 *     primitive children prefixed with "[0]" (so users can map e.g. a single
 *     scalar from inside a list, even though deliver.ts currently only
 *     consumes the list root for line_items).
 *   - Input fields (document/text inputs) are not extractable, so they're
 *     skipped — we never want them in QBO field mapping.
 */

import type { SchemaField } from "@/lib/schema"

export interface FlatField {
  id: string
  label: string
  isList: boolean
}

export function flattenSchema(
  fields: SchemaField[],
  prefix = "",
  parentLabel = ""
): FlatField[] {
  const out: FlatField[] = []
  for (const f of fields) {
    if (f.type === "input") continue
    const id = prefix ? `${prefix}.${f.id}` : f.id
    const label = parentLabel ? `${parentLabel} → ${f.name}` : f.name
    if (f.type === "object") {
      out.push(...flattenSchema(f.children, id, label))
    } else if (f.type === "table") {
      out.push({ id, label, isList: true })
      out.push(...flattenSchema(f.columns, `${id}[0]`, `${label} → row`))
    } else if (f.type === "list") {
      out.push({ id, label, isList: true })
      // For list items, descend into the item's structure directly so the path
      // is e.g. "items[0].desc", not "items[0].row.desc". The wrapping object
      // type holds the row schema but its `id` is internal — exposing it in
      // mapping paths would confuse users and break deliver.ts's resolvePath.
      if (f.item.type === "object") {
        out.push(...flattenSchema(f.item.children, `${id}[0]`, `${label} → row`))
      } else if (f.item.type !== "input") {
        out.push({
          id: `${id}[0]`,
          label: `${label} → ${f.item.name || "value"}`,
          isList: false,
        })
      }
    } else {
      out.push({ id, label, isList: false })
    }
  }
  return out
}
