"use client"

import React, { useCallback, useMemo, useState } from "react"
import { MentionTextarea } from "@/components/ui/mention-textarea"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

import type { SchemaField, TransformationType } from "@/lib/schema"

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

  return (
    <div className="space-y-4">
      <div>
        <Label>Transformation Type</Label>
        <Select value={selected.transformationType} onValueChange={onTypeChange}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="calculation">Calculator</SelectItem>
            <SelectItem value="gemini_api">Gemini</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {selected.transformationType === "calculation" && (
        <div className="space-y-2">
          <Label>Expression</Label>
          <MentionTextarea
            value={String(selected.transformationConfig || "")}
            onChange={(v) => onUpdate({ transformationConfig: v })}
            options={options}
            placeholder="Type @ to pick a column; it inserts {total amount}. Use + - * / ( )"
            registerInsertHandler={handleRegisterInsert}
          />
          <ExpressionPreview text={String(selected.transformationConfig || "")} />
          <div className="flex flex-wrap gap-2">
            {["+", "-", "*", "/", "(", ")"].map((op) => (
              <Button key={op} type="button" size="sm" variant="outline" onClick={() => insertToken(op)}>
                {op}
              </Button>
            ))}
            <div className="mx-2 h-6 w-px bg-border" />
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
          <p className="text-xs text-muted-foreground">
            Tip: Use parentheses to control order of operations. Non-numeric references are treated as 0.
          </p>
        </div>
      )}

      {selected.transformationType === "currency_conversion" && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Amount</Label>
              <Select
                value={currencyCfg.amount.type}
                onValueChange={(v: "number" | "column") =>
                  setCurrencyCfg({ amount: { type: v, value: v === "number" ? 0 : "" } })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="number">Fixed Number</SelectItem>
                  <SelectItem value="column">From Column</SelectItem>
                </SelectContent>
              </Select>
              {currencyCfg.amount.type === "number" ? (
                <Input
                  type="number"
                  value={String(currencyCfg.amount.value ?? "")}
                  onChange={(e) =>
                    setCurrencyCfg({ amount: { ...currencyCfg.amount, value: parseFloat(e.target.value) || 0 } })
                  }
                  placeholder="e.g., 100"
                />
              ) : (
                <Select
                  value={String(currencyCfg.amount.value || "")}
                  onValueChange={(val: string) => setCurrencyCfg({ amount: { type: "column", value: val } })}
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
              )}
            </div>

            <div className="space-y-2">
              <Label>Rate (multiplier)</Label>
              <Select
                value={currencyCfg.rate.type}
                onValueChange={(v: "number" | "column") =>
                  setCurrencyCfg({ rate: { type: v, value: v === "number" ? 1 : "" } })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="number">Fixed Number</SelectItem>
                  <SelectItem value="column">From Column</SelectItem>
                </SelectContent>
              </Select>
              {currencyCfg.rate.type === "number" ? (
                <Input
                  type="number"
                  step="0.0001"
                  value={String(currencyCfg.rate.value ?? "")}
                  onChange={(e) =>
                    setCurrencyCfg({ rate: { ...currencyCfg.rate, value: parseFloat(e.target.value) || 0 } })
                  }
                  placeholder="e.g., 3.75"
                />
              ) : (
                <Select
                  value={String(currencyCfg.rate.value || "")}
                  onValueChange={(val: string) => setCurrencyCfg({ rate: { type: "column", value: val } })}
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
              )}
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4 items-end">
            <div>
              <Label>Decimals</Label>
              <Input
                type="number"
                min={0}
                value={String(currencyCfg.decimals ?? 2)}
                onChange={(e) => setCurrencyCfg({ decimals: Math.max(0, parseInt(e.target.value || "0")) })}
              />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">Result = Amount × Rate. Amount/Rate can reference a column or be a fixed number.</p>
        </div>
      )}

      {selected.transformationType === "gemini_api" && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Input Source</Label>
              <Select
                value={selected.transformationSource || "document"}
                onValueChange={(v: "document" | "column") => onUpdate({ transformationSource: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="document">Entire Document</SelectItem>
                  <SelectItem value="column">Column Value</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {selected.transformationSource === "column" && (
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
              value={String(selected.transformationConfig || "")}
              onChange={(v) => onUpdate({ transformationConfig: v })}
              options={options}
              placeholder="Describe the transformation. Type @ to pick columns; it inserts {customer notes}. Example: Translate {customer notes} to English"
              registerInsertHandler={handleRegisterInsert}
            />
            <ExpressionPreview text={String(selected.transformationConfig || "")} />
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
            <p className="text-xs text-muted-foreground mt-1">Output is inserted directly into this transformation column.</p>
          </div>
        </div>
      )}
    </div>
  )
}
