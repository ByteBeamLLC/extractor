"use client"

import { useParams } from "next/navigation"
import { useActiveParser } from "@/components/extractor/parser-context"
import { DocumentDetailView } from "@/components/extractor/documents/DocumentDetailView"

export default function DocumentDetailPage() {
  const { parser, updateParser } = useActiveParser()
  const params = useParams()
  const documentId = params.documentId as string

  if (!parser) return null

  return <DocumentDetailView parser={parser} documentId={documentId} onUpdate={updateParser} />
}
