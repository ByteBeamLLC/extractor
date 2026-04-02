import { type NextRequest, NextResponse } from "next/server"
import { createSupabaseServiceRoleClient } from "@/lib/supabase/server"

export const runtime = "nodejs"
export const maxDuration = 30

// GET /api/parsers/[parserId]/feed?token=xxx&format=csv|json
// Public endpoint for Google Sheets IMPORTDATA
export async function GET(
  request: NextRequest,
  { params }: { params: { parserId: string } }
) {
  const token = request.nextUrl.searchParams.get("token")
  const format = request.nextUrl.searchParams.get("format") ?? "csv"

  if (!token) {
    return NextResponse.json({ error: "Token required" }, { status: 401 })
  }

  const supabase = createSupabaseServiceRoleClient()

  // Verify token matches a Google Sheets integration
  const { data: integration } = await supabase
    .from("parser_integrations")
    .select("*")
    .eq("parser_id", params.parserId)
    .eq("type", "google_sheets")
    .eq("is_active", true)
    .single()

  if (!integration || integration.config?.feed_url_token !== token) {
    return NextResponse.json({ error: "Invalid token" }, { status: 403 })
  }

  // Fetch parser for fields and extraction_type
  const { data: parser } = await supabase
    .from("parsers")
    .select("fields, extraction_type")
    .eq("id", params.parserId)
    .single()

  if (!parser) {
    return NextResponse.json({ error: "Parser not found" }, { status: 404 })
  }

  const isFullContent = (parser as any).extraction_type === "full_content"

  // Fetch recent results
  const { data: docs } = await supabase
    .from("parser_processed_documents")
    .select("results, file_name, processed_at")
    .eq("parser_id", params.parserId)
    .eq("status", "completed")
    .order("processed_at", { ascending: false })
    .limit(1000)

  const documents = docs ?? []

  if (isFullContent) {
    return buildFullContentFeed(documents, format, params.parserId)
  }

  // --- Fields mode (original logic) ---
  const fields = (parser.fields ?? []).filter((f: any) => f.type !== "input")

  if (format === "json") {
    const rows = documents.map((doc: any) => {
      const row: Record<string, any> = {
        _file_name: doc.file_name,
        _processed_at: doc.processed_at,
      }
      for (const field of fields) {
        row[field.name] = doc.results?.[field.id] ?? ""
      }
      return row
    })
    return NextResponse.json(rows)
  }

  // CSV format
  const headers = ["File Name", "Processed At", ...fields.map((f: any) => f.name)]
  const csvEscape = (v: any) => {
    const str = v === null || v === undefined ? "" : String(v)
    if (str.includes(",") || str.includes('"') || str.includes("\n")) {
      return `"${str.replace(/"/g, '""')}"`
    }
    return str
  }

  const rows = documents.map((doc: any) => {
    const values = [
      doc.file_name,
      doc.processed_at,
      ...fields.map((f: any) => {
        const val = doc.results?.[f.id]
        if (val === null || val === undefined || val === "-") return ""
        if (typeof val === "object") return JSON.stringify(val)
        return String(val)
      }),
    ]
    return values.map(csvEscape).join(",")
  })

  const csv = [headers.map(csvEscape).join(","), ...rows].join("\n")

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `inline; filename="parser-${params.parserId}.csv"`,
      "Cache-Control": "no-cache, no-store, must-revalidate",
    },
  })
}

/** Build feed response for full_content parsers with dynamic keys */
function buildFullContentFeed(
  documents: Array<{ results: any; file_name: string; processed_at: string | null }>,
  format: string,
  parserId: string
) {
  // Collect all unique keys across documents
  const keySet = new Set<string>()
  for (const doc of documents) {
    if (!doc.results) continue
    for (const key of Object.keys(doc.results)) {
      if (key === "__meta__") continue
      keySet.add(key)
    }
  }
  const dynamicKeys = Array.from(keySet)

  if (format === "json") {
    const rows = documents.map((doc) => {
      const { __meta__, ...data } = doc.results ?? {}
      return {
        _file_name: doc.file_name,
        _processed_at: doc.processed_at,
        ...data,
      }
    })
    return NextResponse.json(rows)
  }

  // CSV format
  const csvEscape = (v: any) => {
    const str = v === null || v === undefined ? "" : String(v)
    if (str.includes(",") || str.includes('"') || str.includes("\n")) {
      return `"${str.replace(/"/g, '""')}"`
    }
    return str
  }

  const headers = ["File Name", "Processed At", ...dynamicKeys.map((k) => k.replace(/_/g, " "))]

  const rows = documents.map((doc) => {
    const { __meta__, ...data } = doc.results ?? {}
    const values = [
      doc.file_name,
      doc.processed_at,
      ...dynamicKeys.map((key) => {
        const val = data[key]
        if (val === null || val === undefined) return ""
        if (typeof val === "object") return JSON.stringify(val)
        return String(val)
      }),
    ]
    return values.map(csvEscape).join(",")
  })

  const csv = [headers.map(csvEscape).join(","), ...rows].join("\n")

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `inline; filename="parser-${parserId}.csv"`,
      "Cache-Control": "no-cache, no-store, must-revalidate",
    },
  })
}
