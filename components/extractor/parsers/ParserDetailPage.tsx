"use client"

import { useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Loader2, AlertCircle } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useSession, useSupabaseClient } from "@/lib/supabase/hooks"
import type { Parser } from "@/lib/extractor/types"
import { ParserSchemaBuilder } from "@/components/extractor/schema/ParserSchemaBuilder"
import { ParserTestPanel } from "@/components/extractor/test/ParserTestPanel"
import { ActivityFeed } from "@/components/extractor/activity/ActivityFeed"
import { IntegrationList } from "@/components/extractor/integrations/IntegrationList"
import { ApiKeyManager } from "@/components/extractor/api/ApiKeyManager"
import { ParserSettings } from "@/components/extractor/settings/ParserSettings"

interface ParserDetailPageProps {
  parserId: string
}

export function ParserDetailPage({ parserId }: ParserDetailPageProps) {
  const session = useSession()
  const supabase = useSupabaseClient()
  const router = useRouter()

  const [parser, setParser] = useState<Parser | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("schema")

  const loadParser = useCallback(async () => {
    if (!session?.user?.id) return
    try {
      setError(null)
      const { data, error: fetchError } = await supabase
        .from("parsers")
        .select("*")
        .eq("id", parserId)
        .eq("user_id", session.user.id)
        .single()

      if (fetchError || !data) {
        setError("Parser not found")
        return
      }
      setParser(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load parser")
    } finally {
      setLoading(false)
    }
  }, [parserId, session?.user?.id, supabase])

  useEffect(() => {
    loadParser()
  }, [loadParser])

  const handleParserUpdate = useCallback(
    async (updates: Partial<Parser>) => {
      if (!parser) return
      const { data, error: updateError } = await supabase
        .from("parsers")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", parser.id)
        .select("*")
        .single()

      if (!updateError && data) {
        setParser(data)
      }
    },
    [parser, supabase]
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error || !parser) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <AlertCircle className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
        <h2 className="text-lg font-semibold mb-2">Parser not found</h2>
        <p className="text-sm text-muted-foreground mb-6">{error}</p>
        <Button variant="outline" asChild>
          <Link href="/extractor">Back to parsers</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/extractor">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-xl font-bold">{parser.name}</h1>
          {parser.description && (
            <p className="text-sm text-muted-foreground">{parser.description}</p>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="schema">Schema</TabsTrigger>
          <TabsTrigger value="test">Test</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
          <TabsTrigger value="api">API</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="schema">
          <ParserSchemaBuilder
            parser={parser}
            onUpdate={handleParserUpdate}
          />
        </TabsContent>

        <TabsContent value="test">
          <ParserTestPanel parser={parser} />
        </TabsContent>

        <TabsContent value="activity">
          <ActivityFeed parserId={parser.id} />
        </TabsContent>

        <TabsContent value="integrations">
          <IntegrationList parserId={parser.id} />
        </TabsContent>

        <TabsContent value="api">
          <ApiKeyManager parser={parser} />
        </TabsContent>

        <TabsContent value="settings">
          <ParserSettings parser={parser} onUpdate={handleParserUpdate} onDeleted={() => router.push("/extractor")} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
