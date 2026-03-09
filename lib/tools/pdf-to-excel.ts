/**
 * Client-side PDF to Excel conversion using pdf.js (CDN) + SheetJS (CDN).
 * Zero server cost — everything runs in the browser.
 * Libraries loaded from CDN to avoid Next.js webpack bundling issues.
 */

// pdf.js v3 ships UMD builds (.js) that work reliably via <script> tag.
// v4+ only ships ESM (.mjs) which has cross-origin import() issues in browsers.
const PDFJS_CDN = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174"
const XLSX_CDN = "https://cdn.sheetjs.com/xlsx-0.20.3/package/dist/xlsx.full.min.js"

interface TextItem {
  str: string
  transform: number[]
  width: number
  height: number
}

// Load UMD script via <script> tag (for SheetJS which exposes window.XLSX)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function loadScript(src: string, globalName: string): Promise<any> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const existing = (window as any)[globalName]
  if (existing) return Promise.resolve(existing)

  return new Promise((resolve, reject) => {
    const script = document.createElement("script")
    script.src = src
    script.async = true
    script.onload = () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const lib = (window as any)[globalName]
      if (lib) resolve(lib)
      else reject(new Error(`${globalName} not found after loading ${src}`))
    }
    script.onerror = () => reject(new Error(`Failed to load ${src}`))
    document.head.appendChild(script)
  })
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let pdfjsLib: any = null
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let XLSX: any = null

async function getPdfjs() {
  if (!pdfjsLib) {
    // pdf.js v3 UMD exposes window.pdfjsLib
    pdfjsLib = await loadScript(`${PDFJS_CDN}/pdf.min.js`, "pdfjsLib")
    pdfjsLib.GlobalWorkerOptions.workerSrc = `${PDFJS_CDN}/pdf.worker.min.js`
  }
  return pdfjsLib
}

async function getXLSX() {
  if (!XLSX) {
    // SheetJS ships UMD — load via script tag
    XLSX = await loadScript(XLSX_CDN, "XLSX")
  }
  return XLSX
}

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface PositionedText {
  str: string
  x: number
  y: number
  width: number
  height: number
  fontSize: number
}

export interface ConversionResult {
  sheets: { name: string; data: (string | number)[][] }[]
  totalRows: number
  totalPages: number
  fileName: string
}

/* ------------------------------------------------------------------ */
/*  Step 1 — Extract positioned text items from PDF                    */
/* ------------------------------------------------------------------ */

async function extractTextItems(
  file: File
): Promise<{ pages: PositionedText[][]; numPages: number }> {
  const pdfjs = await getPdfjs()
  const arrayBuffer = await file.arrayBuffer()
  const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise
  const pages: PositionedText[][] = []

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const textContent = await page.getTextContent()
    const items: PositionedText[] = []

    for (const item of textContent.items) {
      if (!("str" in item)) continue
      const t = item as TextItem
      if (t.str.trim() === "") continue

      items.push({
        str: t.str,
        x: t.transform[4],
        y: t.transform[5],
        width: t.width,
        height: t.height,
        fontSize: Math.abs(t.transform[0]),
      })
    }
    pages.push(items)
  }

  return { pages, numPages: pdf.numPages }
}

/* ------------------------------------------------------------------ */
/*  Step 2 — Cluster text items into rows & columns                    */
/* ------------------------------------------------------------------ */

function clusterIntoTable(
  items: PositionedText[],
  yTolerance = 3,
  xGapThreshold = 8
): string[][] {
  if (items.length === 0) return []

  // Sort by Y descending (PDF Y goes bottom → top), then X ascending
  const sorted = [...items].sort((a, b) => b.y - a.y || a.x - b.x)

  // Group into rows by Y proximity
  const rows: PositionedText[][] = []
  let currentRow: PositionedText[] = [sorted[0]]
  let currentY = sorted[0].y

  for (let i = 1; i < sorted.length; i++) {
    if (Math.abs(sorted[i].y - currentY) <= yTolerance) {
      currentRow.push(sorted[i])
    } else {
      rows.push(currentRow)
      currentRow = [sorted[i]]
      currentY = sorted[i].y
    }
  }
  rows.push(currentRow)

  // Sort each row left → right
  for (const row of rows) {
    row.sort((a, b) => a.x - b.x)
  }

  // Detect column boundaries from all X positions
  const allXStarts: number[] = rows
    .flatMap((row) => row.map((item) => Math.round(item.x)))
    .sort((a, b) => a - b)

  // Deduplicate and cluster X positions
  const columnEdges: number[] = [allXStarts[0]]
  for (let i = 1; i < allXStarts.length; i++) {
    if (allXStarts[i] - columnEdges[columnEdges.length - 1] > xGapThreshold) {
      columnEdges.push(allXStarts[i])
    }
  }

  const numCols = columnEdges.length

  // Assign each item to the closest column
  const table: string[][] = []
  for (const row of rows) {
    const tableRow: string[] = new Array(numCols).fill("")
    for (const item of row) {
      let colIdx = 0
      let minDist = Infinity
      for (let c = 0; c < columnEdges.length; c++) {
        const dist = Math.abs(item.x - columnEdges[c])
        if (dist < minDist) {
          minDist = dist
          colIdx = c
        }
      }
      tableRow[colIdx] = tableRow[colIdx]
        ? tableRow[colIdx] + " " + item.str
        : item.str
    }
    // Skip empty rows
    if (tableRow.some((cell) => cell.trim() !== "")) {
      table.push(tableRow)
    }
  }

  return table
}

/* ------------------------------------------------------------------ */
/*  Step 3 — Smart type detection (numbers, dates, currencies)         */
/* ------------------------------------------------------------------ */

function parseCell(value: string): string | number {
  const trimmed = value.trim()
  if (trimmed === "") return ""

  // Try currency ($1,234.56 or €1.234,56)
  const currencyMatch = trimmed.match(
    /^[\$€£¥]?\s?-?[\d,.\s]+[\$€£¥]?$/
  )
  if (currencyMatch) {
    const cleaned = trimmed.replace(/[\$€£¥\s]/g, "").replace(/,/g, "")
    const n = Number(cleaned)
    if (!isNaN(n)) return n
  }

  // Try plain number
  const plainNumber = trimmed.replace(/,/g, "")
  if (/^-?\d+\.?\d*$/.test(plainNumber)) {
    return Number(plainNumber)
  }

  // Try percentage
  if (/^-?\d+\.?\d*\s?%$/.test(trimmed)) {
    return Number(trimmed.replace(/[%\s]/g, "")) / 100
  }

  return trimmed
}

function parseTableTypes(table: string[][]): (string | number)[][] {
  return table.map((row) => row.map(parseCell))
}

/* ------------------------------------------------------------------ */
/*  Public API                                                         */
/* ------------------------------------------------------------------ */

export async function convertPdfToExcel(file: File): Promise<ConversionResult> {
  const { pages, numPages } = await extractTextItems(file)

  const sheets: { name: string; data: (string | number)[][] }[] = []
  let totalRows = 0

  if (numPages === 1) {
    // Single page → single sheet
    const raw = clusterIntoTable(pages[0])
    const data = parseTableTypes(raw)
    totalRows = data.length
    sheets.push({ name: "Sheet1", data })
  } else {
    // Multi-page: try combining all first (for tables that span pages)
    // If pages seem like the same table (similar column count), combine them.
    // Otherwise, separate sheets per page.
    const pageTables = pages.map((p) => clusterIntoTable(p))
    const colCounts = pageTables.map((t) => (t[0]?.length ?? 0))

    // Check if all pages have the same column count (likely one continuous table)
    const allSameColumns =
      colCounts.length > 0 &&
      colCounts.every((c) => c === colCounts[0] && c > 0)

    if (allSameColumns) {
      // Combine into one sheet, skip duplicate headers
      const combined: string[][] = []
      for (let p = 0; p < pageTables.length; p++) {
        const table = pageTables[p]
        if (p === 0) {
          combined.push(...table)
        } else {
          // Skip first row if it looks like a repeated header
          const firstRow = table[0]?.join("|")
          const headerRow = pageTables[0][0]?.join("|")
          const startIdx = firstRow === headerRow ? 1 : 0
          combined.push(...table.slice(startIdx))
        }
      }
      const data = parseTableTypes(combined)
      totalRows = data.length
      sheets.push({ name: "Sheet1", data })
    } else {
      // Different tables per page → separate sheets
      for (let p = 0; p < pageTables.length; p++) {
        const data = parseTableTypes(pageTables[p])
        totalRows += data.length
        if (data.length > 0) {
          sheets.push({ name: `Page ${p + 1}`, data })
        }
      }
    }
  }

  const baseName = file.name.replace(/\.pdf$/i, "")

  return {
    sheets,
    totalRows,
    totalPages: numPages,
    fileName: `${baseName}.xlsx`,
  }
}

export async function downloadExcel(result: ConversionResult) {
  const xlsx = await getXLSX()
  const workbook = xlsx.utils.book_new()

  for (const sheet of result.sheets) {
    const worksheet = xlsx.utils.aoa_to_sheet(sheet.data)

    // Auto-size columns
    if (sheet.data.length > 0) {
      const colWidths = sheet.data[0].map((_, colIdx) => {
        const maxLen = Math.max(
          ...sheet.data.map((row) => String(row[colIdx] ?? "").length)
        )
        return { wch: Math.min(maxLen + 2, 50) }
      })
      worksheet["!cols"] = colWidths
    }

    xlsx.utils.book_append_sheet(workbook, worksheet, sheet.name)
  }

  xlsx.writeFile(workbook, result.fileName)
}
