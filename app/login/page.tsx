"use client"

import { Suspense, useState, useCallback, useEffect, useMemo } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { AlertCircle, CheckCircle2, Loader2, Mail } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { PasswordInput } from "@/components/ui/password-input"
import { PasswordStrength, getStrength } from "@/components/ui/password-strength"
import { useSession, useSupabaseClient } from "@/lib/supabase/hooks"
import { cn } from "@/lib/utils"
import { trackEvent } from "@/lib/analytics"
import { getAttribution } from "@/lib/analytics/attribution"
import { getIdentity } from "@/lib/analytics/identity"

type AuthMode = "sign-in" | "sign-up" | "forgot-password" | "check-email"

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const nextPath = searchParams.get("next") || "/dashboard"

  const initialMode = searchParams.get("mode") === "signup" ? "sign-up" : "sign-in"
  const [mode, setMode] = useState<AuthMode>(initialMode)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [emailError, setEmailError] = useState<string | null>(null)
  const [passwordError, setPasswordError] = useState<string | null>(null)

  const [isGoogleLoading, setIsGoogleLoading] = useState(false)

  const session = useSession()
  const isAnonymous = session?.user?.is_anonymous === true
  const supabase = useSupabaseClient()

  const handleGoogleAuth = useCallback(() => {
    setIsGoogleLoading(true)
    setMessage(null)
    // Redirect to our own Google OAuth connect route
    window.location.href = `/api/auth/google/connect?next=${encodeURIComponent(nextPath)}`
  }, [nextPath])

  // Show error if redirected back from failed Google auth
  useEffect(() => {
    const err = searchParams.get("error")
    if (err === "google_auth_failed") {
      setMessage({ type: "error", text: "Google sign-in failed. Please try again." })
    }
  }, [searchParams])

  // Track login page view (measures CTA → signup form drop-off)
  useEffect(() => {
    const identity = getIdentity()
    const attribution = getAttribution()
    trackEvent("login_page_viewed", {
      referrer: document.referrer || "",
      traffic_source: identity?.traffic_source || "direct",
      has_attribution: !!(attribution?.gclid || attribution?.utm_source),
      landing_page: identity?.first_landing || "",
    })
  }, [])

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

  useEffect(() => {
    if (email && emailError) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (emailRegex.test(email)) setEmailError(null)
    }
  }, [email, emailError])

  const handleSignIn = useCallback(async () => {
    if (!validateEmail(email)) return
    if (!password) { setPasswordError("Password is required"); return }
    setIsSubmitting(true)
    setMessage(null)
    setPasswordError(null)
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
      setMessage({ type: "success", text: "Welcome back! Signing you in..." })
      setTimeout(() => router.push(nextPath), 1000)
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Failed to sign in"
      setMessage({
        type: "error",
        text: msg.toLowerCase().includes("invalid")
          ? "Invalid email or password. Please try again."
          : msg,
      })
    } finally {
      setIsSubmitting(false)
    }
  }, [email, password, supabase.auth, validateEmail, router, nextPath])

  const handleSignUp = useCallback(async () => {
    if (!validateEmail(email)) return
    if (getStrength(password) < 3) { setPasswordError("Please choose a stronger password"); return }
    if (password !== confirmPassword) { setPasswordError("Passwords do not match"); return }
    setIsSubmitting(true)
    setMessage(null)
    setPasswordError(null)
    try {
      let data: { user: any }

      if (isAnonymous) {
        // Convert anonymous account — keeps same user_id and all data
        const result = await supabase.auth.updateUser({ email, password })
        if (result.error) throw result.error
        data = { user: result.data.user }
        trackEvent("anonymous_converted", { user_id: data.user?.id ?? "", email, source: "login_page" })
      } else {
        const result = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: typeof window !== "undefined"
              ? `${window.location.origin}/auth/callback`
              : undefined,
          },
        })
        if (result.error) throw result.error
        data = { user: result.data.user }
      }

      trackEvent("sign_up_completed", {
        user_id: data.user?.id ?? "",
        email,
        source: isAnonymous ? "anonymous_conversion" : "login_page",
      })

      // Push Enhanced Conversion data + attribution for Google Ads optimization
      const attr = getAttribution()
      window.dataLayer = window.dataLayer || []
      window.dataLayer.push({
        event: "ads_conversion",
        conversion_type: "sign_up",
        user_id: data.user?.id ?? "",
        enhanced_conversion_data: { email },
        ...(attr?.gclid && { gclid: attr.gclid }),
        ...(attr?.utm_campaign && { utm_campaign: attr.utm_campaign }),
        ...(attr?.utm_term && { utm_term: attr.utm_term }),
      })

      setMode("check-email")
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Failed to create account.",
      })
    } finally {
      setIsSubmitting(false)
    }
  }, [email, password, confirmPassword, supabase.auth, validateEmail, isAnonymous])

  const handleResetPassword = useCallback(async () => {
    if (!validateEmail(email)) return
    setIsSubmitting(true)
    setMessage(null)
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: typeof window !== "undefined"
          ? `${window.location.origin}/auth/callback?next=/reset-password`
          : undefined,
      })
      if (error) throw error
      setMode("check-email")
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Failed to send reset email.",
      })
    } finally {
      setIsSubmitting(false)
    }
  }, [email, supabase.auth, validateEmail])

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      if (mode === "sign-up") handleSignUp()
      else if (mode === "forgot-password") handleResetPassword()
      else handleSignIn()
    },
    [mode, handleSignIn, handleSignUp, handleResetPassword]
  )

  const title = useMemo(() => {
    switch (mode) {
      case "sign-up": return "Create your account"
      case "forgot-password": return "Reset your password"
      case "check-email": return "Check your email"
      default: return "Welcome back"
    }
  }, [mode])

  const description = useMemo(() => {
    switch (mode) {
      case "sign-up": return "Free plan — 30 pages/month. No credit card required."
      case "forgot-password": return "We'll send you a link to reset your password"
      case "check-email": return `We've sent an email to ${email}`
      default: return "Sign in to your account to continue"
    }
  }, [mode, email])

  const submitLabel = useMemo(() => {
    switch (mode) {
      case "sign-up": return "Create account"
      case "forgot-password": return "Send reset link"
      default: return "Sign in"
    }
  }, [mode])

  const isFormValid = useMemo(() => {
    if (!email) return false
    if (mode === "forgot-password") return true
    if (!password) return false
    if (mode === "sign-up") return getStrength(password) >= 3 && password === confirmPassword
    return true
  }, [email, password, confirmPassword, mode])

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-[420px]">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Link href="/" className="flex items-center gap-2.5">
            <Image src="/parsli-icon.png" alt="Parsli" width={36} height={36} className="rounded-lg" />
            <span className="font-bold text-xl tracking-tight">Parsli</span>
          </Link>
        </div>

        <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
          {/* Header */}
          <div className="px-6 pt-8 pb-6 text-center bg-gradient-to-b from-muted/50 to-transparent">
            <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
            <p className="mt-1.5 text-sm text-muted-foreground">{description}</p>
          </div>

          {/* Form */}
          <div className="px-6 pb-6">
            {mode === "check-email" ? (
              <div className="space-y-4">
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-center">
                  <Mail className="mx-auto h-8 w-8 text-emerald-500" />
                  <p className="mt-2 text-sm text-emerald-700">
                    Click the link in your email to continue.
                  </p>
                </div>
                <Button variant="outline" className="w-full" onClick={() => { setMode("sign-in"); setMessage(null) }}>
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
                  onClick={handleGoogleAuth}
                  disabled={isGoogleLoading}
                >
                  {isGoogleLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <svg className="h-4 w-4" viewBox="0 0 24 24">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                    </svg>
                  )}
                  Continue with Google
                </Button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">or</span>
                  </div>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
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
                      <AlertCircle className="h-3 w-3" />{emailError}
                    </p>
                  )}
                </div>

                {mode !== "forgot-password" && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="auth-password">Password</Label>
                      {mode === "sign-in" && (
                        <button type="button" onClick={() => { setMode("forgot-password"); setMessage(null); setPasswordError(null) }}
                          className="text-xs text-primary hover:text-primary/80 hover:underline transition-colors">
                          Forgot password?
                        </button>
                      )}
                    </div>
                    <PasswordInput
                      id="auth-password"
                      autoComplete={mode === "sign-up" ? "new-password" : "current-password"}
                      value={password}
                      onChange={(e) => { setPassword(e.target.value); setPasswordError(null) }}
                      placeholder={mode === "sign-up" ? "Create a password" : "Enter your password"}
                      aria-invalid={!!passwordError}
                      className={cn(passwordError && "border-destructive")}
                    />
                    {passwordError && (
                      <p className="text-xs text-destructive flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />{passwordError}
                      </p>
                    )}
                  </div>
                )}

                {mode === "sign-up" && password && <PasswordStrength password={password} />}

                {mode === "sign-up" && (
                  <div className="space-y-2">
                    <Label htmlFor="auth-confirm-password">Confirm password</Label>
                    <PasswordInput
                      id="auth-confirm-password"
                      autoComplete="new-password"
                      value={confirmPassword}
                      onChange={(e) => { setConfirmPassword(e.target.value); setPasswordError(null) }}
                      placeholder="Confirm your password"
                      aria-invalid={password !== confirmPassword && confirmPassword.length > 0}
                      className={cn(password !== confirmPassword && confirmPassword.length > 0 && "border-destructive")}
                    />
                    {password !== confirmPassword && confirmPassword.length > 0 && (
                      <p className="text-xs text-destructive flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />Passwords do not match
                      </p>
                    )}
                  </div>
                )}

                {message && (
                  <div className={cn(
                    "flex items-center gap-2 rounded-lg border p-3 text-sm",
                    message.type === "success"
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                      : "border-destructive/20 bg-destructive/5 text-destructive"
                  )}>
                    {message.type === "success"
                      ? <CheckCircle2 className="h-4 w-4 shrink-0" />
                      : <AlertCircle className="h-4 w-4 shrink-0" />}
                    <p>{message.text}</p>
                  </div>
                )}

                <Button type="submit" className="w-full h-10" disabled={isSubmitting || !isFormValid}>
                  {isSubmitting ? <><Loader2 className="h-4 w-4 animate-spin" />Please wait...</> : submitLabel}
                </Button>

                <div className="text-center text-sm text-muted-foreground">
                  {mode === "sign-in" ? (
                    <p>Don&apos;t have an account?{" "}
                      <button type="button" onClick={() => { trackEvent("sign_up_started", { source: "login_page" }); setMode("sign-up"); setMessage(null); setPasswordError(null) }}
                        className="font-medium text-primary hover:text-primary/80 hover:underline transition-colors">Sign up</button>
                    </p>
                  ) : mode === "sign-up" ? (
                    <p>Already have an account?{" "}
                      <button type="button" onClick={() => { setMode("sign-in"); setMessage(null); setPasswordError(null) }}
                        className="font-medium text-primary hover:text-primary/80 hover:underline transition-colors">Sign in</button>
                    </p>
                  ) : (
                    <p>Remember your password?{" "}
                      <button type="button" onClick={() => { setMode("sign-in"); setMessage(null) }}
                        className="font-medium text-primary hover:text-primary/80 hover:underline transition-colors">Sign in</button>
                    </p>
                  )}
                </div>
              </form>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
