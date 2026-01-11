"use client"

import { useMemo, useState } from "react"
import { KeyRound, LogOut, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useAuthDialog } from "@/components/auth/AuthDialogContext"
import { useSession, useSupabaseClient } from "@/lib/supabase/hooks"

export function AccountMenu() {
  const session = useSession()
  const supabase = useSupabaseClient()
  const { openAuthDialog } = useAuthDialog()
  const [isSigningOut, setIsSigningOut] = useState(false)

  const displayName = useMemo(() => {
    const name = session?.user?.user_metadata?.full_name as string | undefined
    const fallback = session?.user?.email
    return (name || fallback || "").trim()
  }, [session?.user?.email, session?.user?.user_metadata?.full_name])

  const initials = useMemo(() => {
    const name = displayName
    if (!name) return "U"
    // If it's an email, use first letter
    if (name.includes("@")) {
      return name.charAt(0).toUpperCase()
    }
    const parts = name.split(" ")
    if (parts.length === 1) {
      return parts[0].charAt(0).toUpperCase()
    }
    return `${parts[0].charAt(0)}${parts[parts.length - 1].charAt(0)}`.toUpperCase()
  }, [displayName])

  const handleSignOut = async () => {
    setIsSigningOut(true)
    try {
      await supabase.auth.signOut()
    } finally {
      setIsSigningOut(false)
    }
  }

  if (!session) {
    return (
      <Button
        variant="default"
        size="sm"
        onClick={() => openAuthDialog("sign-in")}
        className="font-medium"
      >
        Sign in
      </Button>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="flex items-center gap-2 px-2 hover:bg-accent"
        >
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <span className="hidden sm:inline max-w-[120px] truncate text-sm font-medium">
            {displayName || "Account"}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="font-normal">
          <div className="flex items-center gap-3 py-1">
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col space-y-0.5 overflow-hidden">
              {session.user.user_metadata?.full_name && (
                <p className="text-sm font-medium leading-none truncate">
                  {session.user.user_metadata.full_name}
                </p>
              )}
              <p className="text-xs text-muted-foreground truncate">
                {session.user.email}
              </p>
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => openAuthDialog("forgot-password")}
          className="cursor-pointer"
        >
          <KeyRound className="mr-2 h-4 w-4" />
          <span>Change password</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={handleSignOut}
          disabled={isSigningOut}
          className="cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10"
        >
          {isSigningOut ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <LogOut className="mr-2 h-4 w-4" />
          )}
          <span>{isSigningOut ? "Signing out..." : "Sign out"}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
