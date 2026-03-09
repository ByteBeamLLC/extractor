/**
 * Generate an inbound email address for a parser.
 *
 * Format: parsername.xxxx.xxxx@in.parsli.co
 *   - term1: slugified parser name (lowercase, alphanumeric + hyphens)
 *   - term2 & term3: random 4-char hex segments
 *
 * The `inbound_email` column has a UNIQUE constraint in the DB,
 * so duplicates are rejected at the database level.
 */
export function generateInboundEmail(parserName: string): string {
  const slug = parserName
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-") // non-alphanumeric → hyphen
    .replace(/^-+|-+$/g, "")     // trim leading/trailing hyphens
    .slice(0, 30)                 // cap length
    || "parser"                   // fallback if name is all special chars

  const rand1 = crypto.randomUUID().replace(/-/g, "").slice(0, 4)
  const rand2 = crypto.randomUUID().replace(/-/g, "").slice(0, 4)

  return `${slug}.${rand1}.${rand2}@in.parsli.co`
}
