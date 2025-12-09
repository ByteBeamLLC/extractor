"use client"

import React from 'react'
import { FileText, ZoomIn, ZoomOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface MCSourcePanelProps {
    imageUrl?: string | null
    fileName: string
    textContent?: string | null
}

export function MCSourcePanel({ imageUrl, fileName, textContent }: MCSourcePanelProps) {
    const [zoom, setZoom] = React.useState(1)

    const isPdf = fileName.toLowerCase().endsWith('.pdf')
    const isImage = /\.(jpg|jpeg|png|gif|webp|bmp)$/i.test(fileName)
    const hasText = typeof textContent === 'string' && textContent.trim().length > 0

    if (!imageUrl && hasText) {
        return (
            <div className="rounded border bg-white p-3 text-sm text-slate-700 max-h-64 overflow-auto whitespace-pre-wrap">
                {textContent}
            </div>
        )
    }

    if (!imageUrl) {
        return (
            <div className="flex flex-col items-center justify-center h-48 text-muted-foreground bg-slate-50 rounded">
                <FileText className="h-10 w-10 opacity-20 mb-2" />
                <p className="text-xs">No preview available</p>
            </div>
        )
    }

    if (isPdf) {
        return (
            <div className="relative">
                <iframe
                    src={imageUrl}
                    className="w-full h-64 rounded border bg-white"
                    title="PDF Preview"
                />
                <a
                    href={imageUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="absolute bottom-2 right-2 text-xs text-primary hover:underline bg-white/90 px-2 py-1 rounded shadow-sm"
                >
                    Open PDF
                </a>
            </div>
        )
    }

    return (
        <div className="relative group">
            {/* Image Container */}
            <div className="overflow-hidden rounded bg-slate-100 flex items-center justify-center min-h-[200px] max-h-[400px]">
                <img
                    src={imageUrl}
                    alt={fileName}
                    className="max-w-full h-auto object-contain transition-transform duration-200"
                    style={{ transform: `scale(${zoom})` }}
                />
            </div>

            {/* Zoom Controls */}
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-white/90 rounded-full shadow px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6"
                    onClick={(e) => {
                        e.stopPropagation()
                        setZoom(z => Math.max(0.5, z - 0.25))
                    }}
                >
                    <ZoomOut className="h-3 w-3" />
                </Button>
                <span className="text-xs text-slate-600 w-10 text-center">
                    {Math.round(zoom * 100)}%
                </span>
                <Button
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6"
                    onClick={(e) => {
                        e.stopPropagation()
                        setZoom(z => Math.min(3, z + 0.25))
                    }}
                >
                    <ZoomIn className="h-3 w-3" />
                </Button>
                <span className="text-xs text-slate-400 border-l pl-2 ml-1">Fit</span>
                <span className="text-xs text-slate-600">+</span>
            </div>
        </div>
    )
}
