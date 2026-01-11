/**
 * Grid constants for TanStack Grid Sheet
 */

// Industry standard column widths - user resizable with auto-expand
export const DEFAULT_DATA_COL_WIDTH = 180; // Starting width for data columns
export const MIN_COL_WIDTH = 120; // Minimum width for readability
export const MAX_COL_WIDTH = 500; // Maximum width - prevent excessive expansion
export const ROW_INDEX_COL_WIDTH = 60;
export const FILE_COL_WIDTH = 200;
export const ADD_COLUMN_WIDTH = 56;

// Empty array constant to avoid creating new references
export const EMPTY_SEARCH_RESULTS: string[] = [];

// Row heights for virtualization
export const DEFAULT_ROW_HEIGHT = 64;
export const DETAIL_ROW_HEIGHT = 320;
export const VIRTUALIZER_OVERSCAN = 8;

// Resize observer throttle delay
export const RESIZE_THROTTLE_MS = 250;
export const RESIZE_MIN_DIFF_PX = 20;
