import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * Recipe Builder Stats API
 *
 * GET /api/recipe-builder/stats
 *   - Returns lightweight recipe counts for the dashboard
 */

export async function GET() {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Run count queries in parallel
    const [totalResult, publishedResult, draftResult, subRecipeResult, ingredientsResult] = await Promise.all([
      supabase.from('recipes').select('*', { count: 'exact', head: true }),
      supabase.from('recipes').select('*', { count: 'exact', head: true }).eq('status', 'PUBLISHED'),
      supabase.from('recipes').select('*', { count: 'exact', head: true }).eq('status', 'DRAFT'),
      supabase.from('recipes').select('*', { count: 'exact', head: true }).eq('metadata->>is_sub_recipe', 'true'),
      supabase.from('recipes').select('ingredients'),
    ])

    // Count total ingredients across all recipes
    const ingredientsCount = (ingredientsResult.data || []).reduce(
      (acc: number, r: any) => acc + (Array.isArray(r.ingredients) ? r.ingredients.length : 0),
      0
    )

    return NextResponse.json({
      data: {
        recipesCount: totalResult.count || 0,
        publishedCount: publishedResult.count || 0,
        draftCount: draftResult.count || 0,
        subRecipesCount: subRecipeResult.count || 0,
        ingredientsCount,
        menusCount: 0,
      },
    })
  } catch (error: any) {
    console.error('Stats API error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
