import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"

import type { Database } from "@/lib/supabase/types"
import { trackServerEvent } from "@/lib/analytics/server"

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")
  const next = requestUrl.searchParams.get("next") ?? "/dashboard"

  if (code) {
    const supabase = createRouteHandlerClient<Database>({ cookies })
    const { data } = await supabase.auth.exchangeCodeForSession(code)

    // Track email confirmation (critical funnel event — server-side for reliability)
    if (data?.user) {
      trackServerEvent("email_confirmed", {
        distinct_id: data.user.id,
        user_id: data.user.id,
        email: data.user.email ?? "",
      })
    }
  }

  return NextResponse.redirect(new URL(next, requestUrl.origin))
}
