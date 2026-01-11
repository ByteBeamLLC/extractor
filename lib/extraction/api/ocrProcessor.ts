/**
 * OCR processing utilities for dots.ocr integration
 */

import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/lib/supabase/types"
import { uploadOcrAnnotatedImage } from "@/lib/jobs/server"
import {
  resolveDotsOcrServiceUrl,
  resolveDotsOcrEndpoint,
  getDotsOcrApiKey,
  MARKDOWN_KEYS,
  IMAGE_KEYS,
  OCR_REQUEST_TIMEOUT_MS,
} from "./constants"
import type {
  DotsOcrArtifacts,
  ProcessDotsOcrOptions,
  ProcessDotsOcrResult,
} from "./types"
import { isDotsOcrSupported } from "./documentParser"

/**
 * Gathers all objects from a nested value for artifact extraction
 */
function gatherCandidateObjects(value: unknown): Record<string, unknown>[] {
  const out: Record<string, unknown>[] = []
  const seen = new Set<unknown>()
  const stack: unknown[] = [value]

  while (stack.length > 0) {
    const current = stack.pop()
    if (!current || typeof current !== "object") continue
    if (seen.has(current)) continue
    seen.add(current)
    out.push(current as Record<string, unknown>)

    if (Array.isArray(current)) {
      for (const entry of current) {
        stack.push(entry)
      }
    } else {
      for (const key of Object.keys(current)) {
        const next = (current as Record<string, unknown>)[key]
        if (next && typeof next === "object") {
          stack.push(next)
        }
      }
    }
  }
  return out
}

/**
 * Picks the first non-empty string from a value
 */
function pickFirstString(value: unknown): string | null {
  if (typeof value === "string" && value.trim().length > 0) {
    return value
  }
  if (Array.isArray(value)) {
    for (const entry of value) {
      if (typeof entry === "string" && entry.trim().length > 0) {
        return entry
      }
    }
  }
  return null
}

/**
 * Extracts markdown and image artifacts from OCR response payload
 */
export function extractDotsOcrArtifacts(payload: unknown): DotsOcrArtifacts | null {
  if (!payload) return null
  const candidates = gatherCandidateObjects(payload)

  for (const candidate of candidates) {
    if (!candidate || typeof candidate !== "object") continue

    let markdown: string | null = null
    for (const key of MARKDOWN_KEYS) {
      if (key in candidate) {
        markdown = pickFirstString(candidate[key])
        if (markdown) break
      }
    }

    let imageData: string | null = null
    let imageContentType: string | undefined
    for (const key of IMAGE_KEYS) {
      if (!(key in candidate)) continue
      const rawValue = candidate[key]
      const maybeString = pickFirstString(rawValue)
      if (maybeString) {
        imageData = maybeString
        if (typeof rawValue === "object" && rawValue) {
          const nestedType =
            typeof (rawValue as Record<string, unknown>).content_type === "string"
              ? (rawValue as Record<string, unknown>).content_type as string
              : typeof (rawValue as Record<string, unknown>).mime === "string"
                ? (rawValue as Record<string, unknown>).mime as string
                : undefined
          if (nestedType) {
            imageContentType = nestedType
          }
        }
        break
      }
    }

    if (markdown || imageData) {
      return {
        markdown: markdown ?? undefined,
        imageData: imageData ?? undefined,
        imageContentType,
      }
    }
  }

  return null
}

/**
 * Fetches with a configurable timeout
 */
async function fetchWithTimeout(
  input: RequestInfo | URL,
  init?: RequestInit,
  timeoutMs: number = OCR_REQUEST_TIMEOUT_MS
): Promise<Response> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const response = await fetch(input, { ...init, signal: controller.signal })
    return response
  } finally {
    clearTimeout(timeout)
  }
}

/**
 * Tries the local DotsOCR service
 */
async function tryLocalService(base64Payload: string, options: ProcessDotsOcrOptions): Promise<DotsOcrArtifacts | null> {
  const serviceUrl = resolveDotsOcrServiceUrl()
  if (!serviceUrl) return null

  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    }
    const apiKey = getDotsOcrApiKey()
    if (apiKey) {
      headers.Authorization = `Bearer ${apiKey}`
    }

    const response = await fetchWithTimeout(serviceUrl, {
      method: "POST",
      headers,
      body: JSON.stringify({
        image_base64: base64Payload,
        file_name: options.fileName,
        mime_type: options.mimeType,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text().catch(() => response.statusText)
      console.error(`[extraction] Local dots.ocr service error ${response.status}: ${errorText}`)
      return null
    }

    const payload = await response.json().catch((error) => {
      console.error("[extraction] Failed to parse local dots.ocr response:", error)
      return null
    })
    if (!payload) return null

    const artifacts = extractDotsOcrArtifacts(payload)
    if (!artifacts) {
      console.warn("[extraction] Local dots.ocr response missing expected artifacts")
    }
    return artifacts
  } catch (error) {
    if ((error as Error)?.name === "AbortError") {
      console.warn("[extraction] Local dots.ocr request timed out")
      return null
    }
    console.error("[extraction] Local dots.ocr service failed:", error)
    return null
  }
}

/**
 * Tries the HuggingFace DotsOCR endpoint
 */
async function tryHuggingFace(base64Payload: string): Promise<DotsOcrArtifacts | null> {
  const apiKey = process.env.HUGGINGFACE_API_KEY
  const endpoint = resolveDotsOcrEndpoint()
  if (!apiKey || !endpoint) return null

  try {
    const response = await fetchWithTimeout(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        inputs: base64Payload,
        parameters: {
          return_markdown: true,
          return_visualization: true,
        },
        options: {
          wait_for_model: true,
        },
      }),
    })

    if (!response.ok) {
      const errorText = await response.text().catch(() => response.statusText)
      throw new Error(`Hugging Face dots.ocr error ${response.status}: ${errorText}`)
    }

    const contentType = response.headers.get("content-type") ?? ""
    if (!contentType.includes("application/json")) {
      throw new Error(`Unexpected dots.ocr response type: ${contentType || "unknown"}`)
    }

    const payload = await response.json()
    const artifacts = extractDotsOcrArtifacts(payload)
    if (!artifacts) {
      console.warn("[extraction] dots.ocr response did not include markdown or annotated image")
    }
    return artifacts ?? null
  } catch (error) {
    if ((error as Error)?.name === "AbortError") {
      console.warn("[extraction] dots.ocr request timed out")
      return null
    }
    console.error("[extraction] dots.ocr processing failed:", error)
    return null
  }
}

/**
 * Persists an annotated image to storage
 */
async function persistAnnotatedImage(
  imageData: string,
  artifacts: DotsOcrArtifacts,
  supabase: SupabaseClient<Database>,
  userId: string,
  jobId: string,
  fileName?: string
): Promise<string | null> {
  try {
    // Handle URL images
    if (/^https?:\/\//i.test(imageData)) {
      try {
        const remoteResponse = await fetch(imageData)
        if (!remoteResponse.ok) {
          console.warn(
            `[extraction] Failed to fetch dots.ocr annotated image from ${imageData}: ${remoteResponse.status}`
          )
          return imageData
        }
        const arrayBuffer = await remoteResponse.arrayBuffer()
        const contentTypeForImage =
          artifacts.imageContentType || remoteResponse.headers.get("content-type") || undefined
        const buffer = Buffer.from(arrayBuffer)
        if (buffer.length === 0) return imageData
        return await uploadOcrAnnotatedImage(supabase, {
          userId,
          jobId,
          image: buffer,
          fileName: fileName ?? "annotated",
          contentType: contentTypeForImage ?? "image/png",
        })
      } catch (error) {
        console.error("[extraction] Failed to mirror annotated image URL:", error)
        return imageData
      }
    }

    // Handle base64 images
    let imageBuffer: Uint8Array | null = null
    let contentTypeForImage = artifacts.imageContentType

    const dataUriMatch = imageData.match(/^data:([^;]+);base64,(.*)$/)
    if (dataUriMatch) {
      contentTypeForImage = contentTypeForImage ?? dataUriMatch[1]
      imageBuffer = Buffer.from(dataUriMatch[2], "base64")
    } else {
      imageBuffer = Buffer.from(imageData, "base64")
    }

    if (imageBuffer && imageBuffer.length > 0) {
      return await uploadOcrAnnotatedImage(supabase, {
        userId,
        jobId,
        image: imageBuffer,
        fileName: fileName ?? "annotated",
        contentType: contentTypeForImage ?? "image/png",
      })
    }
  } catch (error) {
    console.error("[extraction] Failed to upload dots.ocr annotated image:", error)
  }
  return null
}

/**
 * Processes a document with DotsOCR
 */
export async function processWithDotsOCR(options: ProcessDotsOcrOptions): Promise<ProcessDotsOcrResult | null> {
  if (!options.bytes || options.bytes.length === 0) return null
  if (!isDotsOcrSupported(options.mimeType, options.fileName)) return null

  const base64Payload = Buffer.from(options.bytes).toString("base64")

  // Try local service first, then HuggingFace
  let artifacts = await tryLocalService(base64Payload, options)
  if (!artifacts) {
    artifacts = await tryHuggingFace(base64Payload)
  }

  if (!artifacts) {
    return null
  }

  const markdown = typeof artifacts.markdown === "string" ? artifacts.markdown.trim() : ""

  let annotatedImageUrl: string | null = null
  if (artifacts.imageData && options.supabase && options.userId && options.jobMeta?.jobId) {
    annotatedImageUrl = await persistAnnotatedImage(
      artifacts.imageData,
      artifacts,
      options.supabase,
      options.userId,
      options.jobMeta.jobId,
      options.fileName
    )
  } else if (artifacts.imageData && /^https?:\/\//i.test(artifacts.imageData)) {
    annotatedImageUrl = artifacts.imageData
  }

  return {
    markdown: markdown.length > 0 ? markdown : null,
    annotatedImageUrl,
  }
}
