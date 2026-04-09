import { NextRequest, NextResponse } from "next/server"
import {
  createSupabaseServerComponentClient,
  createSupabaseServiceRoleClient,
} from "@/lib/supabase/server"
import { generateInboundEmail } from "@/lib/extractor/inbound-email"
import { trackServerEvent } from "@/lib/analytics/server"

export const runtime = "nodejs"
export const maxDuration = 30

// Doc-type → parser name prefix in the user's app dashboard.
// Kept neutral for `credentials` so we never label sensitive content.
const NAME_PREFIX: Record<string, string> = {
  study_notes: "Notes",
  expense_list: "Expense list",
  contact_list: "Contact list",
  meeting_notes: "Meeting notes",
  legal_doc: "Legal document",
  homework_essay: "Homework",
  math_work: "Math work",
  credentials: "Document",
  generic: "Document",
}

const MAX_TEXT_BYTES = 200_000 // ~200KB of text — generous, handwriting is short
const MAX_IMAGE_BYTES = 25 * 1024 * 1024 // 25MB

interface BridgeRequestBody {
  text?: string
  language?: string
  doc_type?: string
  image?: string // base64
  mimeType?: string
  fileName?: string
  fileSize?: number
}

function buildParserName(docType: string, text: string): string {
  const prefix = NAME_PREFIX[docType] ?? NAME_PREFIX.generic
  // Take the first non-empty line, strip whitespace, cap at 40 chars
  const firstLine = text.split(/\n+/).map((l) => l.trim()).find((l) => l.length > 0) ?? ""
  const snippet = firstLine.replace(/\s+/g, " ").slice(0, 40).trim()
  return snippet ? `${prefix} — ${snippet}` : prefix
}

export async function POST(req: NextRequest) {
  const startedAt = Date.now()

  let body: BridgeRequestBody
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const text = typeof body.text === "string" ? body.text.trim() : ""
  const language = typeof body.language === "string" && body.language ? body.language : "en"
  const docType = typeof body.doc_type === "string" ? body.doc_type : "generic"
  const image = typeof body.image === "string" ? body.image : ""
  const mimeType = typeof body.mimeType === "string" ? body.mimeType : ""
  const fileName = typeof body.fileName === "string" && body.fileName ? body.fileName : "handwriting.jpg"
  const fileSize = typeof body.fileSize === "number" ? body.fileSize : null

  if (!text) {
    return NextResponse.json({ error: "text is required" }, { status: 400 })
  }
  if (Buffer.byteLength(text, "utf8") > MAX_TEXT_BYTES) {
    return NextResponse.json({ error: "text is too large" }, { status: 413 })
  }
  if (!image || !mimeType) {
    return NextResponse.json({ error: "image and mimeType are required" }, { status: 400 })
  }

  // The user MUST already have a session (anonymous is fine). The client is
  // expected to call supabase.auth.signInAnonymously() before hitting this route
  // so that the cookie is set on the request.
  const supabase = createSupabaseServerComponentClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json(
      { error: "No session. Sign in anonymously before calling the bridge." },
      { status: 401 }
    )
  }

  const admin = createSupabaseServiceRoleClient()

  // 1. Create the parser (full_content extraction, no schema)
  const parserName = buildParserName(docType, text)
  const webhookToken = crypto.randomUUID().replace(/-/g, "")

  const { data: parserRow, error: parserError } = await admin
    .from("parsers" as any)
    .insert({
      user_id: user.id,
      name: parserName,
      description: null,
      fields: [],
      extraction_type: "full_content",
      extraction_mode: "ai",
      extraction_prompt_override: null,
      inbound_email: generateInboundEmail(parserName),
      inbound_webhook_token: webhookToken,
      status: "active",
    } as any)
    .select("id")
    .single()

  if (parserError || !parserRow) {
    console.error("[bridge] Failed to create parser:", parserError)
    return NextResponse.json({ error: "Failed to create parser" }, { status: 500 })
  }
  const parserId = (parserRow as { id: string }).id

  // 2. Pre-generate document id and upload image to canonical path
  const docId = crypto.randomUUID()
  const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_")
  const storagePath = `${user.id}/${parserId}/${docId}/${safeName}`

  try {
    const buffer = Buffer.from(image, "base64")
    if (buffer.byteLength > MAX_IMAGE_BYTES) {
      return NextResponse.json({ error: "image too large" }, { status: 413 })
    }
    const { error: uploadError } = await admin.storage
      .from("parser-documents")
      .upload(storagePath, buffer, { contentType: mimeType, upsert: false })
    if (uploadError) {
      console.error("[bridge] Storage upload failed:", uploadError)
    }
  } catch (err) {
    console.error("[bridge] Storage upload threw:", err)
  }

  // 3. Insert the processed document — already complete, results=full markdown
  const { error: docError } = await admin
    .from("parser_processed_documents" as any)
    .insert({
      id: docId,
      parser_id: parserId,
      user_id: user.id,
      source_type: "upload",
      file_name: fileName,
      mime_type: mimeType,
      file_size: fileSize,
      page_count: 1,
      status: "completed",
      results: {
        markdown: text,
        language,
        doc_type: docType,
      },
      processed_at: new Date().toISOString(),
    } as any)

  if (docError) {
    console.error("[bridge] Failed to insert document:", docError)
    return NextResponse.json({ error: "Failed to create document" }, { status: 500 })
  }

  // 4. Backfill the handwriting_uploads row if there is one we can match.
  // We use the same IP+UA distinct_id formula as the handwriting tool route.
  try {
    const ip = req.headers.get("x-forwarded-for") ?? "unknown"
    const ua = req.headers.get("user-agent") ?? "unknown"
    const distinctId = `hwt_${Buffer.from(`${ip}:${ua}`).toString("base64url").slice(0, 24)}`
    await admin
      .from("handwriting_uploads" as any)
      .update({ linked_parser_id: parserId, linked_document_id: docId } as any)
      .eq("distinct_id", distinctId)
      .is("linked_document_id", null)
      .order("created_at", { ascending: false })
      .limit(1)
  } catch (err) {
    // Backfill is best-effort — never block the bridge response on it.
    console.error("[bridge] Failed to link handwriting_uploads row:", err)
  }

  trackServerEvent("hwt_bridge_provisioned", {
    distinct_id: user.id,
    user_id: user.id,
    parser_id: parserId,
    document_id: docId,
    doc_type: docType,
    language,
    is_anonymous: user.is_anonymous === true,
    duration_ms: Date.now() - startedAt,
  })

  return NextResponse.json({ parserId, documentId: docId })
}
