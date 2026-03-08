"use client"

import * as React from "react"
import { Check, X } from "lucide-react"

import { cn } from "@/lib/utils"

interface PasswordStrengthProps {
  password: string
  className?: string
}

interface Requirement {
  label: string
  test: (password: string) => boolean
}

const requirements: Requirement[] = [
  { label: "At least 8 characters", test: (p) => p.length >= 8 },
  { label: "Contains uppercase letter", test: (p) => /[A-Z]/.test(p) },
  { label: "Contains lowercase letter", test: (p) => /[a-z]/.test(p) },
  { label: "Contains a number", test: (p) => /\d/.test(p) },
]

function getStrength(password: string): number {
  return requirements.filter((req) => req.test(password)).length
}

function getStrengthLabel(strength: number): string {
  if (strength === 0) return "Very weak"
  if (strength === 1) return "Weak"
  if (strength === 2) return "Fair"
  if (strength === 3) return "Good"
  return "Strong"
}

function getStrengthColor(strength: number): string {
  if (strength === 0) return "bg-muted"
  if (strength === 1) return "bg-red-500"
  if (strength === 2) return "bg-orange-500"
  if (strength === 3) return "bg-yellow-500"
  return "bg-emerald-500"
}

function PasswordStrength({ password, className }: PasswordStrengthProps) {
  const strength = getStrength(password)
  const strengthLabel = getStrengthLabel(strength)

  if (!password) return null

  return (
    <div className={cn("space-y-3", className)}>
      {/* Strength bar */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Password strength</span>
          <span
            className={cn(
              "font-medium",
              strength <= 1 && "text-red-500",
              strength === 2 && "text-orange-500",
              strength === 3 && "text-yellow-600",
              strength === 4 && "text-emerald-500"
            )}
          >
            {strengthLabel}
          </span>
        </div>
        <div className="flex gap-1">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className={cn(
                "h-1.5 flex-1 rounded-full transition-colors duration-200",
                i < strength ? getStrengthColor(strength) : "bg-muted"
              )}
            />
          ))}
        </div>
      </div>

      {/* Requirements checklist */}
      <ul className="space-y-1">
        {requirements.map((req) => {
          const met = req.test(password)
          return (
            <li
              key={req.label}
              className={cn(
                "flex items-center gap-2 text-xs transition-colors",
                met ? "text-emerald-600" : "text-muted-foreground"
              )}
            >
              {met ? (
                <Check className="h-3.5 w-3.5" />
              ) : (
                <X className="h-3.5 w-3.5" />
              )}
              {req.label}
            </li>
          )
        })}
      </ul>
    </div>
  )
}

export { PasswordStrength, getStrength, requirements }
