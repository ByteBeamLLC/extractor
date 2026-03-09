"use client"

import { useCallback, useEffect, useState } from "react"
import { Loader2, AlertCircle } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useSession, useSupabaseClient } from "@/lib/supabase/hooks"
import { useActiveParser } from "@/components/extractor/parser-context"

export default function ParserLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: { parserId: string }
}) {
  const session = useSession()
  const supabase = useSupabaseClient()
  const { setParser } = useActiveParser()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadParser = useCallback(async () => {
    if (!session?.user?.id) return
    try {
      setError(null)
      const { data, error: fetchError } = await supabase
        .from("parsers")
        .select("*")
        .eq("id", params.parserId)
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
  }, [params.parserId, session?.user?.id, supabase, setParser])

  useEffect(() => {
    loadParser()
    return () => setParser(null)
  }, [loadParser, setParser])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <AlertCircle className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
        <h2 className="text-lg font-semibold mb-2">Parser not found</h2>
        <p className="text-sm text-muted-foreground mb-6">{error}</p>
        <Button variant="outline" asChild>
          <Link href="/dashboard">Back to parsers</Link>
        </Button>
      </div>
    )
  }

  return <>{children}</>
}
