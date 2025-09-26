# Extractor Codebase Guidelines

This repository follows a feature-oriented structure to keep domain logic, UI, and shared utilities organized and portable.

## Feature Modules
- Place user-facing functionality inside `features/<domain>` directories.
- `features/platform` stores core platform experiences (dashboards, shared flows) and is subdivided into:
  - `components` for feature-scoped React components.
  - `hooks` for React hooks scoped to the feature.
  - `services` for data-fetching and orchestration logic.
  - `utils` for pure helpers used by the feature.
- `features/agents` hosts specialization for extraction agents. Start with:
  - `fnb` for food-and-beverage label compliance experiences.
  - `pharma` for pharmaceutical-focused flows.

When a feature grows beyond these buckets, add co-located folders (e.g. `store`, `api`) under the feature. Cross-feature reuse should be promoted to `lib`.

## Lib Modules
- `lib/client` contains browser-safe helpers. Every file should be free of Node-only APIs.
- `lib/server` contains server-only utilities. Each module must call the server guard exported by `lib/server/ensureServerOnly`.
- `lib/schema` encapsulates shared schema definitions and helpers used across features.

Prefer importing from these folders via the `@/lib/...` aliases to keep relative paths stable.

## Ownership
Ownership rules are tracked in `CODEOWNERS`. Update both this README and the code owners file when adding new high-level folders so the structure stays discoverable.

