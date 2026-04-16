import type { SchemaField } from "@/lib/schema"

/**
 * Recursively replaces field-ID keys in extraction results with
 * human-readable field names, using the parser's schema tree.
 */
export function mapResultIdsToNames(
  results: Record<string, any>,
  schemaTree: SchemaField[]
): Record<string, any> {
  const mapped: Record<string, any> = {}

  for (const field of schemaTree) {
    if (field.type === "input") continue
    const value = results[field.id]
    if (value === undefined) continue

    if (
      field.type === "object" &&
      typeof value === "object" &&
      value !== null &&
      !Array.isArray(value)
    ) {
      mapped[field.name] = mapResultIdsToNames(value, field.children)
    } else if (field.type === "table" && Array.isArray(value)) {
      mapped[field.name] = value.map((row) =>
        typeof row === "object" && row !== null
          ? mapResultIdsToNames(row, field.columns)
          : row
      )
    } else if (field.type === "list" && Array.isArray(value)) {
      if (field.item.type === "object") {
        mapped[field.name] = value.map((item) =>
          typeof item === "object" && item !== null
            ? mapResultIdsToNames(item, (field.item as any).children)
            : item
        )
      } else {
        mapped[field.name] = value
      }
    } else {
      mapped[field.name] = value
    }
  }

  return mapped
}
