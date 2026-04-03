import { NextResponse } from "next/server"

const INDEXNOW_KEY = "c866517674d6c2147b03a5a4b5e56b54"
const HOST = "parsli.co"

// All search engines that support IndexNow
const ENGINES = [
  "https://api.indexnow.org/indexnow",
  "https://www.bing.com/indexnow",
  "https://yandex.com/indexnow",
  "https://searchadvisor.naver.com/indexnow",
]

export async function POST(request: Request) {
  // Simple auth check — only allow from localhost or with secret
  const authHeader = request.headers.get("authorization")
  const secret = process.env.INDEXNOW_SECRET || "parsli-indexnow-2026"
  if (authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let urls: string[]
  try {
    const body = await request.json()
    urls = body.urls
    if (!Array.isArray(urls) || urls.length === 0) {
      return NextResponse.json(
        { error: "Body must include a non-empty 'urls' array" },
        { status: 400 }
      )
    }
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  // Cap at 10,000 per IndexNow spec
  const batch = urls.slice(0, 10000)

  const payload = {
    host: HOST,
    key: INDEXNOW_KEY,
    keyLocation: `https://${HOST}/${INDEXNOW_KEY}.txt`,
    urlList: batch,
  }

  const results: { engine: string; status: number; ok: boolean }[] = []

  // Submit to all engines in parallel
  await Promise.all(
    ENGINES.map(async (engine) => {
      try {
        const res = await fetch(engine, {
          method: "POST",
          headers: { "Content-Type": "application/json; charset=utf-8" },
          body: JSON.stringify(payload),
        })
        results.push({ engine, status: res.status, ok: res.ok })
      } catch (err) {
        results.push({
          engine,
          status: 0,
          ok: false,
        })
      }
    })
  )

  return NextResponse.json({
    submitted: batch.length,
    results,
  })
}
