"use client"

import { createContext, useCallback, useContext, useRef, useState } from "react"
import { useSupabaseClient } from "@/lib/supabase/hooks"
import type { Parser } from "@/lib/extractor/types"
import type { SchemaField } from "@/lib/schema"
import { uploadToStorage } from "@/lib/storage/client"

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
          // Upload to S3 via presigned URL (bypasses Vercel body limit)
          const storageKey = `${p.user_id}/${p.id}/detect-fields/${crypto.randomUUID()}/${file.name}`
          await uploadToStorage(storageKey, file, file.type)

          const response = await fetch(`/api/parsers/${p.id}/detect-fields`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              storage_path: storageKey,
              file_name: file.name,
              file_type: file.type,
            }),
          })

          if (!response.ok) {
            let errorMsg = "Detection failed"
            try {
              const errData = await response.json()
              errorMsg = errData.error ?? errorMsg
            } catch {
              // Non-JSON response (e.g. Vercel 504 timeout)
              if (response.status === 504) {
                errorMsg = "Detection timed out — try a smaller or single-page document"
              } else {
                errorMsg = `Detection failed (${response.status}). Please try again.`
              }
            }
            throw new Error(errorMsg)
          }

          const data = await response.json()

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
