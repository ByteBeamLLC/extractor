"use client"

import React, { useRef } from 'react'
import { Upload, FileText } from 'lucide-react'
import { cn } from '@/lib/utils'

interface MCUploadPanelProps {
    value?: string | null // URL or base64
    label?: string
    onChange?: (file: File) => void
}

export function MCUploadPanel({ value, label, onChange }: MCUploadPanelProps) {
    const inputRef = useRef<HTMLInputElement>(null)

    const handleClick = (e: React.MouseEvent) => {
        e.stopPropagation()
        inputRef.current?.click()
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file && onChange) {
            onChange(file)
        }
    }

    // Has uploaded image
    if (value && (value.startsWith('http') || value.startsWith('data:'))) {
        return (
            <div className="relative group">
                <img
                    src={value}
                    alt={label || 'Uploaded file'}
                    className="w-full h-48 object-contain rounded bg-slate-50"
                />
                <div
                    className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer rounded"
                    onClick={handleClick}
                >
                    <p className="text-white text-sm">Click to replace</p>
                </div>
                <input
                    ref={inputRef}
                    type="file"
                    className="hidden"
                    onChange={handleChange}
                    accept="image/*"
                />
            </div>
        )
    }

    // Empty state - upload prompt
    return (
        <div
            className={cn(
                "flex flex-col items-center justify-center h-32",
                "border-2 border-dashed border-slate-200 rounded-lg",
                "cursor-pointer hover:border-slate-300 hover:bg-slate-50 transition-colors"
            )}
            onClick={handleClick}
        >
            <FileText className="h-8 w-8 text-slate-300 mb-2" />
            <p className="text-sm text-slate-500">Click to select a file to upload</p>
            <input
                ref={inputRef}
                type="file"
                className="hidden"
                onChange={handleChange}
                accept="image/*"
            />
        </div>
    )
}
