import { NextRequest, NextResponse } from "next/server"
import { createSupabaseServiceRoleClient } from "@/lib/supabase/server"

export const maxDuration = 10

export async function POST(req: NextRequest) {
  try {
    const { email, device_id } = await req.json()

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json({ error: "Valid email is required" }, { status: 400 })
    }

    const normalizedEmail = email.toLowerCase().trim()
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null
    const userAgent = req.headers.get("user-agent") ?? null

    const supabase = createSupabaseServiceRoleClient()

    // Check if this email, IP, or device already signed up
    let query = supabase
      .from("ph_launch_waitlist")
      .select("id, email")
      .or(
        [
          `email.eq.${normalizedEmail}`,
          ip ? `ip_address.eq.${ip}` : "",
          device_id ? `device_id.eq.${device_id}` : "",
        ]
          .filter(Boolean)
          .join(",")
      )
      .limit(1)

    const { data: existing } = await query

    if (existing && existing.length > 0) {
      // Already signed up — return success so the client locks the banner
      return NextResponse.json({ ok: true, already_subscribed: true })
    }

    const { error } = await supabase.from("ph_launch_waitlist").insert({
      email: normalizedEmail,
      device_id: device_id ?? null,
      source: "handwriting_tool",
      ip_address: ip,
      user_agent: userAgent,
    })

    if (error) {
      // Handle unique constraint race condition gracefully
      if (error.code === "23505") {
        return NextResponse.json({ ok: true, already_subscribed: true })
      }
      console.error("Failed to save PH waitlist email:", error)
      return NextResponse.json({ error: "Failed to save. Try again." }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error("PH waitlist error:", e)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}

/**
 * GET: Check if the current visitor already signed up (by IP or device_id).
 * Called on mount so the banner can skip the form for returning visitors.
 */
export async function GET(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null
    const deviceId = req.nextUrl.searchParams.get("device_id")

    if (!ip && !deviceId) {
      return NextResponse.json({ subscribed: false })
    }

    const supabase = createSupabaseServiceRoleClient()

    const conditions = [
      ip ? `ip_address.eq.${ip}` : "",
      deviceId ? `device_id.eq.${deviceId}` : "",
    ]
      .filter(Boolean)
      .join(",")

    const { data } = await supabase
      .from("ph_launch_waitlist")
      .select("id")
      .or(conditions)
      .limit(1)

    return NextResponse.json({ subscribed: (data?.length ?? 0) > 0 })
  } catch {
    return NextResponse.json({ subscribed: false })
  }
}
