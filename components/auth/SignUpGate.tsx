"use client"

import { Lock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuthDialog } from "@/components/auth/AuthDialogContext"
import { useSession } from "@/lib/supabase/hooks"

interface SignUpGateProps {
  children: React.ReactNode
  /** Short label shown on the lock overlay, e.g. "Email Forwarding" */
  feature: string
}

/**
 * Wraps a UI section and overlays a blurred lock + CTA for anonymous users.
 * Authenticated users see children normally.
 */
export function SignUpGate({ children, feature }: SignUpGateProps) {
  const session = useSession()
  const { openAuthDialog } = useAuthDialog()
  const isAnonymous = session?.user?.is_anonymous === true

  if (!isAnonymous) return <>{children}</>

  return (
    <div className="relative">
      <div className="pointer-events-none select-none blur-[2px] opacity-50">
        {children}
      </div>
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-background/60 rounded-xl">
        <Lock className="h-5 w-5 text-muted-foreground" />
        <p className="text-sm font-medium text-center">
          Sign up to unlock {feature}
        </p>
        <Button
          size="sm"
          onClick={() => openAuthDialog("sign-up")}
          className="pointer-events-auto"
        >
          Sign up free
        </Button>
      </div>
    </div>
  )
}
