"use client"

import { useActiveParser } from "@/components/extractor/parser-context"
import { ApiKeyManager } from "@/components/extractor/api/ApiKeyManager"
import { SignUpGate } from "@/components/auth/SignUpGate"

export default function ApiPage() {
  const { parser } = useActiveParser()
  if (!parser) return null
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
      <div className="mb-6">
        <h1 className="text-xl font-bold">API & Webhooks</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Use API keys to submit documents programmatically.
        </p>
      </div>
      <SignUpGate feature="API Access">
        <ApiKeyManager parser={parser} />
      </SignUpGate>
    </div>
  )
}
