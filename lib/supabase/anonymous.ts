import type { Session, User } from "@supabase/supabase-js"

/** Check if a Supabase user is anonymous */
export function isAnonymousUser(user: User | null | undefined): boolean {
  return user?.is_anonymous === true
}

/** Check if a session belongs to an anonymous user */
export function isAnonymousSession(session: Session | null | undefined): boolean {
  return isAnonymousUser(session?.user)
}
