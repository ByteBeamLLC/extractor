"use client"

import React, { useState, useMemo } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Plus, Trash2, Check, X } from 'lucide-react'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'

interface MCTablePanelProps {
    value: Record<string, any>[] | Record<string, any> | null | undefined
    onChange: (value: Record<string, any>[]) => void
}

export function MCTablePanel({ value, onChange }: MCTablePanelProps) {
    // Normalize incoming value to a row array so unexpected shapes don't break rendering
    const rows = Array.isArray(value)
        ? value
        : value && typeof value === 'object'
            ? [value]
            : []
    const [editingCell, setEditingCell] = useState<{ row: number; col: string } | null>(null)
    const [editValue, setEditValue] = useState('')

    // Get all unique keys from all rows
    const columns = useMemo(() => {
        const keys = new Set<string>()
        rows.forEach(row => {
            if (row && typeof row === 'object' && !Array.isArray(row)) {
                Object.keys(row).forEach(key => keys.add(key))
            }
        })
        return Array.from(keys)
    }, [rows])

    const prettifyKey = (key: string) => {
        return key
            .replace(/([A-Z])/g, ' $1')
            .replace(/^./, (str) => str.toUpperCase())
            .replace(/[_-]/g, ' ')
            .trim()
    }

    const handleStartEdit = (rowIndex: number, colKey: string, cellValue: any) => {
        setEditingCell({ row: rowIndex, col: colKey })
        setEditValue(typeof cellValue === 'object' ? JSON.stringify(cellValue) : String(cellValue ?? ''))
    }

    const handleSaveEdit = () => {
        if (!editingCell) return

        let parsedValue: any = editValue
        if (editValue.startsWith('{') || editValue.startsWith('[')) {
            try {
                parsedValue = JSON.parse(editValue)
            } catch {
                // Keep as string
            }
        }

        const updated = [...rows]
        updated[editingCell.row] = {
            ...updated[editingCell.row],
            [editingCell.col]: parsedValue
        }
        onChange(updated)
        setEditingCell(null)
    }

    const handleCancelEdit = () => {
        setEditingCell(null)
        setEditValue('')
    }

    const handleDeleteRow = (rowIndex: number) => {
        onChange(rows.filter((_, i) => i !== rowIndex))
    }

    const handleAddRow = () => {
        const newRow: Record<string, any> = {}
        columns.forEach(col => {
            newRow[col] = ''
        })
        onChange([...rows, newRow])
    }

    if (rows.length === 0) {
        return (
            <div className="text-center py-4" onClick={(e) => e.stopPropagation()}>
                <p className="text-sm text-muted-foreground mb-2">No data</p>
                <Button variant="outline" size="sm" onClick={handleAddRow}>
                    <Plus className="h-3 w-3 mr-1" />
                    Add Row
                </Button>
            </div>
        )
    }

    return (
        <div className="space-y-2" onClick={(e) => e.stopPropagation()}>
            <div className="overflow-x-auto border rounded-md">
                <Table className="text-xs">
                    <TableHeader>
                        <TableRow>
                            {columns.map((col) => (
                                <TableHead key={col} className="h-8 px-2 whitespace-nowrap">
                                    {prettifyKey(col)}
                                </TableHead>
                            ))}
                            <TableHead className="h-8 px-2 w-10" />
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {rows.map((row, rowIndex) => (
                            <TableRow key={rowIndex} className="group">
                                {columns.map((col) => {
                                    const cellValue = row[col]
                                    const isEditing = editingCell?.row === rowIndex && editingCell?.col === col

                                    return (
                                        <TableCell key={col} className="p-1">
                                            {isEditing ? (
                                                <div className="flex items-center gap-1">
                                                    <Input
                                                        value={editValue}
                                                        onChange={(e) => setEditValue(e.target.value)}
                                                        className="h-6 text-xs"
                                                        autoFocus
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter') handleSaveEdit()
                                                            if (e.key === 'Escape') handleCancelEdit()
                                                        }}
                                                    />
                                                    <Button size="icon" variant="ghost" className="h-5 w-5" onClick={handleSaveEdit}>
                                                        <Check className="h-2.5 w-2.5" />
                                                    </Button>
                                                    <Button size="icon" variant="ghost" className="h-5 w-5" onClick={handleCancelEdit}>
                                                        <X className="h-2.5 w-2.5" />
                                                    </Button>
                                                </div>
                                            ) : (
                                                <div
                                                    className="px-1 py-0.5 cursor-pointer hover:bg-muted/50 rounded min-h-[24px] flex items-center"
                                                    onClick={() => handleStartEdit(rowIndex, col, cellValue)}
                                                >
                                                    <span className="truncate">
                                                        {typeof cellValue === 'object'
                                                            ? JSON.stringify(cellValue)
                                                            : String(cellValue ?? '')}
                                                    </span>
                                                </div>
                                            )}
                                        </TableCell>
                                    )
                                })}
                                <TableCell className="p-1 w-10">
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity text-destructive"
                                        onClick={() => handleDeleteRow(rowIndex)}
                                    >
                                        <Trash2 className="h-3 w-3" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
            <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs w-full justify-start text-muted-foreground"
                onClick={handleAddRow}
            >
                <Plus className="h-3 w-3 mr-1" />
                Add Row
            </Button>
        </div>
    )
}
