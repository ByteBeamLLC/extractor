"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { Check, X, Edit, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import type { SchemaSyncInfo } from "@/lib/extraction/types"

export interface SchemaHeaderProps {
  schemaName: string
  isEmbeddedInWorkspace: boolean
  syncStatus: SchemaSyncInfo['status']
  syncError: string | null | undefined
  onSchemaNameChange: (name: string) => void
  onRetrySync?: () => void
}

export function SchemaHeader({
  schemaName,
  isEmbeddedInWorkspace,
  syncStatus,
  syncError,
  onSchemaNameChange,
  onRetrySync,
}: SchemaHeaderProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [nameInput, setNameInput] = useState(schemaName)

  // Sync input with prop
  useEffect(() => {
    setNameInput(schemaName)
  }, [schemaName])

  const handleSave = () => {
    if (nameInput.trim()) {
      onSchemaNameChange(nameInput.trim())
    }
    setIsEditing(false)
  }

  const handleCancel = () => {
    setNameInput(schemaName)
    setIsEditing(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave()
    } else if (e.key === 'Escape') {
      handleCancel()
    }
  }

  if (isEmbeddedInWorkspace) {
    // Simplified header when embedded
    return null
  }

  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200/70 bg-white/80">
      <div className="flex items-center gap-3">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/">Projects</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              {isEditing ? (
                <div className="flex items-center gap-2">
                  <Input
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="h-7 w-48 text-sm"
                    autoFocus
                  />
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7"
                    onClick={handleSave}
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7"
                    onClick={handleCancel}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <BreadcrumbPage className="flex items-center gap-2">
                  <span>{schemaName}</span>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6"
                    onClick={() => setIsEditing(true)}
                  >
                    <Edit className="h-3 w-3" />
                  </Button>
                </BreadcrumbPage>
              )}
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      {/* Sync status indicator */}
      <div className="flex items-center gap-2">
        {syncStatus === 'saving' && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Loader2 className="h-3 w-3 animate-spin" />
            <span>Saving...</span>
          </div>
        )}
        {syncStatus === 'error' && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-destructive">{syncError || 'Sync failed'}</span>
            {onRetrySync && (
              <Button
                size="sm"
                variant="ghost"
                className="h-6 text-xs"
                onClick={onRetrySync}
              >
                Retry
              </Button>
            )}
          </div>
        )}
        {syncStatus === 'idle' && (
          <div className="flex items-center gap-1.5 text-xs text-green-600">
            <Check className="h-3 w-3" />
            <span>Saved</span>
          </div>
        )}
      </div>
    </div>
  )
}

