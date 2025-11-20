"use client"

import { formatDistanceToNow } from "date-fns"
import { FileText, CheckCircle, AlertCircle, Clock, Loader2, MoreHorizontal } from "lucide-react"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { ExtractionJob } from "@/lib/schema"
import { cn } from "@/lib/utils"

interface GalleryViewProps {
    jobs: ExtractionJob[]
    onSelectJob: (job: ExtractionJob) => void
    onDeleteJob?: (jobId: string) => void
}

export function GalleryView({ jobs, onSelectJob, onDeleteJob }: GalleryViewProps) {
    if (jobs.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center text-muted-foreground">
                <div className="p-4 rounded-full bg-muted/50 mb-4">
                    <FileText className="h-8 w-8 opacity-50" />
                </div>
                <h3 className="text-lg font-medium mb-1">No documents yet</h3>
                <p className="text-sm max-w-sm">
                    Upload documents to see them here in the gallery view.
                </p>
            </div>
        )
    }

    return (
        <div className="p-6 overflow-y-auto h-full bg-muted/10">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                {jobs.map((job) => (
                    <GalleryCard
                        key={job.id}
                        job={job}
                        onClick={() => onSelectJob(job)}
                        onDelete={() => onDeleteJob?.(job.id)}
                    />
                ))}
            </div>
        </div>
    )
}

function GalleryCard({
    job,
    onClick,
    onDelete,
}: {
    job: ExtractionJob
    onClick: () => void
    onDelete?: () => void
}) {
    const isImage = job.fileName.match(/\.(jpg|jpeg|png|gif|webp)$/i)
    const isPdf = job.fileName.match(/\.pdf$/i)

    // Use the annotated image if available, otherwise original, otherwise placeholder
    const previewUrl = job.ocrAnnotatedImageUrl || job.originalFileUrl

    // Extract document title from results or use template name
    const getDocumentTitle = () => {
        if (job.results && typeof job.results === 'object') {
            // Try to find a meaningful title field
            const titleFields = ['product_name', 'name', 'title', 'document_title', 'product']
            for (const field of titleFields) {
                if (job.results[field] && typeof job.results[field] === 'string') {
                    return job.results[field]
                }
            }
            // If no title field, use the first non-empty string value
            const firstValue = Object.values(job.results).find(
                v => typeof v === 'string' && v.trim().length > 0
            )
            if (firstValue) return firstValue as string
        }
        // Fallback to agent type or "Document"
        return job.agentType === 'pharma' ? 'Pharmaceutical Product' : 'Document'
    }

    const documentTitle = getDocumentTitle()

    // Get file extension for chip
    const fileExtension = job.fileName.split('.').pop()?.toUpperCase() || 'FILE'

    return (
        <Card
            className="group relative overflow-hidden cursor-pointer transition-all hover:shadow-lg hover:border-primary/50 flex flex-col h-[280px]"
            onClick={onClick}
        >
            {/* Thumbnail - Large preview area (70% of card) */}
            <div className="relative h-[200px] w-full overflow-hidden flex items-center justify-center bg-gradient-to-br from-muted/20 to-muted/40">
                {previewUrl && isImage ? (
                    <img
                        src={previewUrl}
                        alt={documentTitle}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        loading="lazy"
                    />
                ) : isPdf && previewUrl ? (
                    <div className="flex flex-col items-center justify-center text-muted-foreground">
                        <FileText className="h-12 w-12 mb-2 opacity-50" />
                        <span className="text-xs uppercase font-medium opacity-70">PDF Document</span>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center text-muted-foreground">
                        <FileText className="h-12 w-12 mb-2 opacity-50" />
                        <span className="text-xs uppercase font-medium opacity-70">
                            {fileExtension}
                        </span>
                    </div>
                )}
            </div>

            {/* Compact metadata area - tight spacing */}
            <div className="p-2.5 flex flex-col gap-1.5 flex-1">
                {/* Row 1: Title (left) + Status (right) */}
                <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-sm leading-tight flex-1 line-clamp-1" title={documentTitle}>
                        {documentTitle}
                    </h3>
                    <StatusIndicator status={job.status} />
                </div>

                {/* Row 2: Filename + Timestamp */}
                <p className="text-xs text-muted-foreground truncate leading-tight" title={job.fileName}>
                    {job.fileName} • {job.createdAt ? formatDistanceToNow(new Date(job.createdAt), { addSuffix: true }) : 'Just now'}
                </p>

                {/* Row 3: Chips + Delete menu */}
                <div className="flex items-center justify-between gap-2 mt-auto">
                    <div className="flex items-center gap-1.5">
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 font-medium">
                            {job.agentType === 'pharma' ? 'Pharma' : 'Standard'}
                        </Badge>
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 font-medium">
                            {fileExtension}
                        </Badge>
                    </div>

                    {onDelete && (
                        <div onClick={(e) => e.stopPropagation()}>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <MoreHorizontal className="h-3.5 w-3.5" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem
                                        className="text-destructive focus:text-destructive"
                                        onClick={onDelete}
                                    >
                                        Delete
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    )}
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
