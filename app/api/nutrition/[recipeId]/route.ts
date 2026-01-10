import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

/**
 * Public Nutrition API
 *
 * GET /api/nutrition/[recipeId]
 *   - Returns nutrition data for a recipe (public access, no auth required)
 *   - Only returns nutrition-related fields, not sensitive data
 *   - Uses service role to bypass RLS for public read access
 */

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ recipeId: string }> }
) {
  try {
    const { recipeId } = await params

    if (!recipeId) {
      return NextResponse.json(
        { error: 'Recipe ID required' },
        { status: 400 }
      )
    }

    // Use service role key to bypass RLS for public nutrition access
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { data: recipe, error } = await supabase
      .from('recipes')
      .select('id, name, category, serving, nutrition, allergens, may_contain_allergens, barcode, status')
      .eq('id', recipeId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Recipe not found' },
          { status: 404 }
        )
      }
      throw error
    }

    // Check if recipe is published - only published recipes are publicly accessible
    if (recipe.status !== 'PUBLISHED') {
      return NextResponse.json(
        { error: 'This recipe is not yet published' },
        { status: 403 }
      )
    }

    // Remove status from response (not needed by client)
    const { status, ...publicData } = recipe

    return NextResponse.json({ data: publicData })
  } catch (error: any) {
    console.error('Nutrition API error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
