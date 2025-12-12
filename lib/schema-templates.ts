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
    id: "sfda-content-generation",
    name: "SFDA Content Generation",
    description: "Three-field standard agent to paste SFDA listing content and generate safety/storage tabs.",
    agentType: "standard",
    fields: [
      {
        id: "sfda_listing_raw",
        name: "sfda_listing_raw",
        type: "richtext",
        description: "Raw SFDA listing HTML/text (Drug Data + PIL/SPC) pasted in.",
        extractionInstructions: "Paste the SFDA listing content exactly as retrieved (English/Arabic). Do not rewrite or summarize here.",
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
          prompt: "Using only {sfda_listing_raw}, extract Possible Side Effects (adverse reactions/contraindications). Read all tabs; prefer English. If not present, return 'not found'. Never add model knowledge.",
          sourceFields: ["sfda_listing_raw"],
          selectedTools: [],
        },
      },
      {
        id: "tab_storage",
        name: "tab_storage",
        type: "richtext",
        description: "Storage/handling tab content sourced only from the SFDA listing.",
        isTransformation: true,
        transformationType: "gemini_api",
        transformationSource: "column",
        transformationConfig: {
          prompt: "Using only {sfda_listing_raw}, extract Storage/handling. Read all tabs; prefer English. If not present, return 'not found'. Never add model knowledge.",
          sourceFields: ["sfda_listing_raw"],
          selectedTools: [],
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
  }
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
