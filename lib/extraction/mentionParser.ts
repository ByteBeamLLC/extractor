/**
 * @ Mention Parser for Extraction Instructions
 * 
 * Parses @DocumentName references from extraction instructions
 * to determine which input documents should be used for extraction.
 */

import { InputField, SchemaField, getInputFields } from "@/lib/schema"

export interface MentionMatch {
  /** The full match including @ symbol */
  fullMatch: string
  /** The document name referenced (without @) */
  documentName: string
  /** Start index in the original string */
  startIndex: number
  /** End index in the original string */
  endIndex: number
}

export interface ParsedMentions {
  /** All mention matches found */
  mentions: MentionMatch[]
  /** Unique document names referenced */
  documentNames: string[]
  /** Whether any mentions were found */
  hasMentions: boolean
}

export interface ResolvedMentions {
  /** Input fields that were successfully resolved */
  resolvedInputs: InputField[]
  /** Document names that couldn't be resolved to input fields */
  unresolvedNames: string[]
  /** Whether all mentions were resolved */
  allResolved: boolean
}

/**
 * Regular expression to match @ mentions
 * Matches @"Document Name" (quoted) or @DocumentName (unquoted, alphanumeric + underscores)
 */
const MENTION_REGEX = /@"([^"]+)"|@([\w-]+)/g

/**
 * Parse @ mentions from extraction instructions text
 */
export function parseMentions(text: string): ParsedMentions {
  if (!text) {
    return {
      mentions: [],
      documentNames: [],
      hasMentions: false,
    }
  }

  const mentions: MentionMatch[] = []
  const seenNames = new Set<string>()

  let match: RegExpExecArray | null
  // Reset regex state
  MENTION_REGEX.lastIndex = 0

  while ((match = MENTION_REGEX.exec(text)) !== null) {
    // match[1] is quoted name, match[2] is unquoted name
    const documentName = match[1] || match[2]
    
    mentions.push({
      fullMatch: match[0],
      documentName,
      startIndex: match.index,
      endIndex: match.index + match[0].length,
    })
    
    seenNames.add(documentName)
  }

  return {
    mentions,
    documentNames: Array.from(seenNames),
    hasMentions: mentions.length > 0,
  }
}

/**
 * Resolve parsed mentions to actual input fields in the schema
 * @param parsedMentions - Result from parseMentions()
 * @param schemaFields - All fields in the schema
 * @returns Resolved input fields and any unresolved names
 */
export function resolveMentions(
  parsedMentions: ParsedMentions,
  schemaFields: SchemaField[]
): ResolvedMentions {
  const inputFields = getInputFields(schemaFields)
  const resolvedInputs: InputField[] = []
  const unresolvedNames: string[] = []

  for (const docName of parsedMentions.documentNames) {
    // Try to find input field by name (case-insensitive)
    const found = inputFields.find(
      (f) => f.name.toLowerCase() === docName.toLowerCase()
    )
    
    if (found) {
      resolvedInputs.push(found)
    } else {
      unresolvedNames.push(docName)
    }
  }

  return {
    resolvedInputs,
    unresolvedNames,
    allResolved: unresolvedNames.length === 0,
  }
}

/**
 * Extract and resolve @ mentions from extraction instructions
 * Convenience function that combines parsing and resolution
 */
export function extractDocumentReferences(
  extractionInstructions: string,
  schemaFields: SchemaField[]
): {
  parsed: ParsedMentions
  resolved: ResolvedMentions
  inputFieldIds: string[]
} {
  const parsed = parseMentions(extractionInstructions)
  const resolved = resolveMentions(parsed, schemaFields)
  
  return {
    parsed,
    resolved,
    inputFieldIds: resolved.resolvedInputs.map((f) => f.id),
  }
}

/**
 * Validate that extraction instructions reference at least one valid input document
 * @returns Error message if validation fails, null if valid
 */
export function validateMentions(
  extractionInstructions: string | undefined,
  schemaFields: SchemaField[],
  options: { requireAtLeastOne?: boolean } = {}
): string | null {
  const { requireAtLeastOne = false } = options
  const inputFields = getInputFields(schemaFields)
  
  // If no input fields defined in schema, mentions are not required
  if (inputFields.length === 0) {
    return null
  }
  
  if (!extractionInstructions) {
    if (requireAtLeastOne) {
      return "Extraction instructions must reference at least one input document using @DocumentName"
    }
    return null
  }

  const parsed = parseMentions(extractionInstructions)
  
  // If mentions are required and none found
  if (requireAtLeastOne && !parsed.hasMentions) {
    return "Extraction instructions must reference at least one input document using @DocumentName"
  }
  
  // If mentions are found, validate they resolve
  if (parsed.hasMentions) {
    const resolved = resolveMentions(parsed, schemaFields)
    
    if (!resolved.allResolved) {
      return `Unknown document reference(s): ${resolved.unresolvedNames.map(n => `@${n}`).join(", ")}`
    }
  }
  
  return null
}

/**
 * Get suggestions for @ mention autocomplete
 * @param inputFields - Available input fields to suggest
 * @param currentInput - Current text being typed after @
 * @returns Filtered list of input field names that match
 */
export function getMentionSuggestions(
  inputFields: InputField[],
  currentInput: string
): InputField[] {
  if (!currentInput) {
    return inputFields
  }
  
  const query = currentInput.toLowerCase()
  return inputFields.filter((f) => 
    f.name.toLowerCase().includes(query)
  )
}

/**
 * Format a document name for insertion as a mention
 * Quotes the name if it contains spaces
 */
export function formatMention(documentName: string): string {
  if (documentName.includes(" ")) {
    return `@"${documentName}"`
  }
  return `@${documentName}`
}

/**
 * Replace a partial mention with a completed one
 * Used by autocomplete to insert the selected suggestion
 */
export function completeMention(
  text: string,
  cursorPosition: number,
  selectedInput: InputField
): { newText: string; newCursorPosition: number } {
  // Find the @ symbol before cursor
  let atIndex = -1
  for (let i = cursorPosition - 1; i >= 0; i--) {
    if (text[i] === "@") {
      atIndex = i
      break
    }
    // Stop if we hit whitespace or another special char
    if (/\s/.test(text[i])) {
      break
    }
  }
  
  if (atIndex === -1) {
    // No @ found, just append
    const mention = formatMention(selectedInput.name)
    return {
      newText: text.slice(0, cursorPosition) + mention + text.slice(cursorPosition),
      newCursorPosition: cursorPosition + mention.length,
    }
  }
  
  // Replace from @ to cursor with the mention
  const mention = formatMention(selectedInput.name)
  const before = text.slice(0, atIndex)
  const after = text.slice(cursorPosition)
  
  return {
    newText: before + mention + " " + after,
    newCursorPosition: before.length + mention.length + 1,
  }
}

