import { z } from "zod"

import { ensureServerOnly } from "./ensureServerOnly"
import type { SchemaField } from "@/lib/schema/types"

ensureServerOnly("lib/server/schemaToZod")

type FlatSchemaColumn = {
  type: string
  name?: string
  description?: string
  extractionInstructions?: string
  constraints?: {
    minLength?: number
    maxLength?: number
    min?: number
    max?: number
  }
}

type FlatSchema = Record<string, FlatSchemaColumn>

export interface SchemaArtifacts {
  zodSchema: z.ZodObject<any>
  schemaSummary: string
}

export function buildSchemaArtifacts(params: {
  schemaTree?: SchemaField[]
  schema?: FlatSchema
}): SchemaArtifacts {
  const { schemaTree, schema } = params
  const schemaLines: string[] = []

  const makePrimitive = (column: any): z.ZodTypeAny => {
    const type = column?.type === "decimal" ? "number" : column?.type
    let prop: z.ZodTypeAny
    switch (type) {
      case "number": {
        prop = z.number()
        if (column?.constraints?.min !== undefined) prop = prop.min(column.constraints.min)
        if (column?.constraints?.max !== undefined) prop = prop.max(column.constraints.max)
        break
      }
      case "boolean": {
        prop = z.boolean()
        break
      }
      case "date": {
        prop = z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
        if (column?.constraints?.minLength !== undefined) prop = prop.min(column.constraints.minLength)
        if (column?.constraints?.maxLength !== undefined) prop = prop.max(column.constraints.maxLength)
        break
      }
      case "email": {
        prop = z.string().email()
        if (column?.constraints?.minLength !== undefined) prop = prop.min(column.constraints.minLength)
        if (column?.constraints?.maxLength !== undefined) prop = prop.max(column.constraints.maxLength)
        break
      }
      case "url": {
        prop = z.string().url()
        if (column?.constraints?.minLength !== undefined) prop = prop.min(column.constraints.minLength)
        if (column?.constraints?.maxLength !== undefined) prop = prop.max(column.constraints.maxLength)
        break
      }
      case "richtext":
      case "address":
      case "phone":
      case "string":
      default: {
        prop = z.string()
        if (column?.constraints?.minLength !== undefined) prop = prop.min(column.constraints.minLength)
        if (column?.constraints?.maxLength !== undefined) prop = prop.max(column.constraints.maxLength)
        break
      }
    }
    return prop
  }

  const buildObjectFromTree = (fields: SchemaField[]): z.ZodObject<any> => {
    const shape: Record<string, z.ZodTypeAny> = {}
    for (const field of fields) {
      const desc = `${field.description || ""} ${field.extractionInstructions || ""}`.trim()
      if (field.type === "object") {
        const obj = buildObjectFromTree(field.children || [])
        let prop: z.ZodTypeAny = obj.optional()
        if (desc) prop = prop.describe(desc)
        shape[field.id] = prop
        const line = `- ${field.name} [object]${desc ? `: ${desc}` : ""}`
        schemaLines.push(line)
      } else if (field.type === "list") {
        const item = (field as any).item
        let zItem: z.ZodTypeAny
        if (item?.type === "object") {
          zItem = buildObjectFromTree(item.children || [])
        } else {
          zItem = makePrimitive(item || { type: "string" })
        }
        let prop: z.ZodTypeAny = z.array(zItem).optional()
        if (desc) prop = prop.describe(desc)
        shape[field.id] = prop
        const line = `- ${field.name} [list]${desc ? `: ${desc}` : ""}`
        schemaLines.push(line)
      } else if (field.type === "table") {
        const rowObj = buildObjectFromTree((field as any).columns || [])
        let prop: z.ZodTypeAny = z.array(rowObj).optional()
        if (desc) prop = prop.describe(desc)
        shape[field.id] = prop
        const line = `- ${field.name} [table]${desc ? `: ${desc}` : ""}`
        schemaLines.push(line)
      } else {
        let prop = makePrimitive(field)
        prop = prop.nullable()
        if (desc) prop = prop.describe(desc)
        shape[field.id] = prop
        schemaLines.push(`- ${field.name} [${field.type}]${desc ? `: ${desc}` : ""}`)
      }
    }
    return z.object(shape).strict()
  }

  let zodSchema: z.ZodObject<any>
  if (schemaTree && Array.isArray(schemaTree)) {
    zodSchema = buildObjectFromTree(schemaTree)
  } else if (schema) {
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
      schemaLines.push(`- ${name} [${typeLabel}]${desc ? `: ${desc}` : ""}`)
    })
    zodSchema = z.object(zodShape).strict()
  } else {
    throw new Error("No schema or schemaTree provided")
  }

  const schemaSummary = `Schema Fields:\n${schemaLines.join("\n")}`

  return { zodSchema, schemaSummary }
}
