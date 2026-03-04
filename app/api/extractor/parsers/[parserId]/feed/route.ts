import { type NextRequest, NextResponse } from "next/server"
import { createSupabaseServiceRoleClient } from "@/lib/supabase/server"

export const runtime = "nodejs"

// GET /api/extractor/parsers/[parserId]/feed?token=xxx&format=csv|json
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

  // Fetch parser fields for headers
  const { data: parser } = await supabase
    .from("parsers")
    .select("fields")
    .eq("id", params.parserId)
    .single()

  if (!parser) {
    return NextResponse.json({ error: "Parser not found" }, { status: 404 })
  }

  // Fetch recent results
  const { data: docs } = await supabase
    .from("parser_processed_documents")
    .select("results, file_name, processed_at")
    .eq("parser_id", params.parserId)
    .eq("status", "completed")
    .order("processed_at", { ascending: false })
    .limit(1000)

  const fields = (parser.fields ?? []).filter((f: any) => f.type !== "input")

  if (format === "json") {
    const rows = (docs ?? []).map((doc) => {
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

  const rows = (docs ?? []).map((doc) => {
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
