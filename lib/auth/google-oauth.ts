/**
 * Google OAuth for sign-in / sign-up.
 * Reuses the same GOOGLE_CLIENT_ID / SECRET as Gmail integration,
 * but requests only email + profile — no mailbox access.
 */

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"

const SCOPES = [
  "https://www.googleapis.com/auth/userinfo.email",
  "https://www.googleapis.com/auth/userinfo.profile",
]

function getClientId() {
  const id = process.env.GOOGLE_CLIENT_ID
  if (!id) throw new Error("GOOGLE_CLIENT_ID is not set")
  return id
}

function getClientSecret() {
  const secret = process.env.GOOGLE_CLIENT_SECRET
  if (!secret) throw new Error("GOOGLE_CLIENT_SECRET is not set")
  return secret
}

export function buildGoogleAuthUrl(redirectUri: string, state: string): string {
  const params = new URLSearchParams({
    client_id: getClientId(),
    redirect_uri: redirectUri,
    response_type: "code",
    scope: SCOPES.join(" "),
    prompt: "select_account",
    state,
  })
  return `${GOOGLE_AUTH_URL}?${params.toString()}`
}

export async function exchangeCodeForUser(
  code: string,
  redirectUri: string
): Promise<{ email: string; name: string }> {
  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: getClientId(),
      client_secret: getClientSecret(),
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Token exchange failed: ${err}`)
  }

  const data = await res.json()

  const userInfoRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
    headers: { Authorization: `Bearer ${data.access_token}` },
  })

  if (!userInfoRes.ok) {
    throw new Error("Failed to fetch Google user info")
  }

  const userInfo = await userInfoRes.json()
  return { email: userInfo.email, name: userInfo.name ?? "" }
}
