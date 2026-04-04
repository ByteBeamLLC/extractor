/**
 * Converts PDF pages to PNG images using pdf-to-img (pure JS, no system deps).
 *
 * This avoids sending raw PDF bytes to Gemini, which either:
 *   - Requires base64 data URI (bloats large scanned PDFs → timeouts)
 *   - Rejects PDF URLs via image_url (only PNG/JPEG/WebP/GIF accepted)
 *
 * By converting to PNG first, we can send images as URLs or compact base64.
 */

import { pdf } from "pdf-to-img"

export interface PdfPageImage {
  pageNumber: number
  /** PNG image as a Buffer */
  buffer: Buffer
  /** Base64 data URI ready for Gemini: data:image/png;base64,... */
  dataUri: string
}

/**
 * Convert all pages of a PDF to PNG images.
 *
 * @param pdfBytes  Raw PDF file bytes
 * @returns Array of page images in order
 */
export async function convertPdfToImages(pdfBytes: Uint8Array): Promise<PdfPageImage[]> {
  const pages: PdfPageImage[] = []
  let pageNumber = 0

  const result = await pdf(Buffer.from(pdfBytes), {
    scale: 2.0, // 2x scale for good OCR quality (~150 DPI equivalent)
  })

  for await (const imageBuffer of result) {
    pageNumber++
    const buffer = Buffer.from(imageBuffer)
    pages.push({
      pageNumber,
      buffer,
      dataUri: `data:image/png;base64,${buffer.toString("base64")}`,
    })
  }

  return pages
}
