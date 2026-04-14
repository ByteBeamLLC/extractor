import { type NextRequest, NextResponse } from "next/server"
import { createSupabaseServerComponentClient, createSupabaseServiceRoleClient } from "@/lib/supabase/server"

export const runtime = "nodejs"
export const maxDuration = 30

/**
 * POST /api/parsers/[parserId]/documents/batch-delete
 *
 * Deletes one or more documents from the database and storage.
 * Body: { document_ids: string[] }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { parserId: string } }
) {
  const supabase = createSupabaseServerComponentClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await request.json()
  const { document_ids } = body

  if (!Array.isArray(document_ids) || document_ids.length === 0) {
    return NextResponse.json({ error: "document_ids must be a non-empty array" }, { status: 400 })
  }

  if (document_ids.length > 100) {
    return NextResponse.json({ error: "Cannot delete more than 100 documents at once" }, { status: 400 })
  }

  // Fetch documents to verify ownership and get file names for storage cleanup
  const { data: docs, error: fetchError } = await supabase
    .from("parser_processed_documents" as any)
    .select("id, file_name, user_id")
    .eq("parser_id", params.parserId)
    .eq("user_id", user.id)
    .in("id", document_ids)

  if (fetchError) {
    return NextResponse.json({ error: "Failed to fetch documents" }, { status: 500 })
  }

  if (!docs || docs.length === 0) {
    return NextResponse.json({ error: "No matching documents found" }, { status: 404 })
  }

  const validIds = (docs as any[]).map((d) => d.id)

  // Delete from database
  const { error: deleteError } = await supabase
    .from("parser_processed_documents" as any)
    .delete()
    .eq("parser_id", params.parserId)
    .eq("user_id", user.id)
    .in("id", validIds)

  if (deleteError) {
    return NextResponse.json({ error: "Failed to delete documents" }, { status: 500 })
  }

  // Best-effort cleanup of storage files
  const adminClient = createSupabaseServiceRoleClient()
  const storagePaths = (docs as any[]).map((d) => {
    const safeName = (d.file_name ?? "uploaded").replace(/[^a-zA-Z0-9._-]/g, "_")
    return `${user.id}/${params.parserId}/${d.id}/${safeName}`
  })

  adminClient.storage
    .from("parser-documents")
    .remove(storagePaths)
    .catch(() => {})

  return NextResponse.json({ deleted: validIds.length })
}
