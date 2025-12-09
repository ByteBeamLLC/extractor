"use client"

// Route uses cookies (supabase session) so opt out of static rendering
export const dynamic = "force-dynamic"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useSupabaseClient } from "@/lib/supabase/hooks"

export default function ResetPasswordPage() {
  const supabase = useSupabaseClient()
  const router = useRouter()
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (password !== confirmPassword) {
      setMessage({ type: "error", text: "Passwords do not match. Try again." })
      return
    }
    if (password.length < 6) {
      setMessage({ type: "error", text: "Password must be at least 6 characters long." })
      return
    }

    setIsSubmitting(true)
    setMessage(null)

    try {
      const { error } = await supabase.auth.updateUser({ password })
      if (error) {
        throw error
      }
      setMessage({ type: "success", text: "Password updated. Redirecting you to the app..." })
      setTimeout(() => router.push("/"), 1000)
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
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Set a new password</CardTitle>
          <CardDescription>
            Choose a strong password to secure your account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="password">New password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter a new password"
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm password</Label>
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder="Re-enter your password"
              />
            </div>

            {message && (
              <p
                className={`text-sm ${
                  message.type === "success" ? "text-emerald-600" : "text-destructive"
                }`}
              >
                {message.text}
              </p>
            )}

            <div className="flex items-center justify-between">
              <Button
                type="button"
                variant="ghost"
                onClick={() => router.push("/")}
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to app
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Updating..." : "Update password"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </main>
  )
}
