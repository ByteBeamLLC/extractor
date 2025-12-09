# Fix for Infinite Re-renders (React Error #301)

## Issue Description
The application was crashing with "Minified React error #301" (Too many re-renders) when creating a new schema/job from a template in production. This was caused by an infinite update loop involving the `TanStackGridSheet` component and its parent `StandardResultsView`.

## Root Cause Analysis
1.  **Infinite Loop in Grid Layout**: `TanStackGridSheet` has a `useEffect` that calculates column widths. It runs whenever `columns` or `jobs` change.
2.  **Unstable Props**: `StandardResultsView` was creating a new `sortedJobs` array and new `onSelectRow` callback on every render.
3.  **State Logic**: The column width calculation effect in `TanStackGridSheet` was calling `setColumnSizes` on every run. Even though values might be similar, the state update could trigger a re-render.
4.  **Component Reuse**: When switching schemas (e.g. creating a new one), `TanStackGridSheet` was reused (no unique key). Stale state or effect timing (like `isInitialLoadRef`) combined with prop updates pushed it into an unstable state.

## Fix Implementation
1.  **Conditional State Update**: Modified `TanStackGridSheet.tsx` to only update `columnSizes` state if the calculated values are actually different.
2.  **Props Stabilization**:
    -   Memoized `sortedJobs` and `handleSelectRow` in `StandardResultsView.tsx`.
    -   Memoized all callbacks passed from `DataExtractionPlatform.tsx`.
3.  **Force Remount**: Added `key={activeSchemaId}` to `TanStackGridSheet` introduction in `StandardResultsView.tsx`. This forces the grid to unmount and remount when the schema changes, ensuring a clean slate and preventing state pollution between schemas.

## Verification
-   Build passes.
-   Logic ensures that data flow is stable and state updates break the loop.
