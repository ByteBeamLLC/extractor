"use client"

import { useCallback, useState } from "react"
import { Upload, Loader2, FileText, AlertCircle, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { Parser } from "@/lib/extractor/types"
import { DocumentUploader } from "./DocumentUploader"
import { ExtractionResultsView } from "./ExtractionResultsView"

interface ParserTestPanelProps {
  parser: Parser
}

type TestState = "idle" | "uploading" | "extracting" | "completed" | "error"

export function ParserTestPanel({ parser }: ParserTestPanelProps) {
  const [state, setState] = useState<TestState>("idle")
  const [results, setResults] = useState<Record<string, any> | null>(null)
  const [warnings, setWarnings] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const [fileName, setFileName] = useState<string | null>(null)

  const handleFileSelected = useCallback(
    async (file: File) => {
      if (parser.fields.length === 0) {
        setError("Please add fields to your parser schema before testing.")
        setState("error")
        return
      }

      setFileName(file.name)
      setState("uploading")
      setError(null)
      setResults(null)
      setWarnings([])

      try {
        // Convert file to base64
        const buffer = await file.arrayBuffer()
        const base64 = btoa(
          new Uint8Array(buffer).reduce(
            (data, byte) => data + String.fromCharCode(byte),
            ""
          )
        )

        setState("extracting")

        const response = await fetch(`/api/extractor/parsers/${parser.id}/extract`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            file: {
              name: file.name,
              type: file.type,
              data: base64,
              size: file.size,
            },
            source_type: "upload",
          }),
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error ?? "Extraction failed")
        }

        setResults(data.results)
        setWarnings(data.warnings ?? [])
        setState("completed")
      } catch (err) {
        setError(err instanceof Error ? err.message : "Extraction failed")
        setState("error")
      }
    },
    [parser.id, parser.fields.length]
  )

  const handleReset = () => {
    setState("idle")
    setResults(null)
    setWarnings([])
    setError(null)
    setFileName(null)
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-1">Test Extraction</h3>
        <p className="text-sm text-muted-foreground">
          Upload a document to test your parser&apos;s extraction capabilities.
        </p>
      </div>

      {/* Upload area */}
      {(state === "idle" || state === "error") && (
        <>
          <DocumentUploader onFileSelected={handleFileSelected} />
          {error && (
            <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}
        </>
      )}

      {/* Processing state */}
      {(state === "uploading" || state === "extracting") && (
        <div className="border-2 border-dashed rounded-xl p-12 text-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto mb-4" />
          <p className="text-sm font-medium">
            {state === "uploading" ? "Uploading document..." : "Extracting data with AI..."}
          </p>
          {fileName && (
            <p className="text-xs text-muted-foreground mt-1">{fileName}</p>
          )}
        </div>
      )}

      {/* Results */}
      {state === "completed" && results && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-green-600">
              <CheckCircle2 className="h-4 w-4" />
              Extraction complete
              {fileName && <span className="text-muted-foreground">({fileName})</span>}
            </div>
            <Button variant="outline" size="sm" onClick={handleReset}>
              Test Another Document
            </Button>
          </div>

          {warnings.length > 0 && (
            <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg">
              <p className="text-sm font-medium text-amber-800 dark:text-amber-200 mb-1">
                Warnings
              </p>
              {warnings.map((w, i) => (
                <p key={i} className="text-xs text-amber-700 dark:text-amber-300">
                  {w}
                </p>
              ))}
            </div>
          )}

          <ExtractionResultsView results={results} fields={parser.fields} />
        </div>
      )}
    </div>
  )
}
