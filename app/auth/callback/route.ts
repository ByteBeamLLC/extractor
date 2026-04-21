import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"

import type { Database } from "@/lib/supabase/types"
import { trackServerEvent } from "@/lib/analytics/server"
import { setNewSignupCookie } from "@/lib/analytics/signup-cookie"

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

      // For any new account (OAuth or email), flag the client to fire
      // sign_up_completed from the browser's own distinct_id. We do NOT
      // fire server-side — the auth-UUID-as-distinct-id would orphan the
      // event from the pre-signup funnel on a separate browser identity.
      if (isNewUser) {
        await setNewSignupCookie(isOAuth ? "google_oauth" : "email")
      }

      // email_confirmed is a distinct, provider-scoped event — kept
      // server-side so it's reliable regardless of whether the user
      // returns to the app after clicking the confirmation link.
      if (!isOAuth) {
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
