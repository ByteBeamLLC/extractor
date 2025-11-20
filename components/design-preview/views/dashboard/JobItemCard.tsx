'use client'

import * as React from 'react'
import { Folder, Bot, MoreHorizontal, FileType } from 'lucide-react'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'

export type JobItemType = 'folder' | 'agent'

export interface JobItem {
    id: string
    type: JobItemType
    name: string
    description?: string
    itemCount?: number // For folders
    activeJobs?: number // For agents
    lastRun?: string // For agents
    status?: 'active' | 'idle' | 'error' // For agents
}

interface JobItemCardProps {
    item: JobItem
    onClick: (item: JobItem) => void
}

export function JobItemCard({ item, onClick }: JobItemCardProps) {
    return (
        <Card
            className="group relative overflow-hidden hover:shadow-md transition-all cursor-pointer border-muted hover:border-primary/50"
            onClick={() => onClick(item)}
        >
            <CardContent className="p-4">
                <div className="flex items-start justify-between">
                    <div className="p-2 rounded-lg bg-muted/50 group-hover:bg-primary/10 transition-colors">
                        {item.type === 'folder' ? (
                            <Folder className="h-8 w-8 text-blue-500" />
                        ) : (
                            <Bot className="h-8 w-8 text-purple-500" />
                        )}
                    </div>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2 -mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem>Rename</DropdownMenuItem>
                            <DropdownMenuItem>Move</DropdownMenuItem>
                            <DropdownMenuItem className="text-red-600">Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                <div className="mt-4 space-y-1">
                    <h3 className="font-medium truncate" title={item.name}>{item.name}</h3>
                    <p className="text-xs text-muted-foreground line-clamp-2 h-8">
                        {item.description || (item.type === 'folder' ? 'Folder' : 'Agent Workflow')}
                    </p>
                </div>
            </CardContent>

            <CardFooter className="p-4 pt-0 flex items-center justify-between text-xs text-muted-foreground">
                {item.type === 'folder' ? (
                    <span>{item.itemCount || 0} items</span>
                ) : (
                    <div className="flex items-center gap-2 w-full">
                        <Badge variant="secondary" className="text-[10px] h-5 px-1.5 font-normal">
                            {item.activeJobs || 0} Active Jobs
                        </Badge>
                        <span className="ml-auto">{item.lastRun}</span>
                    </div>
                )}
            </CardFooter>
        </Card>
    )
}
