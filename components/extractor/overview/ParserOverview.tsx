"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { formatDistanceToNow } from "date-fns"
import {
  FileText,
  ListChecks,
  ScanText,
  Plug,
  Upload,
  Copy,
  Check,
  Mail,
  ArrowRight,
  HelpCircle,
  Lock,
  Sparkles,
  CheckCircle2,
  Code,
  Settings,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useSession, useSupabaseClient } from "@/lib/supabase/hooks"
import { useAuthDialog } from "@/components/auth/AuthDialogContext"
import type { Parser, ProcessedDocument } from "@/lib/extractor/types"
import { ParserOnboarding } from "@/components/extractor/onboarding/ParserOnboarding"
import { TourStep } from "@/components/tour/TourStep"
import { useTour } from "@/components/tour/TourProvider"
import {
  ACCEPTED_EXTENSIONS,
  validateUploadFile,
} from "@/components/extractor/test/DocumentUploader"
import { cn } from "@/lib/utils"

interface ParserOverviewProps {
  parser: Parser
  onUpdate: (updates: Partial<Parser>) => Promise<void>
}

export function ParserOverview({ parser, onUpdate }: ParserOverviewProps) {
  const session = useSession()
  const supabase = useSupabaseClient()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { openAuthDialog } = useAuthDialog()
  const showOnboarding = searchParams.get("onboarding") === "true"

  const [recentDocs, setRecentDocs] = useState<ProcessedDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [integrationCount, setIntegrationCount] = useState(0)

  // Drop zone
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Onboarding (legacy banner for template parsers)
  const [onboardingVisible, setOnboardingVisible] = useState(showOnboarding)
  const [onboardingStep, setOnboardingStep] = useState(0)

  // Product tour
  const { startTour, hasCompletedTour, isActive: tourActive } = useTour()
  const tourStartAttempted = useRef(false)

  useEffect(() => {
    async function load() {
      if (!session?.user?.id) return
      const [docsRes, intRes] = await Promise.all([
        supabase
          .from("parser_processed_documents")
          .select("*")
          .eq("parser_id", parser.id)
          .order("created_at", { ascending: false })
          .limit(5),
        supabase
          .from("parser_integrations")
          .select("id", { count: "exact" })
          .eq("parser_id", parser.id),
      ])
      setRecentDocs(docsRes.data ?? [])
      setIntegrationCount(intRes.count ?? 0)
      setLoading(false)
    }
    load()
  }, [parser.id, session?.user?.id, supabase])

  // Auto-start product tour for fresh parsers
  useEffect(() => {
    if (tourStartAttempted.current) return
    tourStartAttempted.current = true

    if (tourActive || hasCompletedTour()) return
    if (parser.extraction_type === "full_content") return
    if (parser.fields.length > 0 || parser.document_count > 0) return

    const timer = setTimeout(() => startTour(), 400)
    return () => clearTimeout(timer)
  }, [tourActive, hasCompletedTour, parser.fields.length, parser.document_count, startTour, parser.extraction_type])

  const handleCopyEmail = async () => {
    if (!parser.inbound_email) return
    await navigator.clipboard.writeText(parser.inbound_email)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDismissOnboarding = () => {
    setOnboardingVisible(false)
    const url = new URL(window.location.href)
    url.searchParams.delete("onboarding")
    window.history.replaceState({}, "", url.toString())
  }

  // --- File upload ---
  const handleFile = useCallback(
    async (file: File) => {
      const validationError = validateUploadFile(file)
      if (validationError) return

      setIsUploading(true)
      try {
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_")
        const storagePath = `${session?.user?.id}/${parser.id}/pending/${crypto.randomUUID()}/${safeName}`

        const { error: storageError } = await supabase.storage
          .from("parser-documents")
          .upload(storagePath, file, {
            contentType: file.type || "application/octet-stream",
            upsert: true,
          })
        if (storageError) throw new Error(`Upload failed: ${storageError.message}`)

        const res = await fetch(`/api/parsers/${parser.id}/extract`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            storage_path: storagePath,
            file_name: file.name,
            file_type: file.type,
            file_size: file.size,
            source_type: "upload",
          }),
        })

        if (!res.ok) {
          if (res.status === 402 && session?.user?.is_anonymous) {
            openAuthDialog("sign-up")
            return
          }
        }

        router.push(`/parsers/${parser.id}/documents`)
      } catch {
        // errors handled silently — user navigates to documents page
      } finally {
        setIsUploading(false)
      }
    },
    [parser.id, session?.user?.id, session?.user?.is_anonymous, supabase, router, openAuthDialog]
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      const file = e.dataTransfer.files?.[0]
      if (file) handleFile(file)
    },
    [handleFile]
  )

  const fieldCount = parser.fields?.length ?? 0
  const isFullContent = parser.extraction_type === "full_content"

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Onboarding */}
      {onboardingVisible && (
        <ParserOnboarding
          currentStep={onboardingStep}
          parserId={parser.id}
          onStepClick={(i) => setOnboardingStep(i)}
          onDismiss={handleDismissOnboarding}
        />
      )}

      {/* Header */}
      <h1 className="text-2xl font-bold">{parser.name}</h1>

      {/* Top row: Upload zone + Email forwarding */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Upload drop zone */}
        <div
          onDrop={handleDrop}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
          onDragLeave={() => setIsDragging(false)}
          onClick={() => !isUploading && fileInputRef.current?.click()}
          className={cn(
            "border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center",
            isDragging
              ? "border-[#2782ff] bg-[#2782ff]/5"
              : "border-gray-300 hover:border-[#2782ff]/50 hover:bg-[#2782ff]/[0.02]",
            isUploading && "pointer-events-none opacity-60"
          )}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPTED_EXTENSIONS}
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) handleFile(file)
            }}
            className="hidden"
          />
          <div className="mx-auto w-12 h-12 rounded-full bg-[#2782ff]/10 flex items-center justify-center mb-4">
            <Upload className="h-5 w-5 text-[#2782ff]" />
          </div>
          <h3 className="text-base font-semibold text-[#2782ff] mb-1">Upload a document</h3>
          <p className="text-sm text-muted-foreground mb-4">Drop a file or click to browse</p>
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              fileInputRef.current?.click()
            }}
          >
            Choose file
          </Button>
        </div>

        {/* Email forwarding */}
        {parser.inbound_email && (
          <div className="border rounded-xl p-6 bg-card flex flex-col items-center justify-center text-center">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                <Mail className="h-4 w-4 text-gray-500" />
              </div>
              <div className="text-left">
                <h3 className="text-base font-semibold">Email forwarding</h3>
                <p className="text-sm text-muted-foreground">Forward emails with attachments</p>
              </div>
            </div>

            <div className="w-full mt-4 p-3 border rounded-lg bg-muted/30">
              <code className="text-sm font-mono font-semibold block text-center text-[#2782ff]">
                {session?.user?.is_anonymous
                  ? `••••••••@${parser.inbound_email.split("@")[1]}`
                  : parser.inbound_email}
              </code>
            </div>

            {session?.user?.is_anonymous ? (
              <span className="text-xs text-muted-foreground flex items-center gap-1 mt-3">
                <Lock className="h-3 w-3" /> Sign up to reveal
              </span>
            ) : (
              <button
                onClick={handleCopyEmail}
                className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mt-3"
              >
                {copied ? (
                  <Check className="h-3.5 w-3.5 text-emerald-500" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
                {copied ? "Copied" : "Copy address"}
              </button>
            )}

            <p className="text-xs text-muted-foreground mt-4">
              Attachments (PDF, Word, images) are extracted automatically
            </p>
          </div>
        )}
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link href={`/parsers/${parser.id}/documents`} className="block">
          <div className="border rounded-xl p-4 bg-card hover:shadow-sm transition-shadow">
            <p className="text-sm text-muted-foreground mb-1">Total Documents</p>
            <p className="text-2xl font-bold">{parser.document_count}</p>
          </div>
        </Link>

        <Link href={`/parsers/${parser.id}/schema`} className="block">
          <div className="border rounded-xl p-4 bg-card hover:shadow-sm transition-shadow">
            <p className="text-sm text-muted-foreground mb-1">Extraction Mode</p>
            <div className="flex items-center gap-2">
              {isFullContent ? (
                <>
                  <ScanText className="h-4 w-4 text-muted-foreground" />
                  <p className="text-base font-semibold">Full Content</p>
                </>
              ) : (
                <>
                  <ListChecks className="h-4 w-4 text-muted-foreground" />
                  <p className="text-base font-semibold">Specific Fields</p>
                </>
              )}
            </div>
          </div>
        </Link>

        <Link href={`/parsers/${parser.id}/export`} className="block">
          <div className="border rounded-xl p-4 bg-card hover:shadow-sm transition-shadow">
            <p className="text-sm text-muted-foreground mb-1">Integrations</p>
            <p className="text-base font-semibold">
              {integrationCount === 0 ? "None configured" : `${integrationCount} active`}
            </p>
          </div>
        </Link>
      </div>

      {/* Recent Documents */}
      {recentDocs.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold">Recent Documents</h2>
            <Link
              href={`/parsers/${parser.id}/documents`}
              className="text-sm text-muted-foreground hover:text-[#2782ff] transition-colors"
            >
              View all
            </Link>
          </div>
          <div className="border rounded-xl divide-y">
            {recentDocs.map((doc) => (
              <Link
                key={doc.id}
                href={`/parsers/${parser.id}/documents/${doc.id}`}
                className="flex items-center justify-between px-4 py-3 hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="text-sm truncate">{doc.file_name}</span>
                </div>
                <div className="flex items-center gap-3 shrink-0 ml-4">
                  {doc.page_count > 0 && (
                    <span className="text-xs text-muted-foreground">
                      {doc.page_count}pg
                    </span>
                  )}
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-[11px]",
                      doc.status === "completed"
                        ? "text-emerald-600 border-emerald-200 bg-emerald-50"
                        : doc.status === "error"
                          ? "text-red-600 border-red-200 bg-red-50"
                          : doc.status === "processing"
                            ? "text-blue-600 border-blue-200 bg-blue-50"
                            : "text-amber-600 border-amber-200 bg-amber-50"
                    )}
                  >
                    {doc.status === "completed" && <CheckCircle2 className="h-3 w-3 mr-1" />}
                    {doc.status === "completed" ? "Done" : doc.status}
                  </Badge>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {doc.processed_at
                      ? formatDistanceToNow(new Date(doc.processed_at), { addSuffix: true })
                      : "Pending"}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
