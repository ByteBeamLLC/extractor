"use client"

import { useRef, useCallback } from "react"
import type { SchemaField, SchemaDefinition, ExtractionJob } from "@/lib/schema"
import { generateUuid } from "@/lib/extraction/schema-helpers"
import type { AgentType } from "@/lib/extraction/types"

export interface UseDocumentUploadOptions {
  activeSchemaId: string
  activeSchema: SchemaDefinition
  fields: SchemaField[]
  displayColumns: SchemaField[]
  selectedAgent: AgentType
  userId: string | undefined
  updateSchemaJobs: (
    schemaId: string,
    updater: ExtractionJob[] | ((prev: ExtractionJob[]) => ExtractionJob[]),
    options?: { persistSchema?: boolean; syncJobs?: boolean }
  ) => ExtractionJob[] | null
  setSelectedRowId: React.Dispatch<React.SetStateAction<string | null>>
}

export interface UseDocumentUploadReturn {
  fileInputRef: React.RefObject<HTMLInputElement | null>
  triggerFileUpload: () => void
  handleFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => Promise<void>
}

/**
 * Hook for handling document uploads and extraction
 */
export function useDocumentUpload(options: UseDocumentUploadOptions): UseDocumentUploadReturn {
  const {
    activeSchemaId,
    activeSchema,
    fields,
    displayColumns,
    selectedAgent,
    userId,
    updateSchemaJobs,
    setSelectedRowId,
  } = options

  const fileInputRef = useRef<HTMLInputElement | null>(null)

  // Trigger the hidden file input
  const triggerFileUpload = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  // Handle file selection and start extraction
  const handleFileUpload = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = event.target.files
      if (!files) return

      // Validate that schema has fields (except for special templates)
      if (
        fields.length === 0 &&
        activeSchema.templateId !== 'fnb-label-compliance' &&
        selectedAgent !== 'pharma'
      ) {
        alert("Please define at least one column before uploading files.")
        return
      }

      const fileArray = Array.from(files)
      if (fileArray.length === 0) return

      // Snapshot current state for extraction
      const targetSchemaId = activeSchemaId
      const agentSnapshot = selectedAgent

      // Create pending jobs for all files
      const jobsToCreate: ExtractionJob[] = fileArray.map((file) => ({
        id: generateUuid(),
        fileName: file.name,
        status: "pending" as ExtractionJob["status"],
        createdAt: new Date(),
        agentType: agentSnapshot,
        review: {},
        ocrMarkdown: null,
        ocrAnnotatedImageUrl: null,
        originalFileUrl: null,
      }))

      if (jobsToCreate.length > 0) {
        updateSchemaJobs(targetSchemaId, (prev) => [...prev, ...jobsToCreate])
        setSelectedRowId(jobsToCreate[jobsToCreate.length - 1].id)
      }

      // Clear the file input for future uploads
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }

      // Note: The actual extraction processing is handled separately in the main component
      // This hook just handles the upload UI and job creation
      // The extraction logic involves complex transformations and API calls
      // that are better kept in the main component for now
    },
    [
      activeSchemaId,
      activeSchema.templateId,
      fields.length,
      selectedAgent,
      updateSchemaJobs,
      setSelectedRowId,
    ]
  )

  return {
    fileInputRef,
    triggerFileUpload,
    handleFileUpload,
  }
}

