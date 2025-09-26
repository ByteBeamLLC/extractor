"use client"

import type { ExtractionJob } from "@/lib/schema/types"

export function printLocalizedLabel(job: ExtractionJob | undefined) {
  try {
    if (!job || job.status !== "completed") {
      alert("No completed job to print")
      return
    }

    const translation = job.results?.fnb_translation
    if (!translation) {
      alert("Translation data not available yet")
      return
    }

    const en = translation.english_product_info || {}
    const ar = translation.arabic_product_info || {}

    const esc = (value: unknown) => String(value ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    const joinList = (arr: unknown[]) => (Array.isArray(arr) ? arr.filter(Boolean).join(", ") : "")
    const setFrom = (arr: unknown[]) => new Set((Array.isArray(arr) ? arr : []).map((item) => String(item || "").toLowerCase()))

    const enList = joinList(en.ingredients || [])
    const arList = joinList(ar.ingredients || [])
    const compareIngredients = () => {
      const enSet = setFrom(en.ingredients || [])
      const arSet = setFrom(ar.ingredients || [])
      const missing: string[] = []
      enSet.forEach((item) => {
        if (!arSet.has(item)) missing.push(item)
      })
      return missing
    }

    const missingIngredients = compareIngredients()
    const hasMissing = missingIngredients.length > 0

    const html = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <title>Localized Label Preview</title>
    <style>
      body { font-family: 'Segoe UI', sans-serif; margin: 0; padding: 24px; background: #f5f7fb; color: #1f2937; }
      .page { background: white; padding: 24px; border-radius: 16px; box-shadow: 0 20px 45px rgba(15, 23, 42, 0.15); 
        display: grid; gap: 24px; }
      h1 { margin: 0; font-size: 20px; color: #3b82f6; text-transform: uppercase; letter-spacing: 0.2em; }
      h2 { margin: 0; font-size: 18px; color: #1f2937; text-transform: uppercase; letter-spacing: 0.15em; }
      h3 { margin: 12px 0 8px; font-size: 16px; color: #1f2937; text-transform: uppercase; letter-spacing: 0.1em; }
      .section { background: #f9fafb; padding: 20px; border-radius: 12px; border: 1px solid #e5e7eb; }
      .grid { display: grid; gap: 12px; }
      .grid-two { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      .label { font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.12em; }
      .value { font-size: 15px; color: #1f2937; font-weight: 600; margin-top: 2px; }
      .badge { display: inline-flex; align-items: center; gap: 6px; padding: 4px 10px; border-radius: 999px; font-size: 12px; font-weight: 600; }
      .badge-success { background: rgba(34, 197, 94, 0.12); color: #15803d; }
      .badge-warning { background: rgba(250, 204, 21, 0.18); color: #92400e; }
      .badge-error { background: rgba(248, 113, 113, 0.18); color: #b91c1c; }
      .stamp { display: inline-block; padding: 16px 24px; border-radius: 12px; border: 2px dashed rgba(59, 130, 246, 0.4); background: rgba(59, 130, 246, 0.08); color: #1d4ed8; text-transform: uppercase; letter-spacing: 0.18em; font-weight: 700; }
      .footer { display: flex; justify-content: space-between; align-items: center; margin-top: 16px; padding-top: 16px; border-top: 1px solid #e5e7eb; }
      .aria { font-family: 'Noto Sans Arabic', sans-serif; }
    </style>
  </head>
  <body>
    <div class="no-print" style="text-align:right;margin-bottom:12px;">
      <button onclick="window.print()" style="padding:6px 10px;border:1px solid #bbb;background:#fff;cursor:pointer;">Print</button>
    </div>
    <div class="page">
      <header style="display:flex;justify-content:space-between;align-items:flex-start;">
        <div>
          <h1>ByteBeam Localized Label</h1>
          <p style="color:#6b7280;font-size:13px;margin-top:6px;">F&B Label Compliance – Primary + Bilingual Translation</p>
        </div>
        <div class="stamp">APPROVED</div>
      </header>

      <section class="section">
        <h2>English Label</h2>
        <div class="grid grid-two">
          <div>
            <div class="label">Product Name</div>
            <div class="value">${esc(en.productName)}</div>
          </div>
          <div>
            <div class="label">Barcode</div>
            <div class="value">${esc(en.barcode || en.productCode)}</div>
          </div>
          <div>
            <div class="label">Manufacturer</div>
            <div class="value">${esc(en.manufacturer?.name)}${en.manufacturer?.country ? ` — ${esc(en.manufacturer.country)}` : ""}</div>
          </div>
          <div>
            <div class="label">Net Weight</div>
            <div class="value">${esc(en.weightInformation?.netWeight)}</div>
          </div>
        </div>
        <div class="label" style="margin-top:16px;">Ingredients</div>
        <div class="value">${esc(enList)}</div>
        <div class="label" style="margin-top:16px;">Product Description</div>
        <div class="value" style="white-space:pre-wrap;">${esc(en.productDescription)}</div>
      </section>

      <section class="section">
        <h2 class="aria">ملصق باللغة العربية</h2>
        <div class="grid grid-two aria">
          <div>
            <div class="label">اسم المنتج</div>
            <div class="value">${esc(ar.productName)}</div>
          </div>
          <div>
            <div class="label">الباركود</div>
            <div class="value">${esc(ar.barcode || ar.productCode)}</div>
          </div>
          <div>
            <div class="label">المصنّع</div>
            <div class="value">${esc(ar.manufacturer?.name)}${ar.manufacturer?.country ? ` — ${esc(ar.manufacturer.country)}` : ""}</div>
          </div>
          <div>
            <div class="label">الوزن الصافي</div>
            <div class="value">${esc(ar.weightInformation?.netWeight)}</div>
          </div>
        </div>
        <div class="label" style="margin-top:16px;">المكونات</div>
        <div class="value aria">${esc(arList)}</div>
        <div class="label" style="margin-top:16px;">الوصف</div>
        <div class="value aria" style="white-space:pre-wrap;">${esc(ar.productDescription)}</div>
      </section>

      <section class="section" style="display:flex;justify-content:space-between;align-items:center;">
        <div>
          <div class="label">Status</div>
          <div class="badge ${hasMissing ? "badge-warning" : "badge-success"}">
            ${hasMissing ? "⚠️ Translation Needs Review" : "✅ Translations Match"}
          </div>
        </div>
        ${hasMissing ? `<div class="badge badge-warning">Missing Arabic Ingredients: ${esc(missingIngredients.join(", "))}</div>` : ""}
      </section>

      <footer class="footer">
        <div>
          <div class="label">Generated</div>
          <div class="value">${new Date().toLocaleString()}</div>
        </div>
        <div class="label">ByteBeam Compliance Automation</div>
      </footer>
    </div>
  </body>
</html>`

    const w = window.open("", "_blank")
    if (!w) {
      alert("Popup blocked. Please allow popups to print the label.")
      return
    }
    w.document.open()
    w.document.write(html)
    w.document.close()
    w.focus()
    setTimeout(() => {
      try {
        w.print()
      } catch {}
    }, 200)
  } catch (error) {
    console.error("print label error", error)
    alert("Failed to build printable label")
  }
}
