"use client"

import { useActiveParser } from "@/components/extractor/parser-context"
import { ExportPage } from "@/components/extractor/export/ExportPage"

export default function ExportRoutePage() {
  const { parser } = useActiveParser()
  if (!parser) return null
  return <ExportPage parser={parser} />
}
