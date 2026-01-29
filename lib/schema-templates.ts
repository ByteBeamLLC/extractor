import type { SchemaField, SchemaDefinition } from "./schema"

export type SchemaTemplateAgent = "standard" | "pharma"

export interface SchemaTemplateDefinition {
  id: string
  name: string
  description?: string | null
  fields: SchemaField[]
  agentType: SchemaTemplateAgent
  ownerId?: string | null
  isCustom?: boolean
  allowedDomains?: string[] | null
  allowedEmails?: string[] | null
  createdAt?: Date
  updatedAt?: Date
}

export function cloneSchemaFields(fields: SchemaField[]): SchemaField[] {
  return JSON.parse(JSON.stringify(fields ?? [])) as SchemaField[]
}

export function schemaDefinitionToTemplatePayload(schema: SchemaDefinition): { fields: SchemaField[] } {
  return {
    fields: cloneSchemaFields(schema.fields ?? []),
  }
}

export const STATIC_SCHEMA_TEMPLATES: SchemaTemplateDefinition[] = [
  {
    id: "invoice-nested",
    name: "Invoice",
    description: "Nested vendor/customer and totals.",
    agentType: "standard",
    fields: [
      {
        id: "invoice_number",
        name: "invoice_number",
        type: "string",
        description: "Unique invoice ID",
        extractionInstructions: "Look for 'Invoice #', 'Invoice No.'",
        required: true,
      },
      {
        id: "invoice_date",
        name: "invoice_date",
        type: "date",
        description: "Issue date",
        extractionInstructions: "Normalize to YYYY-MM-DD",
        required: true,
      },
      { id: "due_date", name: "due_date", type: "date", description: "Payment due date" },
      { id: "po_number", name: "po_number", type: "string", description: "PO number if present" },
      {
        id: "vendor",
        name: "vendor",
        type: "object",
        description: "Vendor details",
        children: [
          { id: "vendor_name", name: "name", type: "string", description: "Vendor name", required: true },
          { id: "vendor_country", name: "country", type: "string", description: "Vendor country" },
          { id: "vendor_address", name: "address", type: "string", description: "Vendor address" },
          { id: "vendor_tax_id", name: "tax_id", type: "string", description: "Tax/VAT ID" },
        ],
      },
      {
        id: "customer",
        name: "customer",
        type: "object",
        description: "Customer details",
        children: [
          { id: "customer_name", name: "name", type: "string", description: "Customer name" },
          { id: "customer_address", name: "address", type: "string", description: "Billing address" },
        ],
      },
      {
        id: "line_items",
        name: "line_items",
        type: "list",
        description: "Itemized products/services",
        item: {
          id: "line_item",
          name: "item",
          type: "object",
          children: [
            { id: "li_desc", name: "description", type: "string" },
            { id: "li_qty", name: "quantity", type: "number" },
            { id: "li_unit_price", name: "unit_price", type: "number" },
            { id: "li_total", name: "total", type: "number" },
          ],
        },
      },
      { id: "subtotal", name: "subtotal", type: "number" },
      { id: "tax_amount", name: "tax_amount", type: "number" },
      {
        id: "total_amount",
        name: "total_amount",
        type: "object",
        description: "Final total as amount + currency",
        children: [
          { id: "total_amount_value", name: "amount", type: "number", description: "Amount" },
          { id: "total_amount_ccy", name: "currency", type: "string", description: "Currency code" },
        ],
      },
    ],
  },
  {
    id: "po-simple",
    name: "Purchase Order (Simple)",
    description: "Quick purchase order template with supplier and line items.",
    agentType: "standard",
    fields: [
      {
        id: "po_number",
        name: "po_number",
        type: "string",
        description: "PO identifier.",
        required: true,
      },
      { id: "order_date", name: "order_date", type: "date", description: "Date PO created." },
      { id: "vendor_name", name: "vendor_name", type: "string", description: "Supplier/vendor name." },
      { id: "shipping_address", name: "shipping_address", type: "string", description: "Ship To address." },
      { id: "billing_address", name: "billing_address", type: "string", description: "Billing address." },
      {
        id: "line_items",
        name: "line_items",
        type: "list",
        description: "Goods/services requested.",
        item: {
          id: "po_item",
          name: "item",
          type: "object",
          children: [
            { id: "po_item_sku", name: "sku", type: "string" },
            { id: "po_item_desc", name: "description", type: "string" },
            { id: "po_item_qty", name: "quantity", type: "number" },
            { id: "po_item_unit_price", name: "unit_price", type: "number" },
            { id: "po_item_total", name: "total", type: "number" },
          ],
        },
      },
      { id: "total_amount", name: "total_amount", type: "number", description: "PO total value.", required: true },
      { id: "requested_by", name: "requested_by", type: "string", description: "Requester or department." },
    ],
  },

  {
    id: "pharma-content-sfda",
    name: "Pharma Ecommerce Content (SFDA)",
    description: "Full SFDA drug flow: extract identifiers, build English search, fetch results, pick best match, fetch all tabs, and generate ecommerce content.",
    agentType: "standard",
    fields: [
      {
        id: "extracted_drug_info",
        name: "extracted_drug_info",
        type: "object",
        description: "Drug identifiers extracted exactly as seen (no translation).",
        extractionInstructions: "Extract identifiers exactly as seen. If missing or unclear, set the field to null. Be precise on dosage and dosage form. Include both brand and generic if present.",
        required: true,
        children: [
          { id: "drug_name", name: "drugName", type: "string", description: "Brand/trade name or null" },
          { id: "generic_name", name: "genericName", type: "string", description: "Generic name or null" },
          { id: "manufacturer_name", name: "manufacturer", type: "string", description: "Manufacturer/parent company or null" },
          { id: "active_ingredients", name: "activeIngredients", type: "string", description: "Active ingredients or null" },
          { id: "dosage_strength", name: "dosage", type: "string", description: "Dosage/strength or null" },
          { id: "dosage_form", name: "dosageForm", type: "string", description: "Dosage form or null" },
          { id: "pack_size", name: "packSize", type: "string", description: "Pack size or null" },
          { id: "batch_number", name: "batchNumber", type: "string", description: "Batch/lot number or null" },
          { id: "expiry_date", name: "expiryDate", type: "string", description: "Expiry date or null" },
          { id: "other_identifiers", name: "otherIdentifiers", type: "string", description: "Any other identifiers or null" },
        ],
      },
      {
        id: "sfda_search_query",
        name: "sfda_search_query",
        type: "string",
        description: "English-only SFDA search query (brand preferred, else generic).",
        isTransformation: true,
        transformationType: "gemini_api",
        transformationSource: "column",
        transformationConfig: {
          prompt: "Based on {extracted_drug_info}, return ONLY the best English search query text for SFDA. Rules: translate any non-English names to English, use brand name if present else generic, keep concise, do NOT include dosage or form. Output only the query text in English.",
          sourceFields: ["extracted_drug_info"],
          selectedTools: [],
        },
      },
      {
        id: "sfda_search_results",
        name: "sfda_search_results",
        type: "table",
        description: "SFDA search results parsed into a table.",
        isTransformation: true,
        transformationType: "gemini_api",
        transformationSource: "column",
        transformationConfig: {
          prompt: "Using webReader, GET https://sdi.sfda.gov.sa/Home/DrugSearch?textFilter={sfda_search_query}\n\nThen Parse the results table and output rows with columns: scientific_name (الاسم العلمي), trade_name (الاسم التجاري), registration_year (سنة التسجيل), registration_number (رقم التسجيل), drug_listing_url, drug_listing_id. The view column contains URLs like https://sdi.sfda.gov.sa/Home/Result?drugId={drug_id}; use it to populate drug_listing_url and digits-only drug_listing_id. Limit to first 10 rows. If fetch fails or no rows, return an empty table. Never invent IDs.",
          sourceFields: ["sfda_search_query"],
          selectedTools: ["webReader", "webSearch"],
        },
        columns: [
          { id: "sfda_scientific_name", name: "scientific_name", type: "string", description: "الاسم العلمي" },
          { id: "sfda_trade_name", name: "trade_name", type: "string", description: "الاسم التجاري" },
          { id: "sfda_registration_year", name: "registration_year", type: "string", description: "سنة التسجيل" },
          { id: "sfda_registration_number", name: "registration_number", type: "string", description: "رقم التسجيل" },
          { id: "sfda_drug_listing_url", name: "drug_listing_url", type: "url", description: "Drug listing URL from view column" },
          { id: "sfda_drug_listing_id", name: "drug_listing_id", type: "string", description: "Digits-only drug listing ID parsed from URL" },
        ],
      },
      {
        id: "sfda_match",
        name: "sfda_match",
        type: "object",
        description: "Best matched SFDA drug from search results.",
        isTransformation: true,
        transformationType: "gemini_api",
        transformationSource: "column",
        transformationConfig: {
          prompt: "Given original info {extracted_drug_info} and SFDA results table {sfda_search_results}, select matching drugs. Use rows' drug_listing_id (digits only) and names/forms to compare against the extracted info. Output JSON: {\"matches\": [{\"drugId\": \"...\", \"confidence\": \"high|medium|low\", \"reason\": \"...\"}], \"bestMatchId\": \"id or null\"}. If bestMatchId is null, set it to the first row's drug_listing_id if any; otherwise null. Keep reasons concise.",
          sourceFields: ["extracted_drug_info", "sfda_search_results"],
          selectedTools: [],
        },
        children: [
          {
            id: "sfda_match_list",
            name: "matches",
            type: "list",
            description: "All considered matches with confidence",
            item: {
              id: "sfda_match_item",
              name: "match",
              type: "object",
              children: [
                { id: "sfda_match_item_id", name: "drugId", type: "string", description: "DrugId from search results" },
                { id: "sfda_match_item_confidence", name: "confidence", type: "string", description: "high|medium|low" },
                { id: "sfda_match_item_reason", name: "reason", type: "string", description: "Brief reason" },
              ],
            },
          },
          { id: "sfda_best_match_id", name: "bestMatchId", type: "string", description: "Best matching drugId or null" },
        ],
      },
      {
        id: "sfda_listing_raw",
        name: "sfda_listing_raw",
        type: "richtext",
        description: "Combined HTML/text from Drug Data, PIL EN/AR, SPC.",
        isTransformation: true,
        transformationType: "gemini_api",
        transformationSource: "column",
        transformationConfig: {
          prompt: "If {sfda_match} contains sfda_best_match_id use it to reader this url \nhttps://sdi.sfda.gov.sa/home/Result?drugId=sfda_best_match_id\n\nyou should replace sfda_best_match_id with the actual value of the id\n\nyour output should be the full raw response from web reader tool for this url\n\nif sfda_best_match_id is not available then just respond with id is not available",
          sourceFields: ["sfda_match"],
          selectedTools: ["webReader"],
        },
      },
      {
        id: "tab_description",
        name: "tab_description",
        type: "richtext",
        description: "Description tab content sourced only from the SFDA listing.",
        isTransformation: true,
        transformationType: "gemini_api",
        transformationSource: "column",
        transformationConfig: {
          prompt: `You are extracting pharmaceutical information from multiple tabs of a Saudi FDA drug detail page: Drug Data, PIL (EN), PIL (AR), SPC.\n\nExtract and consolidate [Description]\n\nInstructions:\n- Read ALL tabs; prefer English when duplicated\n- Combine related info into coherent sections\n- Be thorough; if missing, use null\n- Format clearly and professionally\n----\n\nSFDA Drug Detail Page:\n{sfda_listing_raw}\n=====================`,
          sourceFields: ["sfda_listing_raw", "extracted_drug_info"],
          selectedTools: [],
        },
      },
      {
        id: "tab_composition",
        name: "tab_composition",
        type: "richtext",
        description: "Composition tab content sourced only from the SFDA listing.",
        isTransformation: true,
        transformationType: "gemini_api",
        transformationSource: "column",
        transformationConfig: {
          prompt: `You are extracting pharmaceutical information from multiple tabs of a Saudi FDA drug detail page: Drug Data, PIL (EN), PIL (AR), SPC.\n\nExtract and consolidate [Composition]\n\nInstructions:\n- Read ALL tabs; prefer English when duplicated\n- Combine related info into coherent sections\n- Be thorough; if missing, use null\n- Format clearly and professionally\n----\n\nSFDA Drug Detail Page:\n{sfda_listing_raw}\n===========================`,
          sourceFields: ["sfda_listing_raw"],
          selectedTools: [],
        },
      },
      {
        id: "tab_how_to_use",
        name: "tab_how_to_use",
        type: "richtext",
        description: "How To Use tab content sourced only from the SFDA listing.",
        isTransformation: true,
        transformationType: "gemini_api",
        transformationSource: "column",
        transformationConfig: {
          prompt: `You are extracting pharmaceutical information from multiple tabs of a Saudi FDA drug detail page: Drug Data, PIL (EN), PIL (AR), SPC.\n\nExtract and consolidate [How To Use]\n\nInstructions:\n- Read ALL tabs; prefer English when duplicated\n- Combine related info into coherent sections\n- Be thorough; if missing, use null\n- Format clearly and professionally\n----\n\nSFDA Drug Detail Page:\n{sfda_listing_raw}\n=============================`,
          sourceFields: ["sfda_listing_raw"],
          selectedTools: [],
        },
      },
      {
        id: "tab_indication",
        name: "tab_indication",
        type: "richtext",
        description: "Indication tab content sourced only from the SFDA listing.",
        isTransformation: true,
        transformationType: "gemini_api",
        transformationSource: "column",
        transformationConfig: {
          prompt: `You are extracting pharmaceutical information from multiple tabs of a Saudi FDA drug detail page: Drug Data, PIL (EN), PIL (AR), SPC.\n\nExtract and consolidate [Indication]\n\nInstructions:\n- Read ALL tabs; prefer English when duplicated\n- Combine related info into coherent sections\n- Be thorough; if missing, use null\n- Format clearly and professionally\n----\n\nSFDA Drug Detail Page:\n{sfda_listing_raw}\n===============================`,
          sourceFields: ["sfda_listing_raw"],
          selectedTools: [],
        },
      },
      {
        id: "tab_possible_side_effects",
        name: "tab_possible_side_effects",
        type: "richtext",
        description: "Possible Side Effects tab content sourced only from the SFDA listing.",
        isTransformation: true,
        transformationType: "gemini_api",
        transformationSource: "column",
        transformationConfig: {
          prompt: `You are extracting pharmaceutical information from multiple tabs of a Saudi FDA drug detail page: Drug Data, PIL (EN), PIL (AR), SPC.\n\nExtract and consolidate [Possible Side Effects]\n\nInstructions:\n- Read ALL tabs; prefer English when duplicated\n- Combine related info into coherent sections\n- Be thorough; if missing, use null\n- Format clearly and professionally\n----\n\nSFDA Drug Detail Page:\n{sfda_listing_raw}\n=================================`,
          sourceFields: ["sfda_listing_raw"],
          selectedTools: [],
        },
      },
      {
        id: "tab_properties",
        name: "tab_properties",
        type: "richtext",
        description: "Properties tab content sourced only from the SFDA listing.",
        isTransformation: true,
        transformationType: "gemini_api",
        transformationSource: "column",
        transformationConfig: {
          prompt: `You are extracting pharmaceutical information from multiple tabs of a Saudi FDA drug detail page: Drug Data, PIL (EN), PIL (AR), SPC.\n\nExtract and consolidate [Properties]\n\nInstructions:\n- Read ALL tabs; prefer English when duplicated\n- Combine related info into coherent sections\n- Be thorough; if missing, use null\n- Format clearly and professionally\n----\n\nSFDA Drug Detail Page:\n{sfda_listing_raw}\n==========================`,
          sourceFields: ["sfda_listing_raw"],
          selectedTools: [],
        },
      },
      {
        id: "tab_storage",
        name: "tab_storage",
        type: "richtext",
        description: "Storage tab content sourced only from the SFDA listing.",
        isTransformation: true,
        transformationType: "gemini_api",
        transformationSource: "column",
        transformationConfig: {
          prompt: `You are extracting pharmaceutical information from multiple tabs of a Saudi FDA drug detail page: Drug Data, PIL (EN), PIL (AR), SPC.\n\nExtract and consolidate [Storage Information]\n\nInstructions:\n- Read ALL tabs; prefer English when duplicated\n- Combine related info into coherent sections\n- Be thorough; if missing, use null\n- Format clearly and professionally\n----\n\nSFDA Drug Detail Page:\n{sfda_listing_raw}\n===============================`,
          sourceFields: ["sfda_listing_raw"],
          selectedTools: [],
        },
      },
    ],
  },
  {
    id: "leaflet-review",
    name: "Leaflet Review",
    description: "Compare original drug leaflet against a reference drug.",
    agentType: "standard",
    fields: [
      { id: "original_drug", name: "original_drug", type: "input", inputType: "document", description: "Original drug leaflet file." },
      { id: "reference_drug", name: "reference_drug", type: "input", inputType: "document", description: "Reference drug leaflet file." },
      {
        id: "original_drug_trade_name",
        name: "original_drug_trade_name",
        type: "string",
        description: "Trade name extracted from the original drug leaflet.",
        extractionInstructions: 'Extract trade name from @"original drug".',
      },
      {
        id: "reference_drug_trade_name",
        name: "reference_drug_trade_name",
        type: "string",
        description: "Trade name extracted from the reference drug leaflet.",
        extractionInstructions: 'Extract trade name from @"reference drug".',
      },
      {
        id: "leaflet_review",
        name: "review",
        type: "richtext",
        description: "Regulatory review comparing original vs reference leaflets.",
        isTransformation: true,
        transformationType: "gemini_api",
        transformationSource: "column",
        transformationConfig: {
          prompt: `You are a pharma regulatory expert\n\nWe are launching this new drug {original_drug_trade_name}\nThe reference drug for this is {reference_drug_trade_name}\n\nI want you to review the leaflet of {original_drug_trade_name} and make sure it contains all the information required based on the reference drug {reference_drug_trade_name}.\n\n{original_drug_trade_name} leaflet:\n{original_drug}\n\n{reference_drug_trade_name} leaflet:\n{reference_drug}`,
          sourceFields: ["original_drug_trade_name", "reference_drug_trade_name", "original_drug", "reference_drug"],
          selectedTools: [],
        },
      },
      {
        id: "trade_name_braille_translation",
        name: "trade_name_braille_translation",
        type: "string",
        description: "Trade name translated to Braille.",
        isTransformation: true,
        transformationType: "gemini_api",
        transformationSource: "column",
        transformationConfig: {
          prompt: "Use the braille tool to translate trade name [{original_drug_trade_name}] to braille. Return only the braille output.",
          sourceFields: ["original_drug_trade_name"],
          selectedTools: ["braille"],
        },
      },
    ],
  },
 
  {
    id: "fmcg-localization",
    name: "FMCG Localization",
    description: "Extract and translate food & beverage packaging data from OCR with multilingual support (English/Arabic).",
    agentType: "standard",
    allowedEmails: ["bazerbachi.8@gmail.com"],
    fields: [
      // Extraction Fields - matching extraction.txt structure
      {
        id: "barcode",
        name: "barcode",
        type: "string",
        description: "Product barcode number",
        extractionInstructions: "Extract the product's barcode number. Ensure the output contains only digits. Remove any spaces, hyphens, quotes, or other non-numeric characters.",
        required: true,
      },
      {
        id: "product_name",
        name: "product_name",
        type: "string",
        description: "Product name",
        extractionInstructions: "Extract the specific name of the product. Do not include the brand name, manufacturer name, or any descriptive text in this field.",
        required: true,
      },
      {
        id: "manufacturer",
        name: "manufacturer",
        type: "object",
        description: "Manufacturer details",
        children: [
          { id: "manufacturer_name", name: "name", type: "string", description: "Manufacturer's name" },
          { id: "manufacturer_location", name: "location", type: "string", description: "Manufacturer's location" },
          { id: "manufacturer_additional_info", name: "additionalInfo", type: "string", description: "Any additional manufacturer info" },
          { id: "manufacturer_country", name: "country", type: "string", description: "Manufacturer's country" },
        ],
      },
      {
        id: "product_description",
        name: "product_description",
        type: "string",
        description: "Product description",
        extractionInstructions: "Extract a concise, official description of the product. Do not include the company's history, marketing slogans, ingredient lists, or storage instructions. Keep it focused on what the product is.",
      },
      {
        id: "ingredients",
        name: "ingredients",
        type: "list",
        description: "Ingredients list",
        extractionInstructions: "Extract the complete list of ingredients exactly as written. Do not rephrase, translate, or omit any part of the listed ingredients.",
        item: {
          id: "ingredient_item",
          name: "ingredient",
          type: "string",
          description: "Individual ingredient",
        },
      },
      {
        id: "serving_size_information",
        name: "serving_size_information",
        type: "object",
        description: "Serving size details",
        children: [
          { id: "serving_size", name: "servingSize", type: "string", description: "Serving size" },
          { id: "serving_size_unit", name: "servingSizeUnit", type: "string", description: "Serving size unit (g or ml)" },
          { id: "servings_per_container", name: "servingsPerContainer", type: "string", description: "Number of servings per container" },
        ],
      },
      {
        id: "nutritional_information_per_100g",
        name: "nutritional_information_per_100g",
        type: "object",
        description: "Nutritional information per 100g",
        children: [
          {
            id: "energy_per_100g",
            name: "energyPer100g",
            type: "object",
            description: "Energy values",
            children: [
              { id: "energy_kj", name: "kj", type: "string", description: "Energy in kj per 100g" },
              { id: "energy_kcal", name: "kcal", type: "string", description: "Energy in kcal per 100g" },
            ],
          },
          { id: "fat_per_100g", name: "fatPer100g", type: "string", description: "Fat content per 100g" },
          { id: "saturates_per_100g", name: "saturatesPer100g", type: "string", description: "Saturates content per 100g" },
          { id: "carbohydrate_per_100g", name: "carbohydratePer100g", type: "string", description: "Carbohydrate content per 100g" },
          { id: "sugars_per_100g", name: "sugarsPer100g", type: "string", description: "Sugars content per 100g" },
          { id: "fiber_per_100g", name: "fiberPer100g", type: "string", description: "Fibre content per 100g" },
          { id: "protein_per_100g", name: "proteinPer100g", type: "string", description: "Protein content per 100g" },
          { id: "salt_per_100g", name: "saltPer100g", type: "string", description: "Salt content per 100g" },
          { id: "sodium_per_100g", name: "sodiumPer100g", type: "string", description: "Sodium content per 100g" },
          { id: "cholesterol_per_100g", name: "cholesterolPer100g", type: "string", description: "Cholesterol content per 100g" },
          { id: "trans_fat_per_100g", name: "transFatPer100g", type: "string", description: "Trans Fat content per 100g" },
          { id: "includes_added_sugar_per_100g", name: "includesAddedSugarPer100g", type: "string", description: "Added Sugar content per 100g" },
        ],
      },
      {
        id: "storage_information",
        name: "storage_information",
        type: "string",
        description: "Storage instructions",
        extractionInstructions: "Extract only instructions directly related to storing the product (e.g., 'Keep refrigerated,' 'Store in a cool, dry place'). Do not include preparation instructions or general company information.",
      },
      {
        id: "usage_information",
        name: "usage_information",
        type: "string",
        description: "Usage instructions",
      },
      {
        id: "allergy_information",
        name: "allergy_information",
        type: "list",
        description: "Allergen information",
        item: {
          id: "allergen_item",
          name: "allergen",
          type: "string",
          description: "Individual allergen",
        },
      },
      {
        id: "weight_information",
        name: "weight_information",
        type: "object",
        description: "Weight details",
        children: [
          { id: "net_weight", name: "netWeight", type: "string", description: "Net weight with unit" },
          { id: "packaging_weight", name: "packagingWeight", type: "string", description: "Packaging weight if available" },
        ],
      },
      {
        id: "product_status",
        name: "product_status",
        type: "string",
        description: "Product classification",
        extractionInstructions: "Classify the product based on ingredients. Categories: banned (pork/alcohol), fish_certificate_required (fish/seafood), organic_certificate_required (bio/organic), products_need_carrefour_permission (vinegar), halal_certificate_required (meat/gelatin/processed ingredients), ok (none of the above). List all that apply, separated by commas.",
      },
      {
        id: "product_status_reason",
        name: "product_status_reason",
        type: "string",
        description: "Classification reasoning",
        extractionInstructions: "Provide clear reasoning for why each category was chosen. Example: 'halal_certificate_required due to presence of Gelatin. fish_certificate_required due to Salmon.'",
      },
      // Transformation Fields - English Translation
      {
        id: "english_product_name",
        name: "english_product_name",
        type: "string",
        description: "Product name in English",
        isTransformation: true,
        transformationType: "gemini_api",
        transformationSource: "column",
        transformationConfig: {
          prompt: "Translate '{product_name}' to English. If it is ALREADY in English, output it EXACTLY as-is without any changes. Otherwise, create a descriptive and appealing English name that is fluent and natural-sounding, suitable for a consumer product. Do NOT search the web - use only your translation knowledge. Output ONLY the translated/original text, nothing else.",
          sourceFields: ["product_name"],
          selectedTools: [],
        },
      },
      {
        id: "english_product_description",
        name: "english_product_description",
        type: "string",
        description: "Product description in English",
        isTransformation: true,
        transformationType: "gemini_api",
        transformationSource: "column",
        transformationConfig: {
          prompt: "Translate '{product_description}' to English. If it is ALREADY in English, output it EXACTLY as-is without any changes. Otherwise, create a descriptive and appealing English description that is fluent and natural-sounding, suitable for a consumer product. Do NOT search the web - use only your translation knowledge. Output ONLY the translated/original text, nothing else.",
          sourceFields: ["product_description"],
          selectedTools: [],
        },
      },
      {
        id: "english_manufacturer",
        name: "english_manufacturer",
        type: "object",
        description: "Manufacturer details in English",
        isTransformation: true,
        transformationType: "gemini_api",
        transformationSource: "column",
        transformationConfig: {
          prompt: "Translate the manufacturer details {manufacturer} to English. If already in English, output EXACTLY as-is. For manufacturer name, transliterate if needed. Translate location and country to their standard English names (e.g., 'France', 'Spain'). Do NOT search the web - use only your translation knowledge. Return ONLY a JSON object with fields: name, location, additionalInfo, country.",
          sourceFields: ["manufacturer"],
          selectedTools: [],
        },
        children: [
          { id: "english_manufacturer_name", name: "name", type: "string", description: "Manufacturer's name in English" },
          { id: "english_manufacturer_location", name: "location", type: "string", description: "Manufacturer's location in English" },
          { id: "english_manufacturer_additional_info", name: "additionalInfo", type: "string", description: "Additional info in English" },
          { id: "english_manufacturer_country", name: "country", type: "string", description: "Manufacturer's country in English" },
        ],
      },
      {
        id: "english_ingredients",
        name: "english_ingredients",
        type: "list",
        description: "Ingredients in English",
        isTransformation: true,
        transformationType: "gemini_api",
        transformationSource: "column",
        transformationConfig: {
          prompt: "Translate every ingredient in {ingredients} to English. If already in English, output EXACTLY as-is. Ensure all items are translated and none are left in the original language. Do NOT search the web - use only your translation knowledge. Return ONLY an array of strings, nothing else.",
          sourceFields: ["ingredients"],
          selectedTools: [],
        },
        item: {
          id: "english_ingredient_item",
          name: "ingredient",
          type: "string",
          description: "Individual ingredient in English",
        },
      },
      {
        id: "english_storage_information",
        name: "english_storage_information",
        type: "string",
        description: "Storage instructions in English",
        isTransformation: true,
        transformationType: "gemini_api",
        transformationSource: "column",
        transformationConfig: {
          prompt: "Translate '{storage_information}' to English. If it is ALREADY in English, output it EXACTLY as-is without any changes. Do NOT search the web - use only your translation knowledge. Output ONLY the translated/original text, nothing else.",
          sourceFields: ["storage_information"],
          selectedTools: [],
        },
      },
      {
        id: "english_usage_information",
        name: "english_usage_information",
        type: "string",
        description: "Usage instructions in English",
        isTransformation: true,
        transformationType: "gemini_api",
        transformationSource: "column",
        transformationConfig: {
          prompt: "Translate '{usage_information}' to English. If it is ALREADY in English, output it EXACTLY as-is without any changes. Do NOT search the web - use only your translation knowledge. Output ONLY the translated/original text, nothing else.",
          sourceFields: ["usage_information"],
          selectedTools: [],
        },
      },
      {
        id: "english_allergy_information",
        name: "english_allergy_information",
        type: "list",
        description: "Allergens in English",
        isTransformation: true,
        transformationType: "gemini_api",
        transformationSource: "column",
        transformationConfig: {
          prompt: "Translate every allergen in {allergy_information} to English. If already in English, output EXACTLY as-is. Ensure all items are translated. Do NOT search the web - use only your translation knowledge. Return ONLY an array of strings, nothing else.",
          sourceFields: ["allergy_information"],
          selectedTools: [],
        },
        item: {
          id: "english_allergen_item",
          name: "allergen",
          type: "string",
          description: "Individual allergen in English",
        },
      },
      // Transformation Fields - Arabic Translation
      {
        id: "arabic_product_name",
        name: "arabic_product_name",
        type: "string",
        description: "Product name in Arabic",
        isTransformation: true,
        transformationType: "gemini_api",
        transformationSource: "column",
        transformationConfig: {
          prompt: "Translate '{product_name}' to Arabic. Create a descriptive and appealing name that is fluent and natural-sounding in Arabic, suitable for a consumer product. Use Western Arabic numerals (1,2,3) not Eastern Arabic numerals (١,٢,٣). Do NOT search the web - use only your translation knowledge. Output ONLY the translated text, nothing else.",
          sourceFields: ["product_name"],
          selectedTools: [],
        },
      },
      {
        id: "arabic_product_description",
        name: "arabic_product_description",
        type: "string",
        description: "Product description in Arabic",
        isTransformation: true,
        transformationType: "gemini_api",
        transformationSource: "column",
        transformationConfig: {
          prompt: "Translate '{product_description}' to Arabic. Create a descriptive and appealing description that is fluent and natural-sounding in Arabic. Do NOT search the web - use only your translation knowledge. Output ONLY the translated text, nothing else.",
          sourceFields: ["product_description"],
          selectedTools: [],
        },
      },
      {
        id: "arabic_manufacturer",
        name: "arabic_manufacturer",
        type: "object",
        description: "Manufacturer details in Arabic",
        isTransformation: true,
        transformationType: "gemini_api",
        transformationSource: "column",
        transformationConfig: {
          prompt: "Translate the manufacturer details {manufacturer} to Arabic. For the manufacturer name, transliterate it phonetically to Arabic (e.g., Carrefour → كارفور, Nestle → نستله). Translate location and country to their standard Arabic names (e.g., 'فرنسا', 'إسبانيا'). Do NOT search the web - use only your translation knowledge. Return ONLY a JSON object with fields: name, location, additionalInfo, country.",
          sourceFields: ["manufacturer"],
          selectedTools: [],
        },
        children: [
          { id: "arabic_manufacturer_name", name: "name", type: "string", description: "Manufacturer's name in Arabic" },
          { id: "arabic_manufacturer_location", name: "location", type: "string", description: "Manufacturer's location in Arabic" },
          { id: "arabic_manufacturer_additional_info", name: "additionalInfo", type: "string", description: "Additional info in Arabic" },
          { id: "arabic_manufacturer_country", name: "country", type: "string", description: "Manufacturer's country in Arabic" },
        ],
      },
      {
        id: "arabic_ingredients",
        name: "arabic_ingredients",
        type: "list",
        description: "Ingredients in Arabic",
        isTransformation: true,
        transformationType: "gemini_api",
        transformationSource: "column",
        transformationConfig: {
          prompt: "Translate every ingredient in {ingredients} to Arabic. Ensure all items are translated and none are left in the original language. Use Western Arabic numerals (1,2,3) not Eastern Arabic numerals (١,٢,٣). Do NOT search the web - use only your translation knowledge. Return ONLY an array of strings, nothing else.",
          sourceFields: ["ingredients"],
          selectedTools: [],
        },
        item: {
          id: "arabic_ingredient_item",
          name: "ingredient",
          type: "string",
          description: "Individual ingredient in Arabic",
        },
      },
      {
        id: "arabic_storage_information",
        name: "arabic_storage_information",
        type: "string",
        description: "Storage instructions in Arabic",
        isTransformation: true,
        transformationType: "gemini_api",
        transformationSource: "column",
        transformationConfig: {
          prompt: "Translate '{storage_information}' to Arabic in a natural, fluent manner. Translate units of measurement to their standard Arabic equivalents (g → غ, kg → كغ, ml → مل, l → ل). Do NOT search the web - use only your translation knowledge. Output ONLY the translated text, nothing else.",
          sourceFields: ["storage_information"],
          selectedTools: [],
        },
      },
      {
        id: "arabic_usage_information",
        name: "arabic_usage_information",
        type: "string",
        description: "Usage instructions in Arabic",
        isTransformation: true,
        transformationType: "gemini_api",
        transformationSource: "column",
        transformationConfig: {
          prompt: "Translate '{usage_information}' to Arabic in a natural, fluent manner. Do NOT search the web - use only your translation knowledge. Output ONLY the translated text, nothing else.",
          sourceFields: ["usage_information"],
          selectedTools: [],
        },
      },
      {
        id: "arabic_allergy_information",
        name: "arabic_allergy_information",
        type: "list",
        description: "Allergens in Arabic",
        isTransformation: true,
        transformationType: "gemini_api",
        transformationSource: "column",
        transformationConfig: {
          prompt: "Translate every allergen in {allergy_information} to Arabic. Ensure all items are translated. Do NOT search the web - use only your translation knowledge. Return ONLY an array of strings, nothing else.",
          sourceFields: ["allergy_information"],
          selectedTools: [],
        },
        item: {
          id: "arabic_allergen_item",
          name: "allergen",
          type: "string",
          description: "Individual allergen in Arabic",
        },
      },
    ],
  },
  {
    id: "gcc-food-label",
    name: "GCC Food Label",
    description: "Generate Saudi/GCC-compliant food labels following SFDA and GSO 9 standards with bilingual (English/Arabic) support.",
    agentType: "standard",
    allowedEmails: ["bazerbachi.8@gmail.com"],
    fields: [
      // ═══════════════════════════════════════════════════════════════════════
      // SECTION 1: PRODUCT IDENTITY
      // ═══════════════════════════════════════════════════════════════════════
      {
        id: "barcode",
        name: "barcode",
        type: "string",
        description: "Product barcode (GTIN/EAN-13)",
        extractionInstructions: "Enter the 13-digit EAN barcode. Ensure only numeric digits.",
        required: true,
      },
      {
        id: "product_name_en",
        name: "product_name_en",
        type: "string",
        description: "Product name in English",
        extractionInstructions: "Enter the official product name in English as it will appear on the label.",
        required: true,
      },
      {
        id: "product_name_ar",
        name: "product_name_ar",
        type: "string",
        description: "Product name in Arabic",
        isTransformation: true,
        transformationType: "gemini_api",
        transformationSource: "column",
        transformationConfig: {
          prompt: "Translate '{product_name_en}' to Arabic. Create a descriptive and appealing name that is fluent and natural-sounding in Arabic, suitable for a consumer food product. Use Western Arabic numerals (1,2,3) not Eastern Arabic numerals. Output ONLY the translated text, nothing else.",
          sourceFields: ["product_name_en"],
          selectedTools: [],
        },
      },
      {
        id: "brand_name",
        name: "brand_name",
        type: "string",
        description: "Brand name",
        required: true,
      },
      {
        id: "product_description_en",
        name: "product_description_en",
        type: "string",
        description: "Product description in English",
        extractionInstructions: "Brief product description for the label (e.g., 'Crunchy Corn Flakes Breakfast Cereal').",
      },
      {
        id: "product_description_ar",
        name: "product_description_ar",
        type: "string",
        description: "Product description in Arabic",
        isTransformation: true,
        transformationType: "gemini_api",
        transformationSource: "column",
        transformationConfig: {
          prompt: "Translate '{product_description_en}' to Arabic. Create a natural, fluent Arabic description suitable for a food product label. Use Western Arabic numerals. Output ONLY the translated text.",
          sourceFields: ["product_description_en"],
          selectedTools: [],
        },
      },
      {
        id: "net_content",
        name: "net_content",
        type: "object",
        description: "Net weight or volume",
        children: [
          { id: "net_content_value", name: "value", type: "number", description: "Numeric value", required: true },
          { id: "net_content_unit", name: "unit", type: "string", description: "Unit (g, kg, ml, L)", required: true },
        ],
      },

      // ═══════════════════════════════════════════════════════════════════════
      // SECTION 2: MANUFACTURER / IMPORTER DETAILS
      // ═══════════════════════════════════════════════════════════════════════
      {
        id: "manufacturer",
        name: "manufacturer",
        type: "object",
        description: "Manufacturer details",
        children: [
          { id: "manufacturer_name_en", name: "name_en", type: "string", description: "Manufacturer name in English", required: true },
          { id: "manufacturer_name_ar", name: "name_ar", type: "string", description: "Manufacturer name in Arabic" },
          { id: "manufacturer_address", name: "address", type: "string", description: "Full manufacturer address" },
          { id: "manufacturer_country", name: "country", type: "string", description: "Country of manufacture", required: true },
        ],
      },
      {
        id: "importer",
        name: "importer",
        type: "object",
        description: "Importer details (required for imported products)",
        children: [
          { id: "importer_name", name: "name", type: "string", description: "Importer company name" },
          { id: "importer_address", name: "address", type: "string", description: "Importer address in Saudi Arabia" },
          { id: "importer_contact", name: "contact", type: "string", description: "Contact number or email" },
        ],
      },
      {
        id: "country_of_origin",
        name: "country_of_origin",
        type: "string",
        description: "Country of origin",
        required: true,
      },

      // ═══════════════════════════════════════════════════════════════════════
      // SECTION 3: INGREDIENTS LIST
      // ═══════════════════════════════════════════════════════════════════════
      {
        id: "ingredients_en",
        name: "ingredients_en",
        type: "list",
        description: "Ingredients list in English (in descending order by weight)",
        extractionInstructions: "List all ingredients in descending order of weight. Mark allergens in CAPS or note them separately.",
        required: true,
        item: {
          id: "ingredient_en_item",
          name: "ingredient",
          type: "string",
          description: "Individual ingredient in English",
        },
      },
      {
        id: "ingredients_ar",
        name: "ingredients_ar",
        type: "list",
        description: "Ingredients list in Arabic",
        isTransformation: true,
        transformationType: "gemini_api",
        transformationSource: "column",
        transformationConfig: {
          prompt: "Translate every ingredient in {ingredients_en} to Arabic. Maintain the same order. Use standard Arabic food terminology. Use Western Arabic numerals (1,2,3). Return ONLY an array of strings.",
          sourceFields: ["ingredients_en"],
          selectedTools: [],
        },
        item: {
          id: "ingredient_ar_item",
          name: "ingredient",
          type: "string",
          description: "Individual ingredient in Arabic",
        },
      },

      // ═══════════════════════════════════════════════════════════════════════
      // SECTION 4: ALLERGEN DECLARATION (GSO 14 Major Allergens)
      // ═══════════════════════════════════════════════════════════════════════
      {
        id: "allergens",
        name: "allergens",
        type: "object",
        description: "Allergen declaration per GSO requirements",
        children: [
          {
            id: "contains_allergens",
            name: "contains",
            type: "list",
            description: "Allergens contained in the product",
            item: {
              id: "allergen_item",
              name: "allergen",
              type: "single_select",
              description: "Allergen type",
              constraints: {
                options: [
                  "Cereals containing gluten",
                  "Crustaceans",
                  "Eggs",
                  "Fish",
                  "Peanuts",
                  "Soybeans",
                  "Milk",
                  "Tree nuts",
                  "Celery",
                  "Mustard",
                  "Sesame seeds",
                  "Sulphites",
                  "Lupin",
                  "Molluscs"
                ],
              },
            },
          },
          {
            id: "may_contain_allergens",
            name: "may_contain",
            type: "list",
            description: "Potential cross-contamination allergens ('May contain traces of...')",
            item: {
              id: "may_contain_item",
              name: "allergen",
              type: "string",
              description: "Potential trace allergen",
            },
          },
        ],
      },
      {
        id: "allergen_statement_en",
        name: "allergen_statement_en",
        type: "string",
        description: "Full allergen statement in English",
        isTransformation: true,
        transformationType: "gemini_api",
        transformationSource: "column",
        transformationConfig: {
          prompt: "Generate a compliant allergen statement in English based on: Contains: {allergens.contains}, May contain: {allergens.may_contain}. Format: 'Contains: [list]. May contain traces of: [list].' If either list is empty, omit that part. Output ONLY the statement.",
          sourceFields: ["allergens"],
          selectedTools: [],
        },
      },
      {
        id: "allergen_statement_ar",
        name: "allergen_statement_ar",
        type: "string",
        description: "Full allergen statement in Arabic",
        isTransformation: true,
        transformationType: "gemini_api",
        transformationSource: "column",
        transformationConfig: {
          prompt: "Translate this allergen statement to Arabic: '{allergen_statement_en}'. Use proper Arabic food labeling terminology. Format: 'يحتوي على: [قائمة]. قد يحتوي على آثار: [قائمة].' Output ONLY the Arabic statement.",
          sourceFields: ["allergen_statement_en"],
          selectedTools: [],
        },
      },

      // ═══════════════════════════════════════════════════════════════════════
      // SECTION 5: NUTRITION FACTS PANEL
      // ═══════════════════════════════════════════════════════════════════════
      {
        id: "serving_info",
        name: "serving_info",
        type: "object",
        description: "Serving size information",
        children: [
          { id: "serving_size", name: "serving_size", type: "string", description: "Serving size (e.g., '30g', '250ml')", required: true },
          { id: "servings_per_package", name: "servings_per_package", type: "number", description: "Number of servings per package" },
        ],
      },
      {
        id: "nutrition_per_100",
        name: "nutrition_per_100",
        type: "object",
        description: "Nutritional information per 100g/100ml (mandatory per GSO)",
        required: true,
        children: [
          {
            id: "energy_per_100",
            name: "energy",
            type: "object",
            description: "Energy values",
            children: [
              { id: "energy_kj_100", name: "kj", type: "number", description: "Energy in kJ per 100g/ml", required: true },
              { id: "energy_kcal_100", name: "kcal", type: "number", description: "Energy in kcal per 100g/ml", required: true },
            ],
          },
          { id: "total_fat_100", name: "total_fat", type: "number", description: "Total fat (g) per 100g/ml", required: true },
          { id: "saturated_fat_100", name: "saturated_fat", type: "number", description: "Saturated fat (g) per 100g/ml", required: true },
          { id: "trans_fat_100", name: "trans_fat", type: "number", description: "Trans fat (g) per 100g/ml", required: true },
          { id: "cholesterol_100", name: "cholesterol", type: "number", description: "Cholesterol (mg) per 100g/ml" },
          { id: "total_carbs_100", name: "total_carbohydrates", type: "number", description: "Total carbohydrates (g) per 100g/ml", required: true },
          { id: "sugars_100", name: "sugars", type: "number", description: "Sugars (g) per 100g/ml", required: true },
          { id: "added_sugars_100", name: "added_sugars", type: "number", description: "Added sugars (g) per 100g/ml" },
          { id: "fiber_100", name: "fiber", type: "number", description: "Dietary fiber (g) per 100g/ml" },
          { id: "protein_100", name: "protein", type: "number", description: "Protein (g) per 100g/ml", required: true },
          { id: "sodium_100", name: "sodium", type: "number", description: "Sodium (mg) per 100g/ml", required: true },
          { id: "salt_100", name: "salt", type: "number", description: "Salt (g) per 100g/ml (sodium × 2.5)" },
        ],
      },
      {
        id: "nutrition_per_serving",
        name: "nutrition_per_serving",
        type: "object",
        description: "Nutritional information per serving (optional but recommended)",
        children: [
          {
            id: "energy_per_serving",
            name: "energy",
            type: "object",
            description: "Energy values per serving",
            children: [
              { id: "energy_kj_srv", name: "kj", type: "number", description: "Energy in kJ per serving" },
              { id: "energy_kcal_srv", name: "kcal", type: "number", description: "Energy in kcal per serving" },
            ],
          },
          { id: "total_fat_srv", name: "total_fat", type: "number", description: "Total fat (g) per serving" },
          { id: "saturated_fat_srv", name: "saturated_fat", type: "number", description: "Saturated fat (g) per serving" },
          { id: "trans_fat_srv", name: "trans_fat", type: "number", description: "Trans fat (g) per serving" },
          { id: "cholesterol_srv", name: "cholesterol", type: "number", description: "Cholesterol (mg) per serving" },
          { id: "total_carbs_srv", name: "total_carbohydrates", type: "number", description: "Total carbohydrates (g) per serving" },
          { id: "sugars_srv", name: "sugars", type: "number", description: "Sugars (g) per serving" },
          { id: "added_sugars_srv", name: "added_sugars", type: "number", description: "Added sugars (g) per serving" },
          { id: "fiber_srv", name: "fiber", type: "number", description: "Dietary fiber (g) per serving" },
          { id: "protein_srv", name: "protein", type: "number", description: "Protein (g) per serving" },
          { id: "sodium_srv", name: "sodium", type: "number", description: "Sodium (mg) per serving" },
          { id: "salt_srv", name: "salt", type: "number", description: "Salt (g) per serving" },
        ],
      },
      {
        id: "vitamins_minerals",
        name: "vitamins_minerals",
        type: "list",
        description: "Vitamins and minerals (if fortified or significant amounts)",
        item: {
          id: "vitamin_mineral_item",
          name: "nutrient",
          type: "object",
          children: [
            { id: "vm_name", name: "name", type: "string", description: "Nutrient name (e.g., Vitamin A, Iron)" },
            { id: "vm_amount_100", name: "amount_per_100", type: "string", description: "Amount per 100g/ml with unit" },
            { id: "vm_daily_value", name: "daily_value_percent", type: "number", description: "% Daily Value (NRV)" },
          ],
        },
      },

      // ═══════════════════════════════════════════════════════════════════════
      // SECTION 6: TRAFFIC LIGHT INDICATORS (UAE/Optional)
      // ═══════════════════════════════════════════════════════════════════════
      {
        id: "traffic_light",
        name: "traffic_light",
        type: "object",
        description: "Traffic light nutrition indicators (front-of-pack labeling)",
        children: [
          {
            id: "fat_indicator",
            name: "fat",
            type: "single_select",
            description: "Fat level indicator",
            constraints: { options: ["green", "amber", "red"] },
          },
          {
            id: "saturated_fat_indicator",
            name: "saturated_fat",
            type: "single_select",
            description: "Saturated fat level indicator",
            constraints: { options: ["green", "amber", "red"] },
          },
          {
            id: "sugar_indicator",
            name: "sugar",
            type: "single_select",
            description: "Sugar level indicator",
            constraints: { options: ["green", "amber", "red"] },
          },
          {
            id: "salt_indicator",
            name: "salt",
            type: "single_select",
            description: "Salt level indicator",
            constraints: { options: ["green", "amber", "red"] },
          },
        ],
      },

      // ═══════════════════════════════════════════════════════════════════════
      // SECTION 7: STORAGE & USAGE INSTRUCTIONS
      // ═══════════════════════════════════════════════════════════════════════
      {
        id: "storage_instructions_en",
        name: "storage_instructions_en",
        type: "string",
        description: "Storage instructions in English",
        extractionInstructions: "E.g., 'Store in a cool, dry place. Refrigerate after opening.'",
      },
      {
        id: "storage_instructions_ar",
        name: "storage_instructions_ar",
        type: "string",
        description: "Storage instructions in Arabic",
        isTransformation: true,
        transformationType: "gemini_api",
        transformationSource: "column",
        transformationConfig: {
          prompt: "Translate '{storage_instructions_en}' to Arabic using standard food storage terminology. Output ONLY the translated text.",
          sourceFields: ["storage_instructions_en"],
          selectedTools: [],
        },
      },
      {
        id: "usage_instructions_en",
        name: "usage_instructions_en",
        type: "string",
        description: "Usage/Preparation instructions in English",
      },
      {
        id: "usage_instructions_ar",
        name: "usage_instructions_ar",
        type: "string",
        description: "Usage/Preparation instructions in Arabic",
        isTransformation: true,
        transformationType: "gemini_api",
        transformationSource: "column",
        transformationConfig: {
          prompt: "Translate '{usage_instructions_en}' to Arabic. Use natural Arabic phrasing for food preparation instructions. Output ONLY the translated text.",
          sourceFields: ["usage_instructions_en"],
          selectedTools: [],
        },
      },

      // ═══════════════════════════════════════════════════════════════════════
      // SECTION 8: DATE MARKING & BATCH INFO
      // ═══════════════════════════════════════════════════════════════════════
      {
        id: "batch_number",
        name: "batch_number",
        type: "string",
        description: "Batch/Lot number",
      },
      {
        id: "production_date",
        name: "production_date",
        type: "date",
        description: "Production/Manufacturing date",
      },
      {
        id: "expiry_date",
        name: "expiry_date",
        type: "date",
        description: "Expiry date / Best before date",
        required: true,
      },
      {
        id: "date_format_note",
        name: "date_format_note",
        type: "string",
        description: "Date format declaration (e.g., 'DD/MM/YYYY')",
        extractionInstructions: "Specify the date format used on the label per GSO requirements.",
      },

      // ═══════════════════════════════════════════════════════════════════════
      // SECTION 9: CERTIFICATIONS & COMPLIANCE
      // ═══════════════════════════════════════════════════════════════════════
      {
        id: "halal_status",
        name: "halal_status",
        type: "single_select",
        description: "Halal certification status",
        constraints: {
          options: ["Halal Certified", "Halal (Self-declared)", "Not Applicable", "Pending Certification"],
        },
      },
      {
        id: "halal_certifier",
        name: "halal_certifier",
        type: "string",
        description: "Halal certification body name",
      },
      {
        id: "sfda_registration",
        name: "sfda_registration",
        type: "string",
        description: "SFDA product registration number (if applicable)",
      },
      {
        id: "gso_standards",
        name: "gso_standards",
        type: "list",
        description: "Applicable GSO standards",
        item: {
          id: "gso_standard_item",
          name: "standard",
          type: "string",
          description: "GSO standard reference (e.g., 'GSO 9', 'GSO 2233')",
        },
      },

      // ═══════════════════════════════════════════════════════════════════════
      // SECTION 10: ADDITIONAL CLAIMS & STATEMENTS
      // ═══════════════════════════════════════════════════════════════════════
      {
        id: "nutrition_claims",
        name: "nutrition_claims",
        type: "list",
        description: "Nutrition claims (e.g., 'Low Fat', 'High Fiber', 'Sugar Free')",
        item: {
          id: "nutrition_claim_item",
          name: "claim",
          type: "string",
          description: "Individual nutrition claim",
        },
      },
      {
        id: "health_claims",
        name: "health_claims",
        type: "list",
        description: "Approved health claims",
        item: {
          id: "health_claim_item",
          name: "claim",
          type: "string",
          description: "Individual health claim",
        },
      },
      {
        id: "special_dietary",
        name: "special_dietary",
        type: "multi_select",
        description: "Special dietary suitability",
        constraints: {
          options: ["Gluten-Free", "Lactose-Free", "Vegan", "Vegetarian", "Organic", "Non-GMO", "Kosher", "Suitable for Diabetics"],
        },
      },
      {
        id: "warnings",
        name: "warnings",
        type: "list",
        description: "Warning statements",
        item: {
          id: "warning_item",
          name: "warning",
          type: "string",
          description: "Warning statement (e.g., 'Not suitable for children under 3 years')",
        },
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════════
  // SFDA LEGAL STATUS RECLASSIFICATION REVIEW (DS-G-133-V01/260119)
  // For reviewing SPC and PIL documents for POM→OTC reclassification applications
  // ═══════════════════════════════════════════════════════════════════════════════
  {
    id: "sfda-reclassification-review",
    name: "SFDA Reclassification Review (POM→OTC)",
    description: "Review SPC and PIL documents for legal status reclassification applications per SFDA DS-G-133 guideline. Extracts safety criteria, assesses OTC eligibility, identifies gaps, and generates transformation requirements.",
    agentType: "standard",
    fields: [
      // ═══════════════════════════════════════════════════════════════════════════
      // SECTION 1: INPUT DOCUMENTS
      // ═══════════════════════════════════════════════════════════════════════════
      {
        id: "spc_document",
        name: "spc_document",
        type: "input",
        inputType: "document",
        description: "Summary of Product Characteristics (SPC) document - current approved version",
        required: true,
      },
      {
        id: "pil_document",
        name: "pil_document",
        type: "input",
        inputType: "document",
        description: "Patient Information Leaflet (PIL) document - current approved version",
        required: true,
      },
      {
        id: "supporting_evidence",
        name: "supporting_evidence",
        type: "input",
        inputType: "document",
        description: "Optional: Clinical overview, safety reports, post-marketing data, or other supporting documentation",
      },
      {
        id: "sfda_guideline",
        name: "sfda_guideline",
        type: "input",
        inputType: "document",
        description: "SFDA DS-G-133 Guideline for Legal Status Classification and Distribution of Human Medicinal Products (required for accurate assessment criteria)",
        required: true,
      },

      // ═══════════════════════════════════════════════════════════════════════════
      // SECTION 2: PRODUCT IDENTIFICATION (Extracted from SPC/PIL)
      // ═══════════════════════════════════════════════════════════════════════════
      {
        id: "product_identification",
        name: "product_identification",
        type: "object",
        description: "Product identification details extracted from SPC Section 1-3",
        children: [
          {
            id: "product_name_en",
            name: "product_name_en",
            type: "string",
            description: "Product trade name in English",
            extractionInstructions: "Extract the full product name including strength from SPC Section 1 @spc_document",
            required: true,
          },
          {
            id: "product_name_ar",
            name: "product_name_ar",
            type: "string",
            description: "Product trade name in Arabic",
            extractionInstructions: "Extract the Arabic product name if present in @spc_document or @pil_document",
          },
          {
            id: "active_ingredients",
            name: "active_ingredients",
            type: "list",
            description: "Active ingredient(s) with quantities",
            extractionInstructions: "Extract from SPC Section 2 - Qualitative and quantitative composition from @spc_document",
            item: {
              id: "active_ingredient_item",
              name: "ingredient",
              type: "object",
              children: [
                { id: "ingredient_name", name: "name", type: "string", description: "INN or common name" },
                { id: "ingredient_strength", name: "strength", type: "string", description: "Strength with unit" },
              ],
            },
          },
          {
            id: "dosage_form",
            name: "dosage_form",
            type: "string",
            description: "Pharmaceutical form (e.g., tablet, capsule, syrup)",
            extractionInstructions: "Extract from SPC Section 3 @spc_document",
            required: true,
          },
          {
            id: "route_of_administration",
            name: "route_of_administration",
            type: "string",
            description: "Route of administration",
            extractionInstructions: "Extract from SPC Section 3 or 4.2 @spc_document",
            required: true,
          },
          {
            id: "atc_code",
            name: "atc_code",
            type: "string",
            description: "ATC classification code",
            extractionInstructions: "Extract from SPC Section 5.1 if available @spc_document",
          },
          {
            id: "marketing_authorization_holder",
            name: "marketing_authorization_holder",
            type: "string",
            description: "Marketing Authorization Holder name",
            extractionInstructions: "Extract from SPC administrative section @spc_document",
          },
        ],
      },

      // ═══════════════════════════════════════════════════════════════════════════
      // SECTION 3: CURRENT STATUS
      // ═══════════════════════════════════════════════════════════════════════════
      {
        id: "current_status",
        name: "current_status",
        type: "object",
        description: "Current legal and distribution status",
        children: [
          {
            id: "current_legal_status",
            name: "legal_status",
            type: "single_select",
            description: "Current legal status in Saudi Arabia",
            constraints: {
              options: ["Prescription Only Medicine (POM)", "Over-the-counter (OTC)", "Controlled Prescription Medicine"],
            },
            required: true,
          },
          {
            id: "current_distribution_status",
            name: "distribution_status",
            type: "single_select",
            description: "Current distribution channel",
            constraints: {
              options: ["Hospital", "Community Pharmacy", "Hospital and Community Pharmacy"],
            },
            required: true,
          },
          {
            id: "requested_legal_status",
            name: "requested_legal_status",
            type: "single_select",
            description: "Requested new legal status",
            constraints: {
              options: ["Prescription Only Medicine (POM)", "Over-the-counter (OTC)"],
            },
            required: true,
          },
          {
            id: "requested_distribution_status",
            name: "requested_distribution_status",
            type: "single_select",
            description: "Requested distribution channel",
            constraints: {
              options: ["Hospital", "Community Pharmacy", "Hospital and Community Pharmacy"],
            },
          },
        ],
      },

      // ═══════════════════════════════════════════════════════════════════════════
      // SECTION 4: SPC EXTRACTION (Key Sections for Classification)
      // ═══════════════════════════════════════════════════════════════════════════
      {
        id: "spc_section_4_1",
        name: "spc_therapeutic_indications",
        type: "object",
        description: "SPC Section 4.1 - Therapeutic Indications",
        extractionInstructions: "Extract complete Section 4.1 from @spc_document",
        children: [
          {
            id: "indications_text_en",
            name: "text_en",
            type: "richtext",
            description: "Full indication text in English",
          },
          {
            id: "indications_text_ar",
            name: "text_ar",
            type: "richtext",
            description: "Full indication text in Arabic (if bilingual SPC)",
          },
          {
            id: "self_diagnosable",
            name: "self_diagnosable",
            type: "boolean",
            description: "Can the indicated condition(s) be self-diagnosed by patients?",
          },
          {
            id: "self_diagnosable_evidence",
            name: "self_diagnosable_evidence",
            type: "string",
            description: "Evidence/reasoning for self-diagnosis assessment",
          },
        ],
      },
      {
        id: "spc_section_4_2",
        name: "spc_posology",
        type: "object",
        description: "SPC Section 4.2 - Posology and Method of Administration",
        extractionInstructions: "Extract complete Section 4.2 from @spc_document",
        children: [
          {
            id: "posology_text_en",
            name: "text_en",
            type: "richtext",
            description: "Full posology text in English",
          },
          {
            id: "posology_text_ar",
            name: "text_ar",
            type: "richtext",
            description: "Full posology text in Arabic",
          },
          {
            id: "adult_dose",
            name: "adult_dose",
            type: "string",
            description: "Standard adult dosage",
          },
          {
            id: "pediatric_dose",
            name: "pediatric_dose",
            type: "string",
            description: "Pediatric dosage if applicable",
          },
          {
            id: "max_daily_dose",
            name: "max_daily_dose",
            type: "string",
            description: "Maximum daily dose",
          },
          {
            id: "max_treatment_duration",
            name: "max_treatment_duration",
            type: "string",
            description: "Maximum recommended treatment duration",
          },
          {
            id: "requires_individualization",
            name: "requires_individualization",
            type: "boolean",
            description: "Does dosing require individualization or titration?",
          },
          {
            id: "administration_complexity",
            name: "administration_complexity",
            type: "single_select",
            description: "Complexity of administration",
            constraints: {
              options: ["Simple (oral, straightforward)", "Moderate (specific timing/conditions)", "Complex (requires training/devices)", "Requires healthcare provider"],
            },
          },
        ],
      },
      {
        id: "spc_section_4_3",
        name: "spc_contraindications",
        type: "object",
        description: "SPC Section 4.3 - Contraindications",
        extractionInstructions: "Extract complete Section 4.3 from @spc_document",
        children: [
          {
            id: "contraindications_text_en",
            name: "text_en",
            type: "richtext",
            description: "Full contraindications text in English",
          },
          {
            id: "contraindications_text_ar",
            name: "text_ar",
            type: "richtext",
            description: "Full contraindications text in Arabic",
          },
          {
            id: "contraindications_list",
            name: "contraindications_list",
            type: "list",
            description: "Individual contraindications",
            item: {
              id: "contraindication_item",
              name: "contraindication",
              type: "object",
              children: [
                { id: "ci_condition", name: "condition", type: "string", description: "Contraindicated condition" },
                { id: "ci_patient_identifiable", name: "patient_identifiable", type: "boolean", description: "Can patient self-identify this condition?" },
              ],
            },
          },
        ],
      },
      {
        id: "spc_section_4_4",
        name: "spc_warnings",
        type: "object",
        description: "SPC Section 4.4 - Special Warnings and Precautions",
        extractionInstructions: "Extract complete Section 4.4 from @spc_document",
        children: [
          {
            id: "warnings_text_en",
            name: "text_en",
            type: "richtext",
            description: "Full warnings text in English",
          },
          {
            id: "warnings_text_ar",
            name: "text_ar",
            type: "richtext",
            description: "Full warnings text in Arabic",
          },
          {
            id: "monitoring_required",
            name: "monitoring_required",
            type: "boolean",
            description: "Does the product require medical monitoring?",
          },
          {
            id: "monitoring_details",
            name: "monitoring_details",
            type: "string",
            description: "Details of required monitoring (if any)",
          },
          {
            id: "masks_underlying_condition",
            name: "masks_underlying_condition",
            type: "boolean",
            description: "Could use mask an underlying condition requiring medical attention?",
          },
          {
            id: "masking_risk_details",
            name: "masking_risk_details",
            type: "string",
            description: "Details of masking risk",
          },
        ],
      },
      {
        id: "spc_section_4_5",
        name: "spc_interactions",
        type: "object",
        description: "SPC Section 4.5 - Interaction with other medicinal products",
        extractionInstructions: "Extract complete Section 4.5 from @spc_document",
        children: [
          {
            id: "interactions_text_en",
            name: "text_en",
            type: "richtext",
            description: "Full interactions text in English",
          },
          {
            id: "interactions_text_ar",
            name: "text_ar",
            type: "richtext",
            description: "Full interactions text in Arabic",
          },
          {
            id: "serious_interactions",
            name: "serious_interactions",
            type: "list",
            description: "Clinically significant drug interactions",
            item: {
              id: "interaction_item",
              name: "interaction",
              type: "object",
              children: [
                { id: "int_drug", name: "interacting_drug", type: "string", description: "Interacting drug/class" },
                { id: "int_effect", name: "effect", type: "string", description: "Effect of interaction" },
                { id: "int_severity", name: "severity", type: "single_select", description: "Severity", constraints: { options: ["Contraindicated", "Major", "Moderate", "Minor"] } },
                { id: "int_common_use", name: "commonly_used", type: "boolean", description: "Is this a commonly used drug?" },
              ],
            },
          },
          {
            id: "food_interactions",
            name: "food_interactions",
            type: "string",
            description: "Food or alcohol interactions",
          },
        ],
      },
      {
        id: "spc_section_4_6",
        name: "spc_fertility_pregnancy_lactation",
        type: "object",
        description: "SPC Section 4.6 - Fertility, Pregnancy and Lactation",
        extractionInstructions: "Extract complete Section 4.6 from @spc_document",
        children: [
          {
            id: "fpl_text_en",
            name: "text_en",
            type: "richtext",
            description: "Full text in English",
          },
          {
            id: "fpl_text_ar",
            name: "text_ar",
            type: "richtext",
            description: "Full text in Arabic",
          },
          {
            id: "pregnancy_category",
            name: "pregnancy_category",
            type: "string",
            description: "Pregnancy safety category/recommendation",
          },
          {
            id: "lactation_safe",
            name: "lactation_safe",
            type: "single_select",
            description: "Safe during breastfeeding?",
            constraints: { options: ["Safe", "Use with caution", "Contraindicated", "Unknown"] },
          },
          {
            id: "reproductive_toxicity",
            name: "reproductive_toxicity",
            type: "boolean",
            description: "Any reproductive toxicity concerns?",
          },
        ],
      },
      {
        id: "spc_section_4_8",
        name: "spc_adverse_reactions",
        type: "object",
        description: "SPC Section 4.8 - Undesirable Effects",
        extractionInstructions: "Extract complete Section 4.8 from @spc_document",
        children: [
          {
            id: "adr_text_en",
            name: "text_en",
            type: "richtext",
            description: "Full adverse reactions text in English",
          },
          {
            id: "adr_text_ar",
            name: "text_ar",
            type: "richtext",
            description: "Full adverse reactions text in Arabic",
          },
          {
            id: "serious_adrs",
            name: "serious_adrs",
            type: "list",
            description: "Serious adverse reactions",
            item: {
              id: "serious_adr_item",
              name: "adr",
              type: "object",
              children: [
                { id: "adr_name", name: "name", type: "string", description: "Adverse reaction" },
                { id: "adr_frequency", name: "frequency", type: "string", description: "Frequency category" },
                { id: "adr_preventable", name: "preventable", type: "boolean", description: "Can be prevented by excluding risk groups?" },
              ],
            },
          },
          {
            id: "common_adrs",
            name: "common_adrs",
            type: "list",
            description: "Common (≥1/100) adverse reactions",
            item: {
              id: "common_adr_item",
              name: "adr",
              type: "string",
              description: "Common adverse reaction",
            },
          },
        ],
      },
      {
        id: "spc_section_4_9",
        name: "spc_overdose",
        type: "object",
        description: "SPC Section 4.9 - Overdose",
        extractionInstructions: "Extract complete Section 4.9 from @spc_document",
        children: [
          {
            id: "overdose_text_en",
            name: "text_en",
            type: "richtext",
            description: "Full overdose text in English",
          },
          {
            id: "overdose_text_ar",
            name: "text_ar",
            type: "richtext",
            description: "Full overdose text in Arabic",
          },
          {
            id: "overdose_symptoms",
            name: "symptoms",
            type: "string",
            description: "Symptoms of overdose",
          },
          {
            id: "overdose_severity",
            name: "severity",
            type: "single_select",
            description: "Potential severity of overdose",
            constraints: { options: ["Minimal/self-limiting", "Moderate - medical attention recommended", "Serious - medical attention required", "Life-threatening"] },
          },
          {
            id: "antidote_available",
            name: "antidote_available",
            type: "boolean",
            description: "Is a specific antidote available?",
          },
        ],
      },

      // ═══════════════════════════════════════════════════════════════════════════
      // SECTION 5: SAFETY PROFILE ASSESSMENT (Per SFDA Criteria Section 3)
      // ═══════════════════════════════════════════════════════════════════════════
      {
        id: "safety_assessment",
        name: "safety_assessment",
        type: "object",
        description: "Comprehensive safety profile assessment based on SFDA DS-G-133 Section 3 criteria",
        isTransformation: true,
        transformationType: "gemini_api",
        transformationSource: "column",
        transformationConfig: {
          prompt: `You are a pharmaceutical regulatory expert assessing a drug for OTC reclassification.

IMPORTANT: Use the SFDA DS-G-133 Guideline document provided as your primary reference for assessment criteria.

SFDA GUIDELINE DOCUMENT:
@sfda_guideline

Based on the guideline's Section 3 criteria and the extracted SPC data, assess the following safety criteria. For each criterion, provide:
1. A boolean assessment (true = concern exists, false = no concern)
2. Supporting evidence from the SPC
3. Confidence level (high/medium/low)
4. Reference to the specific guideline section

CRITERIA TO ASSESS (per Section 3.1 of the guideline):

**DIRECT DANGER (Section 3.1.1.1)**
- serious_adr_risk: Potential to cause serious adverse reactions at normal dosage
- serious_interactions: Known serious interactions with food or other drugs
- reproductive_toxicity: Relevant reproductive toxicity, genotoxic, or carcinogenic properties
- narrow_therapeutic_index: Drug has a narrow margin of safety

**INDIRECT DANGER (Section 3.1.1.2)**
- masks_condition: Use might mask/hide underlying condition requiring medical attention
- resistance_risk: Wider use could increase resistance risk (e.g., antibiotics)

**SELF-ASSESSMENT (Section 3.1.1.3)**
- requires_diagnosis: Condition cannot be correctly assessed by patient
- requires_monitoring: Product requires patient monitoring and medical supervision

**PATIENT INFORMATION (Section 3.1.1.4)**
- complex_instructions: Use requires complex or individualized instructions

**MISUSE RISK (Section 3.1.1.5)**
- frequent_misuse: Drug is frequently used incorrectly
- high_contraindication_prevalence: High incidence of contraindicated conditions in target population

**INVESTIGATION NEEDED (Section 3.1.2)**
- recent_authorization: Recently authorized with limited post-marketing experience
- new_conditions: New strength, dose, route, indication, or age group

**ADMINISTRATION (Section 3.1.3)**
- parenteral_administration: Normally prescribed for parenteral administration

SPC DATA TO ANALYZE:
- SPC Indications: {spc_section_4_1}
- SPC Posology: {spc_section_4_2}
- SPC Contraindications: {spc_section_4_3}
- SPC Warnings: {spc_section_4_4}
- SPC Interactions: {spc_section_4_5}
- SPC Pregnancy/Lactation: {spc_section_4_6}
- SPC Adverse Reactions: {spc_section_4_8}
- SPC Overdose: {spc_section_4_9}
- Product Info: {product_identification}

Return a structured JSON object with assessments for each criterion.`,
          sourceFields: [
            "sfda_guideline",
            "spc_section_4_1",
            "spc_section_4_2",
            "spc_section_4_3",
            "spc_section_4_4",
            "spc_section_4_5",
            "spc_section_4_6",
            "spc_section_4_8",
            "spc_section_4_9",
            "product_identification",
          ],
          selectedTools: [],
        },
        children: [
          // Direct Danger Criteria
          {
            id: "sa_serious_adr_risk",
            name: "serious_adr_risk",
            type: "object",
            description: "Serious ADR risk assessment",
            children: [
              { id: "sa_serious_adr_flag", name: "flag", type: "boolean", description: "Concern exists" },
              { id: "sa_serious_adr_evidence", name: "evidence", type: "string", description: "Supporting evidence" },
              { id: "sa_serious_adr_confidence", name: "confidence", type: "string", description: "Confidence level" },
            ],
          },
          {
            id: "sa_serious_interactions",
            name: "serious_interactions",
            type: "object",
            description: "Serious drug interactions assessment",
            children: [
              { id: "sa_interactions_flag", name: "flag", type: "boolean", description: "Concern exists" },
              { id: "sa_interactions_evidence", name: "evidence", type: "string", description: "Supporting evidence" },
              { id: "sa_interactions_confidence", name: "confidence", type: "string", description: "Confidence level" },
            ],
          },
          {
            id: "sa_reproductive_toxicity",
            name: "reproductive_toxicity",
            type: "object",
            description: "Reproductive/genotoxic/carcinogenic risk",
            children: [
              { id: "sa_repro_flag", name: "flag", type: "boolean", description: "Concern exists" },
              { id: "sa_repro_evidence", name: "evidence", type: "string", description: "Supporting evidence" },
              { id: "sa_repro_confidence", name: "confidence", type: "string", description: "Confidence level" },
            ],
          },
          {
            id: "sa_narrow_therapeutic_index",
            name: "narrow_therapeutic_index",
            type: "object",
            description: "Narrow therapeutic index assessment",
            children: [
              { id: "sa_nti_flag", name: "flag", type: "boolean", description: "Concern exists" },
              { id: "sa_nti_evidence", name: "evidence", type: "string", description: "Supporting evidence" },
              { id: "sa_nti_confidence", name: "confidence", type: "string", description: "Confidence level" },
            ],
          },
          // Indirect Danger Criteria
          {
            id: "sa_masks_condition",
            name: "masks_condition",
            type: "object",
            description: "Risk of masking underlying conditions",
            children: [
              { id: "sa_masks_flag", name: "flag", type: "boolean", description: "Concern exists" },
              { id: "sa_masks_evidence", name: "evidence", type: "string", description: "Supporting evidence" },
              { id: "sa_masks_confidence", name: "confidence", type: "string", description: "Confidence level" },
            ],
          },
          {
            id: "sa_resistance_risk",
            name: "resistance_risk",
            type: "object",
            description: "Risk of increasing resistance (antibiotics etc.)",
            children: [
              { id: "sa_resistance_flag", name: "flag", type: "boolean", description: "Concern exists" },
              { id: "sa_resistance_evidence", name: "evidence", type: "string", description: "Supporting evidence" },
              { id: "sa_resistance_confidence", name: "confidence", type: "string", description: "Confidence level" },
            ],
          },
          // Self-Assessment Criteria
          {
            id: "sa_requires_diagnosis",
            name: "requires_diagnosis",
            type: "object",
            description: "Condition requires professional diagnosis",
            children: [
              { id: "sa_diagnosis_flag", name: "flag", type: "boolean", description: "Concern exists" },
              { id: "sa_diagnosis_evidence", name: "evidence", type: "string", description: "Supporting evidence" },
              { id: "sa_diagnosis_confidence", name: "confidence", type: "string", description: "Confidence level" },
            ],
          },
          {
            id: "sa_requires_monitoring",
            name: "requires_monitoring",
            type: "object",
            description: "Product requires medical monitoring",
            children: [
              { id: "sa_monitoring_flag", name: "flag", type: "boolean", description: "Concern exists" },
              { id: "sa_monitoring_evidence", name: "evidence", type: "string", description: "Supporting evidence" },
              { id: "sa_monitoring_confidence", name: "confidence", type: "string", description: "Confidence level" },
            ],
          },
          // Patient Information
          {
            id: "sa_complex_instructions",
            name: "complex_instructions",
            type: "object",
            description: "Complex or individualized instructions required",
            children: [
              { id: "sa_complex_flag", name: "flag", type: "boolean", description: "Concern exists" },
              { id: "sa_complex_evidence", name: "evidence", type: "string", description: "Supporting evidence" },
              { id: "sa_complex_confidence", name: "confidence", type: "string", description: "Confidence level" },
            ],
          },
          // Misuse Risk
          {
            id: "sa_misuse_risk",
            name: "misuse_risk",
            type: "object",
            description: "Risk and consequences of misuse",
            children: [
              { id: "sa_misuse_flag", name: "flag", type: "boolean", description: "Concern exists" },
              { id: "sa_misuse_evidence", name: "evidence", type: "string", description: "Supporting evidence" },
              { id: "sa_misuse_confidence", name: "confidence", type: "string", description: "Confidence level" },
            ],
          },
          // Abuse/Dependence
          {
            id: "sa_abuse_potential",
            name: "abuse_potential",
            type: "object",
            description: "Potential for abuse or dependence",
            children: [
              { id: "sa_abuse_flag", name: "flag", type: "boolean", description: "Concern exists" },
              { id: "sa_abuse_evidence", name: "evidence", type: "string", description: "Supporting evidence" },
              { id: "sa_abuse_confidence", name: "confidence", type: "string", description: "Confidence level" },
            ],
          },
        ],
      },

      // ═══════════════════════════════════════════════════════════════════════════
      // SECTION 6: OTC ELIGIBILITY ASSESSMENT (Per SFDA Criteria Section 3.2)
      // ═══════════════════════════════════════════════════════════════════════════
      {
        id: "otc_eligibility",
        name: "otc_eligibility",
        type: "object",
        description: "OTC eligibility assessment per SFDA DS-G-133 Section 3.2",
        isTransformation: true,
        transformationType: "gemini_api",
        transformationSource: "column",
        transformationConfig: {
          prompt: `IMPORTANT: Use the SFDA DS-G-133 Guideline document as your primary reference for OTC eligibility criteria.

SFDA GUIDELINE DOCUMENT:
@sfda_guideline

Based on Section 3.2 of the guideline and the safety assessment {safety_assessment}, evaluate OTC eligibility.

A product MAY be classified as OTC if ALL of the following are met (per Section 3.2):

**1. SUPERVISION NOT NECESSARY (Section 3.2.1)**
- 1.1 No risks from misdiagnosis or delayed treatment
- 1.2 No complex/individualized instructions needed
- Can be self-administered without healthcare provider
- Benefits achievable without guidance
- Patient can self-monitor effectiveness/safety

**2. ADEQUATE MARGIN OF SAFETY (Section 3.2.2)**
- No direct danger when used without medical supervision
- No indirect danger (masking conditions, resistance)
- Wide therapeutic index
- No serious ADRs in subpopulations (children, pregnant, elderly)

**3. MINOR CONSEQUENCES OF MISUSE (Section 3.2.3)**
- Small risk if used incorrectly
- Minor consequences if dose exceeded or warnings ignored

**4. NO ABUSE/DEPENDENCE POTENTIAL (Section 3.2.4)**
- Product does not lead to abuse or dependence

For each criterion:
- Provide PASS/FAIL/NEEDS_REVIEW status
- Cite specific evidence from the safety assessment
- Reference the specific guideline section
- If FAIL or NEEDS_REVIEW, provide specific reasons

Also provide:
- overall_eligibility: "ELIGIBLE", "NOT_ELIGIBLE", or "CONDITIONAL" (needs modifications)
- risk_score: 0-100 (0 = ideal OTC candidate, 100 = clearly needs prescription)
- key_barriers: List of main issues preventing OTC status
- recommendations: Specific recommendations for addressing barriers per guideline Section 7`,
          sourceFields: ["sfda_guideline", "safety_assessment", "product_identification", "current_status"],
          selectedTools: [],
        },
        children: [
          {
            id: "oe_supervision",
            name: "supervision_assessment",
            type: "object",
            description: "Assessment: Healthcare supervision not necessary",
            children: [
              { id: "oe_sup_status", name: "status", type: "single_select", description: "Status", constraints: { options: ["PASS", "FAIL", "NEEDS_REVIEW"] } },
              { id: "oe_sup_evidence", name: "evidence", type: "string", description: "Supporting evidence" },
              { id: "oe_sup_issues", name: "issues", type: "string", description: "Issues identified" },
            ],
          },
          {
            id: "oe_safety_margin",
            name: "safety_margin_assessment",
            type: "object",
            description: "Assessment: Adequate margin of safety",
            children: [
              { id: "oe_safety_status", name: "status", type: "single_select", description: "Status", constraints: { options: ["PASS", "FAIL", "NEEDS_REVIEW"] } },
              { id: "oe_safety_evidence", name: "evidence", type: "string", description: "Supporting evidence" },
              { id: "oe_safety_issues", name: "issues", type: "string", description: "Issues identified" },
            ],
          },
          {
            id: "oe_misuse",
            name: "misuse_consequences_assessment",
            type: "object",
            description: "Assessment: Minor consequences of misuse",
            children: [
              { id: "oe_misuse_status", name: "status", type: "single_select", description: "Status", constraints: { options: ["PASS", "FAIL", "NEEDS_REVIEW"] } },
              { id: "oe_misuse_evidence", name: "evidence", type: "string", description: "Supporting evidence" },
              { id: "oe_misuse_issues", name: "issues", type: "string", description: "Issues identified" },
            ],
          },
          {
            id: "oe_abuse",
            name: "abuse_potential_assessment",
            type: "object",
            description: "Assessment: No abuse/dependence potential",
            children: [
              { id: "oe_abuse_status", name: "status", type: "single_select", description: "Status", constraints: { options: ["PASS", "FAIL", "NEEDS_REVIEW"] } },
              { id: "oe_abuse_evidence", name: "evidence", type: "string", description: "Supporting evidence" },
              { id: "oe_abuse_issues", name: "issues", type: "string", description: "Issues identified" },
            ],
          },
          {
            id: "oe_overall",
            name: "overall_eligibility",
            type: "single_select",
            description: "Overall OTC eligibility determination",
            constraints: { options: ["ELIGIBLE", "NOT_ELIGIBLE", "CONDITIONAL"] },
          },
          {
            id: "oe_risk_score",
            name: "risk_score",
            type: "number",
            description: "Risk score (0-100, lower is better for OTC)",
          },
          {
            id: "oe_key_barriers",
            name: "key_barriers",
            type: "list",
            description: "Key barriers to OTC status",
            item: {
              id: "oe_barrier_item",
              name: "barrier",
              type: "string",
              description: "Barrier description",
            },
          },
          {
            id: "oe_recommendations",
            name: "recommendations",
            type: "list",
            description: "Recommendations for addressing barriers",
            item: {
              id: "oe_rec_item",
              name: "recommendation",
              type: "string",
              description: "Recommendation",
            },
          },
        ],
      },

      // ═══════════════════════════════════════════════════════════════════════════
      // SECTION 7: PIL ASSESSMENT
      // ═══════════════════════════════════════════════════════════════════════════
      {
        id: "pil_assessment",
        name: "pil_assessment",
        type: "object",
        description: "Assessment of Patient Information Leaflet completeness and clarity",
        isTransformation: true,
        transformationType: "gemini_api",
        transformationSource: "column",
        transformationConfig: {
          prompt: `IMPORTANT: Use the SFDA DS-G-133 Guideline document as your primary reference for PIL requirements.

SFDA GUIDELINE DOCUMENT:
@sfda_guideline

Analyze the PIL document @pil_document for OTC suitability per Section 4 of the guideline.

Per the guideline, for OTC products the PIL must:
1. Provide comprehensive information on appropriate use
2. Clearly state when to seek medical advice
3. Include all contraindications and warnings
4. Limit duration of treatment advice
5. Be easily understood by general public
6. Be available in both English and Arabic

Assess:
- **Completeness**: Are all required sections present per the guideline?
- **Clarity**: Is language appropriate for lay public?
- **Warnings**: Are contraindications and warnings prominent?
- **Self-care guidance**: Clear instructions for self-medication?
- **Medical referral triggers**: Clear guidance on when to see a doctor?
- **Language availability**: Both EN and AR versions present?

Identify gaps and provide specific recommendations for improving the PIL for OTC use, referencing the specific guideline sections.

Current PIL content: @pil_document
Product info: {product_identification}`,
          sourceFields: ["sfda_guideline", "pil_document", "product_identification"],
          selectedTools: [],
        },
        children: [
          {
            id: "pil_completeness_score",
            name: "completeness_score",
            type: "number",
            description: "PIL completeness score (0-100)",
          },
          {
            id: "pil_clarity_score",
            name: "clarity_score",
            type: "number",
            description: "Language clarity score (0-100)",
          },
          {
            id: "pil_has_arabic",
            name: "has_arabic_version",
            type: "boolean",
            description: "Arabic version available",
          },
          {
            id: "pil_missing_sections",
            name: "missing_sections",
            type: "list",
            description: "Missing or incomplete sections",
            item: {
              id: "pil_missing_item",
              name: "section",
              type: "string",
              description: "Missing section",
            },
          },
          {
            id: "pil_gaps",
            name: "gaps",
            type: "list",
            description: "Identified gaps for OTC suitability",
            item: {
              id: "pil_gap_item",
              name: "gap",
              type: "object",
              children: [
                { id: "pil_gap_section", name: "section", type: "string", description: "PIL section" },
                { id: "pil_gap_issue", name: "issue", type: "string", description: "Issue identified" },
                { id: "pil_gap_recommendation", name: "recommendation", type: "string", description: "Recommended change" },
              ],
            },
          },
        ],
      },

      // ═══════════════════════════════════════════════════════════════════════════
      // SECTION 8: MARKET EXPERIENCE ASSESSMENT
      // ═══════════════════════════════════════════════════════════════════════════
      {
        id: "market_experience",
        name: "market_experience",
        type: "object",
        description: "Market experience and international status",
        children: [
          {
            id: "me_years_marketed",
            name: "years_marketed",
            type: "number",
            description: "Years on market with current indication",
          },
          {
            id: "me_patient_exposure",
            name: "patient_exposure",
            type: "string",
            description: "Estimated patient exposure (if known)",
          },
          {
            id: "me_international_status",
            name: "international_status",
            type: "table",
            description: "Legal status in other countries (for reclassification evidence)",
            columns: [
              { id: "me_country", name: "country", type: "string", description: "Country name" },
              { id: "me_status", name: "legal_status", type: "single_select", description: "Legal status", constraints: { options: ["POM", "OTC", "Pharmacy Only", "Other"] } },
              { id: "me_since", name: "since_year", type: "string", description: "Status since year" },
              { id: "me_restrictions", name: "restrictions", type: "string", description: "Any restrictions (age, pack size, etc.)" },
            ],
          },
          {
            id: "me_safety_signals",
            name: "post_marketing_safety_signals",
            type: "string",
            description: "Summary of post-marketing safety signals (from supporting evidence)",
            extractionInstructions: "Extract any post-marketing safety data from @supporting_evidence if provided",
          },
        ],
      },

      // ═══════════════════════════════════════════════════════════════════════════
      // SECTION 9: TRANSFORMATION REQUIREMENTS (For Reclassification)
      // ═══════════════════════════════════════════════════════════════════════════
      {
        id: "spc_transformations",
        name: "spc_transformations",
        type: "object",
        description: "Required SPC modifications for reclassification",
        isTransformation: true,
        transformationType: "gemini_api",
        transformationSource: "column",
        transformationConfig: {
          prompt: `IMPORTANT: Use the SFDA DS-G-133 Guideline document as your primary reference for SPC modification requirements.

SFDA GUIDELINE DOCUMENT:
@sfda_guideline

Based on Section 4 (Considerations) and Section 7 (Reclassification requirements) of the guideline, along with the OTC eligibility assessment {otc_eligibility} and PIL assessment {pil_assessment}, identify all SPC sections that need modification for OTC reclassification.

For each section requiring changes, provide:
1. **section**: SPC section number and name
2. **current_text**: Relevant excerpt from current SPC
3. **required_changes**: Description of what needs to change
4. **suggested_text**: Proposed new text (if straightforward)
5. **change_type**: "remove", "modify", "add", or "clarify"
6. **priority**: "critical", "important", or "recommended"
7. **rationale**: Why this change is needed, citing specific guideline section

Key areas to review per guideline Section 4:
- Section 4.1: May need to limit indications for OTC use
- Section 4.2: Need clear self-medication dosing, max duration
- Section 4.3: Must be patient-identifiable contraindications
- Section 4.4: Add prominent OTC warnings, referral triggers
- Section 4.5: Highlight common drug interactions
- Section 6: Legal status statement update

Analyze:
- Current SPC sections: {spc_section_4_1}, {spc_section_4_2}, {spc_section_4_3}, {spc_section_4_4}, {spc_section_4_5}
- OTC eligibility: {otc_eligibility}
- Gaps identified: {pil_assessment}`,
          sourceFields: [
            "sfda_guideline",
            "spc_section_4_1",
            "spc_section_4_2",
            "spc_section_4_3",
            "spc_section_4_4",
            "spc_section_4_5",
            "otc_eligibility",
            "pil_assessment",
          ],
          selectedTools: [],
        },
        children: [
          {
            id: "spc_changes",
            name: "required_changes",
            type: "list",
            description: "List of required SPC changes",
            item: {
              id: "spc_change_item",
              name: "change",
              type: "object",
              children: [
                { id: "spc_ch_section", name: "section", type: "string", description: "SPC section (e.g., 4.1, 4.2)" },
                { id: "spc_ch_current", name: "current_text", type: "string", description: "Current text excerpt" },
                { id: "spc_ch_required", name: "required_changes", type: "string", description: "Description of required changes" },
                { id: "spc_ch_suggested", name: "suggested_text", type: "string", description: "Suggested new text" },
                { id: "spc_ch_type", name: "change_type", type: "single_select", description: "Type of change", constraints: { options: ["remove", "modify", "add", "clarify"] } },
                { id: "spc_ch_priority", name: "priority", type: "single_select", description: "Priority", constraints: { options: ["critical", "important", "recommended"] } },
                { id: "spc_ch_rationale", name: "rationale", type: "string", description: "Rationale per SFDA guidelines" },
              ],
            },
          },
          {
            id: "spc_legal_status_update",
            name: "legal_status_update",
            type: "object",
            description: "Section 6 legal status text update",
            children: [
              { id: "spc_ls_current", name: "current_text", type: "string", description: "Current legal status text" },
              { id: "spc_ls_new_en", name: "new_text_en", type: "string", description: "New legal status text (English)" },
              { id: "spc_ls_new_ar", name: "new_text_ar", type: "string", description: "New legal status text (Arabic)" },
            ],
          },
        ],
      },
      {
        id: "pil_transformations",
        name: "pil_transformations",
        type: "object",
        description: "Required PIL modifications for reclassification",
        isTransformation: true,
        transformationType: "gemini_api",
        transformationSource: "column",
        transformationConfig: {
          prompt: `IMPORTANT: Use the SFDA DS-G-133 Guideline document as your primary reference for PIL requirements.

SFDA GUIDELINE DOCUMENT:
@sfda_guideline

Based on Section 4 (Considerations) and Section 7.2 (Requirements) of the guideline, along with the PIL assessment {pil_assessment} and OTC eligibility {otc_eligibility}, identify all PIL modifications needed for OTC use.

Per guideline Section 4, the PIL for OTC products must:
- Provide information on appropriate use
- State circumstances when referral for medical advice is appropriate
- Include contraindications and warnings limiting duration of treatment
- Include advice to consult a doctor in certain situations
- Be easily understood by the general public

For each required change, provide:
1. **section**: PIL section
2. **issue**: What's wrong/missing
3. **current_text**: Current text if modifying existing content
4. **required_change**: What needs to be done
5. **suggested_text_en**: Proposed text in English
6. **suggested_text_ar**: Proposed text in Arabic
7. **priority**: "critical", "important", or "recommended"
8. **guideline_reference**: Specific section of DS-G-133 requiring this

Key additions for OTC PIL per the guideline:
- Clear self-diagnosis guidance for the condition
- Maximum treatment duration before seeing doctor
- Red flag symptoms requiring immediate medical attention
- Drug interaction warnings in lay terms
- Age restrictions and dosing for self-medication
- Storage after opening (if applicable)

PIL Assessment: {pil_assessment}
OTC Eligibility: {otc_eligibility}
Product: {product_identification}`,
          sourceFields: ["sfda_guideline", "pil_assessment", "otc_eligibility", "product_identification"],
          selectedTools: [],
        },
        children: [
          {
            id: "pil_changes",
            name: "required_changes",
            type: "list",
            description: "List of required PIL changes",
            item: {
              id: "pil_change_item",
              name: "change",
              type: "object",
              children: [
                { id: "pil_ch_section", name: "section", type: "string", description: "PIL section" },
                { id: "pil_ch_issue", name: "issue", type: "string", description: "Issue identified" },
                { id: "pil_ch_current", name: "current_text", type: "string", description: "Current text (if modifying)" },
                { id: "pil_ch_required", name: "required_change", type: "string", description: "Required change" },
                { id: "pil_ch_suggested_en", name: "suggested_text_en", type: "string", description: "Suggested text (English)" },
                { id: "pil_ch_suggested_ar", name: "suggested_text_ar", type: "string", description: "Suggested text (Arabic)" },
                { id: "pil_ch_priority", name: "priority", type: "single_select", description: "Priority", constraints: { options: ["critical", "important", "recommended"] } },
              ],
            },
          },
          {
            id: "pil_new_sections",
            name: "new_sections_required",
            type: "list",
            description: "New sections to add to PIL",
            item: {
              id: "pil_new_section_item",
              name: "section",
              type: "object",
              children: [
                { id: "pil_ns_title_en", name: "title_en", type: "string", description: "Section title (English)" },
                { id: "pil_ns_title_ar", name: "title_ar", type: "string", description: "Section title (Arabic)" },
                { id: "pil_ns_content_en", name: "content_en", type: "richtext", description: "Section content (English)" },
                { id: "pil_ns_content_ar", name: "content_ar", type: "richtext", description: "Section content (Arabic)" },
              ],
            },
          },
        ],
      },
      {
        id: "labeling_transformations",
        name: "labeling_transformations",
        type: "object",
        description: "Required labeling/packaging changes",
        isTransformation: true,
        transformationType: "gemini_api",
        transformationSource: "column",
        transformationConfig: {
          prompt: `IMPORTANT: Use the SFDA DS-G-133 Guideline document as your primary reference for labeling requirements.

SFDA GUIDELINE DOCUMENT:
@sfda_guideline

Per Section 4 (Considerations) of the guideline, identify required labeling changes for OTC reclassification.

Consider per the guideline:
- Removal of "Prescription Only" or equivalent statements
- Addition of appropriate OTC cautionary statements (e.g., intravenous use only)
- Pack size considerations for OTC (typically smaller packs)
- Any required warnings on outer packaging
- Symbols or pictograms for OTC designation

Current product: {product_identification}
OTC Eligibility: {otc_eligibility}
Distribution Status Requested: {current_status}`,
          sourceFields: ["sfda_guideline", "product_identification", "otc_eligibility", "current_status"],
          selectedTools: [],
        },
        children: [
          {
            id: "label_changes",
            name: "required_changes",
            type: "list",
            description: "Required labeling changes",
            item: {
              id: "label_change_item",
              name: "change",
              type: "object",
              children: [
                { id: "label_ch_element", name: "element", type: "string", description: "Labeling element" },
                { id: "label_ch_current", name: "current", type: "string", description: "Current state" },
                { id: "label_ch_required", name: "required", type: "string", description: "Required change" },
              ],
            },
          },
          {
            id: "pack_size_recommendation",
            name: "pack_size_recommendation",
            type: "string",
            description: "Recommended pack size for OTC",
          },
          {
            id: "cautionary_statement",
            name: "cautionary_statement",
            type: "object",
            description: "Required cautionary statement",
            children: [
              { id: "caution_en", name: "text_en", type: "string", description: "Cautionary statement (English)" },
              { id: "caution_ar", name: "text_ar", type: "string", description: "Cautionary statement (Arabic)" },
            ],
          },
        ],
      },

      // ═══════════════════════════════════════════════════════════════════════════
      // SECTION 10: COMPLIANCE CHECKLIST & FINAL RECOMMENDATION
      // ═══════════════════════════════════════════════════════════════════════════
      {
        id: "compliance_checklist",
        name: "compliance_checklist",
        type: "object",
        description: "SFDA DS-G-133 compliance checklist with recommendations",
        isTransformation: true,
        transformationType: "gemini_api",
        transformationSource: "column",
        transformationConfig: {
          prompt: `IMPORTANT: Use the SFDA DS-G-133 Guideline document as your primary reference for generating the compliance checklist.

SFDA GUIDELINE DOCUMENT:
@sfda_guideline

Generate a comprehensive compliance checklist based on ALL requirements in the guideline for the reclassification application.

For each requirement from the guideline, provide:
- **requirement**: The exact SFDA requirement from the guideline
- **section_reference**: DS-G-133 section number
- **status**: "COMPLIANT", "NON_COMPLIANT", "PARTIALLY_COMPLIANT", "NOT_APPLICABLE"
- **evidence**: Evidence supporting the status
- **action_required**: Specific action needed if not compliant

Categories to assess per the guideline:
1. **Product Eligibility Criteria** (Section 3.2 - OTC criteria)
2. **Documentation Requirements** (Section 7.2 - cover letter, request form, clinical overview, safety data, PI)
3. **SPC Compliance** (Section 4 - considerations for SPC)
4. **PIL Compliance** (Section 4 - considerations for PIL)
5. **Labeling Requirements** (Section 4 - cautionary statements)

Also provide:
- **overall_compliance_score**: Percentage of requirements met
- **critical_gaps**: List of critical issues that must be resolved per guideline
- **recommended_actions**: Prioritized list of actions before submission
- **estimated_effort**: Assessment of effort required to achieve compliance
- **final_recommendation**: "PROCEED", "PROCEED_WITH_MODIFICATIONS", "NOT_RECOMMENDED"
- **recommendation_rationale**: Detailed rationale referencing specific guideline sections

Data sources:
- Safety Assessment: {safety_assessment}
- OTC Eligibility: {otc_eligibility}
- PIL Assessment: {pil_assessment}
- SPC Transformations: {spc_transformations}
- PIL Transformations: {pil_transformations}
- Labeling: {labeling_transformations}
- Market Experience: {market_experience}`,
          sourceFields: [
            "sfda_guideline",
            "safety_assessment",
            "otc_eligibility",
            "pil_assessment",
            "spc_transformations",
            "pil_transformations",
            "labeling_transformations",
            "market_experience",
          ],
          selectedTools: [],
        },
        children: [
          {
            id: "checklist_items",
            name: "checklist_items",
            type: "list",
            description: "Individual compliance checklist items",
            item: {
              id: "checklist_item",
              name: "item",
              type: "object",
              children: [
                { id: "cl_requirement", name: "requirement", type: "string", description: "SFDA requirement" },
                { id: "cl_section", name: "section_reference", type: "string", description: "DS-G-133 section" },
                { id: "cl_status", name: "status", type: "single_select", description: "Compliance status", constraints: { options: ["COMPLIANT", "NON_COMPLIANT", "PARTIALLY_COMPLIANT", "NOT_APPLICABLE"] } },
                { id: "cl_evidence", name: "evidence", type: "string", description: "Supporting evidence" },
                { id: "cl_action", name: "action_required", type: "string", description: "Action needed" },
              ],
            },
          },
          {
            id: "overall_compliance_score",
            name: "overall_compliance_score",
            type: "number",
            description: "Overall compliance percentage (0-100)",
          },
          {
            id: "critical_gaps",
            name: "critical_gaps",
            type: "list",
            description: "Critical gaps requiring resolution",
            item: {
              id: "critical_gap_item",
              name: "gap",
              type: "string",
              description: "Critical gap description",
            },
          },
          {
            id: "recommended_actions",
            name: "recommended_actions",
            type: "list",
            description: "Prioritized recommended actions",
            item: {
              id: "action_item",
              name: "action",
              type: "object",
              children: [
                { id: "action_priority", name: "priority", type: "number", description: "Priority (1 = highest)" },
                { id: "action_description", name: "description", type: "string", description: "Action description" },
                { id: "action_responsible", name: "responsible_party", type: "string", description: "Responsible party" },
              ],
            },
          },
          {
            id: "final_recommendation",
            name: "final_recommendation",
            type: "single_select",
            description: "Final recommendation for reclassification application",
            constraints: { options: ["PROCEED", "PROCEED_WITH_MODIFICATIONS", "NOT_RECOMMENDED"] },
          },
          {
            id: "recommendation_rationale",
            name: "recommendation_rationale",
            type: "richtext",
            description: "Detailed rationale for the recommendation",
          },
        ],
      },

      // ═══════════════════════════════════════════════════════════════════════════
      // SECTION 11: APPENDIX 1 FORM GENERATION (Per DS-G-133 Appendix 1)
      // ═══════════════════════════════════════════════════════════════════════════
      {
        id: "appendix_1_form",
        name: "appendix_1_form",
        type: "object",
        description: "Pre-filled SFDA Appendix 1 reclassification request form",
        isTransformation: true,
        transformationType: "gemini_api",
        transformationSource: "column",
        transformationConfig: {
          prompt: `IMPORTANT: Use the SFDA DS-G-133 Guideline document to ensure the form matches the exact format in Appendix 1.

SFDA GUIDELINE DOCUMENT:
@sfda_guideline

Generate the pre-filled SFDA Appendix 1 form content based on extracted data, following the EXACT format shown in the guideline's Appendix 1.

Form fields per DS-G-133 Appendix 1:
- Product Name: {product_identification.product_name_en}
- Active Ingredient(s): from {product_identification.active_ingredients}
- Dosage Form: {product_identification.dosage_form}
- Strength and unit: from {product_identification.active_ingredients}
- Route of Administration: {product_identification.route_of_administration}
- Type of request: Based on {current_status}
- Current legal status: {current_status.legal_status}
- Current distribution status: {current_status.distribution_status}
- Requested legal status: {current_status.requested_legal_status}
- Requested distribution status: {current_status.requested_distribution_status}
- Evidence to support reclassification: Summary from {otc_eligibility}, {market_experience}
- List of countries with proposed status: from {market_experience.international_status}

Format as a structured form ready for submission per the guideline's Appendix 1 format.`,
          sourceFields: ["sfda_guideline", "product_identification", "current_status", "otc_eligibility", "market_experience"],
          selectedTools: [],
        },
        children: [
          { id: "form_product_name", name: "product_name", type: "string", description: "Product Name" },
          { id: "form_active_ingredient", name: "active_ingredient", type: "string", description: "Active Ingredient(s)" },
          { id: "form_dosage_form", name: "dosage_form", type: "string", description: "Dosage Form" },
          { id: "form_strength", name: "strength_and_unit", type: "string", description: "Strength and unit of strength" },
          { id: "form_route", name: "route_of_administration", type: "string", description: "Route of Administration" },
          { id: "form_request_type", name: "type_of_request", type: "multi_select", description: "Type of request", constraints: { options: ["Re-classification of legal status", "Re-classification of distribution status"] } },
          { id: "form_current_legal", name: "current_legal_status", type: "single_select", description: "Current legal status", constraints: { options: ["Prescription only medicine", "Over-the-counter medicine"] } },
          { id: "form_current_dist", name: "current_distribution_status", type: "single_select", description: "Current distribution status", constraints: { options: ["Hospital", "Community Pharmacy"] } },
          { id: "form_requested_legal", name: "requested_legal_status", type: "single_select", description: "Requested legal status", constraints: { options: ["Prescription only medicine", "Over-the-counter medicine"] } },
          { id: "form_requested_dist", name: "requested_distribution_status", type: "single_select", description: "Requested distribution status", constraints: { options: ["Hospital", "Community Pharmacy"] } },
          { id: "form_evidence_summary", name: "evidence_summary", type: "richtext", description: "Evidence to support the Reclassification request" },
          { id: "form_countries_list", name: "countries_with_status", type: "richtext", description: "List of countries with proposed legal/distribution status" },
        ],
      },
    ],
  },

  // ── PIL Translation for Emirates Drug Establishment (EDE) ──
  {
    id: "pil-translation-ede",
    name: "PIL Translation (Emirates Drug Establishment)",
    description: "Patient Information Leaflet translation from English to Arabic for UAE drug registration compliance with Emirates Drug Establishment. Produces contextually accurate medical Arabic translation and a regulatory compliance checklist.",
    agentType: "standard",
    fields: [
      // ── Input: Source English PIL ──
      {
        id: "source_pil",
        name: "source_pil",
        type: "input",
        inputType: "document",
        description: "Source English Patient Information Leaflet (PIL) document.",
        required: true,
      },

      // ── Section 0: Drug Identification ──
      {
        id: "drug_identification",
        name: "drug_identification",
        type: "object",
        description: "Drug identification details extracted from the PIL header and body.",
        extractionInstructions: 'Extract from @"source_pil". Capture the trade name, generic/active substance name, dosage form, strength, and marketing authorisation holder exactly as printed.',
        required: true,
        children: [
          { id: "pil_trade_name", name: "trade_name", type: "string", description: "Brand/trade name of the medicine", required: true },
          { id: "pil_generic_name", name: "generic_name", type: "string", description: "Generic/active substance name (INN)" },
          { id: "pil_dosage_form", name: "dosage_form", type: "string", description: "Dosage form (e.g. film-coated tablets, capsules, solution)" },
          { id: "pil_strength", name: "strength", type: "string", description: "Strength/concentration (e.g. 300 mg, 14 mg)" },
          { id: "pil_mah", name: "marketing_authorisation_holder", type: "string", description: "Marketing Authorisation Holder name and address" },
          { id: "pil_manufacturer", name: "manufacturer", type: "string", description: "Manufacturer name and site" },
        ],
      },

      // ── Section 1: What the medicine is and what it is used for ──
      {
        id: "section1_en",
        name: "section1_what_and_indications_en",
        type: "richtext",
        description: "Section 1 English: What the medicine is and what it is used for.",
        extractionInstructions: 'Extract from @"source_pil" the full text of Section 1 covering: what the medicine is, active substance, pharmacological group, therapeutic indications, and mechanism of action. Preserve all original text faithfully.',
        required: true,
      },
      {
        id: "section1_ar",
        name: "section1_what_and_indications_ar",
        type: "richtext",
        description: "Section 1 Arabic: ما هو هذا المستحضر وما هي دواعي استعماله",
        isTransformation: true,
        transformationType: "gemini_api",
        transformationSource: "column",
        transformationConfig: {
          prompt: `You are an expert pharmaceutical translator specializing in Arabic medical translation for UAE Emirates Drug Establishment (EDE) compliance.

Translate the following PIL Section 1 into Modern Standard Arabic (MSA) suitable for patient information leaflets registered with the Emirates Drug Establishment.

TRANSLATION RULES:
- Use formal Medical Arabic (الفصحى) — professional pharmaceutical register
- Use the standard Arabic PIL heading: ".1 ما هو هذا المستحضر وماهي دواعي استعماله"
- Use standardized Arabic medical subsection headings: "ما هو [trade_name]" for What it is, "ما هي دواعي استخدام [trade_name]" for Indications, "كيف يعمل [trade_name]" for How it works
- Preserve ALL medical/scientific terms accurately; use established Arabic medical terminology
- Do NOT transliterate terms that have standard Arabic equivalents (e.g., use "مثبطات المناعة" not a transliteration of "immunosuppressants")
- DO transliterate brand names and chemical compound names that have no Arabic equivalent
- Maintain the same paragraph structure, bullet points, and emphasis as the English source
- Ensure contextual accuracy: meaning must be preserved, not just word-for-word translation
- Use the Arabic medical terminology conventions established by WHO and Arab health authorities

Drug trade name: {drug_identification}

English source text:
{section1_what_and_indications_en}`,
          sourceFields: ["section1_what_and_indications_en", "drug_identification"],
          selectedTools: [],
        },
      },

      // ── Section 2: What you need to know before taking ──
      {
        id: "section2_en",
        name: "section2_before_taking_en",
        type: "richtext",
        description: "Section 2 English: What you need to know before you take/use the medicine.",
        extractionInstructions: 'Extract from @"source_pil" the full text of Section 2 covering: contraindications (Do not take), warnings and precautions, drug interactions, pregnancy/breast-feeding, driving and machines, and excipient warnings. Preserve all original text faithfully.',
        required: true,
      },
      {
        id: "section2_ar",
        name: "section2_before_taking_ar",
        type: "richtext",
        description: "Section 2 Arabic: ما الذي يجب عليك معرفته قبل استعمال هذا المستحضر",
        isTransformation: true,
        transformationType: "gemini_api",
        transformationSource: "column",
        transformationConfig: {
          prompt: `You are an expert pharmaceutical translator specializing in Arabic medical translation for UAE Emirates Drug Establishment (EDE) compliance.

Translate the following PIL Section 2 into Modern Standard Arabic (MSA) suitable for patient information leaflets registered with the Emirates Drug Establishment.

TRANSLATION RULES:
- Use formal Medical Arabic (الفصحى) — professional pharmaceutical register
- Use the standard Arabic PIL heading: ".2 ما الذي يجب عليك معرفته قبل استعمال هذا المستحضر"
- Standard subsection headings to use:
  * "لا تتناول [trade_name]:" for Do not take
  * "تحذيرات واحتياطات" for Warnings and precautions
  * "أدوية أخرى و[trade_name]" for Other medicines
  * "الحمل والرضاعة الطبيعية" for Pregnancy and breast-feeding
  * "القيادة واستخدام الآلات" for Driving and using machines
- Preserve ALL contraindications, warnings, and precautionary text completely — omitting any is a regulatory failure
- Use established Arabic pharmaceutical terminology (e.g., "موانع الاستعمال" for contraindications)
- Gender-sensitive language where applicable (e.g., pregnancy section addresses females directly)
- Maintain bullet point structure and hierarchical formatting
- Ensure contextual accuracy: preserve medical meaning, not just literal translation

Drug trade name: {drug_identification}

English source text:
{section2_before_taking_en}`,
          sourceFields: ["section2_before_taking_en", "drug_identification"],
          selectedTools: [],
        },
      },

      // ── Section 3: How to take/use ──
      {
        id: "section3_en",
        name: "section3_how_to_take_en",
        type: "richtext",
        description: "Section 3 English: How to take/use the medicine.",
        extractionInstructions: 'Extract from @"source_pil" the full text of Section 3 covering: dosage for adults and children, method of administration, duration of treatment, overdose instructions, missed dose instructions, and stopping treatment. Preserve all original text faithfully.',
        required: true,
      },
      {
        id: "section3_ar",
        name: "section3_how_to_take_ar",
        type: "richtext",
        description: "Section 3 Arabic: ماهي طريقة استعمال هذا المستحضر",
        isTransformation: true,
        transformationType: "gemini_api",
        transformationSource: "column",
        transformationConfig: {
          prompt: `You are an expert pharmaceutical translator specializing in Arabic medical translation for UAE Emirates Drug Establishment (EDE) compliance.

Translate the following PIL Section 3 into Modern Standard Arabic (MSA) suitable for patient information leaflets registered with the Emirates Drug Establishment.

TRANSLATION RULES:
- Use formal Medical Arabic (الفصحى) — professional pharmaceutical register
- Use the standard Arabic PIL heading: ".3 ماهي طريقة استعمال هذا المستحضر"
- Standard subsection headings to use:
  * "الجرعة" or "مقدار الجرعة" for Dosage
  * "البالغون" for Adults
  * "الأطفال والمراهقون" for Children and adolescents
  * "طريقة الاستعمال" or "طريقة/موضع الاستخدام" for Method of administration
  * "إذا تناولت [trade_name] أكثر مما ينبغي" for If you take more than you should
  * "إذا نسيت أن تتناول إحدى الجرعات" for If you forget to take
  * "إذا توقفت عن تناول [trade_name]" for If you stop taking
- ALL dosing numbers, units, and frequencies must be translated accurately — dosage errors are critical safety failures
- Preserve exact numeric values; use Arabic-Indic numerals or Western Arabic numerals consistently (Western preferred for doses)
- Maintain bullet point structure and clear formatting for patient readability

Drug trade name: {drug_identification}

English source text:
{section3_how_to_take_en}`,
          sourceFields: ["section3_how_to_take_en", "drug_identification"],
          selectedTools: [],
        },
      },

      // ── Section 4: Possible side effects ──
      {
        id: "section4_en",
        name: "section4_side_effects_en",
        type: "richtext",
        description: "Section 4 English: Possible side effects.",
        extractionInstructions: 'Extract from @"source_pil" the full text of Section 4 covering: all side effects grouped by frequency (very common, common, uncommon, rare, very rare, not known), serious side effects, and reporting instructions. Preserve all original text faithfully including frequency categories.',
        required: true,
      },
      {
        id: "section4_ar",
        name: "section4_side_effects_ar",
        type: "richtext",
        description: "Section 4 Arabic: الأعراض الجانبية المحتملة",
        isTransformation: true,
        transformationType: "gemini_api",
        transformationSource: "column",
        transformationConfig: {
          prompt: `You are an expert pharmaceutical translator specializing in Arabic medical translation for UAE Emirates Drug Establishment (EDE) compliance.

Translate the following PIL Section 4 into Modern Standard Arabic (MSA) suitable for patient information leaflets registered with the Emirates Drug Establishment.

TRANSLATION RULES:
- Use formal Medical Arabic (الفصحى) — professional pharmaceutical register
- Use the standard Arabic PIL heading: ".4 الأعراض الجانبية المحتملة"
- Standard frequency category translations:
  * Very common = "شائعة جداً (قد تؤثر على أكثر من 1 من كل 10 أشخاص)"
  * Common = "شائعة (قد تؤثر على ما يصل إلى 1 من كل 10 أشخاص)"
  * Uncommon = "غير شائعة (قد تؤثر على ما يصل إلى 1 من كل 100 شخص)"
  * Rare = "نادرة (قد تؤثر على ما يصل إلى 1 من كل 1000 شخص)"
  * Very rare = "نادرة جداً (قد تؤثر على ما يصل إلى 1 من كل 10,000 شخص)"
  * Not known = "غير معروفة التكرار (لا يمكن تقدير التكرار من البيانات المتاحة)"
- Standard preamble: "يُمكن أن يُسبّب هذا الدواء أعراضاً جانبية كما هو الحال مع جميع الأدوية، ومع ذلك فإنها لا تحدث لدى الجميع."
- Translate ALL side effects — omitting any is a regulatory failure
- Use established Arabic medical terms for symptoms and conditions
- Include the EDE/UAE adverse event reporting section

Drug trade name: {drug_identification}

English source text:
{section4_side_effects_en}`,
          sourceFields: ["section4_side_effects_en", "drug_identification"],
          selectedTools: [],
        },
      },

      // ── Section 5: How to store ──
      {
        id: "section5_en",
        name: "section5_storage_en",
        type: "richtext",
        description: "Section 5 English: How to store the medicine.",
        extractionInstructions: 'Extract from @"source_pil" the full text of Section 5 covering: storage conditions, expiry date handling, disposal instructions, and child safety warnings. Preserve all original text faithfully.',
        required: true,
      },
      {
        id: "section5_ar",
        name: "section5_storage_ar",
        type: "richtext",
        description: "Section 5 Arabic: طريقة تخزين المستحضر",
        isTransformation: true,
        transformationType: "gemini_api",
        transformationSource: "column",
        transformationConfig: {
          prompt: `You are an expert pharmaceutical translator specializing in Arabic medical translation for UAE Emirates Drug Establishment (EDE) compliance.

Translate the following PIL Section 5 into Modern Standard Arabic (MSA) suitable for patient information leaflets registered with the Emirates Drug Establishment.

TRANSLATION RULES:
- Use formal Medical Arabic (الفصحى) — professional pharmaceutical register
- Use the standard Arabic PIL heading: ".5 طريقة تخزين المستحضر"
- Standard phrases:
  * "يُحفظ هذا الدواء بعيداً عن نظر الأطفال ومتناولهم." for Keep out of sight and reach of children
  * "لا تستخدم هذا الدواء بعد تاريخ انتهاء الصلاحية المذكور على..." for Do not use after expiry
  * "لا تتخلص من أي أدوية عن طريق مياه الصرف الصحي أو النفايات المنزلية." for disposal
- Translate temperature conditions precisely (e.g., "لا يُحفظ في درجة حرارة تتجاوز 30 درجة مئوية")
- Preserve all storage condition details exactly

Drug trade name: {drug_identification}

English source text:
{section5_storage_en}`,
          sourceFields: ["section5_storage_en", "drug_identification"],
          selectedTools: [],
        },
      },

      // ── Section 6: Further information ──
      {
        id: "section6_en",
        name: "section6_further_info_en",
        type: "richtext",
        description: "Section 6 English: Contents of the pack and other information.",
        extractionInstructions: 'Extract from @"source_pil" the full text of Section 6 covering: qualitative composition (active + excipients), physical appearance, pack sizes, MAH details, manufacturer details, and leaflet revision date. Preserve all original text faithfully.',
        required: true,
      },
      {
        id: "section6_ar",
        name: "section6_further_info_ar",
        type: "richtext",
        description: "Section 6 Arabic: معلومات أخرى",
        isTransformation: true,
        transformationType: "gemini_api",
        transformationSource: "column",
        transformationConfig: {
          prompt: `You are an expert pharmaceutical translator specializing in Arabic medical translation for UAE Emirates Drug Establishment (EDE) compliance.

Translate the following PIL Section 6 into Modern Standard Arabic (MSA) suitable for patient information leaflets registered with the Emirates Drug Establishment.

TRANSLATION RULES:
- Use formal Medical Arabic (الفصحى) — professional pharmaceutical register
- Use the standard Arabic PIL heading: ".6 معلومات أخرى"
- Standard subsection headings:
  * "أ. على ماذا يحتوي هذا المستحضر" for What the medicine contains
  * "ب. كيف يبدو شكل هذا المستحضر وماهي محتويات العلبة" for What it looks like and contents of the pack
  * "ت. الشركة المصنعة ومالك حق التسويق" for Marketing Authorization Holder and Manufacturer
  * "ث. تمت مراجعة هذه النشرة في التاريخ الذي تمت فيه مراجعة النشرة بالشهر والسنة" for Last revised date
- Chemical/excipient names: use INN Arabic equivalents where established; transliterate if no Arabic equivalent exists
- Keep MAH and manufacturer names and addresses in Latin script (do not transliterate company names)
- Translate pack descriptions and physical appearance accurately

Drug trade name: {drug_identification}

English source text:
{section6_further_info_en}`,
          sourceFields: ["section6_further_info_en", "drug_identification"],
          selectedTools: [],
        },
      },

      // ── PIL Introductory Text (Arabic) ──
      {
        id: "pil_intro_ar",
        name: "pil_introductory_text_ar",
        type: "richtext",
        description: "Standard Arabic PIL introductory text block that appears before Section 1.",
        isTransformation: true,
        transformationType: "gemini_api",
        transformationSource: "column",
        transformationConfig: {
          prompt: `You are an expert pharmaceutical translator. Generate the standard Arabic PIL introductory block that appears before Section 1 for this drug.

Based on the drug identification {drug_identification} and the source leaflet intro text, produce the standardized Arabic introductory text including:

1. Title line: "نشرة معلومات للمريض" (or "نشرة الدواء: معلومات للمريض")
2. Drug name and form in Arabic
3. The standard reading instruction box:
   "اقرأ محتوى هذه النشرة بعناية قبل البدء في استعمال هذا المستحضر لأنها تحتوي على معلومات هامة لك."
   Including all standard bullet points:
   - احتفظ بهذه النشرة. قد تحتاج إلى قراءتها مرة أخرى.
   - إذا كان لديك أي أسئلة إضافية، اسأل طبيبك أو الصيدلي.
   - وُصف لك هذا الدواء. لا تعطه لغيرك. قد يضرهم حتى لو تشابهت أعراض مرضهم مع أعراضك.
   - إذا أصبت بأي أعراض جانبية، تحدث إلى طبيبك أو الصيدلي. يتضمن هذا أي أعراض جانبية محتملة غير مذكورة في هذه النشرة. انظر القسم 4.
4. Table of contents (محتويات هذه النشرة) with the six sections

Source English intro text:
{section1_what_and_indications_en}

Drug info: {drug_identification}`,
          sourceFields: ["section1_what_and_indications_en", "drug_identification"],
          selectedTools: [],
        },
      },

      // ── Full Assembled Arabic PIL ──
      {
        id: "full_arabic_pil",
        name: "full_arabic_pil",
        type: "richtext",
        description: "Complete assembled Arabic PIL combining all translated sections in EDE-compliant order.",
        isTransformation: true,
        transformationType: "gemini_api",
        transformationSource: "column",
        transformationConfig: {
          prompt: `Assemble a complete Arabic Patient Information Leaflet (PIL) for UAE Emirates Drug Establishment registration by combining the following translated sections in order.

OUTPUT STRUCTURE:
1. Introductory text block (from {pil_introductory_text_ar})
2. Section 1 (from {section1_what_and_indications_ar})
3. Section 2 (from {section2_before_taking_ar})
4. Section 3 (from {section3_how_to_take_ar})
5. Section 4 (from {section4_side_effects_ar})
6. Section 5 (from {section5_storage_ar})
7. Section 6 (from {section6_further_info_ar})

ASSEMBLY RULES:
- Combine all sections into a single continuous document
- Ensure consistent formatting throughout (headings, bullet points, spacing)
- Ensure section numbering is consistent (.1 .2 .3 .4 .5 .6)
- Do NOT modify the translated content — assemble only
- Ensure right-to-left text direction markers are preserved
- The final document should be ready for regulatory submission to EDE`,
          sourceFields: [
            "pil_introductory_text_ar",
            "section1_what_and_indications_ar",
            "section2_before_taking_ar",
            "section3_how_to_take_ar",
            "section4_side_effects_ar",
            "section5_storage_ar",
            "section6_further_info_ar",
          ],
          selectedTools: [],
        },
      },

      // ── EDE Compliance Checklist ──
      {
        id: "ede_compliance_checklist",
        name: "ede_compliance_checklist",
        type: "richtext",
        description: "Emirates Drug Establishment compliance checklist verifying all required PIL elements are present in the Arabic translation.",
        isTransformation: true,
        transformationType: "gemini_api",
        transformationSource: "column",
        transformationConfig: {
          prompt: `You are a UAE Emirates Drug Establishment (EDE) regulatory compliance expert.

Review the complete Arabic PIL translation against the English source to produce a comprehensive compliance checklist.

ENGLISH SOURCE SECTIONS:
Section 1: {section1_what_and_indications_en}
Section 2: {section2_before_taking_en}
Section 3: {section3_how_to_take_en}
Section 4: {section4_side_effects_en}
Section 5: {section5_storage_en}
Section 6: {section6_further_info_en}

ARABIC TRANSLATED SECTIONS:
Section 1 AR: {section1_what_and_indications_ar}
Section 2 AR: {section2_before_taking_ar}
Section 3 AR: {section3_how_to_take_ar}
Section 4 AR: {section4_side_effects_ar}
Section 5 AR: {section5_storage_ar}
Section 6 AR: {section6_further_info_ar}

Drug Info: {drug_identification}

Produce a detailed checklist with the following structure:

## قائمة التحقق من الامتثال لمؤسسة الإمارات للأدوية
## EDE PIL Compliance Checklist

### A. STRUCTURAL COMPLETENESS
For each item, mark: ✅ Present | ❌ Missing | ⚠️ Incomplete

1. **PIL Header / مقدمة النشرة**
   - [ ] Document title "نشرة معلومات للمريض" present
   - [ ] Drug name (trade name) in Arabic
   - [ ] Dosage form and strength in Arabic
   - [ ] Active substance stated
   - [ ] Standard patient reading instructions box
   - [ ] Table of contents with 6 sections

2. **Section 1: ما هو المستحضر وما هي دواعي استعماله**
   - [ ] What the medicine is (pharmacological class)
   - [ ] Active substance name
   - [ ] Therapeutic indication(s) — ALL indications from English present
   - [ ] Mechanism of action (if in source)

3. **Section 2: ما يجب معرفته قبل الاستعمال**
   - [ ] Contraindications (لا تتناول) — ALL listed
   - [ ] Warnings and precautions — ALL warnings present
   - [ ] Drug interactions — ALL interactions listed
   - [ ] Pregnancy and breast-feeding warnings
   - [ ] Driving and machines warning
   - [ ] Excipient warnings (lactose, sodium, etc.)

4. **Section 3: طريقة الاستعمال**
   - [ ] Adult dosage — correct numbers and units
   - [ ] Paediatric dosage (if applicable) — correct numbers and units
   - [ ] Method/route of administration
   - [ ] Duration of treatment guidance
   - [ ] Overdose instructions
   - [ ] Missed dose instructions
   - [ ] Stopping treatment guidance

5. **Section 4: الأعراض الجانبية المحتملة**
   - [ ] Standard preamble text present
   - [ ] Serious side effects section
   - [ ] Side effects by frequency category — ALL categories from English present
   - [ ] ALL individual side effects translated (count English vs Arabic)
   - [ ] Adverse event reporting information (UAE specific)

6. **Section 5: طريقة التخزين**
   - [ ] Storage conditions (temperature, light, moisture)
   - [ ] Child safety warning
   - [ ] Expiry date handling
   - [ ] Disposal instructions

7. **Section 6: معلومات أخرى**
   - [ ] Complete qualitative composition (active + all excipients)
   - [ ] Physical description (appearance, markings)
   - [ ] Pack sizes
   - [ ] Marketing Authorisation Holder details
   - [ ] Manufacturer details
   - [ ] Leaflet revision date

### B. TRANSLATION QUALITY
- [ ] No medical terminology errors detected
- [ ] Dosage numbers and units match English source exactly
- [ ] All frequency categories correctly translated
- [ ] Gender-appropriate language used where applicable
- [ ] Consistent terminology throughout (same Arabic term for same English term)
- [ ] No untranslated English text remaining (except proper nouns/company names)
- [ ] Standard Arabic PIL section headings used correctly

### C. CONTENT COMPLETENESS COMPARISON
- Total contraindications in English vs Arabic: [count]
- Total drug interactions in English vs Arabic: [count]
- Total side effects in English vs Arabic: [count]
- Total warnings in English vs Arabic: [count]

### D. OVERALL VERDICT
- [ ] PASS — Arabic PIL is complete and compliant for EDE submission
- [ ] NEEDS REVISION — Issues identified (list specific items)
- [ ] FAIL — Critical omissions or errors found (list critical items)

Provide specific details for any item marked ❌ or ⚠️, quoting the missing or incorrect content.`,
          sourceFields: [
            "drug_identification",
            "section1_what_and_indications_en",
            "section2_before_taking_en",
            "section3_how_to_take_en",
            "section4_side_effects_en",
            "section5_storage_en",
            "section6_further_info_en",
            "section1_what_and_indications_ar",
            "section2_before_taking_ar",
            "section3_how_to_take_ar",
            "section4_side_effects_ar",
            "section5_storage_ar",
            "section6_further_info_ar",
          ],
          selectedTools: [],
        },
      },
    ],
  },
]

/**
 * Get static schema templates, optionally filtered by user email
 * @param userEmail - The current user's email (optional)
 * @returns Static templates, filtered if userEmail is provided
 */
export function getStaticSchemaTemplates(userEmail?: string | null): SchemaTemplateDefinition[] {
  const allTemplates = STATIC_SCHEMA_TEMPLATES.map((template) => ({
    ...template,
    fields: cloneSchemaFields(template.fields),
    isCustom: false,
  }))

  // If no user email provided, return all unrestricted templates
  if (!userEmail) {
    return allTemplates.filter((template) => {
      return (!template.allowedDomains || template.allowedDomains.length === 0) &&
        (!template.allowedEmails || template.allowedEmails.length === 0)
    })
  }

  // Filter based on email and domain restrictions
  const normalizedUserEmail = userEmail.toLowerCase()
  return allTemplates.filter((template) => {
    // If no restrictions, template is available to everyone
    const hasNoRestrictions =
      (!template.allowedDomains || template.allowedDomains.length === 0) &&
      (!template.allowedEmails || template.allowedEmails.length === 0)

    if (hasNoRestrictions) {
      return true
    }

    // Check email match
    if (template.allowedEmails && template.allowedEmails.length > 0) {
      const emailMatch = template.allowedEmails.some(
        (allowedEmail) => allowedEmail.toLowerCase() === normalizedUserEmail
      )
      if (emailMatch) {
        return true
      }
    }

    // Check domain match
    if (template.allowedDomains && template.allowedDomains.length > 0) {
      const userDomain = normalizedUserEmail.split('@')[1]
      if (userDomain) {
        const domainMatch = template.allowedDomains.some(
          (allowedDomain) => allowedDomain.toLowerCase() === userDomain
        )
        if (domainMatch) {
          return true
        }
      }
    }

    // Restrictions set but user doesn't match
    return false
  })
}
