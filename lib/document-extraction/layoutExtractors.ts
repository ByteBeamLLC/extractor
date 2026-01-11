/**
 * Layout extraction methods using dots.ocr and Datalab
 */

import { callDotsOcr, callRealEsrgan } from "@/lib/replicate"
import { callDatalabChandra, extractLayoutBlocks as extractDatalabBlocks } from "@/lib/datalab"
import type { MultiPageLayoutData, PageData, PageBlock } from "./types"
import { isLowOcrQuality, fetchImageAsBase64, isPDFFile } from "./ocrUtils"
import { renderPdfPagesToImages } from "./pdfRenderer"
import { extractFullImage } from "./blockExtractor"
import { OCR_UPSCALE_SCALE, OCR_TIMEOUT_MS, DATALAB_TIMEOUT_MS } from "./constants"

/**
 * Extract layout from a single image using dots.ocr
 */
export async function extractImageWithDotsOcr(
  base64: string,
  mimeType: string,
  fileName: string
): Promise<MultiPageLayoutData> {
  console.log(`[document-extraction] Using dots.ocr for single image extraction`)
  let imageBase64 = base64
  let imageMimeType = mimeType
  let dotsOcrOutput = await callDotsOcr(
    { image: imageBase64, file_name: fileName, mime_type: imageMimeType },
    { timeout: OCR_TIMEOUT_MS }
  )

  if (isLowOcrQuality(dotsOcrOutput)) {
    console.log(`[document-extraction] Low OCR quality detected, upscaling image with Real-ESRGAN`)
    try {
      const upscaled = await callRealEsrgan(
        { image: imageBase64, mime_type: imageMimeType, scale: OCR_UPSCALE_SCALE },
        { timeout: OCR_TIMEOUT_MS }
      )
      const upscaledImage = await fetchImageAsBase64(upscaled.imageUrl)
      imageBase64 = upscaledImage.base64
      imageMimeType = upscaledImage.mimeType

      dotsOcrOutput = await callDotsOcr(
        { image: imageBase64, file_name: fileName, mime_type: imageMimeType },
        { timeout: OCR_TIMEOUT_MS }
      )
    } catch (error) {
      console.warn(`[document-extraction] Real-ESRGAN upscale failed, using original OCR output:`, error)
    }
  }

  console.log(`[document-extraction] dots.ocr response:`, {
    hasBlocks: !!dotsOcrOutput.blocks,
    blocksCount: dotsOcrOutput.blocks?.length || 0,
    hasMarkdown: !!dotsOcrOutput.markdown,
  })

  const blocks = dotsOcrOutput.blocks || []

  // Normalize to multi-page structure (single page)
  const pageData: PageData = {
    pageIndex: 0,
    pageNumber: 1,
    imageDataUrl: `data:${imageMimeType};base64,${imageBase64}`,
    blocks: blocks.map((block: { type?: string; category?: string; content?: string; text?: string; bbox?: [number, number, number, number]; originalBbox?: [number, number, number, number] }, i: number): PageBlock => ({
      blockIndex: i,
      globalBlockIndex: i,
      type: block.type || block.category || "TEXT",
      content: block.content || block.text || "",
      text: block.content || block.text || "",
      bbox: block.bbox || [0, 0, 0, 0],
      originalBbox: block.originalBbox,
      category: block.category,
    })),
  }

  return {
    pages: [pageData],
    totalPages: 1,
    totalBlocks: blocks.length,
    markdown: dotsOcrOutput.markdown,
  }
}

/**
 * Extract layout from a PDF using dots.ocr (per page)
 */
export async function extractPDFWithDotsOcr(
  base64: string,
  fileName: string
): Promise<MultiPageLayoutData> {
  console.log(`[document-extraction] Using dots.ocr for PDF extraction (per page)`)

  const pageImages = await renderPdfPagesToImages(base64)
  console.log(`[document-extraction] Rendered ${pageImages.length} PDF pages to images`)

  const pages: PageData[] = []
  let globalBlockIndex = 0
  const markdownParts: string[] = []

  for (const pageImage of pageImages) {
    const pageFileName = `${fileName.replace(/\.pdf$/i, "")}-page-${pageImage.pageNumber}.png`
    let pageImageBase64 = pageImage.imageBase64
    let pageImageMimeType = "image/png"
    let pageImageDataUrl = pageImage.imageDataUrl
    let pageWidth = pageImage.width
    let pageHeight = pageImage.height

    let dotsOcrOutput = await callDotsOcr(
      { image: pageImageBase64, file_name: pageFileName, mime_type: pageImageMimeType },
      { timeout: OCR_TIMEOUT_MS }
    )

    if (isLowOcrQuality(dotsOcrOutput)) {
      console.log(`[document-extraction] Low OCR quality detected on page ${pageImage.pageNumber}, upscaling with Real-ESRGAN`)
      try {
        const upscaled = await callRealEsrgan(
          { image: pageImageBase64, mime_type: pageImageMimeType, scale: OCR_UPSCALE_SCALE },
          { timeout: OCR_TIMEOUT_MS }
        )
        const upscaledImage = await fetchImageAsBase64(upscaled.imageUrl)
        pageImageBase64 = upscaledImage.base64
        pageImageMimeType = upscaledImage.mimeType
        pageImageDataUrl = `data:${pageImageMimeType};base64,${pageImageBase64}`
        pageWidth = Math.round(pageWidth * OCR_UPSCALE_SCALE)
        pageHeight = Math.round(pageHeight * OCR_UPSCALE_SCALE)

        dotsOcrOutput = await callDotsOcr(
          { image: pageImageBase64, file_name: pageFileName, mime_type: pageImageMimeType },
          { timeout: OCR_TIMEOUT_MS }
        )
      } catch (error) {
        console.warn(`[document-extraction] Real-ESRGAN upscale failed for page ${pageImage.pageNumber}, using original OCR output:`, error)
      }
    }

    console.log(`[document-extraction] dots.ocr page ${pageImage.pageNumber} response:`, {
      hasBlocks: !!dotsOcrOutput.blocks,
      blocksCount: dotsOcrOutput.blocks?.length || 0,
      hasMarkdown: !!dotsOcrOutput.markdown,
    })

    const blocks = dotsOcrOutput.blocks || []
    if (dotsOcrOutput.markdown) {
      markdownParts.push(`## Page ${pageImage.pageNumber}\n\n${dotsOcrOutput.markdown}`)
    }

    pages.push({
      pageIndex: pageImage.pageIndex,
      pageNumber: pageImage.pageNumber,
      width: pageWidth,
      height: pageHeight,
      imageDataUrl: pageImageDataUrl,
      blocks: blocks.map((block: { type?: string; category?: string; content?: string; text?: string; bbox?: [number, number, number, number]; originalBbox?: [number, number, number, number] }, i: number): PageBlock => ({
        blockIndex: i,
        globalBlockIndex: globalBlockIndex + i,
        type: block.type || block.category || "TEXT",
        content: block.content || block.text || "",
        text: block.content || block.text || "",
        bbox: block.bbox || [0, 0, 0, 0],
        originalBbox: block.originalBbox,
        category: block.category,
      })),
    })

    globalBlockIndex += blocks.length
  }

  return {
    pages,
    totalPages: pages.length,
    totalBlocks: globalBlockIndex,
    markdown: markdownParts.length > 0 ? markdownParts.join("\n\n---\n\n") : undefined,
  }
}

/**
 * Extract layout from a single image using Datalab Marker
 */
export async function extractImageWithDatalab(
  base64: string,
  mimeType: string,
  fileName: string
): Promise<MultiPageLayoutData> {
  console.log(`[document-extraction] Using Datalab Marker for single image extraction`)

  const datalabOutput = await callDatalabChandra(
    {
      file: base64,
      file_name: fileName,
      mime_type: mimeType,
      output_format: 'json',
      mode: 'accurate'
    },
    { timeout: DATALAB_TIMEOUT_MS }
  )

  console.log(`[document-extraction] Datalab Marker response:`, {
    hasJson: !!datalabOutput.json,
    hasBlocks: !!datalabOutput.blocks,
    hasPages: !!datalabOutput.pages,
  })

  const extractedBlocks = extractDatalabBlocks(datalabOutput)
  console.log(`[document-extraction] Extracted ${extractedBlocks.length} blocks with types`)
  if (extractedBlocks.length > 0) {
    console.log(`[document-extraction] Sample block 0:`, {
      type: extractedBlocks[0].type,
      bbox: extractedBlocks[0].bbox,
      polygon: extractedBlocks[0].polygon,
      hasContent: !!extractedBlocks[0].content,
    })
  }

  // Get image dimensions from metadata or infer from block extents
  let pageWidth = 1536 // Default fallback
  let pageHeight = 2193 // Default fallback

  if (datalabOutput.metadata?.page_stats && datalabOutput.metadata.page_stats.length > 0) {
    const pageStats = datalabOutput.metadata.page_stats[0]
    pageWidth = pageStats.width || pageWidth
    pageHeight = pageStats.height || pageHeight
    console.log(`[document-extraction] Page dimensions from metadata:`, { width: pageWidth, height: pageHeight })
  } else if (extractedBlocks.length > 0) {
    // Infer page dimensions from the maximum extent of all blocks
    let maxX = 0, maxY = 0
    extractedBlocks.forEach((block: { originalBbox?: [number, number, number, number]; bbox?: [number, number, number, number] }) => {
      if (block.originalBbox && block.originalBbox.length === 4) {
        // originalBbox is [x1, y1, x2, y2]
        maxX = Math.max(maxX, block.originalBbox[2])
        maxY = Math.max(maxY, block.originalBbox[3])
      } else if (block.bbox && block.bbox.length === 4) {
        // bbox is [x, y, width, height]
        maxX = Math.max(maxX, block.bbox[0] + block.bbox[2])
        maxY = Math.max(maxY, block.bbox[1] + block.bbox[3])
      }
    })
    if (maxX > 0 && maxY > 0) {
      pageWidth = maxX
      pageHeight = maxY
      console.log(`[document-extraction] Page dimensions inferred from block extents:`, { width: pageWidth, height: pageHeight })
    }
  }

  const pageData: PageData = {
    pageIndex: 0,
    pageNumber: 1,
    width: pageWidth,
    height: pageHeight,
    imageDataUrl: `data:${mimeType};base64,${base64}`,
    blocks: extractedBlocks.map((block: { type?: string; content?: string; bbox?: [number, number, number, number]; originalBbox?: [number, number, number, number]; polygon?: number[][] }, i: number): PageBlock => ({
      blockIndex: i,
      globalBlockIndex: i,
      type: block.type || "TEXT",
      content: block.content || "",
      text: block.content || "",
      bbox: block.bbox || [0, 0, 0, 0],
      // Use originalBbox from Datalab if available (already in [x1, y1, x2, y2] format)
      // Otherwise calculate from bbox [x, y, width, height]
      originalBbox: block.originalBbox || (block.bbox ? [block.bbox[0], block.bbox[1], block.bbox[0] + block.bbox[2], block.bbox[1] + block.bbox[3]] : undefined),
      polygon: block.polygon,
      category: block.type,
    })),
  }

  return {
    pages: [pageData],
    totalPages: 1,
    totalBlocks: extractedBlocks.length,
  }
}

/**
 * Extract layout from a PDF using Datalab Marker
 */
export async function extractPDFWithDatalab(
  base64: string,
  fileName: string
): Promise<MultiPageLayoutData> {
  console.log(`[document-extraction] Using Datalab Marker for PDF extraction`)

  const datalabOutput = await callDatalabChandra(
    {
      file: base64,
      file_name: fileName,
      mime_type: "application/pdf",
      output_format: 'json',
      mode: 'accurate'
    },
    { timeout: DATALAB_TIMEOUT_MS }
  )

  console.log(`[document-extraction] Datalab Marker response:`, {
    hasJson: !!datalabOutput.json,
    hasBlocks: !!datalabOutput.blocks,
    hasPages: !!datalabOutput.pages,
  })

  const extractedBlocks = extractDatalabBlocks(datalabOutput)
  console.log(`[document-extraction] Extracted ${extractedBlocks.length} blocks with types`)
  if (extractedBlocks.length > 0) {
    console.log(`[document-extraction] Sample block 0:`, {
      type: extractedBlocks[0].type,
      bbox: extractedBlocks[0].bbox,
      polygon: extractedBlocks[0].polygon,
      pageIndex: extractedBlocks[0].pageIndex,
      hasContent: !!extractedBlocks[0].content,
    })
  }

  // Get page dimensions from Datalab metadata if available
  const pageDimensions = new Map<number, { width: number; height: number }>()
  if (datalabOutput.metadata?.page_stats && Array.isArray(datalabOutput.metadata.page_stats)) {
    datalabOutput.metadata.page_stats.forEach((stats: { width?: number; height?: number }, idx: number) => {
      if (stats.width && stats.height) {
        pageDimensions.set(idx, { width: stats.width, height: stats.height })
        console.log(`[document-extraction] Page ${idx} dimensions from metadata:`, stats.width, 'x', stats.height)
      }
    })
  }

  // Render PDF pages for visualization
  console.log(`[document-extraction] Rendering PDF pages for visualization...`)
  const pageImages = await renderPdfPagesToImages(base64)
  console.log(`[document-extraction] Rendered ${pageImages.length} PDF pages`)

  // Group blocks by page if available
  const blocksByPage = new Map<number, Array<{ type?: string; content?: string; bbox?: [number, number, number, number]; originalBbox?: [number, number, number, number]; polygon?: number[][] }>>()

  extractedBlocks.forEach((block: { pageIndex?: number; type?: string; content?: string; bbox?: [number, number, number, number]; originalBbox?: [number, number, number, number]; polygon?: number[][] }) => {
    const pageIndex = block.pageIndex ?? 0
    if (!blocksByPage.has(pageIndex)) {
      blocksByPage.set(pageIndex, [])
    }
    blocksByPage.get(pageIndex)!.push(block)
  })

  let globalBlockIndex = 0
  const pages: PageData[] = pageImages.map((pageImage, idx) => {
    const pageBlocks = blocksByPage.get(idx) || []

    // Use dimensions from Datalab metadata if available, otherwise use rendered page dimensions
    const dimensions = pageDimensions.get(idx) || { width: pageImage.width, height: pageImage.height }

    const page: PageData = {
      pageIndex: pageImage.pageIndex,
      pageNumber: pageImage.pageNumber,
      width: dimensions.width,
      height: dimensions.height,
      imageDataUrl: pageImage.imageDataUrl,
      blocks: pageBlocks.map((block, i): PageBlock => ({
        blockIndex: i,
        globalBlockIndex: globalBlockIndex + i,
        type: block.type || "TEXT",
        content: block.content || "",
        text: block.content || "",
        bbox: block.bbox || [0, 0, 0, 0],
        // Use originalBbox from Datalab if available (already in [x1, y1, x2, y2] format)
        // Otherwise calculate from bbox [x, y, width, height]
        originalBbox: block.originalBbox || (block.bbox ? [block.bbox[0], block.bbox[1], block.bbox[0] + block.bbox[2], block.bbox[1] + block.bbox[3]] : undefined),
        polygon: block.polygon,
        category: block.type,
      })),
    }

    globalBlockIndex += pageBlocks.length
    return page
  })

  return {
    pages,
    totalPages: pages.length,
    totalBlocks: globalBlockIndex,
  }
}

/**
 * Fallback extraction using Gemini when primary methods fail
 */
export async function extractWithGeminiFallback(
  base64: string,
  mimeType: string,
  fileName: string
): Promise<MultiPageLayoutData> {
  console.log(`[document-extraction] Using Gemini fallback for full document OCR`)

  const isPdf = isPDFFile(mimeType, fileName)

  if (isPdf) {
    // For PDFs, render pages and extract from each
    console.log(`[document-extraction] Rendering PDF pages for Gemini fallback...`)
    const pageImages = await renderPdfPagesToImages(base64)
    console.log(`[document-extraction] Processing ${pageImages.length} pages with Gemini...`)

    const pages: PageData[] = []
    let globalBlockIndex = 0

    for (const pageImage of pageImages) {
      console.log(`[document-extraction] Extracting text from page ${pageImage.pageNumber} with Gemini...`)
      const extractedText = await extractFullImage(pageImage.imageDataUrl)

      pages.push({
        pageIndex: pageImage.pageIndex,
        pageNumber: pageImage.pageNumber,
        width: pageImage.width,
        height: pageImage.height,
        imageDataUrl: pageImage.imageDataUrl,
        blocks: [{
          blockIndex: 0,
          globalBlockIndex: globalBlockIndex,
          type: "TEXT",
          content: extractedText,
          text: extractedText,
          bbox: [0, 0, pageImage.width || 0, pageImage.height || 0],
          extractedText: extractedText,
        }],
      })
      globalBlockIndex++
    }

    return {
      pages,
      totalPages: pages.length,
      totalBlocks: globalBlockIndex,
      markdown: pages.map(p => p.blocks[0]?.content || '').join('\n\n---\n\n'),
    }
  } else {
    // For images, extract directly
    const imageDataUrl = `data:${mimeType};base64,${base64}`
    console.log(`[document-extraction] Extracting text from image with Gemini...`)
    const extractedText = await extractFullImage(imageDataUrl)

    return {
      pages: [{
        pageIndex: 0,
        pageNumber: 1,
        imageDataUrl,
        blocks: [{
          blockIndex: 0,
          globalBlockIndex: 0,
          type: "TEXT",
          content: extractedText,
          text: extractedText,
          bbox: [0, 0, 0, 0],
          extractedText: extractedText,
        }],
      }],
      totalPages: 1,
      totalBlocks: 1,
      markdown: extractedText,
    }
  }
}
