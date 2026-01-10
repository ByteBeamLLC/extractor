import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * Recipe Builder Lookups API
 *
 * GET /api/recipe-builder/lookups
 *   - Get all lookup data (nutrients, allergens, diet_types)
 */

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get lookups
    const { data: lookups, error } = await supabase
      .from('recipe_lookups')
      .select('*')
      .eq('id', 'main')
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Lookups not found' },
          { status: 404 }
        )
      }
      throw error
    }

    return NextResponse.json({
      data: {
        nutrients: lookups.nutrients || {},
        allergens: lookups.allergens || {},
        may_contain_allergens: lookups.may_contain_allergens || {},
        diet_types: lookups.diet_types || {},
      },
    })
  } catch (error: any) {
    console.error('Lookups API error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()

    const { data: lookups, error } = await supabase
      .from('recipe_lookups')
      .upsert({
        id: 'main',
        nutrients: body.nutrients,
        allergens: body.allergens,
        may_contain_allergens: body.may_contain_allergens,
        diet_types: body.diet_types,
      }, { onConflict: 'id' })
      .select()
      .single()

    if (error) {
      throw error
    }

    return NextResponse.json({ data: lookups })
  } catch (error: any) {
    console.error('Lookups API error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
