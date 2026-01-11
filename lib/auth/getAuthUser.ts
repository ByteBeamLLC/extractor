/**
 * Centralized authentication utilities for API routes
 */

import { createSupabaseServerClient } from "@/lib/supabase/server"
import type { User } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

/**
 * Authentication result from getAuthUser
 */
export interface AuthResult {
  user: User | null
  error: string | null
}

/**
 * Gets the authenticated user from the current request context.
 * Returns null user (not an error) if unauthenticated.
 */
export async function getAuthUser(): Promise<AuthResult> {
  try {
    const supabase = createSupabaseServerClient()
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()

    if (error) {
      console.error("[auth] Failed to get user:", error.message)
      return { user: null, error: error.message }
    }

    return { user, error: null }
  } catch (error) {
    console.error("[auth] Exception getting user:", error)
    return {
      user: null,
      error: error instanceof Error ? error.message : "Unknown authentication error",
    }
  }
}

/**
 * Requires authentication and returns the user.
 * Throws a NextResponse error if not authenticated.
 */
export async function requireAuth(): Promise<User> {
  const { user, error } = await getAuthUser()

  if (error) {
    throw NextResponse.json({ error: "Authentication failed", details: error }, { status: 401 })
  }

  if (!user) {
    throw NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  return user
}

/**
 * Higher-order function that wraps an API route handler with authentication.
 * Returns 401 if user is not authenticated.
 *
 * @example
 * ```ts
 * export const POST = withAuth(async (request, user) => {
 *   // user is guaranteed to be authenticated here
 *   return NextResponse.json({ userId: user.id })
 * })
 * ```
 */
export function withAuth<T>(
  handler: (request: Request, user: User) => Promise<NextResponse<T>>
): (request: Request) => Promise<NextResponse<T | { error: string }>> {
  return async (request: Request) => {
    const { user, error } = await getAuthUser()

    if (error) {
      return NextResponse.json(
        { error: "Authentication failed", details: error },
        { status: 401 }
      ) as NextResponse<{ error: string }>
    }

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 }) as NextResponse<{
        error: string
      }>
    }

    return handler(request, user)
  }
}

/**
 * Creates a standard unauthorized response
 */
export function unauthorizedResponse(message = "Unauthorized"): NextResponse {
  return NextResponse.json({ error: message }, { status: 401 })
}

/**
 * Creates a standard forbidden response
 */
export function forbiddenResponse(message = "Forbidden"): NextResponse {
  return NextResponse.json({ error: message }, { status: 403 })
}
