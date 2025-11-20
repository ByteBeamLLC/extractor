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
    id: "pharma-artwork",
    name: "Pharma Artwork",
    description: "Capture batch numbers, expiry dates, and packaging metadata.",
    agentType: "pharma",
    fields: [
      {
        id: "product_name",
        name: "product_name",
        type: "string",
        description: "Product name as printed on artwork.",
        required: true,
      },
      {
        id: "batch_number",
        name: "batch_number",
        type: "string",
        description: "Batch/Lot number (e.g., LOT/BN).",
        required: true,
      },
      {
        id: "manufacturing_date",
        name: "manufacturing_date",
        type: "date",
        description: "Manufacturing date (MFG).",
      },
      {
        id: "expiry_date",
        name: "expiry_date",
        type: "date",
        description: "Expiry/Best Before date (EXP).",
        required: true,
      },
      { id: "barcode", name: "barcode", type: "string", description: "Linear/2D barcode data if present." },
      {
        id: "pharmacode",
        name: "pharmacode",
        type: "string",
        description: "Pharmacode value printed for packaging control.",
      },
    ],
  },
  {
    id: "pharma-content",
    name: "Pharma Ecommerce Content",
    description: "Generate product page content aligned to Saudi FDA terminology.",
    agentType: "pharma",
    fields: [
      {
        id: "product_name",
        name: "product_name",
        type: "string",
        description: "Product name as displayed online.",
        required: true,
      },
      {
        id: "generic_name",
        name: "generic_name",
        type: "string",
        description: "Generic/active ingredient name.",
      },
      {
        id: "dosage_form",
        name: "dosage_form",
        type: "string",
        description: "Dosage form (tablet, capsule, syrup, etc.).",
      },
      {
        id: "strength",
        name: "strength",
        type: "string",
        description: "Strength or concentration of the medication.",
      },
      {
        id: "indications",
        name: "indications",
        type: "richtext",
        description: "Indications for use (aligned to regulator terminology).",
      },
      {
        id: "side_effects",
        name: "side_effects",
        type: "richtext",
        description: "Common side effects to surface online.",
      },
    ],
  },
  {
    id: "fmcg-localization",
    name: "FMCG Localization",
    description: "Extract and translate food & beverage packaging data from OCR with multilingual support (English/Arabic).",
    agentType: "standard",
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
  }
]

export function getStaticSchemaTemplates(): SchemaTemplateDefinition[] {
  return STATIC_SCHEMA_TEMPLATES.map((template) => ({
    ...template,
    fields: cloneSchemaFields(template.fields),
    isCustom: false,
  }))
}

