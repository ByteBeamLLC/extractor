"use client"

import { useActiveParser } from "@/components/extractor/parser-context"
import { DocumentsPage } from "@/components/extractor/documents/DocumentsPage"

export default function DocumentsRoutePage() {
  const { parser } = useActiveParser()
  if (!parser) return null
  return <DocumentsPage parser={parser} />
}
