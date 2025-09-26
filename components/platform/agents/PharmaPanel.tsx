"use client"

import type { ReactNode } from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import type { ExtractionJob } from "@/lib/schema/types"
import { FileText } from "lucide-react"

interface PharmaPanelProps {
  jobs: ExtractionJob[]
  selectedJobId: string | null
  onSelectJob: (jobId: string) => void
  getStatusIcon: (status: ExtractionJob["status"]) => ReactNode
}

const SECTION_LABELS: Record<string, string> = {
  description: "Description",
  composition: "Composition",
  how_to_use: "How to Use",
  indication: "Indication",
  possible_side_effects: "Possible Side Effects",
  properties: "Properties",
  storage: "Storage",
  reasoning_trace: "Reasoning Trace",
}

export function PharmaPanel({ jobs, selectedJobId, onSelectJob, getStatusIcon }: PharmaPanelProps) {
  const job = jobs.find((j) => j.id === selectedJobId) || jobs[jobs.length - 1]

  if (!job) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>No results yet. Upload a product image to get started.</p>
      </div>
    )
  }

  const results = job.results || {}

  return (
    <div className="space-y-4 p-4">
      {jobs.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-muted-foreground">Jobs:</span>
          {jobs.map((row, index) => (
            <Button
              key={row.id}
              variant={selectedJobId === row.id ? "default" : "outline"}
              size="sm"
              onClick={() => onSelectJob(row.id)}
            >
              {index + 1}. {row.fileName}
            </Button>
          ))}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-[300px_1fr]">
        <Card>
          <CardContent className="space-y-2 p-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Identifiers</h3>
              {getStatusIcon(job.status)}
            </div>
            <InfoRow label="Drug Name" value={results.drug_name} />
            <InfoRow label="Variant" value={results.variant_name} />
            <InfoRow label="Manufacturer" value={results.manufacturer} />
            <InfoRow label="SFDA Drug ID" value={results.sfda_drug_id} />
            <InfoRow label="SFDA Listing URL" value={results.sfda_listing_url} isLink />
            <InfoArea label="Unique Identifiers" value={results.unique_identifiers} />
            <InfoArea label="Listing Diagnostics" value={results.listing_diagnostics} />
          </CardContent>
        </Card>

        <div className="space-y-4">
          {Object.entries(SECTION_LABELS).map(([key, label]) => (
            <Card key={key}>
              <CardContent className="p-4 space-y-2">
                <div className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">{label}</div>
                <div className="whitespace-pre-wrap text-sm text-foreground/90">
                  {String(results[key] ?? "-")}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}

interface InfoRowProps {
  label: string
  value: unknown
  isLink?: boolean
}

function InfoRow({ label, value, isLink }: InfoRowProps) {
  const display = value ? String(value) : "-"
  return (
    <div className="space-y-1 text-sm">
      <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</div>
      {isLink && display.startsWith("http") ? (
        <a href={display} target="_blank" rel="noopener noreferrer" className="text-primary underline break-all">
          {display}
        </a>
      ) : (
        <div className="text-foreground break-words">{display}</div>
      )}
    </div>
  )
}

interface InfoAreaProps {
  label: string
  value: unknown
}

function InfoArea({ label, value }: InfoAreaProps) {
  const display = value ? String(value) : "-"
  return (
    <div className="space-y-1 text-sm">
      <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="whitespace-pre-wrap break-words text-foreground/90 text-sm">{display}</div>
    </div>
  )
}
