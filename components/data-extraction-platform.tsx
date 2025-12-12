"use client"

import type React from "react"

import { useState, useRef, useEffect, useMemo, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { MentionTextarea } from "@/components/ui/mention-textarea"
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectSeparator, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Checkbox } from "@/components/ui/checkbox"
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Skeleton } from "@/components/ui/skeleton"
import { SetupBanner } from "./setup-banner"
// import { AgGridSheet } from "./ag-grid-sheet"
import { TanStackGridSheet } from "./tanstack-grid/TanStackGridSheet"
import { PrimitiveCell } from "./tanstack-grid/cells/PrimitiveCell"
import { ListCell } from "./tanstack-grid/cells/ListCell"
import { SingleSelectCell } from "./tanstack-grid/cells/SingleSelectCell"
import { MultiSelectCell } from "./tanstack-grid/cells/MultiSelectCell"
import { ObjectCell } from "./tanstack-grid/cells/ObjectCell"
import { TableCell } from "./tanstack-grid/cells/TableCell"
import { NestedGridModal } from "./tanstack-grid/nested/NestedGridModal"
import { NestedAdvancedField } from "./tanstack-grid/nested/NestedAdvancedField"
import { OCRDetailModal } from "@/components/OCRDetailModal"
import { TransformBuilder } from "@/components/transform-builder"
import { GalleryView } from "@/components/gallery-view/GalleryView"
import { JobGalleryView } from "@/components/data-extraction/JobGalleryView"
import { TemplateSelectorDialog } from "@/components/workspace/TemplateSelectorDialog"
import { ManualRecordDialog } from "@/components/design-preview/views/dashboard/ManualRecordDialog"
import { MultiDocumentUpload, type MultiDocUploadMap, type MultiDocInput } from "@/components/features/extraction/MultiDocumentUpload"
import { ExtractionDetailDialog } from "@/components/design-preview/views/dashboard/ExtractionDetailDialog"
import { LabelData, DEFAULT_LABEL_DATA, labelDataToResults } from "@/components/label-maker"
import { PharmaResultsView } from "@/components/features/extraction/components/PharmaResultsView"
import { FnBResultsView } from "@/components/features/extraction/components/FnBResultsView"
import { StandardResultsView } from "@/components/features/extraction/components/StandardResultsView"
import { cn } from "@/lib/utils"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'

const APP_DEBUG_ENABLED =
  typeof process !== "undefined"
    ? process.env.NEXT_PUBLIC_APP_DEBUG !== "false"
    : true;
function appDebug(message: string, payload?: Record<string, unknown>) {
  if (!APP_DEBUG_ENABLED) return;
  try {
    const ts = new Date().toISOString();
    if (payload) {
      // eslint-disable-next-line no-console
      console.log(`[DataExtraction] ${ts} ${message}`, payload);
    } else {
      // eslint-disable-next-line no-console
      console.log(`[DataExtraction] ${ts} ${message}`);
    }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn("[DataExtraction] debug log failed", err);
  }
}

type AgentType = "standard" | "pharma"

import {
  type DataType,
  type DataPrimitive,
  type TransformationType,
  type SchemaField,
  type ExtractionField,
  type ObjectField,
  type ListField,
  type TableField,
  type LeafField,
  type InputField,
  type SchemaDefinition,
  type ExtractionJob,
  type VisualGroup,
  type ExtractionResultsMeta,
  type FieldReviewMeta,
  flattenFields,
  updateFieldById,
  removeFieldById,
  flattenResultsById,
  createVisualGroup,
  addVisualGroup,
  removeVisualGroup,
  isInputField,
  isExtractionField,
  getInputFields,
} from "@/lib/schema"

import {
  buildDependencyGraph,
  topologicalSort,
  validateDependencies,
  getFieldDependents,
} from "@/lib/dependency-resolver"
import {
  computeInitialReviewMeta,
  extractResultsMeta,
  mergeResultsWithMeta,
  sanitizeResultsFromFlat,
  sanitizeResultsFromTree,
} from "@/lib/extraction-results"
import { extractDocumentReferences } from "@/lib/extraction/mentionParser"

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
  Check,
  CheckCircle,
  Clock,
  AlertCircle,
  X,
  ChevronDown,
  Maximize2,
  Eye,
  Layers,
  Edit,
  Save,
  Loader2,
  Sparkle,
  CheckSquare,
  ListChecks,
  LayoutGrid,
  Grid,
  Gauge,
} from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { useSession, useSupabaseClient } from "@/lib/supabase/hooks"
import type { Database } from "@/lib/supabase/types"
import { useAuthDialog } from "@/components/auth/AuthDialogContext"
import { useToast } from "@/components/ui/use-toast"
import type { SchemaTemplateDefinition } from "@/lib/schema-templates"
import { cloneSchemaFields, getStaticSchemaTemplates } from "@/lib/schema-templates"

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
  single_select: CheckSquare,
  multi_select: ListChecks,
  list: List,
  object: Globe,
  table: List,
  input: Upload,
}

const transformationIcons: Record<TransformationType, any> = {
  currency_conversion: Calculator,
  classification: Zap,
  calculation: Calculator,
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
  { value: 'single_select', label: 'Single Select (Choose one)' },
  { value: 'multi_select', label: 'Multi Select (Choose many)' },
]

const complexDataTypeOptions: Array<{ value: DataType; label: string }> = [
  { value: 'object', label: 'Object (Group of fields)' },
  { value: 'table', label: 'Table (Rows and columns)' },
  { value: 'list', label: 'List (Array of items)' },
]

// Downscale large images client-side to avoid Vercel 413 limits
async function maybeDownscaleImage(
  file: File,
  opts?: { maxDim?: number; quality?: number; targetBytes?: number },
): Promise<{ blob: Blob; type: string; name: string }> {
  try {
    const targetBytes = opts?.targetBytes ?? 3_000_000 // ~3 MB for extra headroom
    if (!file.type?.startsWith('image/')) {
      return { blob: file, type: file.type || 'application/octet-stream', name: file.name }
    }
    if (file.size <= targetBytes) {
      return { blob: file, type: file.type || 'image/jpeg', name: file.name }
    }

    const maxDim = opts?.maxDim ?? 2000
    const initialQuality = opts?.quality ?? 0.8

    const bitmap = await createImageBitmap(file)
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      bitmap.close?.()
      return { blob: file, type: file.type || 'image/jpeg', name: file.name }
    }

    const type = 'image/jpeg'
    let attempt = 0
    let currentQuality = initialQuality
    let dimensionScale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height))
    let blob: Blob | null = null

    while (attempt < 6) {
      const width = Math.max(1, Math.round(bitmap.width * dimensionScale))
      const height = Math.max(1, Math.round(bitmap.height * dimensionScale))
      canvas.width = width
      canvas.height = height
      ctx.clearRect(0, 0, width, height)
      ctx.drawImage(bitmap, 0, 0, width, height)

      blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob((b) => resolve(b), type, currentQuality)
      })
      if (!blob) {
        break
      }
      if (blob.size <= targetBytes) {
        break
      }

      // Reduce both quality and dimensions for the next iteration
      currentQuality = Math.max(0.4, currentQuality * 0.82)
      dimensionScale = Math.max(0.4, dimensionScale * 0.85)
      attempt += 1
    }

    bitmap.close?.()

    if (!blob) {
      return { blob: file, type: file.type || 'image/jpeg', name: file.name }
    }

    return {
      blob,
      type,
      name: file.name.replace(/\.(png|jpe?g|webp|bmp|gif|heic)$/i, '.jpg'),
    }
  } catch {
    return { blob: file, type: file.type || 'application/octet-stream', name: file.name }
  }
}

type SchemaRow = Database["public"]["Tables"]["schemas"]["Row"]
type ExtractionJobRow = Database["public"]["Tables"]["extraction_jobs"]["Row"]

type SchemaSyncInfo = {
  status: 'idle' | 'saving' | 'error'
  updatedAt?: Date
  error?: string
}

function generateUuid(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID()
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function isValidUuid(value: string | null | undefined): value is string {
  return typeof value === "string" && UUID_REGEX.test(value)
}

function createInitialSchemaDefinition(): SchemaDefinition {
  return {
    id: generateUuid(),
    name: "Data Extraction Schema",
    fields: [],
    jobs: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  }
}

function schemaRowToDefinition(row: SchemaRow, jobRows: ExtractionJobRow[]): SchemaDefinition {
  const jobs = jobRows
    .filter((job) => job.schema_id === row.id)
    .map((job) => extractionJobRowToJob(job))

  return {
    id: row.id,
    name: row.name ?? "Data Extraction Schema",
    fields: Array.isArray(row.fields) ? (row.fields as unknown as SchemaField[]) : [],
    jobs,
    templateId: row.template_id ?? undefined,
    visualGroups: Array.isArray(row.visual_groups)
      ? (row.visual_groups as unknown as VisualGroup[])
      : undefined,
    createdAt: row.created_at ? new Date(row.created_at) : undefined,
    updatedAt: row.updated_at ? new Date(row.updated_at) : undefined,
  }
}

function extractionJobRowToJob(row: ExtractionJobRow): ExtractionJob {
  const raw = (row.results as Record<string, any> | null) ?? undefined
  const { values, meta } = extractResultsMeta(raw)
  const inputDocuments =
    row.input_documents && typeof row.input_documents === 'object'
      ? Object.fromEntries(
        Object.entries(row.input_documents as Record<string, any>).map(([fieldId, doc]) => [
          fieldId,
          {
            ...doc,
            uploadedAt: doc?.uploadedAt ? new Date(doc.uploadedAt) : new Date(),
          },
        ]),
      )
      : undefined

  return {
    id: row.id,
    fileName: row.file_name,
    status: row.status,
    results: values ?? undefined,
    review: meta?.review ?? undefined,
    createdAt: row.created_at ? new Date(row.created_at) : new Date(),
    completedAt: row.completed_at ? new Date(row.completed_at) : undefined,
    agentType: row.agent_type ?? undefined,
    ocrMarkdown: row.ocr_markdown ?? null,
    ocrAnnotatedImageUrl: row.ocr_annotated_image_url ?? null,
    originalFileUrl: row.original_file_url ?? null,
    inputDocuments,
  }
}

function schemaDefinitionToRow(schema: SchemaDefinition, userId: string): SchemaRow {
  return {
    id: schema.id,
    user_id: userId,
    name: schema.name,
    fields: schema.fields as unknown as SchemaRow["fields"],
    template_id: schema.templateId ?? null,
    visual_groups: (schema.visualGroups ?? null) as unknown as SchemaRow["visual_groups"],
    created_at: schema.createdAt ? schema.createdAt.toISOString() : null,
    updated_at: new Date().toISOString(),
  }
}

function extractionJobToRow(job: ExtractionJob, schemaId: string, userId: string): ExtractionJobRow {
  const baseResults = job.results ? { ...job.results } : {}
  let meta: ExtractionResultsMeta | undefined

  if (job.review && Object.keys(job.review).length > 0) {
    const confidenceMap = Object.entries(job.review).reduce<Record<string, number | null>>(
      (acc, [fieldId, info]) => {
        if (info && typeof info.confidence === "number") {
          acc[fieldId] = Math.max(0, Math.min(1, info.confidence))
        } else if (info && info.confidence === null) {
          acc[fieldId] = null
        }
        return acc
      },
      {},
    )

    meta = {
      review: job.review,
    }

    if (Object.keys(confidenceMap).length > 0) {
      meta.confidence = confidenceMap
    }
  }

  const merged = mergeResultsWithMeta(baseResults, meta)
  const serializedResults =
    Object.keys(merged).length === 0 ? null : (merged as ExtractionJobRow["results"])

  return {
    id: job.id,
    schema_id: schemaId,
    user_id: userId,
    file_name: job.fileName,
    status: job.status,
    results: serializedResults,
    ocr_markdown: job.ocrMarkdown ?? null,
    ocr_annotated_image_url: job.ocrAnnotatedImageUrl ?? null,
    original_file_url: job.originalFileUrl ?? null,
    agent_type: job.agentType ?? null,
    input_documents: job.inputDocuments ?? null,
    created_at: job.createdAt?.toISOString() ?? new Date().toISOString(),
    completed_at: job.completedAt ? job.completedAt.toISOString() : null,
    updated_at: new Date().toISOString(),
  }
}

function sortObject(value: any): any {
  if (Array.isArray(value)) {
    return value.map(sortObject)
  }
  if (value && typeof value === "object") {
    const sortedKeys = Object.keys(value).sort()
    return sortedKeys.reduce<Record<string, any>>((acc, key) => {
      acc[key] = sortObject(value[key])
      return acc
    }, {})
  }
  return value
}

function stableStringify(value: any): string {
  if (value === undefined) return "undefined"
  return JSON.stringify(sortObject(value))
}

function jobsShallowEqual(a: ExtractionJob, b: ExtractionJob): boolean {
  if (a === b) {
    return true
  }

  const createdAtA = a.createdAt ? a.createdAt.getTime() : null
  const createdAtB = b.createdAt ? b.createdAt.getTime() : null
  const completedAtA = a.completedAt ? a.completedAt.getTime() : null
  const completedAtB = b.completedAt ? b.completedAt.getTime() : null

  const resultsA = a.results ?? null
  const resultsB = b.results ?? null
  const resultsEqual = stableStringify(resultsA) === stableStringify(resultsB)
  const reviewA = a.review ?? null
  const reviewB = b.review ?? null
  const reviewEqual = stableStringify(reviewA) === stableStringify(reviewB)
  const inputDocsA = a.inputDocuments ?? null
  const inputDocsB = b.inputDocuments ?? null
  const inputDocsEqual = stableStringify(inputDocsA) === stableStringify(inputDocsB)

  return (
    a.id === b.id &&
    a.fileName === b.fileName &&
    a.status === b.status &&
    (a.agentType ?? null) === (b.agentType ?? null) &&
    (a.ocrMarkdown ?? null) === (b.ocrMarkdown ?? null) &&
    (a.ocrAnnotatedImageUrl ?? null) === (b.ocrAnnotatedImageUrl ?? null) &&
    (a.originalFileUrl ?? null) === (b.originalFileUrl ?? null) &&
    createdAtA === createdAtB &&
    completedAtA === completedAtB &&
    resultsEqual &&
    reviewEqual &&
    inputDocsEqual
  )
}

function diffJobLists(prevJobs: ExtractionJob[], nextJobs: ExtractionJob[]) {
  const prevMap = new Map(prevJobs.map((job) => [job.id, job]))
  const upsert: ExtractionJob[] = []
  const deleted: string[] = []

  for (const job of nextJobs) {
    const prev = prevMap.get(job.id)
    if (!prev) {
      upsert.push(job)
    } else {
      if (!jobsShallowEqual(prev, job)) {
        upsert.push(job)
      }
      prevMap.delete(job.id)
    }
  }

  prevMap.forEach((_, jobId) => {
    deleted.push(jobId)
  })

  return { upsert, deleted }
}

function upsertJobInList(list: ExtractionJob[], job: ExtractionJob): ExtractionJob[] {
  const index = list.findIndex((existing) => existing.id === job.id)
  if (index === -1) {
    return [...list, job]
  }
  const next = [...list]
  next[index] = job
  return next
}

//



interface DataExtractionPlatformProps {
  externalActiveSchemaId?: string
  onSchemasChanged?: (schemas: SchemaDefinition[]) => void
  pendingSchemaCreate?: {
    id: string
    name: string
    templateId?: string | null
    agent: AgentType
  } | null
  onPendingCreateConsumed?: () => void
  templateLibrary?: SchemaTemplateDefinition[]
  onCreateTemplate?: (
    schema: SchemaDefinition,
    input: { name: string; description?: string; agent: AgentType },
  ) => Promise<{ success: true; template: SchemaTemplateDefinition } | { success: false; error: string }>
  isEmbedded?: boolean
}

export function DataExtractionPlatform({
  externalActiveSchemaId,
  onSchemasChanged,
  pendingSchemaCreate,
  onPendingCreateConsumed,
  templateLibrary,
  onCreateTemplate,
  isEmbedded = false,
}: DataExtractionPlatformProps = {}) {
  const initialSchemaRef = useRef<SchemaDefinition | null>(null)
  if (!initialSchemaRef.current) {
    initialSchemaRef.current = createInitialSchemaDefinition()
  }
  const [schemas, setSchemas] = useState<SchemaDefinition[]>([initialSchemaRef.current])
  const schemasRef = useRef<SchemaDefinition[]>([initialSchemaRef.current])
  const [activeSchemaId, setActiveSchemaId] = useState<string>(initialSchemaRef.current.id)
  
  // Use ref to stabilize activeSchema - only update when content actually changes
  const prevActiveSchemaRef = useRef<SchemaDefinition>(initialSchemaRef.current)
  const activeSchemaCandidate = schemas.find((s) => s.id === activeSchemaId) || initialSchemaRef.current
  
  // Only update the ref if the schema content has meaningfully changed (using serialization as a proxy)
  const activeSchemaKey = `${activeSchemaCandidate.id}-${activeSchemaCandidate.fields?.length}-${activeSchemaCandidate.jobs?.length}`
  const prevKey = useRef(activeSchemaKey)
  if (prevKey.current !== activeSchemaKey) {
    prevActiveSchemaRef.current = activeSchemaCandidate
    prevKey.current = activeSchemaKey
  }
  const activeSchema = prevActiveSchemaRef.current
  
  const isEmbeddedInWorkspace = Boolean(externalActiveSchemaId)
  const [selectedAgent, setSelectedAgent] = useState<AgentType>("standard")
  const [viewMode, setViewMode] = useState<'grid' | 'gallery'>('grid')
  const [showGallery, setShowGallery] = useState(true)
  const [selectedJob, setSelectedJob] = useState<ExtractionJob | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  
  const fields = activeSchema.fields
  const jobs = activeSchema.jobs
  const displayColumns = useMemo(() => flattenFields(fields), [fields])
  const session = useSession()
  const supabase = useSupabaseClient()
  const { openAuthDialog } = useAuthDialog()
  const { toast } = useToast()
  const [isWorkspaceLoading, setIsWorkspaceLoading] = useState(false)
  const [loadWorkspaceError, setLoadWorkspaceError] = useState<string | null>(null)
  const [schemaSyncState, setSchemaSyncState] = useState<Record<string, SchemaSyncInfo>>({})
  const schemaSyncStateRef = useRef<Record<string, SchemaSyncInfo>>({})
  const lastLoadedUserIdRef = useRef<string | null>(null)
  const guestSchemasRef = useRef<SchemaDefinition[] | null>(null)
  const guestPromptShownRef = useRef(false)
  const [schemaDeletionDialog, setSchemaDeletionDialog] = useState<SchemaDefinition | null>(null)
  const [isTemplateSelectorOpen, setIsTemplateSelectorOpen] = useState(false)
  const [isManualRecordOpen, setIsManualRecordOpen] = useState(false)
  const [labelMakerJob, setLabelMakerJob] = useState<ExtractionJob | null>(null)
  const [isLabelMakerNewRecord, setIsLabelMakerNewRecord] = useState(false)
  const hasInitialLoadCompletedRef = useRef(false)
  const autoAppliedTemplatesRef = useRef<Set<string>>(new Set())
  // Track externalActiveSchemaId changes once to avoid churn from schema array updates.
  const lastExternalSchemaIdRef = useRef<string | null>(null)
  useEffect(() => {
    if (!externalActiveSchemaId) return
    if (lastExternalSchemaIdRef.current === externalActiveSchemaId) return
    lastExternalSchemaIdRef.current = externalActiveSchemaId

    const exists = schemas.some((schema) => schema.id === externalActiveSchemaId)
    if (exists) {
      setActiveSchemaId(externalActiveSchemaId)
    } else {
      // Schema may still be loading; set active so uploads use the correct schema_id.
      console.log(`[bytebeam] externalActiveSchemaId ${externalActiveSchemaId} not in schemas array yet, setting as active anyway`)
      setActiveSchemaId(externalActiveSchemaId)
    }
  }, [externalActiveSchemaId, schemas])
  useEffect(() => {
    onSchemasChanged?.(schemas)
  }, [schemas, onSchemasChanged])
  useEffect(() => {
    schemasRef.current = schemas
  }, [schemas])
  useEffect(() => {
    schemaSyncStateRef.current = schemaSyncState
  }, [schemaSyncState])
  const renderCountRef = useRef(0)
  const renderWindowStartRef = useRef<number>(Date.now())
  renderCountRef.current += 1
  if (APP_DEBUG_ENABLED) {
    try {
      const elapsed = Date.now() - renderWindowStartRef.current
      if (elapsed > 3000) {
        renderWindowStartRef.current = Date.now()
        renderCountRef.current = 1
      } else if (renderCountRef.current % 25 === 0) {
        appDebug("Render burst", {
          renders: renderCountRef.current,
          elapsedMs: elapsed,
          activeSchemaId,
          fieldCount: fields.length,
          jobCount: jobs.length,
        })
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn("[DataExtraction] failed to log render burst", err)
    }
  }
  useEffect(() => {
    if (!isEmbeddedInWorkspace) return
    // Only re-run when the templateId actually changes
    const nextAgent = inferAgentTypeFromSchema(activeSchema)
    setSelectedAgent((prev) => {
      // Only update if actually different
      if (prev === nextAgent) return prev
      return nextAgent
    })
  }, [isEmbedded, activeSchema.templateId])
  const applySchemaUpdate = useCallback(
    (schemaId: string, updater: (schema: SchemaDefinition) => SchemaDefinition): SchemaDefinition | null => {
      let updatedSchema: SchemaDefinition | null = null
      setSchemas((prev) =>
        prev.map((schema) => {
          if (schema.id !== schemaId) return schema
          const draft = { ...schema }
          const updated = updater(draft)
          const next = { ...updated, updatedAt: new Date(), createdAt: updated.createdAt ?? schema.createdAt }
          updatedSchema = next
          return next
        }),
      )
      return updatedSchema
    },
    [],
  )
  const hasWorkspaceContent = useMemo(
    () =>
      schemas.some(
        (schema) => (schema.fields?.length ?? 0) > 0 || (schema.jobs?.length ?? 0) > 0,
      ),
    [schemas],
  )
  // Active schema logging moved below after selectedRowId is defined to avoid TDZ.
  useEffect(() => {
    const handler = (event: ErrorEvent) => {
      try {
        appDebug("Window error", {
          message: event.message,
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
          stack: event.error?.stack,
        })
      } catch (err) {
        // eslint-disable-next-line no-console
        console.warn("[DataExtraction] failed to log window error", err)
      }
    }
    const rejectionHandler = (event: PromiseRejectionEvent) => {
      try {
        appDebug("Unhandled rejection", { reason: String(event.reason) })
      } catch (err) {
        // eslint-disable-next-line no-console
        console.warn("[DataExtraction] failed to log rejection", err)
      }
    }
    window.addEventListener("error", handler)
    window.addEventListener("unhandledrejection", rejectionHandler)
    return () => {
      window.removeEventListener("error", handler)
      window.removeEventListener("unhandledrejection", rejectionHandler)
    }
  }, [])
  useEffect(() => {
    if (!session?.user?.id) {
      guestSchemasRef.current = schemas
    }
  }, [schemas, session?.user?.id])
  useEffect(() => {
    if (typeof window === "undefined") return
    const handler = (event: BeforeUnloadEvent) => {
      const hasPendingSync = Object.values(schemaSyncState).some((state) => state.status === 'saving')
      const hasSyncError = Object.values(schemaSyncState).some((state) => state.status === 'error')
      const shouldWarn = session?.user?.id ? hasPendingSync || hasSyncError || isWorkspaceLoading : hasWorkspaceContent
      if (shouldWarn) {
        event.preventDefault()
        event.returnValue = "You have unsaved progress. Sign in to save your work."
      }
    }
    window.addEventListener("beforeunload", handler)
    return () => window.removeEventListener("beforeunload", handler)
  }, [schemaSyncState, hasWorkspaceContent, isWorkspaceLoading, session?.user?.id])
  useEffect(() => {
    if (session?.user?.id) {
      guestPromptShownRef.current = false
      return
    }
    const hasCompletedJob = schemas.some((schema) =>
      schema.jobs.some((job) => job.status === "completed"),
    )
    if (hasCompletedJob && !guestPromptShownRef.current) {
      guestPromptShownRef.current = true
      openAuthDialog("sign-up")
    }
  }, [openAuthDialog, schemas, session?.user?.id])
  const [selectedColumn, setSelectedColumn] = useState<SchemaField | null>(null)
  const [draftColumn, setDraftColumn] = useState<SchemaField | null>(null)
  const [isColumnDialogOpen, setIsColumnDialogOpen] = useState(false)
  const [columnDialogMode, setColumnDialogMode] = useState<'create' | 'edit'>('create')
  const fileInputRef = useRef<HTMLInputElement>(null)
  // Multi-document upload dialog state
  const [isMultiDocUploadOpen, setIsMultiDocUploadOpen] = useState(false)
  // Schema name editing
  const [editingSchemaName, setEditingSchemaName] = useState(false)
  const [schemaNameInput, setSchemaNameInput] = useState<string>(activeSchema.name)
  const isDraftTransformation = draftColumn && isExtractionField(draftColumn) ? !!draftColumn.isTransformation : false
  const isDraftInput = draftColumn?.type === 'input'
  // Determine field source mode: 'input', 'transformation', or 'extraction'
  const draftFieldSource: 'input' | 'transformation' | 'extraction' =
    isDraftInput ? 'input' : isDraftTransformation ? 'transformation' : 'extraction'
  useEffect(() => {
    if (!APP_DEBUG_ENABLED) return
    try {
      appDebug("Column dialog state", {
        open: isColumnDialogOpen,
        mode: columnDialogMode,
        selectedColumnId: selectedColumn?.id ?? null,
      })
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn("[DataExtraction] failed to log column dialog state", err)
    }
  }, [isColumnDialogOpen, columnDialogMode, selectedColumn?.id])
  useEffect(() => {
    const userId = session?.user?.id
    if (APP_DEBUG_ENABLED) {
      try {
        appDebug("Session change", {
          userId: userId ?? "guest",
          schemaCount: schemas.length,
        })
      } catch (err) {
        // eslint-disable-next-line no-console
        console.warn("[DataExtraction] failed to log session change", err)
      }
    }

    if (!userId) {
      lastLoadedUserIdRef.current = null
      const fresh = createInitialSchemaDefinition()
      setSchemas([fresh])
      setActiveSchemaId(fresh.id)
      setSchemaNameInput(fresh.name)
      setSchemaSyncState({})
      setLoadWorkspaceError(null)
      hasInitialLoadCompletedRef.current = true
      // If no user, we might want to show the gallery if there are multiple local schemas
      // For now, default to gallery if we have schemas, or detail if it's a fresh start
      setShowGallery(true)
      return
    }

    if (lastLoadedUserIdRef.current === userId) {
      hasInitialLoadCompletedRef.current = true
      return
    }

    hasInitialLoadCompletedRef.current = false

    let cancelled = false
    const loadWorkspace = async () => {
      setIsWorkspaceLoading(true)
      setLoadWorkspaceError(null)
      try {
        const { data: schemaRows, error: schemaError } = await supabase
          .from("schemas")
          .select("*")
          .eq("user_id", userId)
          .order("created_at", { ascending: true })

        if (schemaError) {
          throw schemaError
        }

        const { data: jobRows, error: jobError } = await supabase
          .from("extraction_jobs")
          .select("*")
          .eq("user_id", userId)

        if (jobError) {
          throw jobError
        }

        const schemaData = schemaRows ?? []
        const jobData = jobRows ?? []

        const guestSchemas = guestSchemasRef.current
        const hasLocalWorkspace =
          Array.isArray(guestSchemas) &&
          guestSchemas.some(
            (schema) => (schema.fields?.length ?? 0) > 0 || (schema.jobs?.length ?? 0) > 0,
          )

        if (schemaData.length === 0 && hasLocalWorkspace) {
          if (cancelled) return
          lastLoadedUserIdRef.current = userId
          hasInitialLoadCompletedRef.current = true
          setSchemaSyncState({})
          return
        }

        const remoteSchemas =
          schemaData.length > 0
            ? schemaData.map((row) => schemaRowToDefinition(row, jobData))
            : [createInitialSchemaDefinition()]

        if (cancelled) return

        const localSchemasSnapshot = schemasRef.current
        const localMap = new Map(localSchemasSnapshot.map((schema) => [schema.id, schema]))
        const mergedSchemas: SchemaDefinition[] = remoteSchemas.map((remote) => {
          const local = localMap.get(remote.id)
          if (!local) return remote
          const syncStatus = schemaSyncStateRef.current[remote.id]?.status
          const localUpdatedAt = local.updatedAt?.getTime() ?? 0
          const remoteUpdatedAt = remote.updatedAt?.getTime() ?? 0
          if (syncStatus === 'saving' || localUpdatedAt > remoteUpdatedAt) {
            return local
          }
          return remote
        })

        const remoteIds = new Set(remoteSchemas.map((schema) => schema.id))
        localSchemasSnapshot.forEach((local) => {
          if (!remoteIds.has(local.id)) {
            mergedSchemas.push(local)
          }
        })

        if (mergedSchemas.length === 0) {
          mergedSchemas.push(createInitialSchemaDefinition())
        }

        setSchemas(mergedSchemas)
        const nextActive = mergedSchemas.find((schema) => schema.id === activeSchemaId) ?? mergedSchemas[0]
        setActiveSchemaId(nextActive.id)
        setSchemaNameInput(nextActive.name)
        guestSchemasRef.current = null
        lastLoadedUserIdRef.current = userId
        setSchemaSyncState((prev) => {
          const nextState: Record<string, SchemaSyncInfo> = {}
          mergedSchemas.forEach((schema) => {
            const previous = prev[schema.id]
            nextState[schema.id] =
              previous ?? {
                status: 'idle',
                updatedAt: schema.updatedAt,
              }
          })
          return nextState
        })
        hasInitialLoadCompletedRef.current = true
      } catch (error) {
        if (!cancelled) {
          setLoadWorkspaceError(error instanceof Error ? error.message : "Failed to load your saved workspace.")
        }
      } finally {
        if (!cancelled) {
          setIsWorkspaceLoading(false)
          if (!hasInitialLoadCompletedRef.current) {
            hasInitialLoadCompletedRef.current = true
          }
        }
      }
    }

    loadWorkspace()

    return () => {
      cancelled = true
    }
  }, [session?.user?.id, supabase])
  const schemaIdsKey = useMemo(() => {
    if (!session?.user?.id) return ""
    const ids = schemas.map((schema) => schema.id).sort()
    return ids.join(",")
  }, [schemas, session?.user?.id])

  useEffect(() => {
    if (!session?.user?.id) return
    if (!schemaIdsKey) return

    const schemaIds = schemaIdsKey.split(",").filter((id) => id.length > 0)
    if (schemaIds.length === 0) return

    const filterList = schemaIds.map((id) => `'${id}'`).join(",")
    const channelName = `job-sync-${schemaIdsKey.replace(/,/g, "-")}`

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'extraction_jobs',
          filter: `schema_id=in.(${filterList})`,
        },
        (payload) => {
          const eventType = payload.eventType
          if (eventType === 'INSERT' || eventType === 'UPDATE') {
            const row = payload.new as ExtractionJobRow | null
            if (!row?.schema_id) return
            const mapped = extractionJobRowToJob(row)
            setSchemas((prev) =>
              prev.map((schema) => {
                if (schema.id !== row.schema_id) return schema
                const nextJobs = upsertJobInList(schema.jobs ?? [], mapped)
                return { ...schema, jobs: nextJobs }
              }),
            )
          } else if (eventType === 'DELETE') {
            const row = payload.old as ExtractionJobRow | null
            if (!row?.schema_id || !row.id) return
            setSchemas((prev) =>
              prev.map((schema) => {
                if (schema.id !== row.schema_id) return schema
                return { ...schema, jobs: (schema.jobs ?? []).filter((job) => job.id !== row.id) }
              }),
            )
          }
        },
      )

    channel.subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [schemaIdsKey, session?.user?.id, supabase])

  // UI state for modern grid behaviors
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null)

  // Pharma agent editing state
  const [pharmaEditingSection, setPharmaEditingSection] = useState<string | null>(null)
  const [pharmaEditedValues, setPharmaEditedValues] = useState<Record<string, string>>({})
  // Column grouping state
  const [selectedColumnIds, setSelectedColumnIds] = useState<Set<string>>(new Set())
  const [isGroupDialogOpen, setIsGroupDialogOpen] = useState(false)
  const [groupName, setGroupName] = useState<string>('')
  const [contextMenuColumn, setContextMenuColumn] = useState<string | null>(null)
  const [contextMenuPosition, setContextMenuPosition] = useState<{ x: number; y: number } | null>(null)
  // F&B translation collapsible state per job
  const [fnbCollapse, setFnbCollapse] = useState<Record<string, { en: boolean; ar: boolean }>>({})
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null)
  // Table modal state
  const [tableModalOpen, setTableModalOpen] = useState(false)
  const [tableModalData, setTableModalData] = useState<{
    column: SchemaField
    job: ExtractionJob
    rows: Record<string, any>[]
    columnHeaders: { key: string; label: string }[]
  } | null>(null)
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false)
  const [templateNameInput, setTemplateNameInput] = useState<string>(activeSchema.name)
  const [templateDescriptionInput, setTemplateDescriptionInput] = useState<string>("")
  const [isSavingTemplate, setIsSavingTemplate] = useState(false)
  useEffect(() => {
    if (isTemplateDialogOpen) return
    setTemplateNameInput(activeSchema.name || "New template")
  }, [activeSchema.name, isTemplateDialogOpen])
  const completedJobsCount = jobs.filter((j) => j.status === 'completed').length
  const sortedJobs = useMemo(
    () => [...jobs].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime()),
    [jobs],
  )

  useEffect(() => {
    try {
      appDebug("Active schema", {
        id: activeSchema.id,
        name: activeSchema.name,
        fieldCount: fields.length,
        jobCount: jobs.length,
        viewMode,
        selectedRowId,
      })
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn("[DataExtraction] failed to log active schema", err)
    }
  }, [activeSchema.id, activeSchema.name, fields.length, jobs.length, viewMode, selectedRowId])


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

  const formatNumericValue = useCallback((raw: unknown): string | null => {
    const candidate = typeof raw === 'number' ? raw : Number(raw)
    if (!Number.isFinite(candidate)) return null
    return numberFormatter.format(candidate)
  }, [numberFormatter])

  const formatDateValue = useCallback((raw: unknown): string | null => {
    if (!raw) return null
    const date = raw instanceof Date ? raw : new Date(raw as any)
    if (Number.isNaN(date.getTime())) return null
    return dateFormatter.format(date)
  }, [dateFormatter])

  const toggleRowExpansion = useCallback((jobId: string | null) => {
    setExpandedRowId((prev) => (prev === jobId ? null : jobId))
  }, [])

  const openTableModal = useCallback((
    column: SchemaField,
    job: ExtractionJob,
    rows: Record<string, any>[],
    columnHeaders: { key: string; label: string }[]
  ) => {
    setTableModalData({ column, job, rows, columnHeaders })
    setTableModalOpen(true)
  }, [])

  const findChildLabel = useCallback((column: SchemaField, key: string): string | undefined => {
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
  }, [])

  const prettifyKey = useCallback((key: string) => key.replace(/[_-]/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase()), [])

  const getObjectEntries = useCallback((column: SchemaField, value: Record<string, any>) => {
    return Object.entries(value)
      .filter(([, v]) => v !== null && v !== undefined && v !== '')
      .map(([key, v]) => ({
        label: findChildLabel(column, key) ?? prettifyKey(key),
        value: v,
      }))
  }, [findChildLabel, prettifyKey])

  const firstNonEmptyText = useCallback((value: Record<string, any>) => {
    for (const v of Object.values(value)) {
      if (v && typeof v === 'string') {
        const trimmed = v.trim()
        if (trimmed) return trimmed
      }
    }
    return null
  }, [])

  const createLeafField = (name = 'field', type: DataPrimitive = 'string'): LeafField => ({
    id: `field_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    name,
    type,
    description: '',
    extractionInstructions: '',
    required: false,
  })

  const cloneField = <T extends SchemaField>(field: T): T => JSON.parse(JSON.stringify(field)) as T

  const normaliseDraftForType = (prev: SchemaField, nextType: DataType): SchemaField => {
    if (nextType === 'object') {
      const existing = (prev as any).children as SchemaField[] | undefined
      const children = existing?.length ? existing.map((child) => cloneField(child)) : [createLeafField('name'), createLeafField('value')]
      return {
        ...prev,
        type: 'object',
        children,
      } as ObjectField
    }
    if (nextType === 'table') {
      const existing = (prev as any).columns as SchemaField[] | undefined
      const columns = existing?.length ? existing.map((col) => cloneField(col)) : [createLeafField('Column 1'), createLeafField('Column 2')]
      return {
        ...prev,
        type: 'table',
        columns,
      } as TableField
    }
    if (nextType === 'list') {
      const existing = (prev as any).item as SchemaField | undefined
      const item = existing ? cloneField(existing) : createLeafField('item')
      return {
        ...prev,
        type: 'list',
        item,
      } as ListField
    }
    if (nextType === 'single_select' || nextType === 'multi_select') {
      const prevConstraints = isExtractionField(prev) ? prev.constraints : undefined
      const leaf: LeafField = {
        ...(prev as any),
        type: nextType,
        constraints: {
          ...prevConstraints,
          options: prevConstraints?.options || []
        }
      }
      delete (leaf as any).children
      delete (leaf as any).columns
      delete (leaf as any).item
      return leaf
    }
    const leaf: LeafField = {
      ...(prev as any),
      type: nextType,
    }
    delete (leaf as any).children
    delete (leaf as any).columns
    delete (leaf as any).item
    return leaf
  }

  const changeDraftType = (nextType: DataType) => {
    setDraftColumn((prev) => {
      if (!prev) return prev
      return normaliseDraftForType(prev, nextType)
    })
  }

  const addObjectSubField = () => {
    setDraftColumn((prev) => {
      if (!prev || prev.type !== 'object') return prev
      const objectDraft = prev as ObjectField
      const children = [...(objectDraft.children || []).map((child) => cloneField(child)), createLeafField(`Field ${objectDraft.children.length + 1}`)]
      return { ...objectDraft, children }
    })
  }

  const updateObjectSubField = (childId: string, updates: Partial<LeafField>) => {
    setDraftColumn((prev) => {
      if (!prev || prev.type !== 'object') return prev
      const objectDraft = prev as ObjectField
      const children = (objectDraft.children || []).map((child) => (child.id === childId ? { ...child, ...updates } : child))
      return { ...objectDraft, children }
    })
  }

  const removeObjectSubField = (childId: string) => {
    setDraftColumn((prev) => {
      if (!prev || prev.type !== 'object') return prev
      const objectDraft = prev as ObjectField
      const children = (objectDraft.children || []).filter((child) => child.id !== childId)
      return { ...objectDraft, children }
    })
  }

  const addTableColumn = () => {
    setDraftColumn((prev) => {
      if (!prev || prev.type !== 'table') return prev
      const tableDraft = prev as TableField
      const columns = [...(tableDraft.columns || []).map((col) => cloneField(col)), createLeafField(`Column ${tableDraft.columns.length + 1}`)]
      return { ...tableDraft, columns }
    })
  }

  const updateTableColumn = (columnId: string, updates: Partial<LeafField>) => {
    setDraftColumn((prev) => {
      if (!prev || prev.type !== 'table') return prev
      const tableDraft = prev as TableField
      const columns = (tableDraft.columns || []).map((col) => (col.id === columnId ? { ...col, ...updates } : col))
      return { ...tableDraft, columns }
    })
  }

  const removeTableColumn = (columnId: string) => {
    setDraftColumn((prev) => {
      if (!prev || prev.type !== 'table') return prev
      const tableDraft = prev as TableField
      const columns = (tableDraft.columns || []).filter((col) => col.id !== columnId)
      return { ...tableDraft, columns }
    })
  }

  const addSelectOption = () => {
    setDraftColumn((prev) => {
      if (!prev || (prev.type !== 'single_select' && prev.type !== 'multi_select')) return prev
      const currentOptions = prev.constraints?.options || []
      const newOption = `Option ${currentOptions.length + 1}`
      return {
        ...prev,
        constraints: {
          ...prev.constraints,
          options: [...currentOptions, newOption]
        }
      }
    })
  }

  const updateSelectOption = (index: number, newValue: string) => {
    setDraftColumn((prev) => {
      if (!prev || (prev.type !== 'single_select' && prev.type !== 'multi_select')) return prev
      const currentOptions = prev.constraints?.options || []
      const updatedOptions = [...currentOptions]
      updatedOptions[index] = newValue
      return {
        ...prev,
        constraints: {
          ...prev.constraints,
          options: updatedOptions
        }
      }
    })
  }

  const removeSelectOption = (index: number) => {
    setDraftColumn((prev) => {
      if (!prev || (prev.type !== 'single_select' && prev.type !== 'multi_select')) return prev
      const currentOptions = prev.constraints?.options || []
      const updatedOptions = currentOptions.filter((_, i) => i !== index)
      return {
        ...prev,
        constraints: {
          ...prev.constraints,
          options: updatedOptions
        }
      }
    })
  }

  const updateListItemType = (nextType: DataPrimitive) => {
    setDraftColumn((prev) => {
      if (!prev || prev.type !== 'list') return prev
      const listDraft = prev as ListField
      return {
        ...listDraft,
        item: {
          ...(listDraft.item ? cloneField(listDraft.item) : createLeafField('item')),
          type: nextType,
        },
      }
    })
  }

  // Column grouping functions
  const toggleColumnSelection = (columnId: string) => {
    setSelectedColumnIds((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(columnId)) {
        newSet.delete(columnId)
      } else {
        newSet.add(columnId)
      }
      return newSet
    })
  }

  const openGroupDialog = () => {
    if (selectedColumnIds.size < 2) return
    setGroupName('')
    setIsGroupDialogOpen(true)
  }

  const handleColumnRightClick = useCallback((columnId: string, event: React.MouseEvent) => {
    event.preventDefault()
    setContextMenuColumn(columnId)
    setContextMenuPosition({ x: event.clientX, y: event.clientY })
  }, [])

  const startGroupingFromContext = () => {
    if (!contextMenuColumn) return
    // Auto-select the right-clicked column
    setSelectedColumnIds(new Set([contextMenuColumn]))
    setGroupName('')
    setIsGroupDialogOpen(true)
    // Close context menu
    setContextMenuColumn(null)
    setContextMenuPosition(null)
  }

  const closeContextMenu = () => {
    setContextMenuColumn(null)
    setContextMenuPosition(null)
  }

  const createGroupedObject = () => {
    if (!groupName.trim() || selectedColumnIds.size < 2) return

    // Capture the selected IDs and group name before state updates
    const selectedIds = Array.from(selectedColumnIds)
    const newGroupName = groupName.trim()

    commitSchemaUpdate(activeSchemaId, (schema) => {
      const newGroup = createVisualGroup(newGroupName, selectedIds)
      return addVisualGroup(schema, newGroup)
    })

    // Reset selection and close dialog
    setSelectedColumnIds(new Set())
    setGroupName('')
    setIsGroupDialogOpen(false)
  }

  const renderStructuredConfig = () => {
    if (!draftColumn) return null
    if (draftColumn.type === 'object') {
      const objectDraft = draftColumn as ObjectField
      const children = objectDraft.children || []
      return (
        <div id="data-type-options" className="space-y-3 rounded-2xl border border-slate-200/70 bg-slate-50/70 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-slate-700">Object Fields</p>
              <p className="text-xs text-slate-500">Define the sub-fields that make up this object.</p>
            </div>
            <Button type="button" size="sm" variant="secondary" onClick={addObjectSubField}>
              <Plus className="mr-1 h-4 w-4" />
              Add Sub-Field
            </Button>
          </div>
          <div className="space-y-3">
            {children.length === 0 ? (
              <div className="rounded-xl bg-white px-4 py-3 text-sm text-slate-500 shadow-sm">
                No sub-fields yet. Add at least one field to describe this object.
              </div>
            ) : (
              children.filter(isExtractionField).map((child) => (
                <div key={child.id} className="flex flex-col gap-3 rounded-xl bg-white px-4 py-4 shadow-sm sm:flex-row sm:items-end">
                  <button
                    type="button"
                    onClick={() => updateObjectSubField(child.id, { displayInSummary: !child.displayInSummary })}
                    className={cn(
                      'order-last self-start rounded-md px-2 py-2 text-slate-300 hover:text-yellow-500 sm:order-none',
                      child.displayInSummary ? 'text-yellow-500' : 'text-slate-300',
                    )}
                    title="Set as display field for collapsed view"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  </button>
                  <div className="flex-1 space-y-1">
                    <Label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Field Name</Label>
                    <Input
                      value={child.name}
                      onChange={(event) => updateObjectSubField(child.id, { name: event.target.value })}
                      placeholder="e.g., Name"
                    />
                  </div>
                  <div className="w-full space-y-1 sm:w-48">
                    <Label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Type</Label>
                    <Select
                      value={child.type}
                      onValueChange={(value: DataPrimitive) => updateObjectSubField(child.id, { type: value })}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="string">Text</SelectItem>
                        <SelectItem value="number">Number</SelectItem>
                        <SelectItem value="decimal">Decimal</SelectItem>
                        <SelectItem value="date">Date</SelectItem>
                        <SelectItem value="boolean">Yes / No</SelectItem>
                        <SelectItem value="single_select">Single Select</SelectItem>
                        <SelectItem value="multi_select">Multi Select</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeObjectSubField(child.id)}
                    className="self-start text-slate-400 hover:text-slate-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </div>
      )
    }

    if (draftColumn.type === 'table') {
      const tableDraft = draftColumn as TableField
      const columns = tableDraft.columns || []
      return (
        <div id="data-type-options" className="space-y-3 rounded-2xl border border-slate-200/70 bg-slate-50/70 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-slate-700">Table Columns</p>
              <p className="text-xs text-slate-500">List the columns that each row in this table should include.</p>
            </div>
            <Button type="button" size="sm" variant="secondary" onClick={addTableColumn}>
              <Plus className="mr-1 h-4 w-4" />
              Add Column
            </Button>
          </div>
          <div className="space-y-3">
            {columns.length === 0 ? (
              <div className="rounded-xl bg-white px-4 py-3 text-sm text-slate-500 shadow-sm">
                No columns yet. Add the first column to describe your table structure.
              </div>
            ) : (
              columns.map((col, index) => (
                <div key={col.id} className="flex items-center gap-3 rounded-xl bg-white px-4 py-3 shadow-sm">
                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">{index + 1}</span>
                  <Input
                    value={col.name}
                    onChange={(event) => updateTableColumn(col.id, { name: event.target.value })}
                    placeholder="Column name"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeTableColumn(col.id)}
                    className="text-slate-400 hover:text-slate-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </div>
      )
    }

    if (draftColumn.type === 'single_select' || draftColumn.type === 'multi_select') {
      const options = draftColumn.constraints?.options || []
      return (
        <div id="data-type-options" className="space-y-3 rounded-2xl border border-slate-200/70 bg-slate-50/70 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-slate-700">Select Options</p>
              <p className="text-xs text-slate-500">Define the available choices for this field.</p>
            </div>
            <Button type="button" size="sm" variant="secondary" onClick={addSelectOption}>
              <Plus className="mr-1 h-4 w-4" />
              Add Option
            </Button>
          </div>
          <div className="space-y-2">
            {options.length === 0 ? (
              <div className="rounded-xl bg-white px-4 py-3 text-sm text-slate-500 shadow-sm">
                No options yet. Add at least one option to define the available choices.
              </div>
            ) : (
              options.map((option, index) => (
                <div key={index} className="flex items-center gap-2 rounded-xl bg-white px-3 py-2 shadow-sm">
                  <span
                    className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide"
                    style={{
                      backgroundColor: `hsl(${(index * 137.5) % 360}, 50%, 90%)`,
                      color: `hsl(${(index * 137.5) % 360}, 60%, 25%)`,
                    }}
                  >
                    {option}
                  </span>
                  <Input
                    value={option}
                    onChange={(e) => updateSelectOption(index, e.target.value)}
                    className="flex-1 border-0 shadow-none focus-visible:ring-0"
                    placeholder="Option name"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeSelectOption(index)}
                    className="h-6 w-6 text-slate-400 hover:text-slate-700"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </div>
      )
    }

    if (draftColumn.type === 'list') {
      const listDraft = draftColumn as ListField
      const itemType = listDraft.item?.type ?? 'string'
      return (
        <div id="data-type-options" className="space-y-3 rounded-2xl border border-slate-200/70 bg-slate-50/70 p-4">
          <div>
            <p className="text-sm font-semibold text-slate-700">List Item Type</p>
            <p className="text-xs text-slate-500">Choose the type of value each item in this list should store.</p>
          </div>
          <Select value={itemType} onValueChange={(value: DataPrimitive) => updateListItemType(value)}>
            <SelectTrigger className="w-full sm:w-64">
              <SelectValue placeholder="Select an item type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="string">Text</SelectItem>
              <SelectItem value="number">Number</SelectItem>
              <SelectItem value="decimal">Decimal</SelectItem>
              <SelectItem value="date">Date</SelectItem>
              <SelectItem value="single_select">Single Select</SelectItem>
              <SelectItem value="multi_select">Multi Select</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )
    }
    return null
  }

  const staticTemplates = useMemo(() => getStaticSchemaTemplates(session?.user?.email), [session?.user?.email])
  const combinedTemplates = useMemo(() => {
    const registry = new Map<string, SchemaTemplateDefinition>()
    for (const tpl of staticTemplates) {
      registry.set(tpl.id, tpl)
    }
    if (templateLibrary) {
      for (const tpl of templateLibrary) {
        registry.set(tpl.id, {
          ...tpl,
          fields: cloneSchemaFields(tpl.fields ?? []),
        })
      }
    }
    return Array.from(registry.values())
  }, [staticTemplates, templateLibrary])
  const templateMap = useMemo(() => {
    const map = new Map<string, SchemaTemplateDefinition>()
    for (const tpl of combinedTemplates) {
      map.set(tpl.id, tpl)
    }
    return map
  }, [combinedTemplates])

  const inferAgentTypeFromSchema = (schema: SchemaDefinition | null | undefined): AgentType => {
    const templateId = schema?.templateId?.toLowerCase() ?? ""
    if (templateId.includes("pharma")) return "pharma"
    return "standard"
  }

  const shouldAutoApplyTemplate = (templateId: string | null | undefined) => {
    if (!templateId) return false
    if (templateId.startsWith("custom-")) return false
    const candidate = templateMap.get(templateId)
    if (!candidate) return false
    if (candidate.isCustom) return false
    return (candidate.fields?.length ?? 0) > 0
  }

  // Helpers to update active schema's fields and jobs
  const syncSchema = useCallback(
    async (schema: SchemaDefinition, opts?: { includeJobs?: boolean }) => {
      if (!session?.user?.id) {
        openAuthDialog("sign-in")
        return
      }

      setSchemaSyncState((prev) => ({
        ...prev,
        [schema.id]: {
          status: 'saving',
          updatedAt: schema.updatedAt ?? prev[schema.id]?.updatedAt,
        },
      }))

      const userId = session.user.id
      const includeJobs = opts?.includeJobs ?? false

      try {
        const schemaRow = schemaDefinitionToRow(schema, userId)
        await supabase.from("schemas").upsert([schemaRow])

        if (includeJobs) {
          const jobRows = (schema.jobs ?? []).map((job) => extractionJobToRow(job, schema.id, userId))

          if (jobRows.length > 0) {
            await supabase.from("extraction_jobs").upsert(jobRows)
            const idList = jobRows.map((row) => `'${row.id}'`).join(",")
            const deleteQuery = supabase
              .from("extraction_jobs")
              .delete()
              .eq("schema_id", schema.id)
              .eq("user_id", userId)

            if (idList.length > 0) {
              deleteQuery.not("id", "in", `(${idList})`)
            }

            await deleteQuery
          } else {
            // Skip blanket delete when we have no local jobs to avoid wiping existing rows
            // (explicit job deletions are handled via updateSchemaJobs/syncJobRecords)
          }
        }

        setSchemaSyncState((prev) => ({
          ...prev,
          [schema.id]: {
            status: 'idle',
            updatedAt: new Date(),
          },
        }))
      } catch (error) {
        console.error('Failed to sync schema', error)
        setSchemaSyncState((prev) => ({
          ...prev,
          [schema.id]: {
            status: 'error',
            error: error instanceof Error ? error.message : 'Failed to save workspace.',
            updatedAt: prev[schema.id]?.updatedAt,
          },
        }))
      }
    },
    [openAuthDialog, session?.user?.id, supabase],
  )

  const deleteSchemaRecord = useCallback(
    async (schemaId: string) => {
      if (!session?.user?.id) return
      setSchemaSyncState((prev) => ({
        ...prev,
        [schemaId]: {
          status: 'saving',
          updatedAt: prev[schemaId]?.updatedAt,
        },
      }))
      try {
        await supabase.from("extraction_jobs").delete().eq("schema_id", schemaId).eq("user_id", session.user.id)
        await supabase.from("schemas").delete().eq("id", schemaId).eq("user_id", session.user.id)
        setSchemaSyncState((prev) => {
          const next = { ...prev }
          delete next[schemaId]
          return next
        })
      } catch (error) {
        console.error('Failed to delete schema', error)
        setSchemaSyncState((prev) => ({
          ...prev,
          [schemaId]: {
            status: 'error',
            error: error instanceof Error ? error.message : 'Failed to delete schema.',
            updatedAt: prev[schemaId]?.updatedAt,
          },
        }))
      }
    },
    [session?.user?.id, supabase],
  )

  type CommitSchemaOptions = {
    persistSchema?: boolean
    includeJobs?: boolean
  }

  const commitSchemaUpdate = useCallback(
    (
      schemaId: string,
      updater: (schema: SchemaDefinition) => SchemaDefinition,
      options?: CommitSchemaOptions,
    ) => {
      const updated = applySchemaUpdate(schemaId, updater)
      const shouldPersist = options?.persistSchema ?? true
      const includeJobs = options?.includeJobs ?? false
      if (updated && session?.user?.id && shouldPersist) {
        void syncSchema(updated, { includeJobs })
      }
      return updated
    },
    [applySchemaUpdate, session?.user?.id, syncSchema],
  )

  const applySchemaTemplate = useCallback(
    (templateId: string) => {
      const tpl = templateMap.get(templateId)
      if (!tpl) return
      const templateFields = cloneSchemaFields(tpl.fields ?? [])
      if (isSchemaFresh(activeSchema)) {
        commitSchemaUpdate(activeSchemaId, (schema) => ({
          ...schema,
          name: tpl.name,
          fields: templateFields,
          templateId,
        }))
        setSchemaNameInput(tpl.name)
      } else {
        const newSchema: SchemaDefinition = {
          id: generateUuid(),
          name: tpl.name,
          fields: templateFields,
          jobs: [],
          templateId,
          createdAt: new Date(),
          updatedAt: new Date(),
        }
        setSchemas((prev) => [...prev, newSchema])
        setActiveSchemaId(newSchema.id)
        setSchemaNameInput(newSchema.name)
        if (session?.user?.id) {
          setSchemaSyncState((prev) => ({
            ...prev,
            [newSchema.id]: { status: 'saving', updatedAt: newSchema.updatedAt },
          }))
          void syncSchema(newSchema)
        }
      }
    },
    [
      templateMap,
      activeSchema,
      activeSchemaId,
      commitSchemaUpdate,
      isSchemaFresh,
      session?.user?.id,
      setActiveSchemaId,
      setSchemaNameInput,
      setSchemaSyncState,
      setSchemas,
      syncSchema,
    ],
  )

  const handleTemplateSave = useCallback(async () => {
    if (!onCreateTemplate) return
    if (fields.length === 0) {
      toast({
        title: "Add fields before saving",
        description: "Create at least one field so the template has structure to save.",
        variant: "destructive",
      })
      return
    }
    const trimmedName = (templateNameInput || activeSchema.name || "New template").trim()
    setTemplateNameInput(trimmedName)
    const trimmedDescription = templateDescriptionInput.trim()
    setIsSavingTemplate(true)
    try {
      const result = await onCreateTemplate(activeSchema, {
        name: trimmedName,
        description: trimmedDescription.length > 0 ? trimmedDescription : undefined,
        agent: selectedAgent,
      })
      if (result.success) {
        setIsTemplateDialogOpen(false)
        setTemplateDescriptionInput("")
        commitSchemaUpdate(activeSchema.id, (schema) => ({
          ...schema,
          templateId: result.template.id,
        }))
        toast({
          title: "Template created",
          description: "You'll find it in the New schema template picker.",
        })
      } else {
        toast({
          title: "Unable to save template",
          description: result.error,
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Unable to save template",
        description: error instanceof Error ? error.message : "An unexpected error occurred.",
        variant: "destructive",
      })
    } finally {
      setIsSavingTemplate(false)
    }
  }, [
    onCreateTemplate,
    fields.length,
    templateNameInput,
    activeSchema,
    activeSchemaId,
    templateDescriptionInput,
    selectedAgent,
    commitSchemaUpdate,
    toast,
  ])

  const activeSchemaTemplateId = activeSchema.templateId ?? null
  const activeSchemaIsFresh = isSchemaFresh(activeSchema)
  useEffect(() => {
    if (!isEmbeddedInWorkspace) return
    if (!shouldAutoApplyTemplate(activeSchemaTemplateId)) return
    if (!activeSchemaIsFresh) return
    if (autoAppliedTemplatesRef.current.has(activeSchemaId)) return
    autoAppliedTemplatesRef.current.add(activeSchemaId)
    applySchemaTemplate(activeSchemaTemplateId)
  }, [isEmbedded, activeSchemaTemplateId, activeSchemaIsFresh, activeSchemaId, applySchemaTemplate])

  useEffect(() => {
    if (!pendingSchemaCreate) return
    const exists = schemas.some((schema) => schema.id === pendingSchemaCreate.id)
    if (exists) {
      if (onPendingCreateConsumed) onPendingCreateConsumed()
      setActiveSchemaId(pendingSchemaCreate.id)
      return
    }

    const templateId = pendingSchemaCreate.templateId ?? null
    let fields: SchemaField[] = []
    let shouldAutoApplyTemplate = false
    if (templateId) {
      const templateDef = templateMap.get(templateId)
      if (templateDef) {
        if (templateDef.isCustom) {
          fields = cloneSchemaFields(templateDef.fields ?? [])
        } else {
          shouldAutoApplyTemplate = true
        }
      }
    }

    const newSchema: SchemaDefinition = {
      id: pendingSchemaCreate.id,
      name: pendingSchemaCreate.name,
      fields,
      jobs: [],
      templateId: templateId ?? undefined,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    setSchemas((prev) => [...prev, newSchema])
    setActiveSchemaId(newSchema.id)
    setSchemaNameInput(newSchema.name)
    setSelectedAgent(pendingSchemaCreate.agent)
    autoAppliedTemplatesRef.current.add(newSchema.id)
    if (session?.user?.id && !shouldAutoApplyTemplate) {
      setSchemaSyncState((prev) => ({
        ...prev,
        [newSchema.id]: {
          status: 'saving',
          updatedAt: newSchema.updatedAt,
        },
      }))
      void syncSchema(newSchema)
    }
    if (shouldAutoApplyTemplate) {
      setTimeout(() => {
        applySchemaTemplate(templateId ?? "")
      }, 0)
    }
    if (onPendingCreateConsumed) onPendingCreateConsumed()
  }, [
    pendingSchemaCreate,
    schemas,
    templateMap,
    setSchemas,
    setActiveSchemaId,
    setSchemaNameInput,
    session?.user?.id,
    setSchemaSyncState,
    syncSchema,
    applySchemaTemplate,
    onPendingCreateConsumed,
  ])

  const setFields = (
    updater: SchemaField[] | ((prev: SchemaField[]) => SchemaField[]),
  ) => {
    const updated = commitSchemaUpdate(activeSchemaId, (schema) => ({
      ...schema,
      fields: typeof updater === "function" ? (updater as (prev: SchemaField[]) => SchemaField[])(schema.fields) : updater,
    }))
    return updated?.fields ?? null
  }

  const syncJobRecords = useCallback(
    async (schemaId: string, payload: { upsert?: ExtractionJob[]; deleted?: string[] }) => {
      if (!session?.user?.id) {
        console.warn('[bytebeam] syncJobRecords: No user session, skipping sync')
        return
      }
      const userId = session.user.id
      const operations: Promise<unknown>[] = []

      if (payload.upsert && payload.upsert.length > 0) {
        console.log(`[bytebeam] syncJobRecords: Upserting ${payload.upsert.length} jobs to schema ${schemaId}`)
        payload.upsert.forEach((job) => {
          console.log(`[bytebeam] - Job ${job.id}: status=${job.status}, fileName=${job.fileName}, hasResults=${!!job.results}`)
        })
        const rows = payload.upsert.map((job) => extractionJobToRow(job, schemaId, userId))
        operations.push(supabase.from("extraction_jobs").upsert(rows))
      }

      if (payload.deleted && payload.deleted.length > 0) {
        console.log(`[bytebeam] syncJobRecords: Deleting ${payload.deleted.length} jobs from schema ${schemaId}`)
        operations.push(
          supabase
            .from("extraction_jobs")
            .delete()
            .eq("schema_id", schemaId)
            .eq("user_id", userId)
            .in("id", payload.deleted),
        )
      }

      if (operations.length === 0) {
        console.log('[bytebeam] syncJobRecords: No operations to perform')
        return
      }

      try {
        await Promise.all(operations)
        console.log(`[bytebeam] syncJobRecords: Successfully synced jobs to schema ${schemaId}`)
      } catch (error) {
        console.error('[bytebeam] Failed to sync jobs:', error)
      }
    },
    [session?.user?.id, supabase],
  )

  const updateSchemaJobs = useCallback(
    (
      schemaId: string,
      updater: ExtractionJob[] | ((prev: ExtractionJob[]) => ExtractionJob[]),
      options?: { persistSchema?: boolean; syncJobs?: boolean },
    ) => {
      const previousSchema = schemas.find((schema) => schema.id === schemaId)
      const previousJobs = previousSchema?.jobs ?? []
      let nextJobs = previousJobs

      const updated = commitSchemaUpdate(
        schemaId,
        (schema) => {
          const currentJobs = schema.jobs ?? []
          nextJobs =
            typeof updater === "function"
              ? (updater as (prev: ExtractionJob[]) => ExtractionJob[])(currentJobs)
              : Array.isArray(updater)
                ? updater
                : currentJobs
          return {
            ...schema,
            jobs: nextJobs,
          }
        },
        { persistSchema: options?.persistSchema ?? false },
      )

      if (updated && session?.user?.id && options?.syncJobs !== false) {
        const { upsert, deleted } = diffJobLists(previousJobs, nextJobs)
        if (upsert.length > 0 || deleted.length > 0) {
          void syncJobRecords(schemaId, { upsert, deleted })
        }
      }

      return updated?.jobs ?? null
    },
    [commitSchemaUpdate, schemas, session?.user?.id, syncJobRecords],
  )

  const setJobs = (
    updater: ExtractionJob[] | ((prev: ExtractionJob[]) => ExtractionJob[]),
    schemaId: string = activeSchemaId,
    options?: { persistSchema?: boolean; syncJobs?: boolean },
  ) => updateSchemaJobs(schemaId, updater, options)

  const updateReviewStatus = useCallback(
    (
      jobId: string,
      columnId: string,
      status: "verified" | "needs_review",
      payload?: { reason?: string | null },
    ) => {
      const nowIso = new Date().toISOString()
      updateSchemaJobs(
        activeSchemaId,
        (prev) =>
          prev.map((job) => {
            if (job.id !== jobId) return job
            const previousMeta = job.review?.[columnId]
            const originalValue =
              status === "verified"
                ? job.results?.[columnId]
                : previousMeta?.originalValue ?? job.results?.[columnId]
            const previousConfidence = previousMeta?.confidence ?? null
            let nextConfidence: number | null
            if (status === "verified") {
              nextConfidence = 1
            } else if (previousConfidence !== null) {
              nextConfidence = previousConfidence
            } else {
              nextConfidence = status === "needs_review" ? 0 : null
            }
            const nextMeta: FieldReviewMeta = {
              status,
              updatedAt: nowIso,
              reason:
                payload?.reason ??
                (status === "verified"
                  ? "Verified by user"
                  : previousMeta?.reason ?? "Requires review"),
              confidence: nextConfidence,
              verifiedAt: status === "verified" ? nowIso : null,
              verifiedBy: status === "verified" ? session?.user?.id ?? null : null,
              originalValue,
            }
            return {
              ...job,
              review: {
                ...(job.review ?? {}),
                [columnId]: nextMeta,
              },
            }
          }),
        { syncJobs: true },
      )
    },
    [activeSchemaId, session?.user?.id, updateSchemaJobs],
  )

  const handleRowDoubleClick = useCallback(
    (job: ExtractionJob) => {
      if (!job) return
      setSelectedJob(job)
      setIsDetailOpen(true)
    },
    [],
  )

  const addSchema = useCallback((options?: { name?: string; templateId?: string | null; agent?: AgentType }) => {
    const nextIndex = schemas.length + 1
    const schemaName = options?.name?.trim() || `Schema ${nextIndex}`
    const templateId = options?.templateId || null

    // Get template fields if templateId is provided
    let fields: SchemaField[] = []
    if (templateId && templateMap.has(templateId)) {
      const template = templateMap.get(templateId)!
      fields = cloneSchemaFields(template.fields ?? [])
    }

    const newSchema: SchemaDefinition = {
      id: generateUuid(),
      name: schemaName,
      fields,
      jobs: [],
      templateId,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    setSchemas((prev) => [...prev, newSchema])
    setActiveSchemaId(newSchema.id)
    setSchemaNameInput(newSchema.name)
    setSelectedColumn(null)
    setIsColumnDialogOpen(false)
    setShowGallery(false)
    if (session?.user?.id) {
      setSchemaSyncState((prev) => ({
        ...prev,
        [newSchema.id]: { status: 'saving', updatedAt: newSchema.updatedAt },
      }))
      void syncSchema(newSchema)
    }
  }, [schemas.length, session?.user?.id, templateMap])

  const removeSchema = (id: string) => {
    const fallback = createInitialSchemaDefinition()
    setSchemas((prev) => {
      const filtered = prev.filter((s) => s.id !== id)
      if (filtered.length === 0) {
        setActiveSchemaId(fallback.id)
        setSchemaNameInput(fallback.name)
        return [fallback]
      }
      if (id === activeSchemaId) {
        const nextActive = filtered[filtered.length - 1]
        setActiveSchemaId(nextActive.id)
        setSchemaNameInput(nextActive.name)
      }
      return filtered
    })
    if (session?.user?.id) {
      void deleteSchemaRecord(id)
      if (schemas.length === 1) {
        setSchemaSyncState((prev) => ({ ...prev, [fallback.id]: { status: 'saving', updatedAt: fallback.updatedAt } }))
        void syncSchema(fallback)
      }
    }
    setSelectedColumn(null)
    setIsColumnDialogOpen(false)
  }

  const closeSchema = (id: string) => {
    const target = schemas.find((s) => s.id === id)
    if (!target) return
    const hasData =
      (target.fields?.length ?? 0) > 0 ||
      (target.jobs?.length ?? 0) > 0
    if (hasData) {
      setSchemaDeletionDialog(target)
      return
    }
    removeSchema(id)
  }

  const handleConfirmSchemaDeletion = () => {
    if (!schemaDeletionDialog) return
    const id = schemaDeletionDialog.id
    setSchemaDeletionDialog(null)
    removeSchema(id)
  }

  const handleCancelSchemaDeletion = () => {
    setSchemaDeletionDialog(null)
  }

  const activeSchemaSync = schemaSyncState[activeSchemaId]
  const activeSchemaStatus: 'idle' | 'saving' | 'error' = activeSchemaSync?.status ?? 'idle'
  const activeSchemaError = activeSchemaSync?.status === 'error' ? activeSchemaSync.error : null
  const activeSchemaUpdatedAt = activeSchemaSync?.updatedAt

  const retryActiveSchema = useCallback(() => {
    if (!session?.user?.id) return
    const schema = schemas.find((s) => s.id === activeSchemaId)
    if (schema) {
      void syncSchema(schema)
    }
  }, [activeSchemaId, schemas, session?.user?.id, syncSchema])

  const handleSaveSchema = useCallback(() => {
    const schema = schemas.find((s) => s.id === activeSchemaId)
    if (!schema) return
    if (!session?.user?.id) {
      openAuthDialog("sign-in")
      return
    }
    void syncSchema(schema, { includeJobs: true })
  }, [activeSchemaId, schemas, session?.user?.id, syncSchema, openAuthDialog])

  const addColumn = () => {
    const newColumn: SchemaField = {
      id: `col_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: `Column ${displayColumns.length + 1}`,
      type: "string",
      description: "",
      extractionInstructions: "",
      required: false,
    }
    setColumnDialogMode('create')
    setDraftColumn(JSON.parse(JSON.stringify(newColumn)))
    setSelectedColumn(null)
    setIsColumnDialogOpen(true)
  }

  const handleDraftFieldTypeChange = (mode: 'extraction' | 'transformation' | 'input') => {
    setDraftColumn((prev) => {
      if (!prev) return prev

      if (mode === 'input') {
        // Switch to input field mode
        return {
          id: prev.id,
          name: prev.name || 'Document Input',
          type: 'input',
          inputType: 'document',
          description: prev.description || '',
          required: prev.required ?? false,
        } as InputField
      }

      if (mode === 'transformation') {
        // Switch to transformation mode
        const base = prev.type === 'input' ? {
          id: prev.id,
          name: prev.name,
          type: 'string' as const,
          description: prev.description,
          required: prev.required,
        } : prev
        return {
          ...base,
          isTransformation: true,
          transformationType: (prev as any).transformationType || "calculation",
        } as SchemaField
      }

      // Switch to extraction mode
      if (prev.type === 'input') {
        // Coming from input field
        return {
          id: prev.id,
          name: prev.name,
          type: 'string' as const,
          description: prev.description,
          extractionInstructions: '',
          required: prev.required ?? false,
          isTransformation: false,
        } as SchemaField
      }

      const {
        transformationType,
        transformationConfig,
        transformationSource,
        transformationSourceColumnId,
        ...rest
      } = prev as any
      return {
        ...rest,
        isTransformation: false,
      } as SchemaField
    })
  }

  const updateColumn = (columnId: string, updates: Partial<SchemaField>) => {
    setFields((prev) => updateFieldById(prev, columnId, (f) => {
      // Normalize shape when changing type between leaf/compound kinds
      const next = { ...f, ...updates } as SchemaField
      if (updates.type && updates.type !== f.type) {
        if (updates.type === 'object') {
          ; (next as any).children = Array.isArray((next as any).children) ? (next as any).children : []
          delete (next as any).item
          delete (next as any).columns
        } else if (updates.type === 'list') {
          if (!(next as any).item) {
            ; (next as any).item = {
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
          ; (next as any).columns = Array.isArray((next as any).columns) ? (next as any).columns : []
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
    commitSchemaUpdate(activeSchemaId, (schema) => {
      const newFields = removeFieldById(schema.fields, columnId)
      const updatedGroups = (schema.visualGroups || [])
        .map(group => ({
          ...group,
          fieldIds: group.fieldIds.filter(id => id !== columnId)
        }))
        .filter(group => group.fieldIds.length > 0)
      return {
        ...schema,
        fields: newFields,
        visualGroups: updatedGroups,
      }
    })

    if (selectedColumn?.id === columnId) {
      setSelectedColumn(null)
      setIsColumnDialogOpen(false)
    }
  }

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
    options?: {
      inputDocuments?: MultiDocUploadMap
      fieldInputDocMap?: Record<string, string[]>
    },
  ) => {
    const files = event.target.files
    const isMultiInputUpload = options?.inputDocuments && Object.keys(options.inputDocuments).length > 0
    if (!files && !isMultiInputUpload) return

    if (fields.length === 0 && activeSchema.templateId !== 'fnb-label-compliance' && selectedAgent !== 'pharma') {
      alert("Please define at least one column before uploading files.")
      return
    }

    const getUploadFileForDoc = (doc: MultiDocInput): File | null => {
      if (doc.file) return doc.file
      if (typeof doc.text === 'string' && doc.text.trim().length > 0) {
        const baseName = doc.inputField.name || doc.inputField.id || 'input'
        return new File([doc.text], `${baseName}.txt`, { type: 'text/plain' })
      }
      return null
    }

    const primaryDoc = isMultiInputUpload ? Object.values(options!.inputDocuments!)[0] : null
    const primaryUpload = isMultiInputUpload && primaryDoc ? getUploadFileForDoc(primaryDoc) : null

    const fileArray = isMultiInputUpload
      ? primaryUpload
        ? [primaryUpload]
        : []
      : Array.from(files ?? [])

    if (isMultiInputUpload && fileArray.length === 0) {
      alert("Please provide at least one file or text input.")
      return
    }
    if (fileArray.length === 0) return

    // Ensure we're using the correct schema - prioritize externalActiveSchemaId and pendingSchemaCreate
    // This handles cases where:
    // 1. Schema was just created but not yet in schemas array (pendingSchemaCreate)
    // 2. Schema is opened from tab but not yet loaded (externalActiveSchemaId)
    let targetSchemaId = activeSchemaId
    let targetSchema = activeSchema
    
    // Priority 1: externalActiveSchemaId (when opening from tab)
    if (externalActiveSchemaId) {
      console.log(`[bytebeam] Upload: externalActiveSchemaId=${externalActiveSchemaId}, activeSchemaId=${activeSchemaId}`)
      if (externalActiveSchemaId !== activeSchemaId) {
        console.log(`[bytebeam] Upload: Switching to external schema ${externalActiveSchemaId}`)
        setActiveSchemaId(externalActiveSchemaId)
      }
      targetSchemaId = externalActiveSchemaId
      const externalSchema = schemas.find((s) => s.id === externalActiveSchemaId)
      if (externalSchema) {
        targetSchema = externalSchema
        console.log(`[bytebeam] Upload: Found external schema in array: ${externalSchema.name}`)
      } else {
        // Schema not loaded yet - try to find it in the database or use a placeholder
        // For now, create minimal schema - fields will be loaded from the actual schema during extraction
        // The important thing is that the job is saved to the correct schema_id
        targetSchema = {
          id: externalActiveSchemaId,
          name: "Loading...",
          fields: [],
          jobs: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        }
        console.warn(`[bytebeam] Upload: Schema ${externalActiveSchemaId} not in schemas array yet - job will be saved but fields may be empty`)
      }
    }
    
    // Priority 2: pendingSchemaCreate (when schema was just created)
    if (pendingSchemaCreate && pendingSchemaCreate.id !== targetSchemaId) {
      console.log(`[bytebeam] Upload: Using pending schema ${pendingSchemaCreate.id} instead of ${targetSchemaId}`)
      if (pendingSchemaCreate.id !== activeSchemaId) {
        setActiveSchemaId(pendingSchemaCreate.id)
      }
      targetSchemaId = pendingSchemaCreate.id
      
      // Try to find the schema in the array, or create one with fields from template
      const pendingSchemaExists = schemas.find((s) => s.id === pendingSchemaCreate.id)
      if (pendingSchemaExists) {
        targetSchema = pendingSchemaExists
      } else {
        // Schema not in array yet - load fields from template if available
        let fieldsFromTemplate: SchemaField[] = []
        if (pendingSchemaCreate.templateId) {
          const templateDef = templateMap.get(pendingSchemaCreate.templateId)
          if (templateDef?.fields) {
            fieldsFromTemplate = cloneSchemaFields(templateDef.fields)
            console.log(`[bytebeam] Upload: Loaded ${fieldsFromTemplate.length} fields from template ${pendingSchemaCreate.templateId}`)
          }
        }
        
        targetSchema = {
          id: pendingSchemaCreate.id,
          name: pendingSchemaCreate.name,
          fields: fieldsFromTemplate,
          jobs: [],
          templateId: pendingSchemaCreate.templateId ?? undefined,
          createdAt: new Date(),
          updatedAt: new Date(),
        }
        console.log(`[bytebeam] Upload: Pending schema ${pendingSchemaCreate.id} not in schemas array yet, using template fields`)
      }
    }
    
    const agentSnapshot = selectedAgent
    const templateIdSnapshot = targetSchema.templateId
    const fieldsSnapshot = targetSchema.fields
    const displayColumnsSnapshot = flattenFields(fieldsSnapshot)

    // Check if schema has input fields defined
    const inputFieldsInSchema = getInputFields(fieldsSnapshot)
    const hasInputFields = inputFieldsInSchema.length > 0

    const now = new Date()
    const buildInputDocumentMeta = (docs?: MultiDocUploadMap) => {
      if (!docs) return undefined
      return Object.fromEntries(
        Object.entries(docs).map(([fieldId, doc]) => {
          const uploadFile = getUploadFileForDoc(doc)
          const fileName = uploadFile?.name ?? doc.inputField.name ?? fieldId
          const mimeType = uploadFile?.type ?? (doc.text ? 'text/plain' : undefined)

          return [
            fieldId,
            {
              fieldId,
              fileName,
              fileUrl: uploadFile ? URL.createObjectURL(uploadFile) : "",
              uploadedAt: now,
              textValue: doc.text ?? null,
              mimeType: mimeType ?? null,
              inputType: doc.inputField.inputType ?? 'document',
            },
          ]
        }),
      )
    }

    const jobsToCreate: ExtractionJob[] = isMultiInputUpload
      ? [
        {
          id: generateUuid(),
          fileName:
            primaryUpload?.name ||
            Object.values(options!.inputDocuments!)[0]?.inputField?.name ||
            "Multi-document job",
          status: "pending" as ExtractionJob["status"],
          createdAt: now,
          agentType: agentSnapshot,
          review: {},
          ocrMarkdown: null,
          ocrAnnotatedImageUrl: null,
          originalFileUrl: null,
          inputDocuments: buildInputDocumentMeta(options?.inputDocuments),
        },
      ]
      : fileArray.map((file) => ({
        id: generateUuid(),
        fileName: file.name,
        status: "pending" as ExtractionJob["status"],
        createdAt: now,
        agentType: agentSnapshot,
        review: {},
        ocrMarkdown: null,
        ocrAnnotatedImageUrl: null,
        originalFileUrl: null,
        // Initialize inputDocuments if schema has input fields
        // For backward compat: if no input fields, originalFileUrl will be used
        inputDocuments: hasInputFields ? {} : undefined,
      }))

    if (jobsToCreate.length > 0) {
      updateSchemaJobs(targetSchemaId, (prev) => [...prev, ...jobsToCreate])
      setSelectedRowId(jobsToCreate[jobsToCreate.length - 1].id)
    }

    const processEntry = async (
      file: File,
      job: ExtractionJob | undefined,
      opts?: {
        inputDocuments?: MultiDocUploadMap
        fieldInputDocMap?: Record<string, string[]>
      },
    ) => {
      if (!job) return

      const jobMeta: {
        jobId: string
        schemaId: string
        fileName: string
        agentType?: string | null
        userId?: string
      } = {
        jobId: job.id,
        schemaId: targetSchemaId,
        fileName: job.fileName,
        agentType: agentSnapshot,
      }
      if (session?.user?.id) {
        jobMeta.userId = session.user.id
      }
      
      console.log(`[bytebeam] Processing job ${job.id} for schema ${targetSchemaId} (file: ${job.fileName})`)

      const updateJobsForSchema = (
        updater: ExtractionJob[] | ((prev: ExtractionJob[]) => ExtractionJob[])
      ) => {
        console.log(`[bytebeam] updateJobsForSchema called for schema ${targetSchemaId}`)
        return updateSchemaJobs(targetSchemaId, updater)
      }

      try {
        updateJobsForSchema((prev) =>
          prev.map((existing) =>
            existing.id === job.id ? { ...existing, status: "processing" } : existing,
          ),
        )

        // Filter out input fields and transformations from schema tree for extraction
        const filterForExtraction = (fs: SchemaField[]): SchemaField[] =>
          fs
            .filter((f) => isExtractionField(f) && !f.isTransformation)
            .map((f) => {
              if (f.type === "object") return { ...f, children: filterForExtraction(f.children) }
              if (f.type === "list") return { ...f }
              if (f.type === "table") return { ...f, columns: filterForExtraction(f.columns) }
              return f
            })
        const schemaTree = filterForExtraction(fieldsSnapshot)

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

        const toBase64 = (blob: Blob) =>
          new Promise<string>((resolve, reject) => {
            try {
              const reader = new FileReader()
              reader.onload = () => {
                const result = reader.result as string
                const commaIndex = result.indexOf(",")
                resolve(commaIndex >= 0 ? result.slice(commaIndex + 1) : result)
              }
              reader.onerror = () => reject(reader.error)
              reader.readAsDataURL(blob)
            } catch (e) {
              reject(e)
            }
          })

        const compressed = await maybeDownscaleImage(file, compressionOptions)
        const uploadBlob = compressed.blob
        const uploadType = compressed.type || file.type || 'application/octet-stream'
        const uploadName = compressed.name || file.name
        jobMeta.fileName = uploadName
        if (uploadName !== job.fileName) {
          updateJobsForSchema((prev) =>
            prev.map((existing) =>
              existing.id === job.id ? { ...existing, fileName: uploadName } : existing,
            ),
          )
        }
        const imageSizeExceededMessage =
          'File is still larger than 3 MB after compression. Please resize or crop the image and try again.'
        const maxImageBytes = compressionOptions.targetBytes ?? 3_000_000

        if (uploadType.startsWith('image/') && uploadBlob.size > maxImageBytes) {
          throw new Error(imageSizeExceededMessage)
        }

        const base64Data = await toBase64(uploadBlob)

        const fileData = {
          name: uploadName,
          type: uploadType,
          size: uploadBlob.size,
          data: base64Data,
        }

        let inputDocumentsPayload: Record<string, { name: string; type: string; data: string; text?: string; inputType?: InputField["inputType"] }> | undefined
        if (opts?.inputDocuments && Object.keys(opts.inputDocuments).length > 0) {
          inputDocumentsPayload = {}
          for (const [fieldId, doc] of Object.entries(opts.inputDocuments)) {
            const uploadFile = getUploadFileForDoc(doc)
            if (!uploadFile) continue

            const compressedDoc = await maybeDownscaleImage(uploadFile, compressionOptions)
            const docBase64 = await toBase64(compressedDoc.blob)
            inputDocumentsPayload[fieldId] = {
              name: compressedDoc.name || uploadFile.name,
              type: compressedDoc.type || uploadFile.type || 'application/octet-stream',
              data: docBase64,
              text: doc.text,
              inputType: doc.inputField.inputType || 'document',
            }
          }
        }

        if (agentSnapshot === 'pharma') {
          try {
            const pharmaPayload: any = {
              imageBase64: uploadType.startsWith('image/') ? base64Data : undefined,
              fileName: uploadName,
              job: jobMeta,
            }

            if (!uploadType.startsWith('image/')) {
              if (uploadType.includes('text') || uploadType.includes('csv')) {
                const textBytes = atob(base64Data)
                pharmaPayload.extractedText = textBytes
              } else {
                pharmaPayload.fileData = fileData
              }
            }

            const pharmaResponse = await fetch('/api/pharma/extract', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(pharmaPayload),
            })

            if (pharmaResponse.status === 413) {
              throw new Error('The uploaded file exceeds the 3 MB limit. Please compress or resize the file and retry.')
            }

            if (!pharmaResponse.ok) {
              const errText = await pharmaResponse.text().catch(() => `${pharmaResponse.status} ${pharmaResponse.statusText}`)
              throw new Error(`Pharma extraction failed: ${pharmaResponse.status} ${pharmaResponse.statusText} - ${errText}`)
            }

            const pharmaResult = await pharmaResponse.json()

            if (!pharmaResult?.success) {
              throw new Error(pharmaResult?.error || 'Pharma extraction failed')
            }

            const finalResults: Record<string, any> = {
              pharma_data: pharmaResult,
            }
            const reviewMeta = computeInitialReviewMeta(finalResults)
            const completedAt = new Date()

            console.log(`[bytebeam] Pharma extraction completed for job ${job.id}, saving to schema ${targetSchemaId}`)
            
            updateJobsForSchema((prev) =>
              prev.map((existing) =>
                existing.id === job.id
                  ? {
                    ...existing,
                    status: 'completed',
                    results: finalResults,
                    completedAt,
                    review: reviewMeta,
                  }
                  : existing,
              ),
            )
          } catch (e) {
            console.error('Pharma flow error:', e)
            updateJobsForSchema((prev) =>
              prev.map((existing) =>
                existing.id === job.id
                  ? { ...existing, status: 'error', completedAt: new Date() }
                  : existing,
              ),
            )
          }
          return
        }

        if (templateIdSnapshot === 'fnb-label-compliance') {
          try {
            const r1 = await fetch('/api/fnb/extract', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ file: fileData, job: jobMeta }),
            })
            if (r1.status === 413) {
              throw new Error('The uploaded file exceeds the 3 MB limit for F&B extraction. Please compress or resize the image and retry.')
            }
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
              body: JSON.stringify({ source, extraction, job: jobMeta }),
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
            const reviewMeta = computeInitialReviewMeta(finalResults)
            const completedAt = new Date()

            updateJobsForSchema((prev) =>
              prev.map((existing) =>
                existing.id === job.id
                  ? {
                    ...existing,
                    status: 'completed',
                    results: finalResults,
                    completedAt,
                    review: reviewMeta,
                  }
                  : existing,
              ),
            )
          } catch (e) {
            console.error('FNB flow error:', e)
            updateJobsForSchema((prev) =>
              prev.map((existing) =>
                existing.id === job.id
                  ? { ...existing, status: 'error', completedAt: new Date() }
                  : existing,
              ),
            )
          }
          return
        }

        const response = await fetch("/api/extract", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            file: fileData,
            schemaTree,
            extractionPromptOverride: undefined,
            job: jobMeta,
            inputDocuments: inputDocumentsPayload,
            fieldInputDocMap: opts?.fieldInputDocMap,
          }),
        })

        const responseBody = await response.text()
        if (!response.ok) {
          throw new Error(
            `Extraction failed (${response.status} ${response.statusText}): ${responseBody.slice(0, 500)}`,
          )
        }

        let result: any
        try {
          result = responseBody ? JSON.parse(responseBody) : {}
        } catch (parseError) {
          throw new Error(
            `Failed to parse extraction response: ${(parseError as Error).message}`,
          )
        }

        if (result.success) {
          const rawResults =
            (result.data && typeof result.data === 'object' && 'results' in result.data
              ? result.data.results
              : undefined) ??
            result.results ??
            {}
          const { values: rawValues, meta: rawMeta } = extractResultsMeta(rawResults)
          const sanitized = schemaTree?.length
            ? sanitizeResultsFromTree(schemaTree, rawValues ?? {})
            : sanitizeResultsFromFlat((result.schema ?? result.data?.schema) ?? {}, rawValues ?? {})
          const flattened = flattenResultsById(displayColumnsSnapshot, sanitized ?? {})
          const finalResults: Record<string, any> = { ...flattened }
          const graph = buildDependencyGraph(displayColumnsSnapshot, false)
          const waves = topologicalSort(graph)
          const fieldStatus = new Map<string, { status: 'pending' | 'success' | 'error' | 'blocked'; error?: string }>()
          const baseStatus = validateDependencies(graph)
          baseStatus.unresolvable.forEach((id) => fieldStatus.set(id, { status: 'blocked', error: 'Missing dependency' }))
          const pendingTransformations = displayColumnsSnapshot
            .filter((col) => isExtractionField(col) && col.isTransformation && !fieldStatus.has(col.id))
            .map((col) => col.id)
          pendingTransformations.forEach((id) => fieldStatus.set(id, { status: 'pending' }))

          displayColumnsSnapshot.forEach((col) => {
            if (fieldStatus.has(col.id)) return
            fieldStatus.set(col.id, { status: 'success' })
          })

          const resolvedSummaryValues = new Map<string, Record<string, any>>()

          const summaryFields = displayColumnsSnapshot.filter((col) => isExtractionField(col) && col.displayInSummary)
          const summaryPrimitives = summaryFields.filter((col) => col.type !== 'object')
          const summaryComposite = summaryFields.filter((col) => col.type === 'object')

          if (summaryPrimitives.length > 0) {
            const summaryObject = Object.fromEntries(
              summaryPrimitives.map((col) => [col.id, finalResults[col.id]]),
            )
            resolvedSummaryValues.set('leaf_summary', summaryObject)
          }

          summaryComposite.forEach((col) => {
            const objectValue = finalResults[col.id]
            if (!objectValue || typeof objectValue !== 'object') return
            resolvedSummaryValues.set(col.id, objectValue as Record<string, any>)
          })

          const dependencyWarnings: string[] = []

          displayColumnsSnapshot.forEach((col) => {
            if (!isExtractionField(col) || !col.displayInSummary) return
            const dependents = getFieldDependents(graph, col.id)
            dependents.forEach((depId) => {
              const depField = displayColumnsSnapshot.find((f) => f.id === depId)
              if (depField && isExtractionField(depField) && depField.displayInSummary) {
                dependencyWarnings.push(
                  `Field "${depField.name}" depends on "${col.name}" while both are part of the summary. This may cause circular references.`,
                )
              }
            })
          })

          if (dependencyWarnings.length > 0) {
            finalResults['__summary_warnings__'] = dependencyWarnings
          }

          if (resolvedSummaryValues.size > 0) {
            finalResults['__summary_values__'] = Object.fromEntries(resolvedSummaryValues)
          }

          const ensurePath = (obj: Record<string, any>, path: string[]): Record<string, any> => {
            let current = obj
            for (const key of path) {
              if (!current[key] || typeof current[key] !== 'object') {
                current[key] = {}
              }
              current = current[key]
            }
            return current
          }

          displayColumnsSnapshot.forEach((col) => {
            if (!isExtractionField(col) || !col.displayInSummary) return
            const parentPath = col.path.slice(0, -1)
            const destination = ensurePath(finalResults, parentPath)
            destination[col.id] = finalResults[col.id]
          })

          for (const wave of waves) {
            const geminiFields = wave.fields.filter((col): col is ExtractionField =>
              isExtractionField(col) && !!col.isTransformation && col.transformationType === 'gemini_api'
            )

            // Helper function to execute a single transformation
            const executeTransformationField = async (tcol: ExtractionField) => {
              const dependencies = graph.edges.get(tcol.id) || new Set<string>()
              const blockedBy: string[] = []

              dependencies.forEach((depId) => {
                const depStatus = fieldStatus.get(depId)
                if (depStatus && (depStatus.status === 'error' || depStatus.status === 'blocked')) {
                  const depField = displayColumnsSnapshot.find((c) => c.id === depId)
                  blockedBy.push(depField?.name || depId)
                }
              })

              if (blockedBy.length > 0) {
                throw new Error(`Blocked by failed dependencies: ${blockedBy.join(', ')}`)
              }

              const source = tcol.transformationSource || "column"

              const fieldSchema: any = {
                type: tcol.type,
                name: tcol.name,
                description: tcol.description,
                constraints: tcol.constraints,
              }

              if (tcol.type === 'object' && 'children' in tcol) {
                fieldSchema.children = tcol.children
              } else if (tcol.type === 'list' && 'item' in tcol) {
                fieldSchema.item = tcol.item
              } else if (tcol.type === 'table' && 'columns' in tcol) {
                fieldSchema.columns = tcol.columns
              }

              // Build columnValues from dependencies
              const columnValues: Record<string, any> = {}
              const referencedInputDocs: Array<{ fieldId: string; name: string; type: string; data: string; text?: string; inputType?: InputField["inputType"] }> = []
              dependencies.forEach((depId) => {
                const depField = displayColumnsSnapshot.find((c) => c.id === depId)
                if (depField) {
                  const depValue = finalResults[depId]
                  columnValues[depField.name] = depValue
                  columnValues[depId] = depValue

                  // If this dependency is an input field, attach the original document so the transform model can use it
                  if (depField.type === 'input' && inputDocumentsPayload && inputDocumentsPayload[depId]) {
                    const doc = inputDocumentsPayload[depId]
                    referencedInputDocs.push({
                      fieldId: depId,
                      name: doc.name || depField.name || depId,
                      type: doc.type || 'application/octet-stream',
                      data: doc.data,
                      text: doc.text,
                      inputType: doc.inputType,
                    })
                    // Ensure the placeholder is replaced with something readable (prefer text if available)
                    const readableValue = doc.text || doc.name || depField.name || depId
                    columnValues[depField.name] = readableValue
                    columnValues[depId] = readableValue
                  }
                }
              })

              // Check if all dependency values are "-" (dash)
              const allDependenciesAreDash = dependencies.size > 0 &&
                Array.from(dependencies).every((depId) => {
                  const value = finalResults[depId]
                  return value === "-" || value === "hyphen" || value === "شرطة"
                })

              if (allDependenciesAreDash) {
                // Skip transformation, return dash
                return { fieldId: tcol.id, value: "-", skipped: true }
              }

              // Extract prompt and selectedTools from transformationConfig
              let promptString = ""
              let selectedTools: string[] = []

              if (typeof tcol.transformationConfig === 'object' && tcol.transformationConfig !== null) {
                const config = tcol.transformationConfig as any
                promptString = config.prompt || ""
                selectedTools = config.selectedTools || []
              } else if (typeof tcol.transformationConfig === 'string') {
                promptString = tcol.transformationConfig
              }

              const promptPayload = {
                prompt: promptString,
                inputSource: source,
                columnValues,
                fieldType: tcol.type,
                fieldSchema,
                selectedTools,
                // Only include input documents that were explicitly referenced
                inputDocuments: referencedInputDocs,
              }

              const response = await fetch("/api/transform", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify(promptPayload),
              })

              if (!response.ok) {
                const errText = await response.text().catch(() => `${response.status} ${response.statusText}`)
                throw new Error(`Gemini transformation failed: ${response.status} ${response.statusText} - ${errText}`)
              }

              const data = await response.json()
              if (!data?.success) throw new Error(data?.error || 'Gemini transformation failed')

              return { fieldId: tcol.id, value: data.result?.value ?? data.result }
            }

            // Execute all transformations in this wave in parallel
            const transformationPromises = geminiFields.map((tcol) =>
              executeTransformationField(tcol)
            )

            const results = await Promise.allSettled(transformationPromises)

            // Process results
            results.forEach((result, index) => {
              const tcol = geminiFields[index]

              if (result.status === 'fulfilled') {
                if (result.value.skipped) {
                  finalResults[tcol.id] = result.value.value
                  fieldStatus.set(tcol.id, { status: 'success' })
                } else {
                  finalResults[tcol.id] = result.value.value
                  fieldStatus.set(tcol.id, { status: 'success' })
                }
              } else {
                // Handle rejected promise
                const errorMsg = result.reason?.message || String(result.reason)
                console.error(`Transformation failed for ${tcol.name}:`, result.reason)

                // Check if blocked by dependencies
                if (errorMsg.includes('Blocked by failed dependencies')) {
                  fieldStatus.set(tcol.id, { status: 'blocked', error: errorMsg })
                  finalResults[tcol.id] = `${errorMsg}`
                } else {
                  fieldStatus.set(tcol.id, { status: 'error', error: errorMsg })
                  finalResults[tcol.id] = `Error: ${errorMsg}`
                }
              }
            })
          }

          const completedAt = new Date()
          const reviewMeta = computeInitialReviewMeta(finalResults, {
            handledWithFallback: Boolean(result.handledWithFallback),
            fallbackReason: result.error,
            confidenceByField: rawMeta?.confidence,
            confidenceThreshold: 0.5,
          })

          if (rawMeta?.review) {
            const fallbackUpdatedAt = completedAt.toISOString()
            Object.entries(rawMeta.review).forEach(([fieldId, meta]) => {
              const current = reviewMeta[fieldId]
              reviewMeta[fieldId] = {
                ...current,
                ...meta,
                updatedAt: meta.updatedAt ?? current?.updatedAt ?? fallbackUpdatedAt,
                originalValue: finalResults[fieldId],
                confidence:
                  meta.confidence ?? current?.confidence ?? rawMeta.confidence?.[fieldId] ?? null,
              }
            })
          }

          fieldStatus.forEach((info, fieldId) => {
            if (info.status === 'error' || info.status === 'blocked') {
              reviewMeta[fieldId] = {
                status: 'needs_review',
                updatedAt: completedAt.toISOString(),
                reason: info.error ?? 'Transformation requires review.',
                confidence: 0,
                originalValue: finalResults[fieldId],
              }
            }
          })

          const hasOcrMarkdown = Object.prototype.hasOwnProperty.call(result, "ocrMarkdown")
          const hasOcrAnnotatedImageUrl = Object.prototype.hasOwnProperty.call(result, "ocrAnnotatedImageUrl")
          const hasOriginalFileUrl = Object.prototype.hasOwnProperty.call(result, "originalFileUrl")
          const nextOcrMarkdown =
            hasOcrMarkdown
              ? typeof result.ocrMarkdown === "string" && result.ocrMarkdown.trim().length > 0
                ? result.ocrMarkdown
                : null
              : undefined
          const nextOcrAnnotatedImageUrl =
            hasOcrAnnotatedImageUrl
              ? typeof result.ocrAnnotatedImageUrl === "string" && result.ocrAnnotatedImageUrl.length > 0
                ? result.ocrAnnotatedImageUrl
                : null
              : undefined
          const nextOriginalFileUrl =
            hasOriginalFileUrl
              ? typeof result.originalFileUrl === "string" && result.originalFileUrl.length > 0
                ? result.originalFileUrl
                : null
              : undefined

          updateJobsForSchema((prev) =>
            prev.map((existing) =>
              existing.id === job.id
                ? {
                  ...existing,
                  status: "completed",
                  completedAt,
                  results: finalResults,
                  review: reviewMeta,
                  ocrMarkdown:
                    nextOcrMarkdown !== undefined
                      ? nextOcrMarkdown
                      : existing.ocrMarkdown ?? null,
                  ocrAnnotatedImageUrl:
                    nextOcrAnnotatedImageUrl !== undefined
                      ? nextOcrAnnotatedImageUrl
                      : existing.ocrAnnotatedImageUrl ?? null,
                  originalFileUrl:
                    nextOriginalFileUrl !== undefined
                      ? nextOriginalFileUrl
                      : existing.originalFileUrl ?? null,
                }
                : existing,
            ),
          )
        } else {
          throw new Error(result.error || "Extraction failed")
        }
      } catch (error) {
        console.error("Extraction error:", error)
        updateJobsForSchema((prev) =>
          prev.map((existing) =>
            existing.id === job.id
              ? {
                ...existing,
                status: "error",
                completedAt: new Date(),
              }
              : existing,
          ),
        )
      }
    }

    const fieldInputDocMap =
      options?.fieldInputDocMap ??
      (isMultiInputUpload
        ? displayColumnsSnapshot.reduce<Record<string, string[]>>((acc, col) => {
          if (!isExtractionField(col)) return acc
          const refs = extractDocumentReferences(
            (col as any).extractionInstructions || (col as any).description || "",
            fieldsSnapshot,
          ).inputFieldIds
          if (refs.length > 0) {
            acc[col.id] = refs
          }
          return acc
        }, {})
        : undefined)

    await Promise.allSettled(
      fileArray.map((file, index) =>
        processEntry(file, jobsToCreate[index], {
          inputDocuments: options?.inputDocuments,
          fieldInputDocMap,
        }),
      ),
    )

    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleSaveManualRecord = async (recordName: string, data: Record<string, any>) => {
    const targetSchemaId = activeSchemaId

    // Create a new job with manually entered data
    const newJob: ExtractionJob = {
      id: generateUuid(),
      fileName: recordName,
      status: "completed" as ExtractionJob["status"],
      results: data,
      createdAt: new Date(),
      completedAt: new Date(),
      agentType: "manual" as any,
      review: {},
      ocrMarkdown: null,
      ocrAnnotatedImageUrl: null,
      originalFileUrl: null,
    }

    // Add to local state
    updateSchemaJobs(targetSchemaId, (prev) => [newJob, ...prev])
    setSelectedRowId(newJob.id)

    // Persist to Supabase if user is logged in
    if (session?.user?.id) {
      try {
        const { error } = await supabase
          .from('extraction_jobs')
          .insert({
            id: newJob.id,
            schema_id: targetSchemaId,
            file_name: recordName,
            status: 'completed',
            results: data,
            agent_type: 'manual',
            created_at: newJob.createdAt.toISOString(),
            completed_at: newJob.completedAt?.toISOString(),
          })

        if (error) {
          console.error('Failed to save manual record:', error)
          toast({
            title: "Error",
            description: "Failed to save record to database",
            variant: "destructive"
          })
        } else {
          toast({
            title: "Success",
            description: "Record created successfully",
          })
        }
      } catch (err) {
        console.error('Error saving manual record:', err)
      }
    } else {
      toast({
        title: "Success",
        description: "Record created (sign in to save to cloud)",
      })
    }
  }

  // Create a new empty record and open Label Maker for GCC Food Label
  const handleCreateLabelRecord = async () => {
    const targetSchemaId = activeSchemaId
    const recordName = `New Label - ${new Date().toLocaleString()}`

    // Create an empty job
    const newJob: ExtractionJob = {
      id: generateUuid(),
      fileName: recordName,
      status: "completed" as ExtractionJob["status"],
      results: labelDataToResults(DEFAULT_LABEL_DATA),
      createdAt: new Date(),
      completedAt: new Date(),
      agentType: "manual" as any,
      review: {},
      ocrMarkdown: null,
      ocrAnnotatedImageUrl: null,
      originalFileUrl: null,
    }

    // Add to local state
    updateSchemaJobs(targetSchemaId, (prev) => [newJob, ...prev])
    setSelectedRowId(newJob.id)

    // Persist to Supabase if user is logged in
    if (session?.user?.id) {
      try {
        const { error } = await supabase
          .from('extraction_jobs')
          .insert({
            id: newJob.id,
            schema_id: targetSchemaId,
            file_name: recordName,
            status: 'completed',
            results: newJob.results,
            agent_type: 'manual',
            created_at: newJob.createdAt.toISOString(),
            completed_at: newJob.completedAt?.toISOString(),
          })

        if (error) {
          console.error('Failed to save new label record:', error)
        }
      } catch (err) {
        console.error('Error saving new label record:', err)
      }
    }

    // Open the Label Maker dialog
    setLabelMakerJob(newJob)
    setIsLabelMakerNewRecord(true)
  }

  // Save label data back to job
  const handleSaveLabelData = async (jobId: string, labelData: LabelData) => {
    const targetSchemaId = activeSchemaId
    const results = labelDataToResults(labelData)
    const fileName = labelData.productName || `Label - ${new Date().toLocaleString()}`

    // Update local state
    updateSchemaJobs(targetSchemaId, (prev) =>
      prev.map((job) =>
        job.id === jobId
          ? { ...job, results, fileName }
          : job
      )
    )

    // Persist to Supabase if user is logged in
    if (session?.user?.id) {
      try {
        // Check if job exists in DB
        const { data: existingJob } = await supabase
          .from('extraction_jobs')
          .select('id')
          .eq('id', jobId)
          .single()

        if (existingJob) {
          // Update existing
          const { error } = await supabase
            .from('extraction_jobs')
            .update({
              file_name: fileName,
              results: results,
            })
            .eq('id', jobId)

          if (error) throw error
        } else {
          // Insert new
          const { error } = await supabase
            .from('extraction_jobs')
            .insert({
              id: jobId,
              schema_id: targetSchemaId,
              file_name: fileName,
              status: 'completed',
              results: results,
              agent_type: 'manual',
              created_at: new Date().toISOString(),
              completed_at: new Date().toISOString(),
            })

          if (error) throw error
        }

        toast({
          title: "Saved",
          description: "Label saved successfully",
        })
      } catch (err) {
        console.error('Error saving label:', err)
        toast({
          title: "Error",
          description: "Failed to save label to database",
          variant: "destructive"
        })
      }
    } else {
      toast({
        title: "Saved locally",
        description: "Sign in to save to cloud",
      })
    }
  }

  const getStatusIcon = useCallback((status: ExtractionJob["status"]) => {
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
  }, [])

  const renderStatusPill = useCallback((
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
  }, [])

  const getCellAlignClasses = (type: DataType) => {
    if (type === 'number' || type === 'decimal') return 'text-right [font-variant-numeric:tabular-nums]'
    if (type === 'date') return 'font-mono text-xs'
    return 'text-left'
  }

  type GridRenderMode = 'interactive' | 'summary' | 'detail'

  const [nestedFieldView, setNestedFieldView] = useState<{
    column: SchemaField
    job: ExtractionJob
    value: any
  } | null>(null)

  // Stabilize setNestedFieldView using ref to prevent renderCellValue from recreating
  const setNestedFieldViewRef = useRef(setNestedFieldView)
  useEffect(() => {
    setNestedFieldViewRef.current = setNestedFieldView
  }, [setNestedFieldView])

  const renderCellValue = useCallback((
    column: SchemaField,
    job: ExtractionJob,
    opts?: {
      refreshRowHeight?: () => void;
      mode?: GridRenderMode;
      onUpdateCell?: (jobId: string, columnId: string, value: unknown) => void;
      onOpenTableModal?: (
        column: SchemaField,
        job: ExtractionJob,
        rows: Record<string, any>[],
        columnHeaders: Array<{ key: string; label: string }>
      ) => void;
    },
  ) => {
    const value = job.results?.[column.id]

    if (value instanceof Promise) {
      console.error("Promise value passed to grid cell", {
        columnId: column.id,
        jobId: job.id,
        value,
      });
      return <span className="text-red-600">[promise]</span>;
    }

    if (column.type === 'input') {
      const inputDoc = job.inputDocuments?.[column.id]
      const docName = inputDoc?.textValue || inputDoc?.fileName || job.fileName
      return (
        <span className="text-sm font-medium text-foreground" title={docName || undefined}>
          {docName || '—'}
        </span>
      )
    }

    if (job.status === 'error') return <span className="text-sm text-destructive">—</span>
    if (job.status !== 'completed') return <Skeleton className="h-4 w-24" />

    const mode: GridRenderMode = opts?.mode ?? 'interactive'

    const isEmptyValue =
      value === undefined ||
      value === null ||
      (typeof value === 'string' && value.trim().length === 0) ||
      (Array.isArray(value) && value.length === 0)

    // Use rich grid cells when editable
    if (opts?.onUpdateCell) {
      const row: any = {
        __job: job,
        fileName: job.fileName,
        status: job.status,
        [column.id]: value,
      }

      if (column.type === 'object') {
        const safeValue = value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, any>) : {}
        return (
          <ObjectCell
            value={safeValue}
            row={row}
            columnId={column.id}
            column={column}
            mode={mode}
            onUpdateCell={opts.onUpdateCell}
            onOpenNestedGrid={({ column: nestedColumn, job: nestedJob, value: nestedValue }) => {
              setNestedFieldViewRef.current({ column: nestedColumn, job: nestedJob, value: nestedValue })
            }}
          />
        )
      }

      if (column.type === 'table') {
        const safeValue = Array.isArray(value) ? (value as Record<string, any>[]) : []
        return (
          <TableCell
            value={safeValue}
            row={row}
            columnId={column.id}
            column={column}
            onOpenTableModal={opts.onOpenTableModal}
            onUpdateCell={opts.onUpdateCell}
            mode={mode}
            onOpenNestedGrid={({ column: nestedColumn, job: nestedJob, value: nestedValue }) => {
              setNestedFieldViewRef.current({ column: nestedColumn, job: nestedJob, value: nestedValue })
            }}
          />
        )
      }

      if (column.type === 'list') {
        const safeValue = Array.isArray(value) ? value : []
        return (
          <ListCell
            value={safeValue}
            row={row}
            columnId={column.id}
            column={column}
            onUpdateCell={opts.onUpdateCell}
            mode={mode}
            onOpenNestedGrid={({ column: nestedColumn, job: nestedJob, value: nestedValue }) => {
              setNestedFieldViewRef.current({ column: nestedColumn, job: nestedJob, value: nestedValue })
            }}
          />
        )
      }

      if (column.type === 'single_select') {
        const options = column.constraints?.options || []
        return (
          <SingleSelectCell
            value={value as string | null}
            row={row}
            columnId={column.id}
            options={options}
            onUpdateCell={opts.onUpdateCell}
          />
        )
      }

      if (column.type === 'multi_select') {
        const options = column.constraints?.options || []
        return (
          <MultiSelectCell
            value={value as string[] | null}
            row={row}
            columnId={column.id}
            options={options}
            onUpdateCell={opts.onUpdateCell}
          />
        )
      }

      return (
        <PrimitiveCell
          value={value}
          row={row}
          columnId={column.id}
          columnType={column.type}
          columnMeta={column}
          onUpdateCell={opts.onUpdateCell}
        />
      )
    }

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
      const expanded = mode === 'detail'
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

      // For this legacy code path, just show the collapsed view
      return (
        <div className="rounded-xl border border-[#2782ff]/10 bg-white/75 px-3 py-2 shadow-sm">
          {headerContent}
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
  }, [formatNumericValue, formatDateValue, getObjectEntries, firstNonEmptyText, prettifyKey, openTableModal])

  const exportToCSV = () => {
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

    let headers: string[]
    let rows: string[][]

    // Check if this is pharma agent
    if (selectedAgent === 'pharma') {
      // Pharma-specific CSV export
      headers = [
        'File Name',
        'Status',
        'Trade Name',
        'Generic Name',
        'Manufacturer',
        'Drug Type',
        'Registration Number',
        'Description',
        'Composition',
        'How To Use',
        'Indication',
        'Possible Side Effects',
        'Properties',
        'Storage',
        'Matched Drug URL',
        'Search URL'
      ]

      rows = jobs.map((job) => {
        const pharmaData = job.results?.pharma_data
        const drugInfo = pharmaData?.drugInfo
        const detailedInfo = pharmaData?.detailedInfo

        return [
          job.fileName,
          job.status,
          formatCell(drugInfo?.tradeName),
          formatCell(drugInfo?.genericName),
          formatCell(drugInfo?.manufacturer),
          formatCell(drugInfo?.drugType),
          formatCell(drugInfo?.registrationNumber),
          formatCell(detailedInfo?.description),
          formatCell(detailedInfo?.composition),
          formatCell(detailedInfo?.howToUse),
          formatCell(detailedInfo?.indication),
          formatCell(detailedInfo?.possibleSideEffects),
          formatCell(detailedInfo?.properties),
          formatCell(detailedInfo?.storage),
          formatCell(pharmaData?.matchedDrugUrl),
          formatCell(pharmaData?.searchUrl)
        ]
      })
    } else {
      // Standard extraction CSV export
      headers = ['File Name', 'Status', ...displayColumns.map((col) => col.name)]

      rows = jobs.map((job) => {
        const row: string[] = [job.fileName, job.status]
        displayColumns.forEach((col) => {
          const value = col.type === 'input'
            ? job.inputDocuments?.[col.id]?.textValue ?? job.inputDocuments?.[col.id]?.fileName
            : job.results?.[col.id]
          row.push(formatCell(value))
        })
        return row
      })
    }

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
    const schemaLabel = selectedAgent === 'pharma' ? 'pharma_extraction' : (activeSchema.name || 'schema').replace(/[^a-z0-9-_]+/gi, '_')
    link.setAttribute('download', `${schemaLabel}_results_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // F&B: Build and print localized label PDF (printable HTML)
  const printLocalizedLabel = () => {
    try {
      const job =
        sortedJobs.find((j) => j.id === selectedRowId) ||
        sortedJobs.find((j) => j.status === 'completed') ||
        sortedJobs[sortedJobs.length - 1]
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
      setTimeout(() => { try { w.print() } catch { } }, 200)
    } catch (e) {
      console.error('print label error', e)
      alert('Failed to build printable label')
    }
  }

  // New functions for TanStackGridSheet props
  const handleUpdateCell = useCallback(
    (jobId: string, columnId: string, value: unknown) => {
      updateSchemaJobs(activeSchemaId, (prev) =>
        prev.map((job) =>
          job.id === jobId
            ? { ...job, results: { ...(job.results || {}), [columnId]: value } }
            : job,
        ),
      );
      updateReviewStatus(jobId, columnId, "verified", {
        reason: "Value edited by user",
      });
    },
    [activeSchemaId, updateSchemaJobs, updateReviewStatus]
  );

  const handleUpdateReviewStatus = useCallback(
    (jobId: string, columnId: string, status: "verified" | "needs_review", payload?: { reason?: string | null }) => {
      updateReviewStatus(jobId, columnId, status, payload);
    },
    [updateReviewStatus]
  );

  const handleDeleteJob = useCallback(
    (jobId: string) => {
      updateSchemaJobs(activeSchemaId, (prev) => prev.filter((job) => job.id !== jobId));
    },
    [activeSchemaId, updateSchemaJobs]
  );

  const handleCreateNewSchema = useCallback(() => {
    setIsTemplateSelectorOpen(true);
  }, []);

  const handleChooseTemplate = useCallback((templateId: string, options: { name: string; agent: AgentType }) => {
    addSchema({ name: options.name, templateId, agent: options.agent });
  }, [addSchema]);

  const handleCreateBlank = useCallback((options: { name: string; agent: AgentType; templateId: string }) => {
    addSchema({ name: options.name, templateId: options.templateId, agent: options.agent });
  }, [addSchema]);

  const handleSchemaNameSave = useCallback(() => {
    const trimmedName = schemaNameInput.trim();
    if (!trimmedName) {
      setSchemaNameInput(activeSchema.name);
      setEditingSchemaName(false);
      return;
    }

    commitSchemaUpdate(activeSchemaId, (schema) => ({
      ...schema,
      name: trimmedName,
    }));

    setEditingSchemaName(false);
  }, [schemaNameInput, activeSchema.name, activeSchemaId, commitSchemaUpdate]);

  // Stabilized props for StandardResultsView / grid (placed after function defs to avoid TDZ)
  const memoVisualGroups = useMemo(
    () => activeSchema.visualGroups || [],
    [activeSchema.visualGroups],
  );

  const memoOnSelectJob = useCallback(
    (job: ExtractionJob | null) => setSelectedJob(job),
    [],
  );

  const memoOnRowDoubleClick = useCallback(
    (job: ExtractionJob) => {
      if (activeSchema.templateId === "gcc-food-label" || activeSchema.name.toLowerCase().includes("gcc")) {
        setLabelMakerJob(job);
        setIsLabelMakerNewRecord(false);
      } else {
        setSelectedJob(job);
        setIsDetailOpen(true);
      }
    },
    [activeSchema.templateId, activeSchema.name],
  );

  const memoOnAddColumn = useCallback(() => {
    addColumn();
  }, [addColumn]);

  const memoOnEditColumn = useCallback((col: SchemaField) => {
    setColumnDialogMode("edit");
    setSelectedColumn(col);
    setDraftColumn(col);
    setIsColumnDialogOpen(true);
  }, []);

  const memoOnDeleteColumn = useCallback(
    (colId: string) => {
      commitSchemaUpdate(activeSchemaId, (schema) => {
        const newFields = removeFieldById(schema.fields, colId);
        const updatedGroups = (schema.visualGroups || [])
          .map((group) => ({
            ...group,
            fieldIds: group.fieldIds.filter((id) => id !== colId),
          }))
          .filter((group) => group.fieldIds.length > 0);
        return {
          ...schema,
          fields: newFields,
          visualGroups: updatedGroups,
        };
      });
    },
    [activeSchemaId, commitSchemaUpdate],
  );

  const memoOnToggleRowExpansion = useCallback(
    (rowId: string | null) => toggleRowExpansion(rowId),
    [toggleRowExpansion],
  );

  const memoOnOpenTableModal = useCallback(
    (
      column: SchemaField,
      job: ExtractionJob,
      rows: Record<string, unknown>[],
      columnHeaders: Array<{ key: string; label: string }>,
    ) => openTableModal(column as any, job, rows, columnHeaders),
    [openTableModal],
  );

  const memoOnColumnRightClick = useCallback(
    (columnId: string, event: React.MouseEvent) => handleColumnRightClick(columnId, event),
    [handleColumnRightClick],
  );

  return (
    <div className={cn("flex flex-col bg-background", isEmbedded ? "h-full" : "h-screen")}>
      {/* Hidden file input for Upload Files button */}
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        multiple
        accept="image/*,.pdf,.doc,.docx,.txt,.csv,.json,.xml,.md"
        onChange={handleFileUpload}
      />
      <SetupBanner />

      {/* Header / Navigation */}
      <div className="flex h-14 items-center justify-between border-b bg-background px-4 shrink-0">
        <div className="flex items-center gap-4">
          {showGallery ? (
            <div className="flex items-center gap-2 font-semibold">
              <LayoutGrid className="h-5 w-5" />
              <span>Dashboard</span>
            </div>
          ) : (
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="#" onClick={(e) => {
                    e.preventDefault()
                    setShowGallery(true)
                  }}>
                    Dashboard
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>
                    {editingSchemaName ? (
                      <Input
                        value={schemaNameInput}
                        onChange={(e) => setSchemaNameInput(e.target.value)}
                        onBlur={handleSchemaNameSave}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleSchemaNameSave()
                          if (e.key === "Escape") {
                            setSchemaNameInput(activeSchema.name)
                            setEditingSchemaName(false)
                          }
                        }}
                        className="h-6 w-[200px] px-1 py-0 text-sm font-medium"
                        autoFocus
                      />
                    ) : (
                      <div
                        className="flex items-center gap-2 cursor-pointer hover:text-foreground transition-colors"
                        onClick={() => {
                          setSchemaNameInput(activeSchema.name)
                          setEditingSchemaName(true)
                        }}
                      >
                        <span>{activeSchema.name}</span>
                        <Edit className="h-3 w-3 opacity-50" />
                      </div>
                    )}
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          )}
        </div>

        <div className="flex items-center gap-2">
          {!showGallery && (
            <>
              <div className="flex items-center bg-muted/50 rounded-lg p-1 mr-2">
                <Button
                  variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                  size="sm"
                  className="h-7 px-2"
                  onClick={() => setViewMode('grid')}
                >
                  <Grid className="h-3.5 w-3.5 mr-1.5" />
                  Grid
                </Button>
                <Button
                  variant={viewMode === 'gallery' ? 'secondary' : 'ghost'}
                  size="sm"
                  className="h-7 px-2"
                  onClick={() => setViewMode('gallery')}
                >
                  <LayoutGrid className="h-3.5 w-3.5 mr-1.5" />
                  Gallery
                </Button>
              </div>

              <Button variant="outline" size="sm" onClick={() => setIsColumnDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Column
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  // For GCC Food Label, open Label Maker directly
                  if (activeSchema.templateId === 'gcc-food-label' || activeSchema.name.toLowerCase().includes('gcc')) {
                    handleCreateLabelRecord()
                  } else {
                    setIsManualRecordOpen(true)
                  }
                }}
              >
                <Plus className="mr-2 h-4 w-4" />
                Create Record
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={() => {
                  const inputFieldsCount = getInputFields(fields).length
                  if (inputFieldsCount > 0) {
                    // Schema has input fields - show multi-document upload dialog
                    setIsMultiDocUploadOpen(true)
                  } else {
                    // No input fields - use traditional upload
                    fileInputRef.current?.click()
                  }
                }}
              >
                <Upload className="mr-2 h-4 w-4" />
                Upload Files
              </Button>
            </>
          )}

          {session?.user && (
            <Button
              variant="secondary"
              size="sm"
              onClick={handleSaveSchema}
              disabled={activeSchemaStatus === 'saving'}
            >
              {activeSchemaStatus === 'saving' ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving…
                </>
              ) : (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Save schema
                </>
              )}
            </Button>
          )}

          <div className="flex items-center gap-1">
            {session?.user && (
              <div className="flex items-center gap-2 ml-2">
                <div className={cn(
                  "h-2 w-2 rounded-full",
                  Object.values(schemaSyncState).some(s => s.status === 'saving') ? "bg-yellow-500 animate-pulse" :
                    Object.values(schemaSyncState).some(s => s.status === 'error') ? "bg-red-500" :
                      "bg-emerald-500"
                )} />
                <span className="text-xs text-muted-foreground">
                  {Object.values(schemaSyncState).some(s => s.status === 'saving') ? "Saving..." :
                    Object.values(schemaSyncState).some(s => s.status === 'error') ? "Error saving" :
                      "Saved"}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-1 min-h-0 min-w-0">
        {showGallery ? (
          <JobGalleryView
            schemas={schemas}
            isLoading={isWorkspaceLoading}
            onSelectSchema={(schema) => {
              setActiveSchemaId(schema.id)
              setShowGallery(false)
            }}
            onCreateSchema={handleCreateNewSchema}
            onDeleteSchema={(schema) => setSchemaDeletionDialog(schema)}
            onRenameSchema={(schema) => {
              setActiveSchemaId(schema.id)
              setSchemaNameInput(schema.name)
              setEditingSchemaName(true)
              setShowGallery(false)
            }}
          />
        ) : (
          <div className="flex flex-1 flex-col min-h-0 min-w-0">

            {/* Sidebar disabled on all screen sizes */}

            {/* Main Content - Excel-style Table */}
            <div className="flex-1 flex flex-col min-h-0 min-w-0">
              {/* Header */}

              {/* Main Body */}
              <div className="flex-1 overflow-auto min-h-0 min-w-0 relative">
                {(() => {
                  // Determine display mode based on job agent types or selected agent
                  const selectedJob = sortedJobs.find((j) => j.id === selectedRowId) || sortedJobs[sortedJobs.length - 1]
                  const displayMode = selectedJob?.agentType || selectedAgent
                  return displayMode
                })() === 'pharma' ? (
                  <PharmaResultsView
                    jobs={sortedJobs}
                    selectedRowId={selectedRowId}
                    onSelectRow={setSelectedRowId}
                    onUpdateJobs={setJobs}
                    editingSection={pharmaEditingSection}
                    editedValues={pharmaEditedValues}
                    onSetEditingSection={setPharmaEditingSection}
                    onSetEditedValues={setPharmaEditedValues}
                  />
                ) : activeSchema.templateId === 'fnb-label-compliance' ? (
                  <FnBResultsView
                    jobs={sortedJobs}
                    selectedRowId={selectedRowId}
                    onSelectRow={setSelectedRowId}
                    collapseState={fnbCollapse}
                    onToggleEnglish={(jobId) =>
                      setFnbCollapse((prev) => {
                        const current = prev[jobId] || { en: false, ar: false }
                        return { ...prev, [jobId]: { ...current, en: !current.en } }
                      })
                    }
                    onToggleArabic={(jobId) =>
                      setFnbCollapse((prev) => {
                        const current = prev[jobId] || { en: false, ar: false }
                        return { ...prev, [jobId]: { ...current, ar: !current.ar } }
                      })
                    }
                  />
                ) : (
                  <StandardResultsView
                    activeSchemaId={activeSchemaId}
                    activeSchema={activeSchema}
                    displayColumns={displayColumns}
                    jobs={sortedJobs}
                    viewMode={viewMode}
                    selectedJobId={selectedJob?.id ?? null}
                    expandedRowId={expandedRowId}
                    onSelectJob={memoOnSelectJob}
                    onRowDoubleClick={memoOnRowDoubleClick}
                    onDeleteJob={handleDeleteJob}
                    onToggleRowExpansion={memoOnToggleRowExpansion}
                    onAddColumn={memoOnAddColumn}
                    onEditColumn={memoOnEditColumn}
                    onDeleteColumn={memoOnDeleteColumn}
                    onUpdateCell={handleUpdateCell}
                    onUpdateReviewStatus={handleUpdateReviewStatus}
                    onColumnRightClick={memoOnColumnRightClick}
                    onOpenTableModal={memoOnOpenTableModal}
                    renderCellValue={renderCellValue}
                    getStatusIcon={getStatusIcon}
                    renderStatusPill={renderStatusPill}
                    visualGroups={memoVisualGroups}
                  />
                )
                }

                {nestedFieldView && nestedFieldView.column.type !== 'input' && (
                  <NestedGridModal
                    open
                    onOpenChange={(open) => {
                      if (!open) setNestedFieldView(null)
                    }}
                    title={`${nestedFieldView.column.name || nestedFieldView.column.id} • ${nestedFieldView.job.fileName}`}
                    contentType={
                      nestedFieldView.column.type === 'table'
                        ? 'table'
                        : nestedFieldView.column.type === 'list'
                          ? 'list'
                          : 'object'
                    }
                    columnCount={
                      nestedFieldView.column.type === 'table'
                        ? nestedFieldView.column.columns?.length || 0
                        : 0
                    }
                  >
                    <div className="px-2">
                      <NestedAdvancedField
                        column={nestedFieldView.column as any}
                        job={nestedFieldView.job}
                        value={nestedFieldView.value}
                        onUpdate={(updatedValue) => {
                          handleUpdateCell(nestedFieldView.job.id, nestedFieldView.column.id, updatedValue)
                          setNestedFieldView(null)
                        }}
                      />
                    </div>
                  </NestedGridModal>
                )}
              </div>
            </div>

            {/* Column Configuration Modal (hidden for F&B fixed mode) */}
            {
              activeSchema.templateId !== 'fnb-label-compliance' && (
                <Dialog
                  open={isColumnDialogOpen}
                  onOpenChange={(open) => {
                    setIsColumnDialogOpen(open)
                    if (!open) {
                      setDraftColumn(null)
                      setColumnDialogMode('create')
                    }
                  }}
                >
                  <DialogContent className="max-w-3xl w-full max-h-[90vh] p-0 overflow-hidden flex flex-col">
                    <DialogHeader className="border-b border-slate-200/70 px-6 py-5">
                      <DialogTitle className="text-xl font-semibold">
                        {columnDialogMode === 'edit' ? 'Edit Field' : 'Add New Field'}
                      </DialogTitle>
                      <DialogDescription className="text-sm text-slate-600">
                        Configure how this data point is extracted and structured for your grid.
                      </DialogDescription>
                    </DialogHeader>

                    {draftColumn && (
                      <div className="flex-1 space-y-6 overflow-y-auto px-6 py-5 min-h-0">
                        <section className="space-y-3">
                          <Label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Field Type</Label>
                          <div className="grid gap-3 sm:grid-cols-3">
                            <Button
                              type="button"
                              variant="outline"
                              className={cn(
                                'flex h-full w-full flex-col items-start gap-1 rounded-xl border-2 px-4 py-3 text-left shadow-none transition-all min-h-[88px]',
                                draftFieldSource === 'input'
                                  ? 'border-amber-500/70 bg-amber-50/70 text-amber-700 hover:bg-amber-100'
                                  : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-100',
                              )}
                              aria-pressed={draftFieldSource === 'input'}
                              onClick={() => handleDraftFieldTypeChange('input')}
                            >
                              <span className="flex items-center gap-2 text-sm font-semibold">
                                <Upload className="h-4 w-4" />
                                Input
                              </span>
                              <span className="text-xs text-slate-500 whitespace-normal break-words leading-snug text-left">
                                Document to process
                              </span>
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              className={cn(
                                'flex h-full w-full flex-col items-start gap-1 rounded-xl border-2 px-4 py-3 text-left shadow-none transition-all min-h-[88px]',
                                draftFieldSource === 'extraction'
                                  ? 'border-[#2782ff]/70 bg-[#e6f0ff]/70 text-[#2782ff] hover:bg-[#d9e9ff]'
                                  : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-100',
                              )}
                              aria-pressed={draftFieldSource === 'extraction'}
                              onClick={() => handleDraftFieldTypeChange('extraction')}
                            >
                              <span className="flex items-center gap-2 text-sm font-semibold">
                                <FileText className="h-4 w-4" />
                                Extraction
                              </span>
                              <span className="text-xs text-slate-500 whitespace-normal break-words leading-snug text-left">
                                Extract from document
                              </span>
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              className={cn(
                                'flex h-full w-full flex-col items-start gap-1 rounded-xl border-2 px-4 py-3 text-left shadow-none transition-all min-h-[88px]',
                                draftFieldSource === 'transformation'
                                  ? 'border-[#2782ff]/70 bg-[#e6f0ff]/70 text-[#2782ff] hover:bg-[#d9e9ff]'
                                  : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-100',
                              )}
                              aria-pressed={draftFieldSource === 'transformation'}
                              onClick={() => handleDraftFieldTypeChange('transformation')}
                            >
                              <span className="flex items-center gap-2 text-sm font-semibold">
                                <Zap className="h-4 w-4" />
                                Transformation
                              </span>
                              <span className="text-xs text-slate-500 whitespace-normal break-words leading-snug text-left">
                                Compute from fields
                              </span>
                            </Button>
                          </div>
                        </section>

                        {/* Input Field Configuration */}
                        {isDraftInput ? (
                          <div className="space-y-4 rounded-2xl border border-amber-200/70 bg-amber-50/30 px-4 py-5 shadow-sm">
                            <div className="grid gap-4">
                              <div className="space-y-1.5">
                                <Label htmlFor="input-name">Input Name</Label>
                                <Input
                                  id="input-name"
                                  value={draftColumn.name}
                                  onChange={(event) => setDraftColumn({ ...draftColumn, name: event.target.value })}
                                  placeholder="e.g., Reference Document, Old Version"
                                />
                                <p className="text-xs text-slate-500">Use this name in extraction instructions with @{draftColumn.name || 'Name'}</p>
                              </div>

                              <div className="space-y-1.5">
                                <Label htmlFor="input-description">Description</Label>
                                <Textarea
                                  id="input-description"
                                  value={draftColumn.description || ''}
                                  onChange={(event) => setDraftColumn({ ...draftColumn, description: event.target.value })}
                                  placeholder="Describe this input document's purpose in the workflow"
                                  rows={3}
                                />
                              </div>

                              <div className="space-y-2">
                                <Label>Input Type</Label>
                                <div className="flex flex-wrap gap-2">
                                  {[
                                    { value: 'document', label: 'File upload' },
                                    { value: 'text', label: 'Text input' },
                                  ].map((option) => {
                                    const isSelected = (draftColumn as InputField).inputType === option.value || (!('inputType' in draftColumn) && option.value === 'document')
                                    return (
                                      <Button
                                        key={option.value}
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        className={cn(
                                          'rounded-full px-3 py-1 text-xs capitalize',
                                          isSelected
                                            ? 'border-amber-500 bg-amber-100 text-amber-700'
                                            : 'border-slate-200 text-slate-600'
                                        )}
                                        onClick={() => {
                                          const inputField = draftColumn as InputField
                                          const next = {
                                            ...inputField,
                                            inputType: option.value as InputField["inputType"],
                                          }
                                          if (option.value === 'text') {
                                            delete (next as any).fileConstraints
                                          }
                                          setDraftColumn(next as SchemaField)
                                        }}
                                      >
                                        {option.label}
                                      </Button>
                                    )
                                  })}
                                </div>
                                <p className="text-xs text-slate-500">Choose whether this input collects a file or pasted text.</p>
                              </div>

                              {(draftColumn as InputField).inputType !== 'text' && (
                                <div className="space-y-2">
                                  <Label>Allowed File Types</Label>
                                  <div className="flex flex-wrap gap-2">
                                    {['pdf', 'image', 'doc', 'any'].map((fileType) => {
                                      const inputField = draftColumn as InputField
                                      const allowedTypes = inputField.fileConstraints?.allowedTypes || []
                                      const isAny = allowedTypes.length === 0 || allowedTypes.includes('any')
                                      const isSelected = fileType === 'any' ? isAny : allowedTypes.includes(fileType)

                                      return (
                                        <Button
                                          key={fileType}
                                          type="button"
                                          variant="outline"
                                          size="sm"
                                          className={cn(
                                            'rounded-full px-3 py-1 text-xs capitalize',
                                            isSelected
                                              ? 'border-amber-500 bg-amber-100 text-amber-700'
                                              : 'border-slate-200 text-slate-600'
                                          )}
                                          onClick={() => {
                                            const current = inputField.fileConstraints?.allowedTypes || []
                                            let newTypes: string[]
                                            if (fileType === 'any') {
                                              newTypes = []
                                            } else if (current.includes(fileType)) {
                                              newTypes = current.filter(t => t !== fileType)
                                            } else {
                                              newTypes = [...current.filter(t => t !== 'any'), fileType]
                                            }
                                            setDraftColumn({
                                              ...draftColumn,
                                              fileConstraints: {
                                                ...inputField.fileConstraints,
                                                allowedTypes: newTypes,
                                              }
                                            } as InputField)
                                          }}
                                        >
                                          {fileType === 'any' ? 'Any Type' : fileType.toUpperCase()}
                                        </Button>
                                      )
                                    })}
                                  </div>
                                </div>
                              )}

                              <div className="flex items-center gap-3 pt-1">
                                <Checkbox
                                  id="input-required"
                                  checked={!!draftColumn.required}
                                  onCheckedChange={(checked) => setDraftColumn({ ...draftColumn, required: checked === true })}
                                />
                                <Label htmlFor="input-required" className="text-sm font-medium text-slate-600">
                                  Required input
                                </Label>
                              </div>
                            </div>
                          </div>
                        ) : (
                          /* Extraction/Transformation Field Configuration */
                          <div className="space-y-4 rounded-2xl border border-slate-200/70 bg-white px-4 py-5 shadow-sm">
                            <div className="grid gap-4">
                              <div className="space-y-1.5">
                                <Label htmlFor="column-name">Field Name</Label>
                                <Input
                                  id="column-name"
                                  value={draftColumn.name}
                                  onChange={(event) => setDraftColumn({ ...draftColumn, name: event.target.value })}
                                  placeholder="e.g., Manufacturer"
                                />
                              </div>
                              {/* Description has been merged with Extraction Guidance below */}
                            </div>

                            <div className="space-y-3">
                              <div className="space-y-1.5">
                                <Label htmlFor="column-type">Data Type</Label>
                                <Select value={draftColumn.type} onValueChange={(value: DataType) => changeDraftType(value)}>
                                  <SelectTrigger id="column-type">
                                    <SelectValue placeholder="Select a data type" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectGroup>
                                      <SelectLabel>Simple Types</SelectLabel>
                                      {simpleDataTypeOptions.map((option) => (
                                        <SelectItem key={option.value} value={option.value}>
                                          {option.label}
                                        </SelectItem>
                                      ))}
                                    </SelectGroup>
                                    <SelectSeparator />
                                    <SelectGroup>
                                      <SelectLabel>Structured Types</SelectLabel>
                                      {complexDataTypeOptions.map((option) => (
                                        <SelectItem key={option.value} value={option.value}>
                                          {option.label}
                                        </SelectItem>
                                      ))}
                                    </SelectGroup>
                                  </SelectContent>
                                </Select>
                              </div>

                              {renderStructuredConfig()}

                              <div className="flex items-center gap-3 pt-1">
                                <Checkbox
                                  id="column-required"
                                  checked={!!draftColumn.required}
                                  onCheckedChange={(checked) => setDraftColumn({ ...draftColumn, required: checked === true })}
                                />
                                <Label htmlFor="column-required" className="text-sm font-medium text-slate-600">
                                  Required field
                                </Label>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Field Guidance - only for extraction and transformation fields */}
                        {!isDraftInput && (
                          <div className="space-y-3 rounded-2xl border border-slate-200/70 bg-white px-4 py-5 shadow-sm">
                            <div className="space-y-1">
                              <h3 className="text-sm font-semibold text-slate-700">Field Guidance</h3>
                              <p className="text-xs text-slate-500">
                                {isDraftTransformation
                                  ? 'Configure the transformation logic for this field.'
                                  : 'Describe this field and how to extract it. Use @DocumentName to reference input documents.'
                                }
                              </p>
                            </div>
                            {isDraftTransformation ? (
                              <TransformBuilder
                                allColumns={displayColumns}
                                selected={draftColumn}
                                onUpdate={(updates) => setDraftColumn({ ...draftColumn, ...updates })}
                                visualGroups={activeSchema.visualGroups}
                              />
                            ) : (
                              <div className="space-y-1.5">
                                <Label htmlFor="field-guidance">Extraction Instructions</Label>
                                <MentionTextarea
                                  id="field-guidance"
                                  value={draftColumn.extractionInstructions || draftColumn.description || ''}
                                  inputFields={getInputFields(fields)}
                                  onValueChange={(value) => setDraftColumn({ ...draftColumn, description: value, extractionInstructions: value })}
                                  placeholder="Explain what this field is and how to extract it. Type @ to mention input documents."
                                  rows={5}
                                />
                                {/* Input field hints */}
                                {getInputFields(fields).length > 0 && (
                                  <p className="text-xs text-slate-500">
                                    Type <kbd className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[10px]">@</kbd> to reference input documents
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    <div className="border-t border-slate-200/70 bg-white/95 px-6 py-4">
                      <div className="flex w-full flex-col gap-3 sm:flex-row sm:justify-end">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setIsColumnDialogOpen(false)
                            setDraftColumn(null)
                          }}
                        >
                          Cancel
                        </Button>
                        <Button
                          type="button"
                          onClick={() => {
                            if (!draftColumn) return

                            if (columnDialogMode === 'create') {
                              // Adding a new field
                              let newField: SchemaField

                              if (draftColumn.type === 'input') {
                                // Input field
                                const inputDraft = draftColumn as InputField
                                newField = {
                                  id: `input_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                                  name: inputDraft.name,
                                  type: 'input',
                                  inputType: inputDraft.inputType || 'document',
                                  description: inputDraft.description,
                                  required: !!inputDraft.required,
                                  fileConstraints: inputDraft.fileConstraints,
                                } as InputField
                              } else {
                                // Extraction or transformation field
                                newField = {
                                  id: `col_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                                  name: draftColumn.name,
                                  type: draftColumn.type,
                                  description: draftColumn.description,
                                  required: !!draftColumn.required,
                                  extractionInstructions: draftColumn.extractionInstructions,
                                  isTransformation: !!draftColumn.isTransformation,
                                  transformationType: draftColumn.transformationType,
                                  transformationConfig: draftColumn.transformationConfig,
                                  transformationSource: draftColumn.transformationSource,
                                  transformationSourceColumnId: draftColumn.transformationSourceColumnId,
                                } as SchemaField

                                // Add type-specific fields
                                if (draftColumn.type === 'object') {
                                  (newField as any).children = (draftColumn as ObjectField).children
                                }
                                if (draftColumn.type === 'table') {
                                  (newField as any).columns = (draftColumn as TableField).columns
                                }
                                if (draftColumn.type === 'list') {
                                  (newField as any).item = (draftColumn as ListField).item
                                }
                              }

                              commitSchemaUpdate(activeSchemaId, (schema) => ({
                                ...schema,
                                fields: [...schema.fields, newField]
                              }))
                            } else {
                              // Editing an existing field
                              if (!selectedColumn) return

                              if (draftColumn.type === 'input') {
                                // Input field updates
                                const inputDraft = draftColumn as InputField
                                const updates: Partial<InputField> = {
                                  name: inputDraft.name,
                                  type: 'input',
                                  inputType: inputDraft.inputType || 'document',
                                  description: inputDraft.description,
                                  required: !!inputDraft.required,
                                  fileConstraints: inputDraft.fileConstraints,
                                }
                                updateColumn(selectedColumn.id, updates as any)
                              } else {
                                // Extraction or transformation field updates
                                const updates: Partial<SchemaField> = {
                                  name: draftColumn.name,
                                  type: draftColumn.type,
                                  description: draftColumn.description,
                                  required: !!draftColumn.required,
                                  extractionInstructions: draftColumn.extractionInstructions,
                                  isTransformation: !!draftColumn.isTransformation,
                                  transformationType: draftColumn.transformationType,
                                  transformationConfig: draftColumn.transformationConfig,
                                  transformationSource: draftColumn.transformationSource,
                                  transformationSourceColumnId: draftColumn.transformationSourceColumnId,
                                }
                                if (draftColumn.type === 'object') {
                                  (updates as any).children = (draftColumn as ObjectField).children
                                }
                                if (draftColumn.type === 'table') {
                                  (updates as any).columns = (draftColumn as TableField).columns
                                }
                                if (draftColumn.type === 'list') {
                                  (updates as any).item = (draftColumn as ListField).item
                                }
                                updateColumn(selectedColumn.id, updates)
                              }
                            }

                            setIsColumnDialogOpen(false)
                            setDraftColumn(null)
                            setSelectedColumn(null)
                          }}
                        >
                          Save Field
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              )
            }
            {
              onCreateTemplate ? (
                <Dialog open={isTemplateDialogOpen} onOpenChange={(open) => {
                  if (isSavingTemplate) return
                  setIsTemplateDialogOpen(open)
                }}>
                  <DialogContent className="sm:max-w-[480px]">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <Sparkle className="h-4 w-4" />
                        Save as template
                      </DialogTitle>
                      <DialogDescription>
                        Capture the current schema fields and transformations so you can reuse them when creating a new project.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="template-name">Template name</Label>
                        <Input
                          id="template-name"
                          value={templateNameInput}
                          onChange={(event) => setTemplateNameInput(event.target.value)}
                          placeholder="Invoice – net terms"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="template-description">Description (optional)</Label>
                        <Textarea
                          id="template-description"
                          value={templateDescriptionInput}
                          onChange={(event) => setTemplateDescriptionInput(event.target.value)}
                          placeholder="What makes this schema unique or when it should be used?"
                          rows={3}
                        />
                      </div>
                      <div className="rounded-md border border-dashed border-muted-foreground/30 px-3 py-2 text-xs text-muted-foreground">
                        {fields.length === 0
                          ? "Templates save the schema layout. Add fields before saving."
                          : `This template will include ${fields.length} ${fields.length === 1 ? "field" : "fields"} along with any transformation settings.`}
                      </div>
                    </div>
                    <DialogFooter className="gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsTemplateDialogOpen(false)}
                        disabled={isSavingTemplate}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="button"
                        onClick={handleTemplateSave}
                        disabled={isSavingTemplate || fields.length === 0 || templateNameInput.trim().length === 0}
                      >
                        {isSavingTemplate ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkle className="mr-2 h-4 w-4" />}
                        Save template
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              ) : null
            }

            <OCRDetailModal
              open={isDetailOpen}
              onOpenChange={(open) => {
                setIsDetailOpen(open)
                if (!open) {
                  setSelectedJob(null)
                }
              }}
              job={selectedJob}
              schema={activeSchema}
            />

            {/* Table Modal */}
            <Dialog open={tableModalOpen} onOpenChange={setTableModalOpen}>
              <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Eye className="h-5 w-5" />
                    Table: {tableModalData?.column.name}
                  </DialogTitle>
                  <DialogDescription>
                    Inspect the parsed rows for this table field. Scroll to review every value.
                  </DialogDescription>
                </DialogHeader>
                <div className="overflow-auto max-h-[60vh]">
                  {tableModalData && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span>{tableModalData.rows.length} {tableModalData.rows.length === 1 ? 'row' : 'rows'}</span>
                        <span>{tableModalData.columnHeaders.length} columns</span>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="min-w-full border-separate border-spacing-y-2 text-sm">
                          <thead>
                            <tr className="text-xs uppercase tracking-wide text-muted-foreground">
                              {tableModalData.columnHeaders.map((header) => (
                                <th key={header.key} className="bg-slate-50 px-3 py-2 text-left font-medium first:rounded-l-md last:rounded-r-md border">
                                  {header.label}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {tableModalData.rows.map((row, idx) => (
                              <tr key={idx} className="hover:bg-slate-50/50">
                                {tableModalData.columnHeaders.map((header) => {
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
                                    <td key={header.key} className="px-3 py-2 text-left text-sm first:rounded-l-md last:rounded-r-md border">
                                      <span className="block" title={String(formatted)}>
                                        {String(formatted)}
                                      </span>
                                    </td>
                                  )
                                })}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              </DialogContent>
            </Dialog>

            {/* Column Right-Click Context Menu */}
            {
              contextMenuPosition && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={closeContextMenu}
                  />
                  <div
                    className="fixed z-50 bg-white border border-gray-200 rounded-md shadow-lg py-1 min-w-[160px]"
                    style={{
                      left: `${contextMenuPosition.x}px`,
                      top: `${contextMenuPosition.y}px`,
                    }}
                  >
                    <button
                      onClick={startGroupingFromContext}
                      className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center gap-2"
                    >
                      <Layers className="h-4 w-4" />
                      Create Object
                    </button>
                  </div>
                </>
              )
            }

            {/* Group Fields Dialog */}
            <Dialog open={isGroupDialogOpen} onOpenChange={(open) => {
              setIsGroupDialogOpen(open)
              if (!open) {
                setSelectedColumnIds(new Set())
                setGroupName('')
              }
            }}>
              <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle>Group Fields into Object</DialogTitle>
                  <DialogDescription>
                    Select the fields to group together, then provide a name for the object.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="rounded-md border p-3 max-h-60 overflow-y-auto">
                    <p className="text-sm font-medium mb-3">Select fields to group:</p>
                    <div className="space-y-2">
                      {fields.map((field) => (
                        <label key={field.id} className="flex items-center gap-3 cursor-pointer hover:bg-muted/50 p-2 rounded">
                          <Checkbox
                            checked={selectedColumnIds.has(field.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedColumnIds(prev => new Set([...prev, field.id]))
                              } else {
                                setSelectedColumnIds(prev => {
                                  const newSet = new Set(prev)
                                  newSet.delete(field.id)
                                  return newSet
                                })
                              }
                            }}
                          />
                          <div className="flex-1">
                            <div className="text-sm font-medium">{field.name}</div>
                            {field.type !== 'string' && (
                              <div className="text-xs text-muted-foreground capitalize">{field.type}</div>
                            )}
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  {selectedColumnIds.size >= 2 && (
                    <div>
                      <Label htmlFor="group-name">Object Name *</Label>
                      <Input
                        id="group-name"
                        value={groupName}
                        onChange={(e) => setGroupName(e.target.value)}
                        placeholder="e.g., Invoice Details, Customer Info"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && groupName.trim() && selectedColumnIds.size >= 2) {
                            createGroupedObject()
                          }
                        }}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        {selectedColumnIds.size} fields selected
                      </p>
                    </div>
                  )}

                  {selectedColumnIds.size < 2 && (
                    <p className="text-sm text-muted-foreground">
                      Select at least 2 fields to create a group.
                    </p>
                  )}
                </div>
                <div className="flex justify-end gap-2 mt-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsGroupDialogOpen(false)
                      setSelectedColumnIds(new Set())
                      setGroupName('')
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={createGroupedObject}
                    disabled={!groupName.trim() || selectedColumnIds.size < 2}
                  >
                    Create Object
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            <AlertDialog
              open={!!schemaDeletionDialog}
              onOpenChange={(open) => {
                if (!open) handleCancelSchemaDeletion()
              }}
            >
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete schema?</AlertDialogTitle>
                  <AlertDialogDescription asChild>
                    <p>
                      This will permanently remove "{schemaDeletionDialog?.name ?? "schema"}" and all associated jobs and
                      results.
                    </p>
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel onClick={handleCancelSchemaDeletion}>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    onClick={handleConfirmSchemaDeletion}
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}
      </div>

      {/* Template Selector Dialog */}
      <TemplateSelectorDialog
        open={isTemplateSelectorOpen}
        onOpenChange={setIsTemplateSelectorOpen}
        templates={combinedTemplates}
        isLoading={false}
        loadError={null}
        onRefreshTemplates={async () => { }}
        onChooseTemplate={handleChooseTemplate}
        onCreateBlank={handleCreateBlank}
      />

      {/* Manual Record Dialog */}
      <ManualRecordDialog
        open={isManualRecordOpen}
        onOpenChange={setIsManualRecordOpen}
        schema={activeSchema}
        onSave={handleSaveManualRecord}
      />

      {/* Multi-Document Upload Dialog */}
      <MultiDocumentUpload
        inputFields={getInputFields(fields)}
        open={isMultiDocUploadOpen}
        onOpenChange={setIsMultiDocUploadOpen}
        onUpload={(documents) => {
          const syntheticEvent = {
            target: { files: null },
          } as unknown as React.ChangeEvent<HTMLInputElement>
          void handleFileUpload(syntheticEvent, { inputDocuments: documents })
        }}
      />

      {/* Label Maker Dialog for GCC Food Label */}
      <ExtractionDetailDialog
        job={labelMakerJob}
        schema={activeSchema}
        onClose={() => {
          setLabelMakerJob(null)
          setIsLabelMakerNewRecord(false)
        }}
        defaultToLabelMaker={isLabelMakerNewRecord}
        onSaveLabelData={handleSaveLabelData}
      />
    </div >
  )
}
