import { NextRequest, NextResponse } from "next/server"
import { createSupabaseServiceRoleClient } from "@/lib/supabase/server"

export const maxDuration = 10

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json({ error: "Valid email is required" }, { status: 400 })
    }

    const supabase = createSupabaseServiceRoleClient()

    // Upsert to avoid duplicates — if email exists, just update the timestamp
    const { error } = await supabase
      .from("ph_launch_waitlist")
      .upsert(
        {
          email: email.toLowerCase().trim(),
          source: "handwriting_tool",
          ip_address: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null,
          user_agent: req.headers.get("user-agent") ?? null,
        },
        { onConflict: "email" }
      )

    if (error) {
      console.error("Failed to save PH waitlist email:", error)
      return NextResponse.json({ error: "Failed to save. Try again." }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error("PH waitlist error:", e)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}
