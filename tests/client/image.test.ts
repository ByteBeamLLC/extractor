import { describe, expect, it } from "vitest"

import { maybeDownscaleImage } from "@/lib/client/image"

describe("maybeDownscaleImage", () => {
  it("returns original file for non-image inputs", async () => {
    const file = { name: "data.csv", size: 1200, type: "text/csv" } as unknown as File

    const result = await maybeDownscaleImage(file)

    expect(result.blob).toBe(file)
    expect(result.type).toBe("text/csv")
    expect(result.name).toBe("data.csv")
  })

  it("skips compression when image is already under the target size", async () => {
    const file = { name: "small.png", size: 200_000, type: "image/png" } as unknown as File

    const result = await maybeDownscaleImage(file, { targetBytes: 300_000 })

    expect(result.blob).toBe(file)
    expect(result.type).toBe("image/png")
  })

  it("falls back gracefully when the browser compression APIs are unavailable", async () => {
    const file = { name: "large.png", size: 5_000_000, type: "image/png" } as unknown as File

    const result = await maybeDownscaleImage(file)

    expect(result.blob).toBe(file)
    expect(result.type).toBe("application/octet-stream")
  })
})
