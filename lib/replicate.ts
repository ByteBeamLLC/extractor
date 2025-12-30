/**
 * Replicate API Client
 *
 * Provides utilities for calling Replicate API, specifically for dots.ocr model
 */

const REPLICATE_API_URL = 'https://api.replicate.com/v1'
const DOTS_OCR_MODEL = 'sljeff/dots.ocr'
const REAL_ESRGAN_MODEL = 'nightmareai/real-esrgan'
const modelVersionCache = new Map<string, string>()

// The prompt for dots.ocr to get structured layout information with bounding boxes
// Optimized for major content blocks rather than granular elements
const DOTS_OCR_LAYOUT_PROMPT = `Please output the major content regions from this document image, including each region's bbox, its category, and the corresponding text content within the bbox.

1. Bbox format: [x1, y1, x2, y2]

2. Categories: The possible categories are ['Title', 'Text', 'Table', 'Picture', 'Formula'].

3. Grouping Rules:
    - Group related content together into unified blocks
    - Lists (bullet points, numbered items) should be a SINGLE Text block, not separate items
    - Consecutive paragraphs on the same topic should be merged into one Text block
    - Section headers and their content can be grouped together
    - Only create separate blocks for visually distinct major regions

4. Text Extraction & Formatting Rules:
    - Picture: For the 'Picture' category, the text field should be omitted.
    - Formula: Format its text as LaTeX.
    - Table: Format its text as HTML (include the full table structure).
    - Text/Title: Format as Markdown (preserve lists, headers, formatting).

5. Constraints:
    - The output text must be the original text from the image, with no translation.
    - All content regions must be sorted according to human reading order.
    - Aim for fewer, larger blocks rather than many small ones.

6. Final Output: The entire output must be a single JSON object.`

interface ReplicateDotsOcrInput {
  image: string // base64 encoded image or data URL
  file_name?: string
  mime_type?: string
}

// Block structure from dots.ocr with layout prompt
interface DotsOcrBlock {
  bbox: [number, number, number, number] // [x1, y1, x2, y2]
  category: 'Title' | 'Text' | 'Table' | 'Picture' | 'Formula'
  text?: string // Omitted for Picture category
}

interface ReplicateDotsOcrOutput {
  markdown?: string
  blocks?: Array<{
    type: string
    content?: string
    text?: string
    bbox?: [number, number, number, number] // [x, y, width, height] - converted from [x1, y1, x2, y2]
    originalBbox?: [number, number, number, number] // Original [x1, y1, x2, y2] format
    category?: string
    [key: string]: any
  }>
  rawOutput?: string // Raw JSON string from API
  [key: string]: any
}

interface ReplicatePrediction {
  id: string
  status: 'starting' | 'processing' | 'succeeded' | 'failed' | 'canceled'
  output?: any
  error?: string
  urls?: {
    get?: string
    cancel?: string
  }
}

interface ReplicateRealEsrganInput {
  image: string // base64 encoded image or data URL
  mime_type?: string
  scale?: number
}

interface ReplicateRealEsrganOutput {
  imageUrl: string
  rawOutput?: any
}

function getApiKey(): string {
  const apiKey = process.env.REPLICATE_API_TOKEN || process.env.REPLICATE_API_KEY
  if (!apiKey) {
    throw new Error('REPLICATE_API_TOKEN is not configured. Please set the REPLICATE_API_TOKEN environment variable.')
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

async function getLatestModelVersion(modelSlug: string): Promise<string> {
  const cached = modelVersionCache.get(modelSlug)
  if (cached) return cached

  try {
    const modelResponse = await fetch(`${REPLICATE_API_URL}/models/${modelSlug}/versions`, {
      headers: {
        'Authorization': `Token ${getApiKey()}`,
      },
    })

    if (!modelResponse.ok) {
      const errorText = await modelResponse.text()
      throw new Error(`Failed to fetch model versions (${modelResponse.status}): ${errorText}`)
    }

    const versionsData = await modelResponse.json()
    const latestVersion = versionsData.results?.[0]?.id
    if (!latestVersion) {
      throw new Error('No versions found for model')
    }

    modelVersionCache.set(modelSlug, latestVersion)
    return latestVersion
  } catch (error) {
    console.error('[replicate] Error fetching model version:', error)
    throw new Error(`Failed to get model version: ${error instanceof Error ? error.message : String(error)}`)
  }
}

/**
 * Call Replicate dots.ocr model for layout extraction
 * 
 * @param input - Image input (base64 or data URL)
 * @param options - Additional options
 * @returns Layout blocks and markdown from dots.ocr
 */
export async function callDotsOcr(
  input: ReplicateDotsOcrInput,
  options?: { timeout?: number }
): Promise<ReplicateDotsOcrOutput> {
  const apiKey = getApiKey()
  const timeout = options?.timeout ?? 600_000 // 10 minutes default (increased from 5 minutes)

  // Prepare image - strip data URL prefix if present
  const imageBase64 = stripDataUrlPrefix(input.image)

  // Get the latest version of the model
  const modelVersion = await getLatestModelVersion(DOTS_OCR_MODEL)

  // Create prediction using the version hash
  const createResponse = await fetch(`${REPLICATE_API_URL}/predictions`, {
    method: 'POST',
    headers: {
      'Authorization': `Token ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      version: modelVersion,
      input: {
        image: `data:${input.mime_type || 'image/png'};base64,${imageBase64}`,
        prompt: DOTS_OCR_LAYOUT_PROMPT,
      },
    }),
  })

  if (!createResponse.ok) {
    const errorText = await createResponse.text()
    throw new Error(`Replicate API error (${createResponse.status}): ${errorText}`)
  }

  const prediction: ReplicatePrediction = await createResponse.json()

  // Poll for completion
  const startTime = Date.now()
  let currentPrediction = prediction
  let pollCount = 0

  while (currentPrediction.status === 'starting' || currentPrediction.status === 'processing') {
    const elapsed = Date.now() - startTime
    if (elapsed > timeout) {
      throw new Error(`Replicate prediction timed out after ${Math.round(elapsed / 1000)}s (limit: ${Math.round(timeout / 1000)}s)`)
    }

    pollCount++
    // Log progress every 10 polls (roughly every 10-20 seconds)
    if (pollCount % 10 === 0) {
      console.log(`[replicate] Still processing... (${Math.round(elapsed / 1000)}s elapsed, status: ${currentPrediction.status})`)
    }

    // Wait before polling - increase wait time as processing continues
    const waitTime = currentPrediction.status === 'processing' ? 2000 : 1000 // Poll every 2s when processing, 1s when starting
    await new Promise(resolve => setTimeout(resolve, waitTime))

    if (!currentPrediction.urls?.get) {
      throw new Error('Replicate prediction missing get URL')
    }

    const getResponse = await fetch(currentPrediction.urls.get, {
      headers: {
        'Authorization': `Token ${apiKey}`,
      },
    })

    if (!getResponse.ok) {
      const errorText = await getResponse.text()
      throw new Error(`Replicate API error (${getResponse.status}): ${errorText}`)
    }

    currentPrediction = await getResponse.json()

    if (currentPrediction.status === 'failed' || currentPrediction.status === 'canceled') {
      throw new Error(
        currentPrediction.error || `Replicate prediction ${currentPrediction.status}`
      )
    }
  }

  if (currentPrediction.status !== 'succeeded' || !currentPrediction.output) {
    throw new Error(`Replicate prediction did not succeed: ${currentPrediction.status}`)
  }

  // Parse the output - dots.ocr with layout prompt returns a JSON string
  const rawOutput = currentPrediction.output
  console.log("[replicate] Raw output from dots.ocr:", typeof rawOutput, rawOutput)

  // Try to parse the output as JSON
  let parsedBlocks: DotsOcrBlock[] = []
  let rawOutputString = ""

  if (typeof rawOutput === 'string') {
    rawOutputString = rawOutput
    try {
      // The output might be a JSON array string
      const parsed = JSON.parse(rawOutput)
      if (Array.isArray(parsed)) {
        parsedBlocks = parsed
      } else if (parsed && typeof parsed === 'object') {
        // Might be wrapped in an object
        parsedBlocks = parsed.blocks || parsed.elements || [parsed]
      }
    } catch (parseError) {
      console.warn("[replicate] Could not parse output as JSON:", parseError)
      // Return as markdown if not valid JSON
      return {
        markdown: rawOutput,
        blocks: [],
        rawOutput: rawOutput,
      }
    }
  } else if (Array.isArray(rawOutput)) {
    parsedBlocks = rawOutput as DotsOcrBlock[]
    rawOutputString = JSON.stringify(rawOutput)
  } else if (rawOutput && typeof rawOutput === 'object') {
    // Handle object response
    rawOutputString = JSON.stringify(rawOutput)
    if (Array.isArray((rawOutput as any).blocks)) {
      parsedBlocks = (rawOutput as any).blocks
    } else if (Array.isArray((rawOutput as any).elements)) {
      parsedBlocks = (rawOutput as any).elements
    }
  }

  console.log("[replicate] Parsed blocks:", parsedBlocks.length, "blocks")

  // Convert blocks to our format with bbox conversion from [x1, y1, x2, y2] to [x, y, width, height]
  const convertedBlocks = parsedBlocks.map((block) => {
    const [x1, y1, x2, y2] = block.bbox || [0, 0, 0, 0]
    const convertedBbox: [number, number, number, number] = [
      x1,           // x
      y1,           // y
      x2 - x1,      // width
      y2 - y1,      // height
    ]

    return {
      type: block.category || 'TEXT',
      content: block.text,
      text: block.text,
      bbox: convertedBbox,
      originalBbox: block.bbox,
      category: block.category,
    }
  })

  return {
    markdown: undefined,
    blocks: convertedBlocks,
    rawOutput: rawOutputString,
  }
}

/**
 * Extract layout blocks from dots.ocr output
 */
export function extractLayoutBlocks(output: ReplicateDotsOcrOutput): Array<{
  type: string
  content?: string
  bbox?: [number, number, number, number]
  [key: string]: any
}> {
  console.log("[replicate] Extracting blocks from output:", {
    hasBlocks: Array.isArray(output.blocks),
    blocksLength: Array.isArray(output.blocks) ? output.blocks.length : 0,
    hasMarkdown: !!output.markdown,
    outputKeys: Object.keys(output),
  })

  if (Array.isArray(output.blocks) && output.blocks.length > 0) {
    console.log("[replicate] Returning blocks array:", output.blocks.length, "blocks")
    return output.blocks
  }

  // Try to extract blocks from other possible structures
  if (output.markdown) {
    console.log("[replicate] No blocks found, using markdown as single text block")
    // If we only have markdown, return a single text block
    return [{
      type: 'TEXT',
      content: output.markdown,
    }]
  }

  console.warn("[replicate] No blocks or markdown found in output")
  return []
}

/**
 * Call Replicate Real-ESRGAN model for image upscaling
 *
 * @param input - Image input (base64 or data URL)
 * @param options - Additional options
 * @returns Upscaled image URL
 */
export async function callRealEsrgan(
  input: ReplicateRealEsrganInput,
  options?: { timeout?: number }
): Promise<ReplicateRealEsrganOutput> {
  const apiKey = getApiKey()
  const timeout = options?.timeout ?? 600_000 // 10 minutes default

  const imageBase64 = stripDataUrlPrefix(input.image)
  const modelVersion = await getLatestModelVersion(REAL_ESRGAN_MODEL)
  const mimeType = input.mime_type || 'image/png'

  const createResponse = await fetch(`${REPLICATE_API_URL}/predictions`, {
    method: 'POST',
    headers: {
      'Authorization': `Token ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      version: modelVersion,
      input: {
        image: `data:${mimeType};base64,${imageBase64}`,
        scale: input.scale ?? 2,
      },
    }),
  })

  if (!createResponse.ok) {
    const errorText = await createResponse.text()
    throw new Error(`Replicate API error (${createResponse.status}): ${errorText}`)
  }

  const prediction: ReplicatePrediction = await createResponse.json()

  const startTime = Date.now()
  let currentPrediction = prediction
  let pollCount = 0

  while (currentPrediction.status === 'starting' || currentPrediction.status === 'processing') {
    const elapsed = Date.now() - startTime
    if (elapsed > timeout) {
      throw new Error(`Replicate prediction timed out after ${Math.round(elapsed / 1000)}s (limit: ${Math.round(timeout / 1000)}s)`)
    }

    pollCount++
    if (pollCount % 10 === 0) {
      console.log(`[replicate] Real-ESRGAN still processing... (${Math.round(elapsed / 1000)}s elapsed, status: ${currentPrediction.status})`)
    }

    const waitTime = currentPrediction.status === 'processing' ? 2000 : 1000
    await new Promise(resolve => setTimeout(resolve, waitTime))

    if (!currentPrediction.urls?.get) {
      throw new Error('Replicate prediction missing get URL')
    }

    const getResponse = await fetch(currentPrediction.urls.get, {
      headers: {
        'Authorization': `Token ${apiKey}`,
      },
    })

    if (!getResponse.ok) {
      const errorText = await getResponse.text()
      throw new Error(`Replicate API error (${getResponse.status}): ${errorText}`)
    }

    currentPrediction = await getResponse.json()

    if (currentPrediction.status === 'failed' || currentPrediction.status === 'canceled') {
      throw new Error(
        currentPrediction.error || `Replicate prediction ${currentPrediction.status}`
      )
    }
  }

  if (currentPrediction.status !== 'succeeded' || !currentPrediction.output) {
    throw new Error(`Replicate prediction did not succeed: ${currentPrediction.status}`)
  }

  const rawOutput = currentPrediction.output
  let imageUrl: string | undefined

  if (typeof rawOutput === 'string') {
    imageUrl = rawOutput
  } else if (Array.isArray(rawOutput)) {
    imageUrl = rawOutput.find(value => typeof value === 'string')
  } else if (rawOutput && typeof rawOutput === 'object') {
    if (typeof (rawOutput as any).image === 'string') imageUrl = (rawOutput as any).image
  }

  if (!imageUrl) {
    throw new Error('Real-ESRGAN output did not include an image URL')
  }

  return {
    imageUrl,
    rawOutput,
  }
}
