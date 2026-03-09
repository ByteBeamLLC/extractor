"use client"

import { createContext, useCallback, useContext, useRef, useState } from "react"
import { useSupabaseClient } from "@/lib/supabase/hooks"
import type { Parser } from "@/lib/extractor/types"

interface ActiveParserContextType {
  parser: Parser | null
  setParser: (parser: Parser | null) => void
  updateParser: (updates: Partial<Parser>) => Promise<void>
}

const ActiveParserContext = createContext<ActiveParserContextType>({
  parser: null,
  setParser: () => {},
  updateParser: async () => {},
})

export function ActiveParserProvider({ children }: { children: React.ReactNode }) {
  const [parser, setParser] = useState<Parser | null>(null)
  const supabase = useSupabaseClient()
  const parserRef = useRef(parser)
  parserRef.current = parser

  const updateParser = useCallback(
    async (updates: Partial<Parser>) => {
      const p = parserRef.current
      if (!p) return
      const { data, error } = await supabase
        .from("parsers")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", p.id)
        .select("*")
        .single()

      if (!error && data) {
        setParser(data)
      }
    },
    [supabase]
  )

  return (
    <ActiveParserContext.Provider value={{ parser, setParser, updateParser }}>
      {children}
    </ActiveParserContext.Provider>
  )
}

export function useActiveParser() {
  return useContext(ActiveParserContext)
}
