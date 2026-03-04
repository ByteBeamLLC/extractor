"use client"

import { useState } from "react"
import { formatDistanceToNow } from "date-fns"
import {
  Webhook,
  FileSpreadsheet,
  Zap,
  Blocks,
  Workflow,
  Trash2,
  Play,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { useSupabaseClient } from "@/lib/supabase/hooks"
import type { ParserIntegration } from "@/lib/extractor/types"

const TYPE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  webhook: Webhook,
  google_sheets: FileSpreadsheet,
  zapier: Zap,
  make: Blocks,
  power_automate: Workflow,
}

interface IntegrationCardProps {
  integration: ParserIntegration
  parserId: string
  onUpdated: () => void
}

export function IntegrationCard({ integration, parserId, onUpdated }: IntegrationCardProps) {
  const supabase = useSupabaseClient()
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ success: boolean; error?: string } | null>(null)

  const Icon = TYPE_ICONS[integration.type] ?? Webhook

  const handleToggle = async (active: boolean) => {
    await supabase
      .from("parser_integrations")
      .update({ is_active: active, updated_at: new Date().toISOString() })
      .eq("id", integration.id)
    onUpdated()
  }

  const handleDelete = async () => {
    await supabase
      .from("parser_integrations")
      .delete()
      .eq("id", integration.id)
    onUpdated()
  }

  const handleTest = async () => {
    setTesting(true)
    setTestResult(null)
    try {
      const res = await fetch(
        `/api/extractor/parsers/${parserId}/integrations/${integration.id}/test`,
        { method: "POST" }
      )
      const data = await res.json()
      setTestResult({ success: data.success, error: data.error })
    } catch (err) {
      setTestResult({ success: false, error: "Test request failed" })
    } finally {
      setTesting(false)
    }
  }

  return (
    <div className="border rounded-lg p-4 bg-card">
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          <Icon className="h-4.5 w-4.5 text-primary" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">{integration.name}</span>
            <Badge variant={integration.is_active ? "default" : "secondary"} className="text-xs">
              {integration.type.replace("_", " ")}
            </Badge>
          </div>
          {integration.last_triggered_at && (
            <p className="text-xs text-muted-foreground">
              Last triggered {formatDistanceToNow(new Date(integration.last_triggered_at), { addSuffix: true })}
            </p>
          )}
          {integration.last_error && (
            <p className="text-xs text-destructive flex items-center gap-1 mt-0.5">
              <AlertCircle className="h-3 w-3" />
              {integration.last_error}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {integration.type !== "google_sheets" && (
            <Button variant="ghost" size="sm" onClick={handleTest} disabled={testing}>
              {testing ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Play className="h-3.5 w-3.5" />
              )}
              <span className="ml-1 text-xs">Test</span>
            </Button>
          )}
          <Switch checked={integration.is_active} onCheckedChange={handleToggle} />
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive"
            onClick={handleDelete}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {testResult && (
        <div
          className={`mt-3 p-2 rounded text-xs flex items-center gap-1.5 ${
            testResult.success
              ? "bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-300"
              : "bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300"
          }`}
        >
          {testResult.success ? (
            <CheckCircle2 className="h-3.5 w-3.5" />
          ) : (
            <XCircle className="h-3.5 w-3.5" />
          )}
          {testResult.success ? "Test delivery successful" : testResult.error ?? "Test failed"}
        </div>
      )}
    </div>
  )
}
