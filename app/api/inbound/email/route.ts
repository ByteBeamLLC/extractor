import { type NextRequest, NextResponse } from "next/server"
import { waitUntil } from "@vercel/functions"
import { createSupabaseServiceRoleClient } from "@/lib/supabase/server"
import { runExtraction } from "@/lib/extraction/runExtraction"
import { countDocumentPages } from "@/lib/extraction/api"
import { deliverToIntegrations } from "@/lib/extractor/integrations/orchestrator"
import { reserveCredits, refundCredits } from "@/lib/extractor/billing/credits"
import { reportError } from "@/lib/errorReporting"
import type { SchemaField } from "@/lib/schema"

export const runtime = "nodejs"
export const maxDuration = 120 // allow up to 2 min for multi-attachment emails

// Match the Gmail poller's allowlist
const SUPPORTED_MIME_TYPES = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-excel",
  "text/csv",
  "text/plain",
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/gif",
  "image/webp",
])

const MAX_ATTACHMENT_SIZE = 10 * 1024 * 1024 // 10MB

/**
 * POST /api/inbound/email
 *
 * Receives inbound emails from SendGrid Inbound Parse (parsed mode).
 * SendGrid POSTs multipart/form-data with fields:
 *   - to, from, subject, text, html
 *   - headers (raw email headers including Message-ID)
 *   - attachment1, attachment2, ... (File objects)
 *   - attachment-info (JSON string with metadata)
 *
 * Routes to the correct parser by matching the "to" address
 * against parsers.inbound_email.
 *
 * Returns 200 immediately and processes in the background to avoid
 * SendGrid retry storms.
 */
export async function POST(request: NextRequest) {
  const supabase = createSupabaseServiceRoleClient()

  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 })
  }

  // Extract the "to" address to find the parser
  const toRaw = formData.get("to") as string | null
  if (!toRaw) {
    return NextResponse.json({ error: "Missing 'to' field" }, { status: 400 })
  }

  // SendGrid may send "Name <email>" format — extract just the email
  const toEmail = extractEmail(toRaw)
  if (!toEmail) {
    return NextResponse.json({ error: "Could not parse 'to' address" }, { status: 400 })
  }

  // Look up parser by inbound email
  const { data: parserRaw } = await supabase
    .from("parsers" as any)
    .select("*")
    .eq("inbound_email", toEmail.toLowerCase())
    .single()

  const parser = parserRaw as any
  if (!parser) {
    return NextResponse.json({ message: "No parser found for this address" }, { status: 200 })
  }

  if (parser.status !== "active") {
    return NextResponse.json({ message: "Parser is paused" }, { status: 200 })
  }

  const extractionType = parser.extraction_type ?? "fields"
  const schemaTree: SchemaField[] = parser.fields ?? []
  if (extractionType === "fields" && schemaTree.length === 0) {
    return NextResponse.json({ message: "Parser has no fields configured" }, { status: 200 })
  }

  // --- Deduplication via Message-ID ---
  const headersRaw = formData.get("headers") as string | null
  const messageId = extractMessageId(headersRaw)

  if (messageId) {
    const { data: existing } = await supabase
      .from("parser_processed_documents" as any)
      .select("id")
      .eq("parser_id", parser.id)
      .eq("source_type", "email")
      .contains("integration_status", { email_message_id: messageId } as any)
      .limit(1)

    if (existing && existing.length > 0) {
      return NextResponse.json({ message: "Already processed" }, { status: 200 })
    }
  }

  const from = (formData.get("from") as string) ?? ""
  const subject = (formData.get("subject") as string) ?? ""
  const textBody = (formData.get("text") as string) ?? ""

  // Collect all items to process: email body text + attachments
  const items: { fileName: string; mimeType: string; base64: string; size: number }[] = []

  // 1. Process email body text if non-empty
  if (textBody.trim().length > 0) {
    const bodyContent = `From: ${from}\nSubject: ${subject}\n\n${textBody}`
    const bodyBase64 = Buffer.from(bodyContent, "utf-8").toString("base64")
    items.push({
      fileName: `email-body-${subject.slice(0, 50) || "no-subject"}.txt`,
      mimeType: "text/plain",
      base64: bodyBase64,
      size: Buffer.byteLength(bodyContent, "utf-8"),
    })
  }

  // 2. Collect attachments
  for (let i = 1; i <= 30; i++) {
    const file = formData.get(`attachment${i}`) as File | null
    if (!file) break

    const mimeType = file.type?.toLowerCase() ?? ""
    if (!SUPPORTED_MIME_TYPES.has(mimeType)) {
      console.log(`[inbound/email] Skipping unsupported attachment type: ${mimeType} (${file.name})`)
      continue
    }

    if (file.size > MAX_ATTACHMENT_SIZE) {
      console.log(`[inbound/email] Skipping oversized attachment: ${file.name} (${file.size} bytes)`)
      continue
    }

    const arrayBuffer = await file.arrayBuffer()
    const base64 = Buffer.from(arrayBuffer).toString("base64")
    items.push({
      fileName: file.name || `attachment${i}`,
      mimeType,
      base64,
      size: file.size,
    })
  }

  if (items.length === 0) {
    return NextResponse.json({ message: "No processable content found" }, { status: 200 })
  }

  // Return 200 immediately — process in background via waitUntil
  // This prevents SendGrid from timing out and retrying
  waitUntil(processEmail(supabase, parser, items, messageId))

  return NextResponse.json({ message: "Accepted", items: items.length })
}

/**
 * Background processing of the email items (attachments + body).
 */
async function processEmail(
  supabase: ReturnType<typeof createSupabaseServiceRoleClient>,
  parser: any,
  items: { fileName: string; mimeType: string; base64: string; size: number }[],
  messageId: string | null
) {
  const extractionType = parser.extraction_type ?? "fields"
  const schemaTree: SchemaField[] = parser.fields ?? []

  try {
    // Count pages for all items
    const itemPageCounts: number[] = []
    for (const item of items) {
      const pages = await countDocumentPages(
        new Uint8Array(Buffer.from(item.base64, "base64")),
        item.fileName,
        item.mimeType
      )
      itemPageCounts.push(pages)
    }

    // Process each item — reserve credits atomically per-item. If the user
    // runs out of credits partway through a multi-attachment email, earlier
    // items are processed and later ones are skipped, which is fairer than
    // the old behavior of failing the whole batch on an upfront check.
    for (let idx = 0; idx < items.length; idx++) {
      const item = items[idx]
      const itemPages = itemPageCounts[idx]
      const docId = crypto.randomUUID()
      let reservedPages = 0

      try {
        const reservation = await reserveCredits(
          parser.user_id,
          itemPages,
          docId,
          supabase
        )
        if (!reservation.reserved) {
          console.log(
            `[inbound/email] Stopping at item ${idx + 1}/${items.length}: ${reservation.reason} (remaining=${reservation.remaining})`
          )
          break
        }
        reservedPages = reservation.pagesCharged

        // Create processing log — store messageId for deduplication
        const { error: insertErr } = await supabase
          .from("parser_processed_documents" as any)
          .insert({
            id: docId,
            parser_id: parser.id,
            user_id: parser.user_id,
            source_type: "email",
            file_name: item.fileName,
            mime_type: item.mimeType,
            file_size: item.size,
            page_count: itemPages,
            credits_used: reservation.pagesCharged,
            status: "processing",
            integration_status: messageId ? { email_message_id: messageId } : {},
          } as any)

        if (insertErr) {
          console.error("[inbound/email] Doc insert failed:", insertErr)
          await refundCredits(parser.user_id, docId, reservedPages, supabase)
          reservedPages = 0
          continue
        }

        // Store original file to Supabase Storage for preview & reprocessing
        if (docId) {
          const safeName = item.fileName.replace(/[^a-zA-Z0-9._-]/g, "_")
          const storagePath = `${parser.user_id}/${parser.id}/${docId}/${safeName}`
          const fileBuffer = Buffer.from(item.base64, "base64")
          try {
            await supabase.storage.createBucket("parser-documents", {
              public: false,
              fileSizeLimit: 50 * 1024 * 1024,
            }).catch(() => {})
            const { error: uploadError } = await supabase.storage
              .from("parser-documents")
              .upload(storagePath, fileBuffer, {
                contentType: item.mimeType || "application/octet-stream",
                upsert: true,
              })
            if (uploadError) {
              console.error("[inbound/email] File storage failed:", uploadError.message)
            }
          } catch (err) {
            console.error("[inbound/email] File storage error:", err)
          }
        }

        // Run extraction
        const result = await runExtraction({
          fileData: item.base64,
          fileName: item.fileName,
          mimeType: item.mimeType,
          schemaTree,
          extractionPromptOverride: parser.extraction_prompt_override,
          extractionType,
        })

        // Update processing log with final status. Credits were already
        // reserved; refund if the extraction failed.
        await supabase
          .from("parser_processed_documents" as any)
          .update({
            status: result.error ? "error" : "completed",
            results: result.results,
            processed_at: new Date().toISOString(),
            error_message: result.error ?? null,
          } as any)
          .eq("id", docId)

        if (result.error) {
          await refundCredits(parser.user_id, docId, reservedPages, supabase)
        } else {
          await deliverToIntegrations(
            parser.id,
            parser.name,
            docId,
            result.results,
            { file_name: item.fileName, mime_type: item.mimeType, source_type: "email", page_count: itemPages },
            supabase as any
          )
        }

        // Update parser stats
        await supabase
          .from("parsers" as any)
          .update({
            document_count: (parser.document_count ?? 0) + 1,
            last_processed_at: new Date().toISOString(),
          } as any)
          .eq("id", parser.id)

        parser.document_count = (parser.document_count ?? 0) + 1
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Unknown error"
        console.error(`[inbound/email] Error processing ${item.fileName}:`, errorMsg)
        // Refund the reservation if we threw after reserving. Idempotent:
        // if the doc was already marked as refunded (by the error path in
        // the try block), refund_credits is a no-op.
        if (reservedPages > 0) {
          await refundCredits(parser.user_id, docId, reservedPages, supabase).catch(
            (e) => console.error("[inbound/email] Refund failed:", e)
          )
        }
      }
    }
  } catch (err) {
    console.error(`[inbound/email] Background processing error:`, err)
    reportError(err, { route: "/api/inbound/email", extra: { parserId: parser.id } })
  }
}

/**
 * Extract Message-ID from raw email headers.
 * Headers is a string like: "Message-ID: <abc123@mail.gmail.com>\r\nFrom: ..."
 */
function extractMessageId(headers: string | null): string | null {
  if (!headers) return null
  const match = headers.match(/^Message-ID:\s*(.+)$/im)
  return match ? match[1].trim() : null
}

/**
 * Extract email address from formats like:
 *   "John Doe <john@example.com>"
 *   "john@example.com"
 *   "<john@example.com>"
 */
function extractEmail(raw: string): string | null {
  const angleMatch = raw.match(/<([^>]+)>/)
  if (angleMatch) return angleMatch[1].toLowerCase()
  const trimmed = raw.trim().toLowerCase()
  if (trimmed.includes("@")) return trimmed
  return null
}
