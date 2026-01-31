import { type NextRequest, NextResponse } from "next/server"
// @ts-expect-error - html-to-docx has no type declarations
import HTMLtoDOCX from "html-to-docx"
import { marked } from "marked"

const isLikelyHtml = (value: string) => /<([a-z][\s\S]*?)>/i.test(value)

export async function POST(request: NextRequest) {
  try {
    const { html, fileName } = await request.json()

    if (!html || typeof html !== "string") {
      return NextResponse.json({ error: "Missing or invalid 'html' field" }, { status: 400 })
    }

    // Convert markdown to HTML if the content isn't already HTML
    let htmlContent = html
    if (!isLikelyHtml(html)) {
      htmlContent = await marked.parse(html, { gfm: true, breaks: true })
    }

    // Detect if content contains Arabic/RTL characters
    const hasArabic = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/.test(htmlContent)
    const dir = hasArabic ? "rtl" : "ltr"
    const align = hasArabic ? "right" : "left"

    // Wrap in a full HTML document with proper styling
    const fullHtml = `<!DOCTYPE html>
<html dir="${dir}" lang="${hasArabic ? "ar" : "en"}">
<head>
  <meta charset="UTF-8">
  <style>
    body {
      font-family: "Calibri", "Arial", sans-serif;
      font-size: 12pt;
      line-height: 1.6;
      direction: ${dir};
      text-align: ${align};
      color: #1a1a1a;
    }
    h1 { font-size: 20pt; font-weight: bold; margin: 16pt 0 8pt; }
    h2 { font-size: 16pt; font-weight: bold; margin: 14pt 0 6pt; }
    h3 { font-size: 13pt; font-weight: bold; margin: 12pt 0 4pt; }
    p { margin: 6pt 0; }
    ul, ol { margin: 6pt 0; padding-${hasArabic ? "right" : "left"}: 20pt; }
    li { margin: 3pt 0; }
    table { border-collapse: collapse; width: 100%; margin: 8pt 0; }
    th, td { border: 1px solid #999; padding: 4pt 8pt; text-align: ${align}; }
    th { background-color: #f0f0f0; font-weight: bold; }
    strong, b { font-weight: bold; }
    em, i { font-style: italic; }
    blockquote { border-${hasArabic ? "right" : "left"}: 3px solid #ccc; padding-${hasArabic ? "right" : "left"}: 10pt; margin: 6pt 0; color: #555; }
  </style>
</head>
<body>
${htmlContent}
</body>
</html>`

    const docxBuffer = await HTMLtoDOCX(fullHtml, undefined, {
      table: { row: { cantSplit: true } },
      footer: true,
      pageNumber: true,
    })

    const safeName = (fileName || "document").replace(/[^a-z0-9_-]/gi, "_")

    const arrayBuffer = docxBuffer instanceof Buffer
      ? new Uint8Array(docxBuffer)
      : new Uint8Array(docxBuffer as ArrayBuffer)

    return new NextResponse(arrayBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="${safeName}.docx"`,
      },
    })
  } catch (error) {
    console.error("[bytebeam] DOCX export error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate DOCX" },
      { status: 500 }
    )
  }
}
