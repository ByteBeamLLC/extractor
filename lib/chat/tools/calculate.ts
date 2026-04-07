/**
 * `calculate` tool — sandboxed math expression evaluation via mathjs.
 *
 * The model is instructed to ALWAYS route arithmetic through this tool.
 * LLMs hallucinate math, especially decimal/multi-step operations, so we
 * never trust the model's own arithmetic — even for trivial cases.
 *
 * Security: we use mathjs's recommended sandboxing pattern, disabling
 * `import`, `createUnit`, `evaluate`, `parse`, `simplify`, and `derivative`
 * inside expressions to prevent arbitrary code execution.
 */

import { all, create } from "mathjs"
import type { ChatTool } from "@/lib/chat/types"

const math = create(all)

// Lock down the math instance — disable functions that could execute
// arbitrary code or define new functions inside an expression.
math.import(
  {
    import: function () {
      throw new Error("Function 'import' is disabled inside expressions")
    },
    createUnit: function () {
      throw new Error("Function 'createUnit' is disabled inside expressions")
    },
    evaluate: function () {
      throw new Error("Function 'evaluate' is disabled inside expressions")
    },
    parse: function () {
      throw new Error("Function 'parse' is disabled inside expressions")
    },
    simplify: function () {
      throw new Error("Function 'simplify' is disabled inside expressions")
    },
    derivative: function () {
      throw new Error("Function 'derivative' is disabled inside expressions")
    },
  },
  { override: true }
)

export const calculateTool: ChatTool = {
  definition: {
    name: "calculate",
    description:
      "Evaluate a mathematical expression and return the exact result. ALWAYS use this tool for any arithmetic — never compute math yourself, even for trivial operations like 5 + 3. Supports +, -, *, /, %, parentheses, exponents (^), and common functions like sqrt, abs, round, floor, ceil, min, max.",
    parameters: {
      type: "object",
      properties: {
        expression: {
          type: "string",
          description:
            "Math expression to evaluate. Examples: '541.27 * 0.17', '(1.55 + 2.34 + 9.96) / 3', 'round(123.456, 2)'",
        },
      },
      required: ["expression"],
      additionalProperties: false,
    },
  },
  handler: async (args) => {
    const expression =
      typeof args.expression === "string" ? args.expression.trim() : ""
    if (!expression) {
      return { ok: false, error: "Expression is required" }
    }
    try {
      const raw = math.evaluate(expression)
      // mathjs can return numbers, strings, booleans, BigNumbers, units, matrices.
      // Coerce anything non-primitive to its string form so it serialises cleanly.
      const result =
        typeof raw === "number" ||
        typeof raw === "string" ||
        typeof raw === "boolean"
          ? raw
          : raw && typeof (raw as { toString?: () => string }).toString === "function"
          ? (raw as { toString: () => string }).toString()
          : String(raw)
      return { ok: true, result }
    } catch (err) {
      return {
        ok: false,
        error: `Invalid math expression: ${
          err instanceof Error ? err.message : String(err)
        }`,
      }
    }
  },
}
