"use client"

import { useState } from "react"
import { Copy, Check, Code, Table2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { SchemaField } from "@/lib/schema"

interface ExtractionResultsViewProps {
  results: Record<string, any>
  fields: SchemaField[]
}

export function ExtractionResultsView({ results, fields }: ExtractionResultsViewProps) {
  const [copied, setCopied] = useState(false)
  const [view, setView] = useState<"table" | "json">("table")

  // Strip __meta__ from results for display
  const { __meta__, ...displayResults } = results

  const handleCopyJson = async () => {
    await navigator.clipboard.writeText(JSON.stringify(displayResults, null, 2))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const renderValue = (value: any): React.ReactNode => {
    if (value === null || value === undefined || value === "-") {
      return <span className="text-muted-foreground italic">—</span>
    }
    if (typeof value === "boolean") {
      return <Badge variant="outline">{value ? "true" : "false"}</Badge>
    }
    if (Array.isArray(value)) {
      if (value.length === 0) return <span className="text-muted-foreground italic">empty</span>
      // Check if array of objects (table)
      if (typeof value[0] === "object" && value[0] !== null) {
        return (
          <div className="overflow-x-auto mt-1">
            <table className="text-xs border-collapse w-full">
              <thead>
                <tr>
                  {Object.keys(value[0]).map((key) => (
                    <th key={key} className="border px-2 py-1 bg-muted text-left font-medium">
                      {key}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {value.map((row, i) => (
                  <tr key={i}>
                    {Object.values(row).map((cell, j) => (
                      <td key={j} className="border px-2 py-1">
                        {String(cell ?? "—")}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      }
      return <span>{value.join(", ")}</span>
    }
    if (typeof value === "object") {
      return (
        <pre className="text-xs bg-muted rounded p-2 mt-1 overflow-x-auto">
          {JSON.stringify(value, null, 2)}
        </pre>
      )
    }
    return <span>{String(value)}</span>
  }

  // Flatten fields for table view (just top-level)
  const fieldEntries = fields
    .filter((f) => f.type !== "input")
    .map((f) => ({
      id: f.id,
      name: f.name,
      type: f.type,
      value: displayResults[f.id],
    }))

  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="flex items-center justify-between p-3 border-b bg-muted/30">
        <Tabs value={view} onValueChange={(v) => setView(v as "table" | "json")}>
          <TabsList className="h-8">
            <TabsTrigger value="table" className="text-xs h-7">
              <Table2 className="h-3.5 w-3.5 mr-1" />
              Table
            </TabsTrigger>
            <TabsTrigger value="json" className="text-xs h-7">
              <Code className="h-3.5 w-3.5 mr-1" />
              JSON
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <Button variant="ghost" size="sm" onClick={handleCopyJson}>
          {copied ? (
            <Check className="h-3.5 w-3.5 mr-1 text-green-600" />
          ) : (
            <Copy className="h-3.5 w-3.5 mr-1" />
          )}
          {copied ? "Copied" : "Copy JSON"}
        </Button>
      </div>

      {view === "table" ? (
        <div className="divide-y">
          {fieldEntries.map((entry) => (
            <div key={entry.id} className="flex items-start gap-4 p-3">
              <div className="w-1/3 shrink-0">
                <span className="text-sm font-medium">{entry.name}</span>
                <Badge variant="outline" className="text-[10px] ml-2">
                  {entry.type}
                </Badge>
              </div>
              <div className="flex-1 text-sm break-words min-w-0">
                {renderValue(entry.value)}
              </div>
            </div>
          ))}
          {fieldEntries.length === 0 && (
            <div className="p-6 text-center text-sm text-muted-foreground">
              No fields to display
            </div>
          )}
        </div>
      ) : (
        <pre className="p-4 text-xs overflow-auto max-h-[600px] bg-muted/20">
          {JSON.stringify(displayResults, null, 2)}
        </pre>
      )}
    </div>
  )
}
