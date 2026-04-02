import { type NextRequest, NextResponse } from "next/server"
import { createSupabaseServerComponentClient, createSupabaseServiceRoleClient } from "@/lib/supabase/server"

export const runtime = "nodejs"
export const maxDuration = 30

/**
 * GET /api/parsers/[parserId]/documents/[documentId]/file
 *
 * Returns a signed URL for the original document file stored in Supabase Storage.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: { parserId: string; documentId: string } }
) {
  const supabase = createSupabaseServerComponentClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Load document to get file name and verify ownership
  const { data: doc, error: docError } = await supabase
    .from("parser_processed_documents" as any)
    .select("file_name, user_id")
    .eq("id", params.documentId)
    .eq("parser_id", params.parserId)
    .eq("user_id", user.id)
    .single()

  if (docError || !doc) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 })
  }

  const d = doc as any
  const safeName = (d.file_name ?? "uploaded").replace(/[^a-zA-Z0-9._-]/g, "_")
  const storagePath = `${user.id}/${params.parserId}/${params.documentId}/${safeName}`

  // Use service role client to bypass storage RLS
  const adminClient = createSupabaseServiceRoleClient()

  // Create a signed URL (valid for 1 hour)
  const { data: signedUrlData, error: signError } = await adminClient.storage
    .from("parser-documents")
    .createSignedUrl(storagePath, 3600)

  if (signError || !signedUrlData?.signedUrl) {
    return NextResponse.json(
      { error: "File not available. Only recently uploaded documents have preview support." },
      { status: 404 }
    )
  }

  return NextResponse.json({ url: signedUrlData.signedUrl })
}
