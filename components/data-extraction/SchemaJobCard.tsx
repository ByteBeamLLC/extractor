'use client'

import * as React from 'react'
import { Bot, MoreHorizontal, FileText, Activity, Clock } from 'lucide-react'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { formatDistanceToNow } from 'date-fns'
import { SchemaDefinition } from '@/lib/schema'

interface SchemaJobCardProps {
    schema: SchemaDefinition
    onClick: (schema: SchemaDefinition) => void
    onDelete?: (schema: SchemaDefinition) => void
    onRename?: (schema: SchemaDefinition) => void
}

export function SchemaJobCard({ schema, onClick, onDelete, onRename }: SchemaJobCardProps) {
    const lastModified = schema.updatedAt
        ? formatDistanceToNow(new Date(schema.updatedAt), { addSuffix: true })
        : 'Unknown'

    const jobCount = schema.jobs?.length || 0
    const activeJobs = schema.jobs?.filter(j => j.status === 'processing').length || 0
    const completedJobs = schema.jobs?.filter(j => j.status === 'completed').length || 0

    // Determine status based on recent activity
    const status = activeJobs > 0 ? 'processing' : 'idle'

    return (
        <Card
            className="group relative overflow-hidden hover:shadow-md transition-all cursor-pointer border-muted hover:border-primary/50 flex flex-col h-[220px]"
            onClick={() => onClick(schema)}
        >
            <CardContent className="p-5 flex-1">
                <div className="flex items-start justify-between mb-4">
                    <div className="p-2.5 rounded-xl bg-primary/5 group-hover:bg-primary/10 transition-colors">
                        {schema.templateId?.includes('pharma') ? (
                            <Activity className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                        ) : (
                            <Bot className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                        )}
                    </div>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 -mr-2 -mt-2 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={(e) => {
                                e.stopPropagation()
                                onRename?.(schema)
                            }}>
                                Rename
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                className="text-red-600 focus:text-red-600"
                                onClick={(e) => {
                                    e.stopPropagation()
                                    onDelete?.(schema)
                                }}
                            >
                                Delete
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                <div className="space-y-1.5">
                    <h3 className="font-semibold text-base truncate leading-tight" title={schema.name}>
                        {schema.name}
                    </h3>
                    <p className="text-xs text-muted-foreground line-clamp-2 h-8 leading-relaxed">
                        {schema.templateId
                            ? (schema.templateId.includes('pharma') ? 'Pharmaceutical Data Extraction' : 'Standard Data Extraction')
                            : 'Custom Extraction Schema'}
                    </p>
                </div>
            </CardContent>

            <CardFooter className="p-4 pt-0 mt-auto flex items-center justify-between text-xs text-muted-foreground border-t bg-muted/5 h-12">
                <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-[10px] h-5 px-1.5 font-normal bg-background border-border/50">
                        {jobCount} Docs
                    </Badge>
                    {activeJobs > 0 && (
                        <Badge variant="outline" className="text-[10px] h-5 px-1.5 font-normal text-blue-600 border-blue-200 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-800">
                            {activeJobs} Active
                        </Badge>
                    )}
                </div>
                <div className="flex items-center gap-1 opacity-70" title={`Last updated ${lastModified}`}>
                    <Clock className="h-3 w-3" />
                    <span>{lastModified.replace('about ', '')}</span>
                </div>
            </CardFooter>
        </Card>
    )
}
