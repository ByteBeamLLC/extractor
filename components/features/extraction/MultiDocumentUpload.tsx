"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { InputField } from "@/lib/schema"
import { Upload, FileText, X, CheckCircle } from "lucide-react"
import { cn } from "@/lib/utils"

export type MultiDocInput = { inputField: InputField; file?: File; text?: string }
export type MultiDocUploadMap = Record<string, MultiDocInput>

interface MultiDocumentUploadProps {
  inputFields: InputField[]
  open: boolean
  onOpenChange: (open: boolean) => void
  onUpload: (documents: MultiDocUploadMap) => void
}

export function MultiDocumentUpload({
  inputFields,
  open,
  onOpenChange,
  onUpload,
}: MultiDocumentUploadProps) {
  const [selectedValues, setSelectedValues] = React.useState<Record<string, { file?: File; text?: string }>>({})
  const fileInputRefs = React.useRef<Record<string, HTMLInputElement | null>>({})

  // Reset on close
  React.useEffect(() => {
    if (!open) {
      setSelectedValues({})
    }
  }, [open])

  const handleFileSelect = (inputFieldId: string, file: File | null) => {
    setSelectedValues((prev) => {
      const current = prev[inputFieldId] || {}
      if (file) {
        return { ...prev, [inputFieldId]: { ...current, file } }
      }
      const { [inputFieldId]: _, ...rest } = prev
      return rest
    })
  }

  const handleTextChange = (inputFieldId: string, text: string) => {
    setSelectedValues((prev) => {
      const current = prev[inputFieldId] || {}
      const next = { ...current, text }
      if (!next.text && !next.file) {
        const { [inputFieldId]: _, ...rest } = prev
        return rest
      }
      return { ...prev, [inputFieldId]: next }
    })
  }

  const handleSubmit = () => {
    const documents: MultiDocUploadMap = {}

    for (const inputField of inputFields) {
      const selection = selectedValues[inputField.id]
      if (selection?.file || (selection?.text && selection.text.trim().length > 0)) {
        documents[inputField.id] = { ...selection, inputField }
      }
    }

    const missingRequired = inputFields.filter((f) => {
      const selection = selectedValues[f.id]
      if (f.inputType === 'text') {
        return f.required && !(selection?.text && selection.text.trim().length > 0)
      }
      return f.required && !selection?.file
    })

    if (missingRequired.length > 0) {
      alert(`Please provide inputs for required fields: ${missingRequired.map(f => f.name).join(", ")}`)
      return
    }

    onUpload(documents)
    onOpenChange(false)
  }

  const hasAnyInput = Object.values(selectedValues).some(
    (value) => value.file || (value.text && value.text.trim().length > 0),
  )

  const allRequiredFilled = inputFields
    .filter((f) => f.required)
    .every((f) => {
      const selection = selectedValues[f.id]
      if (f.inputType === 'text') {
        return selection?.text && selection.text.trim().length > 0
      }
      return !!selection?.file
    })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Provide Inputs
          </DialogTitle>
          <DialogDescription>
            Supply files or text for each input defined in your schema.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4 overflow-y-auto flex-1 min-h-0">
          {inputFields.map((inputField) => {
            const selection = selectedValues[inputField.id]
            const selectedFile = selection?.file
            const selectedText = selection?.text ?? ""
            const isTextInput = inputField.inputType === 'text'
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
                  (isTextInput ? selectedText.trim().length > 0 : !!selectedFile)
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
                    {!isTextInput && allowedTypes.length > 0 && !allowedTypes.includes('any') && (
                      <p className="mt-1 text-xs text-slate-400">
                        Accepts: {allowedTypes.join(", ").toUpperCase()}
                      </p>
                    )}
                  </div>

                  {!isTextInput && (
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
                  )}

                  {!isTextInput && (
                    selectedFile ? (
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1.5 rounded-full bg-green-100 px-2 py-1 text-xs text-green-700">
                          <CheckCircle className="h-3 w-3" />
                          <span className="max-w-[140px] truncate">{selectedFile.name}</span>
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
                    )
                  )}
                </div>

                {isTextInput && (
                  <div className="mt-3">
                    <Textarea
                      value={selectedText}
                      onChange={(e) => handleTextChange(inputField.id, e.target.value)}
                      placeholder="Paste or type the text to use for this input"
                      rows={4}
                    />
                    {selectedText.trim().length > 0 && (
                      <div className="mt-1 flex justify-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() => handleTextChange(inputField.id, "")}
                        >
                          Clear
                        </Button>
                      </div>
                    )}
                  </div>
                )}
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
            disabled={!hasAnyInput || !allRequiredFilled}
          >
            Start Extraction
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
