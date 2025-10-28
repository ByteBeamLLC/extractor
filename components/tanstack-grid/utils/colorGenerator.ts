// Color generator utility for consistent option badge colors

/**
 * Predefined color palette for option badges
 * Colors are designed to be vibrant, accessible, and visually distinct
 */
const predefinedPalette = [
  { bg: "#e3f2fd", text: "#1565c0", border: "#90caf9" }, // Blue
  { bg: "#f3e5f5", text: "#7b1fa2", border: "#ba68c8" }, // Purple
  { bg: "#e8f5e9", text: "#2e7d32", border: "#81c784" }, // Green
  { bg: "#fff3e0", text: "#ef6c00", border: "#ffb74d" }, // Orange
  { bg: "#fce4ec", text: "#c2185b", border: "#f06292" }, // Pink
  { bg: "#e0f2f1", text: "#00695c", border: "#4db6ac" }, // Teal
  { bg: "#fff8e1", text: "#f9a825", border: "#ffd54f" }, // Amber
  { bg: "#ede7f6", text: "#4527a0", border: "#9575cd" }, // Deep Purple
  { bg: "#e1f5fe", text: "#0277bd", border: "#4fc3f7" }, // Light Blue
  { bg: "#e8f8f5", text: "#00695c", border: "#80cbc4" }, // Light Teal
  { bg: "#fff3e0", text: "#bf360c", border: "#ffab40" }, // Deep Orange
  { bg: "#fde7e7", text: "#c62828", border: "#ef5350" }, // Red
  { bg: "#f3e8ff", text: "#6a1b9a", border: "#ab47bc" }, // Purple
  { bg: "#e0f7fa", text: "#00838f", border: "#26c6da" }, // Cyan
  { bg: "#f9fbe7", text: "#827717", border: "#d4e157" }, // Lime
];

/**
 * Hash a string to a consistent color index
 */
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

/**
 * Generate HSL color from string hash
 */
function generateHSLColor(str: string): { bg: string; text: string; border: string } {
  const hash = hashString(str);
  const hue = hash % 360;
  // Use pastel colors: Saturation 40-60%, Lightness 85-95%
  const saturation = 40 + (hash % 20);
  const lightBg = 90 + (hash % 5);
  const lightBorder = 75 + (hash % 10);
  
  return {
    bg: `hsl(${hue}, ${saturation}%, ${lightBg}%)`,
    text: `hsl(${hue}, 60%, 25%)`, // Dark text for readability
    border: `hsl(${hue}, 50%, ${lightBorder}%)`
  };
}

/**
 * Get color scheme for an option value
 * Uses predefined palette for first N options, then generates colors
 */
export function getOptionColor(index: number, value: string): { bg: string; text: string; border: string } {
  // Use predefined palette for first few options
  if (index < predefinedPalette.length) {
    return predefinedPalette[index];
  }
  
  // Generate color from value for options beyond palette
  return generateHSLColor(value);
}

/**
 * Get badge style classes for an option
 */
export function getBadgeClasses(colorScheme: { bg: string; text: string; border: string }): string {
  return "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide transition-colors";
}

