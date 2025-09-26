"use client"

import type { SerializedFile } from "./types"

export interface PharmaContentEnvelope {
  success: boolean
  error?: string
  [key: string]: any
}

export async function fetchPharmaContent(file: SerializedFile): Promise<any> {
  const response = await fetch("/api/pharma/content", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ file }),
  })

  const body = await response.text()

  let payload: PharmaContentEnvelope | null = null
  if (body) {
    try {
      payload = JSON.parse(body) as PharmaContentEnvelope
    } catch (error) {
      throw new Error(
        `Pharma agent failed to return JSON (${response.status}). ${
          error instanceof Error ? error.message : String(error)
        }`,
      )
    }
  }

  if (!response.ok || !payload) {
    throw new Error(
      `Pharma agent failed (${response.status} ${response.statusText}): ${body.slice(0, 500)}`,
    )
  }

  if (!payload.success) {
    throw new Error(payload.error || "Pharma agent returned unsuccessful status")
  }

  return payload
}
