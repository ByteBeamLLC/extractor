// Shared types for extraction platform

import type { Database } from "@/lib/supabase/types"

// Re-export input-related types from schema for convenience
export type { InputDocument, InputField, InputFieldConstraints } from "@/lib/schema"

/**
 * Agent type for extraction - standard or pharma specialized
 */
export type AgentType = "standard" | "pharma"

/**
 * Database row types for Supabase operations
 */
export type SchemaRow = Database["public"]["Tables"]["schemas"]["Row"]
export type ExtractionJobRow = Database["public"]["Tables"]["extraction_jobs"]["Row"]

/**
 * Sync state tracking for schema persistence
 */
export type SchemaSyncInfo = {
  status: 'idle' | 'saving' | 'error'
  updatedAt?: Date
  error?: string
}

/**
 * Options for committing schema updates
 */
export type CommitSchemaOptions = {
  persistSchema?: boolean
  includeJobs?: boolean
}

