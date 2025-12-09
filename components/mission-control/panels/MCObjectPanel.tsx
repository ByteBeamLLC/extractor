"use client"

import React, { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Plus, Trash2, Pencil, Check, X, ChevronDown, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { SchemaField } from '@/lib/schema'
import { MCListPanel } from './MCListPanel'

interface MCObjectPanelProps {
    value: Record<string, any>
    onChange: (value: Record<string, any>) => void
    schemaField?: SchemaField
    depth?: number // For nested objects
}

export function MCObjectPanel({ value, onChange, schemaField, depth = 0 }: MCObjectPanelProps) {
    const [editingKey, setEditingKey] = useState<string | null>(null)
    const [editValue, setEditValue] = useState('')
    const [newKey, setNewKey] = useState('')
    const [newValue, setNewValue] = useState('')
    const [isAddingNew, setIsAddingNew] = useState(false)
    const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set())

    const entries = Object.entries(value).filter(([, v]) => v !== null && v !== undefined)

    const handleStartEdit = (key: string, val: any) => {
        setEditingKey(key)
        setEditValue(typeof val === 'object' ? JSON.stringify(val, null, 2) : String(val))
    }

    const handleSaveEdit = (key: string) => {
        let parsedValue: any = editValue
        if (editValue.startsWith('{') || editValue.startsWith('[')) {
            try {
                parsedValue = JSON.parse(editValue)
            } catch {
                // Keep as string
            }
        }
        onChange({ ...value, [key]: parsedValue })
        setEditingKey(null)
    }

    const handleCancelEdit = () => {
        setEditingKey(null)
        setEditValue('')
    }

    const handleDelete = (key: string) => {
        const updated = { ...value }
        delete updated[key]
        onChange(updated)
    }

    const handleAddNew = () => {
        if (!newKey.trim()) return
        let parsedValue: any = newValue
        if (newValue.startsWith('{') || newValue.startsWith('[')) {
            try {
                parsedValue = JSON.parse(newValue)
            } catch {
                // Keep as string
            }
        }
        onChange({ ...value, [newKey.trim()]: parsedValue })
        setNewKey('')
        setNewValue('')
        setIsAddingNew(false)
    }

    const toggleExpand = (key: string) => {
        const newExpanded = new Set(expandedKeys)
        if (newExpanded.has(key)) {
            newExpanded.delete(key)
        } else {
            newExpanded.add(key)
        }
        setExpandedKeys(newExpanded)
    }

    const handleNestedChange = (key: string, nestedValue: any) => {
        onChange({ ...value, [key]: nestedValue })
    }

    const prettifyKey = (key: string) => {
        return key
            .replace(/([A-Z])/g, ' $1')
            .replace(/^./, (str) => str.toUpperCase())
            .replace(/[_-]/g, ' ')
            .trim()
    }

    const renderValue = (key: string, val: any) => {
        // Nested object
        if (typeof val === 'object' && val !== null && !Array.isArray(val)) {
            const isExpanded = expandedKeys.has(key)
            return (
                <div className="w-full">
                    <button
                        onClick={() => toggleExpand(key)}
                        className="flex items-center gap-1 text-sm text-blue-600 hover:underline"
                    >
                        {isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                        {Object.keys(val).length} properties
                    </button>
                    {isExpanded && (
                        <div className="mt-2 ml-4 pl-3 border-l-2 border-slate-200">
                            <MCObjectPanel
                                value={val}
                                onChange={(v) => handleNestedChange(key, v)}
                                depth={depth + 1}
                            />
                        </div>
                    )}
                </div>
            )
        }

        // Array
        if (Array.isArray(val)) {
            const isExpanded = expandedKeys.has(key)
            return (
                <div className="w-full">
                    <button
                        onClick={() => toggleExpand(key)}
                        className="flex items-center gap-1 text-sm text-blue-600 hover:underline"
                    >
                        {isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                        {val.length} {val.length === 1 ? 'item' : 'items'}
                    </button>
                    {isExpanded && (
                        <div className="mt-2 ml-4 pl-3 border-l-2 border-slate-200">
                            <MCListPanel
                                value={val}
                                onChange={(list) => handleNestedChange(key, list)}
                            />
                        </div>
                    )}
                </div>
            )
        }

        // Primitive
        return (
            <span className="text-sm break-words">
                {String(val)}
            </span>
        )
    }

    return (
        <div className={cn("space-y-1", depth > 0 && "text-sm")} onClick={(e) => e.stopPropagation()}>
            {entries.length === 0 && !isAddingNew && (
                <p className="text-sm text-muted-foreground italic">No properties</p>
            )}

            {entries.map(([key, val]) => {
                const isNested = typeof val === 'object' && val !== null && !Array.isArray(val)

                return (
                    <div key={key} className="group py-1">
                        <div className="flex items-start gap-2">
                            <span className={cn(
                                "text-xs font-medium text-muted-foreground min-w-[80px] pt-1",
                                depth > 0 && "min-w-[60px]"
                            )}>
                                {prettifyKey(key)}
                            </span>

                            {editingKey === key ? (
                                <div className="flex-1 flex items-center gap-1">
                                    <Input
                                        value={editValue}
                                        onChange={(e) => setEditValue(e.target.value)}
                                        className="h-7 text-xs flex-1"
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') handleSaveEdit(key)
                                            if (e.key === 'Escape') handleCancelEdit()
                                        }}
                                        autoFocus
                                    />
                                    <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => handleSaveEdit(key)}>
                                        <Check className="h-3 w-3" />
                                    </Button>
                                    <Button size="icon" variant="ghost" className="h-6 w-6" onClick={handleCancelEdit}>
                                        <X className="h-3 w-3" />
                                    </Button>
                                </div>
                            ) : (
                                <div className="flex-1 flex items-start gap-1">
                                    <div className="flex-1">
                                        {renderValue(key, val)}
                                    </div>
                                    {!isNested && (
                                        <>
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                                                onClick={() => handleStartEdit(key, val)}
                                            >
                                                <Pencil className="h-2.5 w-2.5" />
                                            </Button>
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity text-destructive shrink-0"
                                                onClick={() => handleDelete(key)}
                                            >
                                                <Trash2 className="h-2.5 w-2.5" />
                                            </Button>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                )
            })}

            {isAddingNew ? (
                <div className="flex items-center gap-2 pt-2 border-t">
                    <Input
                        placeholder="Key"
                        value={newKey}
                        onChange={(e) => setNewKey(e.target.value)}
                        className="h-7 text-xs w-24"
                        autoFocus
                    />
                    <Input
                        placeholder="Value"
                        value={newValue}
                        onChange={(e) => setNewValue(e.target.value)}
                        className="h-7 text-xs flex-1"
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') handleAddNew()
                            if (e.key === 'Escape') setIsAddingNew(false)
                        }}
                    />
                    <Button size="icon" variant="ghost" className="h-6 w-6" onClick={handleAddNew}>
                        <Check className="h-3 w-3" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setIsAddingNew(false)}>
                        <X className="h-3 w-3" />
                    </Button>
                </div>
            ) : depth === 0 && (
                <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs w-full justify-start text-muted-foreground"
                    onClick={() => setIsAddingNew(true)}
                >
                    <Plus className="h-3 w-3 mr-1" />
                    Add Property
                </Button>
            )}
        </div>
    )
}
