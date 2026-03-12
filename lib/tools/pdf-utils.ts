/**
 * Client-side PDF utilities using pdf-lib (npm) and pdf.js (CDN).
 * All processing happens in the browser — no server uploads.
 */

import { PDFDocument, degrees } from "pdf-lib"

const PDFJS_CDN = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let pdfjsLib: any = null

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

async function getPdfjs() {
  if (!pdfjsLib) {
    pdfjsLib = await loadScript(`${PDFJS_CDN}/pdf.min.js`, "pdfjsLib")
    pdfjsLib.GlobalWorkerOptions.workerSrc = `${PDFJS_CDN}/pdf.worker.min.js`
  }
  return pdfjsLib
}

/** Merge multiple PDF files into a single PDF */
export async function mergePDFs(pdfFiles: File[]): Promise<Blob> {
  const mergedPdf = await PDFDocument.create()
  for (const file of pdfFiles) {
    const arrayBuffer = await file.arrayBuffer()
    const pdf = await PDFDocument.load(arrayBuffer)
    const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices())
    copiedPages.forEach((page) => mergedPdf.addPage(page))
  }
  const mergedPdfBytes = await mergedPdf.save()
  return new Blob([mergedPdfBytes], { type: "application/pdf" })
}

/** Split a PDF into individual pages or page ranges */
export async function splitPDF(
  pdfFile: File,
  pageRanges?: { start: number; end: number }[]
): Promise<Blob[]> {
  const arrayBuffer = await pdfFile.arrayBuffer()
  const pdf = await PDFDocument.load(arrayBuffer)
  const totalPages = pdf.getPageCount()
  const results: Blob[] = []

  if (pageRanges && pageRanges.length > 0) {
    for (const range of pageRanges) {
      const newPdf = await PDFDocument.create()
      const pageIndices: number[] = []
      for (let i = range.start - 1; i < Math.min(range.end, totalPages); i++) {
        pageIndices.push(i)
      }
      const copiedPages = await newPdf.copyPages(pdf, pageIndices)
      copiedPages.forEach((page) => newPdf.addPage(page))
      const pdfBytes = await newPdf.save()
      results.push(new Blob([pdfBytes], { type: "application/pdf" }))
    }
  } else {
    for (let i = 0; i < totalPages; i++) {
      const newPdf = await PDFDocument.create()
      const [copiedPage] = await newPdf.copyPages(pdf, [i])
      newPdf.addPage(copiedPage)
      const pdfBytes = await newPdf.save()
      results.push(new Blob([pdfBytes], { type: "application/pdf" }))
    }
  }

  return results
}

/** Compress a PDF by using object streams and removing metadata */
export async function compressPDF(pdfFile: File): Promise<Blob> {
  const arrayBuffer = await pdfFile.arrayBuffer()
  const pdf = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true })

  pdf.setTitle("")
  pdf.setAuthor("")
  pdf.setSubject("")
  pdf.setKeywords([])
  pdf.setProducer("")
  pdf.setCreator("")

  const compressedBytes = await pdf.save({
    useObjectStreams: true,
    addDefaultPage: false,
  })

  return new Blob([compressedBytes], { type: "application/pdf" })
}

/** Remove specific pages from a PDF (1-indexed) */
export async function removePages(
  pdfFile: File,
  pagesToRemove: number[]
): Promise<Blob> {
  const arrayBuffer = await pdfFile.arrayBuffer()
  const pdf = await PDFDocument.load(arrayBuffer)
  const totalPages = pdf.getPageCount()

  const indicesToRemove = pagesToRemove
    .map((p) => p - 1)
    .filter((p) => p >= 0 && p < totalPages)
    .sort((a, b) => b - a)

  for (const index of indicesToRemove) {
    pdf.removePage(index)
  }

  const pdfBytes = await pdf.save()
  return new Blob([pdfBytes], { type: "application/pdf" })
}

/** Rotate pages in a PDF */
export async function rotatePages(
  pdfFile: File,
  rotation: 90 | 180 | 270,
  pageIndices?: number[]
): Promise<Blob> {
  const arrayBuffer = await pdfFile.arrayBuffer()
  const pdf = await PDFDocument.load(arrayBuffer)
  const pages = pdf.getPages()

  const indicesToRotate = pageIndices
    ? pageIndices.map((p) => p - 1)
    : pages.map((_, i) => i)

  for (const index of indicesToRotate) {
    if (index >= 0 && index < pages.length) {
      const page = pages[index]
      const currentRotation = page.getRotation().angle
      page.setRotation(degrees(currentRotation + rotation))
    }
  }

  const pdfBytes = await pdf.save()
  return new Blob([pdfBytes], { type: "application/pdf" })
}

/** Convert images to PDF */
export async function imagesToPDF(imageFiles: File[]): Promise<Blob> {
  const pdf = await PDFDocument.create()

  for (const imageFile of imageFiles) {
    const arrayBuffer = await imageFile.arrayBuffer()
    const uint8Array = new Uint8Array(arrayBuffer)

    let image
    if (imageFile.type === "image/jpeg" || imageFile.type === "image/jpg") {
      image = await pdf.embedJpg(uint8Array)
    } else if (imageFile.type === "image/png") {
      image = await pdf.embedPng(uint8Array)
    } else {
      // Convert other formats to PNG using canvas
      const blob = new Blob([arrayBuffer], { type: imageFile.type })
      const pngBlob = await convertImageToPng(blob)
      const pngBuffer = await pngBlob.arrayBuffer()
      image = await pdf.embedPng(new Uint8Array(pngBuffer))
    }

    const page = pdf.addPage([image.width, image.height])
    page.drawImage(image, {
      x: 0,
      y: 0,
      width: image.width,
      height: image.height,
    })
  }

  const pdfBytes = await pdf.save()
  return new Blob([pdfBytes], { type: "application/pdf" })
}

async function convertImageToPng(imageBlob: Blob): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(imageBlob)

    img.onload = () => {
      const canvas = document.createElement("canvas")
      canvas.width = img.width
      canvas.height = img.height
      const ctx = canvas.getContext("2d")
      if (!ctx) {
        URL.revokeObjectURL(url)
        reject(new Error("Could not get canvas context"))
        return
      }
      ctx.drawImage(img, 0, 0)
      URL.revokeObjectURL(url)
      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob)
          else reject(new Error("Could not convert image to PNG"))
        },
        "image/png",
        1.0
      )
    }

    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error("Could not load image"))
    }

    img.src = url
  })
}

/** Get PDF page count */
export async function getPDFPageCount(pdfFile: File): Promise<number> {
  const arrayBuffer = await pdfFile.arrayBuffer()
  const pdf = await PDFDocument.load(arrayBuffer)
  return pdf.getPageCount()
}

/** Extract text content from a PDF file using pdf.js */
export async function extractTextFromPDF(pdfFile: File): Promise<string> {
  const pdfjs = await getPdfjs()
  const arrayBuffer = await pdfFile.arrayBuffer()
  const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise

  const textParts: string[] = []
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const textContent = await page.getTextContent()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pageText = textContent.items
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((item: any) => ("str" in item ? item.str : ""))
      .join(" ")
    textParts.push(pageText)
  }

  return textParts.join("\n\n")
}

/** Format file size for display */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B"
  const k = 1024
  const sizes = ["B", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}
