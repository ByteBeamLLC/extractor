/**
 * Gmail OAuth2 utilities using native fetch (no googleapis package).
 * Handles auth URL generation, token exchange, refresh, and Gmail API calls.
 */

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
const GMAIL_API_BASE = "https://gmail.googleapis.com/gmail/v1"
const SCOPES = [
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/userinfo.email",
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

function getRedirectUri() {
  const uri = process.env.GOOGLE_REDIRECT_URI
  if (!uri) throw new Error("GOOGLE_REDIRECT_URI is not set")
  return uri
}

export function buildGmailAuthUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: getClientId(),
    redirect_uri: getRedirectUri(),
    response_type: "code",
    scope: SCOPES.join(" "),
    access_type: "offline",
    prompt: "consent",
    state,
  })
  return `${GOOGLE_AUTH_URL}?${params.toString()}`
}

export async function exchangeCodeForTokens(code: string): Promise<{
  access_token: string
  refresh_token: string
  expiry_date: number
  email: string
}> {
  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: getClientId(),
      client_secret: getClientSecret(),
      redirect_uri: getRedirectUri(),
      grant_type: "authorization_code",
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Token exchange failed: ${err}`)
  }

  const data = await res.json()

  // Get user email from userinfo endpoint
  const userInfoRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
    headers: { Authorization: `Bearer ${data.access_token}` },
  })
  const userInfo = await userInfoRes.json()

  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expiry_date: Date.now() + (data.expires_in ?? 3600) * 1000,
    email: userInfo.email,
  }
}

export async function refreshAccessToken(refreshToken: string): Promise<{
  access_token: string
  expiry_date: number
}> {
  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: getClientId(),
      client_secret: getClientSecret(),
      grant_type: "refresh_token",
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Token refresh failed: ${err}`)
  }

  const data = await res.json()
  return {
    access_token: data.access_token,
    expiry_date: Date.now() + (data.expires_in ?? 3600) * 1000,
  }
}

// --- Gmail API helpers ---

async function gmailFetch(accessToken: string, path: string): Promise<any> {
  const res = await fetch(`${GMAIL_API_BASE}${path}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })

  if (res.status === 401) {
    throw new GmailAuthError("Gmail access revoked or token expired")
  }

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Gmail API error (${res.status}): ${err}`)
  }

  return res.json()
}

export class GmailAuthError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "GmailAuthError"
  }
}

export async function listMessages(
  accessToken: string,
  query: string,
  maxResults = 20
): Promise<{ id: string; threadId: string }[]> {
  const params = new URLSearchParams({
    q: query,
    maxResults: String(maxResults),
  })
  const data = await gmailFetch(accessToken, `/users/me/messages?${params}`)
  return data.messages ?? []
}

export async function getMessage(
  accessToken: string,
  messageId: string
): Promise<GmailMessage> {
  return gmailFetch(accessToken, `/users/me/messages/${messageId}`)
}

export async function getAttachment(
  accessToken: string,
  messageId: string,
  attachmentId: string
): Promise<string> {
  const data = await gmailFetch(
    accessToken,
    `/users/me/messages/${messageId}/attachments/${attachmentId}`
  )
  // Gmail returns base64url — convert to standard base64
  return data.data.replace(/-/g, "+").replace(/_/g, "/")
}

// --- Gmail message type ---

export interface GmailMessage {
  id: string
  threadId: string
  payload: GmailPayload
  internalDate: string
}

export interface GmailPayload {
  mimeType: string
  filename?: string
  body?: { attachmentId?: string; size?: number; data?: string }
  headers?: { name: string; value: string }[]
  parts?: GmailPayload[]
}

/**
 * Extracts attachment info from a Gmail message by recursively walking MIME parts.
 */
export function extractAttachments(
  payload: GmailPayload
): { filename: string; mimeType: string; attachmentId: string; size: number }[] {
  const attachments: { filename: string; mimeType: string; attachmentId: string; size: number }[] = []

  function walk(part: GmailPayload) {
    if (part.filename && part.body?.attachmentId) {
      attachments.push({
        filename: part.filename,
        mimeType: part.mimeType,
        attachmentId: part.body.attachmentId,
        size: part.body.size ?? 0,
      })
    }
    if (part.parts) {
      for (const child of part.parts) {
        walk(child)
      }
    }
  }

  walk(payload)
  return attachments
}
