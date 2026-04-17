/**
 * `calculate` tool — sandboxed math expression evaluation via mathjs.
 *
 * The model is instructed to ALWAYS route arithmetic through this tool.
 * LLMs hallucinate math, especially decimal/multi-step operations, so we
 * never trust the model's own arithmetic — even for trivial cases.
 *
 * Security: we override only the two functions that genuinely allow
 * arbitrary code execution: `import` (loads JS modules into the math
 * namespace) and `createUnit` (historically exploited for code injection).
 *
 * IMPORTANT: do NOT also override `evaluate`, `parse`, `simplify`, or
 * `derivative` here. `math.import({ evaluate: fn }, ...)` REPLACES
 * `math.evaluate` itself, which breaks the top-level entry point.
 */

import { tool } from "ai"
import { all, create } from "mathjs"
import { z } from "zod"

const math = create(all)

math.import(
  {
    import: function () {
      throw new Error("Function 'import' is disabled inside expressions")
    },
    createUnit: function () {
      throw new Error("Function 'createUnit' is disabled inside expressions")
    },
  },
  { override: true }
)

export const calculateTool = tool({
  description:
    "Evaluate a mathematical expression and return the exact result. ALWAYS use this tool for any arithmetic — never compute math yourself, even for trivial operations like 5 + 3. Supports +, -, *, /, %, parentheses, exponents (^), and common functions like sqrt, abs, round, floor, ceil, min, max.",
  inputSchema: z.object({
    expression: z
      .string()
      .describe(
        "Math expression to evaluate. Examples: '541.27 * 0.17', '(1.55 + 2.34 + 9.96) / 3', 'round(123.456, 2)'"
      ),
  }),
  execute: async ({ expression }) => {
    const trimmed = expression.trim()
    if (!trimmed) {
      throw new Error("Expression is required")
    }
    const raw = math.evaluate(trimmed)
    // mathjs can return numbers, strings, booleans, BigNumbers, units, matrices.
    // Coerce anything non-primitive to its string form so it serialises cleanly.
    if (
      typeof raw === "number" ||
      typeof raw === "string" ||
      typeof raw === "boolean"
    ) {
      return raw
    }
    if (raw && typeof (raw as { toString?: () => string }).toString === "function") {
      return (raw as { toString: () => string }).toString()
    }
    return String(raw)
  },
})
