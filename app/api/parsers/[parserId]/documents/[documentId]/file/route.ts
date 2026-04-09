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

  // Use service role client to bypass storage RLS
  const adminClient = createSupabaseServiceRoleClient()

  // Try the current user's path first. If the document was migrated from an
  // anonymous user (bridge flow), the file still lives under the old anon
  // user's path in storage. Fall back by listing the document's folder to
  // find the actual file regardless of which user_id prefix it's under.
  const primaryPath = `${user.id}/${params.parserId}/${params.documentId}/${safeName}`

  let signedUrl: string | null = null

  // 1. Try current user path
  const { data: primary } = await adminClient.storage
    .from("parser-documents")
    .createSignedUrl(primaryPath, 3600)

  if (primary?.signedUrl) {
    signedUrl = primary.signedUrl
  } else {
    // 2. Fallback: check if there's an account_migrations row pointing to an
    //    old anon user whose storage path still has the file.
    const { data: migration } = await adminClient
      .from("account_migrations")
      .select("anon_user_id")
      .eq("new_user_id", user.id)
      .eq("success", true)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()

    if (migration) {
      const anonPath = `${(migration as any).anon_user_id}/${params.parserId}/${params.documentId}/${safeName}`
      const { data: fallback } = await adminClient.storage
        .from("parser-documents")
        .createSignedUrl(anonPath, 3600)
      if (fallback?.signedUrl) {
        signedUrl = fallback.signedUrl
      }
    }
  }

  if (!signedUrl) {
    return NextResponse.json(
      { error: "File not available. Only recently uploaded documents have preview support." },
      { status: 404 }
    )
  }

  return NextResponse.json({ url: signedUrl })
}
