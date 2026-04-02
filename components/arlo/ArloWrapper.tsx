"use client"

import { useEffect, useState } from "react"
import { ArloProvider } from "./ArloProvider"
import { Arlo } from "./Arlo"
import { useSession, useSupabaseClient } from "@/lib/supabase/hooks"

/**
 * ArloWrapper detects whether the user is a first-timer (0 parsers)
 * and renders the ArloProvider + Arlo character.
 *
 * This is a client component so it can be placed inside the server layout.
 */
export function ArloWrapper() {
  const session = useSession()
  const supabase = useSupabaseClient()
  const [isFirstTimeUser, setIsFirstTimeUser] = useState(false)
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    if (!session?.user?.id) {
      setChecked(true)
      return
    }

    // Check if user has any parsers
    supabase
      .from("parsers")
      .select("id", { count: "exact", head: true })
      .eq("user_id", session.user.id)
      .then(({ count }: { count: number | null }) => {
        setIsFirstTimeUser(count === 0 || count === null)
        setChecked(true)
      })
  }, [session?.user?.id, supabase])

  // Don't render until we know the user's state
  if (!checked) return null

  return (
    <ArloProvider isFirstTimeUser={isFirstTimeUser}>
      <Arlo />
    </ArloProvider>
  )
}
