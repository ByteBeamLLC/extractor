"use client"

import { useMemo } from "react"
import { LogOut, UserRound } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAuthDialog } from "@/components/auth/AuthDialogContext"
import { useSession, useSupabaseClient } from "@/lib/supabase/hooks"

export function AccountMenu() {
  const session = useSession()
  const supabase = useSupabaseClient()
  const { openAuthDialog } = useAuthDialog()

  const displayName = useMemo(() => {
    const name = session?.user?.user_metadata?.full_name as string | undefined
    const fallback = session?.user?.email
    return (name || fallback || "").trim()
  }, [session?.user?.email, session?.user?.user_metadata?.full_name])

  const initials = useMemo(() => {
    const name = displayName
    if (!name) return "U"
    const parts = name.split(" ")
    if (parts.length === 1) {
      return parts[0].charAt(0).toUpperCase()
    }
    return `${parts[0].charAt(0)}${parts[1].charAt(0)}`.toUpperCase()
  }, [displayName])

  if (!session) {
    return (
      <Button variant="secondary" size="sm" onClick={() => openAuthDialog("sign-in")}>
        Sign in
      </Button>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold uppercase text-primary">
            {initials}
          </span>
          <span className="hidden sm:inline">{displayName || "Account"}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold uppercase text-primary">
              {initials}
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium leading-none">{displayName || "Account"}</p>
              {session.user.email && (
                <p className="text-xs text-muted-foreground">{session.user.email}</p>
              )}
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() =>
            openAuthDialog("forgot-password")
          }
        >
          <UserRound className="mr-2 h-4 w-4" />
          <span>Manage account</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={async () => {
            await supabase.auth.signOut()
          }}
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>Sign out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
