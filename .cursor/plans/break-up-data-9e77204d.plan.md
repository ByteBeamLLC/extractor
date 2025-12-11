---
name: "Phase 3: Integrate Extracted Components into DataExtractionPlatform"
overview: ""
todos:
  - id: a88078c2-1562-44ec-b087-d37a0c97476a
    content: Create lib/extraction/types.ts with AgentType, SchemaSyncInfo, row types
    status: completed
  - id: 933bf616-57e3-44ef-b22d-82f0cc0d772d
    content: Create lib/extraction/schema-helpers.ts with UUID, conversion functions
    status: completed
  - id: 03911599-ef7c-4ca2-9dbc-95500f792c5b
    content: Create lib/extraction/export-helpers.ts with CSV and label printing
    status: completed
  - id: 5cfd11e7-f447-4fd9-b431-51c67fc3c144
    content: Create hooks/extraction/useSchemaState.ts for schema CRUD
    status: completed
  - id: a9afb7f0-0c58-430e-a32c-1c0d6a541a5a
    content: Create hooks/extraction/useSchemaSync.ts for Supabase persistence
    status: completed
  - id: 1fdb91b0-e513-4ca4-bad1-c0088333d0ed
    content: Create hooks/extraction/useExtractionJobs.ts for job management
    status: completed
  - id: 67873c8b-a960-40d4-b4fb-89a5393a47a4
    content: Create hooks/extraction/useFieldEditor.ts for column dialog state
    status: completed
  - id: ac9a8b00-354f-4935-88dc-baa72c9ee608
    content: Create hooks/extraction/useDocumentUpload.ts for file handling
    status: completed
  - id: c5de5738-6885-4717-a092-c0d75db69193
    content: Create SchemaHeader.tsx sub-component
    status: completed
  - id: 54888c7c-5f0e-481a-90f2-4463ef64932a
    content: Create FieldEditorDialog.tsx sub-component
    status: completed
  - id: e89310a1-21a8-434d-b2bd-1bcf4c9dbaca
    content: Create ExtractionToolbar.tsx sub-component
    status: completed
  - id: 7795a63c-c2fe-4170-b04f-ba799174b9cd
    content: Remove ROI calculator code and state entirely
    status: completed
  - id: 88da423e-742a-4541-ab77-125dfe56a7cc
    content: Refactor DataExtractionPlatform.tsx to use new hooks and components
    status: completed
  - id: 47bb723d-e967-4e29-88e8-b2d956f01f8e
    content: Create lib/extraction/types.ts with AgentType, SchemaSyncInfo, row types
    status: completed
  - id: 72a214e7-1bcc-4410-9463-efeb7a34f5f4
    content: Create lib/extraction/schema-helpers.ts with UUID, conversion functions
    status: completed
  - id: bedb1d01-6d09-4553-a0b7-7b5bffddeb41
    content: Create lib/extraction/export-helpers.ts with CSV and label printing
    status: completed
  - id: f76195cb-477b-4260-9885-e59956cf3d55
    content: Create hooks/extraction/useSchemaState.ts for schema CRUD
    status: completed
  - id: 17caccfc-9e64-4da2-a560-89478c303d65
    content: Create hooks/extraction/useSchemaSync.ts for Supabase persistence
    status: completed
  - id: afdb8d24-ab3e-48ac-a628-5e674770eb5d
    content: Create hooks/extraction/useExtractionJobs.ts for job management
    status: completed
  - id: 45654051-43ec-4983-8f32-201f5d7f44f9
    content: Create hooks/extraction/useFieldEditor.ts for column dialog state
    status: completed
  - id: adc39084-c327-49ee-bb39-2128c5e1dbed
    content: Create hooks/extraction/useDocumentUpload.ts for file handling
    status: completed
  - id: 20fc04fe-b34e-411b-aab7-ef4b8ea37f53
    content: Create SchemaHeader.tsx sub-component
    status: completed
  - id: 655752ab-d233-408a-9cb6-020f962c7ffe
    content: Create FieldEditorDialog.tsx sub-component
    status: completed
  - id: 7771304c-9460-4cc0-8142-3f5a481922f1
    content: Create ExtractionToolbar.tsx sub-component
    status: completed
  - id: 4092d564-9b73-4176-a9af-27f00e40f397
    content: Integrate useSchemaState hook into main component
    status: pending
  - id: 7e1d532b-3f68-4f7a-80c8-0135de3d2e03
    content: Integrate useSchemaSync hook into main component
    status: pending
  - id: f0207971-bb4f-4df1-a947-0aafe021aaf1
    content: Integrate useExtractionJobs hook into main component
    status: pending
  - id: 268980a2-a5d3-4b73-a8c8-8935a4fe1f25
    content: Integrate useFieldEditor hook into main component
    status: pending
  - id: 6ed98622-972c-4369-b382-cf692b0d3373
    content: Create PharmaResultsView.tsx component (~300 lines)
    status: completed
  - id: 913a34e1-dcd2-41c3-83ae-94edaf0e387e
    content: Create FnBResultsView.tsx component (~400 lines)
    status: completed
  - id: 4187d633-16b9-41f0-a4ba-e563e982fd01
    content: Create StandardResultsView.tsx component
    status: completed
  - id: a271077b-289a-42ca-a7db-1b1534644d9a
    content: Extract extraction processing logic to lib/extraction/processExtraction.ts
    status: completed
  - id: c83e099e-12e9-4c55-8963-c53af32d8c0b
    content: Create useExtractionUI hook for remaining UI state
    status: completed
  - id: 7d0d20ca-4ca5-4226-9b9d-34436ab0a83e
    content: Final cleanup and import consolidation
    status: completed
  - id: 5063804c-8c64-4492-b77e-0900d454e508
    content: Integrate useSchemaState hook into main component
    status: pending
  - id: 2fbd3d43-5d41-4acd-87bd-f825adc1b1dd
    content: Create PharmaResultsView.tsx component (~300 lines)
    status: completed
  - id: d7500b72-4742-41fa-af88-73f08c50eb8c
    content: Create FnBResultsView.tsx component (~400 lines)
    status: completed
  - id: f54a1d65-b07c-411b-a8db-2f390a61f3cd
    content: Create StandardResultsView.tsx component
    status: completed
  - id: 5aab1ecd-53b9-4b73-87ff-0e1ac7668184
    content: Extract extraction processing logic to lib/extraction/processExtraction.ts
    status: completed
  - id: 333dad26-2bd4-416f-b279-930725f99d07
    content: Create useExtractionUI hook for remaining UI state
    status: completed
  - id: 8bfd98bb-5070-4cd1-98fd-648f0f926752
    content: Final cleanup and import consolidation
    status: completed
  - id: fb6149b0-0666-44e1-b6d0-091c9e4c6877
    content: Create lib/extraction/types.ts with AgentType, SchemaSyncInfo, row types
    status: pending
  - id: 1ddae299-aacc-4cf6-af28-06a981b8a3f9
    content: Create lib/extraction/schema-helpers.ts with UUID, conversion functions
    status: pending
  - id: 99e701f5-6ac9-49cd-a998-712d92d3a0a1
    content: Create lib/extraction/export-helpers.ts with CSV and label printing
    status: pending
  - id: 09638ddd-10e5-4781-9e94-fc104f7bd9fe
    content: Create hooks/extraction/useSchemaState.ts for schema CRUD
    status: pending
  - id: 749a64e8-2a5d-40bc-a9fe-a1a8b26d6867
    content: Create hooks/extraction/useSchemaSync.ts for Supabase persistence
    status: pending
  - id: 7bf48cb2-ecb4-4783-8727-6a283dcb9b0c
    content: Create hooks/extraction/useExtractionJobs.ts for job management
    status: pending
  - id: e31fce67-3263-4f9e-9480-7296eb72eb8c
    content: Create hooks/extraction/useFieldEditor.ts for column dialog state
    status: pending
  - id: 7f4b9f81-b854-4951-a221-0982d037ae0d
    content: Create hooks/extraction/useDocumentUpload.ts for file handling
    status: pending
  - id: af483d76-8a68-4355-a2ec-460d79bcc9c7
    content: Create SchemaHeader.tsx sub-component
    status: pending
  - id: f4b154f8-b0b8-4f34-be8c-52c6c287aba3
    content: Create FieldEditorDialog.tsx sub-component
    status: pending
  - id: 782d125c-f966-4d42-b66f-a424a5c9ca29
    content: Create ExtractionToolbar.tsx sub-component
    status: pending
  - id: 7f7bcbc9-d840-4db1-abb5-ec3ae4b55752
    content: Remove ROI calculator code and state entirely
    status: pending
  - id: 44cf1f33-3f0a-49d7-bdf4-c3ef404cdeae
    content: Refactor DataExtractionPlatform.tsx to use new hooks and components
    status: pending
  - id: ea9867d7-9574-4254-91a5-15a672169a3b
    content: Replace inline Pharma JSX with PharmaResultsView component
    status: pending
  - id: 598abee4-70a8-46e1-889e-add8a0a23c70
    content: Replace inline F&B JSX with FnBResultsView component
    status: pending
  - id: 4b44a317-85b4-4abf-ae22-eb3c3c223c7d
    content: Replace grid/gallery logic with StandardResultsView
    status: pending
  - id: 796b44ad-b013-4571-9612-414eac98326f
    content: Replace individual UI state with useExtractionUI hook
    status: pending
  - id: 690960ed-6461-4b4e-a7bb-95fd0bfe77a1
    content: Move cell rendering helpers to utils file
    status: pending
  - id: 52f86092-8da7-44a4-bdb1-62206d264be2
    content: Update imports and remove unused code
    status: pending
---

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