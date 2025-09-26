import { ensureServerOnly } from "./ensureServerOnly"
import type { SchemaField } from "@/lib/schema/types"

ensureServerOnly("lib/server/resultsSanitize")

const FALLBACK_VALUE = "-"

export function buildFallbackFromTree(fields: SchemaField[] = []): Record<string, any> {
  const out: Record<string, any> = {}
  for (const field of fields) {
    if (field.type === "object") {
      out[field.id] = buildFallbackFromTree((field as any).children || [])
    } else if (field.type === "list" || field.type === "table") {
      out[field.id] = FALLBACK_VALUE
    } else {
      out[field.id] = FALLBACK_VALUE
    }
  }
  return out
}

export function buildFallbackFromFlat(schema: Record<string, any>): Record<string, any> {
  const out: Record<string, any> = {}
  Object.entries(schema || {}).forEach(([key, column]) => {
    if (column?.type === "object" && Array.isArray(column?.children)) {
      out[key] = buildFallbackFromTree(column.children)
    } else {
      out[key] = FALLBACK_VALUE
    }
  })
  return out
}

export function sanitizeResultsFromTree(fields: SchemaField[] = [], raw: any): any {
  const out: Record<string, any> = {}
  for (const field of fields) {
    const value = raw?.[field.id]
    if (field.type === "object") {
      const nextRaw =
        value && typeof value === "object" && !Array.isArray(value) ? value : undefined
      out[field.id] = sanitizeResultsFromTree((field as any).children || [], nextRaw ?? {})
    } else if (field.type === "list" || field.type === "table") {
      if (Array.isArray(value) && value.length > 0) {
        out[field.id] = value
      } else {
        out[field.id] = FALLBACK_VALUE
      }
    } else {
      out[field.id] = normalizeScalarValue(value)
    }
  }
  return out
}

export function sanitizeResultsFromFlat(schema: Record<string, any>, raw: any): any {
  const out: Record<string, any> = {}
  Object.entries(schema || {}).forEach(([key]) => {
    const value = raw?.[key]
    out[key] = normalizeScalarValue(value)
  })
  return out
}

function normalizeScalarValue(value: any): any {
  if (value === undefined || value === null) return FALLBACK_VALUE
  if (typeof value === "string") {
    const trimmed = value.trim()
    return trimmed === "" || trimmed === FALLBACK_VALUE ? FALLBACK_VALUE : value
  }
  if (Array.isArray(value)) {
    return value.length > 0 ? value : FALLBACK_VALUE
  }
  if (typeof value === "object") {
    return Object.keys(value).length > 0 ? value : FALLBACK_VALUE
  }
  if (typeof value === "number" && Number.isNaN(value)) return FALLBACK_VALUE
  return value
}
