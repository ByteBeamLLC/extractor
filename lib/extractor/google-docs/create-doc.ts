/**
 * Creates a Google Doc from extraction results using the Google Drive API.
 *
 * Uses the "upload with conversion" approach:
 *   1. Build HTML content from extraction results
 *   2. Upload as multipart to Google Drive with mimeType conversion to Google Docs
 *
 * This is simpler and more reliable than the Google Docs API's document-level formatting.
 */

import { refreshAccessToken } from "./oauth"
import type { SupabaseClient } from "@supabase/supabase-js"
import type { GoogleDocsConfig } from "@/lib/extractor/types"

const DRIVE_UPLOAD_URL = "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&convert=true"

interface CreateDocOptions {
  results: Record<string, any>
  fileName: string
  parserName: string
  processedAt: string | null
  folderId?: string | null
}

/**
 * Creates a Google Doc from extraction results and returns the doc URL.
 */
export async function createGoogleDoc(
  config: GoogleDocsConfig,
  options: CreateDocOptions,
  integrationId: string,
  supabase: SupabaseClient
): Promise<{ docUrl: string; docId: string }> {
  // Refresh token if needed
  let accessToken = config.access_token
  const tokenExpiry = new Date(config.token_expiry).getTime()
  if (Date.now() > tokenExpiry - 5 * 60 * 1000) {
    const refreshed = await refreshAccessToken(config.refresh_token)
    accessToken = refreshed.access_token
    // Update tokens in DB
    await supabase
      .from("parser_integrations" as any)
      .update({
        config: {
          ...config,
          access_token: refreshed.access_token,
          token_expiry: new Date(refreshed.expiry_date).toISOString(),
        },
      } as any)
      .eq("id", integrationId)
  }

  const htmlContent = buildHtmlFromResults(options)
  const docTitle = `${options.parserName} - ${options.fileName}`

  // Google Drive multipart upload with conversion to Google Docs
  const metadata: Record<string, any> = {
    name: docTitle,
    mimeType: "application/vnd.google-apps.document",
  }

  if (config.folder_id) {
    metadata.parents = [config.folder_id]
  }

  const boundary = "parsli_boundary_" + Date.now()
  const body = [
    `--${boundary}`,
    "Content-Type: application/json; charset=UTF-8",
    "",
    JSON.stringify(metadata),
    `--${boundary}`,
    "Content-Type: text/html; charset=UTF-8",
    "",
    htmlContent,
    `--${boundary}--`,
  ].join("\r\n")

  const res = await fetch(DRIVE_UPLOAD_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": `multipart/related; boundary=${boundary}`,
    },
    body,
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Google Drive API error (${res.status}): ${err}`)
  }

  const data = await res.json()
  const docId = data.id
  const docUrl = `https://docs.google.com/document/d/${docId}/edit`

  return { docUrl, docId }
}

/**
 * Builds a clean HTML document from extraction results.
 */
function buildHtmlFromResults(options: CreateDocOptions): string {
  const { results, fileName, parserName, processedAt } = options
  const { __meta__, ...data } = results

  const dateStr = processedAt
    ? new Date(processedAt).toLocaleString("en-US", {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : "N/A"

  let body = `
    <h1>${escapeHtml(parserName)}</h1>
    <p><strong>Document:</strong> ${escapeHtml(fileName)}</p>
    <p><strong>Processed:</strong> ${escapeHtml(dateStr)}</p>
    <hr />
  `

  body += renderValue(data, 0)

  return `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="font-family: Arial, sans-serif; font-size: 11pt; line-height: 1.5;">
${body}
</body>
</html>`
}

function renderValue(value: any, depth: number): string {
  if (value === null || value === undefined || value === "-") {
    return `<em style="color: #999;">—</em>`
  }

  if (typeof value === "boolean") {
    return value ? "Yes" : "No"
  }

  if (Array.isArray(value)) {
    if (value.length === 0) return "<em>empty</em>"

    // Array of objects → render as table
    if (typeof value[0] === "object" && value[0] !== null) {
      const keys = Object.keys(value[0])
      let html = `<table border="1" cellpadding="4" cellspacing="0" style="border-collapse: collapse; width: 100%; margin: 8px 0;">`
      html += `<tr>${keys.map((k) => `<th style="background: #f0f0f0; text-align: left;">${escapeHtml(formatKey(k))}</th>`).join("")}</tr>`
      for (const row of value) {
        html += `<tr>${keys.map((k) => `<td>${renderValue(row[k], depth + 1)}</td>`).join("")}</tr>`
      }
      html += `</table>`
      return html
    }

    // Array of primitives
    return `<ul>${value.map((v) => `<li>${renderValue(v, depth + 1)}</li>`).join("")}</ul>`
  }

  if (typeof value === "object") {
    const entries = Object.entries(value)
    if (entries.length === 0) return "<em>empty</em>"

    const headingTag = depth === 0 ? "h2" : "h3"
    let html = ""
    for (const [key, val] of entries) {
      if (typeof val === "object" && val !== null && !Array.isArray(val)) {
        html += `<${headingTag}>${escapeHtml(formatKey(key))}</${headingTag}>`
        html += renderValue(val, depth + 1)
      } else if (Array.isArray(val)) {
        html += `<${headingTag}>${escapeHtml(formatKey(key))}</${headingTag}>`
        html += renderValue(val, depth + 1)
      } else {
        html += `<p><strong>${escapeHtml(formatKey(key))}:</strong> ${renderValue(val, depth + 1)}</p>`
      }
    }
    return html
  }

  return escapeHtml(String(value))
}

function formatKey(key: string): string {
  return key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}
