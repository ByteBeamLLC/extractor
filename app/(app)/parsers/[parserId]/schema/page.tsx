"use client"

import { useActiveParser } from "@/components/extractor/parser-context"
import { ParserSchemaBuilder } from "@/components/extractor/schema/ParserSchemaBuilder"

export default function SchemaPage() {
  const { parser, updateParser } = useActiveParser()
  if (!parser) return null
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
      <div className="mb-6">
        <h1 className="text-xl font-bold">Schema</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Define the fields you want to extract from documents.
        </p>
      </div>
      <ParserSchemaBuilder parser={parser} onUpdate={updateParser} />
    </div>
  )
}
