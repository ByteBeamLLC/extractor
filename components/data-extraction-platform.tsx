"use client"

import type React from "react"

import { useState, useRef, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { Skeleton } from "@/components/ui/skeleton"
import { SetupBanner } from "./setup-banner"
import { TransformBuilder } from "@/components/transform-builder"
 
import {
  type DataType,
  type TransformationType,
  type SchemaField,
  type SchemaDefinition,
  type ExtractionJob,
  flattenFields,
  updateFieldById,
  removeFieldById,
  flattenResultsById,
} from "@/lib/schema"
 
import {
  Upload,
  Plus,
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
  Trash2,
  Download,
  CheckCircle,
  Clock,
  AlertCircle,
  X,
 
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
  calculation: Calculator,
  gemini_api: Zap,
  custom: Settings,
}

// Downscale large images client-side to avoid Vercel 413 limits
async function maybeDownscaleImage(
  file: File,
  opts?: { maxDim?: number; quality?: number; targetBytes?: number },
): Promise<{ blob: Blob; type: string; name: string }> {
  try {
    const targetBytes = opts?.targetBytes ?? 4_000_000 // ~4 MB
    if (!file.type?.startsWith('image/')) {
      return { blob: file, type: file.type || 'application/octet-stream', name: file.name }
    }
    if (file.size <= targetBytes) {
      return { blob: file, type: file.type || 'image/jpeg', name: file.name }
    }

    const maxDim = opts?.maxDim ?? 2000
    const quality = opts?.quality ?? 0.8

    const bitmap = await createImageBitmap(file)
    const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height))
    const width = Math.max(1, Math.round(bitmap.width * scale))
    const height = Math.max(1, Math.round(bitmap.height * scale))

    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    if (!ctx) return { blob: file, type: file.type || 'image/jpeg', name: file.name }
    ctx.drawImage(bitmap, 0, 0, width, height)

    const type = 'image/jpeg'
    const blob: Blob = await new Promise((resolve, reject) => {
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('toBlob failed'))), type, quality)
    })

    if (blob.size > targetBytes) {
      const maxDim2 = Math.round(maxDim * 0.8)
      const quality2 = Math.max(0.5, quality * 0.85)
      const scale2 = Math.min(1, maxDim2 / Math.max(bitmap.width, bitmap.height))
      const w2 = Math.max(1, Math.round(bitmap.width * scale2))
      const h2 = Math.max(1, Math.round(bitmap.height * scale2))
      canvas.width = w2
      canvas.height = h2
      ctx.clearRect(0, 0, w2, h2)
      ctx.drawImage(bitmap, 0, 0, w2, h2)
      const blob2: Blob = await new Promise((resolve, reject) => {
        canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('toBlob failed'))), type, quality2)
      })
      return { blob: blob2, type, name: file.name.replace(/\.(png|webp|bmp|gif)$/i, '.jpg') }
    }

    return { blob, type, name: file.name.replace(/\.(png|webp|bmp|gif)$/i, '.jpg') }
  } catch {
    return { blob: file, type: file.type || 'application/octet-stream', name: file.name }
  }
}

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

export function DataExtractionPlatform() {
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
  const [selectedColumn, setSelectedColumn] = useState<SchemaField | null>(null)
  const [draftColumn, setDraftColumn] = useState<SchemaField | null>(null)
  const [isColumnDialogOpen, setIsColumnDialogOpen] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [addMode, setAddMode] = useState<'column' | 'transform'>('column')
  // Schema name editing
  const [editingSchemaName, setEditingSchemaName] = useState(false)
  const [schemaNameInput, setSchemaNameInput] = useState<string>(activeSchema.name)
  
  // UI state for modern grid behaviors
  const [hoveredColumnId, setHoveredColumnId] = useState<string | null>(null)
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null)
  // F&B translation collapsible state per job
  const [fnbCollapse, setFnbCollapse] = useState<Record<string, { en: boolean; ar: boolean }>>({})
  const scrollRef = useRef<HTMLDivElement>(null)
  const [canScroll, setCanScroll] = useState<{ left: boolean; right: boolean }>({ left: false, right: false })
  // ROI modal state
  const [roiOpen, setRoiOpen] = useState(false)
  const [roiStage, setRoiStage] = useState<'calc' | 'result'>('calc')
  const [docsPerMonth, setDocsPerMonth] = useState<string>('')
  const [timePerDoc, setTimePerDoc] = useState<string>('')
  const [hourlyCost, setHourlyCost] = useState<string>('')
  const [totalHoursSaved, setTotalHoursSaved] = useState<number>(0)
  const [monthlyDollarSavings, setMonthlyDollarSavings] = useState<number | null>(null)
  const [annualDollarSavings, setAnnualDollarSavings] = useState<number | null>(null)
  const completedJobsCount = jobs.filter((j) => j.status === 'completed').length
  // Avoid referencing process.env in client runtime
  const { BOOKING_URL } = require("@/lib/publicEnv") as { BOOKING_URL: string }
  const isSchemaFresh = (s: SchemaDefinition) => (s.fields?.length ?? 0) === 0 && (s.jobs?.length ?? 0) === 0

  // Minimal nested templates to seed schemas
  const NESTED_TEMPLATES: { id: string; name: string; description?: string; fields: SchemaField[] }[] = [
    // {
    //   id: "fnb-label-compliance",
    //   name: "F&B Label Compliance",
    //   description: "Primary-language extraction + EN/AR translation in split view.",
    //   fields: [],
    // },
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

  

  // Column sizing / resizing
  const DEFAULT_COL_WIDTH = 192 // px (~w-48)
  const MIN_COL_WIDTH = 120
  const MAX_COL_WIDTH = 640
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({})
  const resizingRef = useRef<{ colId: string | null; startX: number; startWidth: number }>({
    colId: null,
    startX: 0,
    startWidth: 0,
  })
  const headerRefs = useRef<Record<string, HTMLDivElement | null>>({})

  const getColWidth = (colId: string) => columnWidths[colId] ?? DEFAULT_COL_WIDTH

  const startResize = (colId: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    resizingRef.current = {
      colId,
      startX: e.clientX,
      startWidth: getColWidth(colId),
    }
    // Improve UX while resizing
    try {
      document.body.style.userSelect = 'none'
      document.body.style.cursor = 'col-resize'
    } catch {}
  }

  const autoFit = (colId: string) => {
    const el = headerRefs.current[colId]
    if (!el) return
    // measure content width and clamp
    const contentWidth = el.scrollWidth + 32 // padding
    const next = Math.min(MAX_COL_WIDTH, Math.max(MIN_COL_WIDTH, contentWidth))
    setColumnWidths((prev) => ({ ...prev, [colId]: next }))
  }

  // Global mouse handlers for resize
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const ref = resizingRef.current
      if (!ref.colId) return
      const dx = e.clientX - ref.startX
      const raw = ref.startWidth + dx
      const next = Math.min(MAX_COL_WIDTH, Math.max(MIN_COL_WIDTH, raw))
      setColumnWidths((prev) => ({ ...prev, [ref.colId as string]: next }))
    }
    const onUp = () => {
      if (resizingRef.current.colId) {
        resizingRef.current.colId = null
        try {
          document.body.style.userSelect = ''
          document.body.style.cursor = ''
        } catch {}
      }
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
  }, [])

  // Initialize width for new columns based on header text length
  // updated below after computing displayColumns

  // Export CSV helper available via header button

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

  const recordSuccessAndMaybeOpenRoi = () => {
    try {
      const current = Number.parseInt(localStorage.getItem('bb_success_count') || '0') || 0
      const next = current + 1
      localStorage.setItem('bb_success_count', String(next))
      if (next >= 3) {
        const lastShown = Number(localStorage.getItem('bb_roi_last_shown') || '0')
        const days = lastShown ? (Date.now() - lastShown) / (1000 * 60 * 60 * 24) : Infinity
        if (days >= 30) {
          setRoiStage('calc')
          setRoiOpen(true)
        }
      }
    } catch {}
  }

  const onCloseRoi = (open: boolean) => {
    setRoiOpen(open)
    if (!open) {
      try { localStorage.setItem('bb_roi_last_shown', String(Date.now())) } catch {}
    }
  }

  const calculateSavings = () => {
    const d = Math.max(0, Number(docsPerMonth) || 0)
    const t = Math.max(0, Number(timePerDoc) || 0)
    const h = Math.max(0, Number(hourlyCost) || 0)
    const minutes = d * t
    const hours = Math.round(minutes / 60)
    setTotalHoursSaved(hours)
    if (h > 0) {
      const monthly = hours * h
      setMonthlyDollarSavings(monthly)
      setAnnualDollarSavings(monthly * 12)
    } else {
      setMonthlyDollarSavings(null)
      setAnnualDollarSavings(null)
    }
    setRoiStage('result')
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
    setSelectedColumn(null)
    setIsColumnDialogOpen(false)
    
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
    setSelectedColumn(null)
    setIsColumnDialogOpen(false)
  }

  const addColumn = () => {
    const newColumn: SchemaField = {
      id: `col_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: `Column ${displayColumns.length + 1}`,
      type: "string",
      description: "",
      extractionInstructions: "",
      required: false,
    }
    const updatedFields = [...fields, newColumn]
    setFields(updatedFields)
    // Open dialog after a short delay to ensure state is updated
    setTimeout(() => {
      setSelectedColumn(newColumn)
      setDraftColumn(JSON.parse(JSON.stringify(newColumn)))
      setIsColumnDialogOpen(true)
    }, 100)
  }

  const addTransformationColumn = () => {
    const newColumn: SchemaField = {
      id: `transform_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: `Transform ${displayColumns.filter((c) => c.isTransformation).length + 1}`,
      type: "string",
      description: "",
      extractionInstructions: "",
      required: false,
      isTransformation: true,
      transformationType: "calculation",
    }
    const updatedFields = [...fields, newColumn]
    setFields(updatedFields)
    // Open dialog after a short delay to ensure state is updated
    setTimeout(() => {
      setSelectedColumn(newColumn)
      setDraftColumn(JSON.parse(JSON.stringify(newColumn)))
      setIsColumnDialogOpen(true)
    }, 100)
  }

  const updateColumn = (columnId: string, updates: Partial<SchemaField>) => {
    setFields((prev) => updateFieldById(prev, columnId, (f) => {
      // Normalize shape when changing type between leaf/compound kinds
      const next = { ...f, ...updates } as SchemaField
      if (updates.type && updates.type !== f.type) {
        if (updates.type === 'object') {
          ;(next as any).children = Array.isArray((next as any).children) ? (next as any).children : []
          delete (next as any).item
          delete (next as any).columns
        } else if (updates.type === 'list') {
          if (!(next as any).item) {
            ;(next as any).item = {
              id: `${next.id}_item`,
              name: 'item',
              type: 'string',
              description: '',
              extractionInstructions: '',
              required: false,
            }
          }
          delete (next as any).children
          delete (next as any).columns
        } else if (updates.type === 'table') {
          ;(next as any).columns = Array.isArray((next as any).columns) ? (next as any).columns : []
          delete (next as any).children
          delete (next as any).item
        } else {
          // Leaf primitive
          delete (next as any).children
          delete (next as any).item
          delete (next as any).columns
        }
      }
      return next
    }))
    if (selectedColumn?.id === columnId) setSelectedColumn({ ...selectedColumn, ...updates } as SchemaField)
    
  }

  const deleteColumn = (columnId: string) => {
    setFields((prev) => removeFieldById(prev, columnId))
    
    if (selectedColumn?.id === columnId) {
      setSelectedColumn(null)
      setIsColumnDialogOpen(false)
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files) return

    if (fields.length === 0 && activeSchema.templateId !== 'fnb-label-compliance') {
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

        // Convert file to base64 without spreading huge arrays (prevents stack overflow)
        const base64Data = await new Promise<string>((resolve, reject) => {
          try {
            const reader = new FileReader()
            reader.onload = () => {
              const result = reader.result as string
              const commaIndex = result.indexOf(",")
              resolve(commaIndex >= 0 ? result.slice(commaIndex + 1) : result)
            }
            reader.onerror = () => reject(reader.error)
            reader.readAsDataURL(file)
          } catch (e) {
            reject(e)
          }
        })

        const fileData = {
          name: file.name,
          type: file.type,
          size: file.size,
          data: base64Data,
        }

        // Special F&B Label Compliance flow: extraction then translation using fixed prompts
        if (activeSchema.templateId === 'fnb-label-compliance') {
          try {
            // Compress large images to avoid 413 and send raw binary
            const { blob, type, name } = await maybeDownscaleImage(file, { targetBytes: 4_000_000, maxDim: 2000, quality: 0.8 })
            const binary = await blob.arrayBuffer()
            const r1 = await fetch('/api/fnb/extract', {
              method: 'POST',
              headers: {
                'Content-Type': type || file.type || 'application/octet-stream',
                'X-File-Name': name || file.name,
              },
              body: binary,
            })
            if (!r1.ok) {
              const errText = await r1.text().catch(() => `${r1.status} ${r1.statusText}`)
              throw new Error(`Extraction request failed: ${r1.status} ${r1.statusText} - ${errText}`)
            }
            const j1 = await r1.json()
            if (!j1?.success) throw new Error(j1?.error || 'Extraction failed')
            const extraction = j1.data

            const source = extraction?.product_initial_language ?? extraction
            const r2 = await fetch('/api/fnb/translate', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ source }),
            })
            if (!r2.ok) {
              const errText = await r2.text().catch(() => `${r2.status} ${r2.statusText}`)
              throw new Error(`Translation request failed: ${r2.status} ${r2.statusText} - ${errText}`)
            }
            const j2 = await r2.json()
            if (!j2?.success) throw new Error(j2?.error || 'Translation failed')

            const finalResults: Record<string, any> = {
              fnb_extraction: extraction,
              fnb_translation: j2.data,
            }

            setJobs((prev) =>
              prev.map((job) =>
                job.id === newJob.id
                  ? { ...job, status: 'completed', results: finalResults, completedAt: new Date() }
                  : job,
              ),
            )
            recordSuccessAndMaybeOpenRoi()
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

        // Call extraction API with JSON instead of FormData
        const response = await fetch("/api/extract", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            file: fileData,
            schemaTree,
            extractionPromptOverride: undefined,
          }),
        })

        const result = await response.json()
        if (process.env.NODE_ENV !== 'production') {
          // eslint-disable-next-line no-console
          console.log("[bytebeam] API response:", result)
        }

        if (result.success) {
          // Flatten nested results (by field id) for grid/transform use
          const finalResults = flattenResultsById(fields, result.results)

          // Apply transformations safely
          displayColumns
            .filter((col) => col.isTransformation)
            .forEach((col) => {
              if (col.transformationType === "calculation" && col.transformationConfig) {
                try {
                  let expression = col.transformationConfig

                  // Replace column references with actual values
                  // Build a map of replacements first to avoid issues with overlapping replacements
                  const replacements: { pattern: string; value: string }[] = []
                  const columnReferences = expression.match(/\{([^}]+)\}/g)
                  
                  if (columnReferences) {
                    for (const ref of columnReferences) {
                      const fieldName = ref.slice(1, -1).trim()
                      const referencedColumn = displayColumns.find((c) => c.name === fieldName)
                      let valueToReplace = "0"
                      
                      if (referencedColumn) {
                        const value = finalResults[referencedColumn.id]
                        if (value !== undefined && value !== null) {
                          const numericValue = Number.parseFloat(value.toString())
                          if (!isNaN(numericValue)) {
                            valueToReplace = numericValue.toString()
                          } else {
                            console.warn(
                              `Non-numeric value for referenced column '${fieldName}' in calculation. Using 0.`,
                            )
                          }
                        }
                      } else {
                        console.warn(`Referenced column '${fieldName}' not found in calculation. Using 0.`)
                      }
                      
                      replacements.push({ pattern: ref, value: valueToReplace })
                    }
                    
                    // Apply all replacements using a function replacer to avoid regex issues
                    for (const { pattern, value } of replacements) {
                      // Use split and join for safe string replacement
                      expression = expression.split(pattern).join(value)
                    }
                  }

                  // Simple safe evaluation for basic math operations only
                  // Remove any non-math characters to prevent code injection
                  const safeExpression = expression.replace(/[^0-9+\-*/.() ]/g, "")
                  if (safeExpression !== expression) {
                    console.warn("Invalid characters removed from calculation expression")
                  }

                  // Check if expression is empty or invalid before evaluation
                  if (!safeExpression || safeExpression.trim() === "") {
                    finalResults[col.id] = 0
                  } else {
                    try {
                      // Use Function constructor with timeout protection
                      const func = new Function(`"use strict"; return (${safeExpression})`)
                      const result = func()
                      
                      // Validate the result
                      if (typeof result === 'number' && !isNaN(result) && isFinite(result)) {
                        finalResults[col.id] = result
                      } else {
                        console.warn("Calculation resulted in non-numeric value")
                        finalResults[col.id] = 0
                      }
                    } catch (evalError) {
                      console.error("Error evaluating expression:", evalError)
                      finalResults[col.id] = 0
                    }
                  }
                } catch (e) {
                  console.error("Calculation error:", e)
                  finalResults[col.id] = `Error: ${e instanceof Error ? e.message : "Invalid calculation"}`
                }
              } else if (col.transformationType === "currency_conversion") {
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
              } else if (col.transformationType === "gemini_api") {
                // Defer to server for LLM transformation
                // This block will be handled asynchronously after the loop
                
              } else if (col.transformationType === "classification") {
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
          const geminiTransformColumns = displayColumns.filter(
            (c) => c.isTransformation && c.transformationType === "gemini_api",
          )
          for (const tcol of geminiTransformColumns) {
            try {
              const source = tcol.transformationSource || "document"
              let payload: any = {
                type: "gemini",
                prompt: String(tcol.transformationConfig || ""),
                inputSource: source,
              }
              if (source === "document") {
                payload.file = fileData
              } else {
                let value: any = undefined
                if (tcol.transformationSourceColumnId) {
                  value = finalResults[tcol.transformationSourceColumnId]
                } else if (typeof tcol.transformationConfig === "string") {
                  const refs = tcol.transformationConfig.match(/\{([^}]+)\}/)
                  if (refs) {
                    const name = refs[1].trim()
                    const refCol = displayColumns.find((c) => c.name === name)
                    if (refCol) value = finalResults[refCol.id]
                  }
                }
                payload.inputText = typeof value === "string" ? value : JSON.stringify(value)
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
          recordSuccessAndMaybeOpenRoi()
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
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-accent" />
      case "processing":
        return <Clock className="h-4 w-4 text-primary animate-spin" />
      case "error":
        return <AlertCircle className="h-4 w-4 text-destructive" />
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />
    }
  }

  const renderStatusPill = (status: ExtractionJob["status"]) => {
    const base = "px-1.5 py-0.5 rounded text-[10px] font-medium"
    if (status === 'completed') return <span className={`${base} bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300`}>Completed</span>
    if (status === 'processing') return <span className={`${base} bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300`}>Processing</span>
    if (status === 'error') return <span className={`${base} bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300`}>Error</span>
    return <span className={`${base} bg-muted text-muted-foreground`}>Pending</span>
  }

  const getCellAlignClasses = (type: DataType) => {
    if (type === 'number' || type === 'decimal') return 'text-right [font-variant-numeric:tabular-nums]'
    if (type === 'date') return 'font-mono text-xs'
    return 'text-left'
  }

  const renderCellValue = (column: SchemaField, job: ExtractionJob) => {
    const value = job.results?.[column.id]
    if (job.status === 'error') return <span className="text-sm text-destructive">—</span>
    if (job.status !== 'completed') return <Skeleton className="h-4 w-24" />
    if (value === undefined || value === null || value === '') {
      return <span className="text-muted-foreground">—</span>
    }
    if (column.type === 'boolean') {
      const truthy = Boolean(value)
      return (
        <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${truthy ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' : 'bg-muted text-muted-foreground'}`}>
          {truthy ? 'True' : 'False'}
        </span>
      )
    }
    if (Array.isArray(value)) {
      return <span className="truncate block" title={JSON.stringify(value)}>{value.length} items</span>
    }
    if (typeof value === 'object') {
      return <span className="truncate block" title={JSON.stringify(value)}>{JSON.stringify(value)}</span>
    }
    return <span className="truncate block" title={String(value)}>{String(value)}</span>
  }

  // Scroll shadow indicators for horizontal overflow
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const update = () => {
      const { scrollLeft, scrollWidth, clientWidth } = el
      setCanScroll({ left: scrollLeft > 0, right: scrollLeft + clientWidth < scrollWidth - 1 })
    }
    update()
    el.addEventListener('scroll', update)
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => {
      el.removeEventListener('scroll', update)
      ro.disconnect()
    }
  }, [displayColumns.length, jobs.length])

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
  const printLocalizedLabel = () => {
    try {
      const job = jobs.find((j) => j.id === selectedRowId) || jobs.find((j) => j.status === 'completed') || jobs[jobs.length - 1]
      if (!job || job.status !== 'completed') {
        alert('No completed job to print')
        return
      }
      const tr = job.results?.fnb_translation
      if (!tr) {
        alert('Translation data not available yet')
        return
      }
      const en = tr.english_product_info || {}
      const ar = tr.arabic_product_info || {}

      // Helpers
      const esc = (s: any) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      const joinList = (arr: any[]) => Array.isArray(arr) ? arr.filter(Boolean).join(', ') : ''
      const setFrom = (arr: any[]) => new Set((Array.isArray(arr) ? arr : []).map((x) => String(x || '').toLowerCase()))
      const boldAllergens = (list: any[], allergens: Set<string>) => {
        if (!Array.isArray(list)) return ''
        return list.map((it: any) => {
          const s = String(it || '')
          const lower = s.toLowerCase()
          let highlighted = s
          allergens.forEach((al) => {
            if (!al) return
            if (lower.includes(al)) {
              const re = new RegExp(al.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'ig')
              highlighted = highlighted.replace(re, (m) => `<strong>${esc(m)}</strong>`)
            }
          })
          return highlighted
        }).join(', ')
      }

      const enAllergens = setFrom(en.allergyInformation)
      const arAllergens = setFrom(ar.allergyInformation)

      const energyKJ = esc(en?.nutritionalInformationPer100g?.energyPer100g?.kj)
      const energyKCal = esc(en?.nutritionalInformationPer100g?.energyPer100g?.kcal)

      const rowPair = (labelEn: string, labelAr: string, vEn: any, vAr: any) => `
        <tr>
          <td style="padding:6px 8px;border:1px solid #ccc;">${esc(labelEn)} / ${esc(labelAr)}</td>
          <td style="padding:6px 8px;border:1px solid #ccc;text-align:center;">
            ${esc(vEn || '')}${vEn ? '' : ''} ${vEn && vAr ? '/' : ''} ${esc(vAr || '')}
          </td>
        </tr>`

      const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Localized Label</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif; padding: 24px; color: #111; }
    h1, h2, h3 { margin: 0 0 8px; }
    .section { margin-bottom: 14px; }
    .muted { color: #555; font-size: 12px; }
    .divider { height: 1px; background: #ddd; margin: 10px 0; }
    @media print { .no-print { display: none !important; } }
  </style>
  </head>
  <body>
    <div class="no-print" style="text-align:right;margin-bottom:12px;">
      <button onclick="window.print()" style="padding:6px 10px;border:1px solid #bbb;background:#fff;cursor:pointer;">Print</button>
    </div>

    <div class="section">
      <h2>${esc(en.productName || '')} / ${esc(ar.productName || '')}</h2>
    </div>

    <div class="section">
      <div>Product of ${esc(en?.manufacturer?.country || '')} / منتج من ${esc(ar?.manufacturer?.country || '')}</div>
    </div>

    <div class="divider"></div>

    <div class="section">
      <div><strong>Ingredients:</strong> ${boldAllergens(en.ingredients || [], enAllergens)}</div>
      <div><strong>المكونات:</strong> ${boldAllergens(ar.ingredients || [], arAllergens)}</div>
    </div>

    <div class="section">
      <div><strong>Allergy Information:</strong> ${esc(joinList(en.allergyInformation || []))}</div>
      <div><strong>معلومات الحساسية:</strong> ${esc(joinList(ar.allergyInformation || []))}</div>
    </div>

    <div class="divider"></div>

    <div class="section">
      <h3>Nutritional Facts / حقائق غذائية</h3>
      <div class="muted">Typical values per 100g / القيم النموذجية لكل 100غ</div>
      <table style="width:100%;border-collapse:collapse;margin-top:6px;">
        <thead>
          <tr>
            <th style="padding:6px 8px;border:1px solid #ccc;text-align:left;">Nutrient / العنصر الغذائي</th>
            <th style="padding:6px 8px;border:1px solid #ccc;text-align:center;">Value / القيمة</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="padding:6px 8px;border:1px solid #ccc;">Energy / الطاقة</td>
            <td style="padding:6px 8px;border:1px solid #ccc;text-align:center;">${energyKJ} kJ / ${energyKCal} kcal</td>
          </tr>
          ${rowPair('Fat', 'الدهون', en?.nutritionalInformationPer100g?.fatPer100g, ar?.nutritionalInformationPer100g?.fatPer100g)}
          ${rowPair('of which Saturates', 'منها مشبعة', en?.nutritionalInformationPer100g?.saturatesPer100g, ar?.nutritionalInformationPer100g?.saturatesPer100g)}
          ${rowPair('Carbohydrate', 'الكربوهيدرات', en?.nutritionalInformationPer100g?.carbohydratePer100g, ar?.nutritionalInformationPer100g?.carbohydratePer100g)}
          ${rowPair('of which Sugars', 'منها سكريات', en?.nutritionalInformationPer100g?.sugarsPer100g, ar?.nutritionalInformationPer100g?.sugarsPer100g)}
          ${rowPair('Protein', 'البروتين', en?.nutritionalInformationPer100g?.proteinPer100g, ar?.nutritionalInformationPer100g?.proteinPer100g)}
          ${rowPair('Salt', 'الملح', en?.nutritionalInformationPer100g?.saltPer100g, ar?.nutritionalInformationPer100g?.saltPer100g)}
        </tbody>
      </table>
    </div>

    <div class="divider"></div>

    <div class="section">
      <div>Storage: ${esc(en.storageInformation || '')}</div>
      <div>التخزين: ${esc(ar.storageInformation || '')}</div>
    </div>

    <div class="section">
      <div>Production Date: ____/____/______</div>
      <div>تاريخ الإنتاج: ______/____/____</div>
    </div>

    <div class="section">
      <div>Best Before / Expiry Date: ____/____/______</div>
      <div>يفضل استهلاكه قبل / تاريخ الانتهاء: ______/____/____</div>
    </div>

    <div class="divider"></div>

    <div class="section">
      <div><strong>Manufacturer / الشركة المصنعة:</strong></div>
      <div>${esc(en?.manufacturer?.name || '')}${en?.manufacturer?.location ? ', ' + esc(en?.manufacturer?.location) : ''}${en?.manufacturer?.country ? ', ' + esc(en?.manufacturer?.country) : ''}</div>
      <div>${esc(ar?.manufacturer?.name || '')}${ar?.manufacturer?.location ? '، ' + esc(ar?.manufacturer?.location) : ''}${ar?.manufacturer?.country ? '، ' + esc(ar?.manufacturer?.country) : ''}</div>
      <div>${esc(en?.manufacturer?.additionalInfo || '')}</div>
    </div>

    <div class="section">
      <div><strong>Importer / المستورد:</strong></div>
      <div>[Importer Name & Address, Saudi Arabia]</div>
      <div>[اسم المستورد وعنوانه، المملكة العربية السعودية]</div>
    </div>

    <div class="section">
      <div>Net Weight / الوزن الصافي: ${esc(en?.weightInformation?.netWeight || '')} e / ${esc(ar?.weightInformation?.netWeight || '')}</div>
    </div>

    <div class="section">
      <div>Barcode / الرمز الشريطي: ${esc(en?.barcode || '')}</div>
    </div>
  </body>
</html>`

      const w = window.open('', '_blank')
      if (!w) return alert('Popup blocked. Please allow popups to print the label.')
      w.document.open()
      w.document.write(html)
      w.document.close()
      w.focus()
      // Delay to ensure styles apply before print
      setTimeout(() => { try { w.print() } catch {} }, 200)
    } catch (e) {
      console.error('print label error', e)
      alert('Failed to build printable label')
    }
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      <SetupBanner />

      {/* Schemas Tabs */}
      <div className="border-b bg-card/80 backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <div className="flex items-center gap-1 px-2 py-2 overflow-x-auto">
          {schemas.map((s) => (
            <div
              key={s.id}
              className={`group inline-flex items-center max-w-xs rounded-t-md border px-2 py-1 text-sm mr-1 ${
                s.id === activeSchemaId ? 'bg-background border-border' : 'bg-muted text-muted-foreground border-transparent hover:bg-muted/70'
              }`}
            >
              <button
                type="button"
                className="truncate max-w-[10rem] pr-1"
                onClick={() => {
                  setActiveSchemaId(s.id)
                  setSelectedColumn(null)
                  setIsColumnDialogOpen(false)
                }}
                title={s.name}
              >
                {s.name}
              </button>
              <button
                type="button"
                className="ml-1 opacity-60 hover:opacity-100"
                onClick={() => closeSchema(s.id)}
                aria-label="Close schema tab"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
          <Button size="sm" variant="ghost" onClick={addSchema} title="New schema">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex flex-1 min-h-0 min-w-0">
        {/* Left Sidebar - File Upload & Jobs */}
        <div className="w-80 bg-sidebar border-r border-sidebar-border p-4 space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-sidebar-foreground mb-4">Document Processing</h2>

            {/* Upload Area */}
            <Card className="border-dashed border-2 border-border hover:border-primary/50 transition-colors">
              <CardContent className="p-6 text-center">
                <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground mb-3">Drag & drop files here or click to browse</p>
                <p className="text-xs text-muted-foreground mb-3">Supports: TXT, PDF, DOC, DOCX, images</p>
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full"
                  disabled={fields.length === 0 && activeSchema.templateId !== 'fnb-label-compliance'}
                >
                  Upload Documents
                </Button>
                {fields.length === 0 && activeSchema.templateId !== 'fnb-label-compliance' && (
                  <p className="text-xs text-orange-600 mt-2">Define columns first</p>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </CardContent>
            </Card>
          </div>

          {/* Schema Template chooser – only when the active schema is fresh */}
          {isSchemaFresh(activeSchema) && (
            <div className="space-y-2">
              <Label className="text-sidebar-foreground">Choose a schema template</Label>
              <Select onValueChange={(val) => applySchemaTemplate(val)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a template" />
                </SelectTrigger>
                <SelectContent>
                  {NESTED_TEMPLATES.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">Populates data points and transformations for this tab.</p>
            </div>
          )}

          {/* Sales Lead Pipeline CTA – appears after user has at least 2 completed extractions */}
          {completedJobsCount >= 2 && (
            <Card>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-sidebar-foreground">Automate your complex document workflows</p>
                    {/* <p className="text-xs text-muted-foreground">You've validated extraction. Next: deploy at scale.</p> */}
                  </div>
                  <CheckCircle className="h-5 w-5 text-accent" />
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2"><CheckCircle className="h-3.5 w-3.5 text-accent" /><span>Eliminate manual document work</span></div>
                    <div className="flex items-center gap-2"><CheckCircle className="h-3.5 w-3.5 text-accent" /><span>Compliance‑ready logs</span></div>
                    <div className="flex items-center gap-2"><CheckCircle className="h-3.5 w-3.5 text-accent" /><span>Optional private deployment</span></div>
                    <div className="flex items-center gap-2"><CheckCircle className="h-3.5 w-3.5 text-accent" /><span>Process over 1,000 documents at once</span></div>
                    <div className="flex items-center gap-2"><CheckCircle className="h-3.5 w-3.5 text-accent" /><span>Connect your systems: triggers in, outputs to docs, sheets, or databases</span></div>
                  </div>
                  <div className="space-y-1 col-span-1">
                    <p className="text-[11px] text-muted-foreground mt-1">
                      Automate any document process—from invoice processing to due diligence and compliance localization.
                    </p>
                    <p className="text-[11px] text-muted-foreground">This platform mirrors your team’s manual process end‑to‑end—without the manual work.</p>
                  </div>
                </div>

                <Button asChild className="w-full">
                  <a href={BOOKING_URL} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Book a working session
                    <Link className="h-3.5 w-3.5" />
                  </a>
                </Button>

                <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                  <span>Processed over 10,000 documents</span>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

          {/* Main Content - Excel-style Table */}
          <div className="flex-1 flex flex-col min-h-0 min-w-0">
          {/* Header */}
          <div className="bg-card border-b border-border p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {!editingSchemaName ? (
                    <button
                      type="button"
                      className="text-2xl font-bold text-foreground hover:underline text-left"
                      onClick={() => {
                        setSchemaNameInput(activeSchema.name || 'Data Extraction Schema')
                        setEditingSchemaName(true)
                      }}
                      title="Click to rename schema"
                    >
                      {activeSchema.name || 'Data Extraction Schema'}
                    </button>
                  ) : (
                    <input
                      value={schemaNameInput}
                      onChange={(e) => setSchemaNameInput(e.target.value)}
                      autoFocus
                      onBlur={() => {
                        const next = (schemaNameInput || 'Data Extraction Schema').trim()
                        setSchemas((prev) => prev.map((s) => s.id === activeSchemaId ? { ...s, name: next } : s))
                        setEditingSchemaName(false)
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          const next = (schemaNameInput || 'Data Extraction Schema').trim()
                          setSchemas((prev) => prev.map((s) => s.id === activeSchemaId ? { ...s, name: next } : s))
                          setEditingSchemaName(false)
                        } else if (e.key === 'Escape') {
                          setEditingSchemaName(false)
                          setSchemaNameInput(activeSchema.name)
                        }
                      }}
                      className="text-2xl font-bold text-foreground bg-transparent border-b border-border focus:outline-none focus:border-ring px-1"
                    />
                  )}
                </div>
              <div className="flex items-center gap-2">
                {/* Export / Print: show Export always (non-F&B), Print gated on completion (F&B) */}
                {activeSchema.templateId === 'fnb-label-compliance' ? (
                  jobs.some((j) => j.status === 'completed') ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={printLocalizedLabel}
                      title="Print Localized Label"
                    >
                      <Download className="h-4 w-4 mr-1" />
                      Print Localized Label
                    </Button>
                  ) : null
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => exportToCSV()}
                    title="Export to CSV"
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Export CSV
                  </Button>
                )}
                {activeSchema.templateId !== 'fnb-label-compliance' && (
                <div className="inline-flex rounded-md border border-border overflow-hidden">
                  <button
                    type="button"
                    className={`px-3 py-1.5 text-sm flex items-center gap-1.5 ${addMode === 'column' ? 'bg-accent text-accent-foreground' : 'bg-transparent text-muted-foreground'}`}
                    onClick={() => setAddMode('column')}
                    aria-pressed={addMode === 'column'}
                    title="Add data column"
                  >
                    <Type className="h-4 w-4" /> Column
                  </button>
                  <button
                    type="button"
                    className={`px-3 py-1.5 text-sm flex items-center gap-1.5 border-l border-border ${addMode === 'transform' ? 'bg-accent text-accent-foreground' : 'bg-transparent text-muted-foreground'}`}
                    onClick={() => setAddMode('transform')}
                    aria-pressed={addMode === 'transform'}
                    title="Add transform column"
                  >
                    <Zap className="h-4 w-4" /> Transform
                  </button>
                </div>
                )}
                {activeSchema.templateId !== 'fnb-label-compliance' && (
                <Button
                  size="sm"
                  onClick={() => (addMode === 'column' ? addColumn() : addTransformationColumn())}
                  title={addMode === 'column' ? 'Add Column' : 'Add Transform'}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add {addMode === 'column' ? 'Column' : 'Transform'}
                </Button>
                )}
              </div>
              </div>
            {fields.length === 0 && (
              <div className="mt-4 p-3 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">
                  Start by defining your data extraction schema. Add columns for each piece of information you want to
                  extract from your documents.
                </p>
              </div>
            )}
          </div>
          {/* Main Body */}
          <div ref={scrollRef} className="flex-1 overflow-auto min-h-0 min-w-0 relative">
            {activeSchema.templateId === 'fnb-label-compliance' ? (
              <div className="p-4 space-y-4">
                {/* Simple job selector */}
                {jobs.length > 0 && (
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm text-muted-foreground">Jobs:</span>
                    {jobs
                      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
                      .map((job, idx) => (
                        <button
                          key={job.id}
                          onClick={() => setSelectedRowId(job.id)}
                          className={`px-2 py-1 rounded border text-xs ${selectedRowId === job.id ? 'bg-accent text-accent-foreground' : 'bg-muted text-foreground'}`}
                        >
                          {idx + 1}. {job.fileName}
                        </button>
                      ))}
                  </div>
                )}

                {/* Selected job panels */}
                {(() => {
                  const job = jobs.find((j) => j.id === selectedRowId) || jobs[jobs.length - 1]
                  if (!job) return (
                    <div className="text-center py-12 text-muted-foreground">
                      <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No results yet. Upload a label image to get started.</p>
                    </div>
                  )
                  const extraction = job.results?.fnb_extraction?.product_initial_language || job.results?.fnb_extraction
                  const translation = job.results?.fnb_translation
                  const collapseState = fnbCollapse[job.id] || { en: false, ar: false }
                  const toggleEN = () => setFnbCollapse((prev) => ({ ...prev, [job.id]: { ...collapseState, en: !collapseState.en } }))
                  const toggleAR = () => setFnbCollapse((prev) => ({ ...prev, [job.id]: { ...collapseState, ar: !collapseState.ar } }))
                  const KV = (label: string, value: any) => (
                    value != null && value !== '' && value !== undefined ? (
                      <div className="flex justify-between gap-3 text-sm">
                        <span className="text-muted-foreground">{label}</span>
                        <span className="text-right break-words">{String(value)}</span>
                      </div>
                    ) : null
                  )
                  const List = (label: string, arr: any[]) => (
                    Array.isArray(arr) && arr.length > 0 ? (
                      <div className="space-y-1">
                        <div className="text-sm text-muted-foreground">{label}</div>
                        <ul className="list-disc pl-5 text-sm space-y-0.5">
                          {arr.map((it, i) => (
                            <li key={i}>{String(it)}</li>
                          ))}
                        </ul>
                      </div>
                    ) : null
                  )
                  return (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Card>
                        <CardContent className="p-4 space-y-2">
                          <div className="flex items-center justify-between">
                            <h3 className="font-semibold">Extraction Result (Primary Language)</h3>
                            {getStatusIcon(job.status)}
                          </div>
                          {!extraction ? (
                            <div className="text-sm text-muted-foreground">No extraction data</div>
                          ) : (
                            <div className="space-y-3">
                              {KV('Barcode', extraction?.barcode)}
                              {KV('Product Name', extraction?.productName)}
                              <div className="space-y-1">
                                <div className="text-sm font-medium">Manufacturer</div>
                                <div className="space-y-1 rounded border p-2">
                                  {KV('Name', extraction?.manufacturer?.name)}
                                  {KV('Location', extraction?.manufacturer?.location)}
                                  {KV('Additional Info', extraction?.manufacturer?.additionalInfo)}
                                  {KV('Country', extraction?.manufacturer?.country)}
                                </div>
                              </div>
                              {KV('Product Description', extraction?.productDescription)}
                              {List('Ingredients', extraction?.ingredients)}
                              <div className="space-y-1">
                                <div className="text-sm font-medium">Serving Size Information</div>
                                <div className="space-y-1 rounded border p-2">
                                  {KV('Serving Size', extraction?.servingSizeInformation?.servingSize)}
                                  {KV('Unit', extraction?.servingSizeInformation?.servingSizeUnit)}
                                  {KV('Servings / Container', extraction?.servingSizeInformation?.servingsPerContainer)}
                                </div>
                              </div>
                              <div className="space-y-1">
                                <div className="text-sm font-medium">Nutritional Information (per 100g)</div>
                                <div className="grid grid-cols-2 gap-2 rounded border p-2 text-sm">
                                  {KV('Energy (kJ)', extraction?.nutritionalInformationPer100g?.energyPer100g?.kj)}
                                  {KV('Energy (kcal)', extraction?.nutritionalInformationPer100g?.energyPer100g?.kcal)}
                                  {KV('Fat', extraction?.nutritionalInformationPer100g?.fatPer100g)}
                                  {KV('Saturates', extraction?.nutritionalInformationPer100g?.saturatesPer100g)}
                                  {KV('Carbohydrate', extraction?.nutritionalInformationPer100g?.carbohydratePer100g)}
                                  {KV('Sugars', extraction?.nutritionalInformationPer100g?.sugarsPer100g)}
                                  {KV('Fibre', extraction?.nutritionalInformationPer100g?.fiberPer100g)}
                                  {KV('Protein', extraction?.nutritionalInformationPer100g?.proteinPer100g)}
                                  {KV('Salt', extraction?.nutritionalInformationPer100g?.saltPer100g)}
                                  {KV('Sodium', extraction?.nutritionalInformationPer100g?.sodiumPer100g)}
                                  {KV('Cholesterol', extraction?.nutritionalInformationPer100g?.cholesterolPer100g)}
                                  {KV('Trans Fat', extraction?.nutritionalInformationPer100g?.transFatPer100g)}
                                  {KV('Added Sugar', extraction?.nutritionalInformationPer100g?.includesAddedSugarPer100g)}
                                </div>
                              </div>
                              {KV('Storage Information', extraction?.storageInformation)}
                              {KV('Usage Information', extraction?.usageInformation)}
                              {List('Allergy Information', extraction?.allergyInformation)}
                              <div className="space-y-1">
                                <div className="text-sm font-medium">Weight Information</div>
                                <div className="space-y-1 rounded border p-2">
                                  {KV('Net Weight', extraction?.weightInformation?.netWeight)}
                                  {KV('Packaging Weight', extraction?.weightInformation?.packagingWeight)}
                                </div>
                              </div>
                              {KV('Product Status', extraction?.productStatus)}
                              {KV('Status Reason', extraction?.productStatusReason)}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4 space-y-2">
                          <div className="flex items-center justify-between">
                            <h3 className="font-semibold">Translations (EN / AR)</h3>
                            {getStatusIcon(job.status)}
                          </div>
                          {!translation ? (
                            <div className="text-sm text-muted-foreground">No translation data</div>
                          ) : (
                            <div className="grid grid-cols-1 gap-3">
                              {/* English */}
                              <div className="space-y-1">
                                <div className="flex items-center justify-between">
                                  <div className="text-sm font-medium">English</div>
                                  <button className="text-xs text-muted-foreground underline" onClick={toggleEN}>
                                    {collapseState.en ? 'Expand' : 'Collapse'}
                                  </button>
                                </div>
                                {!collapseState.en && (
                                <div className="space-y-2 rounded border p-2">
                                  {KV('Barcode', translation?.english_product_info?.barcode)}
                                  {KV('Product Name', translation?.english_product_info?.productName)}
                                  <div className="space-y-1">
                                    <div className="text-xs text-muted-foreground">Manufacturer</div>
                                    <div className="space-y-1 rounded border p-2">
                                      {KV('Name', translation?.english_product_info?.manufacturer?.name)}
                                      {KV('Location', translation?.english_product_info?.manufacturer?.location)}
                                      {KV('Additional Info', translation?.english_product_info?.manufacturer?.additionalInfo)}
                                      {KV('Country', translation?.english_product_info?.manufacturer?.country)}
                                    </div>
                                  </div>
                                  {KV('Product Description', translation?.english_product_info?.productDescription)}
                                  {List('Ingredients', translation?.english_product_info?.ingredients)}
                                  <div className="grid grid-cols-2 gap-2 rounded border p-2 text-sm">
                                    {KV('Energy (kJ)', translation?.english_product_info?.nutritionalInformationPer100g?.energyPer100g?.kj)}
                                    {KV('Energy (kcal)', translation?.english_product_info?.nutritionalInformationPer100g?.energyPer100g?.kcal)}
                                    {KV('Fat', translation?.english_product_info?.nutritionalInformationPer100g?.fatPer100g)}
                                    {KV('Saturates', translation?.english_product_info?.nutritionalInformationPer100g?.saturatesPer100g)}
                                    {KV('Carbohydrate', translation?.english_product_info?.nutritionalInformationPer100g?.carbohydratePer100g)}
                                    {KV('Sugars', translation?.english_product_info?.nutritionalInformationPer100g?.sugarsPer100g)}
                                    {KV('Fibre', translation?.english_product_info?.nutritionalInformationPer100g?.fiberPer100g)}
                                    {KV('Protein', translation?.english_product_info?.nutritionalInformationPer100g?.proteinPer100g)}
                                    {KV('Salt', translation?.english_product_info?.nutritionalInformationPer100g?.saltPer100g)}
                                  </div>
                                  {KV('Storage Information', translation?.english_product_info?.storageInformation)}
                                  {KV('Usage Information', translation?.english_product_info?.usageInformation)}
                                  {List('Allergy Information', translation?.english_product_info?.allergyInformation)}
                                  <div className="space-y-1 rounded border p-2">
                                    {KV('Net Weight', translation?.english_product_info?.weightInformation?.netWeight)}
                                    {KV('Packaging Weight', translation?.english_product_info?.weightInformation?.packagingWeight)}
                                  </div>
                                </div>
                                )}
                              </div>
                              {/* Arabic */}
                              <div className="space-y-1">
                                <div className="flex items-center justify-between">
                                  <div className="text-sm font-medium">Arabic</div>
                                  <button className="text-xs text-muted-foreground underline" onClick={toggleAR}>
                                    {collapseState.ar ? 'Expand' : 'Collapse'}
                                  </button>
                                </div>
                                {!collapseState.ar && (
                                <div className="space-y-2 rounded border p-2">
                                  {KV('Barcode', translation?.arabic_product_info?.barcode)}
                                  {KV('Product Name', translation?.arabic_product_info?.productName)}
                                  <div className="space-y-1">
                                    <div className="text-xs text-muted-foreground">Manufacturer</div>
                                    <div className="space-y-1 rounded border p-2">
                                      {KV('Name', translation?.arabic_product_info?.manufacturer?.name)}
                                      {KV('Location', translation?.arabic_product_info?.manufacturer?.location)}
                                      {KV('Additional Info', translation?.arabic_product_info?.manufacturer?.additionalInfo)}
                                      {KV('Country', translation?.arabic_product_info?.manufacturer?.country)}
                                    </div>
                                  </div>
                                  {KV('Product Description', translation?.arabic_product_info?.productDescription)}
                                  {List('Ingredients', translation?.arabic_product_info?.ingredients)}
                                  <div className="grid grid-cols-2 gap-2 rounded border p-2 text-sm">
                                    {KV('Energy (kJ)', translation?.arabic_product_info?.nutritionalInformationPer100g?.energyPer100g?.kj)}
                                    {KV('Energy (kcal)', translation?.arabic_product_info?.nutritionalInformationPer100g?.energyPer100g?.kcal)}
                                    {KV('Fat', translation?.arabic_product_info?.nutritionalInformationPer100g?.fatPer100g)}
                                    {KV('Saturates', translation?.arabic_product_info?.nutritionalInformationPer100g?.saturatesPer100g)}
                                    {KV('Carbohydrate', translation?.arabic_product_info?.nutritionalInformationPer100g?.carbohydratePer100g)}
                                    {KV('Sugars', translation?.arabic_product_info?.nutritionalInformationPer100g?.sugarsPer100g)}
                                    {KV('Fibre', translation?.arabic_product_info?.nutritionalInformationPer100g?.fiberPer100g)}
                                    {KV('Protein', translation?.arabic_product_info?.nutritionalInformationPer100g?.proteinPer100g)}
                                    {KV('Salt', translation?.arabic_product_info?.nutritionalInformationPer100g?.saltPer100g)}
                                  </div>
                                  {KV('Storage Information', translation?.arabic_product_info?.storageInformation)}
                                  {KV('Usage Information', translation?.arabic_product_info?.usageInformation)}
                                  {List('Allergy Information', translation?.arabic_product_info?.allergyInformation)}
                                  <div className="space-y-1 rounded border p-2">
                                    {KV('Net Weight', translation?.arabic_product_info?.weightInformation?.netWeight)}
                                    {KV('Packaging Weight', translation?.arabic_product_info?.weightInformation?.packagingWeight)}
                                  </div>
                                </div>
                                )}
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </div>
                  )
                })()}
              </div>
            ) : (
            <>
            {/* Sheet-Style Grid (default) */}
            {/* Horizontal scroll shadows */}
            {canScroll.left && (
              <div className="pointer-events-none absolute inset-y-0 left-[17rem] w-6 bg-gradient-to-r from-background to-transparent z-10" />
            )}
            {canScroll.right && (
              <div className="pointer-events-none absolute inset-y-0 right-0 w-6 bg-gradient-to-l from-background to-transparent z-10" />
            )}
            <div className="min-w-full">
              {/* Table Header */}
              <div className="sticky top-0 bg-card/95 backdrop-blur border-b border-border z-20 shadow-[0_1px_0_0_var(--color-border)]">
                <div className="flex relative">
                  <div className="w-12 p-2 border-r border-border bg-muted sticky left-0 z-30">
                    <span className="text-xs text-muted-foreground">#</span>
                  </div>
                  {/* File name header */}
                  <div className="w-56 shrink-0 p-2 border-r border-border bg-muted/60 sticky left-12 z-20">
                    <span className="text-xs text-muted-foreground">File</span>
                  </div>
                  {displayColumns.map((column) => {
                    const Icon = column.isTransformation
                      ? transformationIcons[column.transformationType!]
                      : dataTypeIcons[column.type]

                    return (
                      <div
                        key={column.id}
                        className={`shrink-0 p-2 border-r border-border bg-card hover:bg-muted/50 cursor-pointer group overflow-hidden relative ${hoveredColumnId === column.id ? 'bg-accent/40' : ''}`}
                        style={{ width: getColWidth(column.id) }}
                        onMouseEnter={() => setHoveredColumnId(column.id)}
                        onMouseLeave={() => setHoveredColumnId((prev) => (prev === column.id ? null : prev))}
                        onClick={() => {
                           setSelectedColumn(column)
                           setDraftColumn(JSON.parse(JSON.stringify(column)))
                           setIsColumnDialogOpen(true)
                         }}
                      >
                        <div className="flex items-center justify-between gap-2" ref={(el) => (headerRefs.current[column.id] = el)}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="flex items-center gap-2 min-w-0 w-full overflow-hidden">
                                <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                                <span className="text-sm font-medium truncate min-w-0 flex-1" title={column.name}>{column.name}</span>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent sideOffset={6}>
                              <div className="max-w-xs space-y-1">
                                <div className="flex items-center gap-2">
                                  <Icon className="h-3.5 w-3.5 opacity-80" />
                                  <span className="text-xs font-medium">{column.name}</span>
                                </div>
                                {column.description && (
                                  <p className="text-[11px] opacity-90">{column.description}</p>
                                )}
                                {column.extractionInstructions && (
                                  <p className="text-[11px] opacity-70">{column.extractionInstructions}</p>
                                )}
                              </div>
                            </TooltipContent>
                          </Tooltip>
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation()
                                deleteColumn(column.id)
                              }}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                        {/* Resize handle */}
                        <div
                          className="absolute top-0 right-0 h-full w-2 cursor-col-resize select-none"
                          onMouseDown={(e) => startResize(column.id, e)}
                          onDoubleClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            autoFit(column.id)
                          }}
                          title="Drag to resize • Double‑click to auto‑fit"
                        />
                        {/* Keep header compact; show details in tooltip */}
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Table Body - Results */}
              <div className="bg-background">
                {jobs
                  .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
                  .map((job, jobIndex) => (
                    <div
                      key={job.id}
                      className={`flex border-b border-border hover:bg-muted/30 ${selectedRowId === job.id ? 'bg-accent/30' : jobIndex % 2 === 1 ? 'bg-muted/20' : ''}`}
                      onClick={() => setSelectedRowId(job.id)}
                    >
                      <div className="w-12 p-2 border-r border-border bg-background sticky left-0 z-10 text-center">
                        <span className="text-xs text-muted-foreground">{jobIndex + 1}</span>
                      </div>
                      {/* File cell with status icon */}
                      <div className="w-56 shrink-0 p-2 border-r border-border flex items-center gap-2 bg-background sticky left-12 z-10 overflow-hidden">
                        {getStatusIcon(job.status)}
                        {renderStatusPill(job.status)}
                        <span className="text-sm truncate" title={job.fileName}>{job.fileName}</span>
                      </div>
                      {displayColumns.map((column) => (
                        <div
                          key={column.id}
                          className={`shrink-0 p-2 border-r border-border overflow-hidden ${getCellAlignClasses(column.type)} ${hoveredColumnId === column.id ? 'bg-accent/20' : ''}`}
                          style={{ width: getColWidth(column.id) }}
                        >
                          {renderCellValue(column, job)}
                        </div>
                      ))}
                    </div>
                  ))}

                {/* Empty State */}
                {jobs.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No extraction results yet. Upload documents to get started.</p>
                    {fields.length === 0 && <p className="text-sm mt-2">Define your schema columns first.</p>}
                  </div>
                )}
              </div>
            </div>
            </>
            )}
          </div>
      </div>

      {/* Column Configuration Dialog (hidden for F&B fixed mode) */}
      {activeSchema.templateId !== 'fnb-label-compliance' && (
      <Dialog open={isColumnDialogOpen} onOpenChange={(open) => { setIsColumnDialogOpen(open); if (!open) setDraftColumn(null) }}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {draftColumn?.isTransformation ? "Configure Transformation Column" : "Configure Data Column"}
              </DialogTitle>
            </DialogHeader>

            {draftColumn && (
              <div className="w-full space-y-6">
                {/* Basic */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="column-name">Column Name</Label>
                    <Input
                      id="column-name"
                      value={draftColumn.name}
                      onChange={(e) => setDraftColumn({ ...draftColumn, name: e.target.value })}
                      placeholder="e.g., Customer Name, Invoice Date"
                    />
                  </div>
                  <div>
                    <Label htmlFor="column-type">Data Type</Label>
                    <Select
                      value={draftColumn.type}
                      onValueChange={(value: DataType) => setDraftColumn({ ...draftColumn, type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="string">Text</SelectItem>
                        <SelectItem value="number">Number</SelectItem>
                        <SelectItem value="decimal">Decimal</SelectItem>
                        <SelectItem value="boolean">Boolean</SelectItem>
                        <SelectItem value="date">Date</SelectItem>
                        <SelectItem value="email">Email</SelectItem>
                        <SelectItem value="url">URL</SelectItem>
                        <SelectItem value="phone">Phone</SelectItem>
                        <SelectItem value="address">Address</SelectItem>
                        <SelectItem value="list">List</SelectItem>
                        <SelectItem value="object">Object</SelectItem>
                        <SelectItem value="table">Table</SelectItem>
                        <SelectItem value="richtext">Rich Text</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="column-description">Description</Label>
                  <Textarea
                    id="column-description"
                    value={draftColumn.description}
                    onChange={(e) => setDraftColumn({ ...draftColumn, description: e.target.value })}
                    placeholder="Describe what this field represents and where to find it"
                    rows={3}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="column-required"
                    checked={!!draftColumn.required}
                    onChange={(e) => setDraftColumn({ ...draftColumn, required: e.target.checked })}
                    className="rounded border-border"
                  />
                  <Label htmlFor="column-required">Required field</Label>
                </div>

                {/* Extraction or Transform */}
                {draftColumn.isTransformation ? (
                  <TransformBuilder
                    allColumns={displayColumns}
                    selected={draftColumn}
                    onUpdate={(updates) => setDraftColumn({ ...draftColumn, ...updates })}
                  />
                ) : (
                  <div>
                    <Label htmlFor="extraction-instructions">Extraction Instructions</Label>
                    <Textarea
                      id="extraction-instructions"
                      value={draftColumn.extractionInstructions}
                      onChange={(e) => setDraftColumn({ ...draftColumn, extractionInstructions: e.target.value })}
                      placeholder="Specific instructions for AI extraction (e.g., 'Look for the total amount at the bottom right', 'Extract the date from the header')"
                      rows={4}
                    />
                  </div>
                )}

                {/* Constraints */}
                {draftColumn.type === "string" && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="min-length">Min Length</Label>
                      <Input
                        id="min-length"
                        type="number"
                        value={draftColumn.constraints?.minLength || ""}
                        onChange={(e) =>
                          setDraftColumn({
                            ...draftColumn,
                            constraints: {
                              ...(draftColumn.constraints || {}),
                              minLength: Number.parseInt(e.target.value) || undefined,
                            },
                          })
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="max-length">Max Length</Label>
                      <Input
                        id="max-length"
                        type="number"
                        value={draftColumn.constraints?.maxLength || ""}
                        onChange={(e) =>
                          setDraftColumn({
                            ...draftColumn,
                            constraints: {
                              ...(draftColumn.constraints || {}),
                              maxLength: Number.parseInt(e.target.value) || undefined,
                            },
                          })
                        }
                      />
                    </div>
                  </div>
                )}

                {(draftColumn.type === "number" || draftColumn.type === "decimal") && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="min-value">Min Value</Label>
                      <Input
                        id="min-value"
                        type="number"
                        value={draftColumn.constraints?.min || ""}
                        onChange={(e) =>
                          setDraftColumn({
                            ...draftColumn,
                            constraints: {
                              ...(draftColumn.constraints || {}),
                              min: Number.parseFloat(e.target.value) || undefined,
                            },
                          })
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="max-value">Max Value</Label>
                      <Input
                        id="max-value"
                        type="number"
                        value={draftColumn.constraints?.max || ""}
                        onChange={(e) =>
                          setDraftColumn({
                            ...draftColumn,
                            constraints: {
                              ...(draftColumn.constraints || {}),
                              max: Number.parseFloat(e.target.value) || undefined,
                            },
                          })
                        }
                      />
                    </div>
                  </div>
                )}

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => { setIsColumnDialogOpen(false); setDraftColumn(null) }}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    onClick={() => {
                      if (!selectedColumn || !draftColumn) return
                      const updates: Partial<SchemaField> = {
                        name: draftColumn.name,
                        type: draftColumn.type,
                        description: draftColumn.description,
                        required: !!draftColumn.required,
                        extractionInstructions: draftColumn.extractionInstructions,
                        constraints: draftColumn.constraints,
                        isTransformation: !!draftColumn.isTransformation,
                        transformationType: draftColumn.transformationType,
                        transformationConfig: draftColumn.transformationConfig,
                        transformationSource: draftColumn.transformationSource,
                        transformationSourceColumnId: draftColumn.transformationSourceColumnId,
                      }
                      updateColumn(selectedColumn.id, updates)
                      setIsColumnDialogOpen(false)
                      setDraftColumn(null)
                    }}
                  >
                    Save
                  </Button>
                </DialogFooter>
              </div>
            )}
      </DialogContent>
    </Dialog>
    )}

      {/* Advanced Automation ROI Modal */}
      <Dialog open={roiOpen} onOpenChange={onCloseRoi}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {roiStage === 'calc'
                ? 'You just processed 1 document. What if you could automate the next 5 steps?'
                : 'Your estimated savings'}
            </DialogTitle>
          </DialogHeader>

          {roiStage === 'calc' ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Simple data extraction is just the start. The real power of ByteBeam is in automating the entire, multi‑step process that follows—turning raw documents into decisions, actions, and results.
              </p>
              <p className="text-sm">Imagine a workflow that can:</p>
              <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
                <li><span className="mr-1">✅</span><strong>Extract & Validate:</strong> Pull invoice data, then automatically validate it against purchase orders in your database and flag discrepancies.</li>
                <li><span className="mr-1">✅</span><strong>Analyze & Flag:</strong> Read a 50‑page legal contract, identify all non‑compliant clauses based on your custom rules, and generate a summary report.</li>
                <li><span className="mr-1">✅</span><strong>Route & Decide:</strong> Process an incoming trade compliance form, determine the correct regional office based on its contents, and forward it with a recommended action.</li>
              </ul>

              <div className="rounded-md border p-3" id="roi-calculator">
                <h3 className="font-medium">Find out the real cost of your <em>entire</em> manual workflow.</h3>
                <p className="text-sm text-muted-foreground">Enter your estimates below to see your potential savings.</p>
                <div className="mt-3 grid gap-3">
                  <div>
                    <Label>1. Documents processed per month</Label>
                    <Input type="number" placeholder="e.g., 500" value={docsPerMonth} onChange={(e) => setDocsPerMonth(e.target.value)} />
                  </div>
                  <div>
                    <Label>2. Average time for the <em>full process</em> (in minutes)</Label>
                    <Input type="number" placeholder="e.g., 15" value={timePerDoc} onChange={(e) => setTimePerDoc(e.target.value)} />
                    <p className="text-[11px] text-muted-foreground">Note: Include all steps, not just data entry.</p>
                  </div>
                  <div>
                    <Label>3. (Optional) Average hourly team cost ($)</Label>
                    <Input type="number" placeholder="e.g., 35" value={hourlyCost} onChange={(e) => setHourlyCost(e.target.value)} />
                  </div>
                </div>
                <div className="mt-3 flex justify-end">
                  <Button id="calculate-btn" onClick={calculateSavings}>Calculate My Savings 📈</Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3" id="roi-results">
              <h2 className="text-lg">You could save an estimated <strong>{totalHoursSaved} hours</strong> every month.</h2>
              {monthlyDollarSavings != null && annualDollarSavings != null && (
                <h3 className="text-base">That's around <strong>${monthlyDollarSavings.toLocaleString()}</strong> per month, or <strong>${annualDollarSavings.toLocaleString()}</strong> back in your budget every year.</h3>
              )}
              <p className="text-sm text-muted-foreground">Ready to claim that time back? Let's have a quick chat to map out the exact automation strategy to get you there.</p>
              <div className="flex items-center gap-3">
                <Button asChild>
                  <a href={BOOKING_URL} target="_blank" rel="noopener noreferrer" className="cta-button">Book a 15‑min Strategy Call</a>
                </Button>
                <small className="text-muted-foreground"><em>Your schedule is open to map this out</em></small>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      </div>
    </div>
  )
}
