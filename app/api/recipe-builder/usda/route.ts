import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

/**
 * USDA FoodData Central API
 *
 * Queries USDA ingredient data from local Supabase database.
 * Data is imported from USDA FoodData Central (Foundation Foods + SR Legacy).
 *
 * Run the import script first: npx tsx scripts/import-usda-data.ts
 */

// Initialize Supabase client
function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase environment variables')
  }

  return createClient(supabaseUrl, supabaseKey)
}

// Transform database row to API response format
function transformDbRow(row: any) {
  return {
    id: row.fdc_id.toString(),
    fdcId: row.fdc_id,
    name: row.description,
    description: row.description,
    dataType: row.data_type,
    foodCategory: row.food_category || 'Unknown',
    scientificName: row.scientific_name,
    publicationDate: row.publication_date,
    nutrients: row.nutrients || {},
    source: 'USDA',
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action') || 'search'

    const supabase = getSupabaseClient()

    switch (action) {
      case 'search': {
        const query = searchParams.get('query') || ''
        const pageSize = parseInt(searchParams.get('pageSize') || '25', 10)
        const pageNumber = parseInt(searchParams.get('pageNumber') || '1', 10)

        if (!query || query.length < 2) {
          return NextResponse.json({ data: [], totalHits: 0, totalPages: 0 })
        }

        // Calculate offset for pagination
        const offset = (pageNumber - 1) * pageSize

        // Search using full-text search with Foundation foods prioritized
        // First, get total count
        const { count: totalHits } = await supabase
          .from('usda_ingredients')
          .select('*', { count: 'exact', head: true })
          .ilike('description', `%${query}%`)

        // Then get paginated results, ordered by data_type (Foundation first)
        const { data: results, error } = await supabase
          .from('usda_ingredients')
          .select('*')
          .ilike('description', `%${query}%`)
          .order('data_type', { ascending: true }) // 'Foundation' comes before 'SR Legacy'
          .order('description', { ascending: true })
          .range(offset, offset + pageSize - 1)

        if (error) {
          console.error('Supabase search error:', error)
          return NextResponse.json(
            { error: 'Failed to search ingredients' },
            { status: 500 }
          )
        }

        const totalPages = Math.ceil((totalHits || 0) / pageSize)

        return NextResponse.json({
          data: (results || []).map(transformDbRow),
          totalHits: totalHits || 0,
          currentPage: pageNumber,
          totalPages,
        })
      }

      case 'get': {
        const fdcId = searchParams.get('fdcId')
        if (!fdcId) {
          return NextResponse.json(
            { error: 'Missing fdcId parameter' },
            { status: 400 }
          )
        }

        const { data: food, error } = await supabase
          .from('usda_ingredients')
          .select('*')
          .eq('fdc_id', parseInt(fdcId, 10))
          .single()

        if (error || !food) {
          return NextResponse.json(
            { error: 'Food not found' },
            { status: 404 }
          )
        }

        return NextResponse.json({ data: transformDbRow(food) })
      }

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('USDA API route error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
