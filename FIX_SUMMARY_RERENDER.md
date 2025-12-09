# Fix for Infinite Re-renders (React Error #301)

## Issue Description
The application was crashing with "Minified React error #301" (Too many re-renders) when creating a new schema/job from a template in production. This was caused by an infinite update loop in the `TanStackGridSheet` component.

## Root Cause Analysis
1.  **Unstable Props**: The `DataExtractionPlatform` component was passing non-memoized callback functions (`renderCellValue`, `getStatusIcon`, `renderStatusPill`, etc.) to `StandardResultsView`, which passed them to `TanStackGridSheet`.
2.  **Dependency Chain**: `TanStackGridSheet` used these props in the dependency array for `columnDefs`. Since the props changed on every render, `columnDefs` was recalculated on every render.
3.  **Effect Loop**: `TanStackGridSheet` has a `useEffect` hook that calculates optimal column widths based on `columns` (which are derived from `columnDefs`). This effect called `setColumnSizes` on every render.
4.  **State Update**: The `setColumnSizes` call triggered a re-render of `TanStackGridSheet`, which triggered the parent `DataExtractionPlatform` to re-render (via callbacks or context), creating a closed loop of updates.

## Fix Implementation
1.  **Conditional State Update**: Modified the `useEffect` in `components/tanstack-grid/TanStackGridSheet.tsx` to checks if the calculated column sizes are actually different from the current state before calling `setColumnSizes`.
    ```typescript
    setColumnSizes((prevSizes) => {
      // ... comparison logic ...
      if (sameValues) return prevSizes;
      return newSizes;
    });
    ```

2.  **Memoization**: Wrapped all callback functions passed to `StandardResultsView` in `useCallback` hook within `components/data-extraction-platform.tsx`. This includes:
    - `getStatusIcon`
    - `renderStatusPill`
    - `renderCellValue`
    - `toggleRowExpansion`
    - `openTableModal`
    - `addColumn`
    - `handleColumnRightClick`
    - `handleRowDoubleClick` (refactored from inline)
    - `handleEditColumn` (refactored from inline)
    - `handleDeleteColumn` (refactored from inline)

## Verification
-   Verified that the infinite loop logic is broken by the conditional state update.
-   Verified that props passed to grid components are stable.
-   Build verified successfully.
