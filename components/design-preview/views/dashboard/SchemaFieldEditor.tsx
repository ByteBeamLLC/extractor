import { useState, useEffect } from 'react'
import {
    SchemaField,
    DataPrimitive,
    DataType,
    ObjectField,
    TableField,
    ListField,
    LeafField
} from '@/lib/schema'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Plus, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SchemaFieldEditorProps {
    initialField?: SchemaField
    onSave: (field: SchemaField) => void
    onCancel: () => void
}

export function SchemaFieldEditor({ initialField, onSave, onCancel }: SchemaFieldEditorProps) {
    const [field, setField] = useState<SchemaField>(() => {
        if (initialField) return JSON.parse(JSON.stringify(initialField))
        return {
            id: `field_${Date.now()}`,
            name: '',
            type: 'string',
            description: '',
            extractionInstructions: '',
            required: false
        } as LeafField
    })

    const createLeafField = (name = 'field', type: DataPrimitive = 'string'): LeafField => ({
        id: `field_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        name,
        type,
        description: '',
        extractionInstructions: '',
        required: false,
    })

    const cloneField = <T extends SchemaField>(f: T): T => JSON.parse(JSON.stringify(f)) as T

    const updateFieldType = (newType: DataType) => {
        setField(prev => {
            if (newType === 'object') {
                const existing = (prev as any).children as SchemaField[] | undefined
                const children = existing?.length ? existing.map((child) => cloneField(child)) : [createLeafField('name'), createLeafField('value')]
                return { ...prev, type: 'object', children } as ObjectField
            }
            if (newType === 'table') {
                const existing = (prev as any).columns as SchemaField[] | undefined
                const columns = existing?.length ? existing.map((col) => cloneField(col)) : [createLeafField('Column 1'), createLeafField('Column 2')]
                return { ...prev, type: 'table', columns } as TableField
            }
            if (newType === 'list') {
                const existing = (prev as any).item as SchemaField | undefined
                const item = existing ? cloneField(existing) : createLeafField('item')
                return { ...prev, type: 'list', item } as ListField
            }
            if (newType === 'single_select' || newType === 'multi_select') {
                const leaf: LeafField = {
                    ...(prev as any),
                    type: newType,
                    constraints: {
                        ...prev.constraints,
                        options: prev.constraints?.options || []
                    }
                }
                delete (leaf as any).children
                delete (leaf as any).columns
                delete (leaf as any).item
                return leaf
            }

            const leaf: LeafField = { ...(prev as any), type: newType }
            delete (leaf as any).children
            delete (leaf as any).columns
            delete (leaf as any).item
            return leaf
        })
    }

    // Object Sub-fields
    const addObjectSubField = () => {
        setField(prev => {
            if (prev.type !== 'object') return prev
            const children = [...(prev.children || []).map(c => cloneField(c)), createLeafField(`Field ${prev.children.length + 1}`)]
            return { ...prev, children }
        })
    }

    const updateObjectSubField = (childId: string, updates: Partial<LeafField>) => {
        setField(prev => {
            if (prev.type !== 'object') return prev
            const children = prev.children.map(c => c.id === childId ? { ...c, ...updates } : c)
            return { ...prev, children }
        })
    }

    const removeObjectSubField = (childId: string) => {
        setField(prev => {
            if (prev.type !== 'object') return prev
            const children = prev.children.filter(c => c.id !== childId)
            return { ...prev, children }
        })
    }

    // Table Columns
    const addTableColumn = () => {
        setField(prev => {
            if (prev.type !== 'table') return prev
            const columns = [...(prev.columns || []).map(c => cloneField(c)), createLeafField(`Column ${prev.columns.length + 1}`)]
            return { ...prev, columns }
        })
    }

    const updateTableColumn = (colId: string, updates: Partial<LeafField>) => {
        setField(prev => {
            if (prev.type !== 'table') return prev
            const columns = prev.columns.map(c => c.id === colId ? { ...c, ...updates } : c)
            return { ...prev, columns }
        })
    }

    const removeTableColumn = (colId: string) => {
        setField(prev => {
            if (prev.type !== 'table') return prev
            const columns = prev.columns.filter(c => c.id !== colId)
            return { ...prev, columns }
        })
    }

    // Select Options
    const addSelectOption = () => {
        setField(prev => {
            if (prev.type !== 'single_select' && prev.type !== 'multi_select') return prev
            const current = prev.constraints?.options || []
            return {
                ...prev,
                constraints: { ...prev.constraints, options: [...current, `Option ${current.length + 1}`] }
            }
        })
    }

    const updateSelectOption = (idx: number, val: string) => {
        setField(prev => {
            if (prev.type !== 'single_select' && prev.type !== 'multi_select') return prev
            const opts = [...(prev.constraints?.options || [])]
            opts[idx] = val
            return { ...prev, constraints: { ...prev.constraints, options: opts } }
        })
    }

    const removeSelectOption = (idx: number) => {
        setField(prev => {
            if (prev.type !== 'single_select' && prev.type !== 'multi_select') return prev
            const opts = (prev.constraints?.options || []).filter((_, i) => i !== idx)
            return { ...prev, constraints: { ...prev.constraints, options: opts } }
        })
    }

    return (
        <div className="space-y-6">
            <div className="grid gap-4">
                <div className="grid gap-2">
                    <Label htmlFor="name">Field Name</Label>
                    <Input
                        id="name"
                        value={field.name}
                        onChange={e => setField(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="e.g. Invoice Number"
                    />
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="type">Data Type</Label>
                    <Select value={field.type} onValueChange={(v) => updateFieldType(v as DataType)}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="string">Text</SelectItem>
                            <SelectItem value="number">Number</SelectItem>
                            <SelectItem value="date">Date</SelectItem>
                            <SelectItem value="boolean">Yes / No</SelectItem>
                            <SelectItem value="single_select">Single Select</SelectItem>
                            <SelectItem value="multi_select">Multi Select</SelectItem>
                            <SelectItem value="object">Object (Nested)</SelectItem>
                            <SelectItem value="table">Table (List of Objects)</SelectItem>
                            <SelectItem value="list">List (Simple)</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="description">Description</Label>
                    <Input
                        id="description"
                        value={field.description || ''}
                        onChange={e => setField(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Brief description of what this field represents"
                    />
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="instructions">Extraction Instructions</Label>
                    <Textarea
                        id="instructions"
                        value={field.extractionInstructions || ''}
                        onChange={e => setField(prev => ({ ...prev, extractionInstructions: e.target.value }))}
                        placeholder="Specific instructions for the AI extractor..."
                        className="min-h-[100px]"
                    />
                </div>
            </div>

            {/* Type Specific Editors */}
            {field.type === 'object' && (
                <div className="space-y-3 rounded-lg border p-4 bg-muted/30">
                    <div className="flex items-center justify-between">
                        <Label>Object Fields</Label>
                        <Button size="sm" variant="secondary" onClick={addObjectSubField}>
                            <Plus className="h-4 w-4 mr-1" /> Add Field
                        </Button>
                    </div>
                    <div className="space-y-2">
                        {(field as ObjectField).children.map((child) => (
                            <div key={child.id} className="flex gap-2 items-start bg-background p-2 rounded border">
                                <Input
                                    value={child.name}
                                    onChange={e => updateObjectSubField(child.id, { name: e.target.value })}
                                    className="flex-1"
                                    placeholder="Field Name"
                                />
                                <Select
                                    value={child.type}
                                    onValueChange={v => updateObjectSubField(child.id, { type: v as DataPrimitive })}
                                >
                                    <SelectTrigger className="w-[120px]">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="string">Text</SelectItem>
                                        <SelectItem value="number">Number</SelectItem>
                                        <SelectItem value="date">Date</SelectItem>
                                    </SelectContent>
                                </Select>
                                <Button size="icon" variant="ghost" onClick={() => removeObjectSubField(child.id)}>
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {field.type === 'table' && (
                <div className="space-y-3 rounded-lg border p-4 bg-muted/30">
                    <div className="flex items-center justify-between">
                        <Label>Table Columns</Label>
                        <Button size="sm" variant="secondary" onClick={addTableColumn}>
                            <Plus className="h-4 w-4 mr-1" /> Add Column
                        </Button>
                    </div>
                    <div className="space-y-2">
                        {(field as TableField).columns.map((col) => (
                            <div key={col.id} className="flex gap-2 items-center bg-background p-2 rounded border">
                                <Input
                                    value={col.name}
                                    onChange={e => updateTableColumn(col.id, { name: e.target.value })}
                                    placeholder="Column Name"
                                />
                                <Button size="icon" variant="ghost" onClick={() => removeTableColumn(col.id)}>
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {(field.type === 'single_select' || field.type === 'multi_select') && (
                <div className="space-y-3 rounded-lg border p-4 bg-muted/30">
                    <div className="flex items-center justify-between">
                        <Label>Options</Label>
                        <Button size="sm" variant="secondary" onClick={addSelectOption}>
                            <Plus className="h-4 w-4 mr-1" /> Add Option
                        </Button>
                    </div>
                    <div className="space-y-2">
                        {(field.constraints?.options || []).map((opt, idx) => (
                            <div key={idx} className="flex gap-2 items-center bg-background p-2 rounded border">
                                <Input
                                    value={opt}
                                    onChange={e => updateSelectOption(idx, e.target.value)}
                                    placeholder={`Option ${idx + 1}`}
                                />
                                <Button size="icon" variant="ghost" onClick={() => removeSelectOption(idx)}>
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={onCancel}>Cancel</Button>
                <Button onClick={() => onSave(field)}>Save Field</Button>
            </div>
        </div>
    )
}
