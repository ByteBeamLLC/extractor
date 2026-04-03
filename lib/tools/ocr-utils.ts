/**
 * Client-side OCR using Tesseract.js loaded from CDN.
 * All processing happens in the browser — no server uploads.
 */

const TESSERACT_CDN = "https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js"

export interface OCRProgress {
  status: string
  progress: number
}

export interface OCRResult {
  text: string
  confidence: number
}

export type OCRLanguage =
  | "eng"
  | "ara"
  | "fra"
  | "deu"
  | "spa"
  | "ita"
  | "por"
  | "rus"
  | "chi_sim"
  | "chi_tra"
  | "jpn"
  | "kor"

export const SUPPORTED_LANGUAGES: Record<OCRLanguage, string> = {
  eng: "English",
  ara: "Arabic",
  fra: "French",
  deu: "German",
  spa: "Spanish",
  ita: "Italian",
  por: "Portuguese",
  rus: "Russian",
  chi_sim: "Chinese (Simplified)",
  chi_tra: "Chinese (Traditional)",
  jpn: "Japanese",
  kor: "Korean",
}

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

/** Preprocess image for better OCR: grayscale, contrast boost, binarization */
function preprocessImage(imageSource: File | Blob | string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = "anonymous"
    img.onload = () => {
      const canvas = document.createElement("canvas")
      // Scale up small images for better recognition
      const scale = Math.max(1, Math.min(3, 2000 / Math.max(img.width, img.height)))
      canvas.width = img.width * scale
      canvas.height = img.height * scale
      const ctx = canvas.getContext("2d")
      if (!ctx) { resolve(img.src); return }

      // Draw scaled image
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

      // Convert to grayscale + boost contrast + binarize
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const d = imageData.data
      for (let i = 0; i < d.length; i += 4) {
        // Grayscale using luminance weights
        let gray = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]
        // Contrast stretch (1.5x from midpoint)
        gray = Math.min(255, Math.max(0, (gray - 128) * 1.5 + 128))
        // Adaptive threshold: binarize to pure black/white
        const bw = gray > 140 ? 255 : 0
        d[i] = bw
        d[i + 1] = bw
        d[i + 2] = bw
      }
      ctx.putImageData(imageData, 0, 0)
      resolve(canvas.toDataURL("image/png"))
    }
    img.onerror = () => reject(new Error("Failed to load image for preprocessing"))

    if (typeof imageSource === "string") {
      img.src = imageSource
    } else {
      img.src = URL.createObjectURL(imageSource)
    }
  })
}

/** Clean up OCR output: remove junk lines, normalize whitespace */
function postprocessText(text: string): string {
  return text
    .split("\n")
    // Remove lines that are only symbols/single chars (OCR noise)
    .filter((line) => {
      const trimmed = line.trim()
      if (!trimmed) return false
      // Remove lines that are just punctuation/symbols with no real words
      const alphanumeric = trimmed.replace(/[^a-zA-Z0-9\u00C0-\u024F\u0400-\u04FF\u0600-\u06FF\u4E00-\u9FFF\u3040-\u309F\u30A0-\u30FF\uAC00-\uD7AF]/g, "")
      if (alphanumeric.length === 0 && trimmed.length < 4) return false
      return true
    })
    // Normalize multiple blank lines
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
}

/** Perform OCR on an image file */
export async function performOCR(
  imageFile: File | Blob | string,
  language: OCRLanguage = "eng",
  onProgress?: (progress: OCRProgress) => void
): Promise<OCRResult> {
  const Tesseract = await loadScript(TESSERACT_CDN, "Tesseract")

  // Preprocess image for better recognition
  onProgress?.({ status: "preprocessing", progress: 0 })
  const processedImage = await preprocessImage(imageFile)

  const worker = await Tesseract.createWorker(language, 1, {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    logger: (m: any) => {
      if (onProgress) {
        onProgress({
          status: m.status,
          progress: m.progress * 100,
        })
      }
    },
  })

  try {
    // Set Tesseract parameters for better quality
    await worker.setParameters({
      preserve_interword_spaces: "1",
      tessedit_pageseg_mode: "6", // Assume uniform block of text
    })

    const result = await worker.recognize(processedImage)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data = result.data as any

    return {
      text: postprocessText(data.text),
      confidence: data.confidence,
    }
  } finally {
    await worker.terminate()
  }
}
