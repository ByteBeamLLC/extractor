"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { InputField, InputDocument } from "@/lib/schema"
import { Upload, FileText, X, CheckCircle } from "lucide-react"
import { cn } from "@/lib/utils"

interface MultiDocumentUploadProps {
  inputFields: InputField[]
  open: boolean
  onOpenChange: (open: boolean) => void
  onUpload: (documents: Record<string, { file: File; inputField: InputField }>) => void
}

export function MultiDocumentUpload({
  inputFields,
  open,
  onOpenChange,
  onUpload,
}: MultiDocumentUploadProps) {
  const [selectedFiles, setSelectedFiles] = React.useState<Record<string, File>>({})
  const fileInputRefs = React.useRef<Record<string, HTMLInputElement | null>>({})

  // Reset on close
  React.useEffect(() => {
    if (!open) {
      setSelectedFiles({})
    }
  }, [open])

  const handleFileSelect = (inputFieldId: string, file: File | null) => {
    setSelectedFiles((prev) => {
      if (file) {
        return { ...prev, [inputFieldId]: file }
      }
      const { [inputFieldId]: _, ...rest } = prev
      return rest
    })
  }

  const handleSubmit = () => {
    const documents: Record<string, { file: File; inputField: InputField }> = {}
    
    for (const inputField of inputFields) {
      const file = selectedFiles[inputField.id]
      if (file) {
        documents[inputField.id] = { file, inputField }
      }
    }

    // Check required fields
    const missingRequired = inputFields.filter(
      (f) => f.required && !selectedFiles[f.id]
    )
    
    if (missingRequired.length > 0) {
      alert(`Please upload files for required inputs: ${missingRequired.map(f => f.name).join(", ")}`)
      return
    }

    onUpload(documents)
    onOpenChange(false)
  }

  const hasAnyFile = Object.keys(selectedFiles).length > 0
  const allRequiredFilled = inputFields
    .filter((f) => f.required)
    .every((f) => selectedFiles[f.id])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload Documents
          </DialogTitle>
          <DialogDescription>
            Upload files for each input document slot defined in your schema.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {inputFields.map((inputField) => {
            const selectedFile = selectedFiles[inputField.id]
            const allowedTypes = inputField.fileConstraints?.allowedTypes || []
            const acceptAttr = allowedTypes.length > 0 && !allowedTypes.includes('any')
              ? allowedTypes.map((t) => {
                  if (t === 'pdf') return '.pdf'
                  if (t === 'image') return 'image/*'
                  if (t === 'doc') return '.doc,.docx'
                  return `.${t}`
                }).join(',')
              : undefined

            return (
              <div
                key={inputField.id}
                className={cn(
                  "rounded-lg border-2 border-dashed p-4 transition-colors",
                  selectedFile
                    ? "border-green-300 bg-green-50"
                    : "border-slate-200 hover:border-amber-300 hover:bg-amber-50/30"
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <Label className="flex items-center gap-2 text-sm font-semibold">
                      <Upload className="h-4 w-4 text-amber-600" />
                      {inputField.name}
                      {inputField.required && (
                        <span className="text-red-500">*</span>
                      )}
                    </Label>
                    {inputField.description && (
                      <p className="mt-1 text-xs text-slate-500 line-clamp-2">
                        {inputField.description}
                      </p>
                    )}
                    {allowedTypes.length > 0 && !allowedTypes.includes('any') && (
                      <p className="mt-1 text-xs text-slate-400">
                        Accepts: {allowedTypes.join(", ").toUpperCase()}
                      </p>
                    )}
                  </div>

                  <input
                    type="file"
                    ref={(el) => { fileInputRefs.current[inputField.id] = el }}
                    accept={acceptAttr}
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      handleFileSelect(inputField.id, file || null)
                    }}
                  />

                  {selectedFile ? (
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1.5 rounded-full bg-green-100 px-2 py-1 text-xs text-green-700">
                        <CheckCircle className="h-3 w-3" />
                        <span className="max-w-[120px] truncate">{selectedFile.name}</span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-slate-400 hover:text-red-500"
                        onClick={() => handleFileSelect(inputField.id, null)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRefs.current[inputField.id]?.click()}
                    >
                      <FileText className="mr-1.5 h-4 w-4" />
                      Select File
                    </Button>
                  )}
                </div>
              </div>
            )
          })}

          {inputFields.length === 0 && (
            <div className="rounded-lg bg-slate-50 p-6 text-center text-sm text-slate-500">
              No input fields defined in this schema.
              <br />
              Add input fields to enable multi-document workflows.
            </div>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={!hasAnyFile || !allRequiredFilled}
          >
            Start Extraction
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

