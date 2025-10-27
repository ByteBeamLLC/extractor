import type { ExtractionResultsMeta, FieldReviewMeta } from "@/lib/schema"

export const FALLBACK_VALUE = "-"

export function normalizeScalarValue(value: any): any {
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

export function sanitizeResultsFromTree(fields: any[], raw: any): any {
  const out: Record<string, any> = {}
  for (const field of fields ?? []) {
    const value = raw?.[field.id]
    if (field.type === "object") {
      const nextRaw =
        value && typeof value === "object" && !Array.isArray(value) ? value : undefined
      out[field.id] = sanitizeResultsFromTree(field.children || [], nextRaw ?? {})
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

const META_KEY = "__meta__"

export interface ReviewComputationOptions {
  handledWithFallback?: boolean
  fallbackReason?: string
  warnings?: string[]
  now?: Date
  confidenceThreshold?: number
  confidenceByField?: Record<string, number | null | undefined>
}

export function computeInitialReviewMeta(
  values: Record<string, any>,
  options?: ReviewComputationOptions,
): Record<string, FieldReviewMeta> {
  const nowIso = (options?.now ?? new Date()).toISOString()
  const meta: Record<string, FieldReviewMeta> = {}
  Object.entries(values || {}).forEach(([key, value]) => {
    if (key.startsWith("__")) return
    const providedConfidence = options?.confidenceByField?.[key]
    let confidence: number
    if (typeof providedConfidence === "number" && Number.isFinite(providedConfidence)) {
      confidence = Math.max(0, Math.min(1, providedConfidence))
    } else {
      confidence = 1
    }

    meta[key] = {
      status: "auto_verified",
      updatedAt: nowIso,
      confidence,
      originalValue: value,
    }
  })
  return meta
}

export function mergeResultsWithMeta(
  values: Record<string, any>,
  meta: ExtractionResultsMeta | null | undefined,
): Record<string, any> {
  const payload = { ...(values || {}) }
  if (
    meta &&
    ((meta.review && Object.keys(meta.review).length > 0) ||
      (meta.confidence && Object.keys(meta.confidence).length > 0))
  ) {
    payload[META_KEY] = meta
  } else {
    delete payload[META_KEY]
  }
  return payload
}

export function extractResultsMeta(
  raw: Record<string, any> | null | undefined,
): {
  values: Record<string, any> | undefined
  meta: ExtractionResultsMeta | undefined
} {
  if (!raw || typeof raw !== "object") {
    return { values: raw ?? undefined, meta: undefined }
  }

  const { [META_KEY]: meta, ...rest } = raw as Record<string, any>
  let typedMeta: ExtractionResultsMeta | undefined

  if (meta && typeof meta === "object") {
    const rawReview = (meta as ExtractionResultsMeta).review
    const rawConfidence = (meta as any).confidence
    let confidenceMap: Record<string, number | null> | undefined
    if (Array.isArray(rawConfidence)) {
      confidenceMap = {}
      for (const entry of rawConfidence as any[]) {
        if (!entry || typeof entry !== "object") continue
        const fieldId = typeof entry.fieldId === "string" ? entry.fieldId : null
        const rawValue = (entry as any).value
        if (!fieldId) continue
        const numeric =
          typeof rawValue === "number"
            ? rawValue
            : typeof rawValue === "string"
              ? Number(rawValue)
              : null
        confidenceMap[fieldId] =
          typeof numeric === "number" && Number.isFinite(numeric)
            ? Math.max(0, Math.min(1, numeric))
            : null
      }
    } else if (rawConfidence && typeof rawConfidence === "object") {
      confidenceMap = Object.entries(rawConfidence as Record<string, any>).reduce<
        Record<string, number | null>
      >((acc, [fieldId, rawValue]) => {
        const numeric =
          typeof rawValue === "number"
            ? rawValue
            : typeof rawValue === "string"
              ? Number(rawValue)
              : null
        acc[fieldId] =
          typeof numeric === "number" && Number.isFinite(numeric)
            ? Math.max(0, Math.min(1, numeric))
            : null
        return acc
      }, {})
    }
    const nextMeta: ExtractionResultsMeta = {}
    if (rawReview && typeof rawReview === "object") {
      nextMeta.review = rawReview
    }
    if (confidenceMap && Object.keys(confidenceMap).length > 0) {
      nextMeta.confidence = confidenceMap
    }
    if (Object.keys(nextMeta).length > 0) {
      typedMeta = nextMeta
    }
  }

  return {
    values: rest,
    meta: typedMeta,
  }
}
