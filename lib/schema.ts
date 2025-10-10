// Shared schema types and helpers for nested entity extraction

export type DataPrimitive =
  | "string"
  | "number"
  | "decimal"
  | "boolean"
  | "date"
  | "email"
  | "url"
  | "phone"
  | "address"
  | "richtext"

export type CompoundType = "object" | "list" | "table"

export type DataType = DataPrimitive | CompoundType

export type TransformationType =
  | "currency_conversion"
  | "classification"
  | "calculation"
  | "gemini_api"
  | "custom"

export interface FieldConstraints {
  minLength?: number
  maxLength?: number
  min?: number
  max?: number
  precision?: number
  format?: string
}

export interface SchemaFieldBase {
  id: string
  name: string
  type: DataType
  description?: string
  extractionInstructions?: string
  required?: boolean
  constraints?: FieldConstraints
  // Transformations (only valid on leaf/derived fields)
  isTransformation?: boolean
  transformationType?: TransformationType
  transformationConfig?: any
  transformationSource?: "document" | "column"
  transformationSourceColumnId?: string
  // If true, include this field in the collapsed summary of its parent object
  displayInSummary?: boolean
}

// Object field with nested children
export interface ObjectField extends SchemaFieldBase {
  type: "object"
  children: SchemaField[]
}

// List field; items can be primitive or objects
export interface ListField extends SchemaFieldBase {
  type: "list"
  item: SchemaField // for primitives, use name like "value"
}

// Table is modeled as a list of objects (rows)
export interface TableField extends SchemaFieldBase {
  type: "table"
  columns: SchemaField[] // column definitions (object children)
}

// Leaf field: any primitive type
export interface LeafField extends SchemaFieldBase {
  type: DataPrimitive
}

export type SchemaField = LeafField | ObjectField | ListField | TableField

export interface ExtractionJob {
  id: string
  fileName: string
  status: "pending" | "processing" | "completed" | "error"
  results?: Record<string, any> // flattened by leaf field id
  createdAt: Date
  completedAt?: Date
  agentType?: "standard" | "pharma" // Track which agent processed this job
}

export interface VisualGroup {
  id: string
  name: string
  fieldIds: string[] // IDs of fields that belong to this visual group
}

export interface SchemaDefinition {
  id: string
  name: string
  fields: SchemaField[]
  jobs: ExtractionJob[]
  templateId?: string
  visualGroups?: VisualGroup[] // Visual grouping for display only, doesn't affect data structure
}

// Helpers

export function isLeaf(field: SchemaField): field is LeafField {
  return field.type !== "object" && field.type !== "list" && field.type !== "table"
}

// Flatten fields to leaf fields, keeping a path for display
export type FlatLeaf = SchemaField & { path: string[]; visualGroupId?: string }

export function flattenFields(fields: SchemaField[] = [], parentPath: string[] = []): FlatLeaf[] {
  const out: FlatLeaf[] = []
  for (const f of fields) {
    if (isLeaf(f)) {
      out.push({ ...(f as LeafField), path: [...parentPath, f.name] })
    } else if (f.type === "object") {
      // Keep object fields as unified entities in the grid, don't flatten their children
      out.push({ ...(f as any), path: [...parentPath, f.name] })
    } else if (f.type === "list" || f.type === "table") {
      // For display, treat collection fields as a single cell (JSON/summary)
      out.push({ ...(f as any), path: [...parentPath, f.name] })
    }
  }
  return out
}

// Find and update a field by id (immutable)
export function updateFieldById(fields: SchemaField[], id: string, updater: (f: SchemaField) => SchemaField): SchemaField[] {
  return fields.map((f) => {
    if (f.id === id) return updater(f)
    if (f.type === "object") {
      return { ...f, children: updateFieldById((f as ObjectField).children, id, updater) } as ObjectField
    }
    if (f.type === "list") {
      const lf = f as ListField
      if (lf.item.id === id) return { ...lf, item: updater(lf.item) }
      if (lf.item.type === "object" || lf.item.type === "table" || lf.item.type === "list") {
        return { ...lf, item: updateFieldById([lf.item], id, updater)[0] } as ListField
      }
      return lf
    }
    if (f.type === "table") {
      const tf = f as TableField
      return { ...tf, columns: updateFieldById(tf.columns, id, updater) } as TableField
    }
    return f
  })
}

export function removeFieldById(fields: SchemaField[], id: string): SchemaField[] {
  const out: SchemaField[] = []
  for (const f of fields) {
    if (f.id === id) continue
    if (f.type === "object") {
      out.push({ ...f, children: removeFieldById((f as ObjectField).children, id) } as ObjectField)
    } else if (f.type === "list") {
      const lf = f as ListField
      let item = lf.item
      if (item.id === id) {
        // drop the entire list if its single item definition was deleted
        continue
      }
      if (item.type === "object" || item.type === "table" || item.type === "list") {
        item = removeFieldById([item], id)[0]
      }
      out.push({ ...lf, item } as ListField)
    } else if (f.type === "table") {
      const tf = f as TableField
      out.push({ ...tf, columns: removeFieldById(tf.columns, id) } as TableField)
    } else {
      out.push(f)
    }
  }
  return out
}

// Flatten a nested result object keyed by field ids to a map of field id -> value
// For objects, keep the entire object structure intact rather than flattening children
export function flattenResultsById(fields: SchemaField[], nested: any): Record<string, any> {
  const out: Record<string, any> = {}
  const walk = (fs: SchemaField[], node: any) => {
    for (const f of fs) {
      if (node == null) continue
      const v = node[f.id]
      if (isLeaf(f)) {
        out[f.id] = v ?? null
      } else if (f.type === "object") {
        // Keep the entire object structure intact for unified display
        out[f.id] = v ?? null
        // Don't walk children - keep object as unified entity
      } else if (f.type === "list") {
        out[f.id] = Array.isArray(v) ? v : v ?? null // keep list value as-is
      } else if (f.type === "table") {
        out[f.id] = Array.isArray(v) ? v : v ?? null
      }
    }
  }
  walk(fields, nested || {})
  return out
}

// Visual group helper functions
export function createVisualGroup(groupName: string, fieldIds: string[]): VisualGroup {
  return {
    id: `group-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    name: groupName,
    fieldIds,
  }
}

export function addVisualGroup(schema: SchemaDefinition, group: VisualGroup): SchemaDefinition {
  return {
    ...schema,
    visualGroups: [...(schema.visualGroups || []), group],
  }
}

export function updateVisualGroup(schema: SchemaDefinition, groupId: string, updater: (g: VisualGroup) => VisualGroup): SchemaDefinition {
  return {
    ...schema,
    visualGroups: (schema.visualGroups || []).map((g) => (g.id === groupId ? updater(g) : g)),
  }
}

export function removeVisualGroup(schema: SchemaDefinition, groupId: string): SchemaDefinition {
  return {
    ...schema,
    visualGroups: (schema.visualGroups || []).filter((g) => g.id !== groupId),
  }
}

export function getFieldVisualGroup(schema: SchemaDefinition, fieldId: string): VisualGroup | undefined {
  return (schema.visualGroups || []).find((g) => g.fieldIds.includes(fieldId))
}
