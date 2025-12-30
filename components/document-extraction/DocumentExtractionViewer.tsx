"use client"

import * as React from "react"
import { X, FileText, Maximize2, Minimize2, ChevronLeft, ChevronRight, Loader2, CheckCircle2, XCircle, FileTextIcon, LayoutGrid, ZoomIn, ZoomOut, Maximize, RotateCcw, Languages } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import type { DocumentExtractionFile } from "./DocumentExtractionFileCard"

interface DocumentExtractionViewerProps {
  file: DocumentExtractionFile
  onClose: () => void
}

type ExtractionMode = "full-text" | "blocks"
type ViewFormat = "blocks" | "json" | "html" | "markdown" | "render-html"
type TextDirection = "ltr" | "rtl" | "auto"

// Detect if text contains significant RTL characters (Arabic, Hebrew, Persian, etc.)
const detectTextDirection = (text: string): "ltr" | "rtl" => {
  if (!text) return "ltr"
  // RTL Unicode ranges: Arabic, Hebrew, Persian, Urdu, etc.
  const rtlChars = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\u0590-\u05FF\uFB50-\uFDFF\uFE70-\uFEFF]/g
  const matches = text.match(rtlChars)
  // If more than 10% of text is RTL characters, consider it RTL
  if (matches && matches.length > text.length * 0.1) {
    return "rtl"
  }
  return "ltr"
}

// Block type colors for bounding boxes (simplified categories)
const BLOCK_TYPE_COLORS: Record<string, string> = {
  TEXT: "#3b82f6",      // Blue - main content
  TITLE: "#ef4444",     // Red - titles/headers
  TABLE: "#22c55e",     // Green - tables
  PICTURE: "#f59e0b",   // Orange - images
  FORMULA: "#06b6d4",   // Cyan - formulas
  DEFAULT: "#8b5cf6",   // Purple - fallback
}

// Multi-page data structures
interface PageBlock {
  blockIndex: number
  globalBlockIndex: number
  type: string
  content?: string
  text?: string
  bbox: [number, number, number, number]
  originalBbox?: [number, number, number, number]
  category?: string
  extractedText?: string
  polygon?: number[]
}

interface PageData {
  pageIndex: number
  pageNumber: number
  width?: number
  height?: number
  imageDataUrl?: string // Rendered page image for PDFs
  blocks: PageBlock[]
}

interface MultiPageLayoutData {
  pages: PageData[]
  totalPages: number
  totalBlocks: number
  markdown?: string
  // Legacy support
  blocks?: any[]
}

export function DocumentExtractionViewer({
  file,
  onClose,
}: DocumentExtractionViewerProps) {
  const [isMaximized, setIsMaximized] = React.useState(false)
  const [extractionMode, setExtractionMode] = React.useState<ExtractionMode>(() => {
    // Default to whichever extraction completed first/is available
    if (file.gemini_extraction_status === "completed" && file.gemini_full_text) {
      return "full-text"
    }
    return "blocks"
  })
  const [viewFormat, setViewFormat] = React.useState<ViewFormat>("blocks")
  const [hoveredBlockIndex, setHoveredBlockIndex] = React.useState<number | null>(null)
  const [currentPageIndex, setCurrentPageIndex] = React.useState(0)
  const [imageDimensions, setImageDimensions] = React.useState<{
    natural: { width: number; height: number }
    displayed: { width: number; height: number }
  } | null>(null)
  const [zoomLevel, setZoomLevel] = React.useState(100) // percentage
  const [fitMode, setFitMode] = React.useState<"fit" | "width" | "height" | "manual">("fit")
  const [textDirection, setTextDirection] = React.useState<TextDirection>("auto")
  const imageRef = React.useRef<HTMLImageElement>(null)
  const imageContainerRef = React.useRef<HTMLDivElement>(null)
  const documentContainerRef = React.useRef<HTMLDivElement>(null)

  const layoutData = file.layout_data as MultiPageLayoutData | null
  const extractedTextData = file.extracted_text

  // Normalize data to multi-page structure
  const pages = React.useMemo((): PageData[] => {
    if (!layoutData) return []

    // Check if already in multi-page format
    if (layoutData.pages && Array.isArray(layoutData.pages)) {
      return layoutData.pages
    }

    // Legacy format: convert single blocks array to single page
    if (layoutData.blocks && Array.isArray(layoutData.blocks)) {
      return [{
        pageIndex: 0,
        pageNumber: 1,
        blocks: layoutData.blocks.map((block: any, i: number) => ({
          blockIndex: i,
          globalBlockIndex: i,
          type: block.type || "TEXT",
          content: block.content || block.text || "",
          text: block.text || block.content || "",
          bbox: block.bbox || [0, 0, 0, 0],
          originalBbox: block.originalBbox,
          category: block.category,
          extractedText: block.extractedText,
          polygon: block.polygon,
        })),
      }]
    }

    return []
  }, [layoutData])

  const totalPages = pages.length
  const currentPage = pages[currentPageIndex] || null
  const currentPageBlocks = currentPage?.blocks || []

  // File type checks (moved earlier for use in effects)
  const isImage = file.mime_type?.startsWith("image/")
  const isPdf = file.mime_type === "application/pdf"
  const currentPageImageUrl = currentPage?.imageDataUrl
  const hasPageImage = !!currentPageImageUrl

  // Get extracted text for current page
  const currentPageExtractedTexts = React.useMemo(() => {
    if (!extractedTextData) return []

    // Multi-page format
    if (extractedTextData.pages && Array.isArray(extractedTextData.pages)) {
      const pageData = extractedTextData.pages.find(
        (p: any) => p.pageIndex === currentPageIndex
      )
      return pageData?.blocks || []
    }

    // Legacy format (array of blocks)
    if (Array.isArray(extractedTextData)) {
      return extractedTextData
    }

    return []
  }, [extractedTextData, currentPageIndex])

  // Debug logging
  React.useEffect(() => {
    console.log("[DocumentExtractionViewer] File data:", {
      hasLayoutData: !!layoutData,
      isMultiPage: !!(layoutData?.pages),
      totalPages,
      currentPageIndex,
      currentPageBlocks: currentPageBlocks.length,
      extractedTextsCount: currentPageExtractedTexts.length,
    })
  }, [layoutData, totalPages, currentPageIndex, currentPageBlocks.length, currentPageExtractedTexts.length])

  // Update image dimensions on load and resize
  const updateImageDimensions = React.useCallback(() => {
    if (imageRef.current) {
      setImageDimensions({
        natural: {
          width: imageRef.current.naturalWidth,
          height: imageRef.current.naturalHeight,
        },
        displayed: {
          width: imageRef.current.clientWidth,
          height: imageRef.current.clientHeight,
        },
      })
    }
  }, [])

  React.useEffect(() => {
    const img = imageRef.current
    if (img) {
      img.addEventListener("load", updateImageDimensions)
      window.addEventListener("resize", updateImageDimensions)
      if (img.complete) {
        updateImageDimensions()
      }
    }
    return () => {
      if (img) {
        img.removeEventListener("load", updateImageDimensions)
      }
      window.removeEventListener("resize", updateImageDimensions)
    }
  }, [updateImageDimensions])

  // Update dimensions when zoom changes
  React.useEffect(() => {
    // Small delay to let the image resize
    const timeoutId = setTimeout(updateImageDimensions, 50)
    return () => clearTimeout(timeoutId)
  }, [zoomLevel, fitMode, updateImageDimensions])

  // Get color for block type
  const getBlockColor = (type: string) => {
    return BLOCK_TYPE_COLORS[type?.toUpperCase()] || BLOCK_TYPE_COLORS.DEFAULT
  }

  // Convert polygon to SVG path
  const polygonToPath = (polygon: number[], scale: number) => {
    if (!polygon || polygon.length < 4) return ""
    const points: string[] = []
    for (let i = 0; i < polygon.length; i += 2) {
      const x = polygon[i] * scale
      const y = polygon[i + 1] * scale
      points.push(`${x},${y}`)
    }
    return `M ${points.join(" L ")} Z`
  }

  // Convert bbox [x, y, width, height] to SVG rect params
  const bboxToRect = (bbox: [number, number, number, number], scale: number) => {
    return {
      x: bbox[0] * scale,
      y: bbox[1] * scale,
      width: bbox[2] * scale,
      height: bbox[3] * scale,
    }
  }

  // Convert originalBbox [x1, y1, x2, y2] to SVG rect params
  const originalBboxToRect = (bbox: [number, number, number, number], scale: number) => {
    const [x1, y1, x2, y2] = bbox
    return {
      x: x1 * scale,
      y: y1 * scale,
      width: (x2 - x1) * scale,
      height: (y2 - y1) * scale,
    }
  }

  // Combine blocks with extracted text for current page
  const combinedBlocks = React.useMemo(() => {
    if (currentPageBlocks.length === 0) return []

    return currentPageBlocks.map((block, index) => {
      const extractedText = currentPageExtractedTexts.find(
        (et: any) => et.blockIndex === block.blockIndex || et.globalBlockIndex === block.globalBlockIndex
      )
      return {
        ...block,
        extractedText: extractedText?.text || block.extractedText || block.content || "",
        ocrText: extractedText?.ocrText || block.content || block.text || "",
      }
    })
  }, [currentPageBlocks, currentPageExtractedTexts])

  // Compute effective text direction (auto-detect from content)
  const effectiveDirection = React.useMemo((): "ltr" | "rtl" => {
    if (textDirection !== "auto") return textDirection

    // Sample text from different sources for detection
    let sampleText = ""

    // Check Gemini full text
    if (file.gemini_full_text) {
      sampleText += file.gemini_full_text.slice(0, 500)
    }

    // Check block content
    combinedBlocks.forEach((block) => {
      const text = block.extractedText || block.content || ""
      sampleText += text.slice(0, 100)
    })

    return detectTextDirection(sampleText)
  }, [textDirection, file.gemini_full_text, combinedBlocks])

  // Toggle through direction options
  const cycleTextDirection = () => {
    setTextDirection((prev) => {
      if (prev === "auto") return "ltr"
      if (prev === "ltr") return "rtl"
      return "auto"
    })
  }

  // Direction label for button
  const directionLabel = textDirection === "auto"
    ? `Auto (${effectiveDirection.toUpperCase()})`
    : textDirection.toUpperCase()

  // State for cropped images
  const [croppedImages, setCroppedImages] = React.useState<Record<number, string>>({})

  // Crop block images when image dimensions change (works for images and PDFs with page images)
  React.useEffect(() => {
    if (!imageRef.current || !imageDimensions?.natural || combinedBlocks.length === 0) {
      return
    }

    // Only crop for images or PDFs with page images
    if (!isImage && !hasPageImage) return

    const img = imageRef.current
    if (!img.complete) return

    // Calculate scale factor from reference coordinates to natural image coordinates
    // Datalab coordinates are in reference space (page width), but we need to crop from natural image
    const referenceWidth = currentPage?.width || imageDimensions.natural.width
    const cropScale = imageDimensions.natural.width / referenceWidth

    const newCroppedImages: Record<number, string> = {}

    combinedBlocks.forEach((block, index) => {
      const originalBbox = block.originalBbox
      const bbox = block.bbox
      const polygon = block.polygon

      if (!originalBbox && !bbox && !polygon) return

      try {
        const canvas = document.createElement("canvas")
        const ctx = canvas.getContext("2d")
        if (!ctx) return

        let x: number, y: number, width: number, height: number

        // Prefer originalBbox [x1, y1, x2, y2] format (from dots.ocr or Datalab)
        if (originalBbox && originalBbox.length === 4) {
          const [x1, y1, x2, y2] = originalBbox
          x = x1
          y = y1
          width = x2 - x1
          height = y2 - y1
        } else if (polygon && polygon.length >= 8) {
          // Use polygon as fallback
          const xs = polygon.filter((_: number, i: number) => i % 2 === 0)
          const ys = polygon.filter((_: number, i: number) => i % 2 === 1)
          x = Math.min(...xs)
          y = Math.min(...ys)
          width = Math.max(...xs) - x
          height = Math.max(...ys) - y
        } else if (bbox && bbox[2] > 0 && bbox[3] > 0) {
          // Fallback to bbox [x, y, width, height] format
          x = bbox[0]
          y = bbox[1]
          width = bbox[2]
          height = bbox[3]
        } else {
          return
        }

        if (width <= 0 || height <= 0) return

        // Scale coordinates from reference space to natural image space
        x = x * cropScale
        y = y * cropScale
        width = width * cropScale
        height = height * cropScale

        const padding = 5
        x = Math.max(0, x - padding)
        y = Math.max(0, y - padding)
        width = Math.min(imageDimensions.natural.width - x, width + padding * 2)
        height = Math.min(imageDimensions.natural.height - y, height + padding * 2)

        if (width <= 0 || height <= 0) return

        canvas.width = width
        canvas.height = height

        ctx.drawImage(img, x, y, width, height, 0, 0, width, height)

        newCroppedImages[index] = canvas.toDataURL("image/png")
      } catch (e) {
        console.error(`Error cropping image for block ${index}:`, e)
      }
    })

    setCroppedImages(newCroppedImages)
  }, [imageDimensions, combinedBlocks, isImage, hasPageImage, currentPage?.width])

  // Page navigation
  const goToPreviousPage = () => {
    if (currentPageIndex > 0) {
      setCurrentPageIndex(currentPageIndex - 1)
      setHoveredBlockIndex(null)
    }
  }

  const goToNextPage = () => {
    if (currentPageIndex < totalPages - 1) {
      setCurrentPageIndex(currentPageIndex + 1)
      setHoveredBlockIndex(null)
    }
  }

  const goToPage = (pageIndex: number) => {
    if (pageIndex >= 0 && pageIndex < totalPages) {
      setCurrentPageIndex(pageIndex)
      setHoveredBlockIndex(null)
    }
  }

  // Zoom controls
  const zoomIn = () => {
    setFitMode("manual")
    setZoomLevel((prev) => Math.min(prev + 25, 400))
  }

  const zoomOut = () => {
    setFitMode("manual")
    setZoomLevel((prev) => Math.max(prev - 25, 25))
  }

  const fitToContainer = () => {
    setFitMode("fit")
    setZoomLevel(100)
  }

  const resetZoom = () => {
    setFitMode("manual")
    setZoomLevel(100)
  }

  // Calculate actual zoom based on fit mode
  const getImageStyle = React.useCallback(() => {
    if (fitMode === "fit") {
      return {
        maxWidth: "100%",
        maxHeight: "100%",
        width: "auto",
        height: "auto",
        objectFit: "contain" as const,
      }
    }
    return {
      width: `${zoomLevel}%`,
      maxWidth: "none",
      maxHeight: "none",
      height: "auto",
      objectFit: "contain" as const,
    }
  }, [fitMode, zoomLevel])

  const renderBlocksView = () => {
    if (combinedBlocks.length === 0) {
      return (
        <div className="p-8 text-center text-muted-foreground">
          <p>No blocks extracted for this page.</p>
        </div>
      )
    }

    const isImageFile = file.mime_type?.startsWith("image/")

    return (
      <div className="p-4 space-y-4">
        {combinedBlocks.map((block, index) => {
          const blockColor = getBlockColor(block.type)
          const croppedImageUrl = isImageFile ? croppedImages[index] : null
          // Prefer originalBbox [x1, y1, x2, y2] format for display
          const displayBbox = block.originalBbox || block.bbox
          const hasBbox = displayBbox && displayBbox.length === 4 && (
            block.originalBbox
              ? (displayBbox[2] > displayBbox[0] && displayBbox[3] > displayBbox[1]) // [x1, y1, x2, y2]
              : (displayBbox[2] > 0 || displayBbox[3] > 0) // [x, y, width, height]
          )

          return (
            <div
              key={`${currentPageIndex}-${index}`}
              className={`border rounded-lg overflow-hidden bg-card transition-all ${
                hoveredBlockIndex === index ? "ring-2 ring-offset-2" : ""
              }`}
              style={{
                borderLeftWidth: "4px",
                borderLeftColor: blockColor,
                ...(hoveredBlockIndex === index ? { ringColor: blockColor } : {}),
              }}
              onMouseEnter={() => setHoveredBlockIndex(index)}
              onMouseLeave={() => setHoveredBlockIndex(null)}
            >
              {/* Block header */}
              <div
                className="px-3 py-2 flex items-center gap-2 text-white text-xs font-semibold"
                style={{ backgroundColor: blockColor }}
              >
                <span className="uppercase">{block.type || "TEXT"}</span>
                {totalPages > 1 && (
                  <span className="opacity-75 font-normal">Page {currentPageIndex + 1}</span>
                )}
                {hasBbox && displayBbox && (
                  <span className="opacity-75 font-normal ml-auto">
                    ({Math.round(displayBbox[0])}, {Math.round(displayBbox[1])}, {Math.round(displayBbox[2])}, {Math.round(displayBbox[3])})
                  </span>
                )}
              </div>

              {/* Cropped image preview */}
              {croppedImageUrl && (
                <div className="p-3 bg-muted/30 border-b">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={croppedImageUrl}
                    alt={`Block ${index + 1}`}
                    className="max-w-full max-h-48 object-contain rounded border shadow-sm"
                  />
                </div>
              )}

              {/* Block content - rendered as markdown */}
              <div className="p-3 space-y-2">
                <div
                  dir={effectiveDirection}
                  className={`prose prose-sm dark:prose-invert max-w-none break-words ${effectiveDirection === "rtl" ? "text-right" : ""}`}
                >
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {block.extractedText || block.content || block.text || ""}
                  </ReactMarkdown>
                </div>

                {/* Show OCR text if different - render as HTML */}
                {block.ocrText && block.ocrText !== block.extractedText && (
                  <div className="mt-2 pt-2 border-t border-dashed">
                    <div className={`text-xs text-muted-foreground mb-1 ${effectiveDirection === "rtl" ? "text-right" : ""}`}>OCR (original):</div>
                    <div
                      dir={effectiveDirection}
                      className={`text-xs text-muted-foreground prose prose-xs dark:prose-invert max-w-none break-words [&_img]:max-w-full [&_img]:h-auto [&_img]:rounded [&_img]:border [&_img]:shadow-sm ${effectiveDirection === "rtl" ? "text-right" : ""}`}
                      dangerouslySetInnerHTML={{ __html: block.ocrText }}
                    />
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  const renderJsonView = () => {
    const jsonData = {
      currentPage: currentPageIndex + 1,
      totalPages,
      blocks: combinedBlocks,
      markdown: layoutData?.markdown || null,
      metadata: {
        fileId: file.id,
        fileName: file.name,
        mimeType: file.mime_type,
        extractionStatus: file.extraction_status,
      },
    }
    return (
      <div className="p-4">
        <pre className="text-xs font-mono overflow-auto bg-muted p-4 rounded-lg">
          {JSON.stringify(jsonData, null, 2)}
        </pre>
      </div>
    )
  }

  const renderHtmlView = () => {
    const htmlContent = combinedBlocks
      .map((block) => {
        const text = block.extractedText || block.content || ""
        const tag = block.type === "SECTIONHEADER" || block.type === "SECTION-HEADER" ? "h2" :
                    block.type === "TITLE" ? "h1" :
                    block.type === "TABLE" ? "table" : "p"
        if (tag === "table") {
          return `<table border="1"><tr><td>${text}</td></tr></table>`
        }
        return `<${tag}>${text}</${tag}>`
      })
      .join("\n")

    return (
      <div className="p-4">
        <pre
          dir={effectiveDirection}
          className={`text-xs font-mono overflow-auto bg-muted p-4 rounded-lg whitespace-pre-wrap ${effectiveDirection === "rtl" ? "text-right" : ""}`}
        >
          {htmlContent}
        </pre>
      </div>
    )
  }

  const renderMarkdownView = () => {
    // For current page only
    const markdown = combinedBlocks
      .map((block) => {
        const text = block.extractedText || block.content || ""
        if (block.type === "SECTIONHEADER" || block.type === "SECTION-HEADER") {
          return `## ${text}`
        }
        if (block.type === "TITLE") {
          return `# ${text}`
        }
        return text
      })
      .join("\n\n")

    return (
      <div className="p-4">
        <pre
          dir={effectiveDirection}
          className={`text-xs font-mono overflow-auto bg-muted p-4 rounded-lg whitespace-pre-wrap ${effectiveDirection === "rtl" ? "text-right" : ""}`}
        >
          {markdown}
        </pre>
      </div>
    )
  }

  const renderRenderHtmlView = () => {
    const markdown = combinedBlocks
      .map((block) => {
        const text = block.extractedText || block.content || ""
        if (block.type === "SECTIONHEADER" || block.type === "SECTION-HEADER") {
          return `## ${text}`
        }
        if (block.type === "TITLE") {
          return `# ${text}`
        }
        return text
      })
      .join("\n\n")

    return (
      <div
        dir={effectiveDirection}
        className={`p-8 max-w-3xl mx-auto prose dark:prose-invert prose-sm ${effectiveDirection === "rtl" ? "text-right" : ""}`}
      >
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {markdown || "*No content extracted yet.*"}
        </ReactMarkdown>
      </div>
    )
  }

  // Render full-text view (Gemini extracted markdown)
  const renderFullTextView = () => {
    const geminiStatus = file.gemini_extraction_status || "pending"

    if (geminiStatus === "processing") {
      return (
        <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin mb-4" />
          <p>Extracting full text with Gemini...</p>
        </div>
      )
    }

    if (geminiStatus === "error") {
      return (
        <div className="flex flex-col items-center justify-center h-full text-red-500">
          <XCircle className="h-8 w-8 mb-4" />
          <p>Failed to extract full text</p>
          {file.gemini_error_message && (
            <p className="text-sm text-muted-foreground mt-2">{file.gemini_error_message}</p>
          )}
        </div>
      )
    }

    if (!file.gemini_full_text) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
          <FileTextIcon className="h-8 w-8 mb-4 opacity-50" />
          <p>No full text available yet</p>
        </div>
      )
    }

    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div
          dir={effectiveDirection}
          className={`prose prose-sm dark:prose-invert max-w-none ${effectiveDirection === "rtl" ? "text-right" : ""}`}
        >
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {file.gemini_full_text}
          </ReactMarkdown>
        </div>
      </div>
    )
  }

  const renderParseView = () => {
    // If in full-text mode, render the Gemini full text
    if (extractionMode === "full-text") {
      return renderFullTextView()
    }

    // Otherwise render the blocks view based on viewFormat
    switch (viewFormat) {
      case "blocks":
        return renderBlocksView()
      case "json":
        return renderJsonView()
      case "html":
        return renderHtmlView()
      case "markdown":
        return renderMarkdownView()
      case "render-html":
        return renderRenderHtmlView()
      default:
        return renderBlocksView()
    }
  }

  // Helper to render status badge
  const renderStatusBadge = (status: string | undefined, label: string) => {
    if (!status || status === "pending") {
      return (
        <Badge variant="secondary" className="text-xs gap-1">
          <Loader2 className="h-3 w-3" />
          {label}: Pending
        </Badge>
      )
    }
    if (status === "processing") {
      return (
        <Badge variant="secondary" className="text-xs gap-1 bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-200">
          <Loader2 className="h-3 w-3 animate-spin" />
          {label}: Processing
        </Badge>
      )
    }
    if (status === "completed") {
      return (
        <Badge variant="secondary" className="text-xs gap-1 bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-200">
          <CheckCircle2 className="h-3 w-3" />
          {label}: Ready
        </Badge>
      )
    }
    if (status === "error") {
      return (
        <Badge variant="secondary" className="text-xs gap-1 bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-200">
          <XCircle className="h-3 w-3" />
          {label}: Error
        </Badge>
      )
    }
    return null
  }

  // Calculate scale for bounding box overlays
  // Use page dimensions if available (from OCR/extraction), otherwise fall back to natural image dimensions
  const referenceWidth = currentPage?.width || imageDimensions?.natural.width || 1
  const scale = imageDimensions
    ? imageDimensions.displayed.width / referenceWidth
    : 1

  // Render bounding box overlays (works for both images and PDFs with page images)
  const renderBoundingBoxOverlays = () => {
    if (!imageDimensions || combinedBlocks.length === 0) return null
    if (!isImage && !hasPageImage) return null

    const blocksWithBbox = combinedBlocks.filter((block) => {
      if (block.polygon && block.polygon.length >= 8) {
        const xs = block.polygon.filter((_: number, i: number) => i % 2 === 0)
        const ys = block.polygon.filter((_: number, i: number) => i % 2 === 1)
        const width = Math.max(...xs) - Math.min(...xs)
        const height = Math.max(...ys) - Math.min(...ys)
        return width > 0 && height > 0
      }
      // Check originalBbox [x1, y1, x2, y2] format first (from dots.ocr)
      if (block.originalBbox && block.originalBbox.length === 4) {
        const [x1, y1, x2, y2] = block.originalBbox
        return x2 > x1 && y2 > y1
      }
      // Fallback to bbox [x, y, width, height] format
      if (block.bbox) {
        return block.bbox[2] > 0 && block.bbox[3] > 0
      }
      return false
    })

    if (blocksWithBbox.length === 0) return null

    return (
      <svg
        className="absolute top-0 left-0 pointer-events-none"
        style={{
          width: imageDimensions.displayed.width,
          height: imageDimensions.displayed.height,
        }}
      >
        {combinedBlocks.map((block, index) => {
          const color = getBlockColor(block.type)
          const isHovered = hoveredBlockIndex === index
          const opacity = isHovered ? 0.4 : 0.2
          const strokeWidth = isHovered ? 2 : 1

          if (block.polygon && block.polygon.length >= 8) {
            const xs = block.polygon.filter((_: number, i: number) => i % 2 === 0)
            const ys = block.polygon.filter((_: number, i: number) => i % 2 === 1)
            const width = Math.max(...xs) - Math.min(...xs)
            const height = Math.max(...ys) - Math.min(...ys)
            if (width <= 0 || height <= 0) return null

            const path = polygonToPath(block.polygon, scale)
            return (
              <g key={index}>
                <path
                  d={path}
                  fill={color}
                  fillOpacity={opacity}
                  stroke={color}
                  strokeWidth={strokeWidth}
                  className="pointer-events-auto cursor-pointer transition-all"
                  onMouseEnter={() => setHoveredBlockIndex(index)}
                  onMouseLeave={() => setHoveredBlockIndex(null)}
                />
                {isHovered && (
                  <text
                    x={block.polygon[0] * scale + 4}
                    y={block.polygon[1] * scale + 14}
                    fill="white"
                    fontSize="11"
                    fontWeight="bold"
                    style={{ textShadow: "0 1px 2px rgba(0,0,0,0.8)" }}
                  >
                    {block.type || "TEXT"}
                  </text>
                )}
              </g>
            )
          } else if (block.originalBbox && block.originalBbox.length === 4) {
            // Prefer originalBbox [x1, y1, x2, y2] format from dots.ocr
            const [x1, y1, x2, y2] = block.originalBbox
            if (x2 > x1 && y2 > y1) {
              const rect = originalBboxToRect(block.originalBbox, scale)
              return (
                <g key={index}>
                  <rect
                    {...rect}
                    fill={color}
                    fillOpacity={opacity}
                    stroke={color}
                    strokeWidth={strokeWidth}
                    className="pointer-events-auto cursor-pointer transition-all"
                    onMouseEnter={() => setHoveredBlockIndex(index)}
                    onMouseLeave={() => setHoveredBlockIndex(null)}
                  />
                  {isHovered && (
                    <text
                      x={rect.x + 4}
                      y={rect.y + 14}
                      fill="white"
                      fontSize="11"
                      fontWeight="bold"
                      style={{ textShadow: "0 1px 2px rgba(0,0,0,0.8)" }}
                    >
                      {block.type || "TEXT"}
                    </text>
                  )}
                </g>
              )
            }
          } else if (block.bbox && block.bbox[2] > 0 && block.bbox[3] > 0) {
            // Fallback to converted bbox [x, y, width, height] format
            const rect = bboxToRect(block.bbox, scale)
            return (
              <g key={index}>
                <rect
                  {...rect}
                  fill={color}
                  fillOpacity={opacity}
                  stroke={color}
                  strokeWidth={strokeWidth}
                  className="pointer-events-auto cursor-pointer transition-all"
                  onMouseEnter={() => setHoveredBlockIndex(index)}
                  onMouseLeave={() => setHoveredBlockIndex(null)}
                />
                {isHovered && (
                  <text
                    x={rect.x + 4}
                    y={rect.y + 14}
                    fill="white"
                    fontSize="11"
                    fontWeight="bold"
                    style={{ textShadow: "0 1px 2px rgba(0,0,0,0.8)" }}
                  >
                    {block.type || "TEXT"}
                  </text>
                )}
              </g>
            )
          }
          return null
        })}
      </svg>
    )
  }

  // Page navigation component
  const PageNavigation = () => {
    if (totalPages <= 1) return null

    return (
      <div className="flex items-center gap-2 px-2">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={goToPreviousPage}
          disabled={currentPageIndex === 0}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <Select
          value={String(currentPageIndex)}
          onValueChange={(value) => goToPage(Number(value))}
        >
          <SelectTrigger className="h-7 w-20 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {pages.map((page, index) => (
              <SelectItem key={index} value={String(index)} className="text-xs">
                Page {page.pageNumber}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <span className="text-xs text-muted-foreground">of {totalPages}</span>

        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={goToNextPage}
          disabled={currentPageIndex === totalPages - 1}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    )
  }

  return (
    <div
      className={`fixed inset-0 z-50 bg-background flex flex-col transition-all duration-200 ${
        isMaximized ? "p-0" : "p-4 md:p-8"
      }`}
    >
      <div
        className={`flex-1 flex flex-col bg-background border rounded-lg shadow-2xl overflow-hidden ${
          isMaximized ? "rounded-none border-0" : ""
        }`}
      >
        {/* Header */}
        <div className="h-14 border-b flex items-center justify-between px-4 bg-muted/5 shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <FileText className="h-4 w-4" />
            </div>
            <div>
              <h2 className="font-semibold text-sm">{file.name}</h2>
              <p className="text-xs text-muted-foreground">
                {file.mime_type || "Unknown Type"}
                {totalPages > 1 && ` - ${totalPages} pages`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMaximized(!isMaximized)}
            >
              {isMaximized ? (
                <Minimize2 className="h-4 w-4" />
              ) : (
                <Maximize2 className="h-4 w-4" />
              )}
            </Button>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          <ResizablePanelGroup direction="horizontal">
            {/* Document Pane */}
            <ResizablePanel defaultSize={50} minSize={30}>
              <div className="h-full flex flex-col bg-muted/10">
                {/* Document Header with Zoom Controls */}
                <div className="h-10 border-b flex items-center justify-between px-3 text-xs font-medium text-muted-foreground bg-muted/5">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Document</span>
                    {totalPages > 1 && (
                      <>
                        <span className="text-muted-foreground/50">|</span>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={goToPreviousPage}
                            disabled={currentPageIndex === 0}
                          >
                            <ChevronLeft className="h-3.5 w-3.5" />
                          </Button>
                          <span className="min-w-[60px] text-center">
                            {currentPageIndex + 1} / {totalPages}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={goToNextPage}
                            disabled={currentPageIndex === totalPages - 1}
                          >
                            <ChevronRight className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                  {/* Zoom Controls */}
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={zoomOut}
                      title="Zoom Out"
                    >
                      <ZoomOut className="h-3.5 w-3.5" />
                    </Button>
                    <span className="min-w-[45px] text-center text-xs tabular-nums">
                      {fitMode === "fit" ? "Fit" : `${zoomLevel}%`}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={zoomIn}
                      title="Zoom In"
                    >
                      <ZoomIn className="h-3.5 w-3.5" />
                    </Button>
                    <div className="w-px h-4 bg-border mx-1" />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={fitToContainer}
                      title="Fit to Container"
                    >
                      <Maximize className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={resetZoom}
                      title="Reset to 100%"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
                {/* Document Content */}
                <div
                  ref={documentContainerRef}
                  className={`flex-1 overflow-auto ${fitMode === "fit" ? "flex items-center justify-center" : ""} p-4`}
                >
                  {isImage ? (
                    <div ref={imageContainerRef} className="relative inline-block">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        ref={imageRef}
                        src={file.file_url}
                        alt={file.name}
                        style={getImageStyle()}
                        className="shadow-sm rounded-md"
                        crossOrigin="anonymous"
                      />
                      {renderBoundingBoxOverlays()}
                    </div>
                  ) : isPdf && hasPageImage ? (
                    // Show rendered page image with bounding boxes for PDFs
                    <div ref={imageContainerRef} className="relative inline-block">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        ref={imageRef}
                        src={currentPageImageUrl}
                        alt={`${file.name} - Page ${currentPageIndex + 1}`}
                        style={getImageStyle()}
                        className="shadow-sm rounded-md"
                        crossOrigin="anonymous"
                      />
                      {renderBoundingBoxOverlays()}
                    </div>
                  ) : isPdf ? (
                    // Fallback to iframe for PDFs without rendered images
                    <iframe
                      src={`${file.file_url}#page=${currentPageIndex + 1}&toolbar=0`}
                      className="w-full h-full rounded-md border shadow-sm bg-white"
                      title="PDF Viewer"
                    />
                  ) : (
                    <div className="text-center text-muted-foreground">
                      <FileText className="h-12 w-12 mx-auto mb-2 opacity-20" />
                      <p>Preview not available for this file type.</p>
                    </div>
                  )}
                </div>
              </div>
            </ResizablePanel>

            <ResizableHandle />

            {/* Parse Pane */}
            <ResizablePanel defaultSize={50} minSize={30}>
              <div className="h-full flex flex-col bg-background">
                {/* Mode Toggle Header */}
                <div className="border-b flex items-center justify-between px-4 py-2 bg-muted/5">
                  <div className="flex items-center gap-2">
                    <Tabs value={extractionMode} onValueChange={(v) => setExtractionMode(v as ExtractionMode)}>
                      <TabsList className="h-8">
                        <TabsTrigger
                          value="full-text"
                          className="text-xs px-3 py-1.5 gap-1.5"
                          disabled={file.gemini_extraction_status === "pending"}
                        >
                          <FileTextIcon className="h-3.5 w-3.5" />
                          Full Text
                        </TabsTrigger>
                        <TabsTrigger
                          value="blocks"
                          className="text-xs px-3 py-1.5 gap-1.5"
                          disabled={file.layout_extraction_status === "pending" && !file.layout_data}
                        >
                          <LayoutGrid className="h-3.5 w-3.5" />
                          Blocks
                        </TabsTrigger>
                      </TabsList>
                    </Tabs>
                  </div>
                  <div className="flex items-center gap-2">
                    {/* Text Direction Toggle */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={cycleTextDirection}
                      className="h-7 text-xs gap-1.5 px-2"
                      title={`Text direction: ${directionLabel}. Click to cycle between Auto, LTR, and RTL.`}
                    >
                      <Languages className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">{directionLabel}</span>
                    </Button>
                    <div className="w-px h-4 bg-border" />
                    {renderStatusBadge(file.gemini_extraction_status, "Full Text")}
                    {renderStatusBadge(file.layout_extraction_status, "Blocks")}
                  </div>
                </div>

                {/* Sub-tabs for blocks mode */}
                {extractionMode === "blocks" && (
                  <div className="h-9 border-b flex items-center px-4 text-xs font-medium text-muted-foreground bg-muted/5">
                    <Tabs value={viewFormat} onValueChange={(v) => setViewFormat(v as ViewFormat)}>
                      <TabsList className="h-7">
                        <TabsTrigger value="blocks" className="text-xs px-2 py-1">
                          Blocks ({combinedBlocks.length})
                        </TabsTrigger>
                        <TabsTrigger value="json" className="text-xs px-2 py-1">
                          JSON
                        </TabsTrigger>
                        <TabsTrigger value="html" className="text-xs px-2 py-1">
                          HTML
                        </TabsTrigger>
                        <TabsTrigger value="markdown" className="text-xs px-2 py-1">
                          Markdown
                        </TabsTrigger>
                        <TabsTrigger value="render-html" className="text-xs px-2 py-1">
                          Render
                        </TabsTrigger>
                      </TabsList>
                    </Tabs>
                  </div>
                )}

                <div className="flex-1 overflow-y-auto">
                  {renderParseView()}
                </div>
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>
      </div>
    </div>
  )
}
