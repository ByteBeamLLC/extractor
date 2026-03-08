"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { AlertCircle, ArrowLeft, CheckCircle2, KeyRound, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { PasswordInput } from "@/components/ui/password-input"
import { PasswordStrength, getStrength } from "@/components/ui/password-strength"
import { useSupabaseClient } from "@/lib/supabase/hooks"
import { cn } from "@/lib/utils"

export default function ResetPasswordPage() {
  const supabase = useSupabaseClient()
  const router = useRouter()
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  const passwordStrength = getStrength(password)
  const isFormValid = passwordStrength >= 3 && password === confirmPassword

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (passwordStrength < 3) {
      setMessage({ type: "error", text: "Please choose a stronger password." })
      return
    }

    if (password !== confirmPassword) {
      setMessage({ type: "error", text: "Passwords do not match. Please try again." })
      return
    }

    setIsSubmitting(true)
    setMessage(null)

    try {
      const { error } = await supabase.auth.updateUser({ password })
      if (error) {
        throw error
      }
      setIsSuccess(true)
      setMessage({ type: "success", text: "Your password has been updated successfully." })
      setTimeout(() => router.push("/"), 2000)
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Something went wrong. Please try again.",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-muted/30 via-background to-background px-4 py-12">
      <div className="w-full max-w-md">
        {/* Back link */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/")}
          className="mb-6 -ml-2 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to app
        </Button>

        <Card className="border-0 shadow-lg">
          <CardContent className="p-0">
            {/* Header */}
            <div className="px-6 pt-8 pb-6 text-center border-b bg-muted/30">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <KeyRound className="h-6 w-6 text-primary" />
              </div>
              <h1 className="text-xl font-semibold tracking-tight">
                {isSuccess ? "Password updated" : "Set a new password"}
              </h1>
              <p className="mt-1.5 text-sm text-muted-foreground">
                {isSuccess
                  ? "You can now sign in with your new password"
                  : "Choose a strong password to secure your account"}
              </p>
            </div>

            {/* Form */}
            <div className="p-6">
              {isSuccess ? (
                <div className="space-y-4">
                  <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-center">
                    <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-500" />
                    <p className="mt-2 text-sm text-emerald-700">
                      Redirecting you to the app...
                    </p>
                  </div>
                </div>
              ) : (
                <form className="space-y-5" onSubmit={handleSubmit}>
                  {/* New password */}
                  <div className="space-y-2">
                    <Label htmlFor="password">New password</Label>
                    <PasswordInput
                      id="password"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value)
                        setMessage(null)
                      }}
                      placeholder="Create a new password"
                      autoFocus
                      autoComplete="new-password"
                    />
                  </div>

                  {/* Password strength */}
                  {password && <PasswordStrength password={password} />}

                  {/* Confirm password */}
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">Confirm password</Label>
                    <PasswordInput
                      id="confirm-password"
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value)
                        setMessage(null)
                      }}
                      placeholder="Re-enter your password"
                      autoComplete="new-password"
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

                  {/* Error message */}
                  {message && message.type === "error" && (
                    <div className="flex items-center gap-2 rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive">
                      <AlertCircle className="h-4 w-4 shrink-0" />
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
                        Updating password...
                      </>
                    ) : (
                      "Update password"
                    )}
                  </Button>
                </form>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Footer text */}
        <p className="mt-6 text-center text-xs text-muted-foreground">
          Having trouble? Contact support for assistance.
        </p>
      </div>
    </main>
  )
}
