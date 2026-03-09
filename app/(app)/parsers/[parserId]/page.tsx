"use client"

import { useActiveParser } from "@/components/extractor/parser-context"
import { ParserOverview } from "@/components/extractor/overview/ParserOverview"

export default function ParserOverviewPage() {
  const { parser, updateParser } = useActiveParser()
  if (!parser) return null
  return <ParserOverview parser={parser} onUpdate={updateParser} />
}
