"use client"

import React, { useCallback, useMemo, useState } from "react"
import { MentionTextarea } from "@/components/ui/mention-textarea"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

import type { SchemaField, TransformationType, VisualGroup } from "@/lib/schema"
import { getFieldDependents } from "@/lib/dependency-resolver"

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
      parts.push(
        <span
          key={start}
          className="mx-0.5 inline-flex items-center rounded border border-blue-200 bg-blue-100 px-1.5 py-0.5 text-[11px] font-medium text-blue-700"
          title={label}
        >
          {label}
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

  return (
    <div className="space-y-4">
      <div>
        <Label>Gemini Prompt</Label>
        <MentionTextarea
          value={String(selected.transformationConfig || "")}
          onChange={(v) => onUpdate({ transformationConfig: v })}
          options={options}
          placeholder="Describe the transformation. Type @ to pick columns; it inserts {total amount}. Example: divide {total amount} by 3.25"
          registerInsertHandler={handleRegisterInsert}
        />
        <ExpressionPreview text={String(selected.transformationConfig || "")} />
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
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          AI will use a calculator when needed for math operations. Reference columns using @mention or {`{column name}`}.
        </p>
      </div>
    </div>
  )
}
