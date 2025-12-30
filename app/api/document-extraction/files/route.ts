import { type NextRequest, NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import type { Database } from "@/lib/supabase/types"

export async function GET(request: NextRequest) {
  try {
    const supabase = createSupabaseServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const folderId = searchParams.get("folder_id")

    let query = supabase
      .from("document_extraction_files")
      .select("*")
      .eq("user_id", user.id)

    if (folderId) {
      query = query.eq("folder_id", folderId)
    } else {
      query = query.is("folder_id", null)
    }

    const { data, error } = await query.order("created_at", { ascending: false })

    if (error) {
      console.error("[document-extraction] Error fetching files:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ files: data || [] })
  } catch (error) {
    console.error("[document-extraction] Unexpected error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = createSupabaseServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { id, name, folder_id } = body

    if (!id) {
      return NextResponse.json({ error: "File ID is required" }, { status: 400 })
    }

    // Verify file belongs to user
    const { data: existingFile } = await supabase
      .from("document_extraction_files")
      .select("id")
      .eq("id", id)
      .eq("user_id", user.id)
      .single()

    if (!existingFile) {
      return NextResponse.json({ error: "File not found" }, { status: 404 })
    }

    // Validate folder_id if provided
    if (folder_id !== undefined && folder_id !== null) {
      const { data: folder } = await supabase
        .from("document_extraction_folders")
        .select("id")
        .eq("id", folder_id)
        .eq("user_id", user.id)
        .single()

      if (!folder) {
        return NextResponse.json({ error: "Folder not found" }, { status: 404 })
      }
    }

    const updateData: any = {
      updated_at: new Date().toISOString(),
    }

    if (name !== undefined) {
      if (typeof name !== "string" || name.trim().length === 0) {
        return NextResponse.json({ error: "File name cannot be empty" }, { status: 400 })
      }
      updateData.name = name.trim()
    }

    if (folder_id !== undefined) {
      updateData.folder_id = folder_id || null
    }

    const { data, error } = await supabase
      .from("document_extraction_files")
      .update(updateData)
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single()

    if (error) {
      console.error("[document-extraction] Error updating file:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ file: data })
  } catch (error) {
    console.error("[document-extraction] Unexpected error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = createSupabaseServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "File ID is required" }, { status: 400 })
    }

    // Verify file belongs to user and get file_url
    const { data: existingFile } = await supabase
      .from("document_extraction_files")
      .select("id, file_url")
      .eq("id", id)
      .eq("user_id", user.id)
      .single()

    if (!existingFile) {
      return NextResponse.json({ error: "File not found" }, { status: 404 })
    }

    // Delete file from storage if file_url exists
    if (existingFile.file_url) {
      try {
        // Extract path from URL (format: https://...supabase.co/storage/v1/object/public/document-extraction/path)
        const urlMatch = existingFile.file_url.match(/\/document-extraction\/(.+)$/)
        if (urlMatch) {
          const storagePath = urlMatch[1]
          await supabase.storage.from("document-extraction").remove([storagePath])
        }
      } catch (storageError) {
        console.error("[document-extraction] Error deleting file from storage:", storageError)
        // Continue with DB deletion even if storage deletion fails
      }
    }

    // Delete file record
    const { error } = await supabase
      .from("document_extraction_files")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id)

    if (error) {
      console.error("[document-extraction] Error deleting file:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[document-extraction] Unexpected error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}

