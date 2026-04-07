/**
 * `query_extracted_data` tool — structured queries against the document's
 * extracted JSON.
 *
 * The model is instructed to use this tool whenever a question involves
 * arrays — sums, counts, "how many", "which is the largest", filtering.
 * Without it, the model walks arrays manually and miscounts on anything
 * with more than ~5–10 items.
 *
 * The handler is a closure over the specific document's `results` so the
 * model never has to pass document data through the tool call boundary.
 */

import { JSONPath } from "jsonpath-plus"
import type { ChatTool, ToolHandlerResult } from "@/lib/chat/types"

const SUPPORTED_OPERATIONS = [
  "get",
  "count",
  "list",
  "unique",
  "sum",
  "avg",
  "min",
  "max",
] as const

type Operation = (typeof SUPPORTED_OPERATIONS)[number]

const NUMERIC_OPERATIONS: ReadonlySet<Operation> = new Set([
  "sum",
  "avg",
  "min",
  "max",
])

/**
 * Coerce a value to a finite number, accepting strings like "$1,234.56".
 * Returns null if it can't be coerced.
 */
function toNumber(value: unknown): number | null {
  if (typeof value === "number") return Number.isFinite(value) ? value : null
  if (typeof value === "string") {
    const cleaned = value.replace(/[^0-9.\-eE]/g, "")
    if (!cleaned) return null
    const n = Number(cleaned)
    return Number.isFinite(n) ? n : null
  }
  return null
}

function reduceNumeric(values: unknown[], op: Operation): ToolHandlerResult {
  const nums = values.map(toNumber).filter((n): n is number => n !== null)
  if (nums.length === 0) {
    return {
      ok: false,
      error:
        "No numeric values found at this path. Use 'list' to inspect the raw values first.",
    }
  }
  let result: number
  switch (op) {
    case "sum":
      result = nums.reduce((a, b) => a + b, 0)
      break
    case "avg":
      result = nums.reduce((a, b) => a + b, 0) / nums.length
      break
    case "min":
      result = Math.min(...nums)
      break
    case "max":
      result = Math.max(...nums)
      break
    default:
      return { ok: false, error: `Unsupported numeric op: ${op}` }
  }
  // Round float artifacts (1.1 + 2.2 → 3.3000000000000003 → 3.3)
  // to a sensible 10-decimal precision for JSON output.
  return { ok: true, result: Math.round(result * 1e10) / 1e10 }
}

export function createQueryExtractedDataTool(
  results: Record<string, unknown>
): ChatTool {
  return {
    definition: {
      name: "query_extracted_data",
      description:
        "Query the document's extracted data structurally. ALWAYS use this for sums, counts, averages, min/max, or any operation over an array — do NOT enumerate arrays yourself. The data uses field IDs as JSON keys (the parser schema in your context tells you what each ID means).",
      parameters: {
        type: "object",
        properties: {
          path: {
            type: "string",
            description:
              "JSONPath expression. Examples: '$.subtotal' (single value), '$.line_items' (whole array), '$.line_items[*].line_total' (all line totals), '$.line_items[?(@.line_total > 10)]' (filter). Always start with '$.'.",
          },
          operation: {
            type: "string",
            enum: [...SUPPORTED_OPERATIONS],
            description:
              "What to compute on the matched values. 'get' returns the raw value(s). 'count' returns the number of matches. 'list' returns all matched values as an array. 'unique' returns deduplicated values. 'sum'/'avg'/'min'/'max' coerce to numbers and reduce.",
          },
        },
        required: ["path", "operation"],
        additionalProperties: false,
      },
    },
    handler: async (args) => {
      const path = typeof args.path === "string" ? args.path.trim() : ""
      const operation = args.operation as Operation
      if (!path) {
        return { ok: false, error: "path is required" }
      }
      if (!SUPPORTED_OPERATIONS.includes(operation)) {
        return {
          ok: false,
          error: `Unsupported operation '${operation}'. Use one of: ${SUPPORTED_OPERATIONS.join(", ")}`,
        }
      }

      let matched: unknown[]
      try {
        matched = JSONPath({ path, json: results }) as unknown[]
      } catch (err) {
        return {
          ok: false,
          error: `Invalid JSONPath: ${
            err instanceof Error ? err.message : String(err)
          }`,
        }
      }

      if (!matched || matched.length === 0) {
        return {
          ok: false,
          error: `No values found at path '${path}'. The field may not exist on this document.`,
        }
      }

      switch (operation) {
        case "get":
          return {
            ok: true,
            result: matched.length === 1 ? matched[0] : matched,
          }
        case "count":
          return { ok: true, result: matched.length }
        case "list":
          return { ok: true, result: matched }
        case "unique": {
          // JSON.stringify dedup handles primitives + structurally-equal objects
          const seen = new Set<string>()
          const unique: unknown[] = []
          for (const v of matched) {
            const key = JSON.stringify(v)
            if (!seen.has(key)) {
              seen.add(key)
              unique.push(v)
            }
          }
          return { ok: true, result: unique }
        }
        default:
          return reduceNumeric(matched, operation)
      }
    },
  }
}
