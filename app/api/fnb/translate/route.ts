import { type NextRequest, NextResponse } from "next/server"
import { google } from "@ai-sdk/google"
import { generateText } from "ai"

export const runtime = 'nodejs'
export const maxDuration = 60

const TRANSLATION_PROMPT = `You are an expert multilingual translator specializing in localizing food and retail product information for English and Arabic markets. Your task is to take a JSON object in a source language and accurately translate its values to create two new JSON objects: one for English and one for Arabic.

Your translations must be accurate, natural, and context-aware, as if they were written for a real product package.

Core Translation Rules

Follow these rules for all translations:

Translation Workflow: The input JSON will be in a single source language (e.g., French, English, Italian). You must translate the values from this source language into both English and Arabic.

Natural Fluency: Avoid overly literal or robotic translations. The goal is to produce fluent, natural-sounding text suitable for a consumer product. Refer to the product name examples for the desired tone.

Translate Values Only: Keep all JSON keys exactly as they are in the schema. Only translate the string values associated with those keys.

Units of Measurement: This is a critical rule. Always translate units of measurement to their standard Arabic equivalents.

g (gram) → غ

kg (kilogram) → كغ

ml (milliliter) → مل

l (liter) → ل

Numerals: Keep all numbers (e.g., 100, 3.5, 75%) in their original Western Arabic numeral format. Do not convert them to Eastern Arabic script (e.g., ١, ٢, ٣).

Field-Specific Translation and Transliteration

Different fields require different approaches.

For productName and productDescription:

Translate the full meaning to create a descriptive and appealing name/description.

Use the provided examples as a reference for style and quality.

For manufacturer name:

Transliterate the English or foreign proper noun into its common Arabic phonetic equivalent. The goal is to represent the pronunciation accurately for Arabic speakers.

Refer to the provided transliteration examples (e.g.,

Carrefour → كارفور, Nestle → نستله).

For ingredients and allergyInformation:

Ensure

every single item in the list is translated into both English and Arabic. Do not leave any items untranslated.

If a specific glossary of terms is provided, use its corresponding values as the highest priority for translation.

For country and location:

Translate country and city names to their standard, commonly known English and Arabic equivalents (e.g., "France" → "فرنسا", "España" -> "Spain" -> "إسبانيا").

JSON Output Structure

Produce a single, valid JSON object containing the

english_product_info and arabic_product_info sub-objects. Do not add any text or formatting outside of the main JSON structure.

JSON
{
"english_product_info": {
"barcode": "[Barcode, if available]",
"productName": "[Translated product name in English]",
"manufacturer": {
"name": "[Manufacturer's name, as is or transliterated to English if from another script]",
"location": "[Translated location in English]",
"additionalInfo": "[Translated additional info in English]",
"country": "[Translated country in English]"
},
"productDescription": "[Translated product description in English]",
"ingredients": [
"[Translated Ingredient 1 in English]",
"[Translated Ingredient 2 in English]",
"..."
],
"servingSizeInformation": {
"servingSize": "[Serving size]",
"servingSizeUnit": "[Serving size unit e.g., g or ml]",
"servingsPerContainer": "[Number of servings]"
},
"nutritionalInformationPer100g": {
"energyPer100g": {
"kj": "[Energy in kj]",
"kcal": "[Energy in kcal]"
},
"fatPer100g": "[Fat content]",
"saturatesPer100g": "[Saturates content]",
"carbohydratePer100g": "[Carbohydrate content]",
"sugarsPer100g": "[Sugars content]",
"fiberPer100g": "[Fibre content]",
"proteinPer100g": "[Protein content]",
"saltPer100g": "[Salt content]"
},
"storageInformation": "[Translated storage instructions in English]",
"usageInformation": "[Translated usage instructions in English]",
"allergyInformation": [
"[Translated Allergen 1 in English]",
"..."
],
"weightInformation": {
"netWeight": "[Net weight with English unit, e.g., '100g']",
"packagingWeight": "[Packaging weight, if available]"
}
},
"arabic_product_info": {
"barcode": "[Barcode, if available]",
"productName": "[Translated product name in Arabic]",
"manufacturer": {
"name": "[Transliterated manufacturer's name in Arabic]",
"location": "[Translated location in Arabic]",
"additionalInfo": "[Translated additional info in Arabic]",
"country": "[Translated country in Arabic]"
},
"productDescription": "[Translated product description in Arabic]",
"ingredients": [
"[Translated Ingredient 1 in Arabic]",
"[Translated Ingredient 2 in Arabic]",
"..."
],
"servingSizeInformation": {
"servingSize": "[Serving size]",
"servingSizeUnit": "[Translated serving size unit e.g., غ or مل]",
"servingsPerContainer": "[Number of servings]"
},
"nutritionalInformationPer100g": {
"energyPer100g": {
"kj": "[Energy in kj]",
"kcal": "[Energy in kcal]"
},
"fatPer100g": "[Fat content]",
"saturatesPer100g": "[Saturates content]",
"carbohydratePer100g": "[Carbohydrate content]",
"sugarsPer100g": "[Sugars content]",
"fiberPer100g": "[Fibre content]",
"proteinPer100g": "[Protein content]",
"saltPer100g": "[Salt content]"
},
"storageInformation": "[Translated storage instructions in Arabic]",
"usageInformation": "[Translated usage instructions in Arabic]",
"allergyInformation": [
"[Translated Allergen 1 in Arabic]",
"..."
],
"weightInformation": {
"netWeight": "[Net weight with Arabic unit, e.g., '100غ']",
"packagingWeight": "[Packaging weight, if available]"
}
}
}`

function tryParseJSON(text: string): any | null {
  try {
    return JSON.parse(text)
  } catch {}
  const start = text.indexOf("{")
  const end = text.lastIndexOf("}")
  if (start >= 0 && end > start) {
    const slice = text.slice(start, end + 1)
    try { return JSON.parse(slice) } catch {}
  }
  return null
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const source = body?.source
    if (!source) return NextResponse.json({ success: false, error: "Missing source JSON" }, { status: 400 })
    const sourceText = typeof source === 'string' ? source : JSON.stringify(source)

    const { text } = await generateText({
      model: google("gemini-2.5-pro"),
      temperature: 0.2,
      prompt: `${TRANSLATION_PROMPT}\n\nSource JSON:\n${sourceText}`,
    })

    const parsed = tryParseJSON(text)
    if (!parsed) return NextResponse.json({ success: false, error: "Failed to parse translation JSON" }, { status: 200 })
    return NextResponse.json({ success: true, data: parsed })
  } catch (e) {
    console.error("[fnb] translate error", e)
    return NextResponse.json({ success: false, error: e instanceof Error ? e.message : "Unknown error" }, { status: 500 })
  }
}
