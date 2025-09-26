"use client"

import React, { useCallback, useEffect, useMemo, useState } from "react"
import { MentionTextarea } from "@/components/ui/mention-textarea"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

import type { SchemaField } from "@/lib/schema/types"

export function TransformBuilder(props: {
  allColumns: SchemaField[]
  selected: SchemaField
  onUpdate: (updates: Partial<SchemaField>) => void
}) {
  const { allColumns, selected, onUpdate } = props
  const dataColumns = useMemo(() => allColumns.filter((c) => !c.isTransformation), [allColumns])

  const [insertFn, setInsertFn] = useState<null | ((token: string) => void)>(null)

  const options = dataColumns.map((c) => ({ id: c.id, label: c.name }))

  const insertToken = (t: string) => {
    if (insertFn) insertFn(t)
  }

  // Stable handler identity to avoid update loops with child effect
  const handleRegisterInsert = useCallback((fn: (token: string) => void) => {
    setInsertFn(() => fn)
  }, [])

  useEffect(() => {
    if (!selected.isTransformation) return
    const updates: Partial<SchemaField> = {}
    if (selected.transformationType !== "gemini_api") {
      updates.transformationType = "gemini_api"
    }
    if (!selected.transformationSource) {
      updates.transformationSource = "document"
    }
    if (Object.keys(updates).length > 0) {
      onUpdate(updates)
    }
  }, [selected.isTransformation, selected.transformationType, selected.transformationSource, onUpdate])

  if (!selected.isTransformation) return null

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

  const transformationSource = selected.transformationSource || "document"
  const promptValue =
    typeof selected.transformationConfig === "string"
      ? selected.transformationConfig
      : selected.transformationConfig
        ? JSON.stringify(selected.transformationConfig, null, 2)
        : ""

  const handleSourceChange = (value: "document" | "column") => {
    const updates: Partial<SchemaField> = { transformationSource: value }
    if (value === "document") {
      updates.transformationSourceColumnId = undefined
    }
    onUpdate(updates)
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Input Source</Label>
          <Select value={transformationSource} onValueChange={(v: "document" | "column") => handleSourceChange(v)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="document">Entire Document</SelectItem>
              <SelectItem value="column">Column Value</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {transformationSource === "column" && (
          <div>
            <Label>Source Column</Label>
            <Select
              value={selected.transformationSourceColumnId || ""}
              onValueChange={(v: string) => onUpdate({ transformationSourceColumnId: v })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {dataColumns.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      <div>
        <Label>Gemini Prompt</Label>
        <MentionTextarea
          value={promptValue}
          onChange={(v) => onUpdate({ transformationConfig: v })}
          options={options}
          placeholder="Describe the transformation. Type @ to pick columns; it inserts {customer notes}. Example: Summarize {customer notes} in one sentence"
          registerInsertHandler={handleRegisterInsert}
        />
        <ExpressionPreview text={promptValue} />
        <div className="mt-2 flex flex-wrap gap-2">
          {dataColumns.map((c) => (
            <Button
              key={c.id}
              type="button"
              size="sm"
              variant="secondary"
              onClick={() => insertToken(`{${c.name}}`)}
            >
              @{c.name}
            </Button>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Gemini can reference the selected columns and will call a built-in calculator function when your prompt requires math.
        </p>
        <p className="text-xs text-muted-foreground">
          Tip: give the model a target format such as "Return a number with two decimals" or "Respond with JSON" for structured outputs.
        </p>
      </div>
    </div>
  )
}
