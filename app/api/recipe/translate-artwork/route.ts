import { type NextRequest, NextResponse } from "next/server"
import { generateObject } from "@/lib/openrouter"
import { createClient } from "@/lib/supabase/server"
import { z } from "zod"

export const runtime = 'nodejs'
export const maxDuration = 60

// Schema for the translation response
const ArtworkTranslationSchema = z.object({
    productNameArabic: z.string().describe("Arabic translation of the product name"),
    ingredientsArabic: z.array(z.string()).describe("Arabic translations of each ingredient"),
    suitableForArabic: z.array(z.string()).describe("Arabic translations of diet types"),
    containsAllergensArabic: z.array(z.string()).describe("Arabic translations of allergens"),
})

type ArtworkTranslation = z.infer<typeof ArtworkTranslationSchema>

const TRANSLATION_PROMPT = `You are an expert Arabic translator specializing in food product labeling for the UAE market. Your translations must be accurate, culturally appropriate, and compliant with UAE food labeling regulations.

## Critical Requirements:

1. **Cultural & Religious Sensitivity**:
   - Respect Islamic dietary requirements
   - Use appropriate Arabic food terminology
   - Avoid any terms that could be offensive or culturally inappropriate

2. **Ingredient Translation Rules**:
   - Use standard Arabic food names commonly used in UAE markets
   - Keep brand names transliterated phonetically (e.g., "Sriracha" → "سريراتشا")
   - Translate common ingredients to their UAE market equivalents
   - Use formal Modern Standard Arabic with Gulf region preferences

3. **Unit Translation**:
   - g (gram) → غ
   - kg (kilogram) → كغ
   - ml (milliliter) → مل
   - L (liter) → ل

4. **Diet Types Translation**:
   - "Vegan" → "نباتي صرف"
   - "Vegetarian" → "نباتي"
   - "Gluten Free" → "خالٍ من الغلوتين"
   - "High Protein" → "عالي البروتين"
   - "Low Carb" → "منخفض الكربوهيدرات"
   - "Keto" → "كيتو"
   - "Halal" → "حلال"
   - "Non-Vegetarian" → "غير نباتي"
   - "Dairy Free" → "خالٍ من الألبان"

5. **Allergen Translation**:
   - "Egg Yolk" → "صفار البيض"
   - "Soy" → "فول الصويا"
   - "Mustard" → "الخردل"
   - "Garlic" → "الثوم"
   - "Corn" → "الذرة"
   - "Red Chilli" → "الفلفل الأحمر"
   - "Gluten (Wheat, Oats, Rye, Barley)" → "الغلوتين (القمح، الشوفان، الجاودار، الشعير)"
   - "Sesame Seeds" → "بذور السمسم"
   - "Sea Foods" → "المأكولات البحرية"
   - "Fish" → "السمك"
   - "Milk" → "الحليب"
   - "Eggs" → "البيض"
   - "Tree nuts" → "المكسرات"
   - "Peanuts" → "الفول السوداني"
   - "Crustaceans" → "القشريات"
   - "Celery" → "الكرفس"
   - "Sulphites" → "الكبريتيت"
   - "Lupin" → "الترمس"
   - "Molluscs" → "الرخويات"

6. **Number Format**: Keep all numbers in Western Arabic numerals (0-9), NOT Eastern Arabic (٠-٩)

Translate the following product information to Arabic. Return ONLY the JSON object with the translations.`

// Helper to create a hash of translatable content for change detection
function createTranslatableHash(data: {
    name: string
    ingredients: string[]
    allergens: string[]
    dietTypes: string[]
}): string {
    const content = JSON.stringify({
        name: data.name,
        ingredients: data.ingredients.sort(),
        allergens: data.allergens.sort(),
        dietTypes: data.dietTypes.sort(),
    })
    // Simple hash - in production you might want a proper hash function
    let hash = 0
    for (let i = 0; i < content.length; i++) {
        const char = content.charCodeAt(i)
        hash = ((hash << 5) - hash) + char
        hash = hash & hash // Convert to 32bit integer
    }
    return hash.toString(36)
}

// POST: Translate and store for a recipe
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { recipeId, force = false } = body

        if (!recipeId) {
            return NextResponse.json({
                success: false,
                error: "recipeId is required"
            }, { status: 400 })
        }

        const supabase = await createClient()

        // Fetch the recipe
        const { data: recipe, error: fetchError } = await supabase
            .from('recipes')
            .select('id, name, ingredients, allergens, diet_types, name_ar, ingredients_ar, allergens_ar, diet_types_ar, translations_updated_at')
            .eq('id', recipeId)
            .single()

        if (fetchError || !recipe) {
            return NextResponse.json({
                success: false,
                error: fetchError?.message || "Recipe not found"
            }, { status: 404 })
        }

        // Extract ingredient names
        const ingredientNames = Array.isArray(recipe.ingredients)
            ? recipe.ingredients.map((ing: { name?: string }) => ing.name || '').filter(Boolean)
            : []

        const allergens = recipe.allergens || []
        const dietTypes = recipe.diet_types || []

        // Check if translations already exist and are up-to-date
        const hasTranslations = recipe.name_ar &&
            Array.isArray(recipe.ingredients_ar) &&
            recipe.ingredients_ar.length > 0

        if (hasTranslations && !force) {
            // Return existing translations
            return NextResponse.json({
                success: true,
                data: {
                    productNameArabic: recipe.name_ar,
                    ingredientsArabic: recipe.ingredients_ar,
                    suitableForArabic: recipe.diet_types_ar || [],
                    containsAllergensArabic: recipe.allergens_ar || [],
                },
                cached: true
            })
        }

        // Generate new translations
        const userPrompt = `Translate the following food product information to Arabic:

Product Name: ${recipe.name}

Ingredients (translate each one, maintain order):
${ingredientNames.map((i: string, idx: number) => `${idx + 1}. ${i}`).join('\n') || 'None'}

Suitable For / Diet Types (translate each one):
${dietTypes.map((s: string, idx: number) => `${idx + 1}. ${s}`).join('\n') || 'None'}

Contains Allergens (translate each one):
${allergens.map((a: string, idx: number) => `${idx + 1}. ${a}`).join('\n') || 'None'}

Remember:
- Keep ingredient order exactly the same
- Translate diet types and allergens accurately
- Use UAE food labeling standards
- Product name should be an appealing Arabic translation, not just transliteration`

        const { object: translation } = await generateObject<typeof ArtworkTranslationSchema>({
            messages: [
                { role: 'system', content: TRANSLATION_PROMPT },
                { role: 'user', content: userPrompt }
            ],
            schema: ArtworkTranslationSchema,
            temperature: 0.2,
        })

        // Store translations in the database
        const { error: updateError } = await supabase
            .from('recipes')
            .update({
                name_ar: translation.productNameArabic,
                ingredients_ar: translation.ingredientsArabic,
                allergens_ar: translation.containsAllergensArabic,
                diet_types_ar: translation.suitableForArabic,
                translations_updated_at: new Date().toISOString(),
            })
            .eq('id', recipeId)

        if (updateError) {
            console.error("[translate-artwork] Failed to store translations:", updateError)
            // Still return the translations even if storage failed
        }

        return NextResponse.json({
            success: true,
            data: translation as ArtworkTranslation,
            cached: false,
            stored: !updateError
        })

    } catch (error) {
        console.error("[recipe/translate-artwork] Error:", error)
        const errorMessage = error instanceof Error ? error.message : "Unknown error"
        return NextResponse.json({
            success: false,
            error: errorMessage
        }, { status: 500 })
    }
}

// PATCH: Update specific translations when recipe fields change
export async function PATCH(request: NextRequest) {
    try {
        const body = await request.json()
        const { recipeId, fieldsToTranslate } = body

        if (!recipeId) {
            return NextResponse.json({
                success: false,
                error: "recipeId is required"
            }, { status: 400 })
        }

        if (!fieldsToTranslate || !Array.isArray(fieldsToTranslate) || fieldsToTranslate.length === 0) {
            return NextResponse.json({
                success: false,
                error: "fieldsToTranslate array is required"
            }, { status: 400 })
        }

        const validFields = ['name', 'ingredients', 'allergens', 'diet_types']
        const invalidFields = fieldsToTranslate.filter((f: string) => !validFields.includes(f))
        if (invalidFields.length > 0) {
            return NextResponse.json({
                success: false,
                error: `Invalid fields: ${invalidFields.join(', ')}. Valid fields are: ${validFields.join(', ')}`
            }, { status: 400 })
        }

        const supabase = await createClient()

        // Fetch the recipe with current data
        const { data: recipe, error: fetchError } = await supabase
            .from('recipes')
            .select('id, name, ingredients, allergens, diet_types, name_ar, ingredients_ar, allergens_ar, diet_types_ar')
            .eq('id', recipeId)
            .single()

        if (fetchError || !recipe) {
            return NextResponse.json({
                success: false,
                error: fetchError?.message || "Recipe not found"
            }, { status: 404 })
        }

        // Build translation request based on fields that need updating
        const translateData: {
            productName?: string
            ingredients?: string[]
            suitableFor?: string[]
            containsAllergens?: string[]
        } = {}

        if (fieldsToTranslate.includes('name')) {
            translateData.productName = recipe.name
        }
        if (fieldsToTranslate.includes('ingredients')) {
            translateData.ingredients = Array.isArray(recipe.ingredients)
                ? recipe.ingredients.map((ing: { name?: string }) => ing.name || '').filter(Boolean)
                : []
        }
        if (fieldsToTranslate.includes('allergens')) {
            translateData.containsAllergens = recipe.allergens || []
        }
        if (fieldsToTranslate.includes('diet_types')) {
            translateData.suitableFor = recipe.diet_types || []
        }

        // Build prompt for partial translation
        let userPrompt = `Translate the following food product information to Arabic:\n\n`

        if (translateData.productName) {
            userPrompt += `Product Name: ${translateData.productName}\n\n`
        }
        if (translateData.ingredients && translateData.ingredients.length > 0) {
            userPrompt += `Ingredients (translate each one, maintain order):\n${translateData.ingredients.map((i, idx) => `${idx + 1}. ${i}`).join('\n')}\n\n`
        }
        if (translateData.suitableFor && translateData.suitableFor.length > 0) {
            userPrompt += `Suitable For / Diet Types (translate each one):\n${translateData.suitableFor.map((s, idx) => `${idx + 1}. ${s}`).join('\n')}\n\n`
        }
        if (translateData.containsAllergens && translateData.containsAllergens.length > 0) {
            userPrompt += `Contains Allergens (translate each one):\n${translateData.containsAllergens.map((a, idx) => `${idx + 1}. ${a}`).join('\n')}\n\n`
        }

        // Create a partial schema based on what we need to translate
        const PartialTranslationSchema = z.object({
            productNameArabic: translateData.productName ? z.string() : z.string().optional(),
            ingredientsArabic: translateData.ingredients ? z.array(z.string()) : z.array(z.string()).optional(),
            suitableForArabic: translateData.suitableFor ? z.array(z.string()) : z.array(z.string()).optional(),
            containsAllergensArabic: translateData.containsAllergens ? z.array(z.string()) : z.array(z.string()).optional(),
        })

        const { object: translation } = await generateObject<typeof PartialTranslationSchema>({
            messages: [
                { role: 'system', content: TRANSLATION_PROMPT },
                { role: 'user', content: userPrompt }
            ],
            schema: PartialTranslationSchema,
            temperature: 0.2,
        })

        // Build update object with only the translated fields
        const updateData: Record<string, unknown> = {
            translations_updated_at: new Date().toISOString(),
        }

        if (translation.productNameArabic && fieldsToTranslate.includes('name')) {
            updateData.name_ar = translation.productNameArabic
        }
        if (translation.ingredientsArabic && fieldsToTranslate.includes('ingredients')) {
            updateData.ingredients_ar = translation.ingredientsArabic
        }
        if (translation.containsAllergensArabic && fieldsToTranslate.includes('allergens')) {
            updateData.allergens_ar = translation.containsAllergensArabic
        }
        if (translation.suitableForArabic && fieldsToTranslate.includes('diet_types')) {
            updateData.diet_types_ar = translation.suitableForArabic
        }

        // Store updated translations
        const { error: updateError } = await supabase
            .from('recipes')
            .update(updateData)
            .eq('id', recipeId)

        if (updateError) {
            console.error("[translate-artwork] Failed to update translations:", updateError)
            return NextResponse.json({
                success: false,
                error: updateError.message
            }, { status: 500 })
        }

        return NextResponse.json({
            success: true,
            data: translation,
            updatedFields: fieldsToTranslate
        })

    } catch (error) {
        console.error("[recipe/translate-artwork PATCH] Error:", error)
        const errorMessage = error instanceof Error ? error.message : "Unknown error"
        return NextResponse.json({
            success: false,
            error: errorMessage
        }, { status: 500 })
    }
}
