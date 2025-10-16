import type { SchemaField, SchemaDefinition } from "./schema"

export type SchemaTemplateAgent = "standard" | "pharma"

export interface SchemaTemplateDefinition {
  id: string
  name: string
  description?: string | null
  fields: SchemaField[]
  agentType: SchemaTemplateAgent
  ownerId?: string | null
  isCustom?: boolean
  createdAt?: Date
  updatedAt?: Date
}

export function cloneSchemaFields(fields: SchemaField[]): SchemaField[] {
  return JSON.parse(JSON.stringify(fields ?? [])) as SchemaField[]
}

export function schemaDefinitionToTemplatePayload(schema: SchemaDefinition): { fields: SchemaField[] } {
  return {
    fields: cloneSchemaFields(schema.fields ?? []),
  }
}

export const STATIC_SCHEMA_TEMPLATES: SchemaTemplateDefinition[] = [
  {
    id: "invoice-nested",
    name: "Invoice",
    description: "Nested vendor/customer and totals.",
    agentType: "standard",
    fields: [
      {
        id: "invoice_number",
        name: "invoice_number",
        type: "string",
        description: "Unique invoice ID",
        extractionInstructions: "Look for 'Invoice #', 'Invoice No.'",
        required: true,
      },
      {
        id: "invoice_date",
        name: "invoice_date",
        type: "date",
        description: "Issue date",
        extractionInstructions: "Normalize to YYYY-MM-DD",
        required: true,
      },
      { id: "due_date", name: "due_date", type: "date", description: "Payment due date" },
      { id: "po_number", name: "po_number", type: "string", description: "PO number if present" },
      {
        id: "vendor",
        name: "vendor",
        type: "object",
        description: "Vendor details",
        children: [
          { id: "vendor_name", name: "name", type: "string", description: "Vendor name", required: true },
          { id: "vendor_country", name: "country", type: "string", description: "Vendor country" },
          { id: "vendor_address", name: "address", type: "string", description: "Vendor address" },
          { id: "vendor_tax_id", name: "tax_id", type: "string", description: "Tax/VAT ID" },
        ],
      },
      {
        id: "customer",
        name: "customer",
        type: "object",
        description: "Customer details",
        children: [
          { id: "customer_name", name: "name", type: "string", description: "Customer name" },
          { id: "customer_address", name: "address", type: "string", description: "Billing address" },
        ],
      },
      {
        id: "line_items",
        name: "line_items",
        type: "list",
        description: "Itemized products/services",
        item: {
          id: "line_item",
          name: "item",
          type: "object",
          children: [
            { id: "li_desc", name: "description", type: "string" },
            { id: "li_qty", name: "quantity", type: "number" },
            { id: "li_unit_price", name: "unit_price", type: "number" },
            { id: "li_total", name: "total", type: "number" },
          ],
        },
      },
      { id: "subtotal", name: "subtotal", type: "number" },
      { id: "tax_amount", name: "tax_amount", type: "number" },
      {
        id: "total_amount",
        name: "total_amount",
        type: "object",
        description: "Final total as amount + currency",
        children: [
          { id: "total_amount_value", name: "amount", type: "number", description: "Amount" },
          { id: "total_amount_ccy", name: "currency", type: "string", description: "Currency code" },
        ],
      },
    ],
  },
  {
    id: "po-simple",
    name: "Purchase Order (Simple)",
    description: "Quick purchase order template with supplier and line items.",
    agentType: "standard",
    fields: [
      {
        id: "po_number",
        name: "po_number",
        type: "string",
        description: "PO identifier.",
        required: true,
      },
      { id: "order_date", name: "order_date", type: "date", description: "Date PO created." },
      { id: "vendor_name", name: "vendor_name", type: "string", description: "Supplier/vendor name." },
      { id: "shipping_address", name: "shipping_address", type: "string", description: "Ship To address." },
      { id: "billing_address", name: "billing_address", type: "string", description: "Billing address." },
      {
        id: "line_items",
        name: "line_items",
        type: "list",
        description: "Goods/services requested.",
        item: {
          id: "po_item",
          name: "item",
          type: "object",
          children: [
            { id: "po_item_sku", name: "sku", type: "string" },
            { id: "po_item_desc", name: "description", type: "string" },
            { id: "po_item_qty", name: "quantity", type: "number" },
            { id: "po_item_unit_price", name: "unit_price", type: "number" },
            { id: "po_item_total", name: "total", type: "number" },
          ],
        },
      },
      { id: "total_amount", name: "total_amount", type: "number", description: "PO total value.", required: true },
      { id: "requested_by", name: "requested_by", type: "string", description: "Requester or department." },
    ],
  },
  {
    id: "pharma-artwork",
    name: "Pharma Artwork",
    description: "Capture batch numbers, expiry dates, and packaging metadata.",
    agentType: "pharma",
    fields: [
      {
        id: "product_name",
        name: "product_name",
        type: "string",
        description: "Product name as printed on artwork.",
        required: true,
      },
      {
        id: "batch_number",
        name: "batch_number",
        type: "string",
        description: "Batch/Lot number (e.g., LOT/BN).",
        required: true,
      },
      {
        id: "manufacturing_date",
        name: "manufacturing_date",
        type: "date",
        description: "Manufacturing date (MFG).",
      },
      {
        id: "expiry_date",
        name: "expiry_date",
        type: "date",
        description: "Expiry/Best Before date (EXP).",
        required: true,
      },
      { id: "barcode", name: "barcode", type: "string", description: "Linear/2D barcode data if present." },
      {
        id: "pharmacode",
        name: "pharmacode",
        type: "string",
        description: "Pharmacode value printed for packaging control.",
      },
    ],
  },
  {
    id: "pharma-content",
    name: "Pharma Ecommerce Content",
    description: "Generate product page content aligned to Saudi FDA terminology.",
    agentType: "pharma",
    fields: [
      {
        id: "product_name",
        name: "product_name",
        type: "string",
        description: "Product name as displayed online.",
        required: true,
      },
      {
        id: "generic_name",
        name: "generic_name",
        type: "string",
        description: "Generic/active ingredient name.",
      },
      {
        id: "dosage_form",
        name: "dosage_form",
        type: "string",
        description: "Dosage form (tablet, capsule, syrup, etc.).",
      },
      {
        id: "strength",
        name: "strength",
        type: "string",
        description: "Strength or concentration of the medication.",
      },
      {
        id: "indications",
        name: "indications",
        type: "richtext",
        description: "Indications for use (aligned to regulator terminology).",
      },
      {
        id: "side_effects",
        name: "side_effects",
        type: "richtext",
        description: "Common side effects to surface online.",
      },
    ],
  },
]

export function getStaticSchemaTemplates(): SchemaTemplateDefinition[] {
  return STATIC_SCHEMA_TEMPLATES.map((template) => ({
    ...template,
    fields: cloneSchemaFields(template.fields),
    isCustom: false,
  }))
}

