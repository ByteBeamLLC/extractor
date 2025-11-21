import { type NextRequest, NextResponse } from "next/server"
import { generateText } from "@/lib/openrouter"
import type { SupabaseClient } from "@supabase/supabase-js"

import { createSupabaseServerClient } from "@/lib/supabase/server"
import { upsertJobStatus, type JobMetadata } from "@/lib/jobs/server"
import type { Database } from "@/lib/supabase/types"

export const runtime = 'nodejs'
export const maxDuration = 60

const EXTRACTION_PROMPT = `You are an expert data extraction AI. Your primary function is to extract information from OCR output from food and beverage packaging with extreme accuracy and provide a structured JSON output. Adherence to the following rules is critical for success.

Multilingual Processing Protocol
This protocol is the most critical step. Follow it precisely to avoid language errors.

Identify All Languages: First, scan the document to identify all available languages.

Establish Primary Language:

If English is present, it

must be used as the primary language for extraction.

If English is not present, identify the most dominant language on the packaging and set it as the primary language.

Primary Language Extraction: Perform the initial data extraction using only the text from the established primary language. Do not mix content from other languages in this step.

Fill Gaps from Secondary Languages: Only if a specific required field is completely missing in the primary language, you may look for that specific piece of information in a secondary language to fill the gap.

Do not merge or combine text from multiple languages into a single field.

No Translation: Your task is to extract, not translate. All extracted text in the JSON output must be exactly as it appears in the source language. A separate process will handle translation.

Field-Specific Extraction Rules (To Prevent Contamination)
To ensure data accuracy, follow these rules for specific JSON fields:

productName:

Extract: The specific name of the product.

Exclude: Do not include the brand name, manufacturer name, or any descriptive text in this field. These belong in other fields.

productDescription:

Extract: A concise, official description of the product.

Exclude: Do not include the company's history, marketing slogans, ingredient lists, or storage instructions. Keep it focused on what the product is.

ingredients:

Extract: The complete list of ingredients exactly as written.

Exclude: Do not rephrase, translate, or omit any part of the listed ingredients.

barcode:

Extract: The product's barcode number.

Sanitize: Ensure the output contains only digits. Remove any spaces, hyphens, quotes, or other non-numeric characters.

storageInformation:

Extract: Only instructions directly related to storing the product (e.g., "Keep refrigerated," "Store in a cool, dry place").

Exclude: Do not include preparation instructions or general company information.

weightInformation:

Extract: The net weight of the product.

Format: Ensure the unit of measurement (e.g., g, kg, ml, l) is included.

Product Classification Rules (Refined for Accuracy)
You are a product classifier. Your task is to determine which categories a product belongs to based on its ingredients. Follow these rules strictly. A product can belong to multiple categories; list all that apply, separated by commas.

banned
A product is banned if it contains any of the following:

Pork and its derivatives (Bacon, Lard, Pepsin, Pork, Ham, etc.).

Alcohol and alcoholic beverages (Alcohol, Wine, Beer, etc.).

If a product is banned, assign no other categories.

fish_certificate_required
A product is

also categorized as fish_certificate_required if it is not banned and contains any fish or seafood product (Fish, Salmon, Anchovy, Tuna, Shrimp, etc.).

organic_certificate_required
A product is

also categorized as organic_certificate_required if it is not banned and its packaging includes terms like "Bio," "Organic," or "Organic farming".

products_need_carrefour_permission
A product is

also categorized as products_need_carrefour_permission if it is not banned and contains Vinegar or products made with vinegar.

halal_certificate_required
A product is also categorized as halal_certificate_required if it is not banned and contains any of the following:

Meat and poultry (Meat, Chicken, Turkey, Mortadella, Beef, Lamb, etc.).

Specific processed ingredients of uncertain origin (Gelatin, Glycerol, Mono and Diglycerides, Rennet, Whey, etc.).

Clarification: Simple, unprocessed ingredients like milk, eggs, or nuts on their own do not trigger this category. This rule is for complex ingredients or animal products where the processing method is key.

If a product is already in

fish_certificate_required, it should also be added to this category.

ok
A product is

ok if it is not banned and does not match any of the other certificate/permission categories above.

Final JSON Output Generation
Construct the final JSON object according to the schema. Before outputting, perform a final review:

Ensure every field is populated correctly based on the rules above.

If information for a non-critical field is not available, leave it as an empty string or array as required by the schema.

Verify that there is no language mixing, field contamination, or formatting errors.

JSON
{{
"product_initial_language":{{
"barcode": "[Sanitized barcode, digits only]",
"productName": "[Extracted product name, brand excluded]",
"manufacturer": {{
"name": "[Manufacturer's name]",
"location": "[Manufacturer's location]",
"additionalInfo": "[Any additional manufacturer info]",
"country": "[Manufacturer's country]"
}},
"productDescription": "[Concise product description, no story/slogans]",
"ingredients": [
"[Ingredient 1 As it is]",
"[Ingredient 2 As it is]",
"... (continue as needed As it is)"
],
"servingSizeInformation": {{
"servingSize": "[Serving size]",
"servingSizeUnit": "[Serving size unit wether g or ml]",
"servingsPerContainer": "[Number of servings per container]"
}},
"nutritionalInformationPer100g": {{
"energyPer100g": {{
"kj": "[Energy in kj per 100g]",
"kcal": "[Energy in kcal per 100g]"
}},
"fatPer100g": "[Fat content per 100g]",
"saturatesPer100g": "[Saturates content per 100g]",
"carbohydratePer100g": "[Carbohydrate content per 100g]",
"sugarsPer100g": "[Sugars content per 100g]",
"fiberPer100g": "[Fibre content per 100g]",
"proteinPer100g": "[Protein content per 100g]",
"saltPer100g": "[Salt content per 100g]",
"sodiumPer100g": "[Sodium content per 100g]",
"cholesterolPer100g": "[Cholesterol content per 100g]",
"transFatPer100g": "[Trans Fat content per 100g]",
"includesAddedSugarPer100g": "[Added Sugar content per 100g]"
}},
"storageInformation": "[Storage instructions only]",
"usageInformation": "[Usage instructions]",
"allergyInformation": [
"[Allergen 1]",
"[Allergen 2]",
"... (continue as needed)"
],
"weightInformation": {{
"netWeight": "[Net weight with unit]",
"packagingWeight": "[Packaging weight if available]"
}},
"productStatus": "[List of product categories based on the refined criteria, separated by commas]",
"productStatusReason": "[Clear reasoning for why each category was chosen based on the refined rules. Example: 'halal_certificate_required due to presence of Gelatin. fish_certificate_required due to Salmon.']"
}}
}}`

function tryParseJSON(text: string): any | null {
  try {
    return JSON.parse(text)
  } catch { }
  const start = text.indexOf("{")
  const end = text.lastIndexOf("}")
  if (start >= 0 && end > start) {
    const slice = text.slice(start, end + 1)
    try { return JSON.parse(slice) } catch { }
  }
  return null
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
      } catch (error) {
        console.error('[fnb] Failed to sync job status:', error)
      }
    }

    const contentType = request.headers.get('content-type') || ''
    let bytes: Uint8Array
    let fileName = 'document'
    let fileType = 'application/octet-stream'

    if (contentType.includes('application/json')) {
      const body = await request.json()
      if (body?.job && typeof body.job === 'object') {
        const rawJob = body.job as Record<string, any>
        const maybeJob: JobMetadata = {
          jobId: typeof rawJob.jobId === 'string' ? rawJob.jobId : '',
          schemaId: typeof rawJob.schemaId === 'string' ? rawJob.schemaId : '',
          fileName: typeof rawJob.fileName === 'string' ? rawJob.fileName : undefined,
          agentType: typeof rawJob.agentType === 'string' ? rawJob.agentType : undefined,
          userId: typeof rawJob.userId === 'string' ? rawJob.userId : undefined,
        }
        if (maybeJob.jobId && maybeJob.schemaId) {
          jobMeta = maybeJob
        }
      }
      const file = body.file
      if (!file || !file.data) return NextResponse.json({ success: false, error: "Missing file" }, { status: 400 })
      const binary = Buffer.from(file.data, "base64")
      bytes = new Uint8Array(binary)
      fileName = file.name || fileName
      fileType = file.type || fileType
      if (jobMeta) {
        jobMeta.fileName = fileName
        try {
          supabase = createSupabaseServerClient()
          const {
            data: { user },
          } = await supabase.auth.getUser()
          userId = user?.id ?? null
        } catch (error) {
          console.warn('[fnb] Unable to initialize Supabase client:', error)
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
    } else {
      // Accept raw binary uploads to avoid base64 bloat and 413 errors
      const ab = await request.arrayBuffer()
      bytes = new Uint8Array(ab)
      fileName = request.headers.get('x-file-name') || fileName
      fileType = contentType || fileType
    }
    const isImage = fileType.startsWith("image/") || /\.(png|jpg|jpeg|gif|bmp|webp)$/i.test(fileName)

    let text: string
    if (isImage) {
      const base64 = Buffer.from(bytes).toString("base64")
      const mimeType = fileType || "image/png"
      const { text: out } = await generateText({
        temperature: 0.2,
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: EXTRACTION_PROMPT },
              { type: "image_url", image_url: { url: `data:${mimeType};base64,${base64}` } },
            ],
          },
        ],
      })
      text = out
    } else {
      const docText = new TextDecoder().decode(bytes)
      const { text: out } = await generateText({
        temperature: 0.2,
        messages: [{ role: "user", content: `${EXTRACTION_PROMPT}\n\nDocument:\n${docText}` }],
      })
      text = out
    }

    const parsed = tryParseJSON(text)
    if (!parsed) {
      await syncJob({
        status: "error",
        completedAt: new Date(),
        errorMessage: "Failed to parse JSON",
      })
      return NextResponse.json({ success: false, error: "Failed to parse JSON" }, { status: 200 })
    }

    await syncJob({
      results: { fnb_extraction: parsed },
    })
    return NextResponse.json({ success: true, data: parsed })
  } catch (e) {
    console.error("[fnb] extract error", e)
    const errorMessage = e instanceof Error ? e.message : "Unknown error"
    await syncJob({
      status: "error",
      completedAt: new Date(),
      errorMessage,
    })
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 })
  }
}
