"use client"

import { useRouter } from "next/navigation"
import { useActiveParser } from "@/components/extractor/parser-context"
import { ParserSettings } from "@/components/extractor/settings/ParserSettings"

export default function SettingsRoutePage() {
  const router = useRouter()
  const { parser, updateParser } = useActiveParser()
  if (!parser) return null
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
      <div className="mb-6">
        <h1 className="text-xl font-bold">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Configure parser settings and manage your parser.
        </p>
      </div>
      <ParserSettings
        parser={parser}
        onUpdate={updateParser}
        onDeleted={() => router.push("/dashboard")}
      />
    </div>
  )
}
