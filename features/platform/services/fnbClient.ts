"use client"

import type { SerializedFile } from "./types"

export interface FnbExtractionEnvelope {
  success: boolean
  data?: any
  error?: string
}

export interface FnbTranslationEnvelope {
  success: boolean
  data?: any
  error?: string
}

const FNB_UPLOAD_LIMIT_MESSAGE =
  "The uploaded file exceeds the 3 MB limit for F&B extraction. Please compress or resize the image and retry."

export async function fetchFnbExtraction(file: SerializedFile): Promise<any> {
  const response = await fetch("/api/fnb/extract", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ file }),
  })

  if (response.status === 413) {
    throw new Error(FNB_UPLOAD_LIMIT_MESSAGE)
  }

  const body = await response.text()
  let payload: FnbExtractionEnvelope | null = null
  if (body) {
    try {
      payload = JSON.parse(body) as FnbExtractionEnvelope
    } catch (error) {
      throw new Error(
        `Extraction request failed: unable to parse JSON response (${response.status}). ${
          error instanceof Error ? error.message : String(error)
        }`,
      )
    }
  }

  if (!response.ok || !payload) {
    throw new Error(
      `Extraction request failed: ${response.status} ${response.statusText} - ${body.slice(0, 500)}`,
    )
  }

  if (!payload.success || !payload.data) {
    throw new Error(payload.error || "Extraction failed")
  }

  return payload.data
}

export async function fetchFnbTranslation(source: any): Promise<any> {
  const response = await fetch("/api/fnb/translate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ source }),
  })

  const body = await response.text()
  let payload: FnbTranslationEnvelope | null = null
  if (body) {
    try {
      payload = JSON.parse(body) as FnbTranslationEnvelope
    } catch (error) {
      throw new Error(
        `Translation request failed: unable to parse JSON response (${response.status}). ${
          error instanceof Error ? error.message : String(error)
        }`,
      )
    }
  }

  if (!response.ok || !payload) {
    throw new Error(
      `Translation request failed: ${response.status} ${response.statusText} - ${body.slice(0, 500)}`,
    )
  }

  if (!payload.success || !payload.data) {
    throw new Error(payload.error || "Translation failed")
  }

  return payload.data
}

export async function extractAndTranslateFnb(file: SerializedFile): Promise<{
  extraction: any
  translation: any
}> {
  const extraction = await fetchFnbExtraction(file)
  const source = extraction?.product_initial_language ?? extraction
  const translation = await fetchFnbTranslation(source)
  return { extraction, translation }
}
