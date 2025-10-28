/**
 * Format numeric values for display in grid cells
 */
export function formatNumericValue(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  
  const num = Number(value);
  if (isNaN(num)) return null;
  
  // Format large numbers with commas
  if (Math.abs(num) >= 1000) {
    return num.toLocaleString('en-US', { 
      minimumFractionDigits: 0, 
      maximumFractionDigits: 2 
    });
  }
  
  // Format decimals to reasonable precision
  if (num % 1 !== 0) {
    return num.toFixed(2);
  }
  
  return num.toString();
}

/**
 * Format date values for display
 */
export function formatDateValue(value: unknown): string | null {
  if (!value) return null;
  
  try {
    const date = new Date(value as string);
    if (isNaN(date.getTime())) return null;
    
    return date.toISOString().split('T')[0]; // YYYY-MM-DD
  } catch {
    return null;
  }
}

/**
 * Prettify object keys for display
 */
export function prettifyKey(key: string): string {
  return key
    .replace(/[_-]/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

