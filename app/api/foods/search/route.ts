/**
 * Foundation Foods Search API
 * 
 * GET /api/foods/search?q=chicken&limit=20&sources=usda_sr,uk_cofid
 * 
 * Query Parameters:
 * - q: Search query (required)
 * - limit: Max results (default: 50, max: 100)
 * - offset: Pagination offset (default: 0)
 * - sources: Comma-separated data sources to filter
 * - foodGroups: Comma-separated food groups to filter
 * - halalOnly: Only return halal foods (true/false)
 * - useFallback: Use USDA API fallback if local results are empty (true/false)
 */

import { NextRequest, NextResponse } from 'next/server';
import { 
  searchFoods, 
  quickSearch, 
  getFoodById, 
  getStats, 
  getFoodGroups,
  type DataSource 
} from '@/lib/label-maker/foundation-foods';
import { searchUSDA, quickSearchUSDA, getUSDAFood } from '@/lib/label-maker/usda-api';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Check for special endpoints
    const action = searchParams.get('action');
    
    if (action === 'stats') {
      const stats = await getStats();
      return NextResponse.json(stats);
    }
    
    if (action === 'groups') {
      const groups = await getFoodGroups();
      return NextResponse.json(groups);
    }
    
    if (action === 'get') {
      const id = searchParams.get('id');
      if (!id) {
        return NextResponse.json(
          { error: 'Missing id parameter' },
          { status: 400 }
        );
      }
      
      // Check if this is a USDA API result (id starts with usda_)
      if (id.startsWith('usda_')) {
        const fdcId = parseInt(id.replace('usda_', ''));
        const usdaFood = await getUSDAFood(fdcId);
        if (usdaFood) {
          // Convert USDA format to FoodSearchResult format
          return NextResponse.json({
            id: usdaFood.id,
            source: `usda_${usdaFood.dataType.toLowerCase().replace(/\s+/g, '_')}`,
            sourceId: String(usdaFood.fdcId),
            description: usdaFood.description,
            foodGroup: usdaFood.category,
            nutrition: usdaFood.nutrition,
            allergens: [],
            sourceAttribution: usdaFood.sourceAttribution,
          });
        }
        return NextResponse.json(
          { error: 'Food not found' },
          { status: 404 }
        );
      }
      
      const food = await getFoodById(id);
      if (!food) {
        return NextResponse.json(
          { error: 'Food not found' },
          { status: 404 }
        );
      }
      return NextResponse.json(food);
    }
    
    // Main search
    const query = searchParams.get('q') || searchParams.get('query');
    
    if (!query) {
      return NextResponse.json(
        { error: 'Missing query parameter (q)' },
        { status: 400 }
      );
    }
    
    // Parse parameters
    const limit = Math.min(
      parseInt(searchParams.get('limit') || '50'),
      100
    );
    const offset = parseInt(searchParams.get('offset') || '0');
    const sourcesParam = searchParams.get('sources');
    const foodGroupsParam = searchParams.get('foodGroups');
    const halalOnly = searchParams.get('halalOnly') === 'true';
    const quick = searchParams.get('quick') === 'true';
    const useFallback = searchParams.get('useFallback') !== 'false'; // Default true
    
    // Quick search for autocomplete
    if (quick) {
      let results = await quickSearch(query, limit);
      
      // Fallback to USDA API if no local results and fallback enabled
      if (results.length === 0 && useFallback) {
        try {
          const usdaResults = await quickSearchUSDA(query, limit);
          results = usdaResults;
        } catch (e) {
          console.warn('USDA fallback failed:', e);
        }
      }
      
      return NextResponse.json(results);
    }
    
    // Full search
    const sources = sourcesParam 
      ? sourcesParam.split(',').filter(Boolean) as DataSource[]
      : undefined;
    
    const foodGroups = foodGroupsParam
      ? foodGroupsParam.split(',').filter(Boolean)
      : undefined;
    
    let results = await searchFoods({
      query,
      sources,
      foodGroups,
      halalOnly,
      limit,
      offset,
    });
    
    let usedFallback = false;
    
    // Fallback to USDA API if no local results and fallback enabled
    if (results.length === 0 && useFallback && !sources) {
      try {
        const usdaFoods = await searchUSDA(query, { pageSize: limit });
        results = usdaFoods.map(food => ({
          id: food.id,
          source: `usda_${food.dataType.toLowerCase().replace(/\s+/g, '_')}` as DataSource,
          sourceId: String(food.fdcId),
          description: food.description,
          foodGroup: food.category,
          nutrition: food.nutrition,
          allergens: [],
          sourceAttribution: food.sourceAttribution,
        }));
        usedFallback = true;
      } catch (e) {
        console.warn('USDA fallback failed:', e);
      }
    }
    
    return NextResponse.json({
      results,
      count: results.length,
      query,
      usedFallback,
      params: {
        limit,
        offset,
        sources: sources || 'all',
        foodGroups: foodGroups || 'all',
        halalOnly,
      },
    });
    
  } catch (error) {
    console.error('Food search API error:', error);
    return NextResponse.json(
      { 
        error: 'Search failed', 
        message: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

// Enable dynamic rendering
export const dynamic = 'force-dynamic';

