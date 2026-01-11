/**
 * Main document extraction orchestrator
 * Runs both Gemini full-text and layout-based extraction in parallel
 */

import { createSupabaseServerClient } from "@/lib/supabase/server"
import type {
  ExtractFileParams,
  MultiPageLayoutData,
  MultiPageExtractedText,
  BlockExtractionTask,
  BlockExtractionResult,
} from "./types"
import { isPDFFile } from "./ocrUtils"
import { renderPdfPagesToImages } from "./pdfRenderer"
import { extractBlocksInParallel, extractFullImage } from "./blockExtractor"
import {
  extractImageWithDotsOcr,
  extractPDFWithDotsOcr,
  extractImageWithDatalab,
  extractPDFWithDatalab,
  extractWithGeminiFallback,
} from "./layoutExtractors"

/**
 * Run Gemini full-text extraction independently
 */
async function runGeminiFullTextExtraction(
  fileId: string,
  base64: string,
  mimeType: string,
  fileName: string,
  supabase: ReturnType<typeof createSupabaseServerClient>
): Promise<{ success: boolean; text?: string; error?: string }> {
  console.log(`[document-extraction] Starting Gemini full-text extraction for ${fileId}`)

  // Update Gemini status to processing
  const { error: statusError } = await supabase
    .from("document_extraction_files")
    .update({
      gemini_extraction_status: "processing",
      updated_at: new Date().toISOString(),
    })
    .eq("id", fileId)

  if (statusError) {
    console.error(`[document-extraction] Failed to update Gemini status to processing:`, statusError)
  }

  try {
    const isPdf = isPDFFile(mimeType, fileName)
    let fullText: string

    if (isPdf) {
      console.log(`[document-extraction] Rendering PDF pages for Gemini full-text...`)
      const pageImages = await renderPdfPagesToImages(base64)
      console.log(`[document-extraction] Extracting text from ${pageImages.length} pages with Gemini...`)

      const pageTexts: string[] = []
      for (const pageImage of pageImages) {
        const pageText = await extractFullImage(pageImage.imageDataUrl)
        pageTexts.push(`## Page ${pageImage.pageNumber}\n\n${pageText}`)
      }
      fullText = pageTexts.join('\n\n---\n\n')
    } else {
      const imageDataUrl = `data:${mimeType};base64,${base64}`
      console.log(`[document-extraction] Extracting text from image with Gemini...`)
      fullText = await extractFullImage(imageDataUrl)
    }

    // Update database with results
    const { error: updateError } = await supabase
      .from("document_extraction_files")
      .update({
        gemini_full_text: fullText,
        gemini_extraction_status: "completed",
        updated_at: new Date().toISOString(),
      })
      .eq("id", fileId)

    if (updateError) {
      console.error(`[document-extraction] Failed to save Gemini results to database:`, updateError)
      throw new Error(`Database update failed: ${updateError.message}`)
    }

    console.log(`[document-extraction] ✅ Gemini full-text extraction completed for ${fileId}`)
    return { success: true, text: fullText }
  } catch (error: unknown) {
    const err = error as { message?: string }
    console.error(`[document-extraction] Gemini full-text extraction failed:`, error)

    await supabase
      .from("document_extraction_files")
      .update({
        gemini_extraction_status: "error",
        gemini_error_message: err.message || String(error),
        updated_at: new Date().toISOString(),
      })
      .eq("id", fileId)

    return { success: false, error: err.message || String(error) }
  }
}

/**
 * Run layout-based extraction independently
 */
async function runLayoutExtraction(
  fileId: string,
  base64: string,
  mimeType: string,
  fileName: string,
  extractionMethod: string,
  supabase: ReturnType<typeof createSupabaseServerClient>
): Promise<{ success: boolean; layoutData?: MultiPageLayoutData; extractedTextData?: MultiPageExtractedText; error?: string }> {
  console.log(`[document-extraction] Starting layout extraction for ${fileId} using method: ${extractionMethod}`)

  // Update layout status to processing
  const { error: statusError } = await supabase
    .from("document_extraction_files")
    .update({
      layout_extraction_status: "processing",
      updated_at: new Date().toISOString(),
    })
    .eq("id", fileId)

  if (statusError) {
    console.error(`[document-extraction] Failed to update layout status to processing:`, statusError)
  }

  try {
    // Step 1: Layout detection
    let layoutData: MultiPageLayoutData
    let usedFallback = false

    try {
      if (extractionMethod === 'datalab') {
        if (isPDFFile(mimeType, fileName)) {
          console.log(`[document-extraction] Detected PDF file, using Datalab Marker`)
          layoutData = await extractPDFWithDatalab(base64, fileName)
        } else {
          console.log(`[document-extraction] Detected image file, using Datalab Marker`)
          layoutData = await extractImageWithDatalab(base64, mimeType, fileName)
        }
      } else {
        if (isPDFFile(mimeType, fileName)) {
          console.log(`[document-extraction] Detected PDF file, using dots.ocr per page`)
          layoutData = await extractPDFWithDotsOcr(base64, fileName)
        } else {
          console.log(`[document-extraction] Detected image file, using dots.ocr`)
          layoutData = await extractImageWithDotsOcr(base64, mimeType, fileName)
        }
      }
    } catch (layoutError: unknown) {
      const err = layoutError as { message?: string }
      console.error(`[document-extraction] Layout detection failed: ${err.message}`)
      console.log(`[document-extraction] Falling back to Gemini for layout extraction...`)
      layoutData = await extractWithGeminiFallback(base64, mimeType, fileName)
      usedFallback = true
    }

    console.log(`[document-extraction] Layout detection complete:`, {
      totalPages: layoutData.totalPages,
      totalBlocks: layoutData.totalBlocks,
      usedFallback,
    })

    // Step 2: Extract text from blocks
    const extractedTextData: MultiPageExtractedText = {
      pages: [],
      totalBlocks: 0,
    }

    const allBlocks = layoutData.pages.flatMap(p => p.blocks)

    if (usedFallback) {
      // Fallback was used - text already extracted
      console.log(`[document-extraction] Skipping block extraction (fallback already extracted text)`)
      for (const page of layoutData.pages) {
        extractedTextData.pages.push({
          pageIndex: page.pageIndex,
          pageNumber: page.pageNumber,
          blocks: page.blocks.map(block => ({
            blockIndex: block.blockIndex,
            globalBlockIndex: block.globalBlockIndex,
            type: block.type || "TEXT",
            text: block.extractedText || block.content || block.text || "",
            ocrText: block.content || block.text || "",
            bbox: block.bbox,
          })),
        })
      }
      extractedTextData.totalBlocks = allBlocks.length
    } else if (allBlocks.length === 0) {
      // No blocks found - extract from full image
      console.log(`[document-extraction] No blocks found, extracting from full document`)
      const firstPageImageUrl = layoutData.pages[0]?.imageDataUrl || `data:${mimeType};base64,${base64}`
      const fullText = await extractFullImage(firstPageImageUrl)

      layoutData.pages[0].blocks.push({
        blockIndex: 0,
        globalBlockIndex: 0,
        type: "TEXT",
        content: fullText,
        text: fullText,
        bbox: [0, 0, 0, 0],
        extractedText: fullText,
      })

      extractedTextData.pages.push({
        pageIndex: 0,
        pageNumber: 1,
        blocks: [{
          blockIndex: 0,
          globalBlockIndex: 0,
          type: "TEXT",
          text: fullText,
        }],
      })
      extractedTextData.totalBlocks = 1
    } else {
      // Extract text from each block
      console.log(`[document-extraction] Extracting text from ${allBlocks.length} blocks using Gemini...`)

      const tasks: BlockExtractionTask[] = []
      const invalidResults: BlockExtractionResult[] = []

      for (const page of layoutData.pages) {
        for (const block of page.blocks) {
          const [, , width, height] = block.bbox
          const ocrText = block.content || block.text || ""

          if (width <= 0 || height <= 0) {
            invalidResults.push({
              blockIndex: block.blockIndex,
              globalBlockIndex: block.globalBlockIndex,
              pageIndex: page.pageIndex,
              type: block.type || "TEXT",
              text: ocrText,
              ocrText,
              bbox: block.bbox,
            })
            block.extractedText = ocrText
          } else {
            tasks.push({
              index: block.globalBlockIndex,
              pageIndex: page.pageIndex,
              blockIndex: block.blockIndex,
              block,
              ocrText,
              bbox: block.bbox,
              imageDataUrl: page.imageDataUrl || `data:${mimeType};base64,${base64}`,
            })
          }
        }
      }

      let allResults: BlockExtractionResult[] = [...invalidResults]

      if (tasks.length > 0) {
        const parallelResults = await extractBlocksInParallel(tasks)
        for (const result of parallelResults) {
          const page = layoutData.pages.find(p => p.pageIndex === result.pageIndex)
          if (page) {
            const block = page.blocks.find(b => b.blockIndex === result.blockIndex)
            if (block) {
              block.extractedText = result.text
            }
          }
        }
        allResults = [...allResults, ...parallelResults]
      }

      allResults.sort((a, b) => a.globalBlockIndex - b.globalBlockIndex)

      const pageResultsMap = new Map<number, BlockExtractionResult[]>()
      for (const result of allResults) {
        if (!pageResultsMap.has(result.pageIndex)) {
          pageResultsMap.set(result.pageIndex, [])
        }
        pageResultsMap.get(result.pageIndex)!.push(result)
      }

      for (const page of layoutData.pages) {
        const pageResults = pageResultsMap.get(page.pageIndex) || []
        extractedTextData.pages.push({
          pageIndex: page.pageIndex,
          pageNumber: page.pageNumber,
          blocks: pageResults.map(r => ({
            blockIndex: r.blockIndex,
            globalBlockIndex: r.globalBlockIndex,
            type: r.type,
            text: r.text,
            ocrText: r.ocrText,
            bbox: r.bbox,
            error: r.error,
          })),
        })
      }
      extractedTextData.totalBlocks = allResults.length
    }

    // Prepare layout data for storage
    const layoutDataForStorage = {
      pages: layoutData.pages.map(page => ({
        pageIndex: page.pageIndex,
        pageNumber: page.pageNumber,
        width: page.width,
        height: page.height,
        imageDataUrl: page.imageDataUrl,
        blocks: page.blocks.map(block => ({
          blockIndex: block.blockIndex,
          globalBlockIndex: block.globalBlockIndex,
          type: block.type,
          content: block.content,
          text: block.text,
          bbox: block.bbox,
          originalBbox: block.originalBbox,
          category: block.category,
          extractedText: block.extractedText,
        })),
      })),
      totalPages: layoutData.totalPages,
      totalBlocks: layoutData.totalBlocks,
      markdown: layoutData.markdown,
    }

    // Update database with results
    const { error: updateError } = await supabase
      .from("document_extraction_files")
      .update({
        layout_data: layoutDataForStorage,
        extracted_text: extractedTextData,
        layout_extraction_status: "completed",
        updated_at: new Date().toISOString(),
      })
      .eq("id", fileId)

    if (updateError) {
      console.error(`[document-extraction] Failed to save layout results to database:`, updateError)
      throw new Error(`Database update failed: ${updateError.message}`)
    }

    console.log(`[document-extraction] ✅ Layout extraction completed for ${fileId}`)
    console.log(`[document-extraction] Pages: ${layoutData.totalPages}, Blocks: ${layoutData.totalBlocks}`)

    return { success: true, layoutData: layoutDataForStorage, extractedTextData }
  } catch (error: unknown) {
    const err = error as { message?: string }
    console.error(`[document-extraction] Layout extraction failed:`, error)

    await supabase
      .from("document_extraction_files")
      .update({
        layout_extraction_status: "error",
        layout_error_message: err.message || String(error),
        updated_at: new Date().toISOString(),
      })
      .eq("id", fileId)

    return { success: false, error: err.message || String(error) }
  }
}

/**
 * Main extraction function - runs both Gemini and layout extraction in parallel
 */
export async function extractDocumentFile({ fileId, userId, supabase, extractionMethod = "datalab" }: ExtractFileParams) {
  console.log(`[document-extraction] Starting dual extraction for file ${fileId}`)

  // Get file record
  const { data: fileRecord, error: fetchError } = await supabase
    .from("document_extraction_files")
    .select("*")
    .eq("id", fileId)
    .eq("user_id", userId)
    .single()

  if (fetchError || !fileRecord) {
    throw new Error("File not found")
  }

  // Check if already processing
  if (fileRecord.extraction_status === "processing") {
    console.log(`[document-extraction] Extraction already in progress for ${fileId}`)
    return { message: "Extraction already in progress" }
  }

  // Update overall status to processing
  await supabase
    .from("document_extraction_files")
    .update({
      extraction_status: "processing",
      gemini_extraction_status: "pending",
      layout_extraction_status: "pending",
      updated_at: new Date().toISOString(),
    })
    .eq("id", fileId)

  try {
    // Download file from storage
    const fileUrl = fileRecord.file_url
    if (!fileUrl) {
      throw new Error("File URL not found")
    }

    console.log(`[document-extraction] Downloading file from ${fileUrl}`)
    const fileResponse = await fetch(fileUrl)
    if (!fileResponse.ok) {
      throw new Error(`Failed to fetch file: ${fileResponse.status}`)
    }

    const arrayBuffer = await fileResponse.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const base64 = buffer.toString("base64")
    const mimeType = fileRecord.mime_type || "image/png"
    const fileName = fileRecord.name || "document"

    console.log(`[document-extraction] File downloaded, size: ${Math.round(base64.length * 0.75 / 1024)}KB, type: ${mimeType}`)

    // Run both extraction methods in parallel
    console.log(`[document-extraction] Starting parallel extraction (Gemini full-text + Layout blocks)`)

    const [geminiResult, layoutResult] = await Promise.allSettled([
      runGeminiFullTextExtraction(fileId, base64, mimeType, fileName, supabase),
      runLayoutExtraction(fileId, base64, mimeType, fileName, extractionMethod, supabase),
    ])

    // Determine overall status based on results
    const geminiSuccess = geminiResult.status === 'fulfilled' && geminiResult.value.success
    const layoutSuccess = layoutResult.status === 'fulfilled' && layoutResult.value.success

    let overallStatus: string
    let errorMessage: string | null = null

    if (geminiSuccess && layoutSuccess) {
      overallStatus = "completed"
    } else if (geminiSuccess || layoutSuccess) {
      overallStatus = "completed"
    } else {
      overallStatus = "error"
      const geminiError = geminiResult.status === 'rejected'
        ? (geminiResult.reason as { message?: string })?.message
        : (geminiResult.value as { error?: string })?.error
      const layoutError = layoutResult.status === 'rejected'
        ? (layoutResult.reason as { message?: string })?.message
        : (layoutResult.value as { error?: string })?.error
      errorMessage = `Gemini: ${geminiError || 'unknown'}; Layout: ${layoutError || 'unknown'}`
    }

    // Update overall status
    await supabase
      .from("document_extraction_files")
      .update({
        extraction_status: overallStatus,
        error_message: errorMessage,
        updated_at: new Date().toISOString(),
      })
      .eq("id", fileId)

    console.log(`[document-extraction] ✅ Dual extraction completed for ${fileId}`)
    console.log(`[document-extraction] Gemini: ${geminiSuccess ? 'success' : 'failed'}, Layout: ${layoutSuccess ? 'success' : 'failed'}`)

    return {
      success: overallStatus === "completed",
      file_id: fileId,
      gemini_success: geminiSuccess,
      layout_success: layoutSuccess,
    }
  } catch (extractionError) {
    console.error("[document-extraction] Extraction error:", extractionError)

    // Update status to error
    await supabase
      .from("document_extraction_files")
      .update({
        extraction_status: "error",
        error_message: extractionError instanceof Error ? extractionError.message : String(extractionError),
        updated_at: new Date().toISOString(),
      })
      .eq("id", fileId)

    throw extractionError
  }
}
