<!-- 9e77204d-02c1-431e-9170-37c5dd84a9ab 37d22281-74f4-4d10-b2c5-df30de9eae83 -->
# Phase 3: Integrate Extracted Components into DataExtractionPlatform

## Current State Analysis

**data-extraction-platform.tsx:** 4,620 lines, 38 useState, 20 useCallback

**Phase 2 created (but not yet integrated):**

- ✅ PharmaResultsView.tsx (340 lines)
- ✅ FnBResultsView.tsx (370 lines)
- ✅ StandardResultsView.tsx (130 lines)
- ✅ lib/extraction/processExtraction.ts (400 lines)
- ✅ hooks/extraction/useExtractionUI.ts (230 lines)
- ✅ All Phase 1 hooks (useSchemaState, useSchemaSync, etc.)

## Phase 3 Goal

**Integrate these modules to reduce main component to ~1,000-1,500 lines**

## Integration Strategy

### Step 1: Replace View Components (Biggest Impact)

**3.1 - Integrate PharmaResultsView** (~250 lines removed)

- Location: Lines 3880-4140 in current file
- Replace inline Pharma JSX with `<PharmaResultsView />`
- Wire up props: jobs, selectedRowId, onSelectRow, editing state, onUpdateJobs
- Remove inline pharma rendering code

**3.2 - Integrate FnBResultsView** (~220 lines removed)

- Location: Lines 4140-4365 in current file
- Replace inline F&B JSX with `<FnBResultsView />`
- Wire up props: jobs, selectedRowId, onSelectRow, collapseState, toggle handlers
- Remove inline F&B rendering code

**3.3 - Integrate StandardResultsView** (~80 lines simplified)

- Location: Lines 4365-4440 in current file
- Replace TanStackGridSheet + GalleryView logic with `<StandardResultsView />`
- Wire up all grid callbacks and props
- Simplify view mode switching

### Step 2: Use UI State Hook (Moderate Impact)

**3.4 - Integrate useExtractionUI** (~15 useState removed)

- Replace individual UI state declarations with hook
- Keep only schema/job data state separate
- Update all state setters to use hook return values
- Target states:
  - viewMode, showGallery
  - selectedJob, selectedRowId
  - pharmaEditingSection, pharmaEditedValues
  - fnbCollapse
  - selectedColumnIds, isGroupDialogOpen, groupName
  - contextMenu state
  - tableModal state
  - dialog states

### Step 3: Consolidate Helper Functions

**3.5 - Move helpers to utils** (~200 lines)

- Extract `getStatusIcon`, `renderStatusPill`, `renderCellValue` to separate file
- Extract `computeInitialReviewMeta` helper
- Keep only component orchestration logic in main file

### Step 4: Simplify Imports

**3.6 - Update imports**

- Remove unused imports from component extractions
- Add imports for new components
- Add imports from lib/extraction

## Expected Results After Phase 3

| Metric | Before Phase 3 | After Phase 3 | Reduction |

|--------|----------------|---------------|-----------|

| Total lines | 4,620 | ~1,200 | -3,420 (74%) |

| useState calls | 38 | ~20 | -18 (47%) |

| useCallback calls | 20 | ~15 | -5 (25%) |

| JSX sections | Monolithic | Modular | Views extracted |

## File Structure After Phase 3

```
components/
├── data-extraction-platform.tsx    # ~1,200 lines - orchestrator
├── features/extraction/
│   ├── components/
│   │   ├── PharmaResultsView.tsx   # IN USE ✓
│   │   ├── FnBResultsView.tsx      # IN USE ✓
│   │   ├── StandardResultsView.tsx # IN USE ✓
│   │   ├── SchemaHeader.tsx        # (Phase 1, ready to use)
│   │   ├── ExtractionToolbar.tsx   # (Phase 1, ready to use)
│   │   └── FieldEditorDialog.tsx   # (Phase 1, ready to use)
│   └── utils/
│       └── cell-renderers.ts       # NEW - extracted render functions
lib/extraction/
├── processExtraction.ts            # (Phase 2, ready to use)
└── ...
hooks/extraction/
├── useExtractionUI.ts              # IN USE ✓
└── ...
```

## Integration Order (Recommended)

1. **Start with views** - Biggest visual impact, lowest risk
2. **Add UI hook** - Consolidate state without breaking logic
3. **Extract helpers** - Clean up remaining clutter
4. **Final polish** - Update imports, remove dead code

## Notes

- Hook integration (useSchemaState, etc.) is deferred - too complex for this phase
- Focus is on achieving line count reduction through component extraction
- Main component becomes an orchestrator that wires together modular pieces
- All business logic stays intact, just reorganized

### To-dos

- [x] Create lib/extraction/types.ts with AgentType, SchemaSyncInfo, row types
- [x] Create lib/extraction/schema-helpers.ts with UUID, conversion functions
- [x] Create lib/extraction/export-helpers.ts with CSV and label printing
- [x] Create hooks/extraction/useSchemaState.ts for schema CRUD
- [x] Create hooks/extraction/useSchemaSync.ts for Supabase persistence
- [x] Create hooks/extraction/useExtractionJobs.ts for job management
- [x] Create hooks/extraction/useFieldEditor.ts for column dialog state
- [x] Create hooks/extraction/useDocumentUpload.ts for file handling
- [x] Create SchemaHeader.tsx sub-component
- [x] Create FieldEditorDialog.tsx sub-component
- [x] Create ExtractionToolbar.tsx sub-component
- [x] Remove ROI calculator code and state entirely
- [x] Refactor DataExtractionPlatform.tsx to use new hooks and components
- [x] Create lib/extraction/types.ts with AgentType, SchemaSyncInfo, row types
- [x] Create lib/extraction/schema-helpers.ts with UUID, conversion functions
- [x] Create lib/extraction/export-helpers.ts with CSV and label printing
- [x] Create hooks/extraction/useSchemaState.ts for schema CRUD
- [x] Create hooks/extraction/useSchemaSync.ts for Supabase persistence
- [x] Create hooks/extraction/useExtractionJobs.ts for job management
- [x] Create hooks/extraction/useFieldEditor.ts for column dialog state
- [x] Create hooks/extraction/useDocumentUpload.ts for file handling
- [x] Create SchemaHeader.tsx sub-component
- [x] Create FieldEditorDialog.tsx sub-component
- [x] Create ExtractionToolbar.tsx sub-component
- [ ] Integrate useSchemaState hook into main component
- [ ] Integrate useSchemaSync hook into main component
- [ ] Integrate useExtractionJobs hook into main component
- [ ] Integrate useFieldEditor hook into main component
- [x] Create PharmaResultsView.tsx component (~300 lines)
- [x] Create FnBResultsView.tsx component (~400 lines)
- [x] Create StandardResultsView.tsx component
- [x] Extract extraction processing logic to lib/extraction/processExtraction.ts
- [x] Create useExtractionUI hook for remaining UI state
- [x] Final cleanup and import consolidation
- [ ] Integrate useSchemaState hook into main component
- [x] Create PharmaResultsView.tsx component (~300 lines)
- [x] Create FnBResultsView.tsx component (~400 lines)
- [x] Create StandardResultsView.tsx component
- [x] Extract extraction processing logic to lib/extraction/processExtraction.ts
- [x] Create useExtractionUI hook for remaining UI state
- [x] Final cleanup and import consolidation
- [ ] Create lib/extraction/types.ts with AgentType, SchemaSyncInfo, row types
- [ ] Create lib/extraction/schema-helpers.ts with UUID, conversion functions
- [ ] Create lib/extraction/export-helpers.ts with CSV and label printing
- [ ] Create hooks/extraction/useSchemaState.ts for schema CRUD
- [ ] Create hooks/extraction/useSchemaSync.ts for Supabase persistence
- [ ] Create hooks/extraction/useExtractionJobs.ts for job management
- [ ] Create hooks/extraction/useFieldEditor.ts for column dialog state
- [ ] Create hooks/extraction/useDocumentUpload.ts for file handling
- [ ] Create SchemaHeader.tsx sub-component
- [ ] Create FieldEditorDialog.tsx sub-component
- [ ] Create ExtractionToolbar.tsx sub-component
- [ ] Remove ROI calculator code and state entirely
- [ ] Refactor DataExtractionPlatform.tsx to use new hooks and components
- [ ] Replace inline Pharma JSX with PharmaResultsView component
- [ ] Replace inline F&B JSX with FnBResultsView component
- [ ] Replace grid/gallery logic with StandardResultsView
- [ ] Replace individual UI state with useExtractionUI hook
- [ ] Move cell rendering helpers to utils file
- [ ] Update imports and remove unused code