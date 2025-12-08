"use client"

import React from 'react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'

interface MCCodePanelProps {
    value: any
    onChange?: (value: any) => void
}

export function MCCodePanel({ value, onChange }: MCCodePanelProps) {
    const formattedValue = React.useMemo(() => {
        if (typeof value === 'string') {
            // Try to parse as JSON for pretty printing
            try {
                const parsed = JSON.parse(value)
                return JSON.stringify(parsed, null, 2)
            } catch {
                return value
            }
        }
        return JSON.stringify(value, null, 2)
    }, [value])

    return (
        <ScrollArea className="h-48">
            <pre className="text-xs font-mono text-slate-600 whitespace-pre-wrap break-words bg-slate-50 rounded p-2">
                {formattedValue}
            </pre>
        </ScrollArea>
    )
}
