"use client"

import React, { useMemo, useState, useCallback } from 'react'
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from '@dnd-kit/core'
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    rectSortingStrategy,
} from '@dnd-kit/sortable'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
    ResizablePanelGroup,
    ResizablePanel,
    ResizableHandle,
} from "@/components/ui/resizable"
import { Button } from '@/components/ui/button'
import { ExtractionJob, SchemaDefinition, SchemaField, InputField, InputDocument, flattenFields, getInputFields, isInputField } from '@/lib/schema'
import { MCPanel } from './panels/MCPanel'
import { MCTextPanel } from './panels/MCTextPanel'
import { MCObjectPanel } from './panels/MCObjectPanel'
import { MCTablePanel } from './panels/MCTablePanel'
import { MCListPanel } from './panels/MCListPanel'
import { MCSourcePanel } from './panels/MCSourcePanel'
import { MCCodePanel } from './panels/MCCodePanel'
import { MCSelectPanel } from './panels/MCSelectPanel'
import { MCUploadPanel } from './panels/MCUploadPanel'
import { Maximize2, Minimize2, Pin, PinOff, Upload, FileText, Download } from 'lucide-react'
import { cn } from '@/lib/utils'
import { downloadFieldAsDocx } from '@/lib/export-docx'

interface DocumentMissionControlProps {
    job: ExtractionJob
    schema: SchemaDefinition | null
    onUpdateResults?: (jobId: string, results: Record<string, any>) => void
}

type PanelType = 'text' | 'object' | 'table' | 'list' | 'source' | 'select' | 'multiselect' | 'code' | 'upload' | 'input-document'

interface PanelConfig {
    id: string
    key: string
    label: string
    type: PanelType
    value: any
    schemaField?: SchemaField
    inputField?: InputField
    inputDocument?: InputDocument
    size?: 'small' | 'medium' | 'large'
    options?: string[]
}

function getPanelConfig(key: string, value: any, field?: SchemaField): { type: PanelType; size: 'small' | 'medium' | 'large' } {
    // Use schema field type if available
    if (field) {
        if (field.type === 'object') return { type: 'object', size: 'medium' }
        if (field.type === 'table') return { type: 'table', size: 'large' }
        if (field.type === 'list') {
            const listField = field as Extract<SchemaField, { type: 'list' }>
            const items = Array.isArray(value) ? value : []
            const hasObjectItems = items.some((item) => item && typeof item === 'object' && !Array.isArray(item))
            const schemaExpectsObjects = listField.item?.type === 'object' || listField.item?.type === 'table'

            if (schemaExpectsObjects) {
                return (items.length === 0 || hasObjectItems)
                    ? { type: 'table', size: 'large' }
                    : { type: 'list', size: 'medium' }
            }

            if (hasObjectItems) {
                return { type: 'table', size: 'large' }
            }

            return { type: 'list', size: 'medium' }
        }
    }

    // Infer from value structure
    if (Array.isArray(value)) {
        // Array of objects = table
        if (value.length > 0 && typeof value[0] === 'object') {
            return { type: 'table', size: 'large' }
        }
        // Array of primitives = list
        return { type: 'list', size: 'medium' }
    }

    // Object = structured object panel
    if (typeof value === 'object' && value !== null) {
        return { type: 'object', size: 'medium' }
    }

    const strValue = String(value)
    if (strValue.length > 200) {
        return { type: 'text', size: 'large' }
    }

    return { type: 'text', size: 'small' }
}

function prettifyKey(key: string): string {
    return key
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, (str) => str.toUpperCase())
        .replace(/[_-]/g, ' ')
        .trim()
}

export function DocumentMissionControl({ job, schema, onUpdateResults }: DocumentMissionControlProps) {
    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    )

    // Track which document panels are pinned to sidebar
    const [pinnedDocuments, setPinnedDocuments] = useState<Set<string>>(new Set())
    // Track expanded/focused panel
    const [expandedPanel, setExpandedPanel] = useState<string | null>(null)

    // Get input fields from schema
    const inputFields = useMemo(() => {
        if (!schema) return []
        return getInputFields(schema.fields)
    }, [schema])

    // Build input document panels
    const inputDocumentPanels = useMemo<PanelConfig[]>(() => {
        const panels: PanelConfig[] = []

        // Check for multi-document input
        if (job.inputDocuments && Object.keys(job.inputDocuments).length > 0) {
            Object.entries(job.inputDocuments).forEach(([fieldId, doc]) => {
                const inputField = inputFields.find(f => f.id === fieldId)
                panels.push({
                    id: `input-${fieldId}`,
                    key: fieldId,
                    label: inputField?.name || doc.fileName,
                    type: 'input-document',
                    value: doc,
                    inputField,
                    inputDocument: doc,
                    size: 'medium',
                })
            })
        } else if (job.originalFileUrl || job.ocrAnnotatedImageUrl) {
            // Backward compatibility: single document mode
            panels.push({
                id: 'input-default',
                key: 'default',
                label: job.fileName.replace(/\.[^/.]+$/, ''),
                type: 'input-document',
                value: {
                    fieldId: 'default',
                    fileName: job.fileName,
                    fileUrl: job.originalFileUrl || '',
                    previewUrl: job.ocrAnnotatedImageUrl,
                    uploadedAt: job.createdAt,
                },
                size: 'medium',
            })
        }

        return panels
    }, [job, inputFields])

    // Build field panels from job results
    const fieldPanels = useMemo<PanelConfig[]>(() => {
        const panels: PanelConfig[] = []
        const results = job.results || {}
        const flatFields = schema ? flattenFields(schema.fields) : []

        Object.entries(results).forEach(([key, value]) => {
            if (value === null || value === undefined) return
            // Skip internal meta fields
            if (key.startsWith('__')) return

            const field = flatFields.find(f => f.id === key || f.name === key)
            // Skip input fields - they're handled separately
            if (field && isInputField(field)) return

            const { type, size } = getPanelConfig(key, value, field as SchemaField | undefined)

            panels.push({
                id: key,
                key,
                label: field?.name || prettifyKey(key),
                type,
                size,
                value,
                schemaField: field as SchemaField | undefined,
            })
        })

        return panels
    }, [job, schema])

    // All panels combined
    const allPanels = useMemo(() => [...inputDocumentPanels, ...fieldPanels], [inputDocumentPanels, fieldPanels])

    const [panelOrder, setPanelOrder] = useState<string[]>(() => allPanels.map(p => p.id))
    const [localResults, setLocalResults] = useState<Record<string, any>>(() => job.results || {})

    // Separate pinned and floating panels
    const pinnedPanels = useMemo(() => 
        inputDocumentPanels.filter(p => pinnedDocuments.has(p.id)),
        [inputDocumentPanels, pinnedDocuments]
    )

    const floatingPanels = useMemo(() => {
        const panelMap = new Map(allPanels.map(p => [p.id, p]))
        const newIds = allPanels.map(p => p.id).filter(id => !panelOrder.includes(id))
        const fullOrder = [...panelOrder, ...newIds]

        return fullOrder
            .map(id => panelMap.get(id))
            .filter((p): p is PanelConfig => p !== undefined && !pinnedDocuments.has(p.id))
    }, [panelOrder, allPanels, pinnedDocuments])

    const handleDragEnd = useCallback((event: DragEndEvent) => {
        const { active, over } = event
        if (over && active.id !== over.id) {
            setPanelOrder((items) => {
                const oldIndex = items.indexOf(String(active.id))
                const newIndex = items.indexOf(String(over.id))
                return arrayMove(items, oldIndex, newIndex)
            })
        }
    }, [])

    const handleValueChange = useCallback((key: string, newValue: any) => {
        setLocalResults(prev => {
            const updated = { ...prev, [key]: newValue }
            if (onUpdateResults) {
                onUpdateResults(job.id, updated)
            }
            return updated
        })
    }, [job.id, onUpdateResults])

    const togglePinned = useCallback((panelId: string) => {
        setPinnedDocuments(prev => {
            const next = new Set(prev)
            if (next.has(panelId)) {
                next.delete(panelId)
            } else {
                next.add(panelId)
            }
            return next
        })
    }, [])

    const renderPanelContent = (panel: PanelConfig) => {
        const currentValue = localResults[panel.key]

        switch (panel.type) {
            case 'input-document':
                const doc = panel.inputDocument || panel.value
                return (
                    <MCSourcePanel
                        imageUrl={doc?.previewUrl || doc?.fileUrl}
                        fileName={doc?.fileName || panel.label}
                        textContent={doc?.textValue}
                    />
                )
            case 'text':
                return (
                    <MCTextPanel
                        value={currentValue}
                        onChange={(v: string | number | boolean) => handleValueChange(panel.key, v)}
                    />
                )
            case 'object':
                return (
                    <MCObjectPanel
                        value={currentValue || {}}
                        onChange={(v: Record<string, any>) => handleValueChange(panel.key, v)}
                        schemaField={panel.schemaField}
                    />
                )
            case 'table':
                return (
                    <MCTablePanel
                        value={currentValue || []}
                        onChange={(v: Record<string, any>[]) => handleValueChange(panel.key, v)}
                    />
                )
            case 'list':
                return (
                    <MCListPanel
                        value={currentValue || []}
                        onChange={(v: any[]) => handleValueChange(panel.key, v)}
                    />
                )
            case 'code':
                return (
                    <MCCodePanel
                        value={currentValue}
                        onChange={(v: any) => handleValueChange(panel.key, v)}
                    />
                )
            case 'select':
                return (
                    <MCSelectPanel
                        value={currentValue || ''}
                        options={panel.options || []}
                        onChange={(v: string) => handleValueChange(panel.key, v)}
                    />
                )
            case 'multiselect':
                return (
                    <MCSelectPanel
                        value={currentValue || []}
                        options={panel.options || []}
                        onChange={(v: string) => handleValueChange(panel.key, v)}
                        multiple
                    />
                )
            case 'upload':
                return (
                    <MCUploadPanel
                        value={currentValue}
                        label={panel.label}
                    />
                )
            default:
                return null
        }
    }

    const hasPinnedPanels = pinnedPanels.length > 0
    const hasResults = job.results && Object.keys(job.results).length > 0

    // Expanded panel view
    if (expandedPanel) {
        const panel = allPanels.find(p => p.id === expandedPanel)
        if (panel) {
            return (
                <div className="h-full flex flex-col bg-slate-50">
                    <div className="px-4 py-3 border-b bg-white flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            {panel.type === 'input-document' ? (
                                <Upload className="h-4 w-4 text-amber-600" />
                            ) : (
                                <FileText className="h-4 w-4 text-blue-600" />
                            )}
                            <span className="font-medium text-sm">{panel.label}</span>
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setExpandedPanel(null)}
                        >
                            <Minimize2 className="h-4 w-4 mr-1" />
                            Exit Focus
                        </Button>
                    </div>
                    <div className="flex-1 overflow-auto p-4">
                        {renderPanelContent(panel)}
                    </div>
                </div>
            )
        }
    }

    // No results and no input documents = show empty state
    if (!hasResults && inputDocumentPanels.length === 0) {
        return (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground p-8">
                <Upload className="h-12 w-12 opacity-20 mb-4" />
                <h3 className="text-lg font-medium mb-1">No documents yet</h3>
                <p className="text-sm text-center max-w-md">
                    Upload documents to see them in Mission Control view.
                </p>
            </div>
        )
    }

    return (
        <ResizablePanelGroup direction="horizontal" className="h-full">
            {/* Pinned Document Panels - Sidebar */}
            {hasPinnedPanels && (
                <>
                    <ResizablePanel defaultSize={35} minSize={20}>
                        <ScrollArea className="h-full bg-slate-50">
                            <div className="p-2 space-y-2">
                                {pinnedPanels.map((panel) => (
                                    <div key={panel.id} className="rounded-lg border bg-white shadow-sm overflow-hidden">
                                        <div className="px-3 py-2 border-b bg-slate-50/50 flex items-center justify-between">
                                            <div className="flex items-center gap-2 min-w-0">
                                                <Upload className="h-4 w-4 text-amber-600 shrink-0" />
                                                <span className="font-medium text-sm truncate">{panel.label}</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-6 w-6"
                                                    onClick={() => setExpandedPanel(panel.id)}
                                                    title="Expand"
                                                >
                                                    <Maximize2 className="h-3 w-3" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-6 w-6 text-amber-600"
                                                    onClick={() => togglePinned(panel.id)}
                                                    title="Unpin from sidebar"
                                                >
                                                    <PinOff className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        </div>
                                        <div className="p-2">
                                            {renderPanelContent(panel)}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                    </ResizablePanel>
                    <ResizableHandle withHandle />
                </>
            )}

            {/* Main Panel Grid */}
            <ResizablePanel defaultSize={hasPinnedPanels ? 65 : 100} minSize={30}>
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                >
                    <SortableContext items={floatingPanels.map(p => p.id)} strategy={rectSortingStrategy}>
                        <ScrollArea className="h-full bg-slate-100">
                            <div className="p-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 auto-rows-min">
                                {floatingPanels.map((panel) => (
                                    <MCPanel
                                        key={panel.id}
                                        id={panel.id}
                                        title={panel.label}
                                        type={panel.type}
                                        size={panel.size}
                                        titleIcon={panel.type === 'input-document' ? (
                                            <Upload className="h-3.5 w-3.5 text-amber-600" />
                                        ) : undefined}
                                        actions={
                                            <>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        setExpandedPanel(panel.id)
                                                    }}
                                                    title="Expand"
                                                >
                                                    <Maximize2 className="h-3 w-3" />
                                                </Button>
                                                {panel.schemaField?.outputAsFile && (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            const html = localResults[panel.key]
                                                            if (html) {
                                                                downloadFieldAsDocx(
                                                                    typeof html === 'string' ? html : String(html),
                                                                    panel.label
                                                                )
                                                            }
                                                        }}
                                                        title="Download as DOCX"
                                                    >
                                                        <Download className="h-3 w-3" />
                                                    </Button>
                                                )}
                                                {panel.type === 'input-document' && (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className={cn(
                                                            "h-6 w-6 transition-opacity",
                                                            pinnedDocuments.has(panel.id)
                                                                ? "text-amber-600"
                                                                : "opacity-0 group-hover:opacity-100"
                                                        )}
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            togglePinned(panel.id)
                                                        }}
                                                        title={pinnedDocuments.has(panel.id) ? "Unpin" : "Pin to sidebar"}
                                                    >
                                                        <Pin className="h-3 w-3" />
                                                    </Button>
                                                )}
                                            </>
                                        }
                                    >
                                        {renderPanelContent(panel)}
                                    </MCPanel>
                                ))}
                            </div>
                        </ScrollArea>
                    </SortableContext>
                </DndContext>
            </ResizablePanel>
        </ResizablePanelGroup>
    )
}
