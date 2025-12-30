"use client"

import { useState, useEffect } from "react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export type ExtractionMethod = 'dots.ocr' | 'datalab'

interface ExtractionMethodSelectorProps {
  value?: ExtractionMethod
  onChange?: (method: ExtractionMethod) => void
  className?: string
}

const EXTRACTION_METHODS = {
  'dots.ocr': {
    name: 'Model 1',
    description: 'Fast document layout detection',
    icon: '🔍',
  },
  'datalab': {
    name: 'Model 2',
    description: 'High-accuracy layout detection',
    icon: '🎯',
  },
} as const

const STORAGE_KEY = 'extraction-method-preference'

export function ExtractionMethodSelector({
  value,
  onChange,
  className = '',
}: ExtractionMethodSelectorProps) {
  const [method, setMethod] = useState<ExtractionMethod>(value || 'dots.ocr')

  // Load preference from localStorage on mount
  useEffect(() => {
    if (!value) {
      const saved = localStorage.getItem(STORAGE_KEY) as ExtractionMethod | null
      if (saved && (saved === 'dots.ocr' || saved === 'datalab')) {
        setMethod(saved)
        onChange?.(saved)
      }
    }
  }, [value, onChange])

  const handleChange = (newMethod: ExtractionMethod) => {
    setMethod(newMethod)
    localStorage.setItem(STORAGE_KEY, newMethod)
    onChange?.(newMethod)
  }

  const currentMethod = EXTRACTION_METHODS[method]

  return (
    <Select value={method} onValueChange={(v) => handleChange(v as ExtractionMethod)}>
      <SelectTrigger className={`h-10 ${className}`}>
        <SelectValue>
          <span className="flex items-center gap-2">
            <span>{currentMethod.icon}</span>
            <span>{currentMethod.name}</span>
          </span>
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {Object.entries(EXTRACTION_METHODS).map(([key, info]) => (
          <SelectItem key={key} value={key}>
            <div className="flex items-start gap-2">
              <span className="text-lg">{info.icon}</span>
              <div className="flex flex-col">
                <span className="font-medium">{info.name}</span>
                <span className="text-xs text-muted-foreground">{info.description}</span>
              </div>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

// Hook to get and set extraction method preference
export function useExtractionMethod() {
  const [method, setMethod] = useState<ExtractionMethod>('dots.ocr')

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as ExtractionMethod | null
    if (saved && (saved === 'dots.ocr' || saved === 'datalab')) {
      setMethod(saved)
    }
  }, [])

  const updateMethod = (newMethod: ExtractionMethod) => {
    setMethod(newMethod)
    localStorage.setItem(STORAGE_KEY, newMethod)
  }

  return [method, updateMethod] as const
}

