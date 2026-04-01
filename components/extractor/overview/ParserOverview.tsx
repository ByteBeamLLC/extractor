"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
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
  BarChart3,
  HelpCircle,
  Settings2,
  Lock,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useSession, useSupabaseClient } from "@/lib/supabase/hooks"
import type { Parser, ProcessedDocument } from "@/lib/extractor/types"
import { ParserOnboarding } from "@/components/extractor/onboarding/ParserOnboarding"
import { TourStep } from "@/components/tour/TourStep"
import { useTour } from "@/components/tour/TourProvider"

interface ParserOverviewProps {
  parser: Parser
  onUpdate: (updates: Partial<Parser>) => Promise<void>
}

export function ParserOverview({ parser, onUpdate }: ParserOverviewProps) {
  const session = useSession()
  const supabase = useSupabaseClient()
  const searchParams = useSearchParams()
  const showOnboarding = searchParams.get("onboarding") === "true"

  const [recentDocs, setRecentDocs] = useState<ProcessedDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [integrationCount, setIntegrationCount] = useState(0)

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

  // Auto-start product tour for fresh parsers (first-time users)
  useEffect(() => {
    if (tourStartAttempted.current) return
    tourStartAttempted.current = true

    if (tourActive || hasCompletedTour()) return
    // Fresh parser: no fields and no documents (skip for full_content — 0 fields is intentional)
    if (parser.extraction_type === "full_content") return
    if (parser.fields.length > 0 || parser.document_count > 0) return

    const timer = setTimeout(() => startTour(), 400)
    return () => clearTimeout(timer)
  }, [tourActive, hasCompletedTour, parser.fields.length, parser.document_count, startTour])

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

  const fieldCount = parser.fields?.length ?? 0
  const isFullContent = parser.extraction_type === "full_content"

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Onboarding */}
      {onboardingVisible && (
        <ParserOnboarding
          currentStep={onboardingStep}
          parserId={parser.id}
          onStepClick={(i) => setOnboardingStep(i)}
          onDismiss={handleDismissOnboarding}
        />
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Link href={`/parsers/${parser.id}/documents`} className="block">
          <div className="border rounded-xl p-4 bg-card hover:shadow-sm transition-shadow">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <FileText className="h-4 w-4" />
              <span className="text-xs font-medium">Documents</span>
            </div>
            <p className="text-2xl font-bold">{parser.document_count}</p>
          </div>
        </Link>

        <Link href={`/parsers/${parser.id}/schema`} className="block">
          <div className="border rounded-xl p-4 bg-card hover:shadow-sm transition-shadow">
            {isFullContent ? (
              <>
                <div className="flex items-center gap-2 text-muted-foreground mb-2">
                  <ScanText className="h-4 w-4" />
                  <span className="text-xs font-medium">Mode</span>
                </div>
                <p className="text-sm font-bold">Full Content</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Extracts everything
                </p>
              </>
            ) : (
              <>
                <div className="flex items-center gap-2 text-muted-foreground mb-2">
                  <ListChecks className="h-4 w-4" />
                  <span className="text-xs font-medium">Fields</span>
                </div>
                <p className="text-2xl font-bold">{fieldCount}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {fieldCount === 0 ? "Not configured" : "Configured"}
                </p>
              </>
            )}
          </div>
        </Link>

        <Link href={`/parsers/${parser.id}/export`} className="block">
          <div className="border rounded-xl p-4 bg-card hover:shadow-sm transition-shadow">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <Plug className="h-4 w-4" />
              <span className="text-xs font-medium">Integrations</span>
            </div>
            <p className="text-2xl font-bold">{integrationCount}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {integrationCount === 0 ? "None active" : "Active"}
            </p>
          </div>
        </Link>

        <div className="border rounded-xl p-4 bg-card">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <BarChart3 className="h-4 w-4" />
            <span className="text-xs font-medium">Status</span>
          </div>
          <Badge
            variant={parser.status === "active" ? "default" : "secondary"}
            className="text-sm"
          >
            {parser.status}
          </Badge>
          {parser.last_processed_at && (
            <p className="text-xs text-muted-foreground mt-2">
              Last active{" "}
              {formatDistanceToNow(new Date(parser.last_processed_at), {
                addSuffix: true,
              })}
            </p>
          )}
        </div>
      </div>

      {/* Email Forwarding */}
      {parser.inbound_email && (
        <div className="border rounded-xl p-5 bg-card">
          <div className="flex items-center gap-2 mb-2">
            <Mail className="h-4 w-4 text-primary" />
            <h3 className="font-semibold text-sm">Email Forwarding</h3>
          </div>
          <p className="text-sm text-muted-foreground mb-3">
            Forward emails to this address to automatically extract data from
            attachments.
          </p>
          <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
            <code className="text-sm font-mono flex-1 truncate">
              {session?.user?.is_anonymous
                ? `••••••••@${parser.inbound_email.split("@")[1]}`
                : parser.inbound_email}
            </code>
            {session?.user?.is_anonymous ? (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Lock className="h-3 w-3" /> Sign up to reveal
              </span>
            ) : (
              <Button variant="ghost" size="sm" onClick={handleCopyEmail}>
                {copied ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
                <span className="ml-1.5">{copied ? "Copied" : "Copy"}</span>
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <TourStep stepId="overview" side="bottom" align="center">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Link href={`/parsers/${parser.id}/documents`}>
            <div className="border rounded-xl p-4 bg-card hover:border-primary/50 hover:shadow-sm transition-all flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Upload className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">Upload Document</p>
                <p className="text-xs text-muted-foreground">
                  Test extraction with a file
                </p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
            </div>
          </Link>

          <Link href={`/parsers/${parser.id}/schema`}>
            <div className="border rounded-xl p-4 bg-card hover:border-primary/50 hover:shadow-sm transition-all flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                {isFullContent ? (
                  <Settings2 className="h-5 w-5 text-primary" />
                ) : (
                  <ListChecks className="h-5 w-5 text-primary" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">
                  {isFullContent ? "Instructions" : "Edit Schema"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {isFullContent
                    ? "Guide the AI extraction"
                    : "Define extraction fields"}
                </p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
            </div>
          </Link>

          <Link href={`/parsers/${parser.id}/export`}>
            <div className="border rounded-xl p-4 bg-card hover:border-primary/50 hover:shadow-sm transition-all flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Plug className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">Add Integration</p>
                <p className="text-xs text-muted-foreground">
                  Connect to external tools
                </p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
            </div>
          </Link>
        </div>
      </TourStep>

      {/* Retake tour link */}
      {!tourActive && hasCompletedTour() && (
        <button
          onClick={startTour}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
        >
          <HelpCircle className="h-3.5 w-3.5" />
          Take a tour
        </button>
      )}

      {/* Recent Documents */}
      {recentDocs.length > 0 && (
        <div className="border rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b bg-muted/30">
            <h3 className="font-semibold text-sm">Recent Documents</h3>
            <Button variant="ghost" size="sm" asChild>
              <Link href={`/parsers/${parser.id}/documents`}>
                View All <ArrowRight className="h-3.5 w-3.5 ml-1" />
              </Link>
            </Button>
          </div>
          <div className="divide-y">
            {recentDocs.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center justify-between px-5 py-3"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="text-sm truncate">{doc.file_name}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Badge
                    variant="outline"
                    className={`text-xs ${
                      doc.status === "completed"
                        ? "text-green-600"
                        : doc.status === "error"
                          ? "text-red-600"
                          : doc.status === "processing"
                            ? "text-blue-600"
                            : "text-amber-600"
                    }`}
                  >
                    {doc.status}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {doc.processed_at
                      ? formatDistanceToNow(new Date(doc.processed_at), {
                          addSuffix: true,
                        })
                      : "Pending"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
