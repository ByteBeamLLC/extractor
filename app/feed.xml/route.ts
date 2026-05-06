import { NextResponse } from "next/server"
import { SFDA_TOOLS } from "@/lib/sfda/tools"

const BASE_URL = "https://bytebeam.co"
const FEED_TITLE = "Bytebeam — SFDA Regulatory Tools"
const FEED_DESCRIPTION =
  "AI agents for SFDA pharma regulatory work — SmPC and PIL generation, Arabic translation, dossier gap analysis."

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;")
}

export async function GET() {
  const buildDate = new Date().toUTCString()

  const items = SFDA_TOOLS.map((tool) => {
    const url = `${BASE_URL}/sfda/${tool.slug}`
    return `    <item>
      <title>${escapeXml(tool.name)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <description>${escapeXml(tool.metaDescription)}</description>
      <category>SFDA Tools</category>
      <pubDate>${buildDate}</pubDate>
    </item>`
  }).join("\n")

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(FEED_TITLE)}</title>
    <link>${BASE_URL}/sfda</link>
    <atom:link href="${BASE_URL}/feed.xml" rel="self" type="application/rss+xml" />
    <description>${escapeXml(FEED_DESCRIPTION)}</description>
    <language>en-US</language>
    <lastBuildDate>${buildDate}</lastBuildDate>
    <generator>Next.js — Bytebeam</generator>
${items}
  </channel>
</rss>`

  return new NextResponse(rss, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  })
}
