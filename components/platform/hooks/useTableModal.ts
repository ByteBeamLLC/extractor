"use client"

import { useCallback, useState } from "react"

import type { ExtractionJob, SchemaField } from "@/lib/schema/types"

export interface TableModalPayload {
  column: SchemaField
  job: ExtractionJob
  rows: Record<string, any>[]
  columnHeaders: { key: string; label: string }[]
}

export function useTableModal() {
  const [payload, setPayload] = useState<TableModalPayload | null>(null)

  const open = useCallback((next: TableModalPayload) => {
    setPayload(next)
  }, [])

  const close = useCallback(() => {
    setPayload(null)
  }, [])

  return {
    isOpen: payload !== null,
    payload,
    open,
    close,
  }
}
