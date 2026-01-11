/**
 * Value sanitization utilities for grid cells
 * Prevents React error 301 by replacing non-serializable values
 */

export interface SanitizeContext {
  jobId?: string;
  columnId?: string;
  schemaId?: string;
}

/**
 * Replaces Promises, functions, and other non-serializable values with safe placeholders
 * to avoid React error 301 in production builds.
 */
export function sanitizeValue(
  value: unknown,
  ctx?: SanitizeContext
): unknown {
  if (value instanceof Promise) {
    console.error("[TanStackGridSheet] Promise value detected", {
      ...ctx,
      value,
    });
    return "[promise]";
  }

  if (typeof value === "function") {
    console.error("[TanStackGridSheet] Function value detected", { ...ctx });
    return "[function]";
  }

  if (typeof value === "symbol") {
    console.error("[TanStackGridSheet] Symbol value detected", { ...ctx });
    return value.toString();
  }

  if (typeof value === "bigint") {
    return value.toString();
  }

  // Preserve primitives and Dates as-is
  if (value === null || typeof value !== "object" || value instanceof Date) {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((item) => sanitizeValue(item, ctx));
  }

  // Plain object case
  const result: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(value)) {
    result[k] = sanitizeValue(v, ctx);
  }
  return result;
}

/**
 * Checks if a value is a non-serializable type that needs sanitization
 */
export function needsSanitization(value: unknown): boolean {
  if (value instanceof Promise) return true;
  if (typeof value === "function") return true;
  if (typeof value === "symbol") return true;
  if (typeof value === "bigint") return true;

  if (value !== null && typeof value === "object" && !(value instanceof Date)) {
    if (Array.isArray(value)) {
      return value.some(needsSanitization);
    }
    return Object.values(value).some(needsSanitization);
  }

  return false;
}
