"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import {
  Loader2,
  FileText,
  AlertCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useSession, useSupabaseClient } from "@/lib/supabase/hooks"
import { useAuthDialog } from "@/components/auth/AuthDialogContext"
import { useTour } from "@/components/tour/TourProvider"
import { DocumentUploader } from "@/components/extractor/test/DocumentUploader"
import { useSidebar } from "@/components/ui/sidebar"
import { trackEvent } from "@/lib/analytics"

type OnboardingState = "idle" | "uploading" | "processing" | "error"

interface FirstDocumentUploadProps {
  onParserCreated: () => void
}

export function FirstDocumentUpload({ onParserCreated }: FirstDocumentUploadProps) {
  const session = useSession()
  const supabase = useSupabaseClient()
  const router = useRouter()
  const { openAuthDialog } = useAuthDialog()
  const { skipTour } = useTour()
  const { setOpen: setSidebarOpen } = useSidebar()

  // Force sidebar open for the onboarding experience
  useEffect(() => {
    setSidebarOpen(true)
  }, [setSidebarOpen])

  const [state, setState] = useState<OnboardingState>("idle")
  const [error, setError] = useState<string | null>(null)
  const [fileName, setFileName] = useState<string | null>(null)
  const [parserId, setParserId] = useState<string | null>(null)
  const [documentId, setDocumentId] = useState<string | null>(null)

  // Prevent double-fire from Realtime + polling resolving simultaneously
  const resolvedRef = useRef(false)

  // Track processing sub-states for the heading text
  const [processingPhase, setProcessingPhase] = useState<"identifying" | "extracting">("identifying")
  const phaseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Cycle through processing phases for visual feedback
  useEffect(() => {
    if (state !== "processing") return
    setProcessingPhase("identifying")
    phaseTimerRef.current = setTimeout(() => {
      setProcessingPhase("extracting")
    }, 3000)
    return () => {
      if (phaseTimerRef.current) clearTimeout(phaseTimerRef.current)
    }
  }, [state])

  // On completion: fire analytics + navigate directly to results
  const handleCompleted = useCallback(() => {
    if (resolvedRef.current) return
    resolvedRef.current = true

    // Client-side first_value event (GTM/GA4/Google Ads conversion tracking)
    trackEvent("first_value", {
      user_id: session?.user?.id ?? "",
      parser_id: parserId ?? "",
      document_id: documentId ?? "",
      source_type: "upload",
      is_first_extraction: true,
    })

    skipTour()
    onParserCreated()
    // Navigate directly to the document results
    if (parserId && documentId) {
      router.push(`/parsers/${parserId}/documents/${documentId}`)
    } else if (parserId) {
      router.push(`/parsers/${parserId}/documents`)
    }
  }, [parserId, documentId, router, skipTour, onParserCreated, session?.user?.id])

  const handleError = useCallback((message: string) => {
    if (resolvedRef.current) return
    resolvedRef.current = true
    setState("error")
    setError(message)
  }, [])

  // Realtime subscription for document status
  useEffect(() => {
    if (!parserId || state !== "processing") return

    const channel = supabase
      .channel(`onboarding-doc-${parserId}`)
      .on(
        "postgres_changes" as any,
        {
          event: "UPDATE",
          schema: "public",
          table: "parser_processed_documents",
          filter: `parser_id=eq.${parserId}`,
        },
        (payload: any) => {
          const updated = payload.new
          if (updated.status === "completed") {
            handleCompleted()
          } else if (updated.status === "error") {
            handleError(updated.error_message || "Extraction failed. Please try again.")
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [parserId, state, supabase, handleCompleted, handleError])

  // Fallback polling in case Realtime misses the update
  useEffect(() => {
    if (!parserId || !documentId || state !== "processing") return

    const interval = setInterval(async () => {
      const { data } = await supabase
        .from("parser_processed_documents" as any)
        .select("status, error_message")
        .eq("id", documentId)
        .single()

      const doc = data as any
      if (doc?.status === "completed") {
        handleCompleted()
      } else if (doc?.status === "error") {
        handleError(doc.error_message || "Extraction failed. Please try again.")
      }
    }, 5000)

    return () => clearInterval(interval)
  }, [parserId, documentId, state, supabase, handleCompleted, handleError])

  const handleFileSelected = useCallback(
    async (file: File) => {
      if (!session?.user?.id) {
        openAuthDialog("sign-in")
        return
      }

      setState("uploading")
      setError(null)
      setFileName(file.name)

      try {
        // Step 1: Create parser (lightweight, no extraction)
        const parserResponse = await fetch("/api/onboarding/first-document", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        })

        const parserData = await parserResponse.json()

        if (!parserResponse.ok) {
          if (parserResponse.status === 401) {
            openAuthDialog("sign-in")
            setState("idle")
            return
          }
          throw new Error(parserData.error ?? "Failed to create parser")
        }

        const newParserId = parserData.parser_id
        setParserId(newParserId)

        // Step 2: Send file to extract endpoint (gets its own full timeout budget)
        const INLINE_THRESHOLD = 3 * 1024 * 1024 // 3MB

        let extractBody: Record<string, any>

        if (file.size <= INLINE_THRESHOLD) {
          const arrayBuffer = await file.arrayBuffer()
          const base64 = btoa(
            new Uint8Array(arrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), "")
          )
          extractBody = {
            file: { name: file.name, type: file.type, data: base64, size: file.size },
          }
        } else {
          const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_")
          const storagePath = `${session.user.id}/onboarding/pending/${crypto.randomUUID()}/${safeName}`

          const { error: storageError } = await supabase.storage
            .from("parser-documents")
            .upload(storagePath, file, {
              contentType: file.type || "application/octet-stream",
              upsert: true,
            })

          if (storageError) {
            throw new Error(`Upload failed: ${storageError.message}`)
          }

          extractBody = {
            storage_path: storagePath,
            file_name: file.name,
            file_type: file.type,
            file_size: file.size,
          }
        }

        const extractResponse = await fetch(`/api/parsers/${newParserId}/extract`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(extractBody),
        })

        const extractData = await extractResponse.json()

        if (!extractResponse.ok) {
          if (extractResponse.status === 402 && session?.user?.is_anonymous) {
            openAuthDialog("sign-up")
            setState("idle")
            return
          }
          throw new Error(extractData.error ?? "Something went wrong")
        }

        setDocumentId(extractData.document_id)
        setState("processing")
      } catch (err) {
        setError(err instanceof Error ? err.message : "Upload failed")
        setState("error")
      }
    },
    [session?.user?.id, supabase, openAuthDialog]
  )

  const handleRetry = () => {
    resolvedRef.current = false
    setState("idle")
    setError(null)
    setFileName(null)
    setParserId(null)
    setDocumentId(null)
  }

  // --- IDLE STATE ---
  if (state === "idle" || state === "error") {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 text-center">
        <h1 className="text-2xl sm:text-3xl font-bold mb-2">
          Upload your first document
        </h1>
        <p className="text-base text-muted-foreground mb-10">
          We&apos;ll identify the fields automatically.
        </p>

        <DocumentUploader onFileSelected={handleFileSelected} />

        {/* Green annotation: arrow on top, text below */}
        <div className="mt-4 flex flex-col items-start select-none pointer-events-none">
          <img
            src="/arrow.png"
            alt=""
            className="h-24 w-auto ml-4"
            style={{
              filter: "invert(65%) sepia(74%) saturate(531%) hue-rotate(107deg) brightness(92%) contrast(89%)",
              transform: "rotate(30deg)",
            }}
          />
          <span className="text-2xl sm:text-3xl font-bold text-emerald-500 leading-tight text-left -mt-3">
            Drop your PDFs<br />and documents here!
          </span>
        </div>

        {/* Error message */}
        {state === "error" && error && (
          <div className="mt-20 flex items-center justify-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
            <Button variant="ghost" size="sm" onClick={handleRetry} className="ml-2">
              Try again
            </Button>
          </div>
        )}

        {/* Awaiting hint */}
        {state === "idle" && (
          <p className="mt-20 text-sm text-muted-foreground/60 flex items-center justify-center gap-2">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Awaiting first document...
          </p>
        )}
      </div>
    )
  }

  // --- UPLOADING STATE ---
  if (state === "uploading") {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 text-center">
        <h1 className="text-2xl sm:text-3xl font-bold mb-2">
          Uploading your document...
        </h1>
        <p className="text-base text-muted-foreground mb-10">
          Please wait while we upload your file.
        </p>

        <div className="py-12">
          <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto mb-4" />
          {fileName && (
            <p className="text-sm text-muted-foreground">{fileName}</p>
          )}
        </div>
      </div>
    )
  }

  // --- PROCESSING STATE ---
  return (
    <div className="max-w-2xl mx-auto px-4 py-12 text-center">
      <h1 className="text-2xl sm:text-3xl font-bold mb-2">
        {processingPhase === "identifying"
          ? "Document identification..."
          : "Document processing..."}
      </h1>
      <p className="text-base text-muted-foreground mb-10 flex items-center justify-center gap-2">
        <Loader2 className="h-4 w-4 animate-spin" />
        Please wait while we process your document(s)...
      </p>

      {/* Document row showing processing state */}
      <div className="border rounded-xl overflow-hidden text-left">
        <div className="grid grid-cols-[1fr_120px] gap-2 px-4 py-2.5 bg-muted/50 text-xs font-medium text-muted-foreground border-b">
          <span>NAME</span>
          <span>STATUS</span>
        </div>
        <div className="grid grid-cols-[1fr_120px] gap-2 px-4 py-3 items-center">
          <div className="flex items-center gap-2 min-w-0">
            <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="text-sm truncate">{fileName}</span>
          </div>
          <Badge variant="outline" className="text-xs text-blue-600 w-fit">
            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
            Processing...
          </Badge>
        </div>
      </div>
    </div>
  )
}
