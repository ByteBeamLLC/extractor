import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * Recipe Builder Access API
 *
 * GET /api/recipe-builder/access
 *   - Check if current user has access to Recipe Builder
 *   - Returns { hasAccess: boolean, role: 'admin' | 'user' | null }
 */

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({
        hasAccess: false,
        role: null,
        email: null,
        debug: { authError: authError?.message, step: 'auth' }
      })
    }

    // Check if user has recipe builder access
    const { data: rbUser, error } = await supabase
      .from('recipe_builder_users')
      .select('email, role, is_active')
      .eq('email', user.email)
      .eq('is_active', true)
      .single()

    if (error || !rbUser) {
      return NextResponse.json({
        hasAccess: false,
        role: null,
        email: user.email,
        debug: { dbError: error?.message, code: error?.code, step: 'db_query' }
      })
    }

    return NextResponse.json({
      hasAccess: true,
      role: rbUser.role,
      email: user.email,
    })
  } catch (error: any) {
    console.error('Access API error:', error)
    return NextResponse.json({
      hasAccess: false,
      role: null,
      email: null,
      debug: { error: error.message, step: 'catch' }
    })
  }
}
