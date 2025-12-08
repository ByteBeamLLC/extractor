"use client"

import React, { useState, useMemo } from 'react'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface MCListPanelProps {
    value: any[]
    onChange: (value: any[]) => void
}

export function MCListPanel({ value, onChange }: MCListPanelProps) {
    if (!value || value.length === 0) {
        return (
            <p className="text-sm text-muted-foreground italic">No items</p>
        )
    }

    return (
        <ul className="space-y-1.5 text-sm text-slate-700">
            {value.map((item, index) => (
                <li key={index} className="flex items-start gap-2">
                    <span className="text-slate-400 mt-0.5">-</span>
                    <span className="flex-1 break-words">{String(item)}</span>
                </li>
            ))}
        </ul>
    )
}
