"use client"

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"
import { AlertCircle, CheckCircle2, Loader2, Mail } from "lucide-react"

import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { PasswordInput } from "@/components/ui/password-input"
import { PasswordStrength, getStrength } from "@/components/ui/password-strength"
import { useSupabaseClient } from "@/lib/supabase/hooks"
import { cn } from "@/lib/utils"

type AuthMode = "sign-in" | "sign-up" | "forgot-password" | "check-email"

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
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [emailError, setEmailError] = useState<string | null>(null)
  const [passwordError, setPasswordError] = useState<string | null>(null)

  const supabase = useSupabaseClient()

  const openAuthDialog = useCallback((nextMode?: AuthMode) => {
    setMode(nextMode || "sign-in")
    setOpen(true)
  }, [])

  const closeAuthDialog = useCallback(() => {
    setOpen(false)
  }, [])

  const resetState = useCallback(() => {
    setMessage(null)
    setPassword("")
    setConfirmPassword("")
    setEmailError(null)
    setPasswordError(null)
  }, [])

  // Email validation
  const validateEmail = useCallback((value: string): boolean => {
    if (!value) {
      setEmailError("Email is required")
      return false
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(value)) {
      setEmailError("Please enter a valid email address")
      return false
    }
    setEmailError(null)
    return true
  }, [])

  // Clear email error when typing
  useEffect(() => {
    if (email && emailError) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (emailRegex.test(email)) {
        setEmailError(null)
      }
    }
  }, [email, emailError])

  const handleSignIn = useCallback(async () => {
    if (!validateEmail(email)) return
    if (!password) {
      setPasswordError("Password is required")
      return
    }

    setIsSubmitting(true)
    setMessage(null)
    setPasswordError(null)

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
        text: "Welcome back! Signing you in...",
      })
      setTimeout(() => setOpen(false), 1000)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to sign in"
      if (errorMessage.toLowerCase().includes("invalid")) {
        setMessage({
          type: "error",
          text: "Invalid email or password. Please try again.",
        })
      } else {
        setMessage({
          type: "error",
          text: errorMessage,
        })
      }
    } finally {
      setIsSubmitting(false)
    }
  }, [email, password, supabase.auth, validateEmail])

  const handleSignUp = useCallback(async () => {
    if (!validateEmail(email)) return

    const strength = getStrength(password)
    if (strength < 3) {
      setPasswordError("Please choose a stronger password")
      return
    }

    if (password !== confirmPassword) {
      setPasswordError("Passwords do not match")
      return
    }

    setIsSubmitting(true)
    setMessage(null)
    setPasswordError(null)

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
      setMode("check-email")
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Failed to create account. Please try again.",
      })
    } finally {
      setIsSubmitting(false)
    }
  }, [email, password, confirmPassword, supabase.auth, validateEmail])

  const handleResetPassword = useCallback(async () => {
    if (!validateEmail(email)) return

    setIsSubmitting(true)
    setMessage(null)

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: typeof window !== "undefined" ? `${window.location.origin}/auth/callback?next=/reset-password` : undefined,
      })
      if (error) {
        throw error
      }
      setMode("check-email")
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Failed to send reset email. Please try again.",
      })
    } finally {
      setIsSubmitting(false)
    }
  }, [email, supabase.auth, validateEmail])

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      switch (mode) {
        case "sign-up":
          handleSignUp()
          break
        case "forgot-password":
          handleResetPassword()
          break
        default:
          handleSignIn()
      }
    },
    [mode, handleSignIn, handleSignUp, handleResetPassword]
  )

  const title = useMemo(() => {
    switch (mode) {
      case "sign-up":
        return "Create your account"
      case "forgot-password":
        return "Reset your password"
      case "check-email":
        return "Check your email"
      default:
        return "Welcome back"
    }
  }, [mode])

  const description = useMemo(() => {
    switch (mode) {
      case "sign-up":
        return "Start syncing your data across devices"
      case "forgot-password":
        return "We'll send you a link to reset your password"
      case "check-email":
        return `We've sent an email to ${email}`
      default:
        return "Sign in to your account to continue"
    }
  }, [mode, email])

  const submitLabel = useMemo(() => {
    switch (mode) {
      case "sign-up":
        return "Create account"
      case "forgot-password":
        return "Send reset link"
      default:
        return "Sign in"
    }
  }, [mode])

  const isFormValid = useMemo(() => {
    if (!email) return false
    if (mode === "forgot-password") return true
    if (!password) return false
    if (mode === "sign-up") {
      return getStrength(password) >= 3 && password === confirmPassword
    }
    return true
  }, [email, password, confirmPassword, mode])

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
        <DialogContent className="sm:max-w-[420px] p-0 gap-0 overflow-hidden">
          {/* Header */}
          <div className="px-6 pt-8 pb-6 text-center bg-gradient-to-b from-muted/50 to-transparent">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              {mode === "check-email" ? (
                <Mail className="h-6 w-6 text-primary" />
              ) : (
                <svg
                  className="h-6 w-6 text-primary"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                  <polyline points="10 17 15 12 10 7" />
                  <line x1="15" x2="3" y1="12" y2="12" />
                </svg>
              )}
            </div>
            <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
            <p className="mt-1.5 text-sm text-muted-foreground">{description}</p>
          </div>

          {/* Content */}
          <div className="px-6 pb-6">
            {mode === "check-email" ? (
              <div className="space-y-4">
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-center">
                  <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-500" />
                  <p className="mt-2 text-sm text-emerald-700">
                    {mode === "check-email" && email
                      ? "Click the link in your email to continue. You can close this dialog."
                      : "Check your inbox for further instructions."}
                  </p>
                </div>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    setMode("sign-in")
                    setMessage(null)
                  }}
                >
                  Back to sign in
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Email field */}
                <div className="space-y-2">
                  <Label htmlFor="auth-email">Email address</Label>
                  <Input
                    id="auth-email"
                    type="email"
                    autoCapitalize="none"
                    autoComplete="email"
                    autoCorrect="off"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onBlur={() => email && validateEmail(email)}
                    placeholder="name@example.com"
                    aria-invalid={!!emailError}
                    className={cn("h-10", emailError && "border-destructive")}
                  />
                  {emailError && (
                    <p className="text-xs text-destructive flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {emailError}
                    </p>
                  )}
                </div>

                {/* Password field (not for forgot-password) */}
                {mode !== "forgot-password" && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="auth-password">Password</Label>
                      {mode === "sign-in" && (
                        <button
                          type="button"
                          onClick={() => {
                            setMode("forgot-password")
                            setMessage(null)
                            setPasswordError(null)
                          }}
                          className="text-xs text-primary hover:text-primary/80 hover:underline transition-colors"
                        >
                          Forgot password?
                        </button>
                      )}
                    </div>
                    <PasswordInput
                      id="auth-password"
                      autoComplete={mode === "sign-up" ? "new-password" : "current-password"}
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value)
                        setPasswordError(null)
                      }}
                      placeholder={mode === "sign-up" ? "Create a password" : "Enter your password"}
                      aria-invalid={!!passwordError}
                      className={cn(passwordError && "border-destructive")}
                    />
                    {passwordError && (
                      <p className="text-xs text-destructive flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {passwordError}
                      </p>
                    )}
                  </div>
                )}

                {/* Password strength (sign-up only) */}
                {mode === "sign-up" && password && (
                  <PasswordStrength password={password} />
                )}

                {/* Confirm password (sign-up only) */}
                {mode === "sign-up" && (
                  <div className="space-y-2">
                    <Label htmlFor="auth-confirm-password">Confirm password</Label>
                    <PasswordInput
                      id="auth-confirm-password"
                      autoComplete="new-password"
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value)
                        setPasswordError(null)
                      }}
                      placeholder="Confirm your password"
                      aria-invalid={password !== confirmPassword && confirmPassword.length > 0}
                      className={cn(
                        password !== confirmPassword && confirmPassword.length > 0 && "border-destructive"
                      )}
                    />
                    {password !== confirmPassword && confirmPassword.length > 0 && (
                      <p className="text-xs text-destructive flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        Passwords do not match
                      </p>
                    )}
                  </div>
                )}

                {/* Error/Success message */}
                {message && (
                  <div
                    className={cn(
                      "flex items-center gap-2 rounded-lg border p-3 text-sm",
                      message.type === "success"
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                        : "border-destructive/20 bg-destructive/5 text-destructive"
                    )}
                  >
                    {message.type === "success" ? (
                      <CheckCircle2 className="h-4 w-4 shrink-0" />
                    ) : (
                      <AlertCircle className="h-4 w-4 shrink-0" />
                    )}
                    <p>{message.text}</p>
                  </div>
                )}

                {/* Submit button */}
                <Button
                  type="submit"
                  className="w-full h-10"
                  disabled={isSubmitting || !isFormValid}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Please wait...
                    </>
                  ) : (
                    submitLabel
                  )}
                </Button>

                {/* Mode switch links */}
                <div className="text-center text-sm text-muted-foreground">
                  {mode === "sign-in" ? (
                    <p>
                      Don't have an account?{" "}
                      <button
                        type="button"
                        onClick={() => {
                          setMode("sign-up")
                          setMessage(null)
                          setPasswordError(null)
                        }}
                        className="font-medium text-primary hover:text-primary/80 hover:underline transition-colors"
                      >
                        Sign up
                      </button>
                    </p>
                  ) : mode === "sign-up" ? (
                    <p>
                      Already have an account?{" "}
                      <button
                        type="button"
                        onClick={() => {
                          setMode("sign-in")
                          setMessage(null)
                          setPasswordError(null)
                        }}
                        className="font-medium text-primary hover:text-primary/80 hover:underline transition-colors"
                      >
                        Sign in
                      </button>
                    </p>
                  ) : (
                    <p>
                      Remember your password?{" "}
                      <button
                        type="button"
                        onClick={() => {
                          setMode("sign-in")
                          setMessage(null)
                        }}
                        className="font-medium text-primary hover:text-primary/80 hover:underline transition-colors"
                      >
                        Sign in
                      </button>
                    </p>
                  )}
                </div>
              </form>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </AuthDialogContext.Provider>
  )
}

export function useAuthDialog() {
  const context = useContext(AuthDialogContext)
  if (!context) {
    throw new Error("useAuthDialog must be used within an AuthDialogProvider")
  }
  return context
}
