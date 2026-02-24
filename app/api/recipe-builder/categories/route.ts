import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * Recipe Builder Categories API
 *
 * GET /api/recipe-builder/categories
 *   - Returns distinct recipe categories for filter dropdowns
 */

export async function GET() {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data, error } = await supabase
      .from('recipes')
      .select('category')

    if (error) {
      throw error
    }

    // Extract unique non-empty categories
    const categories = [...new Set(
      (data || [])
        .map((r: any) => r.category)
        .filter(Boolean)
    )].sort()

    return NextResponse.json({ data: categories })
  } catch (error: any) {
    console.error('Categories API error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
