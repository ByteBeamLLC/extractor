'use client'

import * as React from 'react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
    X,
    FileText,
    Link as LinkIcon,
    Calendar,
    HardDrive,
    Bot,
    ExternalLink,
    Search,
    Tag
} from 'lucide-react'
import { KnowledgeItem } from './KnowledgeHubTable'

interface KnowledgeDetailsPanelProps {
    item: KnowledgeItem | null
    onClose: () => void
}

export function KnowledgeDetailsPanel({ item, onClose }: KnowledgeDetailsPanelProps) {
    if (!item) {
        return (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground p-8 text-center border-l bg-muted/5">
                <Search className="h-12 w-12 mb-4 opacity-20" />
                <p className="text-sm">Select an item to view details and AI insights</p>
            </div>
        )
    }

    return (
        <div className="h-full flex flex-col border-l bg-background w-[350px]">
            <div className="flex items-center justify-between p-4 border-b">
                <h3 className="font-semibold text-sm">Item Details</h3>
                <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
                    <X className="h-4 w-4" />
                </Button>
            </div>

            <ScrollArea className="flex-1">
                <div className="p-4 space-y-6">
                    {/* Header Info */}
                    <div className="flex flex-col items-center text-center space-y-2">
                        <div className="h-16 w-16 rounded-lg bg-muted flex items-center justify-center">
                            {item.type === 'file' ? (
                                <FileText className="h-8 w-8 text-blue-500" />
                            ) : (
                                <LinkIcon className="h-8 w-8 text-green-500" />
                            )}
                        </div>
                        <div>
                            <h4 className="font-medium text-base">{item.name}</h4>
                            <p className="text-xs text-muted-foreground uppercase tracking-wider mt-1">{item.type}</p>
                        </div>
                    </div>

                    <Separator />

                    {/* Metadata */}
                    <div className="space-y-3">
                        <h5 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Metadata</h5>
                        <div className="grid gap-2 text-sm">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center text-muted-foreground">
                                    <Calendar className="h-3.5 w-3.5 mr-2" />
                                    Updated
                                </div>
                                <span>{item.updated}</span>
                            </div>
                            {item.size && (
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center text-muted-foreground">
                                        <HardDrive className="h-3.5 w-3.5 mr-2" />
                                        Size
                                    </div>
                                    <span>{item.size}</span>
                                </div>
                            )}
                            <div className="flex items-center justify-between">
                                <div className="flex items-center text-muted-foreground">
                                    <Bot className="h-3.5 w-3.5 mr-2" />
                                    AI Status
                                </div>
                                <span className="capitalize">{item.aiStatus}</span>
                            </div>
                        </div>
                    </div>

                    <Separator />

                    {/* AI Insights / Visual Grounding Mock */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <h5 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">AI Extraction</h5>
                            <span className="text-[10px] bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 px-1.5 py-0.5 rounded-full">98% Conf.</span>
                        </div>

                        <div className="space-y-2">
                            <div className="rounded-md bg-muted/50 p-3 text-xs space-y-2 border">
                                <div className="flex items-center gap-1.5 text-purple-600 dark:text-purple-400 font-medium">
                                    <Tag className="h-3 w-3" />
                                    <span>Key Entities</span>
                                </div>
                                <div className="flex flex-wrap gap-1">
                                    <span className="px-1.5 py-0.5 bg-background border rounded text-[10px]">Invoice #001</span>
                                    <span className="px-1.5 py-0.5 bg-background border rounded text-[10px]">Acme Corp</span>
                                    <span className="px-1.5 py-0.5 bg-background border rounded text-[10px]">$2,500.00</span>
                                </div>
                            </div>

                            <div className="rounded-md bg-muted/50 p-3 text-xs space-y-2 border">
                                <div className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 font-medium">
                                    <FileText className="h-3 w-3" />
                                    <span>Summary</span>
                                </div>
                                <p className="text-muted-foreground leading-relaxed">
                                    This document appears to be a Q4 financial report containing revenue projections and expense breakdowns.
                                </p>
                            </div>
                        </div>
                    </div>

                    <Button className="w-full" variant="outline">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Open Original
                    </Button>
                </div>
            </ScrollArea>
        </div>
    )
}
