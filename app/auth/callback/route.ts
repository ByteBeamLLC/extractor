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

    if (data?.user) {
      const isOAuth = data.user.app_metadata?.provider !== "email"
      const isNewUser =
        data.user.created_at &&
        Date.now() - new Date(data.user.created_at).getTime() < 60_000

      if (isOAuth && isNewUser) {
        // Track OAuth signup (Google, etc.)
        trackServerEvent("sign_up_completed", {
          distinct_id: data.user.id,
          user_id: data.user.id,
          email: data.user.email ?? "",
          source: "google_oauth",
        })
      } else if (!isOAuth) {
        // Track email confirmation (critical funnel event — server-side for reliability)
        trackServerEvent("email_confirmed", {
          distinct_id: data.user.id,
          user_id: data.user.id,
          email: data.user.email ?? "",
        })
      }
    }
  }

  return NextResponse.redirect(new URL(next, requestUrl.origin))
}
