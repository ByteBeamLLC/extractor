"use client"

import type { SerializedFile } from "./types"

export interface ExtractRequestPayload {
  file: SerializedFile
  schemaTree?: unknown
  extractionPromptOverride?: string
}

export interface ExtractResponse {
  success: boolean
  results?: any
  warnings?: string[]
  handledWithFallback?: boolean
  error?: string
}

export async function submitExtraction(payload: ExtractRequestPayload): Promise<ExtractResponse> {
  const response = await fetch("/api/extract", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  })

  const body = await response.text()
  if (!response.ok) {
    throw new Error(
      `Extraction failed (${response.status} ${response.statusText}): ${body.slice(0, 500)}`,
    )
  }

  let parsed: ExtractResponse
  try {
    parsed = body ? (JSON.parse(body) as ExtractResponse) : { success: false }
  } catch (error) {
    throw new Error(
      `Failed to parse extraction response: ${
        error instanceof Error ? error.message : String(error)
      }. Body snippet: ${body.slice(0, 200)}`,
    )
  }

  return parsed
}
