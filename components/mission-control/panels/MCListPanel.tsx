"use client"

import React from 'react'

interface MCListPanelProps {
    value: any[]
    onChange: (value: any[]) => void
}

const renderItemValue = (item: any) => {
    if (item === null || item === undefined) {
        return <span className="text-muted-foreground">—</span>
    }

    if (typeof item === 'object') {
        return (
            <pre className="flex-1 whitespace-pre-wrap break-words rounded bg-slate-50 px-2 py-1 text-xs text-slate-800 border border-slate-200">
                {JSON.stringify(item, null, 2)}
            </pre>
        )
    }

    return <span className="flex-1 break-words">{String(item)}</span>
}

export function MCListPanel({ value }: MCListPanelProps) {
    const items = Array.isArray(value) ? value : []

    if (!items || items.length === 0) {
        return (
            <p className="text-sm text-muted-foreground italic">No items</p>
        )
    }

    return (
        <ul className="space-y-1.5 text-sm text-slate-700">
            {items.map((item, index) => (
                <li key={index} className="flex items-start gap-2">
                    <span className="text-slate-400 mt-0.5">-</span>
                    {renderItemValue(item)}
                </li>
            ))}
        </ul>
    )
}
