"use client"

import { createContext, useCallback, useContext, useRef, useState } from "react"
import { useSupabaseClient } from "@/lib/supabase/hooks"
import type { Parser } from "@/lib/extractor/types"
import type { SchemaField } from "@/lib/schema"

export interface FieldDetectionState {
  status: "idle" | "detecting" | "done" | "error"
  suggestedFields: SchemaField[] | null
  error: string | null
}

interface ActiveParserContextType {
  parser: Parser | null
  setParser: (parser: Parser | null) => void
  updateParser: (updates: Partial<Parser>) => Promise<void>
  /** Auto-detect field state — persists across sub-page navigation */
  fieldDetection: FieldDetectionState
  /** Kick off auto-detection with a file. Safe to call from any sub-page. */
  detectFields: (file: File) => void
  /** Clear suggestions (after accept or dismiss) */
  clearFieldDetection: () => void
}

const IDLE_DETECTION: FieldDetectionState = {
  status: "idle",
  suggestedFields: null,
  error: null,
}

const ActiveParserContext = createContext<ActiveParserContextType>({
  parser: null,
  setParser: () => {},
  updateParser: async () => {},
  fieldDetection: IDLE_DETECTION,
  detectFields: () => {},
  clearFieldDetection: () => {},
})

export function ActiveParserProvider({ children }: { children: React.ReactNode }) {
  const [parser, setParser] = useState<Parser | null>(null)
  const [fieldDetection, setFieldDetection] = useState<FieldDetectionState>(IDLE_DETECTION)
  const supabase = useSupabaseClient()
  const parserRef = useRef(parser)
  parserRef.current = parser

  const updateParser = useCallback(
    async (updates: Partial<Parser>) => {
      const p = parserRef.current
      if (!p) return
      const { data, error } = await supabase
        .from("parsers")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", p.id)
        .select("*")
        .single()

      if (!error && data) {
        setParser(data)
      }
    },
    [supabase]
  )

  const detectFields = useCallback(
    (file: File) => {
      const p = parserRef.current
      if (!p) return

      setFieldDetection({ status: "detecting", suggestedFields: null, error: null })

      // Run in background — result lands in context regardless of which page is active
      ;(async () => {
        try {
          const buffer = await file.arrayBuffer()
          const base64 = btoa(
            new Uint8Array(buffer).reduce(
              (data, byte) => data + String.fromCharCode(byte),
              ""
            )
          )

          const response = await fetch(`/api/parsers/${p.id}/detect-fields`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              file: { name: file.name, type: file.type, data: base64 },
            }),
          })

          const data = await response.json()

          if (!response.ok) {
            throw new Error(data.error ?? "Detection failed")
          }

          setFieldDetection({
            status: "done",
            suggestedFields: data.fields,
            error: null,
          })
        } catch (err) {
          setFieldDetection({
            status: "error",
            suggestedFields: null,
            error: err instanceof Error ? err.message : "Failed to detect fields",
          })
        }
      })()
    },
    []
  )

  const clearFieldDetection = useCallback(() => {
    setFieldDetection(IDLE_DETECTION)
  }, [])

  return (
    <ActiveParserContext.Provider
      value={{
        parser,
        setParser,
        updateParser,
        fieldDetection,
        detectFields,
        clearFieldDetection,
      }}
    >
      {children}
    </ActiveParserContext.Provider>
  )
}

export function useActiveParser() {
  return useContext(ActiveParserContext)
}
