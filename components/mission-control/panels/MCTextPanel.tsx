"use client"

import React, { useState, useEffect, useRef } from 'react'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Check, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface MCTextPanelProps {
    value: string | number | boolean
    onChange: (value: string | number | boolean) => void
}

export function MCTextPanel({ value, onChange }: MCTextPanelProps) {
    const [isEditing, setIsEditing] = useState(false)
    const [editValue, setEditValue] = useState(String(value ?? ''))
    const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null)

    // Determine if multiline based on content
    const isMultiline = String(value).length > 100 || String(value).includes('\n')
    const valueType = typeof value

    useEffect(() => {
        setEditValue(String(value ?? ''))
    }, [value])

    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus()
            inputRef.current.select()
        }
    }, [isEditing])

    const handleSave = () => {
        let newValue: string | number | boolean = editValue

        if (valueType === 'number') {
            newValue = parseFloat(editValue) || 0
        } else if (valueType === 'boolean') {
            newValue = editValue.toLowerCase() === 'true'
        }

        onChange(newValue)
        setIsEditing(false)
    }

    const handleCancel = () => {
        setEditValue(String(value ?? ''))
        setIsEditing(false)
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey && !isMultiline) {
            e.preventDefault()
            handleSave()
        } else if (e.key === 'Escape') {
            handleCancel()
        }
    }

    if (isEditing) {
        return (
            <div className="space-y-2" onClick={(e) => e.stopPropagation()}>
                {isMultiline ? (
                    <Textarea
                        ref={inputRef as React.RefObject<HTMLTextAreaElement>}
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                        className="min-h-[80px] text-sm resize-none"
                        rows={3}
                    />
                ) : (
                    <Input
                        ref={inputRef as React.RefObject<HTMLInputElement>}
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                        className="text-sm h-8"
                        type={valueType === 'number' ? 'number' : 'text'}
                    />
                )}
                <div className="flex items-center gap-1 justify-end">
                    <Button size="sm" variant="ghost" className="h-6 px-2 text-xs" onClick={handleCancel}>
                        <X className="h-3 w-3 mr-1" />
                        Cancel
                    </Button>
                    <Button size="sm" className="h-6 px-2 text-xs" onClick={handleSave}>
                        <Check className="h-3 w-3 mr-1" />
                        Save
                    </Button>
                </div>
            </div>
        )
    }

    // Display value - handle empty state
    if (!value && value !== 0 && value !== false) {
        return (
            <p
                className="text-sm text-muted-foreground italic cursor-text hover:bg-slate-50 rounded px-1 py-0.5 -mx-1"
                onClick={(e) => {
                    e.stopPropagation()
                    setIsEditing(true)
                }}
            >
                Click to add value...
            </p>
        )
    }

    return (
        <p
            className="text-sm text-slate-800 whitespace-pre-wrap break-words cursor-text hover:bg-slate-50 rounded px-1 py-0.5 -mx-1 transition-colors"
            onClick={(e) => {
                e.stopPropagation()
                setIsEditing(true)
            }}
        >
            {String(value)}
        </p>
    )
}
