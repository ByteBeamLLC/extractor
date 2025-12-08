"use client"

import { formatDistanceToNow } from "date-fns"
import { FileText, Loader2 } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { ExtractionJob, SchemaDefinition, SchemaField } from "@/lib/schema"
import { flattenFields } from "@/lib/schema"
import { cn } from "@/lib/utils"

interface MissionControlViewProps {
    jobs: ExtractionJob[]
    schema: SchemaDefinition
    onSelectJob: (job: ExtractionJob) => void
}

export function MissionControlView({ jobs, schema, onSelectJob }: MissionControlViewProps) {
    const fields = flattenFields(schema.fields)

    if (jobs.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center text-muted-foreground">
                <div className="p-4 rounded-full bg-muted/50 mb-4">
                    <FileText className="h-8 w-8 opacity-50" />
                </div>
                <h3 className="text-lg font-medium mb-1">No documents yet</h3>
                <p className="text-sm max-w-sm">
                    Upload documents to see them in Mission Control view.
                </p>
            </div>
        )
    }

    return (
        <div className="p-6 overflow-y-auto h-full bg-muted/10">
            <div className="space-y-8">
                {jobs.map((job) => (
                    <MissionControlDocumentPanel
                        key={job.id}
                        job={job}
                        fields={fields}
                        onClick={() => onSelectJob(job)}
                    />
                ))}
            </div>
        </div>
    )
}

interface MissionControlDocumentPanelProps {
    job: ExtractionJob
    fields: SchemaField[]
    onClick: () => void
}

function MissionControlDocumentPanel({ job, fields, onClick }: MissionControlDocumentPanelProps) {
    const isImage = job.fileName.match(/\.(jpg|jpeg|png|gif|webp)$/i)
    const previewUrl = job.ocrAnnotatedImageUrl || job.originalFileUrl
    const fileExtension = job.fileName.split('.').pop()?.toUpperCase() || 'FILE'

    return (
        <Card
            className="p-4 cursor-pointer transition-all hover:shadow-lg hover:border-primary/50"
            onClick={onClick}
        >
            {/* Header with document name and status */}
            <div className="flex items-center justify-between mb-4 pb-3 border-b">
                <div className="flex items-center gap-3">
                    <h3 className="font-semibold text-base truncate max-w-md" title={job.fileName}>
                        {job.fileName}
                    </h3>
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 font-medium">
                        {fileExtension}
                    </Badge>
                </div>
                <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground">
                        {job.createdAt ? formatDistanceToNow(new Date(job.createdAt), { addSuffix: true }) : 'Just now'}
                    </span>
                    <StatusLight status={job.status} />
                </div>
            </div>

            {/* Panel Grid - Source document first, then fields */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                {/* Source Document Panel - First position */}
                <SourceDocumentPanel
                    previewUrl={previewUrl}
                    isImage={!!isImage}
                    fileExtension={fileExtension}
                />

                {/* Field Panels */}
                {fields.map((field) => (
                    <FieldPanel
                        key={field.id}
                        field={field}
                        value={job.results?.[field.id]}
                    />
                ))}
            </div>
        </Card>
    )
}

interface SourceDocumentPanelProps {
    previewUrl?: string | null
    isImage: boolean
    fileExtension: string
}

function SourceDocumentPanel({ previewUrl, isImage, fileExtension }: SourceDocumentPanelProps) {
    return (
        <div className="bg-muted/30 rounded-lg border border-border/50 overflow-hidden flex flex-col">
            {/* Panel Header */}
            <div className="px-2.5 py-1.5 border-b border-border/50 bg-muted/20">
                <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
                    Source
                </span>
            </div>

            {/* Preview Content */}
            <div className="flex-1 min-h-[100px] flex items-center justify-center p-2">
                {previewUrl && isImage ? (
                    <img
                        src={previewUrl}
                        alt="Source document"
                        className="w-full h-full object-cover rounded max-h-[120px]"
                        loading="lazy"
                    />
                ) : (
                    <div className="flex flex-col items-center justify-center text-muted-foreground">
                        <FileText className="h-8 w-8 mb-1 opacity-50" />
                        <span className="text-[10px] uppercase font-medium opacity-70">
                            {fileExtension}
                        </span>
                    </div>
                )}
            </div>
        </div>
    )
}

interface FieldPanelProps {
    field: SchemaField
    value: any
}

function FieldPanel({ field, value }: FieldPanelProps) {
    const isEmpty = value === null || value === undefined || value === ''
    const isObject = typeof value === 'object' && value !== null
    const isArray = Array.isArray(value)

    // Format display value
    const getDisplayValue = () => {
        if (isEmpty) return '—'
        if (isArray) return `${value.length} items`
        if (isObject) return JSON.stringify(value, null, 2)
        return String(value)
    }

    const displayValue = getDisplayValue()
    const isCode = isObject && !isArray

    return (
        <div className="bg-muted/30 rounded-lg border border-border/50 overflow-hidden flex flex-col">
            {/* Panel Header */}
            <div className="px-2.5 py-1.5 border-b border-border/50 bg-muted/20 flex items-center justify-between">
                <span
                    className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide truncate"
                    title={field.name}
                >
                    {field.name}
                </span>
                {field.type && (
                    <span className="text-[9px] text-muted-foreground/60 ml-1">
                        {field.type}
                    </span>
                )}
            </div>

            {/* Value Content */}
            <div className="flex-1 min-h-[60px] p-2.5">
                {isCode ? (
                    <pre className="text-[10px] font-mono text-foreground/80 overflow-hidden line-clamp-4 whitespace-pre-wrap">
                        {displayValue}
                    </pre>
                ) : isArray ? (
                    <div className="flex items-center gap-1">
                        <Badge variant="secondary" className="text-[10px] h-5">
                            {displayValue}
                        </Badge>
                    </div>
                ) : (
                    <p className={cn(
                        "text-sm leading-tight",
                        isEmpty ? "text-muted-foreground/50 italic" : "text-foreground"
                    )}>
                        {displayValue.length > 80 ? displayValue.slice(0, 80) + '...' : displayValue}
                    </p>
                )}
            </div>
        </div>
    )
}

function StatusLight({ status }: { status: string }) {
    const config = {
        completed: { color: 'bg-emerald-500', label: 'Completed' },
        processing: { color: 'bg-blue-500', label: 'Processing', animate: true },
        error: { color: 'bg-red-500', label: 'Error' },
        pending: { color: 'bg-gray-400', label: 'Pending' },
    }[status] || { color: 'bg-gray-400', label: 'Unknown' }

    return (
        <div className="flex items-center gap-1.5" title={config.label}>
            {status === 'processing' ? (
                <Loader2 className="w-3 h-3 animate-spin text-blue-500" />
            ) : (
                <div className={cn("w-2.5 h-2.5 rounded-full", config.color)} />
            )}
            <span className="text-xs text-muted-foreground">{config.label}</span>
        </div>
    )
}
