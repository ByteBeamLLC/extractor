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

    const { data, error } = await supabase
      .from("document_extraction_folders")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("[document-extraction] Error fetching folders:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ folders: data || [] })
  } catch (error) {
    console.error("[document-extraction] Unexpected error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createSupabaseServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { name, parent_id } = body

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json({ error: "Folder name is required" }, { status: 400 })
    }

    // Validate parent_id if provided
    if (parent_id) {
      const { data: parentFolder } = await supabase
        .from("document_extraction_folders")
        .select("id")
        .eq("id", parent_id)
        .eq("user_id", user.id)
        .single()

      if (!parentFolder) {
        return NextResponse.json({ error: "Parent folder not found" }, { status: 404 })
      }
    }

    const { data, error } = await supabase
      .from("document_extraction_folders")
      .insert({
        name: name.trim(),
        parent_id: parent_id || null,
        user_id: user.id,
      })
      .select()
      .single()

    if (error) {
      console.error("[document-extraction] Error creating folder:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ folder: data })
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
    const { id, name, parent_id } = body

    if (!id) {
      return NextResponse.json({ error: "Folder ID is required" }, { status: 400 })
    }

    // Verify folder belongs to user
    const { data: existingFolder } = await supabase
      .from("document_extraction_folders")
      .select("id")
      .eq("id", id)
      .eq("user_id", user.id)
      .single()

    if (!existingFolder) {
      return NextResponse.json({ error: "Folder not found" }, { status: 404 })
    }

    // Validate parent_id if provided (prevent circular references)
    if (parent_id) {
      if (parent_id === id) {
        return NextResponse.json({ error: "Cannot set folder as its own parent" }, { status: 400 })
      }

      const { data: parentFolder } = await supabase
        .from("document_extraction_folders")
        .select("id")
        .eq("id", parent_id)
        .eq("user_id", user.id)
        .single()

      if (!parentFolder) {
        return NextResponse.json({ error: "Parent folder not found" }, { status: 404 })
      }
    }

    const updateData: any = {
      updated_at: new Date().toISOString(),
    }

    if (name !== undefined) {
      if (typeof name !== "string" || name.trim().length === 0) {
        return NextResponse.json({ error: "Folder name cannot be empty" }, { status: 400 })
      }
      updateData.name = name.trim()
    }

    if (parent_id !== undefined) {
      updateData.parent_id = parent_id || null
    }

    const { data, error } = await supabase
      .from("document_extraction_folders")
      .update(updateData)
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single()

    if (error) {
      console.error("[document-extraction] Error updating folder:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ folder: data })
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
      return NextResponse.json({ error: "Folder ID is required" }, { status: 400 })
    }

    // Verify folder belongs to user
    const { data: existingFolder } = await supabase
      .from("document_extraction_folders")
      .select("id")
      .eq("id", id)
      .eq("user_id", user.id)
      .single()

    if (!existingFolder) {
      return NextResponse.json({ error: "Folder not found" }, { status: 404 })
    }

    // Delete folder (cascade will handle children and files)
    const { error } = await supabase
      .from("document_extraction_folders")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id)

    if (error) {
      console.error("[document-extraction] Error deleting folder:", error)
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





