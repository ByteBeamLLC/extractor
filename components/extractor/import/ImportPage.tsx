"use client"

import { useState } from "react"
import Link from "next/link"
import {
  Mail,
  Copy,
  Check,
  Upload,
  Code,
  Webhook,
  Zap,
  Blocks,
  Workflow,
  ArrowRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import type { Parser } from "@/lib/extractor/types"
import { DocumentUploader } from "@/components/extractor/test/DocumentUploader"
import { TourStep } from "@/components/tour/TourStep"
import { SignUpGate } from "@/components/auth/SignUpGate"

interface ImportPageProps {
  parser: Parser
}

export function ImportPage({ parser }: ImportPageProps) {
  const [emailCopied, setEmailCopied] = useState(false)
  const [webhookCopied, setWebhookCopied] = useState(false)

  const baseUrl = typeof window !== "undefined" ? window.location.origin : ""
  const webhookUrl = parser.inbound_webhook_token
    ? `${baseUrl}/api/inbound/webhook/${parser.inbound_webhook_token}`
    : null

  const handleCopyEmail = async () => {
    if (!parser.inbound_email) return
    await navigator.clipboard.writeText(parser.inbound_email)
    setEmailCopied(true)
    setTimeout(() => setEmailCopied(false), 2000)
  }

  const handleCopyWebhook = async () => {
    if (!webhookUrl) return
    await navigator.clipboard.writeText(webhookUrl)
    setWebhookCopied(true)
    setTimeout(() => setWebhookCopied(false), 2000)
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-8">
      <div>
        <h1 className="text-xl font-bold">Import Documents</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Choose how to send documents to this parser for extraction.
        </p>
      </div>

      {/* Email Forwarding */}
      {parser.inbound_email && (
        <SignUpGate feature="Email Forwarding">
          <TourStep stepId="import" side="bottom" align="center">
            <div className="border rounded-xl p-6 bg-card space-y-4">
              <div className="flex items-center gap-2">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Mail className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h2 className="font-semibold">By Email</h2>
                  <p className="text-xs text-muted-foreground">
                    Forward emails with attachments to automatically extract data
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 p-4 bg-muted/50 rounded-lg">
                <code className="text-sm font-mono flex-1 font-semibold">
                  {parser.inbound_email}
                </code>
                <Button variant="outline" size="sm" onClick={handleCopyEmail}>
                  {emailCopied ? (
                    <Check className="h-4 w-4 text-green-500 mr-1.5" />
                  ) : (
                    <Copy className="h-4 w-4 mr-1.5" />
                  )}
                  {emailCopied ? "Copied" : "Copy address"}
                </Button>
              </div>

              <p className="text-xs text-muted-foreground">
                Set up automatic email forwarding from your inbox to process
                documents as they arrive. Attachments (PDF, images, Word, Excel)
                will be extracted automatically.
              </p>
            </div>
          </TourStep>
        </SignUpGate>
      )}

      {/* Direct Upload */}
      <div className="border rounded-xl p-6 bg-card space-y-4">
        <div className="flex items-center gap-2">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Upload className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="font-semibold">Direct Upload</h2>
            <p className="text-xs text-muted-foreground">
              Drag and drop files or click to browse
            </p>
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          You can upload documents from the{" "}
          <Link
            href={`/parsers/${parser.id}/documents`}
            className="text-primary underline"
          >
            Documents page
          </Link>
          , or drop files onto the sidebar upload widget from any page.
        </p>

        <Button variant="outline" asChild>
          <Link href={`/parsers/${parser.id}/documents`}>
            Go to Documents
            <ArrowRight className="h-4 w-4 ml-1.5" />
          </Link>
        </Button>
      </div>

      {/* API / Webhook */}
      {webhookUrl && (
        <SignUpGate feature="Webhooks">
        <div className="border rounded-xl p-6 bg-card space-y-4">
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Webhook className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="font-semibold">Inbound Webhook</h2>
              <p className="text-xs text-muted-foreground">
                Send documents via HTTP POST — no API key required
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <code className="flex-1 text-xs bg-muted p-2.5 rounded border font-mono break-all">
              POST {webhookUrl}
            </code>
            <Button variant="outline" size="icon" onClick={handleCopyWebhook}>
              {webhookCopied ? (
                <Check className="h-4 w-4 text-green-500" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
        </SignUpGate>
      )}

      {/* API */}
      <SignUpGate feature="REST API">
      <div className="border rounded-xl p-6 bg-card space-y-4">
        <div className="flex items-center gap-2">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Code className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="font-semibold">REST API</h2>
            <p className="text-xs text-muted-foreground">
              Submit documents programmatically with API keys
            </p>
          </div>
        </div>

        <Button variant="outline" asChild>
          <Link href={`/parsers/${parser.id}/api`}>
            Manage API Keys
            <ArrowRight className="h-4 w-4 ml-1.5" />
          </Link>
        </Button>
      </div>
      </SignUpGate>

      {/* Other Methods */}
      <SignUpGate feature="Integrations">
      <div className="border rounded-xl p-6 bg-card space-y-4">
        <h2 className="font-semibold">Other Import Methods</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Link href={`/parsers/${parser.id}/export`}>
            <div className="flex items-center gap-3 p-3 border rounded-lg hover:bg-accent/30 transition-colors">
              <Zap className="h-5 w-5 text-orange-500 shrink-0" />
              <div>
                <p className="text-sm font-medium">Zapier</p>
                <p className="text-xs text-muted-foreground">
                  Trigger from 5000+ apps
                </p>
              </div>
            </div>
          </Link>
          <Link href={`/parsers/${parser.id}/export`}>
            <div className="flex items-center gap-3 p-3 border rounded-lg hover:bg-accent/30 transition-colors">
              <Blocks className="h-5 w-5 text-purple-500 shrink-0" />
              <div>
                <p className="text-sm font-medium">Make</p>
                <p className="text-xs text-muted-foreground">
                  Automate workflows
                </p>
              </div>
            </div>
          </Link>
          <Link href={`/parsers/${parser.id}/export`}>
            <div className="flex items-center gap-3 p-3 border rounded-lg hover:bg-accent/30 transition-colors">
              <Workflow className="h-5 w-5 text-blue-500 shrink-0" />
              <div>
                <p className="text-sm font-medium">Power Automate</p>
                <p className="text-xs text-muted-foreground">
                  Microsoft flows
                </p>
              </div>
            </div>
          </Link>
        </div>
      </div>
      </SignUpGate>
    </div>
  )
}
