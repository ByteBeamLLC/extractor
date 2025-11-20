'use client'

import * as React from 'react'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { FileText, Link as LinkIcon, MoreHorizontal, FileType } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export interface KnowledgeItem {
    id: string
    name: string
    type: 'file' | 'link'
    status: 'indexed' | 'processing' | 'error' | 'pending'
    size?: string
    updated: string
    aiStatus: 'grounded' | 'analyzing' | 'ready'
}

interface KnowledgeHubTableProps {
    items: KnowledgeItem[]
    selectedItems: string[]
    onSelect: (id: string, checked: boolean) => void
    onSelectAll: (checked: boolean) => void
    onItemClick: (item: KnowledgeItem) => void
}

export function KnowledgeHubTable({
    items,
    selectedItems,
    onSelect,
    onSelectAll,
    onItemClick,
}: KnowledgeHubTableProps) {
    const allSelected = items.length > 0 && selectedItems.length === items.length

    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[40px]">
                            <Checkbox
                                checked={allSelected}
                                onCheckedChange={(checked) => onSelectAll(!!checked)}
                            />
                        </TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead className="w-[100px]">Status</TableHead>
                        <TableHead className="w-[100px]">AI Status</TableHead>
                        <TableHead className="w-[100px]">Size</TableHead>
                        <TableHead className="w-[150px]">Last Modified</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {items.map((item) => (
                        <TableRow
                            key={item.id}
                            data-state={selectedItems.includes(item.id) && 'selected'}
                            className="cursor-pointer hover:bg-muted/50"
                            onClick={() => onItemClick(item)}
                        >
                            <TableCell onClick={(e) => e.stopPropagation()}>
                                <Checkbox
                                    checked={selectedItems.includes(item.id)}
                                    onCheckedChange={(checked) => onSelect(item.id, !!checked)}
                                />
                            </TableCell>
                            <TableCell className="font-medium">
                                <div className="flex items-center gap-2">
                                    {item.type === 'file' ? (
                                        <FileText className="h-4 w-4 text-blue-500" />
                                    ) : (
                                        <LinkIcon className="h-4 w-4 text-green-500" />
                                    )}
                                    <span>{item.name}</span>
                                </div>
                            </TableCell>
                            <TableCell>
                                <Badge
                                    variant="secondary"
                                    className={`
                    ${item.status === 'indexed' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : ''}
                    ${item.status === 'processing' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : ''}
                    ${item.status === 'error' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : ''}
                    ${item.status === 'pending' ? 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400' : ''}
                  `}
                                >
                                    {item.status}
                                </Badge>
                            </TableCell>
                            <TableCell>
                                <div className="flex items-center gap-1.5">
                                    <div className={`h-2 w-2 rounded-full ${item.aiStatus === 'grounded' ? 'bg-purple-500' :
                                            item.aiStatus === 'analyzing' ? 'animate-pulse bg-yellow-500' :
                                                'bg-gray-300'
                                        }`} />
                                    <span className="text-xs capitalize text-muted-foreground">{item.aiStatus}</span>
                                </div>
                            </TableCell>
                            <TableCell className="text-muted-foreground text-xs">{item.size || '-'}</TableCell>
                            <TableCell className="text-muted-foreground text-xs">{item.updated}</TableCell>
                            <TableCell onClick={(e) => e.stopPropagation()}>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" className="h-8 w-8 p-0">
                                            <span className="sr-only">Open menu</span>
                                            <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem>View Details</DropdownMenuItem>
                                        <DropdownMenuItem>Re-index</DropdownMenuItem>
                                        <DropdownMenuItem className="text-red-600">Delete</DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    )
}
