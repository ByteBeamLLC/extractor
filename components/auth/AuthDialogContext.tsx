"use client"

import { createContext, useCallback, useContext, useMemo, useState } from "react"
import { AlertCircle, CheckCircle2 } from "lucide-react"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useSupabaseClient } from "@/lib/supabase/hooks"

type AuthMode = "sign-in" | "sign-up" | "forgot-password"

interface AuthDialogContextValue {
  openAuthDialog: (mode?: AuthMode) => void
  closeAuthDialog: () => void
}

const AuthDialogContext = createContext<AuthDialogContextValue | undefined>(undefined)

export function AuthDialogProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState<AuthMode>("sign-in")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  const supabase = useSupabaseClient()

  const openAuthDialog = useCallback((nextMode?: AuthMode) => {
    if (nextMode) {
      setMode(nextMode)
    }
    setOpen(true)
  }, [])

  const closeAuthDialog = useCallback(() => {
    setOpen(false)
  }, [])

  const resetState = useCallback(() => {
    setMessage(null)
    setPassword("")
  }, [])

  const handleSignIn = useCallback(async () => {
    setIsSubmitting(true)
    setMessage(null)
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) {
        throw error
      }
      setMessage({
        type: "success",
        text: "Signed in successfully.",
      })
      setTimeout(() => setOpen(false), 800)
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Failed to sign in. Please try again.",
      })
    } finally {
      setIsSubmitting(false)
    }
  }, [email, password, supabase.auth])

  const handleSignUp = useCallback(async () => {
    setIsSubmitting(true)
    setMessage(null)
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: typeof window !== "undefined" ? `${window.location.origin}/auth/callback` : undefined,
        },
      })
      if (error) {
        throw error
      }
      setMessage({
        type: "success",
        text: "Check your email to confirm your account.",
      })
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Failed to sign up. Please try again.",
      })
    } finally {
      setIsSubmitting(false)
    }
  }, [email, password, supabase.auth])

  const handleResetPassword = useCallback(async () => {
    setIsSubmitting(true)
    setMessage(null)
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: typeof window !== "undefined" ? `${window.location.origin}/auth/callback?next=/reset-password` : undefined,
      })
      if (error) {
        throw error
      }
      setMessage({
        type: "success",
        text: "Check your email for a password reset link.",
      })
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Failed to send reset email. Please try again.",
      })
    } finally {
      setIsSubmitting(false)
    }
  }, [email, supabase.auth])

  const actionLabel = useMemo(() => {
    switch (mode) {
      case "sign-up":
        return "Create account"
      case "forgot-password":
        return "Send reset link"
      default:
        return "Sign in"
    }
  }, [mode])

  const actionHandler = useMemo(() => {
    switch (mode) {
      case "sign-up":
        return handleSignUp
      case "forgot-password":
        return handleResetPassword
      default:
        return handleSignIn
    }
  }, [handleResetPassword, handleSignIn, handleSignUp, mode])

  return (
    <AuthDialogContext.Provider
      value={{
        openAuthDialog,
        closeAuthDialog,
      }}
    >
      {children}
      <Dialog
        open={open}
        onOpenChange={(nextOpen) => {
          setOpen(nextOpen)
          if (!nextOpen) {
            resetState()
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{mode === "sign-up" ? "Create your account" : mode === "forgot-password" ? "Reset password" : "Sign in to save work"}</DialogTitle>
            <DialogDescription>
              {mode === "sign-up"
                ? "Create an account to sync your schemas, extraction jobs, and results across devices."
                : mode === "forgot-password"
                  ? "Enter the email associated with your account and we will send you a reset link."
                  : "You can explore without an account. Sign in when you're ready to save your progress."}
            </DialogDescription>
          </DialogHeader>

          <Tabs
            value={mode === "forgot-password" ? "forgot-password" : mode}
            onValueChange={(value) => {
              if (value === "forgot-password") {
                setMode("forgot-password")
              } else {
                setMode(value as AuthMode)
              }
              setMessage(null)
            }}
            className="w-full"
          >
            <TabsList className="grid grid-cols-3">
              <TabsTrigger value="sign-in">Sign in</TabsTrigger>
              <TabsTrigger value="sign-up">Sign up</TabsTrigger>
              <TabsTrigger value="forgot-password">Reset</TabsTrigger>
            </TabsList>
            <TabsContent value="sign-in" className="space-y-4 pt-4">
              <AuthFormFields
                email={email}
                onEmailChange={setEmail}
                password={password}
                onPasswordChange={setPassword}
                showPassword
              />
            </TabsContent>
            <TabsContent value="sign-up" className="space-y-4 pt-4">
              <AuthFormFields
                email={email}
                onEmailChange={setEmail}
                password={password}
                onPasswordChange={setPassword}
                showPassword
              />
            </TabsContent>
            <TabsContent value="forgot-password" className="space-y-4 pt-4">
              <AuthFormFields email={email} onEmailChange={setEmail} password="" onPasswordChange={() => {}} />
            </TabsContent>
          </Tabs>

          {message && (
            <div
              className={`flex items-center gap-2 rounded-md border px-3 py-2 text-sm ${
                message.type === "success"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : "border-destructive/20 bg-destructive/5 text-destructive"
              }`}
            >
              {message.type === "success" ? (
                <CheckCircle2 className="h-4 w-4 shrink-0" />
              ) : (
                <AlertCircle className="h-4 w-4 shrink-0" />
              )}
              <p>{message.text}</p>
            </div>
          )}

          <Button className="w-full" onClick={actionHandler} disabled={isSubmitting || !email || (mode !== "forgot-password" && password.length < 6)}>
            {isSubmitting ? "Please wait..." : actionLabel}
          </Button>
        </DialogContent>
      </Dialog>
    </AuthDialogContext.Provider>
  )
}

function AuthFormFields({
  email,
  onEmailChange,
  password,
  onPasswordChange,
  showPassword = false,
}: {
  email: string
  onEmailChange: (value: string) => void
  password: string
  onPasswordChange: (value: string) => void
  showPassword?: boolean
}) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="auth-email">Email</Label>
        <Input
          id="auth-email"
          type="email"
          autoCapitalize="none"
          autoComplete="email"
          value={email}
          onChange={(event) => onEmailChange(event.target.value)}
          placeholder="you@example.com"
        />
      </div>
      {showPassword && (
        <div className="space-y-2">
          <Label htmlFor="auth-password">Password</Label>
          <Input
            id="auth-password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => onPasswordChange(event.target.value)}
            placeholder="••••••••"
          />
        </div>
      )}
    </div>
  )
}

export function useAuthDialog() {
  const context = useContext(AuthDialogContext)
  if (!context) {
    throw new Error("useAuthDialog must be used within an AuthDialogProvider")
  }
  return context
}
