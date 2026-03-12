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

/** Perform OCR on an image file */
export async function performOCR(
  imageFile: File | Blob | string,
  language: OCRLanguage = "eng",
  onProgress?: (progress: OCRProgress) => void
): Promise<OCRResult> {
  const Tesseract = await loadScript(TESSERACT_CDN, "Tesseract")

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
    const result = await worker.recognize(imageFile)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data = result.data as any

    return {
      text: data.text,
      confidence: data.confidence,
    }
  } finally {
    await worker.terminate()
  }
}
