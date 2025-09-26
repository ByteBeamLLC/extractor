"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Download, Upload } from "lucide-react"

interface TemplateOption {
  id: string
  name: string
}

interface PlatformHeaderProps {
  schemaName: string
  editingSchemaName: boolean
  schemaNameInput: string
  onStartEditingName: () => void
  onChangeSchemaNameInput: (value: string) => void
  onCommitSchemaName: () => void
  onCancelSchemaName: () => void
  isSchemaFresh: boolean
  aiAgentOptions: TemplateOption[]
  templateOptions: TemplateOption[]
  onTemplateSelect: (templateId: string) => void
  isFnbAgent: boolean
  canPrintLabel: boolean
  onPrintLabel: () => void
  showExportButton: boolean
  onExportCsv: () => void
  uploadDisabled: boolean
  onUploadClick: () => void
  fileInputRef: React.RefObject<HTMLInputElement>
  onFileInputChange: React.ChangeEventHandler<HTMLInputElement>
  showFieldHint: boolean
}

export function PlatformHeader({
  schemaName,
  editingSchemaName,
  schemaNameInput,
  onStartEditingName,
  onChangeSchemaNameInput,
  onCommitSchemaName,
  onCancelSchemaName,
  isSchemaFresh,
  aiAgentOptions,
  templateOptions,
  onTemplateSelect,
  isFnbAgent,
  canPrintLabel,
  onPrintLabel,
  showExportButton,
  onExportCsv,
  uploadDisabled,
  onUploadClick,
  fileInputRef,
  onFileInputChange,
  showFieldHint,
}: PlatformHeaderProps) {
  return (
    <div className="bg-white border-b border-gray-200 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {!editingSchemaName ? (
            <button
              type="button"
              className="text-2xl font-bold text-foreground hover:underline text-left"
              onClick={onStartEditingName}
              title="Click to rename schema"
            >
              {schemaName || "Data Extraction Schema"}
            </button>
          ) : (
            <input
              value={schemaNameInput}
              onChange={(event) => onChangeSchemaNameInput(event.target.value)}
              autoFocus
              onBlur={onCommitSchemaName}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault()
                  onCommitSchemaName()
                } else if (event.key === "Escape") {
                  event.preventDefault()
                  onCancelSchemaName()
                }
              }}
              className="text-2xl font-bold text-foreground bg-transparent border-b border-border focus:outline-none focus:border-ring px-1"
            />
          )}
        </div>
        <div className="flex items-center gap-2">
          {isSchemaFresh && aiAgentOptions.length > 0 && (
            <Select onValueChange={(value) => onTemplateSelect(value)}>
              <SelectTrigger className="w-56">
                <SelectValue placeholder="Select AI Agent" />
              </SelectTrigger>
              <SelectContent>
                {aiAgentOptions.map((option) => (
                  <SelectItem key={option.id} value={option.id}>
                    {option.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {isSchemaFresh && templateOptions.length > 0 && (
            <Select onValueChange={(value) => onTemplateSelect(value)}>
              <SelectTrigger className="w-56">
                <SelectValue placeholder="Select a template" />
              </SelectTrigger>
              <SelectContent>
                {templateOptions.map((option) => (
                  <SelectItem key={option.id} value={option.id}>
                    {option.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {isFnbAgent ? (
            canPrintLabel ? (
              <Button size="sm" variant="outline" onClick={onPrintLabel} title="Print Localized Label">
                <Download className="h-4 w-4 mr-1" />
                Print Localized Label
              </Button>
            ) : null
          ) : (
            showExportButton && (
              <Button size="sm" variant="outline" onClick={onExportCsv} title="Export to CSV">
                <Download className="h-4 w-4 mr-1" />
                Export CSV
              </Button>
            )
          )}
          <Button
            size="sm"
            onClick={onUploadClick}
            disabled={uploadDisabled}
            title="Upload Documents"
            type="button"
          >
            <Upload className="h-4 w-4 mr-1" />
            Upload
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
            onChange={onFileInputChange}
            className="hidden"
          />
        </div>
      </div>
      {showFieldHint && (
        <div className="mt-4 p-3 bg-muted rounded-lg">
          <p className="text-sm text-muted-foreground">
            Start by defining your data extraction schema. Add columns for each piece of information you want to extract
            from your documents.
          </p>
        </div>
      )}
    </div>
  )
}
