/**
 * System prompt builder for the document chat.
 *
 * This is the load-bearing wall against hallucination. The two tools
 * (`calculate`, `query_extracted_data`) are the safety net; this prompt
 * is what tells the model to use them and what's off-limits.
 */

import type { Parser, ProcessedDocument } from "@/lib/extractor/types"
import {
  isExtractionField,
  type SchemaField,
  type ObjectField,
  type ListField,
  type TableField,
} from "@/lib/schema"

/** Render a single schema field as a readable line, recursing into compounds. */
function renderField(field: SchemaField, indent: string): string[] {
  if (!isExtractionField(field)) return []

  const desc = field.description ? ` — ${field.description}` : ""
  const lines = [`${indent}- ${field.id} (${field.type}): ${field.name}${desc}`]

  switch (field.type) {
    case "object": {
      for (const child of (field as ObjectField).children ?? []) {
        lines.push(...renderField(child, indent + "    "))
      }
      break
    }
    case "list": {
      const item = (field as ListField).item
      if (item) {
        lines.push(`${indent}    items:`)
        lines.push(...renderField(item, indent + "        "))
      }
      break
    }
    case "table": {
      for (const col of (field as TableField).columns ?? []) {
        lines.push(...renderField(col, indent + "    "))
      }
      break
    }
  }
  return lines
}

function renderSchema(fields: SchemaField[]): string {
  const lines = fields.flatMap((f) => renderField(f, ""))
  return lines.length > 0 ? lines.join("\n") : "(no fields defined)"
}

/** Strip the `__meta__` key from results if present (it holds confidence/review). */
function stripMeta(results: Record<string, unknown>): Record<string, unknown> {
  if (!results || typeof results !== "object") return {}
  const { __meta__, ...rest } = results as Record<string, unknown> & {
    __meta__?: unknown
  }
  return rest
}

/** Pull confidence scores from either column or __meta__ (whichever exists). */
function extractConfidence(doc: ProcessedDocument): Record<string, unknown> {
  if (doc.confidence && typeof doc.confidence === "object") {
    return doc.confidence
  }
  const meta = (doc.results as { __meta__?: { confidence?: Record<string, unknown> } } | null)
    ?.__meta__
  if (meta?.confidence && typeof meta.confidence === "object") {
    return meta.confidence
  }
  return {}
}

/**
 * Branch for `full_content` parsers (e.g. handwriting tool bridge): no schema,
 * the document's `results.markdown` holds the full transcribed text. The model
 * can reason directly off the text instead of querying a structured JSON.
 */
function buildFullContentSystemPrompt(
  parser: Parser,
  doc: ProcessedDocument
): string {
  const results = (doc.results ?? {}) as {
    markdown?: string
    language?: string
    doc_type?: string
  }
  const markdown = typeof results.markdown === "string" ? results.markdown : ""
  const language = typeof results.language === "string" && results.language ? results.language : "en"
  const docType = typeof results.doc_type === "string" ? results.doc_type : "generic"

  return `You are Parsli's document assistant. You help a user understand and work with the full text of a single document they have uploaded.

CRITICAL CONTEXT:
The full transcribed text of the user's document is included below in the DOCUMENT TEXT section. You can read it, summarize, explain, translate, quiz the user, or answer questions about its content.

LANGUAGE:
The document is in language code "${language}". The user is most likely fluent in this language. ALWAYS reply in the same language as the document UNLESS the user writes to you in a different language — in that case, match the user's language.

ABSOLUTE RULES — break any of these and you have failed:
1. NEVER invent facts that are not supported by the DOCUMENT TEXT. If the user asks something the text doesn't cover, say so plainly.
2. NEVER do arithmetic in your head. ALWAYS call the \`calculate\` tool — even for trivial operations like 5 + 3 or simple percentages. This applies in particular when the user asks you to total numbers, compute averages, or convert currencies based on values in the text.
3. Quote text from the document exactly as written when the user asks for verbatim content. Do not paraphrase or reformat it unless they ask.
4. Be concise. Answer the question directly. Use markdown for lists or tables only when it improves clarity. No filler.
5. If the document text is empty or unreadable, say so plainly and offer to help if the user provides more context.

DOCUMENT METADATA:
- Filename: ${doc.file_name}
- Type: ${docType}
- Language: ${language}
- Source: ${doc.source_type}
- Parser: ${parser.name}

DOCUMENT TEXT:
\`\`\`
${markdown}
\`\`\``
}

export function buildChatSystemPrompt(
  parser: Parser,
  doc: ProcessedDocument
): string {
  if (parser.extraction_type === "full_content") {
    return buildFullContentSystemPrompt(parser, doc)
  }

  const data = stripMeta(doc.results ?? {})
  const confidence = extractConfidence(doc)
  const schemaText = renderSchema(parser.fields ?? [])
  const dataJson = JSON.stringify(data, null, 2)
  const confidenceJson = JSON.stringify(confidence, null, 2)

  return `You are Parsli's document data assistant. You help a user understand the structured data that was extracted from a single document.

CRITICAL CONTEXT:
You DO NOT have access to the original document file. You only see the extracted fields below. You cannot read pages, scan images, or fetch text outside of what's shown.

ABSOLUTE RULES — break any of these and you have failed:
1. NEVER invent or assume values. If a field isn't in the EXTRACTED DATA section, reply exactly: "That information wasn't extracted from this document. You can update the parser fields to extract it next time."
2. NEVER do arithmetic in your head. ALWAYS call the \`calculate\` tool — even for trivial operations like 5 + 3 or simple percentages.
3. NEVER enumerate arrays manually. For any question involving sums, counts, averages, min/max, or filtering across an array, ALWAYS call \`query_extracted_data\`.
4. Quote field VALUES exactly as they appear in the data. Do not paraphrase, reformat, round, currency-convert, or translate them unless the user explicitly asks.
5. When you reference a value, mention which field it came from in plain language (e.g. "the \`subtotal\` field shows $541.27").
6. If a question is outside the extracted data (asking about pages, images, layout, the original file, web searches, or anything not in the JSON), say so plainly and offer to help with what IS available.
7. Be concise. Answer the question directly. Use markdown for lists or tables only when it improves clarity. No filler.

DOCUMENT METADATA:
- Filename: ${doc.file_name}
- Pages: ${doc.page_count ?? "unknown"}
- Processed: ${doc.processed_at ?? "unknown"}
- Source: ${doc.source_type}
- Parser: ${parser.name}

PARSER SCHEMA (${(parser.fields ?? []).filter(isExtractionField).length} fields — IDs are the JSON keys, names are the human-readable labels):
${schemaText}

EXTRACTED DATA:
\`\`\`json
${dataJson}
\`\`\`

CONFIDENCE SCORES (0–1, higher = more confident; missing fields default to high confidence):
\`\`\`json
${confidenceJson}
\`\`\``
}
