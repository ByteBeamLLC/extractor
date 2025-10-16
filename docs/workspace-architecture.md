# Workspace Dashboard Redesign – Architecture Notes

## Goals
- Introduce a dashboard-first UX with a persistent Home tab, schema gallery, template chooser, and richer tab metadata.
- Preserve existing schema editing, job processing, and Supabase sync flows while making them consumable from multiple routes (`/home`, `/schema/[id]`).
- Support offline/guest workspaces and progressive enhancement for signed-in users.

## Domain Model

### Schema (existing)
Extends the current `schemas` table.

| Column | Type | Notes |
| -- | -- | -- |
| `id` | uuid | primary key |
| `user_id` | uuid | FK |
| `name` | text | existing schema name |
| `fields` | jsonb | existing |
| `template_id` | text | existing |
| `visual_groups` | jsonb | existing |
| `created_at` | timestamptz | existing |
| `updated_at` | timestamptz | existing |
| `tab_title` | text | _new_. User-facing title shown in tab bar/gallery. Defaults to `name` when not provided. |
| `default_agent` | text | _new_. `'standard' | 'pharma'` used to bootstrap tab UI. |
| `thumbnail_url` | text | _new_. Optional preview for gallery cards (S3 path or external). |
| `last_opened_at` | timestamptz | _new_. Enables “Recents” sorting. |
| `is_favorite` | boolean | _new_. Quick access flag. |
| `folder_id` | uuid | _new_. Nullable FK → `schema_folders.id`. |

> All new columns default to `null` to keep migrations non-breaking. `tab_title` falls back to `name` in client logic.

Indexes to add:
- `(user_id, last_opened_at DESC)`
- `(user_id, is_favorite)` partial where `is_favorite`
- `(folder_id)` for folder listing

### Schema Folders (new table)
```
schema_folders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  created_at timestamptz default now()
)
```
Optional: `parent_id uuid` to support nesting (phase 2). For now the FK is omitted to reduce complexity.

Index: `(user_id, name)`

### Schema Preferences (new table)
Stores per-user workspace settings (view mode, sort order, filters, last route).
```
workspace_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  view_mode text default 'grid',
  sort text default 'recent',
  last_opened_schema uuid,
  last_route text default '/home',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
)
```
Triggers can maintain `updated_at`, but a manual update via Supabase RPC is acceptable.

### Workspace Tabs (in-memory)
The client maintains a list of open tabs across sessions. Persist a trimmed state to local storage for guests and to Supabase for signed-in users (`workspace_preferences.open_tabs jsonb`).

Tab shape:
```ts
type WorkspaceTab = {
  id: string;           // schema id or "home"
  type: 'home' | 'schema';
  schemaId?: string;
  title: string;
  templateId?: string | null;
  defaultAgent?: 'standard' | 'pharma';
  lastViewedAt: number;
};
```

## State Management

### Hook: `useWorkspaceStore`
Lives at `components/workspace/useWorkspaceStore.ts` and exposed through context provider.

Responsibilities:
- Load schemas + jobs for the authenticated user (reuse existing Supabase queries from `DataExtractionPlatform`).
- Track open tabs (`WorkspaceTab[]`), active tab id, selected view mode, sort, filters, and user preferences.
- Provide CRUD helpers:
  - `createSchema(opts)` → uses template definition, persists to Supabase/local cache.
  - `duplicateSchema(id)`
  - `renameSchema(id, name)`
  - `updateSchemaMetadata(id, patch)` (tab title, favorite, folder)
  - `removeSchema(id)` (with existing confirmation safeguards).
  - `openTab(id)` / `closeTab(id)` / `reorderTabs(nextOrder)`.
  - `setActiveTab(id)` plus back/forward sync.
  - `setViewMode('grid' | 'list')`, `setSort('recent'|'name'|'template')`.
- Sync jobs using the existing `syncJobRecords` & realtime channel logic (moved from editor component into the store to avoid duplication).
- Broadcast updates through React context so dashboard cards, tab bar, and editor share one source of truth.

Implementation notes:
- Internally use `zustand`-like pattern with `useSyncExternalStore` or Compose the current `useState`/`useCallback` approach into a custom hook (no third-party state libs).
- Hydrate from server data in a wrapper `<WorkspaceProvider initialData={...}>`. SSR route loaders fetch `schemas` + `extraction_jobs` to avoid layout flash for signed-in users.
- Guest experience: store schema array + jobs in IndexedDB/localStorage (`workspace_guest_cache`). When the user signs in, push unsaved schemas to Supabase, then clear cache (existing behavior).
- Continue firing `beforeunload` warnings when unsaved guest content or pending sync statuses exist.

### Editor Integration
- The existing `DataExtractionPlatform` component becomes `SchemaEditor`. It consumes `useWorkspaceStore` via selectors (schema by id, job updates) and emits updates through store actions rather than local `useState`.
- Editor routes read `schemaId` from URL; top-level workspace layout manages the tab bar (including Home). Editor still handles ROI dialog, column editing, uploads, transformations.

### Dashboard Integration
- `DashboardHome` consumes store selectors (`schemas`, `viewMode`, `sort`, `filters`) and issues store actions for quick actions (open, duplicate, favorite, delete).
- Provide derived data helpers in the store (e.g., `selectRecentSchemas`, `selectStats`) to keep UI components lean.
- Template gallery definitions stay in code (reuse `NESTED_TEMPLATES` and extend with new descriptor fields). Place them in `lib/templates.ts` accessible to both dashboard and modal.

## API / Supabase Access
- Server components use `createSupabaseServerComponentClient` to fetch schema metadata incl. new columns and pass into provider via props.
- Client store uses existing `useSupabaseClient` for mutations (`upsert`/`delete`). Metadata updates reuse the same optimistic approach as `syncSchema`.
- Realtime subscription (current `supabase.channel` usage) moves into the store. Channel name includes schema ids; re-subscribe when open schema set changes.
- Batch updates:
  - `updateSchemaMetadata` should call a new helper `syncSchemaMetadata` that writes only metadata columns (use `.update` to reduce payload size).
  - Preferences stored in `workspace_preferences`; expose `savePreferences` invoked on throttle (e.g., view mode changes).

## Template & Creation Flow
- Extract template definitions to `lib/templates.ts`. Add metadata: `thumbnail`, `agent`, `category`, `description`.
- Template modal lives at `components/workspace/TemplateSelectorDialog.tsx`. It writes a pending schema config to the store, which then persists and opens a new tab.
- Support “Blank schema” option that prompts for schema name and agent before creation.

## Routing Plan
- `/home`: dashboard route, default redirect.
- `/schema/[id]`: editor route. When opened directly, ensure tab is added to store and metadata is loaded.
- `RootLayout` wraps everything in `WorkspaceProvider` with SSR data.
- Add `Home` tab to tab bar (id `'home'`) and mark as non-closable.
- Use Next.js parallel routes or nested layouts to maintain persistent tab bar while switching between dashboard/editor content.

## Migration Checklist
1. SQL migration to add new columns on `schemas`.
2. Create `schema_folders` table.
3. Create `workspace_preferences` table.
4. Update Supabase policies (RLS) to cover new tables/columns.
5. Update `lib/supabase/types.ts`.
6. Backfill existing rows (set `last_opened_at = updated_at`, `tab_title = name` where null).
7. Deploy serverless functions after verifying env vars.

## Testing & QA Considerations
- Regression: ensure uploads, job syncing, transformation dependencies, ROI dialog, and F&B/pharma flows behave unchanged.
- New flows: dashboard filtering, tab persistence, template creation, folder/favorite toggles.
- Accessibility: ensure dashboard cards are keyboard navigable and modal uses focus traps.
- Offline: verify guest storage survives reload; sign-in migration flushes to Supabase without duplicates.

