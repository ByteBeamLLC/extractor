/**
 * Barcode Utility Functions
 *
 * Generate and validate EAN-13 barcodes for recipes.
 */

/**
 * Generate a valid EAN-13 barcode with check digit
 *
 * EAN-13 structure:
 * - 12 digits + 1 check digit = 13 digits total
 * - Check digit calculation uses weighted sum (1, 3, 1, 3, ...)
 */
export function generateEAN13(): string {
  // Generate 12 random digits
  const digits: number[] = []
  for (let i = 0; i < 12; i++) {
    digits.push(Math.floor(Math.random() * 10))
  }

  // Calculate check digit using EAN-13 algorithm
  let sum = 0
  for (let i = 0; i < 12; i++) {
    sum += digits[i] * (i % 2 === 0 ? 1 : 3)
  }
  const checkDigit = (10 - (sum % 10)) % 10
  digits.push(checkDigit)

  return digits.join('')
}

/**
 * Validate an EAN-13 barcode
 *
 * @param barcode - The barcode string to validate
 * @returns true if valid EAN-13, false otherwise
 */
export function validateEAN13(barcode: string): boolean {
  // Must be exactly 13 digits
  if (!/^\d{13}$/.test(barcode)) {
    return false
  }

  // Calculate check digit
  const digits = barcode.split('').map(Number)
  let sum = 0
  for (let i = 0; i < 12; i++) {
    sum += digits[i] * (i % 2 === 0 ? 1 : 3)
  }
  const expectedCheckDigit = (10 - (sum % 10)) % 10

  return digits[12] === expectedCheckDigit
}

/**
 * Format barcode for display (with spaces)
 *
 * @param barcode - The barcode string
 * @returns Formatted barcode like "5 901234 123457"
 */
export function formatBarcode(barcode: string): string {
  if (!barcode || barcode.length !== 13) {
    return barcode || ''
  }
  return `${barcode[0]} ${barcode.slice(1, 7)} ${barcode.slice(7)}`
}

/**
 * Generate a unique EAN-13 barcode that doesn't exist in the provided list
 *
 * @param existingBarcodes - Array of existing barcodes to check against
 * @param maxAttempts - Maximum attempts to generate unique barcode (default: 100)
 * @returns A unique barcode string
 * @throws Error if unable to generate unique barcode after maxAttempts
 */
export function generateUniqueEAN13(existingBarcodes: string[], maxAttempts: number = 100): string {
  const existingSet = new Set(existingBarcodes.filter(Boolean))

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const barcode = generateEAN13()
    if (!existingSet.has(barcode)) {
      return barcode
    }
  }

  throw new Error('Unable to generate unique barcode after maximum attempts')
}
