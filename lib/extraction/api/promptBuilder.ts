/**
 * Prompt building utilities for extraction API
 */

import type { InputDocumentPayload } from "./types"
import { isTextLikeMimeType } from "./documentParser"

/**
 * Content item for multimodal prompts
 */
export type ContentItem =
  | { type: "text"; text: string }
  | { type: "image"; image: string }

/**
 * Builds the extraction prompt for multi-document mode
 */
export function buildMultiDocumentPrompt(
  inputDocuments: Map<string, InputDocumentPayload>,
  fieldInputDocMap: Record<string, string[]> | null,
  schemaSummary: string,
  extractionPromptOverride?: string
): ContentItem[] {
  const docNameById = new Map<string, string>()
  inputDocuments.forEach((doc, id) => {
    docNameById.set(id, doc.name || id)
  })

  const fieldDocHints = fieldInputDocMap && typeof fieldInputDocMap === "object"
    ? fieldInputDocMap
    : {}

  const routingLines = Object.entries(fieldDocHints).map(
    ([fieldId, docIds]) =>
      `- ${fieldId}: ${docIds.map((id) => docNameById.get(id) || id).join(", ")}`
  )

  const routingText =
    routingLines.length > 0
      ? `Document routing (use only these documents for each field):\n${routingLines.join("\n")}`
      : "No explicit document routing provided; use the content of the attached documents as needed."

  const baseText = extractionPromptOverride
    ? `${extractionPromptOverride}\n\n${routingText}\n\nSchema Fields (for reference):\n${schemaSummary}`
    : `You are a specialized AI model for structured data extraction. Multiple input documents are attached. Use only the documents referenced for each field (see routing below). Do not cross-contaminate data between documents.

${routingText}

${schemaSummary}

Guidelines:
- Strictly adhere to the schema. Do not add or remove fields.
- If a field is not present in its referenced document(s), return "-" (a single hyphen). Do not guess.
- Respect data types and formatting instructions supplied in the schema.
- Provide a "__meta__" object with a "confidence" array. Each entry must contain a "fieldId" and a "value" between 0 and 1 describing your confidence in that field. Every field must appear exactly once in the confidence array. Use 1.0 only when highly certain; use 0.0 when the value is "-" or uncertain.`

  const contents: ContentItem[] = [{ type: "text", text: baseText }]

  inputDocuments.forEach((doc, fieldId) => {
    const mimeType = doc.type || "application/octet-stream"
    const isTextDoc = typeof doc.text === "string" || isTextLikeMimeType(mimeType)
    const decodedText =
      typeof doc.text === "string"
        ? doc.text
        : isTextDoc && doc.data
          ? Buffer.from(String(doc.data), "base64").toString("utf-8")
          : null
    const label = `Document "${doc.name || fieldId}" (input id: ${fieldId})`

    if (decodedText) {
      contents.push({
        type: "text",
        text: `${label}\n\n${decodedText}`,
      })
    } else if (doc.data) {
      contents.push({
        type: "text",
        text: label,
      })
      contents.push({
        type: "image",
        image: `data:${mimeType};base64,${doc.data}`,
      })
    } else {
      contents.push({
        type: "text",
        text: label,
      })
    }
  })

  return contents
}

/**
 * Builds the extraction prompt for image files
 */
export function buildImagePrompt(
  base64: string,
  mimeType: string,
  schemaSummary: string,
  extractionPromptOverride?: string
): ContentItem[] {
  const baseText = extractionPromptOverride
    ? `${extractionPromptOverride}\n\nSchema Fields (for reference):\n${schemaSummary}`
    : `You are a specialized AI model for structured data extraction. Your purpose is to accurately extract information from the given image based on a dynamic, user-provided schema.

${schemaSummary}

Here are the guiding principles for your operation:

Strict Adherence to Schema: The primary goal is to populate the fields defined in the schema. You must not add, omit, or alter any fields. The structure of your output must perfectly match the provided schema.

Confidence Reporting: You must include a confidence entry for every leaf field in the schema. Use 1.0 only when you are highly certain the extracted value is correct. Use 0 when the value is "-" or otherwise uncertain. Do not omit fields from the confidence array.

Contextual Extraction: Analyze the image content carefully to understand the context and ensure the extracted data correctly corresponds to the schema's field descriptions.

No Hallucination: If a piece of information for a specific field cannot be found in the image, you must use "-" (a single hyphen) as the value for that field. Do not invent, infer, or guess information.

Data Type Integrity: Ensure the extracted data conforms to the data type specified in the schema (e.g., number, string, boolean, array). Format dates according to ISO 8601 (YYYY-MM-DD) unless the schema specifies otherwise. Use "-" only when the information is truly unavailable.

Extract the information from the image according to the schema. Think about your answer first before you respond.

Follow these steps:
1. Carefully analyze the provided schema to understand each field, its data type, and its description.
2. Examine the entire image to locate the information corresponding to each field in the schema.
3. For each field, extract the precise data from the image that matches the field's description and context.
4. If information for a field is not present in the image, return "-" as its value.
5. Construct the final JSON object, ensuring it strictly validates against the provided schema and contains no extra text or explanations.
6. Include a "__meta__" object with a "confidence" array. Each entry must be an object with keys "fieldId" (the schema field ID) and "value" (a decimal between 0 and 1 representing your confidence in that field). Every leaf field must appear exactly once in this array.`

  return [
    { type: "text", text: baseText },
    { type: "image", image: `data:${mimeType};base64,${base64}` },
  ]
}

/**
 * Builds the extraction prompt for PDF files
 */
export function buildPdfPrompt(
  base64: string,
  mimeType: string,
  schemaSummary: string,
  supplementalText: string | null,
  extractionPromptOverride?: string
): ContentItem[] {
  const baseInstructions = extractionPromptOverride
    ? `${extractionPromptOverride}\n\nSchema Fields (for reference):\n${schemaSummary}`
    : `You are a specialized AI model for structured data extraction. A PDF document is attached. Read it carefully (including any scanned pages) and extract information according to the provided schema.

${schemaSummary}

Guidelines:
- Strictly adhere to the schema. Do not add or remove fields.
- If a field is not present in the document, return "-" (a single hyphen) for that field. Do not guess.
- Respect data types and formatting instructions supplied in the schema.
- Where possible, cross-verify values across the PDF to ensure accuracy.
- Provide a "__meta__" object with a "confidence" array. Each entry must contain a "fieldId" and a "value" between 0 and 1 describing your confidence in that field.
- Every field defined in the schema must appear exactly once in the confidence array. Use 1.0 only when you are highly certain; use 0.0 when the value is "-" or uncertain.`

  const contents: ContentItem[] = [
    { type: "text", text: baseInstructions },
    { type: "image", image: `data:${mimeType};base64,${base64}` },
  ]

  if (supplementalText && supplementalText.trim().length > 0) {
    contents.push({
      type: "text",
      text: `Supplemental extracted text (may be incomplete OCR):\n${supplementalText}`,
    })
  }

  return contents
}

/**
 * Builds the extraction prompt for text-based documents
 */
export function buildTextDocumentPrompt(
  documentText: string,
  schemaSummary: string,
  extractionPromptOverride?: string
): string {
  return extractionPromptOverride
    ? `${extractionPromptOverride}

Schema Fields (for reference):
${schemaSummary}

Document:
${documentText}`
    : `You are a specialized AI model for structured data extraction. Your purpose is to accurately extract information from a given document based on a dynamic, user-provided schema.

${schemaSummary}

Here are the guiding principles for your operation:

Strict Adherence to Schema: The primary goal is to populate the fields defined in the schema. You must not add, omit, or alter any fields. The structure of your output must perfectly match the provided schema.

Contextual Extraction: Do not just match keywords. Understand the context of the document to ensure the extracted data correctly corresponds to the schema's field descriptions.

No Hallucination: If a piece of information for a specific field cannot be found in the document, you must use "-" (a single hyphen) as the value for that field. Do not invent, infer, or guess information.

Data Type Integrity: Ensure the extracted data conforms to the data type specified in the schema (e.g., number, string, boolean, array). Format dates according to ISO 8601 (YYYY-MM-DD) unless the schema specifies otherwise. Use "-" only when the information is truly unavailable.

Select Field Constraints: For single_select and multi_select fields, you MUST only choose from the predefined options listed in parentheses. Do not create new values or variations - only use the exact options provided. If none of the options match the document, use "-".

Confidence Reporting: You must include a confidence entry for every field listed in the schema. Use 1.0 only when you are highly certain the extracted value is correct. Use 0.0 when the value is "-" or when you are unsure. Do not omit any fields from the confidence array.

Here is the document to process:
${documentText}

Extract the information from the document according to the schema. Think about your answer first before you respond.

Follow these steps:
1. Carefully analyze the provided schema to understand each field, its data type, and its description.
2. Read through the entire document to locate the information corresponding to each field in the schema.
3. For each field, extract the precise data from the document that matches the field's description and context.
4. If information for a field is not present in the document, return "-" as its value.
5. Construct the final JSON object, ensuring it strictly validates against the provided schema and contains no extra text or explanations.
6. Add a "__meta__" object with a "confidence" array where each item includes a "fieldId" and a "value" between 0 and 1 indicating your confidence in that field's value. Every field must appear exactly once in this array.`
}
