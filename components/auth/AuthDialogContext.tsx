"use client"

import { createContext, useCallback, useContext, useEffect, useMemo, useState, useRef } from "react"
import { AlertCircle, CheckCircle2, Loader2, Mail } from "lucide-react"

import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { PasswordInput } from "@/components/ui/password-input"
import { PasswordStrength, getStrength } from "@/components/ui/password-strength"
import { useSession, useSupabaseClient } from "@/lib/supabase/hooks"
import { cn } from "@/lib/utils"
import { trackEvent } from "@/lib/analytics"
import { completeSignup } from "@/lib/analytics/signup"
import { buildAppUrl } from "@/lib/app-url"

type AuthMode = "sign-in" | "sign-up" | "forgot-password" | "check-email"

interface OpenAuthDialogOptions {
  /**
   * Path to redirect to after successful auth. When set, the dialog will
   * navigate (full page) to this path on success and pass it through the
   * Google OAuth `?next=` and email-callback redirect. Leave undefined to
   * keep the legacy behavior (no navigation, dialog just closes).
   */
  next?: string
  /**
   * Bridge session token (bsn_...) to pass through OAuth flow. The connect
   * route looks up the anonymous user from this token and the callback
   * appends it as ?handoff= on the redirect URL so the app can consume it.
   */
  bridgeToken?: string
}

interface AuthDialogContextValue {
  openAuthDialog: (mode?: AuthMode, options?: OpenAuthDialogOptions) => void
  closeAuthDialog: () => void
}

const AuthDialogContext = createContext<AuthDialogContextValue | undefined>(undefined)

const GOOGLE_DEFAULT_NEXT = "/dashboard"

export function AuthDialogProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState<AuthMode>("sign-in")
  // null = legacy behavior (no nav after success). string = navigate to this path.
  const [nextPath, setNextPath] = useState<string | null>(null)
  const [bridgeToken, setBridgeToken] = useState<string | null>(null)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [emailError, setEmailError] = useState<string | null>(null)
  const [passwordError, setPasswordError] = useState<string | null>(null)

  const session = useSession()
  const isAnonymous = session?.user?.is_anonymous === true
  const supabase = useSupabaseClient()

  const openAuthDialog = useCallback(
    (nextMode?: AuthMode, options?: OpenAuthDialogOptions) => {
      setMode(nextMode || "sign-in")
      setNextPath(options?.next ?? null)
      setBridgeToken(options?.bridgeToken ?? null)
      setOpen(true)
    },
    []
  )

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
      setTimeout(() => {
        setOpen(false)
        if (nextPath) {
          window.location.href = buildAppUrl(nextPath)
        }
      }, 1000)
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
  }, [email, password, supabase.auth, validateEmail, nextPath])

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
      if (isAnonymous) {
        const result = await supabase.auth.updateUser({ email, password })
        if (result.error) throw result.error
        const userId = result.data.user?.id ?? ""
        trackEvent("anonymous_converted", { user_id: userId, email, source: "auth_dialog" })
        // Anonymous conversion has no redirect — fire sign_up_completed
        // directly here. Cookie-based handoff only covers paths that
        // redirect through an auth callback.
        completeSignup("anonymous_conversion", userId, email)
      } else {
        const callbackUrl = buildAppUrl(
          `/auth/callback${nextPath ? `?next=${encodeURIComponent(nextPath)}` : ""}`
        )
        const result = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: callbackUrl,
          },
        })
        if (result.error) throw result.error
        // Fresh email signups fire sign_up_completed after email confirmation
        // via the signup cookie set in /auth/callback. Nothing to do here.
      }

      // Anonymous-upgrade keeps the same session — no email confirmation needed,
      // so we can navigate immediately. Fresh signups still need email verification,
      // so we route them through "check-email" and rely on the callback for nextPath.
      if (isAnonymous && nextPath) {
        window.location.href = buildAppUrl(nextPath)
        return
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
  }, [email, password, confirmPassword, supabase.auth, validateEmail, isAnonymous, nextPath])

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
        return "Keep your data and unlock 30 free pages/month."
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
              <>
              <div className="space-y-4 mb-4">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-10"
                  onClick={() => {
                    const target = nextPath || GOOGLE_DEFAULT_NEXT
                    const connectUrl = new URL(buildAppUrl("/api/auth/google/connect"))
                    connectUrl.searchParams.set("next", target)
                    if (bridgeToken) connectUrl.searchParams.set("bridge_token", bridgeToken)
                    window.location.href = connectUrl.toString()
                  }}
                  data-cta-location="auth_dialog_google"
                  data-cta-name="Continue with Google"
                  data-cta-destination="signup"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                  </svg>
                  Continue with Google
                </Button>
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">or</span>
                  </div>
                </div>
              </div>
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
                  data-cta-location={`auth_dialog_submit_${mode}`}
                  data-cta-name={submitLabel}
                  data-cta-destination={mode === "sign-up" ? "signup" : "action"}
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
                          trackEvent("sign_up_started", { source: "auth_dialog" })
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
              </>
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
