"use client"

import { useActiveParser } from "@/components/extractor/parser-context"
import { ImportPage } from "@/components/extractor/import/ImportPage"

export default function ImportRoutePage() {
  const { parser } = useActiveParser()
  if (!parser) return null
  return <ImportPage parser={parser} />
}
