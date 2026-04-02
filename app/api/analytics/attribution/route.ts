import { NextResponse } from "next/server"
import { createSupabaseServerComponentClient } from "@/lib/supabase/server"

export const maxDuration = 30

export async function POST(request: Request) {
  const supabase = createSupabaseServerComponentClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await request.json()

  // First-touch only — don't overwrite existing attribution
  const { error } = await supabase.from("user_attribution").upsert(
    {
      user_id: user.id,
      gclid: body.gclid || null,
      utm_source: body.utm_source || null,
      utm_medium: body.utm_medium || null,
      utm_campaign: body.utm_campaign || null,
      utm_term: body.utm_term || null,
      utm_content: body.utm_content || null,
      landing_page: body.landing_page || null,
      captured_at: body.captured_at || new Date().toISOString(),
    },
    { onConflict: "user_id", ignoreDuplicates: true }
  )

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
