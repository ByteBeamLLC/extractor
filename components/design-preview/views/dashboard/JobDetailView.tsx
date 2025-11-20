'use client'

import * as React from 'react'
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
    CheckCircle,
    AlertCircle
} from 'lucide-react'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface JobDetailViewProps {
    jobName: string
}

// Mock Data Interface
interface JobResult {
    id: string
    filename: string
    title: string
    status: 'processed' | 'processing' | 'error'
    createdAt: string
    previewUrl?: string
    type: 'pdf' | 'image'
}

export function JobDetailView({ jobName }: JobDetailViewProps) {
    // Mock data for the gallery
    const data: JobResult[] = Array.from({ length: 12 }).map((_, i) => ({
        id: `doc-${i}`,
        filename: `Invoice_${2024001 + i}.pdf`,
        title: ['Acme Corp Invoice', 'Global Supplies Receipt', 'Tech Solutions Contract'][i % 3],
        status: ['processed', 'processing', 'error'][i % 3] as any,
        createdAt: '2 hours ago',
        type: i % 4 === 0 ? 'image' : 'pdf',
        previewUrl: i % 4 === 0 ? 'https://placehold.co/400x300/png' : undefined
    }))

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
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" className="h-9">
                        <Download className="h-3.5 w-3.5 mr-2" />
                        Export
                    </Button>
                    <Button size="sm" className="h-9">
                        <Plus className="h-3.5 w-3.5 mr-2" />
                        Upload
                    </Button>
                </div>
            </div>

            {/* Gallery Grid */}
            <div className="flex-1 overflow-y-auto p-6 bg-muted/10">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                    {data.map((item) => (
                        <JobResultCard key={item.id} item={item} />
                    ))}
                </div>
            </div>
        </div>
    )
}

function JobResultCard({ item }: { item: JobResult }) {
    return (
        <Card className="group relative overflow-hidden cursor-pointer transition-all hover:shadow-lg hover:border-primary/50 flex flex-col h-[280px]">
            {/* Thumbnail */}
            <div className="relative h-[200px] w-full overflow-hidden flex items-center justify-center bg-gradient-to-br from-muted/20 to-muted/40">
                {item.type === 'image' && item.previewUrl ? (
                    <div className="w-full h-full bg-muted flex items-center justify-center text-muted-foreground">
                        {/* Placeholder for actual image since we don't have real URLs */}
                        <FileText className="h-12 w-12 opacity-50" />
                    </div>
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
        case "processed":
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
            return null
    }
}
