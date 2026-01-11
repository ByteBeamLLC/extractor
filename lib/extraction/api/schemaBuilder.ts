/**
 * Schema building utilities for creating Zod schemas from extraction schemas
 */

import { z } from "zod"
import { FALLBACK_VALUE } from "./constants"

/**
 * Schema field definition from the extraction schema
 */
export interface SchemaField {
  id: string
  name?: string
  type: string
  description?: string
  extractionInstructions?: string
  constraints?: {
    min?: number
    max?: number
    minLength?: number
    maxLength?: number
    options?: string[]
  }
  children?: SchemaField[]
  columns?: SchemaField[]
  item?: SchemaField
}

/**
 * Creates a primitive Zod type from a schema column definition
 */
export function makePrimitive(column: SchemaField): z.ZodTypeAny {
  const type = column.type === "decimal" ? "number" : column.type
  let prop: z.ZodTypeAny

  switch (type) {
    case "number": {
      let numProp = z.number()
      if (column.constraints?.min !== undefined) numProp = numProp.min(column.constraints.min)
      if (column.constraints?.max !== undefined) numProp = numProp.max(column.constraints.max)
      prop = numProp
      break
    }
    case "boolean":
      prop = z.boolean()
      break
    case "single_select": {
      const options = column.constraints?.options || []
      if (options.length > 0) {
        prop = z.union([z.enum(options as [string, ...string[]]), z.literal("-")])
      } else {
        prop = z.string()
      }
      break
    }
    case "multi_select": {
      const options = column.constraints?.options || []
      if (options.length > 0) {
        prop = z.array(z.enum(options as [string, ...string[]]))
      } else {
        prop = z.array(z.string())
      }
      break
    }
    case "date": {
      const dateRegex = z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
      let dateProp = z.union([dateRegex, z.literal("-")])
      if (column.constraints?.minLength !== undefined)
        dateProp = dateProp.min(column.constraints.minLength) as typeof dateProp
      if (column.constraints?.maxLength !== undefined)
        dateProp = dateProp.max(column.constraints.maxLength) as typeof dateProp
      prop = dateProp
      break
    }
    case "email": {
      let emailProp = z.union([z.string().email(), z.literal("-")])
      if (column.constraints?.minLength !== undefined)
        emailProp = emailProp.min(column.constraints.minLength) as typeof emailProp
      if (column.constraints?.maxLength !== undefined)
        emailProp = emailProp.max(column.constraints.maxLength) as typeof emailProp
      prop = emailProp
      break
    }
    case "url": {
      let urlProp = z.union([z.string().url(), z.literal("-")])
      if (column.constraints?.minLength !== undefined)
        urlProp = urlProp.min(column.constraints.minLength) as typeof urlProp
      if (column.constraints?.maxLength !== undefined)
        urlProp = urlProp.max(column.constraints.maxLength) as typeof urlProp
      prop = urlProp
      break
    }
    case "richtext":
    case "address":
    case "phone":
    case "string":
    default: {
      let strProp = z.string()
      if (column.constraints?.minLength !== undefined) strProp = strProp.min(column.constraints.minLength)
      if (column.constraints?.maxLength !== undefined) strProp = strProp.max(column.constraints.maxLength)
      prop = strProp
      break
    }
  }
  return prop
}

/**
 * Meta schema for confidence reporting
 */
export const metaSchema = z.object({
  confidence: z
    .array(
      z.object({
        fieldId: z.string(),
        value: z.number().min(0).max(1),
      })
    )
    .optional(),
})

/**
 * Builds a Zod object schema from a tree of schema fields
 */
export function buildObjectFromTree(
  fields: SchemaField[],
  options?: { includeMeta?: boolean }
): { zodSchema: z.ZodObject<Record<string, z.ZodTypeAny>>; schemaLines: string[] } {
  const schemaLines: string[] = []

  function buildSchema(fieldList: SchemaField[], includeMetaInner?: boolean): z.ZodObject<Record<string, z.ZodTypeAny>> {
    const shape: Record<string, z.ZodTypeAny> = {}

    for (const field of fieldList) {
      const desc = `${field.description || ""} ${field.extractionInstructions || ""}`.trim()

      if (field.type === "object") {
        const obj = buildSchema(field.children || [], false)
        let prop: z.ZodTypeAny = obj.optional()
        if (desc) prop = prop.describe(desc)
        shape[field.id] = prop
        const line = `- ${field.name || field.id} [object]${desc ? `: ${desc}` : ""}`
        schemaLines.push(line)
      } else if (field.type === "list") {
        const item = field.item
        let zItem: z.ZodTypeAny
        if (item?.type === "object") {
          zItem = buildSchema(item.children || [], false)
        } else {
          zItem = makePrimitive(item || { id: "", type: "string" })
        }
        let prop: z.ZodTypeAny = z.array(zItem).optional()
        if (desc) prop = prop.describe(desc)
        shape[field.id] = prop
        const line = `- ${field.name || field.id} [list]${desc ? `: ${desc}` : ""}`
        schemaLines.push(line)
      } else if (field.type === "table") {
        const rowObj = buildSchema(field.columns || [], false)
        let prop: z.ZodTypeAny = z.array(rowObj).optional()
        if (desc) prop = prop.describe(desc)
        shape[field.id] = prop
        const line = `- ${field.name || field.id} [table]${desc ? `: ${desc}` : ""}`
        schemaLines.push(line)
      } else {
        let prop = makePrimitive(field).nullable()
        if (desc) prop = prop.describe(desc)
        shape[field.id] = prop
        const typeLabel = field.type

        // Add options to schema summary for select fields
        let optionsText = ""
        if (
          (field.type === "single_select" || field.type === "multi_select") &&
          field.constraints?.options?.length
        ) {
          const optionsList = field.constraints.options.join(", ")
          optionsText = ` (Options: ${optionsList})`
        }

        schemaLines.push(`- ${field.name || field.id} [${typeLabel}]${optionsText}${desc ? `: ${desc}` : ""}`)
      }
    }

    const base = z.object(shape).strict()
    if (includeMetaInner) {
      return base.extend({ __meta__: metaSchema.optional() }).strict()
    }
    return base
  }

  const zodSchema = buildSchema(fields, options?.includeMeta)
  return { zodSchema, schemaLines }
}

/**
 * Builds a Zod schema from a flat schema map (legacy format)
 */
export function buildObjectFromFlat(
  schema: Record<string, SchemaField>
): { zodSchema: z.ZodObject<Record<string, z.ZodTypeAny>>; schemaLines: string[] } {
  const schemaLines: string[] = []
  const zodShape: Record<string, z.ZodTypeAny> = {}

  Object.entries(schema).forEach(([key, column]) => {
    const desc = `${column.description || ""} ${column.extractionInstructions || ""}`.trim()
    const type = column.type === "decimal" ? "number" : column.type
    let prop: z.ZodTypeAny

    if (type === "list") {
      prop = z.array(z.string()).optional()
    } else {
      prop = makePrimitive(column).nullable()
    }

    if (desc) prop = prop.describe(desc)
    zodShape[key] = prop
    const typeLabel = type === "list" ? "list (array)" : type
    const name = column.name || key

    // Add options to schema summary for select fields
    let optionsText = ""
    if (
      (column.type === "single_select" || column.type === "multi_select") &&
      column.constraints?.options?.length
    ) {
      const optionsList = column.constraints.options.join(", ")
      optionsText = ` (Options: ${optionsList})`
    }

    schemaLines.push(`- ${name} [${typeLabel}]${optionsText}${desc ? `: ${desc}` : ""}`)
  })

  const zodSchema = z
    .object({
      ...zodShape,
      __meta__: metaSchema.optional(),
    })
    .strict()

  return { zodSchema, schemaLines }
}

/**
 * Builds fallback results with default values from a tree schema
 */
export function buildFallbackFromTree(fields: SchemaField[]): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const field of fields ?? []) {
    if (field.type === "object") {
      out[field.id] = buildFallbackFromTree(field.children || [])
    } else if (field.type === "list" || field.type === "table") {
      out[field.id] = FALLBACK_VALUE
    } else {
      out[field.id] = FALLBACK_VALUE
    }
  }
  return out
}

/**
 * Builds fallback results from a flat schema
 */
export function buildFallbackFromFlat(schema: Record<string, SchemaField>): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  Object.entries(schema || {}).forEach(([key, column]) => {
    if (column?.type === "object" && Array.isArray(column?.children)) {
      out[key] = buildFallbackFromTree(column.children)
    } else {
      out[key] = FALLBACK_VALUE
    }
  })
  return out
}

/**
 * Applies file name as fallback for empty values in tree results
 */
export function applyFileNameFallbackToTree(
  results: Record<string, unknown>,
  fields: SchemaField[],
  fileName: string
): Record<string, unknown> {
  const out: Record<string, unknown> = Array.isArray(fields) ? {} : results

  for (const field of fields ?? []) {
    const id = field?.id
    if (!id) continue
    const current = results?.[id]

    if (field.type === "object") {
      out[id] = applyFileNameFallbackToTree(
        (current as Record<string, unknown>) || {},
        field.children || [],
        fileName
      )
    } else if (field.type === "list" || field.type === "table") {
      out[id] = current
    } else {
      if (
        typeof current === "string" &&
        (current === FALLBACK_VALUE || current.trim().length === 0)
      ) {
        out[id] = fileName
      } else {
        out[id] = current
      }
    }
  }
  return out
}

/**
 * Applies file name as fallback for empty values in flat results
 */
export function applyFileNameFallbackToFlat(
  results: Record<string, unknown>,
  schema: Record<string, SchemaField>,
  fileName: string
): Record<string, unknown> {
  const out: Record<string, unknown> = {}

  Object.entries(schema || {}).forEach(([key, column]) => {
    const current = results?.[key]
    if (column?.type === "object" && Array.isArray(column?.children)) {
      out[key] = applyFileNameFallbackToTree(
        (current as Record<string, unknown>) || {},
        column.children,
        fileName
      )
    } else {
      if (
        typeof current === "string" &&
        (current === FALLBACK_VALUE || current.trim().length === 0)
      ) {
        out[key] = fileName
      } else {
        out[key] = current
      }
    }
  })
  return out
}
