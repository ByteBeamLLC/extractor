// Shared schema types for nested entity extraction

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

export interface ObjectField extends SchemaFieldBase {
  type: "object"
  children: SchemaField[]
}

export interface ListField extends SchemaFieldBase {
  type: "list"
  item: SchemaField
}

export interface TableField extends SchemaFieldBase {
  type: "table"
  columns: SchemaField[]
}

export interface LeafField extends SchemaFieldBase {
  type: DataPrimitive
}

export type SchemaField = LeafField | ObjectField | ListField | TableField

export interface ExtractionJob {
  id: string
  fileName: string
  status: "pending" | "processing" | "completed" | "error"
  results?: Record<string, any>
  createdAt: Date
  completedAt?: Date
}

export interface SchemaDefinition {
  id: string
  name: string
  fields: SchemaField[]
  jobs: ExtractionJob[]
  templateId?: string
}

export type FlatLeaf = SchemaField & { path: string[] }
