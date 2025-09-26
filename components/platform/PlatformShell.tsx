"use client"

import type React from "react"

import { useState, useRef, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { Skeleton } from "@/components/ui/skeleton"
import { SetupBanner } from "../setup-banner"
import { PlatformHeader } from "./Header"
import { SchemasTabs } from "./SchemasTabs"
import { ColumnsPanel } from "./columns/ColumnsPanel"
import { JobsPanel } from "./jobs/JobsPanel"
import { FnbPanel } from "./agents/FnbPanel"
import { PharmaPanel } from "./agents/PharmaPanel"
import { useTableModal } from "./hooks/useTableModal"
import { useRoi } from "./hooks/useRoi"
import { TableModal } from "./modals/TableModal"
import { RoiModal } from "./modals/RoiModal"
import { cn } from "@/lib/utils"
import { maybeDownscaleImage } from "@/lib/client/image"
import type { SerializedFile } from "@/features/platform/services/types"
import { submitExtraction } from "@/features/platform/services/extractClient"
import { extractAndTranslateFnb } from "@/features/platform/services/fnbClient"
import { fetchPharmaContent } from "@/features/platform/services/pharmaClient"
import { mapFnbResults } from "@/features/agents/fnb/mappers"
import { mapPharmaResults } from "@/features/agents/pharma/mappers"
import { printLocalizedLabel } from "@/features/platform/utils/printLabel"

import type {
  DataType,
  TransformationType,
  SchemaField,
  SchemaDefinition,
  ExtractionJob,
} from "@/lib/schema/types"
import { flattenFields, flattenResultsById } from "@/lib/schema/treeOps"
 
import {
  Settings,
  FileText,
  Hash,
  Type,
  Calendar,
  Mail,
  Link,
  Phone,
  MapPin,
  ToggleLeft,
  List,
  Globe,
  Calculator,
  Zap,
  CheckCircle,
  Clock,
  AlertCircle,
  ChevronDown,
  Maximize2,

} from "lucide-react"
 

// Types moved to lib/schema

const dataTypeIcons: Record<DataType, any> = {
  string: Type,
  number: Hash,
  decimal: Hash,
  boolean: ToggleLeft,
  date: Calendar,
  email: Mail,
  url: Link,
  phone: Phone,
  address: MapPin,
  richtext: FileText,
  list: List,
  object: Globe,
  table: List,
}

const transformationIcons: Record<TransformationType, any> = {
  currency_conversion: Calculator,
  classification: Zap,
  gemini_api: Zap,
  custom: Settings,
}

const compositeBadgeStyles: Record<'object' | 'table' | 'list', string> = {
  object: 'bg-[#e6f0ff] text-[#2782ff] dark:bg-[#0b2547] dark:text-[#8fbfff]',
  table: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200',
  list: 'bg-[#e6f0ff] text-[#2782ff] dark:bg-[#0b2547] dark:text-[#8fbfff]',
}

const compositeBadgeLabels: Record<'object' | 'table' | 'list', string> = {
  object: 'Object',
  table: 'Table',
  list: 'List',
}


const simpleDataTypeOptions: Array<{ value: DataType; label: string }> = [
  { value: 'string', label: 'Text' },
  { value: 'number', label: 'Number' },
  { value: 'decimal', label: 'Decimal' },
  { value: 'boolean', label: 'Yes / No' },
  { value: 'date', label: 'Date' },
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Phone' },
  { value: 'url', label: 'Link' },
  { value: 'address', label: 'Address' },
  { value: 'richtext', label: 'Rich Text' },
]

const complexDataTypeOptions: Array<{ value: DataType; label: string }> = [
  { value: 'object', label: 'Object (Group of fields)' },
  { value: 'table', label: 'Table (Rows and columns)' },
  { value: 'list', label: 'List (Array of items)' },
]

//

/* Handsontable wrapper omitted (using custom grid) */

/* function HandsontableWrapper() {
  const hotTableRef = useRef<any>(null)
  // no-op placeholder to keep file stable; grid below is the source of truth
  const tableData = []

  // Column configuration
  const columnConfig = useMemo(() => {
    const config: any[] = [
      { 
        data: 0, 
        type: 'numeric',
        width: 50,
        readOnly: true,
        className: 'htCenter htMiddle'
      },
      { 
        data: 1, 
        type: 'text',
        width: 200,
        readOnly: true
      }
    ]
    
    const columns: any[] = []
    columns.forEach((column, index) => {
      config.push({
        data: index + 2,
        type: column.type === 'number' || column.type === 'decimal' ? 'numeric' : 'text',
        width: 150,
        readOnly: true
      })
    })
    
    return config
  }, [columns])

  // Custom column headers with enhanced display
  const nestedHeaders = undefined
  
  // Force re-render when columns or data change
  useEffect(() => {}, [])

  // Handle column header clicks
  const afterOnCellMouseDown = (event: MouseEvent, coords: any, TD: HTMLTableCellElement) => {
    // Only handle header clicks
    if (coords.row !== -1) return
    
    const col = coords.col
    if (col < 2) return // Skip row number and file columns
    
    const columnIndex = col - 2
    if (columnIndex >= 0 && columnIndex < columns.length) {
      const column = columns[columnIndex]
      
      // Check if it's a right-click for delete
      if (event.button === 2) {
        event.preventDefault()
        event.stopPropagation()
        const confirmDelete = window.confirm(`Delete column "${column.name}"?`)
        if (confirmDelete) {
          onColumnDelete(column.id)
        }
      } else if (event.button === 0) {
        // Left click for configuration
        setTimeout(() => {
          onColumnClick(column)
        }, 0)
      }
    }
  }

  const hotSettings: any = {
    data: tableData,
    colHeaders: true,
    nestedHeaders: nestedHeaders,
    columns: columnConfig,
    rowHeaders: false,
    width: '100%',
    height: '100%',
    stretchH: 'all' as const,
    autoWrapRow: true,
    autoWrapCol: true,
    licenseKey: 'non-commercial-and-evaluation',
    afterOnCellMouseDown: afterOnCellMouseDown,
    manualColumnResize: true,
    manualRowResize: false,
    contextMenu: {
      items: {
        'copy': {
          name: 'Copy'
        },
        'sep1': '---------',
        'export_csv': {
          name: 'Export to CSV',
          callback: () => {
            onExportCSV()
          }
        }
      }
    },
    filters: true,
    dropdownMenu: ['filter_by_condition', 'filter_by_value', 'filter_action_bar'],
    columnSorting: true,
    sortIndicator: true,
    autoColumnSize: false,
    wordWrap: true,
    renderAllRows: false,
    fragmentSelection: true,
    disableVisualSelection: false,
    selectionMode: 'multiple',
    outsideClickDeselects: false,
    fillHandle: false, // Disable fill handle since data is read-only
    readOnly: true,
    trimWhitespace: true,
    search: true,
    className: 'htMiddle',
    cell: jobs.map((job, rowIndex) => {
      const cells = []
      // Style the file name column based on status
      cells.push({
        row: rowIndex,
        col: 1,
        className: job.status === 'error' ? 'status-error' : 
                   job.status === 'processing' ? 'status-processing' : 
                   job.status === 'completed' ? 'status-completed' : 'status-pending'
      })
      return cells
    }).flat()
  }

  return (
    <div className="w-full h-full bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      {columns.length === 0 ? (
        <div className="flex items-center justify-center h-full text-gray-500">
          <div className="text-center">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium mb-2">No schema defined yet</p>
            <p className="text-sm">Start by adding columns to define your data extraction schema.</p>
          </div>
        </div>
      ) : (
        <HotTable
          ref={hotTableRef}
          settings={hotSettings}
          key={`hot-${columns.length}-${jobs.length}`}
        />
      )}
    </div>
  )
} */

export function PlatformShell() {
  const initialSchema: SchemaDefinition = {
    id: `schema_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    name: "Data Extraction Schema",
    fields: [],
    jobs: [],
  }
  const [schemas, setSchemas] = useState<SchemaDefinition[]>([initialSchema])
  const [activeSchemaId, setActiveSchemaId] = useState<string>(initialSchema.id)
  const activeSchema = schemas.find((s) => s.id === activeSchemaId) || initialSchema
  const fields = activeSchema.fields
  const jobs = activeSchema.jobs
  const displayColumns = useMemo(() => flattenFields(fields), [fields])
  if (process.env.NODE_ENV !== 'production') {
    // eslint-disable-next-line no-console
    console.log('Active schema:', activeSchema.name, 'Fields count:', fields.length)
  }
  const fileInputRef = useRef<HTMLInputElement>(null)
  // Schema name editing
  const [editingSchemaName, setEditingSchemaName] = useState(false)
  const [schemaNameInput, setSchemaNameInput] = useState<string>(activeSchema.name)

  useEffect(() => {
    if (!editingSchemaName) {
      setSchemaNameInput(activeSchema.name || 'Data Extraction Schema')
    }
  }, [activeSchemaId, activeSchema.name, editingSchemaName])
  // UI state for modern grid behaviors
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null)
  // F&B translation collapsible state per job
  const [expandedCells, setExpandedCells] = useState<Record<string, boolean>>({})
  // Table modal state
  const tableModal = useTableModal()
  const roi = useRoi()
  const completedJobsCount = jobs.filter((j) => j.status === 'completed').length
  const sortedJobs = useMemo(
    () => [...jobs].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime()),
    [jobs],
  )
  // Avoid referencing process.env in client runtime
  const { BOOKING_URL } = require("@/lib/client/publicEnv") as { BOOKING_URL: string }
  const isSchemaFresh = (s: SchemaDefinition) => (s.fields?.length ?? 0) === 0 && (s.jobs?.length ?? 0) === 0

  // Sidebar disabled

  const numberFormatter = useMemo(() => new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  }), [])

  const dateFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      }),
    [],
  )

  const formatNumericValue = (raw: unknown): string | null => {
    const candidate = typeof raw === 'number' ? raw : Number(raw)
    if (!Number.isFinite(candidate)) return null
    return numberFormatter.format(candidate)
  }

  const formatDateValue = (raw: unknown): string | null => {
    if (!raw) return null
    const date = raw instanceof Date ? raw : new Date(raw as any)
    if (Number.isNaN(date.getTime())) return null
    return dateFormatter.format(date)
  }

  const cellKey = (jobId: string, columnId: string) => `${jobId}-${columnId}`

  const isCellExpanded = (jobId: string, columnId: string) => !!expandedCells[cellKey(jobId, columnId)]

  const toggleCellExpansion = (jobId: string, columnId: string) => {
    const key = cellKey(jobId, columnId)
    setExpandedCells((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const openTableModal = (
    column: SchemaField,
    job: ExtractionJob,
    rows: Record<string, any>[],
    columnHeaders: { key: string; label: string }[],
  ) => {
    tableModal.open({ column, job, rows, columnHeaders })
  }

  const findChildLabel = (column: SchemaField, key: string): string | undefined => {
    if (column.type === 'object') {
      const objectColumn = column as Extract<SchemaField, { type: 'object' }>
      const child = objectColumn.children?.find((childField) => childField.id === key || childField.name === key)
      return child?.name
    }
    if (column.type === 'table') {
      const tableColumn = column as Extract<SchemaField, { type: 'table' }>
      const child = tableColumn.columns?.find((childField) => childField.id === key || childField.name === key)
      return child?.name
    }
    if (column.type === 'list') {
      const listColumn = column as Extract<SchemaField, { type: 'list' }>
      const item = listColumn.item
      if (item.type === 'object') {
        const objectItem = item as Extract<SchemaField, { type: 'object' }>
        const child = objectItem.children?.find((childField) => childField.id === key || childField.name === key)
        return child?.name
      }
    }
    return undefined
  }

  const prettifyKey = (key: string) => key.replace(/[_-]/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase())

  const getObjectEntries = (column: SchemaField, value: Record<string, any>) => {
    return Object.entries(value)
      .filter(([, v]) => v !== null && v !== undefined && v !== '')
      .map(([key, v]) => ({
        label: findChildLabel(column, key) ?? prettifyKey(key),
        value: v,
      }))
  }

  const firstNonEmptyText = (value: Record<string, any>) => {
    for (const v of Object.values(value)) {
      if (v && typeof v === 'string') {
        const trimmed = v.trim()
        if (trimmed) return trimmed
      }
    }
    return null
  }

  const FNB_AGENT_ID = "fnb-label-compliance"
  const PHARMA_AGENT_ID = "pharma-ecommerce-content"

  // Minimal nested templates to seed schemas
  const NESTED_TEMPLATES: { id: string; name: string; description?: string; fields: SchemaField[] }[] = [
    {
      id: FNB_AGENT_ID,
      name: "F&B Label Compliance",
      description: "Primary-language extraction + EN/AR translation in split view.",
      fields: [],
    },
    {
      id: PHARMA_AGENT_ID,
      name: "Pharma E-Commerce Content Creation",
      description: "Deep agent to identify drug variants and author SFDA-aligned PDP content.",
      fields: [
        { id: "drug_name", name: "drug_name", type: "string", description: "Canonical drug name including variant." },
        { id: "variant_name", name: "variant_name", type: "string", description: "Variant / dosage phrasing from packaging." },
        { id: "manufacturer", name: "manufacturer", type: "string", description: "Manufacturer recorded on packaging or listing." },
        { id: "sfda_drug_id", name: "sfda_drug_id", type: "string", description: "Verified SFDA drugId." },
        { id: "sfda_listing_url", name: "sfda_listing_url", type: "url", description: "Validated SFDA listing URL." },
        {
          id: "unique_identifiers",
          name: "unique_identifiers",
          type: "richtext",
          description: "Structured summary of unique identifiers and evidence snippets.",
        },
        {
          id: "listing_diagnostics",
          name: "listing_diagnostics",
          type: "richtext",
          description: "Debug output indicating why SFDA verification passed or failed.",
        },
        { id: "description", name: "description", type: "richtext", description: "Consumer-friendly description." },
        { id: "composition", name: "composition", type: "richtext", description: "Active and inactive ingredients." },
        { id: "how_to_use", name: "how_to_use", type: "richtext", description: "Usage instructions for PDP." },
        { id: "indication", name: "indication", type: "richtext", description: "Medical indications / intended use." },
        { id: "possible_side_effects", name: "possible_side_effects", type: "richtext", description: "Side effects copy." },
        { id: "properties", name: "properties", type: "richtext", description: "Key product properties or differentiators." },
        { id: "storage", name: "storage", type: "richtext", description: "Storage requirements." },
        { id: "reasoning_trace", name: "reasoning_trace", type: "richtext", description: "Agent reasoning trail and citations." },
      ],
    },
    {
      id: "invoice-nested",
      name: "Invoice",
      description: "Nested vendor/customer and totals.",
      fields: [
        { id: "invoice_number", name: "invoice_number", type: "string", description: "Unique invoice ID", extractionInstructions: "Look for 'Invoice #', 'Invoice No.'", required: true },
        { id: "invoice_date", name: "invoice_date", type: "date", description: "Issue date", extractionInstructions: "Normalize to YYYY-MM-DD", required: true },
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
      name: "Purchase Order (simple)",
      description: "Basic PO fields.",
      fields: [
        { id: "po_number", name: "po_number", type: "string", description: "PO identifier.", required: true },
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
      description: "Key data points for pharmaceutical packaging/artwork.",
      fields: [
        { id: "product_name", name: "product_name", type: "string", description: "Product name as printed on artwork.", required: true },
        { id: "batch_number", name: "batch_number", type: "string", description: "Batch/Lot number (e.g., LOT/BN).", required: true },
        { id: "manufacturing_date", name: "manufacturing_date", type: "date", description: "Manufacturing date (MFG).", required: false },
        { id: "expiry_date", name: "expiry_date", type: "date", description: "Expiry/Best Before date (EXP).", required: true },
        { id: "barcode", name: "barcode", type: "string", description: "Linear/2D barcode data if present." },
        { id: "pharmacode", name: "pharmacode", type: "string", description: "Pharmacode value printed for packaging control." },
      ],
    },
  ]

  const AI_AGENT_IDS = new Set([FNB_AGENT_ID, PHARMA_AGENT_ID])
  const AI_AGENT_OPTIONS = NESTED_TEMPLATES.filter((template) => AI_AGENT_IDS.has(template.id))
  const TEMPLATE_OPTIONS = NESTED_TEMPLATES.filter((template) => !AI_AGENT_IDS.has(template.id))
  // Simple built-in templates (placeholder). You will provide real ones later.
  const SCHEMA_TEMPLATES: {
    id: string
    name: string
    description?: string
    fields: SchemaField[]
  }[] = [
    {
      id: "invoice-nested",
      name: "Invoice (Nested)",
      description: "Nested vendor/customer and totals.",
      fields: [
        { id: "invoice_number", name: "invoice_number", type: "string", description: "Unique invoice ID", extractionInstructions: "Look for 'Invoice #', 'Invoice No.'", required: true },
        { id: "invoice_date", name: "invoice_date", type: "date", description: "Issue date", extractionInstructions: "Normalize to YYYY-MM-DD", required: true },
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
      name: "Purchase Order (simple)",
      description: "Basic PO fields.",
      fields: [
        {
          id: "po_number",
          name: "po_number",
          type: "string",
          description: "PO identifier.",
          extractionInstructions: "Top labels: 'Purchase Order #', 'PO Number', 'PO No.'.",
          required: true,
        },
        {
          id: "order_date",
          name: "order_date",
          type: "date",
          description: "Date PO created.",
          extractionInstructions: "Labels 'Date', 'Order Date' near po_number.",
        },
        {
          id: "vendor_name",
          name: "vendor_name",
          type: "string",
          description: "Supplier/vendor name.",
          extractionInstructions: "Sections 'Vendor', 'Supplier', 'To'.",
        },
        { id: "shipping_address", name: "shipping_address", type: "string", description: "Ship To address.", extractionInstructions: "'Ship To', 'Deliver To'." },
        { id: "billing_address", name: "billing_address", type: "string", description: "Billing address.", extractionInstructions: "'Bill To', 'Invoice To'." },
        {
          id: "line_items",
          name: "line_items",
          type: "list",
          description: "Goods/services requested.",
          extractionInstructions: "Main items section: Item/SKU, Description, Quantity, Unit Price, Line Total.",
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
        { id: "total_amount", name: "total_amount", type: "number", description: "PO total value.", extractionInstructions: "'Total', 'Grand Total'.", required: true },
        { id: "requested_by", name: "requested_by", type: "string", description: "Requester or department.", extractionInstructions: "'Requested by', 'Attention', 'Buyer'." },
      ],
    },
    {
      id: "receipt",
      name: "Receipt",
      description: "Payment proof details for expenses.",
      columns: [
        { name: "merchant_name", type: "string", description: "Store/provider name.", extractionInstructions: "Prominent text at top, may be stylized." },
        { name: "merchant_address", type: "address", description: "Store address.", extractionInstructions: "Below merchant name; may include phone." },
        { name: "transaction_date", type: "date", description: "Purchase date.", extractionInstructions: "Label 'Date'." },
        { name: "transaction_time", type: "string", description: "Purchase time.", extractionInstructions: "Near transaction_date; formats HH:MM(:SS) AM/PM." },
        { name: "line_items", type: "list", description: "Purchased items.", extractionInstructions: "Rows between header and subtotal: Item, Qty, Price." },
        { name: "tax_amount", type: "number", description: "Tax paid.", extractionInstructions: "'Tax', 'VAT', 'GST'." },
        { name: "total_amount", type: "number", description: "Final amount paid.", extractionInstructions: "'Total', 'Balance', or payment method label." },
        { name: "payment_method", type: "string", description: "Payment method.", extractionInstructions: "'Paid by' or card name; last 4 digits indicative." },
      ],
    },
    {
      id: "resume",
      name: "Resume / CV",
      description: "Candidate professional and educational history.",
      columns: [
        { name: "full_name", type: "string", description: "Candidate full name.", extractionInstructions: "Most prominent text at top." },
        { name: "email_address", type: "email", description: "Email address.", extractionInstructions: "String with @ in contact section." },
        { name: "phone_number", type: "phone", description: "Phone number.", extractionInstructions: "Numbers with dashes/parentheses; consider intl codes." },
        { name: "location", type: "address", description: "City, state, country.", extractionInstructions: "Header contact area (e.g., 'Beirut, Lebanon')." },
        { name: "work_experience", type: "list", description: "Jobs list.", extractionInstructions: "Sections 'Experience', extract Job Title, Company, Location, Start Date, End Date, Responsibilities." },
        { name: "education", type: "list", description: "Education list.", extractionInstructions: "Section 'Education'; Institution, Degree, Field, Graduation Date." },
        { name: "skills", type: "list", description: "Skills list.", extractionInstructions: "Section 'Skills'; list items or comma-separated." },
      ],
    },
    {
      id: "bill-of-lading",
      name: "Bill of Lading (BOL)",
      description: "Shipping and freight document details.",
      columns: [
        { name: "bol_number", type: "string", description: "Tracking number.", extractionInstructions: "'Bill of Lading No.', 'BOL #', often near barcode." },
        { name: "carrier_name", type: "string", description: "Freight carrier.", extractionInstructions: "Labels 'Carrier', 'Shipping Line'." },
        { name: "shipper_details", type: "object", description: "Sender info.", extractionInstructions: "Box 'Shipper'/'From'; extract Name and Address." },
        { name: "consignee_details", type: "object", description: "Recipient info.", extractionInstructions: "Box 'Consignee'/'To'; extract Name and Address." },
        { name: "port_of_loading", type: "string", description: "Origin port/location.", extractionInstructions: "'Port of Loading', 'Origin'." },
        { name: "port_of_discharge", type: "string", description: "Destination port/location.", extractionInstructions: "'Port of Discharge', 'Destination'." },
        { name: "freight_description", type: "list", description: "Goods details.", extractionInstructions: "Main items table: Number of Packages, Description, Weight, Measurements." },
        { name: "freight_terms", type: "string", description: "Payment terms.", extractionInstructions: "'Freight Prepaid' or 'Freight Collect'." },
      ],
    },
    {
      id: "patient-registration",
      name: "Patient Registration Form",
      description: "Patient demographic and insurance info.",
      columns: [
        { name: "patient_full_name", type: "string", description: "Full legal name.", extractionInstructions: "Labels 'Patient Name', 'Full Name'. Extract First/Middle/Last when separate." },
        { name: "date_of_birth", type: "date", description: "DOB.", extractionInstructions: "Labels 'Date of Birth', 'DOB'. Validate realism." },
        { name: "gender", type: "string", description: "Gender.", extractionInstructions: "Often checkboxes or dropdown; 'Gender', 'Sex'." },
        { name: "patient_address", type: "address", description: "Home address.", extractionInstructions: "'Address', 'Home Address'. Extract Street/City/State/Zip." },
        { name: "phone_number", type: "phone", description: "Primary contact phone.", extractionInstructions: "'Phone', 'Contact No.'" },
        { name: "emergency_contact_name", type: "string", description: "Emergency contact name.", extractionInstructions: "Section 'Emergency Contact'." },
        { name: "emergency_contact_phone", type: "phone", description: "Emergency contact phone.", extractionInstructions: "In 'Emergency Contact' section, 'Phone' field." },
        { name: "primary_insurance_provider", type: "string", description: "Insurance company.", extractionInstructions: "'Insurance Company', 'Provider', 'Payer'." },
        { name: "policy_number", type: "string", description: "Policy/member ID.", extractionInstructions: "'Policy #', 'Member ID', 'ID Number'." },
        { name: "group_number", type: "string", description: "Group number.", extractionInstructions: "Near policy number; 'Group #'." },
        { name: "primary_care_physician", type: "string", description: "PCP name.", extractionInstructions: "'Primary Care Physician', 'PCP'." },
        { name: "medical_history", type: "object", description: "Allergies/medications/surgeries.", extractionInstructions: "Sections 'Medical History'/'Health Information'." },
      ],
    },
    {
      id: "medical-claim-cms1500",
      name: "Medical Claim Form (CMS-1500)",
      description: "Billing info from CMS-1500.",
      columns: [
        { name: "patient_name", type: "string", description: "Patient full name.", extractionInstructions: "Corresponds to Box 2." },
        { name: "patient_dob_sex", type: "object", description: "DOB and sex.", extractionInstructions: "Box 3; extract both date and sex." },
        { name: "insureds_name", type: "string", description: "Insured person name.", extractionInstructions: "Box 4." },
        { name: "patient_address", type: "address", description: "Patient address.", extractionInstructions: "Box 5: street, city, state, zip." },
        { name: "insureds_id_number", type: "string", description: "Policy number.", extractionInstructions: "Box 1a." },
        { name: "insurance_plan_name", type: "string", description: "Insurance company/program.", extractionInstructions: "Top 'CARRIER' or Box 11c." },
        { name: "diagnosis_codes", type: "list", description: "ICD-10 codes.", extractionInstructions: "Box 21; extract all listed codes." },
        { name: "service_lines", type: "list", description: "Services provided.", extractionInstructions: "Box 24; for each row: Date of Service, Place of Service, Procedure Code, Diagnosis Pointer, Charges, Units." },
        { name: "federal_tax_id", type: "string", description: "Provider tax ID.", extractionInstructions: "Box 25; SSN or EIN." },
        { name: "total_charge", type: "number", description: "Total charge.", extractionInstructions: "Box 28 'Total Charge'." },
        { name: "rendering_provider_npi", type: "string", description: "Rendering provider NPI.", extractionInstructions: "Box 24J." },
      ],
    },
    {
      id: "explanation-of-benefits",
      name: "Explanation of Benefits (EOB)",
      description: "Details of insurer claim processing.",
      columns: [
        { name: "patient_name", type: "string", description: "Patient name.", extractionInstructions: "Labels 'Patient', 'Member'." },
        { name: "claim_number", type: "string", description: "Claim number.", extractionInstructions: "'Claim #', 'Claim Number'." },
        { name: "provider_name", type: "string", description: "Provider name.", extractionInstructions: "'Provider', 'Doctor', 'Hospital'." },
        { name: "service_details", type: "list", description: "Service line breakdown.", extractionInstructions: "Main table: Date of Service, Description, Amount Billed, Amount Allowed, Deductible, Copay/Coinsurance, Not Covered, Amount Paid by Plan." },
        { name: "amount_billed", type: "number", description: "Total billed.", extractionInstructions: "'Total Charges'/'Amount Billed'." },
        { name: "amount_paid_by_plan", type: "number", description: "Total plan payment.", extractionInstructions: "'Plan Paid'/'Total Payment'." },
        { name: "patient_responsibility", type: "number", description: "Amount patient owes.", extractionInstructions: "'Patient Responsibility'/'You Owe'." },
        { name: "denial_reason_codes", type: "list", description: "Non-coverage reason codes.", extractionInstructions: "Section 'Remarks'/'Notes'/'Adjustments'." },
      ],
    },
    {
      id: "prescription-form",
      name: "Prescription Form",
      description: "Medication and directions for dispensing.",
      columns: [
        { name: "patient_name", type: "string", description: "Patient full name.", extractionInstructions: "Field 'Patient Name'/'For:'." },
        { name: "patient_dob", type: "date", description: "DOB for verification.", extractionInstructions: "'DOB'/'Date of Birth'." },
        { name: "prescriber_name", type: "string", description: "Doctor name.", extractionInstructions: "Near signature line or in header, may include titles (MD, DO, NP)." },
        { name: "prescriber_dea_number", type: "string", description: "DEA number.", extractionInstructions: "Field 'DEA #'; 2 letters + 7 digits." },
        { name: "medication_name", type: "string", description: "Drug name.", extractionInstructions: "After 'Rx'; brand or generic." },
        { name: "strength", type: "string", description: "Dosage strength.", extractionInstructions: "Immediately after drug name (e.g., 500mg)." },
        { name: "dosage_instructions", type: "string", description: "Sig/instructions.", extractionInstructions: "'Sig:'/'Instructions:' section; free text." },
        { name: "quantity", type: "string", description: "Quantity to dispense.", extractionInstructions: "'Disp:'/'Qty:'/'Quantity'." },
        { name: "refills", type: "number", description: "Number of refills.", extractionInstructions: "Field 'Refills'; default often 0." },
        { name: "date_of_issue", type: "date", description: "Prescription date.", extractionInstructions: "Field 'Date' near signature." },
      ],
    },
    {
      id: "certificate-liability-insurance",
      name: "Certificate of Liability Insurance (ACORD 25)",
      description: "Evidence of insurance coverage.",
      columns: [
        { name: "producer", type: "object", description: "Agent/broker issuer.", extractionInstructions: "Box 'PRODUCER'; extract Name and Address." },
        { name: "insured", type: "object", description: "Insured individual or entity.", extractionInstructions: "Box 'INSURED'; extract Name and Address." },
        { name: "certificate_holder", type: "object", description: "To whom certificate is issued.", extractionInstructions: "Bottom left 'CERTIFICATE HOLDER'; extract Name/Address." },
        { name: "policies", type: "list", description: "Active policies.", extractionInstructions: "Main table rows A,B,C... extract Insurance Type, Policy Number, Effective Date, Expiration Date." },
        { name: "insurer_a", type: "string", description: "Insurer A name.", extractionInstructions: "List 'INSURER(S) AFFORDING COVERAGE'." },
        { name: "general_liability_limits", type: "object", description: "GL coverage limits.", extractionInstructions: "Find 'GENERAL LIABILITY' row and extract limits (Each Occurrence, Damage to Premises, etc.)." },
        { name: "description_of_operations", type: "string", description: "Description of operations/locations/vehicles.", extractionInstructions: "Large bottom box; extract full text." },
      ],
    },
    {
      id: "proof-of-delivery",
      name: "Proof of Delivery (POD)",
      description: "Signed confirmation of goods delivered.",
      columns: [
        { name: "tracking_number", type: "string", description: "Shipment tracking number.", extractionInstructions: "'Tracking #', 'Waybill No.', 'Reference No.' near barcode." },
        { name: "shipper_name", type: "string", description: "Shipper name.", extractionInstructions: "Section 'Shipper'/'From'." },
        { name: "recipient_name", type: "string", description: "Recipient name.", extractionInstructions: "Section 'Recipient'/'Consignee'." },
        { name: "delivery_address", type: "address", description: "Delivery address.", extractionInstructions: "Within 'Recipient'/'Consignee'." },
        { name: "delivery_date", type: "date", description: "Delivery date.", extractionInstructions: "Label 'Delivery Date'." },
        { name: "recipient_signature", type: "boolean", description: "Signature present.", extractionInstructions: "Box 'Signature' – confirm presence." },
        { name: "printed_name", type: "string", description: "Printed name of signer.", extractionInstructions: "Field 'Printed Name'/ 'Name'." },
        { name: "condition_of_goods", type: "string", description: "Condition notes.", extractionInstructions: "Notes/Remarks or checklist (Damaged/Intact)." },
      ],
    },
    {
      id: "legal-summons",
      name: "Legal Summons",
      description: "Court notice requiring response.",
      columns: [
        { name: "court_name", type: "string", description: "Court name and jurisdiction.", extractionInstructions: "Official heading at top of document." },
        { name: "case_number", type: "string", description: "Court-assigned identifier.", extractionInstructions: "'Case Number', 'Docket No.', 'Index No.'." },
        { name: "plaintiff_name", type: "string", description: "Plaintiff name.", extractionInstructions: "Plaintiff(s) section." },
        { name: "defendant_name", type: "string", description: "Defendant name.", extractionInstructions: "Defendant(s) section." },
        { name: "date_of_issue", type: "date", description: "Issued date.", extractionInstructions: "Near clerk signature/stamp." },
        { name: "response_deadline", type: "date", description: "Deadline to respond.", extractionInstructions: "Phrases like 'You must respond within [XX] days'; compute based on date_of_issue when provided." },
        { name: "plaintiffs_attorney", type: "object", description: "Plaintiff's attorney name and address.", extractionInstructions: "Signature block identifying Attorney for Plaintiff." },
      ],
    },
    {
      id: "utility-bill",
      name: "Utility Bill",
      description: "Billing and usage details for utilities.",
      columns: [
        { name: "service_provider_name", type: "string", description: "Utility company name.", extractionInstructions: "Prominent name/logo at top." },
        { name: "account_number", type: "string", description: "Customer account number.", extractionInstructions: "'Account Number'/'Account #'." },
        { name: "service_address", type: "address", description: "Service address.", extractionInstructions: "Section 'Service Address'." },
        { name: "billing_period", type: "object", description: "Start and end dates for service period.", extractionInstructions: "Labels 'Billing Period'/'Service Dates'; extract start and end." },
        { name: "statement_date", type: "date", description: "Bill date.", extractionInstructions: "'Bill Date'/'Statement Date'/'Invoice Date'." },
        { name: "amount_due", type: "number", description: "Amount due.", extractionInstructions: "Prominent 'Amount Due'/'Total Due' value." },
        { name: "due_date", type: "date", description: "Payment due date.", extractionInstructions: "'Due Date'/'Pay By'." },
        { name: "usage_details", type: "object", description: "Usage metrics.", extractionInstructions: "Section 'Usage'/'Consumption'; extract values like kWh/Gallons/Therms and meter readings if present." },
      ],
    },
  ]

  const applySchemaTemplate = (templateId: string) => {
    const tpl = NESTED_TEMPLATES.find((t) => t.id === templateId)
    if (!tpl) return
    if (isSchemaFresh(activeSchema)) {
      setSchemas((prev) =>
        prev.map((s) => (s.id === activeSchemaId ? { ...s, name: tpl.name, fields: tpl.fields, templateId } : s)),
      )
    } else {
      const newSchema: SchemaDefinition = {
        id: `schema_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        name: tpl.name,
        fields: tpl.fields,
        jobs: [],
        templateId,
      }
      setSchemas((prev) => [...prev, newSchema])
      setActiveSchemaId(newSchema.id)
    }
  }

  // ROI helpers
  const shouldShowRoi = () => {
    try {
      const lastShown = localStorage.getItem('bb_roi_last_shown')
      if (lastShown) {
        const last = Number(lastShown)
        if (!Number.isNaN(last)) {
          const days = (Date.now() - last) / (1000 * 60 * 60 * 24)
          if (days < 30) return false
        }
      }
      const count = Number.parseInt(localStorage.getItem('bb_success_count') || '0') || 0
      return count >= 3
    } catch {
      return false
    }
  }

  // Helpers to update active schema's fields and jobs
  const setFields = (
    updater: SchemaField[] | ((prev: SchemaField[]) => SchemaField[]),
  ) => {
    setSchemas((prev) =>
      prev.map((s) => (s.id === activeSchemaId ? { ...s, fields: typeof updater === "function" ? (updater as any)(s.fields) : updater } : s)),
    )
  }

  const setJobs = (
    updater: ExtractionJob[] | ((prev: ExtractionJob[]) => ExtractionJob[]),
  ) => {
    setSchemas((prev) =>
      prev.map((s) => (s.id === activeSchemaId ? { ...s, jobs: typeof updater === "function" ? (updater as any)(s.jobs) : updater } : s)),
    )
  }

  const addSchema = () => {
    const nextIndex = schemas.length + 1
    const newSchema: SchemaDefinition = {
      id: `schema_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      name: `Schema ${nextIndex}`,
      fields: [],
      jobs: [],
    }
    setSchemas((prev) => [...prev, newSchema])
    setActiveSchemaId(newSchema.id)
  }

  const handleSelectSchema = (schemaId: string) => {
    setActiveSchemaId(schemaId)
  }

  const closeSchema = (id: string) => {
    setSchemas((prev) => {
      const filtered = prev.filter((s) => s.id !== id)
      if (filtered.length === 0) {
        const fallback: SchemaDefinition = {
          id: `schema_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          name: "Data Extraction Schema",
          fields: [],
          jobs: [],
        }
        setActiveSchemaId(fallback.id)
        return [fallback]
      }
      if (id === activeSchemaId) setActiveSchemaId(filtered[filtered.length - 1].id)
      return filtered
    })
  }

  const beginSchemaRename = () => {
    setSchemaNameInput(activeSchema.name || 'Data Extraction Schema')
    setEditingSchemaName(true)
  }

  const commitSchemaRename = () => {
    const next = (schemaNameInput || 'Data Extraction Schema').trim()
    setSchemas((prev) => prev.map((schema) => (schema.id === activeSchemaId ? { ...schema, name: next } : schema)))
    setSchemaNameInput(next)
    setEditingSchemaName(false)
  }

  const cancelSchemaRename = () => {
    setEditingSchemaName(false)
    setSchemaNameInput(activeSchema.name || 'Data Extraction Schema')
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files) return

    if (fields.length === 0 && !AI_AGENT_IDS.has(activeSchema.templateId || '')) {
      alert("Please define at least one column before uploading files.")
      return
    }

    for (const file of Array.from(files)) {
      const newJob: ExtractionJob = {
        id: `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        fileName: file.name,
        status: "pending",
        createdAt: new Date(),
      }
      setJobs((prev) => [...prev, newJob])
      setSelectedRowId(newJob.id)

      try {
        // Update status to processing
        setJobs((prev) => prev.map((job) => (job.id === newJob.id ? { ...job, status: "processing" } : job)))

        // Build nested schema tree without transformation fields
        const filterTransforms = (fs: SchemaField[]): SchemaField[] =>
          fs
            .filter((f) => !f.isTransformation)
            .map((f) => {
              if (f.type === "object") return { ...f, children: filterTransforms(f.children) }
              if (f.type === "list") return { ...f }
              if (f.type === "table") return { ...f, columns: filterTransforms(f.columns) }
              return f
            })
        const schemaTree = filterTransforms(fields)

        if (process.env.NODE_ENV !== 'production') {
          // eslint-disable-next-line no-console
          console.log("[bytebeam] Sending schemaTree:", schemaTree)
          // eslint-disable-next-line no-console
          console.log("[bytebeam] File:", file.name, file.type)
        }

        const compressionOptions = {
          targetBytes: 3_000_000,
          maxDim: 1800,
          quality: 0.75,
        }
        const compressed = await maybeDownscaleImage(file, compressionOptions)
        const uploadBlob = compressed.blob
        const uploadType = compressed.type || file.type || 'application/octet-stream'
        const uploadName = compressed.name || file.name
        const imageSizeExceededMessage = 'File is still larger than 3 MB after compression. Please resize or crop the image and try again.'
        const maxImageBytes = compressionOptions.targetBytes ?? 3_000_000

        if (uploadType.startsWith('image/') && uploadBlob.size > maxImageBytes) {
          throw new Error(imageSizeExceededMessage)
        }

        // Convert (potentially compressed) blob to base64 for downstream APIs
        const base64Data = await new Promise<string>((resolve, reject) => {
          try {
            const reader = new FileReader()
            reader.onload = () => {
              const result = reader.result as string
              const commaIndex = result.indexOf(",")
              resolve(commaIndex >= 0 ? result.slice(commaIndex + 1) : result)
            }
            reader.onerror = () => reject(reader.error)
            reader.readAsDataURL(uploadBlob)
          } catch (e) {
            reject(e)
          }
        })

        const fileData: SerializedFile = {
          name: uploadName,
          type: uploadType,
          size: uploadBlob.size,
          data: base64Data,
        }

        const isFnbAgent = activeSchema.templateId === FNB_AGENT_ID
        const isPharmaAgent = activeSchema.templateId === PHARMA_AGENT_ID

        // Special F&B Label Compliance flow: extraction then translation using fixed prompts
        if (isFnbAgent) {
          try {
            const { extraction, translation } = await extractAndTranslateFnb(fileData)
            const finalResults = mapFnbResults({ extraction, translation })

            setJobs((prev) =>
              prev.map((job) =>
                job.id === newJob.id
                  ? { ...job, status: 'completed', results: finalResults, completedAt: new Date() }
                  : job,
              ),
            )
            roi.recordSuccess()
          } catch (e) {
            console.error('FNB flow error:', e)
            setJobs((prev) =>
              prev.map((job) =>
                job.id === newJob.id
                  ? { ...job, status: 'error', completedAt: new Date() }
                  : job,
              ),
            )
          }
          continue
        }

        if (isPharmaAgent) {
          try {
            const payload = await fetchPharmaContent(fileData)
            const finalResults = mapPharmaResults(payload)

            setJobs((prev) =>
              prev.map((job) =>
                job.id === newJob.id
                  ? { ...job, status: 'completed', results: finalResults, completedAt: new Date() }
                  : job,
              ),
            )
            const hasMeaningfulContent = Object.entries(finalResults).some(([key, value]) => {
              if (typeof value !== 'string') return false
              if (['reasoning_trace', 'unique_identifiers', 'listing_diagnostics'].includes(key)) {
                return value.trim() !== '-' && value.trim() !== ''
              }
              return value.trim() !== '-'
            })
            if (hasMeaningfulContent) {
              roi.recordSuccess()
            }
          } catch (error) {
            console.error('Pharma agent error:', error)
            setJobs((prev) =>
              prev.map((job) =>
                job.id === newJob.id
                  ? { ...job, status: 'error', completedAt: new Date() }
                  : job,
              ),
            )
          }
          continue
        }

        // Call extraction API with JSON instead of FormData
        const result = await submitExtraction({
          file: fileData,
          schemaTree,
          extractionPromptOverride: undefined,
        })

        if (process.env.NODE_ENV !== 'production') {
          // eslint-disable-next-line no-console
          console.log("[bytebeam] API response:", result)
        }

        if (result.success) {
          if (Array.isArray(result.warnings) && result.warnings.length > 0) {
            console.warn('[bytebeam] Extraction warnings:', result.warnings)
          }
          // Flatten nested results (by field id) for grid/transform use
          const finalResults = flattenResultsById(fields, result.results)

          const formatValueForPrompt = (value: any): string => {
            if (value === null || value === undefined) return ""
            if (typeof value === 'object') {
              try {
                return JSON.stringify(value)
              } catch {
                return String(value)
              }
            }
            return String(value)
          }

          // Apply transformations safely
          displayColumns
            .filter((col) => col.isTransformation)
            .forEach((col) => {
              const rawType = (col.transformationType as string | undefined) || "gemini_api"
              const transformationType = rawType === "calculation" ? "gemini_api" : rawType

              if (transformationType === "currency_conversion") {
                try {
                  // Support structured config or legacy string expressions
                  let amount = 0
                  let rate = 1
                  let decimals: number | undefined

                  const cfg = col.transformationConfig
                  const resolveColumnValueById = (id: string): number => {
                    const v = finalResults[id]
                    const n = Number.parseFloat(String(v))
                    return isNaN(n) ? 0 : n
                  }
                  const resolveBraceOrNumber = (ref: any): number => {
                    if (typeof ref === "number") return ref
                    if (typeof ref === "string") {
                      const m = ref.match(/^\{([^}]+)\}$/)
                      if (m) {
                        const byName = displayColumns.find((c) => c.name === m[1].trim())
                        const v = byName ? finalResults[byName.id] : undefined
                        const n = Number.parseFloat(String(v))
                        return isNaN(n) ? 0 : n
                      }
                      const n = Number.parseFloat(ref)
                      return isNaN(n) ? 0 : n
                    }
                    return 0
                  }

                  if (cfg && typeof cfg === "object" && (cfg.amount || cfg.rate)) {
                    const amt = cfg.amount || { type: "number", value: 0 }
                    const rt = cfg.rate || { type: "number", value: 1 }
                    amount = amt.type === "column" ? resolveColumnValueById(String(amt.value)) : resolveBraceOrNumber(amt.value)
                    rate = rt.type === "column" ? resolveColumnValueById(String(rt.value)) : resolveBraceOrNumber(rt.value)
                    decimals = typeof cfg.decimals === "number" ? cfg.decimals : undefined
                  } else {
                    const cfgText = String(cfg || "")
                    try {
                      const j = JSON.parse(cfgText)
                      amount = resolveBraceOrNumber(j.amount ?? j.value)
                      rate = resolveBraceOrNumber(j.rate ?? j.fxRate ?? j.multiplier)
                      decimals = typeof j.decimals === "number" ? j.decimals : undefined
                    } catch {
                      // Fallback to formula string like "{Amount} * 3.75"
                      let expr = cfgText
                      const refs = expr.match(/\{([^}]+)\}/g)
                      if (refs) {
                        for (const r of refs) {
                          const name = r.slice(1, -1).trim()
                          const refCol = displayColumns.find((c) => c.name === name)
                          const v = refCol ? finalResults[refCol.id] : undefined
                          const n = Number.parseFloat(String(v))
                          expr = expr.split(r).join(!isNaN(n) ? String(n) : "0")
                        }
                      }
                      const safe = expr.replace(/[^0-9+\-*/.() ]/g, "")
                      const fn = new Function(`"use strict"; return (${safe})`)
                      const out = fn()
                      const num = typeof out === "number" && isFinite(out) ? out : 0
                      finalResults[col.id] = num
                      return
                    }
                  }

                  let out = amount * rate
                  if (typeof decimals === "number") {
                    const p = Math.pow(10, Math.max(0, decimals))
                    out = Math.round(out * p) / p
                  }
                  finalResults[col.id] = out
                } catch (e) {
                  console.error("Currency conversion error:", e)
                  finalResults[col.id] = 0
                }
              } else if (transformationType === "gemini_api") {
                if (!(col.id in finalResults)) {
                  finalResults[col.id] = ""
                }
                // Gemini transforms are resolved asynchronously below
              } else if (transformationType === "classification") {
                // Simple classification based on rules
                finalResults[col.id] = "Classified result"
              } else {
                finalResults[col.id] = "Transformation result"
              }
            })

          // Update with initial transformation results (calc/currency/classification)
          setJobs((prev) =>
            prev.map((job) =>
              job.id === newJob.id
                ? {
                    ...job,
                    status: "completed",
                    results: finalResults,
                    completedAt: new Date(),
                  }
                : job,
            ),
          )

          // Now perform any async Gemini transformations per column, then patch results into job
          const geminiTransformColumns = displayColumns.filter((c) => {
            if (!c.isTransformation) return false
            const rawType = c.transformationType as string | undefined
            return rawType === "gemini_api" || rawType === "calculation" || rawType === undefined
          })
          for (const tcol of geminiTransformColumns) {
            try {
              const source = (tcol.transformationSource as "document" | "column" | undefined) || "document"
              const promptTemplate =
                typeof tcol.transformationConfig === 'string'
                  ? tcol.transformationConfig
                  : tcol.transformationConfig
                    ? (() => {
                        try {
                          return JSON.stringify(tcol.transformationConfig)
                        } catch {
                          return String(tcol.transformationConfig)
                        }
                      })()
                    : ''

              const referencedValues = new Map<string, string>()
              const resolvedPrompt = promptTemplate.replace(/\{([^}]+)\}/g, (_, rawName) => {
                const name = String(rawName || '').trim()
                if (!name) return ''
                const referencedColumn = displayColumns.find((c) => c.name === name)
                if (!referencedColumn) {
                  console.warn(`[bytebeam] Gemini transform: column '${name}' not found for prompt substitution`)
                  return `[missing ${name}]`
                }
                const formattedValue = formatValueForPrompt(finalResults[referencedColumn.id])
                referencedValues.set(name, formattedValue)
                return formattedValue
              })

              let promptWithContext = resolvedPrompt
              if (referencedValues.size > 0) {
                const contextLines = Array.from(referencedValues.entries())
                  .map(([name, value]) => `${name}: ${value}`)
                  .join('\n')
                promptWithContext = `${resolvedPrompt}\n\nColumn context:\n${contextLines}`
              }

              const finalPrompt = promptWithContext.trim().length > 0
                ? promptWithContext
                : 'Return the relevant value from the provided input.'

              const payload: any = {
                type: 'gemini',
                prompt: finalPrompt,
                inputSource: source,
              }
              if (source === "document") {
                payload.file = fileData
              } else {
                let value: any = undefined
                if (tcol.transformationSourceColumnId) {
                  value = finalResults[tcol.transformationSourceColumnId]
                } else if (referencedValues.size > 0) {
                  const [firstName] = referencedValues.keys()
                  if (firstName) {
                    const refCol = displayColumns.find((c) => c.name === firstName)
                    if (refCol) value = finalResults[refCol.id]
                  }
                }
                payload.inputText = formatValueForPrompt(value)
              }

              const resp = await fetch("/api/transform", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
              })
              const data = await resp.json()
              if (data?.success) {
                let val: any = data.result
                try { val = JSON.parse(data.result) } catch {}
                finalResults[tcol.id] = val
              } else {
                finalResults[tcol.id] = data?.error || "Transformation failed"
              }
            } catch (e) {
              console.error("Gemini transform error:", e)
              finalResults[tcol.id] = "Error"
            }
          }

          // Patch job with final results after async transformations
          setJobs((prev) =>
            prev.map((job) =>
              job.id === newJob.id
                ? {
                    ...job,
                    results: finalResults,
                  }
                : job,
            ),
          )
          // Lead modal trigger after successful extraction
          roi.recordSuccess()
        } else {
          throw new Error(result.error || "Extraction failed")
        }
      } catch (error) {
        console.error("Extraction error:", error)
        setJobs((prev) =>
          prev.map((job) =>
            job.id === newJob.id
              ? {
                  ...job,
                  status: "error",
                  completedAt: new Date(),
                }
              : job,
          ),
        )
      }
    }

    // Clear the file input so selecting the same file again triggers onChange
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const getStatusIcon = (status: ExtractionJob["status"]) => {
    const iconSizing = "h-3.5 w-3.5"
    switch (status) {
      case "completed":
        return <CheckCircle className={`${iconSizing} text-accent`} />
      case "processing":
        return <Clock className={`${iconSizing} text-primary animate-spin`} />
      case "error":
        return <AlertCircle className={`${iconSizing} text-destructive`} />
      default:
        return <Clock className={`${iconSizing} text-muted-foreground`} />
    }
  }

  const renderStatusPill = (
    status: ExtractionJob["status"],
    opts?: { size?: 'default' | 'compact' },
  ) => {
    const size = opts?.size ?? 'default'
    const base = cn(
      'inline-flex items-center rounded-full font-semibold uppercase tracking-wide transition-colors',
      size === 'compact' ? 'px-1.5 py-0.5 text-[10px]' : 'px-2.5 py-0.5 text-[11px]',
    )

    if (status === 'completed') {
      return (
        <span className={cn(base, 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300')}>
          Completed
        </span>
      )
    }
    if (status === 'processing') {
      return (
        <span className={cn(base, 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300')}>
          Processing
        </span>
      )
    }
    if (status === 'error') {
      return (
        <span className={cn(base, 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300')}>
          Error
        </span>
      )
    }
    return <span className={cn(base, 'bg-muted text-muted-foreground')}>Pending</span>
  }

  const getCellAlignClasses = (type: DataType) => {
    if (type === 'number' || type === 'decimal') return 'text-right [font-variant-numeric:tabular-nums]'
    if (type === 'date') return 'font-mono text-xs'
    return 'text-left'
  }

  type GridRenderMode = 'interactive' | 'summary' | 'detail'

  const renderCellValue = (
    column: SchemaField,
    job: ExtractionJob,
    opts?: { refreshRowHeight?: () => void; mode?: GridRenderMode },
  ) => {
    const value = job.results?.[column.id]
    if (job.status === 'error') return <span className="text-sm text-destructive">—</span>
    if (job.status !== 'completed') return <Skeleton className="h-4 w-24" />

    const mode: GridRenderMode = opts?.mode ?? 'interactive'

    const isEmptyValue =
      value === undefined ||
      value === null ||
      (typeof value === 'string' && value.trim().length === 0) ||
      (Array.isArray(value) && value.length === 0)

    if (isEmptyValue) {
      return <span className="text-muted-foreground">—</span>
    }

    if (column.type === 'boolean') {
      const truthy = Boolean(value)
      return (
        <span
          className={cn(
            'inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide transition-colors',
            truthy
              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
              : 'bg-muted text-muted-foreground',
          )}
        >
          {truthy ? 'True' : 'False'}
        </span>
      )
    }

    if (column.type === 'number' || column.type === 'decimal') {
      const formatted = formatNumericValue(value)
      return (
        <span className="text-sm font-medium text-foreground tabular-nums">
          {formatted ?? String(value)}
        </span>
      )
    }

    if (column.type === 'date') {
      const formatted = formatDateValue(value)
      return (
        <span className="font-mono text-xs" title={String(value)}>
          {formatted ?? String(value)}
        </span>
      )
    }

    const renderCompositeShell = (
      type: 'object' | 'table' | 'list',
      summary: string,
      meta: string | null,
      detail: React.ReactNode,
    ) => {
      const expanded = mode === 'detail' ? true : isCellExpanded(job.id, column.id)
      const badge = (
        <span
          className={cn(
            'inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide',
            compositeBadgeStyles[type],
          )}
        >
          {compositeBadgeLabels[type]}
        </span>
      )

      const headerContent = (
        <div className="flex items-center gap-3">
          {badge}
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-semibold text-foreground">{summary}</div>
            {meta && <div className="truncate text-xs text-muted-foreground">{meta}</div>}
          </div>
          {mode === 'interactive' && (
            <ChevronDown
              className={cn(
                'h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200',
                expanded ? 'rotate-180' : 'rotate-0',
              )}
            />
          )}
        </div>
      )

      if (mode === 'summary') {
        return (
          <div className="rounded-xl border border-[#2782ff]/10 bg-white/75 px-3 py-2 shadow-sm">
            {headerContent}
          </div>
        )
      }

      if (mode === 'detail') {
        return (
          <div className="space-y-2">
            <div className="rounded-xl border border-[#2782ff]/15 bg-white/85 px-3 py-2 shadow-sm">
              {headerContent}
            </div>
            <div className="rounded-xl border border-[#2782ff]/20 bg-[#e6f0ff]/60 p-3 text-sm shadow-inner dark:border-[#1a4b8f]/40 dark:bg-[#0b2547]/40">
              {detail}
            </div>
          </div>
        )
      }

      return (
        <div className="space-y-2">
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation()
              toggleCellExpansion(job.id, column.id)
              queueMicrotask(() => opts?.refreshRowHeight?.())
            }}
            className="w-full rounded-xl border border-[#2782ff]/20 bg-white/70 px-3 py-2 text-left shadow-sm transition-all hover:-translate-y-[1px] hover:border-[#2782ff]/40 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2782ff]/40"
            aria-expanded={expanded}
          >
            {headerContent}
          </button>
          <div
            className={cn(
              'grid transition-all duration-300 ease-in-out',
              expanded ? 'grid-rows-[1fr] opacity-100' : 'pointer-events-none grid-rows-[0fr] opacity-0',
            )}
          >
            <div className="overflow-hidden">
              <div className="rounded-xl border border-[#2782ff]/20 bg-[#e6f0ff]/60 p-3 text-sm shadow-inner dark:border-[#1a4b8f]/40 dark:bg-[#0b2547]/40">
                {detail}
              </div>
            </div>
          </div>
        </div>
      )
    }

    if (column.type === 'object' && value && typeof value === 'object' && !Array.isArray(value)) {
      const record = value as Record<string, any>
      const amountLike = record.amount ?? record.total ?? record.value
      const currencyLike = record.currency ?? record.ccy ?? record.iso ?? record.code

      // Special-case monetary object values
      if (amountLike !== undefined && (typeof amountLike === 'number' || typeof amountLike === 'string')) {
        const formattedAmount = formatNumericValue(amountLike) ?? String(amountLike)
        return (
          <div className="flex items-baseline gap-2">
            <span className="text-base font-semibold tracking-tight text-foreground tabular-nums">{formattedAmount}</span>
            {currencyLike && (
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                {String(currencyLike)}
              </span>
            )}
          </div>
        )
      }

      const entries = getObjectEntries(column, record)
      // Build a collapsed summary using sub-fields marked displayInSummary
      let summary = firstNonEmptyText(record) ?? ''
      if (!summary) {
        const labelsForSummary: string[] = []
        if (column.type === 'object') {
          const objectColumn = column as Extract<SchemaField, { type: 'object' }>
          const displayChildren = (objectColumn.children || []).filter((c) => (c as any).displayInSummary)
          // Map to values from record in the same order as children
          for (const child of displayChildren) {
            const valueForChild = record[child.id] ?? record[child.name]
            if (valueForChild !== undefined && valueForChild !== null && String(valueForChild).trim() !== '') {
              labelsForSummary.push(String(valueForChild))
            }
          }
        }
        summary = labelsForSummary.length > 0 ? labelsForSummary.join(' / ') : `${entries.length} ${entries.length === 1 ? 'field' : 'fields'}`
      }
      const detail = (
        <div className="space-y-2">
          {entries.map(({ label, value: entryValue }) => (
            <div key={label} className="flex items-start justify-between gap-4">
              <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</span>
              <span className="max-w-[16rem] text-sm font-medium text-foreground">
                {typeof entryValue === 'number'
                  ? formatNumericValue(entryValue) ?? String(entryValue)
                  : typeof entryValue === 'boolean'
                    ? entryValue ? 'True' : 'False'
                    : typeof entryValue === 'object'
                      ? JSON.stringify(entryValue)
                      : String(entryValue)}
              </span>
            </div>
          ))}
        </div>
      )

      return renderCompositeShell('object', summary, `${entries.length} ${entries.length === 1 ? 'detail' : 'details'}`, detail)
    }

    if (column.type === 'table' && Array.isArray(value)) {
      const rows = value as Record<string, any>[]
      const columnsForTable =
        column.type === 'table' && 'columns' in column
          ? (column as Extract<SchemaField, { type: 'table' }>).columns
          : []
      const columnHeaders =
        columnsForTable.length > 0
          ? columnsForTable.map((col) => ({
              key: col.id ?? col.name,
              label: col.name,
            }))
          : Array.from(
              rows.reduce((set, row) => {
                Object.keys(row || {}).forEach((key) => set.add(key))
                return set
              }, new Set<string>()),
            ).map((key) => ({ key, label: prettifyKey(key) }))

      const detail = rows.length === 0
        ? <span className="text-sm text-muted-foreground">No entries</span>
        : (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Table Preview</span>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => openTableModal(column, job, rows, columnHeaders)}
                className="h-7 px-2 text-xs"
              >
                <Maximize2 className="mr-1 h-3 w-3" />
                View Full Table
                {rows.length > 5 && (
                  <span className="ml-1 px-1 py-0.5 text-xs bg-blue-100 text-blue-700 rounded-full">
                    {rows.length}
                  </span>
                )}
              </Button>
            </div>
            <div className="overflow-x-auto" style={{ maxHeight: rows.length <= 2 ? '200px' : '300px' }}>
              <table className="min-w-full border-separate border-spacing-y-1 text-sm">
                <thead>
                  <tr className="text-xs uppercase tracking-wide text-muted-foreground">
                    {columnHeaders.map((header) => (
                      <th key={header.key} className="bg-white/70 px-2 py-1 text-left font-medium first:rounded-l-md last:rounded-r-md shadow-sm">{header.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.slice(0, Math.min(rows.length, 5)).map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/30">
                      {columnHeaders.map((header) => {
                        const cell = row?.[header.key as keyof typeof row]
                        const formatted =
                          typeof cell === 'number'
                            ? formatNumericValue(cell) ?? String(cell)
                            : typeof cell === 'boolean'
                              ? cell ? 'True' : 'False'
                              : typeof cell === 'object'
                                ? JSON.stringify(cell)
                                : cell ?? '—'
                        return (
                          <td key={header.key} className="bg-white px-2 py-1 text-left text-sm first:rounded-l-md last:rounded-r-md shadow-sm">
                            <span className="block truncate" title={String(formatted)}>
                              {String(formatted)}
                            </span>
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
              {rows.length > 5 && (
                <div className="text-center py-2 text-xs text-muted-foreground bg-slate-50/50 rounded-b-md">
                  ... and {rows.length - 5} more rows
                </div>
              )}
            </div>
          </div>
        )

      return renderCompositeShell(
        'table',
        `${rows.length} ${rows.length === 1 ? 'entry' : 'entries'}`,
        columnsForTable.length ? `${columnsForTable.length} columns` : null,
        detail,
      )
    }

    if (column.type === 'list' && Array.isArray(value)) {
      const items = value as any[]
      const meta = `${items.length} ${items.length === 1 ? 'item' : 'items'}`
      const detail = (
        <div className="space-y-2">
          {items.map((item, idx) => (
            <div key={idx} className="rounded-lg bg-white/80 px-3 py-2 shadow-sm">
              {item && typeof item === 'object' ? (
                <pre className="whitespace-pre-wrap text-xs text-foreground/80">{JSON.stringify(item, null, 2)}</pre>
              ) : (
                <span className="text-sm text-foreground">{String(item)}</span>
              )}
            </div>
          ))}
        </div>
      )

      const summary = items[0] && typeof items[0] === 'string' ? String(items[0]) : meta

      return renderCompositeShell('list', summary, meta, detail)
    }

    if (Array.isArray(value)) {
      const items = value as any[]
      return renderCompositeShell(
        'list',
        `${items.length} ${items.length === 1 ? 'item' : 'items'}`,
        null,
        <pre className="whitespace-pre-wrap text-xs text-foreground/80">{JSON.stringify(items, null, 2)}</pre>,
      )
    }

    if (value && typeof value === 'object') {
      const record = value as Record<string, any>
      const entries = Object.keys(record)
      return renderCompositeShell(
        'object',
        firstNonEmptyText(record) ?? `${entries.length} fields`,
        null,
        <pre className="whitespace-pre-wrap text-xs text-foreground/80">{JSON.stringify(record, null, 2)}</pre>,
      )
    }

    return (
      <span className="truncate text-sm" title={String(value)}>
        {String(value)}
      </span>
    )
  }

  const exportToCSV = () => {
    // Prepare CSV headers
    const headers = ['File Name', 'Status', ...displayColumns.map((col) => col.name)]

    const formatCell = (val: unknown): string => {
      if (val === undefined || val === null) return ''
      if (typeof val === 'object') {
        try {
          return JSON.stringify(val)
        } catch {
          return String(val)
        }
      }
      return String(val)
    }

    const escapeCSV = (cell: string): string => {
      // Quote when containing comma, quote, or newline
      if (cell.includes(',') || cell.includes('"') || cell.includes('\n')) {
        return '"' + cell.replace(/"/g, '""') + '"'
      }
      return cell
    }

    // Prepare CSV rows for all jobs in current schema
    const rows = jobs.map((job) => {
      const row: string[] = [job.fileName, job.status]
      displayColumns.forEach((col) => {
        const value = job.results?.[col.id]
        row.push(formatCell(value))
      })
      return row
    })

    // Convert to CSV string
    const csvContent = [
      headers.map(escapeCSV).join(','),
      ...rows.map((row) => row.map(escapeCSV).join(',')),
    ].join('\n')

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    const schemaLabel = (activeSchema.name || 'schema').replace(/[^a-z0-9-_]+/gi, '_')
    link.setAttribute('download', `${schemaLabel}_results_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // F&B: Build and print localized label PDF (printable HTML)
  return (
    <div className="flex flex-col h-screen bg-background">
      <SetupBanner />

      <SchemasTabs
        schemas={schemas}
        activeSchemaId={activeSchemaId}
        onSelectSchema={handleSelectSchema}
        onCloseSchema={closeSchema}
        onAddSchema={addSchema}
      />

      <div className="flex flex-1 min-h-0 min-w-0">

        {/* Sidebar disabled on all screen sizes */}

          {/* Main Content - Excel-style Table */}
          <div className="flex-1 flex flex-col min-h-0 min-w-0">
          <PlatformHeader
            schemaName={activeSchema.name || 'Data Extraction Schema'}
            editingSchemaName={editingSchemaName}
            schemaNameInput={schemaNameInput}
            onStartEditingName={beginSchemaRename}
            onChangeSchemaNameInput={setSchemaNameInput}
            onCommitSchemaName={commitSchemaRename}
            onCancelSchemaName={cancelSchemaRename}
            isSchemaFresh={isSchemaFresh(activeSchema)}
            aiAgentOptions={AI_AGENT_OPTIONS.map(({ id, name }) => ({ id, name }))}
            templateOptions={TEMPLATE_OPTIONS.map(({ id, name }) => ({ id, name }))}
            onTemplateSelect={applySchemaTemplate}
            isFnbAgent={activeSchema.templateId === FNB_AGENT_ID}
            canPrintLabel={jobs.some((job) => job.status === 'completed')}
            onPrintLabel={() => {
              const jobToPrint =
                sortedJobs.find((job) => job.id === selectedRowId) ||
                sortedJobs.find((job) => job.status === 'completed') ||
                sortedJobs[sortedJobs.length - 1]
              printLocalizedLabel(jobToPrint)
            }}
            showExportButton={activeSchema.templateId !== FNB_AGENT_ID}
            onExportCsv={exportToCSV}
            uploadDisabled={fields.length === 0 && !AI_AGENT_IDS.has(activeSchema.templateId || '')}
            onUploadClick={() => fileInputRef.current?.click()}
            fileInputRef={fileInputRef}
            onFileInputChange={handleFileUpload}
            showFieldHint={fields.length === 0}
          />
          {/* Main Body */}
          <div className="flex-1 overflow-auto min-h-0 min-w-0 relative">
            {activeSchema.templateId === FNB_AGENT_ID ? (
              <FnbPanel
                jobs={sortedJobs}
                selectedJobId={selectedRowId}
                onSelectJob={(jobId) => setSelectedRowId(jobId)}
                getStatusIcon={getStatusIcon}
              />
            ) : activeSchema.templateId === PHARMA_AGENT_ID ? (
              <PharmaPanel
                jobs={sortedJobs}
                selectedJobId={selectedRowId}
                onSelectJob={(jobId) => setSelectedRowId(jobId)}
                getStatusIcon={getStatusIcon}
              />
            ) : (
              <div className="p-4 h-full">
                <ColumnsPanel columns={displayColumns} setFields={setFields}>
                  {({ onAddColumn, onEditColumn, onDeleteColumn }) => (
                    <JobsPanel
                      columns={displayColumns}
                      jobs={sortedJobs}
                      selectedRowId={selectedRowId}
                      onSelectRow={(jobId) => setSelectedRowId(jobId)}
                      renderCellValue={renderCellValue}
                      getStatusIcon={getStatusIcon}
                      renderStatusPill={renderStatusPill}
                      onUpdateCell={(jobId, columnId, value) => {
                        setJobs((prev) =>
                          prev.map((job) =>
                            job.id === jobId
                              ? { ...job, results: { ...(job.results || {}), [columnId]: value } }
                              : job,
                          ),
                        )
                      }}
                      onAddColumn={onAddColumn}
                      onEditColumn={onEditColumn}
                      onDeleteColumn={onDeleteColumn}
                    />
                  )}
                </ColumnsPanel>
              </div>
            )}
          </div>
      </div>

      <RoiModal
        open={roi.isOpen}
        stage={roi.stage}
        onOpenChange={(next) => (next ? roi.open() : roi.close())}
        docsPerMonth={roi.docsPerMonth}
        onDocsPerMonthChange={roi.setDocsPerMonth}
        timePerDoc={roi.timePerDoc}
        onTimePerDocChange={roi.setTimePerDoc}
        hourlyCost={roi.hourlyCost}
        onHourlyCostChange={roi.setHourlyCost}
        onCalculate={roi.calculate}
        totalHoursSaved={roi.totalHoursSaved}
        monthlyDollarSavings={roi.monthlyDollarSavings}
        annualDollarSavings={roi.annualDollarSavings}
        bookingUrl={BOOKING_URL}
      />

      <TableModal
        open={tableModal.isOpen}
        payload={tableModal.payload}
        onClose={tableModal.close}
        formatNumericValue={formatNumericValue}
      />
      </div>
    </div>
  )
}
