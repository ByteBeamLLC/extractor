"use client"

import { useState } from "react"
import { ChevronRight, ChevronDown, Table as TableIcon, List as ListIcon, Globe, Calendar, Hash, Type, ToggleLeft, Link, Mail, Phone, MapPin } from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"

interface ExtractionResultsViewProps {
    results: Record<string, any>
    schemaFields?: any[] // Optional schema to provide labels/types
}

export function ExtractionResultsView({ results, schemaFields }: ExtractionResultsViewProps) {
    if (!results || Object.keys(results).length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center text-muted-foreground">
                <p>No extraction results available.</p>
            </div>
        )
    }

    return (
        <ScrollArea className="h-full">
            <div className="p-6 space-y-6">
                {Object.entries(results).map(([key, value]) => (
                    <ResultItem key={key} label={key} value={value} />
                ))}
            </div>
        </ScrollArea>
    )
}

function ResultItem({ label, value, level = 0 }: { label: string; value: any; level?: number }) {
    const [isExpanded, setIsExpanded] = useState(true)

    if (value === null || value === undefined) {
        return null
    }

    const isObject = typeof value === 'object' && value !== null && !Array.isArray(value)
    const isArray = Array.isArray(value)

    // Determine if it's a "complex" array (table/list of objects) or simple array
    const isComplexArray = isArray && value.length > 0 && typeof value[0] === 'object'

    if (isObject) {
        return (
            <div className={cn("border rounded-lg overflow-hidden bg-card", level > 0 && "ml-4 mt-2")}>
                <div
                    className="flex items-center gap-2 p-3 bg-muted/30 cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => setIsExpanded(!isExpanded)}
                >
                    {isExpanded ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                    <Globe className="h-4 w-4 text-blue-500" />
                    <span className="font-medium text-sm">{prettifyKey(label)}</span>
                    <Badge variant="outline" className="ml-auto text-[10px] h-5">Object</Badge>
                </div>

                {isExpanded && (
                    <div className="p-3 border-t bg-background space-y-3">
                        {Object.entries(value).map(([k, v]) => (
                            <ResultItem key={k} label={k} value={v} level={level + 1} />
                        ))}
                    </div>
                )}
            </div>
        )
    }

    if (isComplexArray) {
        return (
            <div className={cn("border rounded-lg overflow-hidden bg-card", level > 0 && "ml-4 mt-2")}>
                <div
                    className="flex items-center gap-2 p-3 bg-muted/30 cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => setIsExpanded(!isExpanded)}
                >
                    {isExpanded ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                    <TableIcon className="h-4 w-4 text-emerald-500" />
                    <span className="font-medium text-sm">{prettifyKey(label)}</span>
                    <Badge variant="outline" className="ml-auto text-[10px] h-5">{value.length} items</Badge>
                </div>

                {isExpanded && (
                    <div className="border-t bg-background overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    {Object.keys(value[0] || {}).map((header) => (
                                        <TableHead key={header} className="whitespace-nowrap">{prettifyKey(header)}</TableHead>
                                    ))}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {value.map((row: any, i: number) => (
                                    <TableRow key={i}>
                                        {Object.values(row).map((cell: any, j: number) => (
                                            <TableCell key={j} className="whitespace-nowrap">
                                                {typeof cell === 'object' ? JSON.stringify(cell) : String(cell)}
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </div>
        )
    }

    if (isArray) {
        return (
            <div className={cn("border rounded-lg overflow-hidden bg-card", level > 0 && "ml-4 mt-2")}>
                <div
                    className="flex items-center gap-2 p-3 bg-muted/30 cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => setIsExpanded(!isExpanded)}
                >
                    {isExpanded ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                    <ListIcon className="h-4 w-4 text-orange-500" />
                    <span className="font-medium text-sm">{prettifyKey(label)}</span>
                    <Badge variant="outline" className="ml-auto text-[10px] h-5">{value.length} items</Badge>
                </div>

                {isExpanded && (
                    <div className="p-3 border-t bg-background">
                        <div className="flex flex-wrap gap-2">
                            {value.map((item: any, i: number) => (
                                <Badge
                                    key={i}
                                    variant="secondary"
                                    className="whitespace-normal break-words max-w-md h-auto text-left justify-start leading-normal py-1 inline-block"
                                >
                                    {String(item)}
                                </Badge>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        )
    }

    // Primitive values
    return (
        <div className={cn("flex items-start justify-between gap-4 py-2 border-b last:border-0", level > 0 && "ml-0")}>
            <div className="flex items-center gap-2 min-w-[120px] flex-shrink-0">
                <span className="text-sm font-medium text-muted-foreground">{prettifyKey(label)}</span>
            </div>
            <div className="flex-1 text-right">
                <span className="text-sm font-medium break-words whitespace-normal">{String(value)}</span>
            </div>
        </div>
    )
}

function prettifyKey(key: string) {
    return key
        .replace(/([A-Z])/g, ' $1') // Add space before capital letters
        .replace(/^./, (str) => str.toUpperCase()) // Capitalize first letter
        .replace(/[_-]/g, ' ') // Replace underscores/dashes with spaces
        .trim()
}
