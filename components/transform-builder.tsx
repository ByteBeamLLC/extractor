"use client"

import React, { useCallback, useEffect, useMemo, useState } from "react"
import { MentionTextarea } from "@/components/ui/mention-textarea"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"

import type { SchemaField, TransformationType, VisualGroup } from "@/lib/schema"
import { getFieldDependents } from "@/lib/dependency-resolver"
import { getKnowledgeBases, getKnowledgeDocuments } from "@/lib/knowledge-actions"

export function TransformBuilder(props: {
  allColumns: SchemaField[]
  selected: SchemaField
  onUpdate: (updates: Partial<SchemaField>) => void
  visualGroups?: VisualGroup[]
}) {
  const { allColumns, selected, onUpdate, visualGroups = [] } = props

  const availableFields = useMemo(() => {
    // Get fields that depend on the current field (to prevent circular deps)
    const dependents = getFieldDependents(selected, allColumns)
    const dependentIds = new Set(dependents.map(f => f.id))

    // Filter out: self, and any field that depends on this field
    return allColumns.filter(c =>
      c.id !== selected.id && !dependentIds.has(c.id)
    )
  }, [allColumns, selected])

  const [insertFn, setInsertFn] = useState<null | ((token: string) => void)>(null)
  const [knowledgeOptions, setKnowledgeOptions] = useState<{ id: string; label: string; type: 'folder' | 'file' }[]>([])

  useEffect(() => {
    const fetchKnowledge = async () => {
      try {
        const [bases, docs] = await Promise.all([
          getKnowledgeBases(),
          getKnowledgeDocuments()
        ])

        const options = [
          ...bases.map(b => ({ id: b.id, label: b.name, type: 'folder' as const })),
          ...docs.map(d => ({ id: d.id, label: d.name, type: 'file' as const }))
        ]

        setKnowledgeOptions(options)
      } catch (error) {
        console.error("Failed to fetch knowledge items:", error)
      }
    }

    fetchKnowledge()
  }, [])

  // Create field guidance options: visual groups + individual fields
  const options = useMemo(() => {
    const groupOptions = visualGroups.map((g) => ({ id: g.id, label: g.name }))
    const fieldOptions = availableFields.map((c) => ({
      id: c.id,
      label: c.isTransformation ? `${c.name} (transform)` : c.name
    }))
    return [...groupOptions, ...fieldOptions]
  }, [visualGroups, availableFields])

  const insertToken = (t: string) => {
    if (insertFn) insertFn(t)
  }

  // Stable handler identity to avoid update loops with child effect
  const handleRegisterInsert = useCallback((fn: (token: string) => void) => {
    setInsertFn(() => fn)
  }, [])

  if (!selected.isTransformation) return null

  const onTypeChange = (value: TransformationType) => onUpdate({ transformationType: value })

  const ExpressionPreview = ({ text }: { text: string }) => {
    const parts: React.ReactNode[] = []
    let lastIndex = 0
    const regex = /\{([^}]+)\}/g
    let match: RegExpExecArray | null
    while ((match = regex.exec(text))) {
      const start = match.index
      const end = start + match[0].length
      if (start > lastIndex) parts.push(<span key={lastIndex}>{text.slice(lastIndex, start)}</span>)
      const label = match[1]

      const isKnowledge = label.startsWith('kb:')
      const displayLabel = isKnowledge ? label.substring(3) : label
      const colorClass = isKnowledge
        ? "border-emerald-200 bg-emerald-100 text-emerald-700"
        : "border-blue-200 bg-blue-100 text-blue-700"

      parts.push(
        <span
          key={start}
          className={`mx-0.5 inline-flex items-center rounded border px-1.5 py-0.5 text-[11px] font-medium ${colorClass}`}
          title={label}
        >
          {isKnowledge ? '📚 ' : ''}{displayLabel}
        </span>,
      )
      lastIndex = end
    }
    if (lastIndex < text.length) parts.push(<span key={lastIndex}>{text.slice(lastIndex)}</span>)
    return <div className="rounded-md border border-border bg-muted/40 p-2 text-sm">{parts}</div>
  }

  type CurrencySource = { type: "number" | "column"; value: number | string }
  type CurrencyConfig = { amount: CurrencySource; rate: CurrencySource; decimals?: number }
  const readCurrencyConfig = (): CurrencyConfig => {
    const cfg = selected.transformationConfig as any
    if (cfg && typeof cfg === "object" && (cfg.amount || cfg.rate)) {
      return {
        amount: cfg.amount || { type: "number", value: 0 },
        rate: cfg.rate || { type: "number", value: 1 },
        decimals: typeof cfg.decimals === "number" ? cfg.decimals : undefined,
      }
    }
    return { amount: { type: "number", value: 0 }, rate: { type: "number", value: 1 }, decimals: 2 }
  }
  const currencyCfg = readCurrencyConfig()
  const setCurrencyCfg = (u: Partial<CurrencyConfig>) => onUpdate({ transformationConfig: { ...currencyCfg, ...u } })

  // Automatically set to gemini_api if not set
  React.useEffect(() => {
    if (!selected.transformationType || selected.transformationType !== "gemini_api") {
      onUpdate({ transformationType: "gemini_api", transformationSource: "column" })
    }
  }, [selected.transformationType, onUpdate])

  // Get selected tools from transformationConfig
  const getSelectedTools = (): string[] => {
    const config = selected.transformationConfig
    if (typeof config === 'object' && config !== null && 'selectedTools' in config) {
      return (config as any).selectedTools || []
    }
    return []
  }

  const selectedTools = getSelectedTools()

  const toggleTool = (tool: string) => {
    const current = getSelectedTools()
    const updated = current.includes(tool)
      ? current.filter(t => t !== tool)
      : [...current, tool]

    // Preserve the prompt string if it exists
    let promptString = ""
    if (typeof selected.transformationConfig === 'object' && selected.transformationConfig !== null && 'prompt' in selected.transformationConfig) {
      promptString = (selected.transformationConfig as any).prompt || ""
    } else if (typeof selected.transformationConfig === 'string') {
      promptString = selected.transformationConfig
    }

    onUpdate({
      transformationConfig: {
        prompt: promptString,
        selectedTools: updated
      }
    })
  }

  // Get prompt from config
  const getPromptValue = () => {
    const config = selected.transformationConfig
    if (typeof config === 'object' && config !== null && 'prompt' in config) {
      return String((config as any).prompt || "")
    }
    return String(config || "")
  }

  const setPromptValue = (value: string) => {
    onUpdate({
      transformationConfig: {
        prompt: value,
        selectedTools: getSelectedTools()
      }
    })
  }

  return (
    <div className="space-y-4">
      <div>
        <Label>Gemini Prompt</Label>
        <MentionTextarea
          value={getPromptValue()}
          onChange={(v) => setPromptValue(v)}
          options={options}
          knowledgeOptions={knowledgeOptions}
          placeholder="Describe the transformation. Type @ to pick columns or knowledge; it inserts {total amount}. Example: divide {total amount} by 3.25"
          registerInsertHandler={handleRegisterInsert}
        />
        <ExpressionPreview text={getPromptValue()} />
        <div className="mt-2 flex flex-wrap gap-2">
          {visualGroups.map((g) => (
            <Button
              key={g.id}
              type="button"
              size="sm"
              variant="outline"
              onClick={() => insertToken(`{${g.name}}`)}
              className="border-purple-300 bg-purple-100 text-purple-700 hover:bg-purple-200 hover:border-purple-400"
            >
              @{g.name}
            </Button>
          ))}
          {availableFields.map((c) => (
            <Button
              key={c.id}
              type="button"
              size="sm"
              variant="secondary"
              onClick={() => insertToken(`{${c.name}}`)}
              className={c.isTransformation ? "border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100" : ""}
              title={c.isTransformation ? "Transformation field" : "Extraction field"}
            >
              @{c.name}
            </Button>
          ))}
          {knowledgeOptions.length > 0 && (
            <div className="w-full border-t border-dashed my-1 pt-1 flex flex-wrap gap-2">
              <span className="text-xs text-muted-foreground w-full">Knowledge:</span>
              {knowledgeOptions.slice(0, 5).map((k) => (
                <Button
                  key={k.id}
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => insertToken(`{kb:${k.label}}`)}
                  className="border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                >
                  📚 {k.label}
                </Button>
              ))}
              {knowledgeOptions.length > 5 && (
                <span className="text-xs text-muted-foreground self-center">+{knowledgeOptions.length - 5} more (type @ to see all)</span>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label>Available Tools</Label>
        <div className="flex flex-col gap-2 rounded-md border border-border bg-muted/20 p-3">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="tool-calculator"
              checked={selectedTools.includes('calculator')}
              onCheckedChange={() => toggleTool('calculator')}
            />
            <label
              htmlFor="tool-calculator"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
            >
              Calculator - Perform mathematical operations
            </label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="tool-websearch"
              checked={selectedTools.includes('webSearch')}
              onCheckedChange={() => toggleTool('webSearch')}
            />
            <label
              htmlFor="tool-websearch"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
            >
              Web Search - Find current information, rates, prices
            </label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="tool-webreader"
              checked={selectedTools.includes('webReader')}
              onCheckedChange={() => toggleTool('webReader')}
            />
            <label
              htmlFor="tool-webreader"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
            >
              Web Reader - Read and extract content from URLs
            </label>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Select which tools the AI can use. Only selected tools will be available during transformation.
        </p>
      </div>
    </div>
  )
}

