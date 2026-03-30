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
import { useSupabaseClient } from "@/lib/supabase/hooks"
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

  const [mode, setMode] = useState<AuthMode>("sign-in")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [emailError, setEmailError] = useState<string | null>(null)
  const [passwordError, setPasswordError] = useState<string | null>(null)

  const supabase = useSupabaseClient()

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
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: typeof window !== "undefined"
            ? `${window.location.origin}/auth/callback`
            : undefined,
        },
      })
      if (error) throw error
      trackEvent("sign_up_completed", {
        user_id: data.user?.id ?? "",
        email,
        source: "login_page",
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
  }, [email, password, confirmPassword, supabase.auth, validateEmail])

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
      case "sign-up": return "Start extracting data from documents with AI"
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
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
