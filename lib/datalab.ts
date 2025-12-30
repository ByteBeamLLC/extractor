/**
 * Datalab API Client
 *
 * Provides utilities for calling Datalab API for layout detection and OCR
 * Uses the OCR endpoint for layout detection with bounding boxes
 * Documentation: https://documentation.datalab.to/
 */

// Using native FormData and Blob (Node.js 18+) for compatibility with native fetch

// Datalab API base URL
const DATALAB_API_URL = process.env.DATALAB_API_URL || 'https://www.datalab.to'

interface DatalabChandraInput {
  file: string // base64 encoded file or data URL
  file_name?: string
  mime_type?: string
  output_format?: 'markdown' | 'html' | 'json'
  mode?: 'fast' | 'balanced' | 'accurate' // accurate mode uses Chandra
  max_pages?: number
  page_range?: string
}

interface DatalabChandraOutput {
  markdown?: string
  html?: string
  json?: any // JSON structure with block_type, children, polygon, etc.
  chunks?: any // Chunked output
  blocks?: Array<{
    type: string
    content?: string
    bbox?: [number, number, number, number] // [x, y, width, height]
    [key: string]: any
  }>
  pages?: Array<{
    markdown?: string
    blocks?: Array<any>
    [key: string]: any
  }>
  // Async processing fields
  request_id?: string
  request_check_url?: string
  status?: string
  success?: boolean
  error?: string | null
  // Additional metadata
  metadata?: any
  images?: any
  parse_quality_score?: number
  page_count?: number
  [key: string]: any
}

// OCR endpoint response with text lines and bounding boxes
interface DatalabOCROutput {
  text_lines?: Array<{
    text: string
    bbox: [number, number, number, number] // [x1, y1, x2, y2]
    polygon?: number[][] // [[x1,y1], [x2,y2], ...]
    confidence?: number
    [key: string]: any
  }>
  pages?: Array<{
    page_num: number
    width: number
    height: number
    text_lines: Array<{
      text: string
      bbox: [number, number, number, number]
      polygon?: number[][]
      confidence?: number
      [key: string]: any
    }>
  }>
  // Async processing fields
  request_id?: string
  request_check_url?: string
  status?: string
  success?: boolean
  error?: string | null
  [key: string]: any
}

function getApiKey(): string {
  const apiKey = process.env.DATALAB_API_KEY
  if (!apiKey) {
    console.error('[datalab] DATALAB_API_KEY is not configured')
    throw new Error('DATALAB_API_KEY is not configured. Please set the DATALAB_API_KEY environment variable in your .env file.')
  }
  return apiKey
}

function stripDataUrlPrefix(value: string): string {
  const match = value.match(/^data:([^;]+);base64,(.*)$/)
  if (match) {
    return match[2]
  }
  return value
}

/**
 * Call Datalab Chandra for document conversion and OCR
 * 
 * @param input - File input (base64 or data URL)
 * @param options - Additional options
 * @returns Converted document with markdown, blocks, and structured data
 */
export async function callDatalabChandra(
  input: DatalabChandraInput,
  options?: { timeout?: number }
): Promise<DatalabChandraOutput> {
  const apiKey = getApiKey()
  const timeout = options?.timeout ?? 300_000 // 5 minutes default

  // Prepare file - strip data URL prefix if present
  const fileBase64 = stripDataUrlPrefix(input.file)
  const mimeType = input.mime_type || 'application/pdf'
  
  console.log(`[datalab] Calling Datalab Marker API (Chandra)`)
  console.log(`[datalab] File info:`, {
    fileName: input.file_name,
    mimeType,
    fileSize: Math.round(fileBase64.length * 0.75 / 1024), // Approximate KB
    outputFormat: input.output_format || 'markdown',
    mode: input.mode || 'fast',
  })

  // Prepare file buffer
  const fileBuffer = Buffer.from(fileBase64, 'base64')

  // Create native FormData for multipart/form-data upload (compatible with native fetch)
  const formData = new FormData()

  // Create a Blob from the buffer and append as file
  const blob = new Blob([fileBuffer], { type: mimeType })
  formData.append('file', blob, input.file_name || 'document')

  // Add output format if specified
  if (input.output_format) {
    formData.append('output_format', input.output_format)
  }

  // Add mode - 'accurate' uses Chandra for better layout detection
  if (input.mode) {
    formData.append('mode', input.mode)
  }

  // Add optional parameters
  if (input.max_pages) {
    formData.append('max_pages', input.max_pages.toString())
  }
  if (input.page_range) {
    formData.append('page_range', input.page_range)
  }

  // Correct endpoint from Datalab documentation: POST /api/v1/marker
  const endpoint = `${DATALAB_API_URL}/api/v1/marker`
  
  console.log(`[datalab] Calling Datalab API endpoint: ${endpoint}`)
  
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/deb7f689-6230-4974-97b6-897e8c059ed2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/datalab.ts:95',message:'About to call Datalab API',data:{endpoint,fileName:input.file_name},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'H1'})}).catch(()=>{});
  // #endregion

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'X-API-Key': apiKey, // Datalab uses X-API-Key header, not Authorization: Bearer
      // Note: Don't set Content-Type manually - fetch sets it automatically with correct boundary for FormData
    },
    body: formData,
  })

  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/deb7f689-6230-4974-97b6-897e8c059ed2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/datalab.ts:108',message:'Datalab API response received',data:{status:response.status,ok:response.ok},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'H1'})}).catch(()=>{});
  // #endregion

  if (!response.ok) {
    const errorText = await response.text()
    console.error(`[datalab] API error (${response.status}):`, errorText)
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/deb7f689-6230-4974-97b6-897e8c059ed2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/datalab.ts:115',message:'Datalab API error',data:{status:response.status,errorText},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'H1'})}).catch(()=>{});
    // #endregion
    throw new Error(`Datalab API error (${response.status}): ${errorText}`)
  }

  const result = await response.json()
  console.log(`[datalab] ✅ API response received:`, {
    hasMarkdown: !!result.markdown,
    hasBlocks: !!result.blocks,
    hasPages: !!result.pages,
    hasRequestId: !!result.request_id,
    hasRequestCheckUrl: !!result.request_check_url,
    keys: Object.keys(result),
  })
  
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/deb7f689-6230-4974-97b6-897e8c059ed2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/datalab.ts:128',message:'Datalab API success',data:{hasMarkdown:!!result.markdown,hasBlocks:!!result.blocks,hasRequestId:!!result.request_id},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'H1'})}).catch(()=>{});
  // #endregion

  // Datalab API may return async processing - check if we need to poll
  if (result.request_id && result.request_check_url) {
    console.log(`[datalab] Processing is async, polling for results...`)
    // Poll for results
    const maxPolls = 60 // 5 minutes max (5s intervals)
    let pollCount = 0
    let pollResult = result
    
    while (pollCount < maxPolls) {
      await new Promise(resolve => setTimeout(resolve, 5000)) // Wait 5 seconds
      
      const pollResponse = await fetch(result.request_check_url, {
        headers: {
          'X-API-Key': apiKey,
        },
      })
      
      if (!pollResponse.ok) {
        throw new Error(`Datalab polling error (${pollResponse.status})`)
      }
      
      pollResult = await pollResponse.json()
      
      if (pollResult.status === 'complete') {
        console.log(`[datalab] ✅ Processing completed after ${pollCount + 1} polls`)
        return pollResult as DatalabChandraOutput
      }
      
      if (pollResult.status === 'failed') {
        throw new Error(`Datalab processing failed: ${pollResult.error || 'Unknown error'}`)
      }
      
      pollCount++
      console.log(`[datalab] Polling... (${pollCount}/${maxPolls}) - Status: ${pollResult.status}`)
    }
    
    throw new Error('Datalab processing timed out')
  }

  return result as DatalabChandraOutput
}

/**
 * Call Datalab OCR endpoint for layout detection with bounding boxes
 * This endpoint returns text lines with bbox and polygon coordinates
 *
 * @param input - File input (base64 or data URL)
 * @param options - Additional options
 * @returns OCR results with text lines and bounding boxes
 */
export async function callDatalabOCR(
  input: DatalabOCRInput,
  options?: { timeout?: number }
): Promise<DatalabOCROutput> {
  const apiKey = getApiKey()
  const timeout = options?.timeout ?? 300_000 // 5 minutes default

  // Prepare file - strip data URL prefix if present
  const fileBase64 = stripDataUrlPrefix(input.file)
  const mimeType = input.mime_type || 'application/pdf'

  console.log(`[datalab-ocr] Calling Datalab OCR API for layout detection`)
  console.log(`[datalab-ocr] File info:`, {
    fileName: input.file_name,
    mimeType,
    fileSize: Math.round(fileBase64.length * 0.75 / 1024), // Approximate KB
  })

  // Prepare file buffer
  const fileBuffer = Buffer.from(fileBase64, 'base64')

  // Create native FormData for multipart/form-data upload
  const formData = new FormData()
  const blob = new Blob([fileBuffer], { type: mimeType })
  formData.append('file', blob, input.file_name || 'document')

  // Add optional parameters
  if (input.max_pages) {
    formData.append('max_pages', input.max_pages.toString())
  }
  if (input.page_range) {
    formData.append('page_range', input.page_range)
  }

  // OCR endpoint - provides bbox and polygon coordinates
  const endpoint = `${DATALAB_API_URL}/api/v1/ocr`

  console.log(`[datalab-ocr] Calling Datalab OCR endpoint: ${endpoint}`)

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'X-API-Key': apiKey,
    },
    body: formData,
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error(`[datalab-ocr] API error (${response.status}):`, errorText)
    throw new Error(`Datalab OCR API error (${response.status}): ${errorText}`)
  }

  const result = await response.json()
  console.log(`[datalab-ocr] ✅ API response received:`, {
    hasTextLines: !!result.text_lines,
    hasPages: !!result.pages,
    hasRequestId: !!result.request_id,
    hasRequestCheckUrl: !!result.request_check_url,
    keys: Object.keys(result),
  })

  // Datalab API may return async processing - check if we need to poll
  if (result.request_id && result.request_check_url) {
    console.log(`[datalab-ocr] Processing is async, polling for results...`)
    const maxPolls = 60 // 5 minutes max (5s intervals)
    let pollCount = 0
    let pollResult = result

    while (pollCount < maxPolls) {
      await new Promise(resolve => setTimeout(resolve, 5000)) // Wait 5 seconds

      const pollResponse = await fetch(result.request_check_url, {
        headers: {
          'X-API-Key': apiKey,
        },
      })

      if (!pollResponse.ok) {
        throw new Error(`Datalab OCR polling error (${pollResponse.status})`)
      }

      pollResult = await pollResponse.json()

      console.log(`[datalab-ocr] Poll ${pollCount + 1} result keys:`, Object.keys(pollResult))

      if (pollResult.status === 'complete') {
        console.log(`[datalab-ocr] ✅ Processing completed after ${pollCount + 1} polls`)
        console.log(`[datalab-ocr] Result structure:`, JSON.stringify(pollResult, null, 2).slice(0, 2000))
        return pollResult as DatalabOCROutput
      }

      if (pollResult.status === 'failed') {
        throw new Error(`Datalab OCR processing failed: ${pollResult.error || 'Unknown error'}`)
      }

      pollCount++
      console.log(`[datalab-ocr] Polling... (${pollCount}/${maxPolls}) - Status: ${pollResult.status}`)
    }

    throw new Error('Datalab OCR processing timed out')
  }

  return result as DatalabOCROutput
}

/**
 * Extract layout blocks from Datalab OCR output
 * Converts OCR text lines to layout blocks with bounding boxes
 */
export function extractOCRBlocks(output: DatalabOCROutput): Array<{
  type: string
  text: string
  bbox: [number, number, number, number] // [x, y, width, height]
  polygon?: number[]
  confidence?: number
  pageIndex?: number
  [key: string]: any
}> {
  const blocks: Array<any> = []

  console.log(`[datalab-ocr] Extracting blocks from OCR output:`, {
    hasTextLines: !!output.text_lines,
    textLinesCount: output.text_lines?.length || 0,
    hasPages: !!output.pages,
    pagesCount: output.pages?.length || 0,
    outputKeys: Object.keys(output),
  })

  // Handle direct text_lines array
  if (output.text_lines && Array.isArray(output.text_lines)) {
    output.text_lines.forEach((line, index) => {
      const [x1, y1, x2, y2] = line.bbox || [0, 0, 0, 0]
      blocks.push({
        type: 'TEXT',
        text: line.text || '',
        bbox: [x1, y1, x2 - x1, y2 - y1], // Convert to [x, y, width, height]
        polygon: line.polygon ? line.polygon.flat() : [x1, y1, x2, y1, x2, y2, x1, y2],
        confidence: line.confidence,
        blockIndex: index,
      })
    })
  }

  // Handle pages array with text_lines
  if (output.pages && Array.isArray(output.pages)) {
    output.pages.forEach((page, pageIndex) => {
      if (page.text_lines && Array.isArray(page.text_lines)) {
        page.text_lines.forEach((line, lineIndex) => {
          const [x1, y1, x2, y2] = line.bbox || [0, 0, 0, 0]
          blocks.push({
            type: 'TEXT',
            text: line.text || '',
            bbox: [x1, y1, x2 - x1, y2 - y1], // Convert to [x, y, width, height]
            polygon: line.polygon ? line.polygon.flat() : [x1, y1, x2, y1, x2, y2, x1, y2],
            confidence: line.confidence,
            pageIndex,
            pageWidth: page.width,
            pageHeight: page.height,
            blockIndex: blocks.length,
          })
        })
      }
    })
  }

  console.log(`[datalab-ocr] Extracted ${blocks.length} blocks`)
  if (blocks.length > 0) {
    console.log(`[datalab-ocr] First block:`, blocks[0])
  }

  return blocks
}

/**
 * Recursively extract blocks from Datalab JSON structure
 * The JSON format has nested children with block_type
 */
function extractBlocksFromJson(node: any, pageIndex?: number, depth: number = 0): Array<any> {
  const blocks: Array<any> = []

  if (!node) return blocks

  // Log the node structure at the first level for debugging
  if (depth === 0) {
    console.log("[datalab] Root node keys:", Object.keys(node))
    console.log("[datalab] Sample node structure:", JSON.stringify(node, null, 2).slice(0, 2000))
  }

  // If this node has a block_type, it's a block
  if (node.block_type) {
    const block: any = {
      type: node.block_type,
      content: node.html || node.markdown || node.text || '',
      html: node.html,
      markdown: node.markdown,
    }

    // Datalab provides polygon as [[x1,y1], [x2,y2], [x3,y3], [x4,y4]] - nested array format
    // and bbox as [x1, y1, x2, y2] - NOT [x, y, width, height]

    // Log first few blocks' bbox info for debugging
    if (blocks.length < 5) {
      console.log(`[datalab] Block ${blocks.length} (${node.block_type}):`, {
        hasPolygon: !!node.polygon,
        hasBbox: !!node.bbox,
        polygonValue: node.polygon,
        bboxValue: node.bbox,
        nodeKeys: Object.keys(node),
      })
    }

    // Process polygon - format is [[x1,y1], [x2,y2], [x3,y3], [x4,y4]]
    if (node.polygon && Array.isArray(node.polygon) && node.polygon.length >= 4) {
      let xs: number[] = []
      let ys: number[] = []

      // Check if it's nested array [[x,y], [x,y], ...] or flat [x, y, x, y, ...]
      if (Array.isArray(node.polygon[0])) {
        // Nested array format [[x,y], [x,y], ...]
        xs = node.polygon.map((p: number[]) => p[0])
        ys = node.polygon.map((p: number[]) => p[1])
        // Store as flat array for consistency
        block.polygon = node.polygon.flat()
      } else {
        // Flat array format [x, y, x, y, ...]
        xs = node.polygon.filter((_: number, i: number) => i % 2 === 0)
        ys = node.polygon.filter((_: number, i: number) => i % 2 === 1)
        block.polygon = node.polygon
      }

      if (xs.length > 0 && ys.length > 0) {
        const minX = Math.min(...xs)
        const minY = Math.min(...ys)
        const maxX = Math.max(...xs)
        const maxY = Math.max(...ys)
        // Store bbox as [x, y, width, height] for our UI
        block.bbox = [minX, minY, maxX - minX, maxY - minY]
      }
    }
    // Fallback to bbox if no polygon - Datalab bbox is [x1, y1, x2, y2]
    else if (node.bbox && Array.isArray(node.bbox) && node.bbox.length === 4) {
      const [x1, y1, x2, y2] = node.bbox
      // Convert from [x1, y1, x2, y2] to [x, y, width, height]
      block.bbox = [x1, y1, x2 - x1, y2 - y1]
      // Create polygon from bbox corners
      block.polygon = [x1, y1, x2, y1, x2, y2, x1, y2]
    }

    if (pageIndex !== undefined) {
      block.pageIndex = pageIndex
    }

    // Add any additional properties
    if (node.id) block.id = node.id
    if (node.section_hierarchy) block.section_hierarchy = node.section_hierarchy

    blocks.push(block)
  }

  // Recursively process children
  if (Array.isArray(node.children)) {
    for (const child of node.children) {
      blocks.push(...extractBlocksFromJson(child, pageIndex, depth + 1))
    }
  }

  return blocks
}

/**
 * Extract layout blocks from Datalab Chandra output
 */
export function extractLayoutBlocks(output: DatalabChandraOutput): Array<{
  type: string
  content?: string
  bbox?: [number, number, number, number]
  [key: string]: any
}> {
  console.log("[datalab] Extracting blocks from output:", {
    hasBlocks: Array.isArray(output.blocks),
    blocksLength: Array.isArray(output.blocks) ? output.blocks.length : 0,
    hasJson: !!output.json,
    hasMarkdown: !!output.markdown,
    hasPages: Array.isArray(output.pages),
    outputKeys: Object.keys(output),
  })

  // Check for json field first (block-level structured data)
  if (output.json) {
    console.log("[datalab] Found json field, extracting blocks from JSON structure")

    // The json field can be a string or object
    let jsonData = output.json
    if (typeof jsonData === 'string') {
      try {
        jsonData = JSON.parse(jsonData)
      } catch (e) {
        console.error("[datalab] Failed to parse json field:", e)
      }
    }

    // Log the structure to understand the format
    console.log("[datalab] JSON data type:", typeof jsonData, Array.isArray(jsonData) ? 'array' : '')
    if (jsonData && typeof jsonData === 'object') {
      console.log("[datalab] JSON top-level keys:", Object.keys(jsonData))
      if (Array.isArray(jsonData) && jsonData.length > 0) {
        console.log("[datalab] First element keys:", Object.keys(jsonData[0]))
      }
    }

    // Extract blocks from the JSON structure
    if (jsonData) {
      // Handle array of pages
      if (Array.isArray(jsonData)) {
        const allBlocks: Array<any> = []
        jsonData.forEach((page: any, pageIndex: number) => {
          allBlocks.push(...extractBlocksFromJson(page, pageIndex))
        })
        if (allBlocks.length > 0) {
          console.log("[datalab] Extracted", allBlocks.length, "blocks from JSON array")
          return allBlocks
        }
      }
      // Handle single page/document
      else if (typeof jsonData === 'object') {
        const blocks = extractBlocksFromJson(jsonData)
        if (blocks.length > 0) {
          console.log("[datalab] Extracted", blocks.length, "blocks from JSON object")
          return blocks
        }
      }
    }
  }

  // If we have blocks directly, use them
  if (Array.isArray(output.blocks) && output.blocks.length > 0) {
    console.log("[datalab] Returning blocks array:", output.blocks.length, "blocks")
    return output.blocks
  }

  // If we have pages with blocks, extract from pages
  if (Array.isArray(output.pages) && output.pages.length > 0) {
    const allBlocks: Array<any> = []
    output.pages.forEach((page, pageIndex) => {
      if (Array.isArray(page.blocks)) {
        allBlocks.push(...page.blocks.map((block: any) => ({
          ...block,
          pageIndex,
        })))
      } else if (page.markdown) {
        allBlocks.push({
          type: 'TEXT',
          content: page.markdown,
          pageIndex,
        })
      }
    })
    if (allBlocks.length > 0) {
      console.log("[datalab] Returning blocks from pages:", allBlocks.length, "blocks")
      return allBlocks
    }
  }

  // If we have markdown, return a single text block
  if (output.markdown) {
    console.log("[datalab] No blocks found, using markdown as single text block")
    return [{
      type: 'TEXT',
      content: output.markdown,
    }]
  }

  // If we have HTML, try to extract text from it
  if (output.html) {
    console.log("[datalab] No blocks or markdown, using HTML")
    // Extract text from HTML (basic extraction)
    const textContent = output.html.replace(/<[^>]*>/g, '').trim()
    if (textContent) {
      return [{
        type: 'TEXT',
        content: textContent,
      }]
    }
  }

  console.warn("[datalab] No blocks, markdown, or HTML found in output")
  return []
}

