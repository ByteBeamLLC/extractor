/**
 * Waterfall transformation runner.
 *
 * After base extraction, transformation fields are processed in waves.
 * Each wave runs its fields in parallel, and results are merged back
 * into the document after each wave completes.
 *
 * Supported transformation types:
 *   - gemini_api: AI-powered enrichment using the LLM
 *   - classification: Classify a value into predefined categories
 *   - calculation: Evaluate a formula referencing other field values
 *   - currency_conversion: Convert a numeric value to a target currency
 *   - custom: Run a custom AI prompt to derive a value
 */

import { generateText } from "@/lib/openrouter"
import type {
  SchemaField,
  SchemaFieldBase,
  TransformationType,
} from "@/lib/schema"

export interface TransformationField {
  id: string
  name: string
  transformationType: TransformationType
  transformationConfig: any
  transformationSource?: "document" | "column"
  transformationSourceColumnId?: string
}

/** Extract transformation fields from a schema tree (top-level only for now). */
export function getTransformationFields(
  fields: SchemaField[]
): TransformationField[] {
  const out: TransformationField[] = []
  for (const f of fields) {
    const base = f as SchemaFieldBase
    if (base.isTransformation && base.transformationType) {
      out.push({
        id: base.id,
        name: base.name,
        transformationType: base.transformationType,
        transformationConfig: base.transformationConfig ?? {},
        transformationSource: base.transformationSource,
        transformationSourceColumnId: base.transformationSourceColumnId,
      })
    }
  }
  return out
}

/**
 * Organize transformation fields into ordered waves.
 *
 * Wave 0: fields sourced from the document (no dependency on other transformations)
 * Wave 1+: fields sourced from a column that is itself a transformation
 *
 * For simplicity, we currently support two waves. Fields that depend on
 * another transformation field go into wave 1; everything else is wave 0.
 */
export function buildWaves(
  transformationFields: TransformationField[]
): TransformationField[][] {
  const tfIds = new Set(transformationFields.map((f) => f.id))

  const wave0: TransformationField[] = []
  const wave1: TransformationField[] = []

  for (const tf of transformationFields) {
    if (
      tf.transformationSource === "column" &&
      tf.transformationSourceColumnId &&
      tfIds.has(tf.transformationSourceColumnId)
    ) {
      wave1.push(tf)
    } else {
      wave0.push(tf)
    }
  }

  const waves: TransformationField[][] = []
  if (wave0.length > 0) waves.push(wave0)
  if (wave1.length > 0) waves.push(wave1)
  return waves
}

/**
 * Run a single transformation field and return its enriched value.
 */
export async function runTransformation(
  tf: TransformationField,
  baseResults: Record<string, any>
): Promise<any> {
  const config = tf.transformationConfig ?? {}

  switch (tf.transformationType) {
    case "classification":
      return runClassification(tf, baseResults, config)
    case "calculation":
      return runCalculation(tf, baseResults, config)
    case "currency_conversion":
      return runCurrencyConversion(tf, baseResults, config)
    case "gemini_api":
    case "custom":
      return runAITransformation(tf, baseResults, config)
    default:
      return null
  }
}

// ---------------------------------------------------------------------------
// Individual transformation runners
// ---------------------------------------------------------------------------

async function runClassification(
  tf: TransformationField,
  baseResults: Record<string, any>,
  config: any
): Promise<string> {
  const categories: string[] = config.categories ?? []
  const sourceValue = resolveSourceValue(tf, baseResults)

  if (categories.length === 0 || sourceValue == null) return ""

  const { text } = await generateText({
    temperature: 0.1,
    messages: [
      {
        role: "user",
        content: `Classify the following value into one of these categories: ${categories.join(", ")}.\n\nValue: ${String(sourceValue)}\n\nRespond with ONLY the category name, nothing else.`,
      },
    ],
  })

  return text.trim()
}

async function runCalculation(
  tf: TransformationField,
  baseResults: Record<string, any>,
  config: any
): Promise<string | number> {
  const formula: string = config.formula ?? ""
  if (!formula) return ""

  // Build context of available field values
  const context = Object.entries(baseResults)
    .filter(([k]) => !k.startsWith("__"))
    .map(([k, v]) => `${k} = ${JSON.stringify(v)}`)
    .join("\n")

  const { text } = await generateText({
    temperature: 0,
    messages: [
      {
        role: "user",
        content: `Given these field values:\n${context}\n\nEvaluate this formula: ${formula}\n\nRespond with ONLY the numeric result. If you cannot compute it, respond with "N/A".`,
      },
    ],
  })

  const num = Number(text.trim())
  return isNaN(num) ? text.trim() : num
}

async function runCurrencyConversion(
  tf: TransformationField,
  baseResults: Record<string, any>,
  config: any
): Promise<string | number> {
  const sourceValue = resolveSourceValue(tf, baseResults)
  const targetCurrency: string = config.target_currency ?? "USD"

  if (sourceValue == null) return ""

  const { text } = await generateText({
    temperature: 0,
    messages: [
      {
        role: "user",
        content: `Convert this monetary value to ${targetCurrency}: "${String(sourceValue)}"\n\nRespond with ONLY the numeric amount in ${targetCurrency}. If you cannot determine the conversion, respond with the original value.`,
      },
    ],
  })

  const num = Number(text.trim())
  return isNaN(num) ? text.trim() : num
}

async function runAITransformation(
  tf: TransformationField,
  baseResults: Record<string, any>,
  config: any
): Promise<string> {
  const prompt: string = config.prompt ?? config.instruction ?? ""
  if (!prompt) return ""

  const sourceValue = resolveSourceValue(tf, baseResults)

  // Build context from all base results
  const context = Object.entries(baseResults)
    .filter(([k]) => !k.startsWith("__"))
    .map(([k, v]) => `${k}: ${JSON.stringify(v)}`)
    .join("\n")

  const { text } = await generateText({
    temperature: 0.2,
    messages: [
      {
        role: "user",
        content: `${prompt}\n\nExtracted data:\n${context}${
          sourceValue != null ? `\n\nSource value: ${String(sourceValue)}` : ""
        }\n\nProvide only the result, no explanation.`,
      },
    ],
  })

  return text.trim()
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function resolveSourceValue(
  tf: TransformationField,
  results: Record<string, any>
): any {
  if (tf.transformationSource === "column" && tf.transformationSourceColumnId) {
    return results[tf.transformationSourceColumnId] ?? null
  }
  // "document" source or unspecified — no single source value
  return null
}
