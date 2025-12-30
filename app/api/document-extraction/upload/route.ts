import { type NextRequest, NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import type { Database } from "@/lib/supabase/types"
import { extractDocumentFile } from "@/lib/document-extraction/extract"

export async function POST(request: NextRequest) {
  try {
    const supabase = createSupabaseServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get("file") as File | null
    const folderId = formData.get("folder_id") as string | null
    const extractionMethod = (formData.get("extraction_method") as string) || "dots.ocr"

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Validate folder_id if provided
    if (folderId) {
      const { data: folder } = await supabase
        .from("document_extraction_folders")
        .select("id")
        .eq("id", folderId)
        .eq("user_id", user.id)
        .single()

      if (!folder) {
        return NextResponse.json({ error: "Folder not found" }, { status: 404 })
      }
    }

    // Generate file ID
    const fileId = crypto.randomUUID()
    const fileExt = file.name.split(".").pop()?.toLowerCase() || "bin"
    const safeFileName = file.name.replace(/[^a-zA-Z0-9-_.]/g, "_")
    const storagePath = `${user.id}/${fileId}/original.${fileExt}`

    // Upload to Supabase storage
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const { error: uploadError } = await supabase.storage
      .from("document-extraction")
      .upload(storagePath, buffer, {
        contentType: file.type || "application/octet-stream",
        cacheControl: "3600",
        upsert: false,
      })

    if (uploadError) {
      console.error("[document-extraction] Error uploading file:", uploadError)
      return NextResponse.json({ error: uploadError.message }, { status: 500 })
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from("document-extraction")
      .getPublicUrl(storagePath)

    const fileUrl = urlData?.publicUrl || ""

    // Create file record
    const { data: fileRecord, error: dbError } = await supabase
      .from("document_extraction_files")
      .insert({
        id: fileId,
        name: safeFileName,
        folder_id: folderId || null,
        user_id: user.id,
        file_url: fileUrl,
        mime_type: file.type || null,
        file_size: buffer.length,
        extraction_status: "pending",
        extraction_method: extractionMethod,
      })
      .select()
      .single()

    if (dbError) {
      console.error("[document-extraction] Error creating file record:", dbError)
      // Try to clean up storage
      await supabase.storage.from("document-extraction").remove([storagePath])
      return NextResponse.json({ error: dbError.message }, { status: 500 })
    }

    // Trigger extraction asynchronously (don't wait for it)
    // Call extraction function directly instead of HTTP fetch to avoid auth issues
    // Run extraction in background (don't await)
    extractDocumentFile({
      fileId,
      userId: user.id,
      supabase,
      extractionMethod,
    }).catch((error) => {
      console.error("[document-extraction] Error during extraction:", error)
    })

    return NextResponse.json({ file: fileRecord })
  } catch (error) {
    console.error("[document-extraction] Unexpected error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}

