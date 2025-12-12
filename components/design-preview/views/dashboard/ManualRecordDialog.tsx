"use client"

import { useState, useMemo } from 'react'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { 
    SchemaField, 
    SchemaDefinition,
    ObjectField,
    ListField,
    TableField,
    isLeaf
} from '@/lib/schema'
import { Plus, Trash2, ChevronRight, ChevronDown, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ManualRecordDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    schema: SchemaDefinition | null
    onSave: (recordName: string, data: Record<string, any>) => Promise<void>
}

export function ManualRecordDialog({ open, onOpenChange, schema, onSave }: ManualRecordDialogProps) {
    const [recordName, setRecordName] = useState("")
    const [formData, setFormData] = useState<Record<string, any>>({})
    const [isSaving, setIsSaving] = useState(false)
    const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set())

    // Initialize form data when dialog opens
    const initializeFormData = () => {
        if (!schema?.fields) return {}
        const data: Record<string, any> = {}
        
        const initField = (field: SchemaField): any => {
            if (isLeaf(field)) {
                if (field.type === 'boolean') return false
                if (field.type === 'number' || field.type === 'decimal') return null
                if (field.type === 'multi_select') return []
                return ''
            }
            if (field.type === 'object') {
                const obj: Record<string, any> = {}
                ;(field as ObjectField).children?.forEach(child => {
                    obj[child.id] = initField(child)
                })
                return obj
            }
            if (field.type === 'list') {
                return []
            }
            if (field.type === 'table') {
                return []
            }
            return null
        }

        schema.fields.forEach(field => {
            // Skip transformation fields - they're computed
            if (field.isTransformation) return
            data[field.id] = initField(field)
        })

        return data
    }

    // Reset form when dialog opens
    const handleOpenChange = (isOpen: boolean) => {
        if (isOpen) {
            setFormData(initializeFormData())
            setRecordName(`Manual Entry - ${new Date().toLocaleDateString()}`)
            setExpandedSections(new Set())
        }
        onOpenChange(isOpen)
    }

    const updateField = (fieldId: string, value: any) => {
        setFormData(prev => ({ ...prev, [fieldId]: value }))
    }

    const updateNestedField = (parentId: string, childId: string, value: any) => {
        setFormData(prev => ({
            ...prev,
            [parentId]: {
                ...(prev[parentId] || {}),
                [childId]: value
            }
        }))
    }

    const addListItem = (fieldId: string, itemField: SchemaField) => {
        const newItem = isLeaf(itemField) ? '' : {}
        setFormData(prev => ({
            ...prev,
            [fieldId]: [...(prev[fieldId] || []), newItem]
        }))
    }

    const updateListItem = (fieldId: string, index: number, value: any) => {
        setFormData(prev => {
            const list = [...(prev[fieldId] || [])]
            list[index] = value
            return { ...prev, [fieldId]: list }
        })
    }

    const removeListItem = (fieldId: string, index: number) => {
        setFormData(prev => ({
            ...prev,
            [fieldId]: (prev[fieldId] || []).filter((_: any, i: number) => i !== index)
        }))
    }

    const toggleSection = (sectionId: string) => {
        setExpandedSections(prev => {
            const next = new Set(prev)
            if (next.has(sectionId)) {
                next.delete(sectionId)
            } else {
                next.add(sectionId)
            }
            return next
        })
    }

    const handleSave = async () => {
        if (!recordName.trim()) return
        setIsSaving(true)
        try {
            await onSave(recordName, formData)
            handleOpenChange(false)
        } catch (error) {
            console.error('Failed to save record:', error)
        } finally {
            setIsSaving(false)
        }
    }

    // Filter out transformation fields (they're computed, not input)
    const inputFields = useMemo(() => {
        return schema?.fields?.filter(f => !f.isTransformation) || []
    }, [schema?.fields])

    const renderField = (field: SchemaField, depth: number = 0): React.ReactNode => {
        // Skip transformation fields
        if (field.isTransformation) return null

        const value = formData[field.id]
        const isRequired = field.required

        // Leaf fields (primitives)
        if (isLeaf(field)) {
            return (
                <div key={field.id} className={cn("grid gap-2", depth > 0 && "ml-4")}>
                    <Label htmlFor={field.id} className="flex items-center gap-1">
                        {field.name}
                        {isRequired && <span className="text-red-500">*</span>}
                    </Label>
                    
                    {field.type === 'string' || field.type === 'email' || field.type === 'url' || field.type === 'phone' ? (
                        field.description && field.description.length > 50 ? (
                            <Textarea
                                id={field.id}
                                value={value || ''}
                                onChange={(e) => updateField(field.id, e.target.value)}
                                placeholder={field.description}
                                className="min-h-[80px]"
                            />
                        ) : (
                            <Input
                                id={field.id}
                                type={field.type === 'email' ? 'email' : field.type === 'url' ? 'url' : 'text'}
                                value={value || ''}
                                onChange={(e) => updateField(field.id, e.target.value)}
                                placeholder={field.description}
                            />
                        )
                    ) : field.type === 'number' || field.type === 'decimal' ? (
                        <Input
                            id={field.id}
                            type="number"
                            step={field.type === 'decimal' ? '0.01' : '1'}
                            value={value ?? ''}
                            onChange={(e) => updateField(field.id, e.target.value ? parseFloat(e.target.value) : null)}
                            placeholder={field.description}
                        />
                    ) : field.type === 'boolean' ? (
                        <div className="flex items-center gap-2">
                            <Checkbox
                                id={field.id}
                                checked={!!value}
                                onCheckedChange={(checked) => updateField(field.id, !!checked)}
                            />
                            <span className="text-sm text-muted-foreground">{field.description}</span>
                        </div>
                    ) : field.type === 'date' ? (
                        <Input
                            id={field.id}
                            type="date"
                            value={value || ''}
                            onChange={(e) => updateField(field.id, e.target.value)}
                        />
                    ) : field.type === 'single_select' ? (
                        <Select value={value || ''} onValueChange={(v) => updateField(field.id, v)}>
                            <SelectTrigger>
                                <SelectValue placeholder={`Select ${field.name}`} />
                            </SelectTrigger>
                            <SelectContent>
                                {field.constraints?.options?.map((opt) => (
                                    <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    ) : field.type === 'multi_select' ? (
                        <div className="flex flex-wrap gap-2 p-2 border rounded-md min-h-[40px]">
                            {field.constraints?.options?.map((opt) => {
                                const isSelected = (value || []).includes(opt)
                                return (
                                    <Badge
                                        key={opt}
                                        variant={isSelected ? "default" : "outline"}
                                        className="cursor-pointer"
                                        onClick={() => {
                                            const current = value || []
                                            if (isSelected) {
                                                updateField(field.id, current.filter((v: string) => v !== opt))
                                            } else {
                                                updateField(field.id, [...current, opt])
                                            }
                                        }}
                                    >
                                        {opt}
                                    </Badge>
                                )
                            })}
                        </div>
                    ) : field.type === 'richtext' || field.type === 'address' ? (
                        <Textarea
                            id={field.id}
                            value={value || ''}
                            onChange={(e) => updateField(field.id, e.target.value)}
                            placeholder={field.description}
                            className="min-h-[100px]"
                        />
                    ) : (
                        <Input
                            id={field.id}
                            value={value || ''}
                            onChange={(e) => updateField(field.id, e.target.value)}
                            placeholder={field.description}
                        />
                    )}
                    
                    {field.description && field.type !== 'boolean' && (
                        <p className="text-xs text-muted-foreground">{field.description}</p>
                    )}
                </div>
            )
        }

        // Object fields
        if (field.type === 'object') {
            const objField = field as ObjectField
            const isExpanded = expandedSections.has(field.id)
            
            return (
                <div key={field.id} className="border rounded-lg overflow-hidden">
                    <div
                        className="flex items-center gap-2 p-3 bg-muted/30 cursor-pointer hover:bg-muted/50"
                        onClick={() => toggleSection(field.id)}
                    >
                        {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                        <span className="font-medium text-sm">{field.name}</span>
                        {isRequired && <span className="text-red-500 text-sm">*</span>}
                        <Badge variant="outline" className="ml-auto text-[10px]">Object</Badge>
                    </div>
                    {isExpanded && (
                        <div className="p-4 space-y-4 bg-background">
                            {objField.children?.map(child => {
                                if (child.isTransformation) return null
                                return (
                                    <div key={child.id} className="grid gap-2">
                                        <Label htmlFor={child.id}>{child.name}</Label>
                                        <Input
                                            id={child.id}
                                            value={formData[field.id]?.[child.id] || ''}
                                            onChange={(e) => updateNestedField(field.id, child.id, e.target.value)}
                                            placeholder={child.description}
                                        />
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>
            )
        }

        // List fields
        if (field.type === 'list') {
            const listField = field as ListField
            const listValue = value || []
            const isExpanded = expandedSections.has(field.id)
            
            return (
                <div key={field.id} className="border rounded-lg overflow-hidden">
                    <div
                        className="flex items-center gap-2 p-3 bg-muted/30 cursor-pointer hover:bg-muted/50"
                        onClick={() => toggleSection(field.id)}
                    >
                        {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                        <span className="font-medium text-sm">{field.name}</span>
                        <Badge variant="outline" className="ml-auto text-[10px]">{listValue.length} items</Badge>
                    </div>
                    {isExpanded && (
                        <div className="p-4 space-y-2 bg-background">
                            {listValue.map((item: any, index: number) => (
                                <div key={index} className="flex gap-2 items-center">
                                    <span className="text-xs text-muted-foreground w-6">{index + 1}.</span>
                                    <Input
                                        value={typeof item === 'string' ? item : JSON.stringify(item)}
                                        onChange={(e) => updateListItem(field.id, index, e.target.value)}
                                        placeholder={`${listField.item?.name || 'Item'} ${index + 1}`}
                                    />
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => removeListItem(field.id, index)}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                            <Button
                                variant="outline"
                                size="sm"
                                className="w-full"
                                onClick={() => addListItem(field.id, listField.item)}
                            >
                                <Plus className="h-4 w-4 mr-2" />
                                Add {listField.item?.name || 'Item'}
                            </Button>
                        </div>
                    )}
                </div>
            )
        }

        return null
    }

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0">
                <DialogHeader className="p-6 pb-0">
                    <DialogTitle>Create New Record</DialogTitle>
                    <DialogDescription>
                        Manually enter data for a new {schema?.name} record
                    </DialogDescription>
                </DialogHeader>

                <ScrollArea className="flex-1 px-6">
                    <div className="space-y-6 py-4">
                        {/* Record Name */}
                        <div className="grid gap-2">
                            <Label htmlFor="recordName" className="font-semibold">
                                Record Name <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="recordName"
                                value={recordName}
                                onChange={(e) => setRecordName(e.target.value)}
                                placeholder="Enter a name for this record"
                            />
                        </div>

                        <Separator />

                        {/* Schema Fields */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-semibold text-muted-foreground">Data Fields</h3>
                            {inputFields.map(field => renderField(field))}
                        </div>
                    </div>
                </ScrollArea>

                <DialogFooter className="p-6 pt-4 border-t">
                    <Button variant="outline" onClick={() => handleOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button onClick={handleSave} disabled={!recordName.trim() || isSaving}>
                        {isSaving ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Saving...
                            </>
                        ) : (
                            'Create Record'
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}









