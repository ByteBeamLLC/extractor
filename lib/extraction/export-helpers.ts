// Export helpers for CSV export and label printing

import type { ExtractionJob, SchemaField } from "@/lib/schema"
import type { AgentType } from "./types"

/**
 * Format a cell value for CSV export
 */
function formatCell(val: unknown): string {
  if (val === undefined || val === null) return ''
  if (typeof val === 'object') {
    try {
      return JSON.stringify(val)
    } catch {
      return String(val)
    }
  }
  return String(val)
}

/**
 * Escape a string for CSV (handle commas, quotes, newlines)
 */
function escapeCSV(cell: string): string {
  if (cell.includes(',') || cell.includes('"') || cell.includes('\n')) {
    return '"' + cell.replace(/"/g, '""') + '"'
  }
  return cell
}

export interface ExportCSVOptions {
  jobs: ExtractionJob[]
  displayColumns: SchemaField[]
  selectedAgent: AgentType
  schemaName: string
}

/**
 * Export extraction results to a CSV file download
 */
export function exportResultsToCSV(options: ExportCSVOptions): void {
  const { jobs, displayColumns, selectedAgent, schemaName } = options

  let headers: string[]
  let rows: string[][]

  // Check if this is pharma agent
  if (selectedAgent === 'pharma') {
    // Pharma-specific CSV export
    headers = [
      'File Name',
      'Status',
      'Trade Name',
      'Generic Name',
      'Manufacturer',
      'Drug Type',
      'Registration Number',
      'Description',
      'Composition',
      'How To Use',
      'Indication',
      'Possible Side Effects',
      'Properties',
      'Storage',
      'Matched Drug URL',
      'Search URL'
    ]

    rows = jobs.map((job) => {
      const pharmaData = job.results?.pharma_data as Record<string, unknown> | undefined
      const drugInfo = pharmaData?.drugInfo as Record<string, unknown> | undefined
      const detailedInfo = pharmaData?.detailedInfo as Record<string, unknown> | undefined

      return [
        job.fileName,
        job.status,
        formatCell(drugInfo?.tradeName),
        formatCell(drugInfo?.genericName),
        formatCell(drugInfo?.manufacturer),
        formatCell(drugInfo?.drugType),
        formatCell(drugInfo?.registrationNumber),
        formatCell(detailedInfo?.description),
        formatCell(detailedInfo?.composition),
        formatCell(detailedInfo?.howToUse),
        formatCell(detailedInfo?.indication),
        formatCell(detailedInfo?.possibleSideEffects),
        formatCell(detailedInfo?.properties),
        formatCell(detailedInfo?.storage),
        formatCell(pharmaData?.matchedDrugUrl),
        formatCell(pharmaData?.searchUrl)
      ]
    })
  } else {
    // Standard extraction CSV export
    headers = ['File Name', 'Status', ...displayColumns.map((col) => col.name)]

    rows = jobs.map((job) => {
      const row: string[] = [job.fileName, job.status]
      displayColumns.forEach((col) => {
        const value = job.results?.[col.id]
        row.push(formatCell(value))
      })
      return row
    })
  }

  // Convert to CSV string
  const csvContent = [
    headers.map(escapeCSV).join(','),
    ...rows.map((row) => row.map(escapeCSV).join(',')),
  ].join('\n')

  // Create blob and download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  link.setAttribute('href', url)
  const schemaLabel = selectedAgent === 'pharma' 
    ? 'pharma_extraction' 
    : (schemaName || 'schema').replace(/[^a-z0-9-_]+/gi, '_')
  link.setAttribute('download', `${schemaLabel}_results_${new Date().toISOString().split('T')[0]}.csv`)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

// ============================================================================
// F&B Localized Label Printing
// ============================================================================

/**
 * HTML escape helper
 */
function escapeHtml(s: unknown): string {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

/**
 * Join array into comma-separated string
 */
function joinList(arr: unknown[]): string {
  return Array.isArray(arr) ? arr.filter(Boolean).join(', ') : ''
}

/**
 * Create a Set of lowercase allergen strings
 */
function allergenSetFrom(arr: unknown[]): Set<string> {
  return new Set((Array.isArray(arr) ? arr : []).map((x) => String(x || '').toLowerCase()))
}

/**
 * Bold allergens in a list of ingredients
 */
function boldAllergens(list: unknown[], allergens: Set<string>): string {
  if (!Array.isArray(list)) return ''
  return list.map((it) => {
    const s = String(it || '')
    const lower = s.toLowerCase()
    let highlighted = s
    allergens.forEach((al) => {
      if (!al) return
      if (lower.includes(al)) {
        const re = new RegExp(al.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'ig')
        highlighted = highlighted.replace(re, (m) => `<strong>${escapeHtml(m)}</strong>`)
      }
    })
    return highlighted
  }).join(', ')
}

/**
 * Generate a row pair for the nutritional facts table
 */
function rowPair(labelEn: string, labelAr: string, vEn: unknown, vAr: unknown): string {
  return `
    <tr>
      <td style="padding:6px 8px;border:1px solid #ccc;">${escapeHtml(labelEn)} / ${escapeHtml(labelAr)}</td>
      <td style="padding:6px 8px;border:1px solid #ccc;text-align:center;">
        ${escapeHtml(vEn || '')}${vEn ? '' : ''} ${vEn && vAr ? '/' : ''} ${escapeHtml(vAr || '')}
      </td>
    </tr>`
}

export interface PrintLocalizedLabelOptions {
  job: ExtractionJob
}

/**
 * Print a localized F&B label in a new window
 */
export function printLocalizedLabel(options: PrintLocalizedLabelOptions): void {
  const { job } = options

  try {
    if (!job || job.status !== 'completed') {
      alert('No completed job to print')
      return
    }
    
    const tr = job.results?.fnb_translation as Record<string, unknown> | undefined
    if (!tr) {
      alert('Translation data not available yet')
      return
    }
    
    const en = (tr.english_product_info || {}) as Record<string, unknown>
    const ar = (tr.arabic_product_info || {}) as Record<string, unknown>

    const enAllergens = allergenSetFrom(en.allergyInformation as unknown[])
    const arAllergens = allergenSetFrom(ar.allergyInformation as unknown[])

    const enNutrition = en?.nutritionalInformationPer100g as Record<string, unknown> | undefined
    const arNutrition = ar?.nutritionalInformationPer100g as Record<string, unknown> | undefined
    const enEnergy = enNutrition?.energyPer100g as Record<string, unknown> | undefined
    
    const energyKJ = escapeHtml(enEnergy?.kj)
    const energyKCal = escapeHtml(enEnergy?.kcal)
    
    const enManufacturer = en?.manufacturer as Record<string, unknown> | undefined
    const arManufacturer = ar?.manufacturer as Record<string, unknown> | undefined
    const enWeight = en?.weightInformation as Record<string, unknown> | undefined
    const arWeight = ar?.weightInformation as Record<string, unknown> | undefined

    const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Localized Label</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif; padding: 24px; color: #111; }
    h1, h2, h3 { margin: 0 0 8px; }
    .section { margin-bottom: 14px; }
    .muted { color: #555; font-size: 12px; }
    .divider { height: 1px; background: #ddd; margin: 10px 0; }
    @media print { .no-print { display: none !important; } }
  </style>
</head>
<body>
  <div class="no-print" style="text-align:right;margin-bottom:12px;">
    <button onclick="window.print()" style="padding:6px 10px;border:1px solid #bbb;background:#fff;cursor:pointer;">Print</button>
  </div>

  <div class="section">
    <h2>${escapeHtml(en.productName || '')} / ${escapeHtml(ar.productName || '')}</h2>
  </div>

  <div class="section">
    <div>Product of ${escapeHtml(enManufacturer?.country || '')} / منتج من ${escapeHtml(arManufacturer?.country || '')}</div>
  </div>

  <div class="divider"></div>

  <div class="section">
    <div><strong>Ingredients:</strong> ${boldAllergens(en.ingredients as unknown[] || [], enAllergens)}</div>
    <div><strong>المكونات:</strong> ${boldAllergens(ar.ingredients as unknown[] || [], arAllergens)}</div>
  </div>

  <div class="section">
    <div><strong>Allergy Information:</strong> ${escapeHtml(joinList(en.allergyInformation as unknown[] || []))}</div>
    <div><strong>معلومات الحساسية:</strong> ${escapeHtml(joinList(ar.allergyInformation as unknown[] || []))}</div>
  </div>

  <div class="divider"></div>

  <div class="section">
    <h3>Nutritional Facts / حقائق غذائية</h3>
    <div class="muted">Typical values per 100g / القيم النموذجية لكل 100غ</div>
    <table style="width:100%;border-collapse:collapse;margin-top:6px;">
      <thead>
        <tr>
          <th style="padding:6px 8px;border:1px solid #ccc;text-align:left;">Nutrient / العنصر الغذائي</th>
          <th style="padding:6px 8px;border:1px solid #ccc;text-align:center;">Value / القيمة</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td style="padding:6px 8px;border:1px solid #ccc;">Energy / الطاقة</td>
          <td style="padding:6px 8px;border:1px solid #ccc;text-align:center;">${energyKJ} kJ / ${energyKCal} kcal</td>
        </tr>
        ${rowPair('Fat', 'الدهون', enNutrition?.fatPer100g, arNutrition?.fatPer100g)}
        ${rowPair('of which Saturates', 'منها مشبعة', enNutrition?.saturatesPer100g, arNutrition?.saturatesPer100g)}
        ${rowPair('Carbohydrate', 'الكربوهيدرات', enNutrition?.carbohydratePer100g, arNutrition?.carbohydratePer100g)}
        ${rowPair('of which Sugars', 'منها سكريات', enNutrition?.sugarsPer100g, arNutrition?.sugarsPer100g)}
        ${rowPair('Protein', 'البروتين', enNutrition?.proteinPer100g, arNutrition?.proteinPer100g)}
        ${rowPair('Salt', 'الملح', enNutrition?.saltPer100g, arNutrition?.saltPer100g)}
      </tbody>
    </table>
  </div>

  <div class="divider"></div>

  <div class="section">
    <div>Storage: ${escapeHtml(en.storageInformation || '')}</div>
    <div>التخزين: ${escapeHtml(ar.storageInformation || '')}</div>
  </div>

  <div class="section">
    <div>Production Date: ____/____/______</div>
    <div>تاريخ الإنتاج: ______/____/____</div>
  </div>

  <div class="section">
    <div>Best Before / Expiry Date: ____/____/______</div>
    <div>يفضل استهلاكه قبل / تاريخ الانتهاء: ______/____/____</div>
  </div>

  <div class="divider"></div>

  <div class="section">
    <div><strong>Manufacturer / الشركة المصنعة:</strong></div>
    <div>${escapeHtml(enManufacturer?.name || '')}${enManufacturer?.location ? ', ' + escapeHtml(enManufacturer?.location) : ''}${enManufacturer?.country ? ', ' + escapeHtml(enManufacturer?.country) : ''}</div>
    <div>${escapeHtml(arManufacturer?.name || '')}${arManufacturer?.location ? '، ' + escapeHtml(arManufacturer?.location) : ''}${arManufacturer?.country ? '، ' + escapeHtml(arManufacturer?.country) : ''}</div>
    <div>${escapeHtml(enManufacturer?.additionalInfo || '')}</div>
  </div>

  <div class="section">
    <div><strong>Importer / المستورد:</strong></div>
    <div>[Importer Name & Address, Saudi Arabia]</div>
    <div>[اسم المستورد وعنوانه، المملكة العربية السعودية]</div>
  </div>

  <div class="section">
    <div>Net Weight / الوزن الصافي: ${escapeHtml(enWeight?.netWeight || '')} e / ${escapeHtml(arWeight?.netWeight || '')}</div>
  </div>

  <div class="section">
    <div>Barcode / الرمز الشريطي: ${escapeHtml(en?.barcode || '')}</div>
  </div>
</body>
</html>`

    const w = window.open('', '_blank')
    if (!w) {
      alert('Popup blocked. Please allow popups to print the label.')
      return
    }
    w.document.open()
    w.document.write(html)
    w.document.close()
    w.focus()
    // Delay to ensure styles apply before print
    setTimeout(() => { try { w.print() } catch { /* ignore */ } }, 200)
  } catch (e) {
    console.error('print label error', e)
    alert('Failed to build printable label')
  }
}

