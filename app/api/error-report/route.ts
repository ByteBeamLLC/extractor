import { type NextRequest, NextResponse } from "next/server"

export const runtime = "nodejs"

export const maxDuration = 60

/**
 * POST /api/error-report
 *
 * Receives error reports from the app, deduplicates against recent GitHub issues,
 * and creates a new issue with the "auto-bug" label for Claude Code to investigate.
 */
export async function POST(request: NextRequest) {
  // Validate the request is from our app (not open to the internet)
  const origin = request.headers.get("origin") || ""
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || ""
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || ""
  const isLocalhost = origin.includes("localhost") || origin.includes("127.0.0.1")
  const isTrustedOrigin =
    isLocalhost ||
    (appUrl && origin.includes(new URL(appUrl).hostname)) ||
    (siteUrl && origin.includes(new URL(siteUrl).hostname)) ||
    !origin // server-side calls have no origin

  if (!isTrustedOrigin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const token = process.env.GITHUB_ERROR_REPORT_TOKEN
  const repo = process.env.GITHUB_REPO // e.g. "TalalBazerbachi/parsli"

  if (!token || !repo) {
    console.warn("[error-report] GITHUB_ERROR_REPORT_TOKEN or GITHUB_REPO not configured")
    return NextResponse.json({ error: "Not configured" }, { status: 503 })
  }

  let body: Record<string, any>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const { message, stack, route, userId, method, extra, timestamp, fingerprint } = body

  if (!message) {
    return NextResponse.json({ error: "Missing error message" }, { status: 400 })
  }

  // ─── Dedup: check if an open issue with this fingerprint already exists ───
  try {
    const searchQuery = `repo:${repo} is:issue is:open label:auto-bug "${fingerprint}" in:body`
    const searchRes = await fetch(
      `https://api.github.com/search/issues?q=${encodeURIComponent(searchQuery)}&per_page=1`,
      { headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json" } }
    )
    const searchData = await searchRes.json()
    if (searchData.total_count > 0) {
      // Already reported — add a comment with the new occurrence timestamp
      const issueNumber = searchData.items[0].number
      await fetch(`https://api.github.com/repos/${repo}/issues/${issueNumber}/comments`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github+json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          body: `⚡ **Recurring occurrence** at ${timestamp}\n\nRoute: \`${route || "unknown"}\`\nUser: \`${userId || "unknown"}\``,
        }),
      })
      return NextResponse.json({ status: "duplicate", issueNumber })
    }
  } catch (err) {
    console.error("[error-report] GitHub search failed, proceeding to create:", err)
  }

  // ─── Create GitHub Issue ───
  const title = `[Auto] ${route || "App"}: ${message.slice(0, 80)}`
  const issueBody = `## 🚨 Production Error Report

**Reported at:** ${timestamp}
**Route:** \`${route || "unknown"}\`
**Method:** \`${method || "N/A"}\`
**User ID:** \`${userId || "anonymous"}\`

### Error Message
\`\`\`
${message}
\`\`\`

### Stack Trace
\`\`\`
${stack || "No stack trace available"}
\`\`\`

${extra ? `### Additional Context\n\`\`\`json\n${JSON.stringify(extra, null, 2)}\n\`\`\`` : ""}

### Fingerprint
\`${fingerprint}\`

---
*This issue was automatically created by Parsli's error reporting system. Claude Code will investigate and open a fix PR.*
`

  try {
    const res = await fetch(`https://api.github.com/repos/${repo}/issues`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title,
        body: issueBody,
        labels: ["auto-bug"],
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      console.error("[error-report] GitHub issue creation failed:", err)
      return NextResponse.json({ error: "Failed to create issue" }, { status: 502 })
    }

    const issue = await res.json()
    console.log(`[error-report] Created GitHub issue #${issue.number}: ${title}`)
    return NextResponse.json({ status: "created", issueNumber: issue.number })
  } catch (err) {
    console.error("[error-report] GitHub API error:", err)
    return NextResponse.json({ error: "GitHub API error" }, { status: 502 })
  }
}
