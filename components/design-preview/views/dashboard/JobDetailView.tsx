import { useEffect, useState, useMemo } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
    Search,
    Filter,
    Download,
    MoreHorizontal,
    Plus,
    FileText,
    Loader2,
    LayoutGrid,
    List as ListIcon,
    Table as TableIcon
} from 'lucide-react'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useSupabaseClient } from '@/lib/supabase/hooks'
import { formatDistanceToNow } from 'date-fns'
import { TanStackGridSheet } from '@/components/tanstack-grid/TanStackGridSheet'
import {
    SchemaDefinition,
    ExtractionJob,
    SchemaField,
    flattenFields,
    updateFieldById,
    removeFieldById,
    FieldReviewStatus
} from '@/lib/schema'
import { extractResultsMeta, mergeResultsWithMeta } from '@/lib/extraction-results'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { SchemaFieldEditor } from './SchemaFieldEditor'

interface JobDetailViewProps {
    jobName: string
    schemaId?: string
}

interface JobResult {
    id: string
    filename: string
    title: string
    status: 'completed' | 'processing' | 'error' | 'pending'
    createdAt: string
    previewUrl?: string
    type: 'pdf' | 'image'
    originalJob: ExtractionJob
}

export function JobDetailView({ jobName, schemaId }: JobDetailViewProps) {
    const supabase = useSupabaseClient()
    const [jobs, setJobs] = useState<JobResult[]>([])
    const [extractionJobs, setExtractionJobs] = useState<ExtractionJob[]>([])
    const [schema, setSchema] = useState<SchemaDefinition | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [viewMode, setViewMode] = useState<'grid' | 'gallery'>('grid')
    const [expandedRowId, setExpandedRowId] = useState<string | null>(null)
    const [selectedRowId, setSelectedRowId] = useState<string | null>(null)
    const [isColumnEditorOpen, setIsColumnEditorOpen] = useState(false)
    const [editingColumn, setEditingColumn] = useState<SchemaField | undefined>(undefined)

    useEffect(() => {
        if (!schemaId) return

        const fetchData = async () => {
            setIsLoading(true)

            // Fetch Schema Definition
            const { data: schemaData, error: schemaError } = await supabase
                .from('schemas')
                .select('*')
                .eq('id', schemaId)
                .single()

            if (schemaData) {
                setSchema({
                    id: schemaData.id,
                    name: schemaData.name,
                    fields: schemaData.fields as unknown as SchemaField[],
                    jobs: [], // Will be populated separately
                    templateId: schemaData.template_id,
                    visualGroups: schemaData.visual_groups as any,
                    createdAt: schemaData.created_at ? new Date(schemaData.created_at) : undefined,
                    updatedAt: schemaData.updated_at ? new Date(schemaData.updated_at) : undefined,
                })
            }

            // Fetch Jobs
            const { data: jobsData, error: jobsError } = await supabase
                .from('extraction_jobs')
                .select('*')
                .eq('schema_id', schemaId)
                .order('created_at', { ascending: false })

            if (jobsData) {
                const parsedJobs: ExtractionJob[] = jobsData.map((row: any) => {
                    const raw = (row.results as Record<string, any> | null) ?? undefined
                    const { values, meta } = extractResultsMeta(raw)
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
                    }
                })
                setExtractionJobs(parsedJobs)

                const mappedJobs: JobResult[] = parsedJobs.map((job) => ({
                    id: job.id,
                    filename: job.fileName,
                    title: job.fileName,
                    status: job.status,
                    createdAt: job.createdAt ? formatDistanceToNow(job.createdAt, { addSuffix: true }) : 'Unknown',
                    type: job.fileName.toLowerCase().endsWith('.pdf') ? 'pdf' : 'image',
                    previewUrl: job.ocrAnnotatedImageUrl || undefined,
                    originalJob: job
                }))
                setJobs(mappedJobs)
            }
            setIsLoading(false)
        }

        fetchData()
    }, [schemaId, supabase])

    const flattenedFields = useMemo(() => {
        if (!schema?.fields) return []
        return flattenFields(schema.fields)
    }, [schema?.fields])

    const handleUpdateCell = async (jobId: string, fieldId: string, value: any) => {
        // Optimistic update
        setExtractionJobs(prev => prev.map(job => {
            if (job.id !== jobId) return job
            return {
                ...job,
                results: {
                    ...job.results,
                    [fieldId]: value
                }
            }
        }))

        // Find the job to update
        const jobToUpdate = extractionJobs.find(j => j.id === jobId)
        if (!jobToUpdate) return

        const newResults = {
            ...jobToUpdate.results,
            [fieldId]: value
        }

        // Merge with meta for storage
        const payload = mergeResultsWithMeta(newResults, {
            review: jobToUpdate.review,
            confidence: undefined // We don't track confidence updates here yet
        })

        const { error } = await supabase
            .from('extraction_jobs')
            .update({ results: payload })
            .eq('id', jobId)

        if (error) {
            toast.error('Failed to update cell')
            // Revert optimistic update (optional, but good practice)
        }
    }

    const handleUpdateReviewStatus = async (jobId: string, fieldId: string, status: FieldReviewStatus) => {
        setExtractionJobs(prev => prev.map(job => {
            if (job.id !== jobId) return job
            return {
                ...job,
                review: {
                    ...job.review,
                    [fieldId]: {
                        ...(job.review?.[fieldId] || {}),
                        status,
                        updatedAt: new Date().toISOString()
                    }
                }
            }
        }))

        const jobToUpdate = extractionJobs.find(j => j.id === jobId)
        if (!jobToUpdate) return

        const newReview = {
            ...jobToUpdate.review,
            [fieldId]: {
                ...(jobToUpdate.review?.[fieldId] || {}),
                status,
                updatedAt: new Date().toISOString()
            }
        }

        const payload = mergeResultsWithMeta(jobToUpdate.results || {}, {
            review: newReview
        })

        const { error } = await supabase
            .from('extraction_jobs')
            .update({ results: payload })
            .eq('id', jobId)

        if (error) {
            toast.error('Failed to update review status')
        }
    }

    const handleDeleteColumn = async (columnId: string) => {
        if (!schema) return

        const newFields = removeFieldById(schema.fields, columnId)
        setSchema({ ...schema, fields: newFields })

        const { error } = await supabase
            .from('schemas')
            .update({ fields: newFields as any })
            .eq('id', schema.id)

        if (error) {
            toast.error('Failed to delete column')
        } else {
            toast.success('Column deleted')
        }
    }

    const handleAddColumn = () => {
        setEditingColumn(undefined)
        setIsColumnEditorOpen(true)
    }

    const handleEditColumn = (column: any) => {
        // TanStackGridSheet passes the column object (FlatLeaf)
        // We need to find the original field in the schema to edit it properly
        // (FlatLeaf is a flattened version, but for editing we want the source field if possible,
        // though for leaf fields they are mostly the same)
        if (!schema) return
        const field = schema.fields.find(f => f.id === column.id)

        // If it's a nested field, we might need to handle it differently or just edit the leaf constraints
        // For now, let's support top-level fields or simple editing
        if (field) {
            setEditingColumn(field)
            setIsColumnEditorOpen(true)
        } else {
            toast.info('Editing nested fields directly is not yet supported. Please edit the parent object.')
        }
    }

    const handleSaveColumn = async (field: SchemaField) => {
        if (!schema) return

        let newFields = [...schema.fields]
        if (editingColumn) {
            // Update existing
            newFields = updateFieldById(newFields, editingColumn.id, () => field)
        } else {
            // Add new
            newFields.push(field)
        }

        setSchema({ ...schema, fields: newFields })
        setIsColumnEditorOpen(false)

        const { error } = await supabase
            .from('schemas')
            .update({ fields: newFields as any })
            .eq('id', schema.id)

        if (error) {
            toast.error('Failed to save column')
            // Revert (optional)
        } else {
            toast.success('Column saved')
        }
    }

    const handleExport = () => {
        if (!schema || extractionJobs.length === 0) return

        const headers = flattenedFields.map(f => f.name).join(',')
        const rows = extractionJobs.map(job => {
            return flattenedFields.map(f => {
                const val = job.results?.[f.id]
                if (val === null || val === undefined) return ''
                if (typeof val === 'object') return JSON.stringify(val).replace(/"/g, '""') // Escape quotes
                return `"${String(val).replace(/"/g, '""')}"`
            }).join(',')
        }).join('\n')

        const csvContent = `${headers}\n${rows}`
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
        const link = document.createElement('a')
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob)
            link.setAttribute('href', url)
            link.setAttribute('download', `${schema.name}_export.csv`)
            link.style.visibility = 'hidden'
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
        }
    }

    return (
        <div className="h-full flex flex-col bg-background">
            {/* Toolbar */}
            <div className="h-14 border-b flex items-center justify-between px-6 shrink-0">
                <div className="flex items-center gap-2">
                    <div className="relative w-64">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input placeholder="Search extractions..." className="pl-8 h-9" />
                    </div>
                    <Button variant="outline" size="sm" className="h-9 border-dashed">
                        <Filter className="h-3.5 w-3.5 mr-2" />
                        Filter
                    </Button>
                    <Separator orientation="vertical" className="h-6 mx-2" />
                    <div className="flex items-center bg-muted/50 rounded-lg p-1">
                        <Button
                            variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                            size="sm"
                            className="h-7 px-2"
                            onClick={() => setViewMode('grid')}
                        >
                            <TableIcon className="h-3.5 w-3.5 mr-1.5" />
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
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" className="h-9" onClick={handleExport}>
                        <Download className="h-3.5 w-3.5 mr-2" />
                        Export
                    </Button>
                    <Button size="sm" className="h-9">
                        <Plus className="h-3.5 w-3.5 mr-2" />
                        Upload
                    </Button>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-hidden bg-muted/10">
                {isLoading ? (
                    <div className="flex items-center justify-center h-full">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                ) : jobs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                        <FileText className="h-12 w-12 mb-4 opacity-20" />
                        <p>No extractions found</p>
                    </div>
                ) : viewMode === 'grid' && schema ? (
                    <div className="h-full w-full">
                        <TanStackGridSheet
                            schemaId={schema.id}
                            columns={flattenedFields}
                            jobs={extractionJobs}
                            selectedRowId={selectedRowId}
                            onSelectRow={setSelectedRowId}
                            onRowDoubleClick={(job) => setSelectedRowId(job.id)}
                            onAddColumn={handleAddColumn}
                            renderCellValue={(col, job) => {
                                const val = job.results?.[col.id]
                                return <span className="truncate block px-2 text-sm">{String(val ?? '')}</span>
                            }}
                            getStatusIcon={() => null}
                            renderStatusPill={() => null}
                            onEditColumn={handleEditColumn}
                            onDeleteColumn={handleDeleteColumn}
                            onUpdateCell={handleUpdateCell}
                            onUpdateReviewStatus={handleUpdateReviewStatus}
                            onColumnRightClick={() => { }}
                            onOpenTableModal={() => { }}
                            visualGroups={schema.visualGroups || []}
                            expandedRowId={expandedRowId}
                            onToggleRowExpansion={(id) => setExpandedRowId(prev => prev === id ? null : id)}
                        />
                    </div>
                ) : (
                    <div className="h-full overflow-y-auto p-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                            {jobs.map((item) => (
                                <JobResultCard key={item.id} item={item} />
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <Dialog open={isColumnEditorOpen} onOpenChange={setIsColumnEditorOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{editingColumn ? 'Edit Column' : 'Add New Column'}</DialogTitle>
                    </DialogHeader>
                    <SchemaFieldEditor
                        initialField={editingColumn}
                        onSave={handleSaveColumn}
                        onCancel={() => setIsColumnEditorOpen(false)}
                    />
                </DialogContent>
            </Dialog>
        </div>
    )
}

function JobResultCard({ item }: { item: JobResult }) {
    return (
        <Card className="group relative overflow-hidden cursor-pointer transition-all hover:shadow-lg hover:border-primary/50 flex flex-col h-[280px]">
            {/* Thumbnail */}
            <div className="relative h-[200px] w-full overflow-hidden flex items-center justify-center bg-gradient-to-br from-muted/20 to-muted/40">
                {item.type === 'image' && item.previewUrl ? (
                    <img src={item.previewUrl} alt={item.title} className="w-full h-full object-cover" />
                ) : (
                    <div className="flex flex-col items-center justify-center text-muted-foreground">
                        <FileText className="h-12 w-12 mb-2 opacity-50" />
                        <span className="text-xs uppercase font-medium opacity-70">PDF Document</span>
                    </div>
                )}
            </div>

            {/* Metadata */}
            <div className="p-2.5 flex flex-col gap-1.5 flex-1">
                <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-sm leading-tight flex-1 line-clamp-1" title={item.title}>
                        {item.title}
                    </h3>
                    <StatusIndicator status={item.status} />
                </div>

                <p className="text-xs text-muted-foreground truncate leading-tight" title={item.filename}>
                    {item.filename} • {item.createdAt}
                </p>

                <div className="flex items-center justify-between gap-2 mt-auto">
                    <div className="flex items-center gap-1.5">
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 font-medium">
                            Standard
                        </Badge>
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 font-medium">
                            {item.type.toUpperCase()}
                        </Badge>
                    </div>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity">
                                <MoreHorizontal className="h-3.5 w-3.5" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem className="text-red-600">Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        </Card>
    )
}

function StatusIndicator({ status }: { status: string }) {
    switch (status) {
        case "completed":
            return (
                <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-400">
                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span>Ready</span>
                </div>
            )
        case "processing":
            return (
                <div className="flex items-center gap-1.5 text-xs font-medium text-blue-700 dark:text-blue-400">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    <span>Processing</span>
                </div>
            )
        case "error":
            return (
                <div className="flex items-center gap-1.5 text-xs font-medium text-red-700 dark:text-red-400">
                    <div className="w-2 h-2 rounded-full bg-red-500" />
                    <span>Error</span>
                </div>
            )
        default:
            return (
                <div className="flex items-center gap-1.5 text-xs font-medium text-gray-700 dark:text-gray-400">
                    <div className="w-2 h-2 rounded-full bg-gray-400" />
                    <span>Pending</span>
                </div>
            )
    }
}
