import { describe, expect, it } from "vitest"
import { createQueryExtractedDataTool } from "./queryExtractedData"

type Args = {
  path: string
  operation:
    | "get"
    | "count"
    | "list"
    | "unique"
    | "sum"
    | "avg"
    | "min"
    | "max"
}

function tool(results: Record<string, unknown>) {
  const t = createQueryExtractedDataTool(results)
  const execute = t.execute as unknown as (
    args: Args,
    options: Record<string, unknown>
  ) => Promise<unknown>
  const opts = { toolCallId: "test", messages: [] } as unknown as Record<
    string,
    unknown
  >
  return (args: Args) => execute(args, opts)
}

describe("createQueryExtractedDataTool", () => {
  const invoice = {
    invoice_number: "INV-001",
    total: 541.27,
    currency: "USD",
    line_items: [
      { description: "Widget A", qty: 2, line_total: 10.5 },
      { description: "Widget B", qty: 1, line_total: 25.0 },
      { description: "Service", qty: 3, line_total: 75.75 },
    ],
    tags: ["paid", "priority", "paid"],
  }

  describe("operation: get", () => {
    it("returns a single scalar for a singleton match", async () => {
      const run = tool(invoice)
      expect(await run({ path: "$.invoice_number", operation: "get" })).toBe(
        "INV-001"
      )
      expect(await run({ path: "$.total", operation: "get" })).toBe(541.27)
    })

    it("returns the whole array for array match", async () => {
      const run = tool(invoice)
      const result = (await run({
        path: "$.line_items",
        operation: "get",
      })) as unknown[]
      expect(Array.isArray(result)).toBe(true)
      // JSONPath returns the array wrapped in a 1-element match (the array itself)
      // `get` unwraps singletons so we get the array directly
      expect(result).toHaveLength(3)
    })
  })

  describe("operation: count", () => {
    it("counts array items", async () => {
      const run = tool(invoice)
      expect(
        await run({ path: "$.line_items[*]", operation: "count" })
      ).toBe(3)
    })

    it("counts scalar matches as 1", async () => {
      const run = tool(invoice)
      expect(await run({ path: "$.total", operation: "count" })).toBe(1)
    })
  })

  describe("operation: list", () => {
    it("returns all matched values", async () => {
      const run = tool(invoice)
      expect(
        await run({
          path: "$.line_items[*].line_total",
          operation: "list",
        })
      ).toEqual([10.5, 25.0, 75.75])
    })
  })

  describe("operation: unique", () => {
    it("deduplicates primitives", async () => {
      const run = tool(invoice)
      const result = (await run({
        path: "$.tags[*]",
        operation: "unique",
      })) as string[]
      expect(result.sort()).toEqual(["paid", "priority"])
    })

    it("deduplicates structurally-equal objects", async () => {
      const run = tool({ items: [{ a: 1 }, { a: 1 }, { a: 2 }] })
      const result = (await run({
        path: "$.items[*]",
        operation: "unique",
      })) as unknown[]
      expect(result).toHaveLength(2)
    })
  })

  describe("operation: sum", () => {
    it("sums numeric values", async () => {
      const run = tool(invoice)
      const result = (await run({
        path: "$.line_items[*].line_total",
        operation: "sum",
      })) as number
      // 10.5 + 25 + 75.75 = 111.25
      expect(result).toBe(111.25)
    })

    it("parses string numbers like currency", async () => {
      const run = tool({ amounts: ["$1,234.56", "€500.00", "100"] })
      const result = (await run({
        path: "$.amounts[*]",
        operation: "sum",
      })) as number
      expect(result).toBe(1834.56)
    })

    it("ignores non-numeric values in mixed arrays", async () => {
      const run = tool({ mixed: [1, "not a number", 2, null, 3] })
      const result = (await run({
        path: "$.mixed[*]",
        operation: "sum",
      })) as number
      expect(result).toBe(6)
    })

    it("rounds float artifacts to 10 decimals", async () => {
      // 0.1 + 0.2 = 0.30000000000000004 in JS; we round to 10dp
      const run = tool({ xs: [0.1, 0.2] })
      const result = (await run({
        path: "$.xs[*]",
        operation: "sum",
      })) as number
      expect(result).toBe(0.3)
    })
  })

  describe("operation: avg", () => {
    it("computes average", async () => {
      const run = tool({ xs: [1, 2, 3, 4, 5] })
      expect(
        await run({ path: "$.xs[*]", operation: "avg" })
      ).toBe(3)
    })
  })

  describe("operation: min / max", () => {
    it("finds min", async () => {
      const run = tool(invoice)
      expect(
        await run({
          path: "$.line_items[*].line_total",
          operation: "min",
        })
      ).toBe(10.5)
    })

    it("finds max", async () => {
      const run = tool(invoice)
      expect(
        await run({
          path: "$.line_items[*].line_total",
          operation: "max",
        })
      ).toBe(75.75)
    })
  })

  describe("filter expressions", () => {
    it("supports JSONPath filter syntax", async () => {
      const run = tool(invoice)
      const result = (await run({
        path: "$.line_items[?(@.line_total > 20)]",
        operation: "count",
      })) as number
      expect(result).toBe(2)
    })
  })

  describe("error paths", () => {
    it("throws on empty path", async () => {
      const run = tool(invoice)
      await expect(
        run({ path: "", operation: "get" })
      ).rejects.toThrow(/required/i)
    })

    it("throws on path with no matches", async () => {
      const run = tool(invoice)
      await expect(
        run({ path: "$.nonexistent", operation: "get" })
      ).rejects.toThrow(/not exist|No values found/i)
    })

    it("throws on numeric operation against non-numeric path", async () => {
      const run = tool({ tags: ["paid", "priority"] })
      await expect(
        run({ path: "$.tags[*]", operation: "sum" })
      ).rejects.toThrow(/No numeric values/)
    })
  })

  describe("tool definition shape", () => {
    it("has a description mentioning JSONPath/arrays", () => {
      const t = createQueryExtractedDataTool({})
      expect(t.description).toMatch(/JSONPath|array|path/i)
    })

    it("has an inputSchema", () => {
      const t = createQueryExtractedDataTool({})
      expect(t.inputSchema).toBeTruthy()
    })

    it("closes over the document's results (separate instances don't bleed)", async () => {
      const runA = tool({ value: 10 })
      const runB = tool({ value: 20 })
      expect(await runA({ path: "$.value", operation: "get" })).toBe(10)
      expect(await runB({ path: "$.value", operation: "get" })).toBe(20)
    })
  })
})
