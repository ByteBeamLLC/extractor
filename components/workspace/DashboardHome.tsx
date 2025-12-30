"use client"

import { useMemo, useState } from "react"
import { formatDistanceToNow } from "date-fns"
import { LayoutGrid, ListFilter, Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"

import type { AgentType, SchemaSummary } from "./types"
import { DocumentExtractionDashboard } from "@/components/document-extraction/DocumentExtractionDashboard"

const agentBadgeClass: Record<AgentType, string> = {
  standard: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-200",
  pharma: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200",
}

interface DashboardHomeProps {
  schemas: SchemaSummary[]
  isLoading?: boolean
  loadError?: string | null
  onRefresh?: () => void
  onOpenSchema: (schemaId: string) => void
  onCreateNew: () => void
}

export function DashboardHome({
  schemas,
  isLoading = false,
  loadError = null,
  onRefresh,
  onOpenSchema,
  onCreateNew,
}: DashboardHomeProps) {
  const [mode, setMode] = useState<"work-automation" | "document-extraction">("work-automation")
  const [searchQuery, setSearchQuery] = useState("")
  const [sortKey, setSortKey] = useState<"recent" | "name">("recent")

  const filtered = useMemo(() => {
    const normalized = searchQuery.trim().toLowerCase()
    const list = normalized.length
      ? schemas.filter((schema) => {
          const haystack = `${schema.tabTitle ?? schema.name} ${schema.templateDisplayName ?? ""} ${schema.templateId ?? ""}`.toLowerCase()
          return haystack.includes(normalized)
        })
      : schemas

    return [...list].sort((a, b) => {
      if (sortKey === "name") {
        return (a.tabTitle ?? a.name).localeCompare(b.tabTitle ?? b.name)
      }
      const aTime = a.lastModified?.getTime() ?? 0
      const bTime = b.lastModified?.getTime() ?? 0
      return bTime - aTime
    })
  }, [schemas, searchQuery, sortKey])

  // If document extraction mode, render that dashboard
  if (mode === "document-extraction") {
    return (
      <div className="flex h-full flex-col">
        <div className="flex flex-col gap-4 px-6 py-4 lg:px-10 border-b">
          <Tabs value={mode} onValueChange={(v) => setMode(v as typeof mode)}>
            <TabsList>
              <TabsTrigger value="work-automation">Work Automation</TabsTrigger>
              <TabsTrigger value="document-extraction">Document Extraction</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        <div className="flex-1 overflow-hidden">
          <DocumentExtractionDashboard />
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-col gap-4 px-6 py-4 lg:px-10 border-b">
        <Tabs value={mode} onValueChange={(v) => setMode(v as typeof mode)}>
          <TabsList>
            <TabsTrigger value="work-automation">Work Automation</TabsTrigger>
            <TabsTrigger value="document-extraction">Document Extraction</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      <div className="flex flex-col gap-6 px-6 py-8 lg:px-10">
        <section className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">Workspace</h1>
            <p className="text-sm text-muted-foreground">Browse your recent schemas or start from a template.</p>
          </div>
          {/* <Button className="gap-2 self-start md:self-auto" onClick={onCreateNew}>
            <Plus className="h-4 w-4" />
            New schema
          </Button> */}
        </section>

        <section className="flex flex-col gap-4 rounded-2xl border border-border bg-card/40 p-4 backdrop-blur-sm sm:flex-row sm:items-center sm:justify-between">
          <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Input
                placeholder="Search schemas…"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className="pr-10"
              />
              <ListFilter className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            </div>
            <Select value={sortKey} onValueChange={(value: typeof sortKey) => setSortKey(value)}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Recent</SelectItem>
                <SelectItem value="name">Name</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </section>

        <section className="flex flex-col gap-4">
          {isLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <LayoutGrid className="h-4 w-4 animate-pulse" />
              Loading schemas…
            </div>
          ) : null}
          {loadError ? (
            <div className="flex flex-wrap items-center gap-3 rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
              <span>Failed to load your schemas: {loadError}</span>
              {onRefresh ? (
                <Button variant="outline" size="sm" onClick={onRefresh}>
                  Retry
                </Button>
              ) : null}
            </div>
          ) : null}
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <LayoutGrid className="h-4 w-4" />
            <span>{filtered.length} {filtered.length === 1 ? "schema" : "schemas"}</span>
          </div>
          {filtered.length === 0 ? (
            <EmptyState onCreateNew={onCreateNew} />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filtered.map((schema) => (
                <SchemaCard
                  key={schema.id}
                  schema={schema}
                  onOpen={() => onOpenSchema(schema.id)}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

function SchemaCard({ schema, onOpen }: { schema: SchemaSummary; onOpen: () => void }) {
  const subtitle = schema.templateDisplayName
    ? schema.templateDisplayName
    : schema.templateId
      ? schema.templateId.replace(/[-_]/g, " ")
      : "Custom schema"
  const lastModified = schema.lastModified
    ? `Updated ${formatDistanceToNow(schema.lastModified, { addSuffix: true })}`
    : "No activity yet"

  return (
    <Card className="flex h-full flex-col overflow-hidden transition hover:shadow-md">
      <CardHeader className="space-y-2 p-4">
        <CardTitle className="line-clamp-2 text-base font-semibold">{schema.tabTitle ?? schema.name}</CardTitle>
        <p className="text-xs uppercase tracking-wide text-muted-foreground">{subtitle}</p>
      </CardHeader>
      {schema.thumbnailUrl ? (
        <div className="relative mx-4 aspect-[4/3] overflow-hidden rounded-xl bg-muted">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={schema.thumbnailUrl}
            alt=""
            className="size-full object-cover"
            loading="lazy"
          />
        </div>
      ) : (
        <div className="mx-4 flex aspect-[4/3] items-center justify-center rounded-xl border border-dashed border-muted">
          <LayoutGrid className="h-8 w-8 text-muted-foreground" />
        </div>
      )}
      <CardContent className="flex flex-1 flex-col justify-between p-4">
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          {schema.agentType ? (
            <Badge className={cn("font-medium", agentBadgeClass[schema.agentType])}>
              {schema.agentType === "pharma" ? "Pharma" : "Standard"}
            </Badge>
          ) : null}
          <span>{lastModified}</span>
        </div>
      </CardContent>
      <Separator />
      <CardFooter className="flex items-center justify-between p-4">
        <Button size="sm" className="w-full" onClick={onOpen}>
          Open
        </Button>
      </CardFooter>
    </Card>
  )
}

function EmptyState({ onCreateNew }: { onCreateNew: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-muted-foreground/40 bg-muted/40 p-12 text-center">
      <LayoutGrid className="mb-4 h-10 w-10 text-muted-foreground" />
      <h3 className="text-lg font-semibold">No schemas yet</h3>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        Start with a blank schema or pick from our templates to jump into extraction faster.
      </p>
      <Button className="mt-6" onClick={onCreateNew}>
        Create schema
      </Button>
    </div>
  )
}
