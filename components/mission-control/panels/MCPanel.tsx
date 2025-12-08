"use client"

import React, { ReactNode } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
    FileText,
    Type,
    List,
    CircleDot,
    CheckSquare,
    Code,
    Upload,
    Image as ImageIcon,
    Loader2,
    Table as TableIcon
} from 'lucide-react'
import { cn } from '@/lib/utils'

type PanelType = 'text' | 'object' | 'table' | 'list' | 'source' | 'select' | 'multiselect' | 'code' | 'upload' | 'input-document'

interface MCPanelProps {
    id: string
    title: string
    type: PanelType
    isLoading?: boolean
    size?: 'small' | 'medium' | 'large'
    children: ReactNode
    /** Custom icon to show in title bar */
    titleIcon?: ReactNode
    /** Additional actions to show in title bar */
    actions?: ReactNode
}

const typeConfig: Record<PanelType, { icon: typeof Type; color: string }> = {
    text: { icon: Type, color: 'text-blue-500' },
    object: { icon: FileText, color: 'text-purple-500' },
    table: { icon: TableIcon, color: 'text-emerald-500' },
    list: { icon: List, color: 'text-slate-600' },
    source: { icon: ImageIcon, color: 'text-slate-600' },
    select: { icon: CircleDot, color: 'text-orange-500' },
    multiselect: { icon: CheckSquare, color: 'text-green-500' },
    code: { icon: Code, color: 'text-violet-500' },
    upload: { icon: Upload, color: 'text-slate-500' },
    'input-document': { icon: Upload, color: 'text-amber-600' },
}

export function MCPanel({ 
    id, 
    title, 
    type, 
    isLoading, 
    size = 'medium', 
    children,
    titleIcon,
    actions,
}: MCPanelProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id })

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    }

    const config = typeConfig[type] || typeConfig.text
    const Icon = config.icon

    // Default min sizes based on type
    const minHeight = type === 'table' ? 200 : (type === 'source' || type === 'input-document') ? 200 : 100

    return (
        <div
            ref={setNodeRef}
            style={{
                ...style,
                minHeight,
            }}
            {...attributes}
            className={cn(
                "group bg-white border border-slate-200 rounded-lg overflow-hidden",
                "hover:shadow-md transition-shadow",
                "resize overflow-auto", // CSS resize capability
                isDragging && "opacity-50 shadow-lg ring-2 ring-primary/50 z-50",
                // Size classes for grid spanning
                size === 'large' && "col-span-1 md:col-span-2",
                size === 'small' && "col-span-1",
                size === 'medium' && "col-span-1",
            )}
        >
            {/* Panel Header - Draggable */}
            <div
                {...listeners}
                className="flex items-center gap-2 px-3 py-2 border-b border-slate-100 bg-slate-50/50 cursor-grab active:cursor-grabbing"
            >
                {titleIcon || <Icon className={cn("h-4 w-4 shrink-0", config.color)} />}
                <span className="text-sm font-medium text-slate-700 truncate flex-1">
                    {title}
                </span>
                {isLoading && (
                    <Loader2 className="h-3 w-3 animate-spin text-blue-500" />
                )}
                {/* Action buttons */}
                {actions && (
                    <div className="flex items-center gap-0.5" onClick={(e) => e.stopPropagation()}>
                        {actions}
                    </div>
                )}
            </div>

            {/* Panel Content */}
            <div className="p-3 max-h-[500px] overflow-auto">
                {isLoading ? (
                    <p className="text-sm text-muted-foreground">Calculating...</p>
                ) : (
                    children
                )}
            </div>
        </div>
    )
}
