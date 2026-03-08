/**
 * Markdown generation from documents using AI
 */

import { z } from "zod"
import { generateObject } from "@/lib/openrouter"
import { uploadOriginalFile } from "@/lib/jobs/server"
import type { GenerateMarkdownOptions, GenerateMarkdownResult } from "./types"
import { isDotsOcrSupported } from "./documentParser"

/**
 * Generates markdown from a document and uploads the original file
 */
export async function generateMarkdownFromDocument(
  options: GenerateMarkdownOptions
): Promise<GenerateMarkdownResult | null> {
  console.log("[extraction] generateMarkdownFromDocument called with:", {
    bytesLength: options.bytes?.length,
    fileName: options.fileName,
    mimeType: options.mimeType,
    hasSupabase: !!options.supabase,
    hasUserId: !!options.userId,
    hasJobMeta: !!options.jobMeta,
  })

  if (!options.bytes || options.bytes.length === 0) {
    console.log("[extraction] No bytes provided, returning null")
    return null
  }

  if (!isDotsOcrSupported(options.mimeType, options.fileName)) {
    console.log("[extraction] File type not supported for markdown generation")
    return null
  }

  // Upload original file to Supabase storage
  let originalFileUrl: string | null = null
  if (options.supabase && options.userId && options.jobMeta?.jobId) {
    console.log("[extraction] Uploading original file to storage...")
    try {
      originalFileUrl = await uploadOriginalFile(options.supabase, {
        userId: options.userId,
        jobId: options.jobMeta.jobId,
        file: options.bytes,
        fileName: options.fileName,
        contentType: options.mimeType,
      })
      console.log("[extraction] Original file uploaded successfully:", originalFileUrl)
    } catch (error) {
      console.error("[extraction] Failed to upload original file:", error)
    }
  } else {
    console.log("[extraction] Skipping original file upload - missing requirements:", {
      hasSupabase: !!options.supabase,
      hasUserId: !!options.userId,
      hasJobMeta: !!options.jobMeta,
      hasJobId: !!options.jobMeta?.jobId,
    })
  }

  // Generate markdown using Gemini
  let markdown: string | null = null
  try {
    console.log("[extraction] Starting markdown generation with Gemini...")
    const base64Payload = Buffer.from(options.bytes).toString("base64")
    const mimeType = options.mimeType || "image/png"

    const prompt = `You are converting a document to clean, readable Markdown.

Instructions:
- Extract all text content preserving the original structure
- Use proper markdown formatting (headings, lists, tables, bold, italic)
- Convert any tabular data to markdown tables
- Describe non-text elements briefly where relevant
- Focus on readability and accuracy
- Do not add interpretations or summaries, just convert the content
Return only the markdown content, no explanations.`

    console.log("[extraction] Calling Gemini for markdown generation...")
    const result = await generateObject({
      temperature: 0.1,
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            { type: "image", image: `data:${mimeType};base64,${base64Payload}` },
          ],
        },
      ],
      schema: z.object({
        markdown: z.string().describe("The clean markdown content of the document"),
      }),
    })

    markdown = result.object.markdown?.trim() || null
    console.log("[extraction] Markdown generation completed, length:", markdown?.length || 0)
  } catch (error) {
    console.error("[extraction] Failed to generate markdown:", error)
  }

  return {
    markdown,
    originalFileUrl,
  }
}
