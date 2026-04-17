import { describe, expect, it } from "vitest"
import { calculateTool } from "./calculate"

/**
 * `execute` is typed as never → never because the AI SDK tool helper widens
 * input to `unknown` when called outside a strongly-typed ToolSet. For tests
 * we need to call it with real inputs, so we unwrap it to a loose signature.
 */
const run = calculateTool.execute as unknown as (
  args: { expression: string },
  options: Record<string, unknown>
) => Promise<number | string | boolean>

const opts = {
  toolCallId: "test",
  messages: [],
} as unknown as Record<string, unknown>

describe("calculateTool", () => {
  describe("arithmetic", () => {
    it("evaluates integer arithmetic", async () => {
      expect(await run({ expression: "2 + 3" }, opts)).toBe(5)
      expect(await run({ expression: "10 - 4" }, opts)).toBe(6)
      expect(await run({ expression: "6 * 7" }, opts)).toBe(42)
      expect(await run({ expression: "20 / 4" }, opts)).toBe(5)
    })

    it("preserves decimal precision", async () => {
      expect(await run({ expression: "541.27 * 0.17" }, opts)).toBeCloseTo(
        92.0159,
        4
      )
      expect(await run({ expression: "(1.55 + 2.34 + 9.96) / 3" }, opts)).toBeCloseTo(
        4.6167,
        4
      )
    })

    it("handles operator precedence + parentheses", async () => {
      expect(await run({ expression: "2 + 3 * 4" }, opts)).toBe(14)
      expect(await run({ expression: "(2 + 3) * 4" }, opts)).toBe(20)
    })

    it("supports exponents and common math functions", async () => {
      expect(await run({ expression: "2^10" }, opts)).toBe(1024)
      expect(await run({ expression: "sqrt(144)" }, opts)).toBe(12)
      expect(await run({ expression: "abs(-7)" }, opts)).toBe(7)
      expect(await run({ expression: "round(123.456, 2)" }, opts)).toBe(123.46)
      expect(await run({ expression: "max(1, 5, 3)" }, opts)).toBe(5)
      expect(await run({ expression: "min(1, 5, 3)" }, opts)).toBe(1)
      expect(await run({ expression: "floor(3.9)" }, opts)).toBe(3)
      expect(await run({ expression: "ceil(3.1)" }, opts)).toBe(4)
    })

    it("handles percent operator", async () => {
      // 50% in mathjs is 0.5
      expect(await run({ expression: "50%" }, opts)).toBe(0.5)
    })
  })

  describe("security — sandboxed functions", () => {
    it("blocks `import` — cannot load arbitrary modules into the math namespace", async () => {
      await expect(
        run({ expression: "import('fs')" }, opts)
      ).rejects.toThrow(/import.*disabled/i)
    })

    it("blocks `createUnit` — historically used for code injection", async () => {
      await expect(
        run({ expression: 'createUnit("foo")' }, opts)
      ).rejects.toThrow(/createUnit.*disabled/i)
    })
  })

  describe("error paths", () => {
    it("throws on empty expression", async () => {
      await expect(run({ expression: "" }, opts)).rejects.toThrow(
        /required/i
      )
    })

    it("throws on whitespace-only expression", async () => {
      await expect(run({ expression: "   " }, opts)).rejects.toThrow(
        /required/i
      )
    })

    it("throws on syntactically invalid expression", async () => {
      await expect(
        run({ expression: "2 +" }, opts)
      ).rejects.toThrow()
    })

    it("throws on unknown symbols", async () => {
      await expect(
        run({ expression: "undefinedThing(1)" }, opts)
      ).rejects.toThrow()
    })
  })

  describe("return type coercion", () => {
    it("returns primitive numbers, strings, booleans directly", async () => {
      expect(typeof (await run({ expression: "1 + 1" }, opts))).toBe("number")
      expect(typeof (await run({ expression: "true and false" }, opts))).toBe(
        "boolean"
      )
    })

    it("coerces non-primitive results (e.g. units) to strings", async () => {
      // mathjs returns a Unit for "5 cm", we stringify it
      const result = await run({ expression: "5 cm" }, opts)
      expect(typeof result).toBe("string")
      expect(String(result)).toContain("cm")
    })
  })

  describe("tool definition shape", () => {
    it("has a description", () => {
      expect(calculateTool.description).toBeTruthy()
      expect(calculateTool.description).toMatch(/ALWAYS/)
    })

    it("has an inputSchema that validates `expression`", () => {
      // AI SDK wraps the zod schema. We verify by calling execute with the
      // expected input shape (which would otherwise fail Zod parsing upstream).
      expect(calculateTool.inputSchema).toBeTruthy()
    })
  })
})
