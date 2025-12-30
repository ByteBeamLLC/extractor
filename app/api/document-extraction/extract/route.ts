import { type NextRequest, NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { extractDocumentFile } from "@/lib/document-extraction/extract"

export async function POST(request: NextRequest) {
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/deb7f689-6230-4974-97b6-897e8c059ed2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'extract/route.ts:7',message:'Extract route called',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H5'})}).catch(()=>{});
  // #endregion
  try {
    const supabase = createSupabaseServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/deb7f689-6230-4974-97b6-897e8c059ed2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'extract/route.ts:15',message:'Unauthorized user',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H5'})}).catch(()=>{});
      // #endregion
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { file_id, extraction_method } = body
    const extractionMethod = extraction_method || "dots.ocr"
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/deb7f689-6230-4974-97b6-897e8c059ed2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'extract/route.ts:22',message:'Extract route received file_id',data:{file_id, extraction_method: extractionMethod},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H5'})}).catch(()=>{});
    // #endregion

    if (!file_id) {
      return NextResponse.json({ error: "File ID is required" }, { status: 400 })
    }

    // Get file record
    const { data: fileRecord, error: fetchError } = await supabase
      .from("document_extraction_files")
      .select("*")
      .eq("id", file_id)
      .eq("user_id", user.id)
      .single()

    if (fetchError || !fileRecord) {
      return NextResponse.json({ error: "File not found" }, { status: 404 })
    }

    // Call shared extraction function
    try {
      const result = await extractDocumentFile({
        fileId: file_id,
        userId: user.id,
        supabase,
        extractionMethod,
      })

      return NextResponse.json(result)
    } catch (extractionError) {
      // Error is already handled and logged in extractDocumentFile
      return NextResponse.json(
        {
          error: "Extraction failed",
          details: extractionError instanceof Error ? extractionError.message : String(extractionError),
        },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error("[document-extraction] Unexpected error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}

