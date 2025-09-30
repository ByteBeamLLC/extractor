import { type NextRequest, NextResponse } from "next/server"
import { google } from "@ai-sdk/google"
import { generateText } from "ai"

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
1. Prioritize the drug name (brand or generic) as the primary search term
2. Keep the query concise - use only the most distinctive identifiers
3. Do not include dosage or form in the initial search (we'll filter those later)
4. If you have a brand name, use that; otherwise use the generic name
5. Return ONLY the search query text, nothing else`

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

const DRUG_DETAIL_EXTRACTION_PROMPT = `You are extracting pharmaceutical information from a drug detail page. Extract the following sections if present:

- Description: Product description
- Composition: Detailed composition/ingredients
- How To Use: Usage instructions
- Indication: Medical indications/uses
- Possible Side Effects: Side effects and adverse reactions
- Properties: Pharmaceutical properties
- Storage: Storage instructions
- Review: Any review or additional information

Return a valid JSON object with these keys (use null if section not found):
{
  "description": "string or null",
  "composition": "string or null",
  "howToUse": "string or null",
  "indication": "string or null",
  "possibleSideEffects": "string or null",
  "properties": "string or null",
  "storage": "string or null",
  "review": "string or null"
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
    model: google("gemini-2.0-flash-exp"),
    messages: [{ role: "user", content: parts }],
    temperature: 0.1,
  })

  return tryParseJSON(text)
}

async function generateSearchQuery(drugInfo: any) {
  const { text } = await generateText({
    model: google("gemini-2.0-flash-exp"),
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
    const response = await fetch(detailUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    })
    
    if (!response.ok) {
      throw new Error(`Failed to fetch drug details: ${response.status}`)
    }
    
    const html = await response.text()
    
    return {
      detailUrl,
      html,
    }
  } catch (error) {
    console.error('[pharma] Detail fetch error:', error)
    throw error
  }
}

async function extractDrugDetails(html: string) {
  const { text } = await generateText({
    model: google("gemini-2.0-flash-exp"),
    messages: [
      {
        role: "user",
        content: `${DRUG_DETAIL_EXTRACTION_PROMPT}\n\nHTML Content:\n${html.substring(0, 15000)}`,
      },
    ],
    temperature: 0.1,
  })

  return tryParseJSON(text)
}

async function findBestMatch(originalDrugInfo: any, searchResultsHtml: string, drugIds: string[]) {
  const { text } = await generateText({
    model: google("gemini-2.0-flash-exp"),
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
    const body = await request.json()
    
    console.log("[pharma] Starting drug extraction")
    
    const { imageBase64, extractedText, fileName } = body
    
    if (!imageBase64 && !extractedText) {
      return NextResponse.json(
        { success: false, error: "No image or text provided" },
        { status: 400 }
      )
    }

    // Step 1: Extract drug identifiers from the uploaded file
    console.log("[pharma] Step 1: Extracting drug identifiers...")
    const drugInfo = await extractDrugIdentifiers(imageBase64, extractedText)
    
    if (!drugInfo) {
      return NextResponse.json(
        { success: false, error: "Failed to extract drug information" },
        { status: 500 }
      )
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
      return NextResponse.json({
        success: true,
        drugInfo,
        searchQuery,
        searchUrl: searchResults.searchUrl,
        message: "No drugs found in Saudi FDA database matching the search criteria",
      })
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
      return NextResponse.json({
        success: true,
        drugInfo,
        searchQuery,
        searchUrl: searchResults.searchUrl,
        message: "Found drugs but failed to fetch details",
      })
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
      return NextResponse.json({
        success: true,
        drugInfo,
        searchQuery,
        searchUrl: searchResults.searchUrl,
        matches: matchResult?.matches || [],
        message: "Could not determine best match",
      })
    }

    // Step 6: Extract detailed information from best match
    console.log("[pharma] Step 6: Extracting details from best match...")
    const detailedInfo = await extractDrugDetails(bestMatch.html)
    console.log("[pharma] Extracted detailed info:", JSON.stringify(detailedInfo, null, 2))

    return NextResponse.json({
      success: true,
      drugInfo,
      searchQuery,
      searchUrl: searchResults.searchUrl,
      matchedDrugId: bestMatchId,
      matchedDrugUrl: bestMatch.detailUrl,
      matches: matchResult?.matches || [],
      detailedInfo,
    })

  } catch (error) {
    console.error("[pharma] Extraction error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}
