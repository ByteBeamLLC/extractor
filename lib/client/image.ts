"use client"

export type ImageCompressionOptions = {
  maxDim?: number
  quality?: number
  targetBytes?: number
}

// Downscale large images client-side to avoid Vercel 413 limits
export async function maybeDownscaleImage(
  file: File,
  opts?: ImageCompressionOptions,
): Promise<{ blob: Blob; type: string; name: string }> {
  try {
    const targetBytes = opts?.targetBytes ?? 3_000_000 // ~3 MB for extra headroom
    const fileType = file.type || "application/octet-stream"

    if (!file.type?.startsWith("image/")) {
      return { blob: file, type: fileType, name: file.name }
    }
    if (file.size <= targetBytes) {
      return { blob: file, type: fileType, name: file.name }
    }

    const maxDim = opts?.maxDim ?? 2000
    const initialQuality = opts?.quality ?? 0.8

    const bitmap = await createImageBitmap(file)
    const canvas = document.createElement("canvas")
    const ctx = canvas.getContext("2d")
    if (!ctx) {
      bitmap.close?.()
      return { blob: file, type: fileType, name: file.name }
    }

    const type = "image/jpeg"
    let attempt = 0
    let currentQuality = initialQuality
    let dimensionScale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height))
    let blob: Blob | null = null

    while (attempt < 6) {
      const width = Math.max(1, Math.round(bitmap.width * dimensionScale))
      const height = Math.max(1, Math.round(bitmap.height * dimensionScale))
      canvas.width = width
      canvas.height = height
      ctx.clearRect(0, 0, width, height)
      ctx.drawImage(bitmap, 0, 0, width, height)

      blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob((b) => resolve(b), type, currentQuality)
      })
      if (!blob) {
        break
      }
      if (blob.size <= targetBytes) {
        break
      }

      // Reduce both quality and dimensions for the next iteration
      currentQuality = Math.max(0.4, currentQuality * 0.82)
      dimensionScale = Math.max(0.4, dimensionScale * 0.85)
      attempt += 1
    }

    bitmap.close?.()

    if (!blob) {
      return { blob: file, type: fileType, name: file.name }
    }

    return {
      blob,
      type,
      name: file.name.replace(/\.(png|jpe?g|webp|bmp|gif|heic)$/i, ".jpg"),
    }
  } catch {
    return { blob: file, type: file.type || "application/octet-stream", name: file.name }
  }
}
