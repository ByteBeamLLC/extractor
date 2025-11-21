import { type NextRequest, NextResponse } from "next/server"
import { generateText } from "@/lib/openrouter"
import type { SupabaseClient } from "@supabase/supabase-js"

import { createSupabaseServerClient } from "@/lib/supabase/server"
import { upsertJobStatus, type JobMetadata } from "@/lib/jobs/server"
import type { Database } from "@/lib/supabase/types"

export const runtime = 'nodejs'
export const maxDuration = 60

const DRUG_IDENTIFICATION_PROMPT = `You are an expert pharmaceutical data extraction AI. Your task is to analyze pharmaceutical product images, labels, or documents and extract all identifying information about the drug.

Extract the following information if available:
- Drug Name: The brand/trade name and/or generic name of the medication
- Manufacturer/Parent Company: The pharmaceutical company that produces the drug
- Active Ingredient(s): The active pharmaceutical ingredients
- Dosage/Strength: The concentration or strength (e.g., "500mg", "10mg/ml")
- Dosage Form: The physical form (tablets, capsules, syrup, injection, cream, etc.)
- Pack Size: Number of units in the package
- Batch/Lot Number: If visible
- Expiry Date: If visible
- Any other unique identifiers visible on the package

CRITICAL INSTRUCTIONS:
1. Extract information EXACTLY as it appears - do not translate or modify
2. If information is not clearly visible or present, mark it as null
3. Be precise with dosage information as this is critical for drug identification
4. Include both brand name and generic name if both are present
5. Note the dosage form clearly (tablet, capsule, syrup, etc.)

Return your response as a valid JSON object with these keys:
{
  "drugName": "string or null",
  "genericName": "string or null", 
  "manufacturer": "string or null",
  "activeIngredients": "string or null",
  "dosage": "string or null",
  "dosageForm": "string or null",
  "packSize": "string or null",
  "batchNumber": "string or null",
  "expiryDate": "string or null",
  "otherIdentifiers": "string or null"
}`

const DRUG_SEARCH_QUERY_PROMPT = `Based on the extracted drug information, generate the most effective search query to find this drug in the Saudi FDA database.

Rules:
1. **CRITICAL**: The search query MUST be in ENGLISH only - translate any Arabic or other language drug names to English
2. Prioritize the drug name (brand or generic) as the primary search term
3. Keep the query concise - use only the most distinctive identifiers
4. Do not include dosage or form in the initial search (we'll filter those later)
5. If you have a brand name, use that; otherwise use the generic name
6. Return ONLY the search query text in English, nothing else

Example: If drug name is "باراسيتامول", return "Paracetamol"
Example: If drug name is "Aspirin", return "Aspirin"`

const DRUG_MATCHING_PROMPT = `You are an expert at identifying pharmaceutical products. Given:
1. The original extracted drug information from the uploaded file
2. A list of drugs from the Saudi FDA database search results

Your task: Identify which drug(s) from the search results match the original drug based on:
- Exact or similar drug name match
- Same active ingredient(s) if specified
- Matching dosage strength
- Matching dosage form (tablet, capsule, etc.)
- Same manufacturer if specified

Return a JSON object with:
{
  "matches": [
    {
      "drugId": "the drug ID from the search result",
      "confidence": "high|medium|low",
      "reason": "brief explanation of why this matches"
    }
  ],
  "bestMatchId": "the drug ID of the best match, or null if no good match"
}`

const DRUG_DETAIL_EXTRACTION_PROMPT = `You are extracting pharmaceutical information from multiple tabs of a Saudi FDA drug detail page. The content includes:
- Drug Data tab: Basic drug information
- Patient Information Leaflet (PIL) in English: Detailed patient-facing information
- Patient Information Leaflet (PIL) in Arabic: Arabic version of patient information
- Summary of Product Characteristics (SPC): Technical product information

Extract and consolidate the following information from ALL available tabs:

1. **Description**: A comprehensive product description (from any tab)
2. **Composition**: Detailed composition, active ingredients, and excipients (look in SPC, PIL, or Drug Data)
3. **How To Use**: Complete usage instructions, dosage, and administration (from PIL or SPC)
4. **Indication**: Medical indications, therapeutic uses, what the drug is used for (from PIL or SPC)
5. **Possible Side Effects**: All side effects, adverse reactions, contraindications (from PIL or SPC)
6. **Properties**: Pharmaceutical properties, pharmacodynamics, pharmacokinetics (from SPC)
7. **Storage**: Storage conditions and handling instructions (from PIL or SPC)

CRITICAL INSTRUCTIONS:
- Extract comprehensive information by reading ALL tabs
- If the same information appears in multiple languages, prefer the English version
- Combine related information from different tabs into coherent sections
- Be thorough - extract all relevant details for each section
- If a section has no information across all tabs, use null
- Format the text clearly and professionally

Return a valid JSON object with these keys:
{
  "description": "string or null",
  "composition": "string or null",
  "howToUse": "string or null",
  "indication": "string or null",
  "possibleSideEffects": "string or null",
  "properties": "string or null",
  "storage": "string or null"
}`

function tryParseJSON(text: string): any {
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) return null
  try {
    return JSON.parse(jsonMatch[0])
  } catch {
    return null
  }
}

async function extractDrugIdentifiers(imageBase64?: string, extractedText?: string) {
  const parts: any[] = []

  if (extractedText) {
    parts.push({ type: "text", text: `Extracted text from document:\n${extractedText}` })
  }

  if (imageBase64) {
    parts.push({
      type: "image",
      image: imageBase64,
    })
  }

  parts.push({ type: "text", text: DRUG_IDENTIFICATION_PROMPT })

  const { text } = await generateText({
    messages: [{ role: "user", content: parts }],
    temperature: 0.1,
  })

  return tryParseJSON(text)
}

async function generateSearchQuery(drugInfo: any) {
  const { text } = await generateText({
    messages: [
      {
        role: "user",
        content: `${DRUG_SEARCH_QUERY_PROMPT}\n\nDrug Information:\n${JSON.stringify(drugInfo, null, 2)}`,
      },
    ],
    temperature: 0.1,
  })

  return text.trim()
}

async function searchSaudiFDA(query: string) {
  const searchUrl = `https://sdi.sfda.gov.sa/Home/DrugSearch?textFilter=${encodeURIComponent(query)}`

  try {
    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch search results: ${response.status}`)
    }

    const html = await response.text()

    // Extract drug IDs from the HTML
    const drugIdMatches = html.matchAll(/data-drug-id="(\d+)"/g)
    const drugIds = Array.from(drugIdMatches).map(match => match[1])

    // Pass the search results HTML to AI for structured extraction
    // This is more reliable than trying to parse the HTML structure ourselves
    const searchResultsHtml = html.length > 20000 ? html.substring(0, 20000) : html

    return {
      searchUrl,
      drugIds: drugIds.slice(0, 10), // Limit to first 10 results
      searchResultsHtml, // Full HTML for AI parsing
    }
  } catch (error) {
    console.error('[pharma] Search error:', error)
    throw error
  }
}

async function fetchDrugDetails(drugId: string) {
  const detailUrl = `https://sdi.sfda.gov.sa/home/Result?drugId=${drugId}`

  try {
    // Fetch the main detail page (Drug Data tab)
    const mainResponse = await fetch(detailUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    })

    if (!mainResponse.ok) {
      throw new Error(`Failed to fetch drug details: ${mainResponse.status}`)
    }

    const mainHtml = await mainResponse.text()

    // Fetch Patient Information Leaflet (PIL) in English
    const pilEnUrl = `https://sdi.sfda.gov.sa/home/ResultPilEn?drugId=${drugId}`
    const pilEnResponse = await fetch(pilEnUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    }).catch(() => null)
    const pilEnHtml = pilEnResponse?.ok ? await pilEnResponse.text() : ''

    // Fetch Patient Information Leaflet (PIL) in Arabic
    const pilArUrl = `https://sdi.sfda.gov.sa/home/ResultPilAr?drugId=${drugId}`
    const pilArResponse = await fetch(pilArUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    }).catch(() => null)
    const pilArHtml = pilArResponse?.ok ? await pilArResponse.text() : ''

    // Fetch Summary of Product Characteristics (SPC)
    const spcUrl = `https://sdi.sfda.gov.sa/home/ResultSpc?drugId=${drugId}`
    const spcResponse = await fetch(spcUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    }).catch(() => null)
    const spcHtml = spcResponse?.ok ? await spcResponse.text() : ''

    // Combine all tab content
    const combinedContent = `
=== DRUG DATA TAB ===
${mainHtml}

=== PATIENT INFORMATION LEAFLET (ENGLISH) ===
${pilEnHtml}

=== PATIENT INFORMATION LEAFLET (ARABIC) ===
${pilArHtml}

=== SUMMARY OF PRODUCT CHARACTERISTICS (SPC) ===
${spcHtml}
    `.trim()

    console.log(`[pharma] Fetched content from ${drugId}: Main=${mainHtml.length}b, PIL-EN=${pilEnHtml.length}b, PIL-AR=${pilArHtml.length}b, SPC=${spcHtml.length}b`)

    return {
      detailUrl,
      html: combinedContent,
    }
  } catch (error) {
    console.error('[pharma] Detail fetch error:', error)
    throw error
  }
}

async function extractDrugDetails(html: string) {
  // Use more content since we have multiple tabs - Gemini 2.0 can handle large context
  const contentToAnalyze = html.substring(0, 50000)

  const { text } = await generateText({
    messages: [
      {
        role: "user",
        content: `${DRUG_DETAIL_EXTRACTION_PROMPT}\n\nCombined HTML Content from All Tabs:\n${contentToAnalyze}`,
      },
    ],
    temperature: 0.1,
  })

  return tryParseJSON(text)
}

async function findBestMatch(originalDrugInfo: any, searchResultsHtml: string, drugIds: string[]) {
  const { text } = await generateText({
    messages: [
      {
        role: "user",
        content: `${DRUG_MATCHING_PROMPT}\n\nOriginal Drug Info:\n${JSON.stringify(originalDrugInfo, null, 2)}\n\nAvailable Drug IDs:\n${drugIds.join(', ')}\n\nSearch Results HTML (containing drug names, manufacturers, strengths, forms):\n${searchResultsHtml}`,
      },
    ],
    temperature: 0.1,
  })

  return tryParseJSON(text)
}

export async function POST(request: NextRequest) {
  try {
    let supabase: SupabaseClient<Database> | null = null
    let userId: string | null = null
    let jobMeta: JobMetadata | null = null
    const syncJob = async (patch: Parameters<typeof upsertJobStatus>[3]) => {
      if (!supabase || !userId || !jobMeta) return
      try {
        await upsertJobStatus(supabase, userId, jobMeta, patch)
      } catch (syncError) {
        console.error("[pharma] Failed to sync job status:", syncError)
      }
    }

    const body = await request.json()

    if (body?.job && typeof body.job === "object") {
      const rawJob = body.job as Record<string, any>
      const maybeJob: JobMetadata = {
        jobId: typeof rawJob.jobId === "string" ? rawJob.jobId : "",
        schemaId: typeof rawJob.schemaId === "string" ? rawJob.schemaId : "",
        fileName: typeof rawJob.fileName === "string" ? rawJob.fileName : undefined,
        agentType: typeof rawJob.agentType === "string" ? rawJob.agentType : undefined,
        userId: typeof rawJob.userId === "string" ? rawJob.userId : undefined,
      }
      if (maybeJob.jobId && maybeJob.schemaId) {
        jobMeta = maybeJob
      }
    }

    if (jobMeta) {
      try {
        supabase = createSupabaseServerClient()
        const {
          data: { user },
        } = await supabase.auth.getUser()
        userId = user?.id ?? null
      } catch (error) {
        console.warn("[pharma] Unable to initialize Supabase client:", error)
        supabase = null
        userId = null
      }

      if (supabase && userId) {
        await syncJob({ status: "processing", results: null, completedAt: null })
      } else {
        supabase = null
        userId = null
      }
    }

    console.log("[pharma] Starting drug extraction")

    const { imageBase64, extractedText, fileName } = body
    if (fileName && jobMeta) {
      jobMeta.fileName = fileName
    }

    if (!imageBase64 && !extractedText) {
      const responsePayload = { success: false, error: "No image or text provided" }
      await syncJob({
        status: "error",
        completedAt: new Date(),
        errorMessage: responsePayload.error,
      })
      return NextResponse.json(responsePayload, { status: 400 })
    }

    // Step 1: Extract drug identifiers from the uploaded file
    console.log("[pharma] Step 1: Extracting drug identifiers...")
    const drugInfo = await extractDrugIdentifiers(imageBase64, extractedText)

    if (!drugInfo) {
      const responsePayload = { success: false, error: "Failed to extract drug information" }
      await syncJob({
        status: "error",
        completedAt: new Date(),
        errorMessage: responsePayload.error,
      })
      return NextResponse.json(responsePayload, { status: 500 })
    }

    console.log("[pharma] Extracted drug info:", drugInfo)

    // Step 2: Generate search query
    console.log("[pharma] Step 2: Generating search query...")
    const searchQuery = await generateSearchQuery(drugInfo)
    console.log("[pharma] Search query:", searchQuery)

    // Step 3: Search Saudi FDA database
    console.log("[pharma] Step 3: Searching Saudi FDA database...")
    const searchResults = await searchSaudiFDA(searchQuery)
    console.log("[pharma] Found drug IDs:", searchResults.drugIds)

    if (searchResults.drugIds.length === 0) {
      const responsePayload = {
        success: true,
        drugInfo,
        searchQuery,
        searchUrl: searchResults.searchUrl,
        message: "No drugs found in Saudi FDA database matching the search criteria",
      }
      await syncJob({
        status: "completed",
        results: { pharma_data: responsePayload },
        completedAt: new Date(),
      })
      return NextResponse.json(responsePayload)
    }

    // Step 4: For each drug ID, fetch details and try to match
    console.log("[pharma] Step 4: Fetching drug details and matching...")
    const drugDetailsPromises = searchResults.drugIds.slice(0, 5).map(id =>
      fetchDrugDetails(id).catch(err => {
        console.error(`[pharma] Failed to fetch details for drug ${id}:`, err)
        return null
      })
    )

    const allDrugDetails = await Promise.all(drugDetailsPromises)
    const validDrugDetails = allDrugDetails.filter(d => d !== null)

    if (validDrugDetails.length === 0) {
      const responsePayload = {
        success: true,
        drugInfo,
        searchQuery,
        searchUrl: searchResults.searchUrl,
        message: "Found drugs but failed to fetch details",
      }
      await syncJob({
        status: "completed",
        results: { pharma_data: responsePayload },
        completedAt: new Date(),
      })
      return NextResponse.json(responsePayload)
    }

    // Step 5: Find best match using AI
    console.log("[pharma] Step 5: Finding best match...")
    const matchResult = await findBestMatch(
      drugInfo,
      searchResults.searchResultsHtml,
      searchResults.drugIds
    )

    const bestMatchId = matchResult?.bestMatchId || validDrugDetails[0]!.detailUrl.match(/drugId=(\d+)/)?.[1]
    const bestMatch = validDrugDetails.find(d => d!.detailUrl.includes(`drugId=${bestMatchId}`))

    if (!bestMatch) {
      const responsePayload = {
        success: true,
        drugInfo,
        searchQuery,
        searchUrl: searchResults.searchUrl,
        matches: matchResult?.matches || [],
        message: "Could not determine best match",
      }
      await syncJob({
        status: "completed",
        results: { pharma_data: responsePayload },
        completedAt: new Date(),
      })
      return NextResponse.json(responsePayload)
    }

    // Step 6: Extract detailed information from best match
    console.log("[pharma] Step 6: Extracting details from best match...")
    const detailedInfo = await extractDrugDetails(bestMatch.html)
    console.log("[pharma] Extracted detailed info:", JSON.stringify(detailedInfo, null, 2))

    const responsePayload = {
      success: true,
      drugInfo,
      searchQuery,
      searchUrl: searchResults.searchUrl,
      matchedDrugId: bestMatchId,
      matchedDrugUrl: bestMatch.detailUrl,
      matches: matchResult?.matches || [],
      detailedInfo,
    }
    await syncJob({
      status: "completed",
      results: { pharma_data: responsePayload },
      completedAt: new Date(),
    })
    return NextResponse.json(responsePayload)

  } catch (error) {
    console.error("[pharma] Extraction error:", error)
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    await syncJob({
      status: "error",
      completedAt: new Date(),
      errorMessage,
    })
    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 }
    )
  }
}
