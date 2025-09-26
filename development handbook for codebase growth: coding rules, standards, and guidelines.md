## Engineering Handbook: Coding Rules, Standards, and Guidelines

### Purpose
- Ensure the codebase scales sustainably with minimal technical debt.
- Promote consistency, reliability, and developer velocity.
- Codify decisions so new contributors can onboard quickly.

## Architecture and Project Structure
- **Layers**
  - **app/**: Routing only. API handlers must be thin and delegate to `lib/server/*`.
  - **features/**: Feature modules (UI, hooks, services, utils) co-located per domain.
  - **components/ui/**: Reusable, presentation-only primitives.
  - **lib/**: Cross-feature code.
    - `lib/schema/*` for schema types and operations.
    - `lib/client/*` browser-only utilities.
    - `lib/server/*` Node-only utilities and integrations.
- **Agents**
  - Place agent-specific logic/UI in `features/agents/{agent}/`.
  - Shared agent interfaces live in `lib/agents/`.

## Module Boundaries and Ownership
- **Server-only code**: Under `lib/server/*` and imported by routes only. Add `import 'server-only'`.
- **Client-only code**: Under `lib/client/*`. Never import Node deps.
- **Shared UI**: `components/ui/*` is dependency-free (no business logic).
- **Feature code**: Feature folders own their hooks/services/components. Avoid cross-feature imports; extract shared logic to `lib/*` instead.
- **Ownership**: Use `CODEOWNERS` to set review ownership per folder (features, lib/server, lib/schema, components/ui).

## TypeScript, Naming, and Conventions
- **TypeScript**
  - Strict mode on. No `any` unless gated with a TODO and an issue.
  - Define domain types in `lib/schema/types.ts` or the nearest feature `types.ts`.
  - Prefer `zod` schemas co-located with API boundaries or model definitions.
- **Naming**
  - Files: `kebab-case.ts`, React components: `PascalCase.tsx`.
  - Hooks: `useThing.ts`. Providers: `ThingProvider.tsx`.
  - Services: `{domain}Client.ts` for client-side API; `{domain}Service.ts` for server-side.
- **Functions**
  - Single-responsibility; max ~100-150 LOC. Extract helpers early.
  - Prefer pure functions in `lib/*` with unit tests.

## React and UI Guidelines
- **Components**
  - Presentational components should be stateless and props-driven.
  - Container components (pages/shells) orchestrate state and side effects.
  - No inline anonymous functions in hot paths; memoize when necessary.
- **Hooks**
  - Encapsulate stateful logic: `useSchemas`, `useJobs`.
  - Hooks must not have side effects on mount unless necessary; document them.
- **Styling**
  - Use Tailwind with utility-first classes.
  - Reusable styling tokens via CSS variables or Tailwind config.
- **Accessibility**
  - Use semantic HTML, `aria-*` as needed, and focus management.
  - All interactive elements keyboard-navigable.
- **Performance**
  - Avoid unnecessary re-renders: `useMemo`, `useCallback`, `memo` where it matters.
  - Defer heavy work to web workers or server when possible.
  - Lazy-load non-critical panels and agent UIs.

## Next.js and API Routes
- **Routes**
  - `app/api/*/route.ts` must:
    - Validate inputs with `zod`.
    - Delegate all business logic to `lib/server/*`.
    - Never import client code.
- **Runtime**
  - Prefer Node runtime for server integrations.
  - Avoid leaking large data into client responses; paginate/stream if needed.
- **Error handling**
  - Standardize error shapes: `{ error: string; code?: string; details?: unknown }`.
  - Log server-side errors with context; never leak secrets to the client.

## Data and Schema
- **Schema ops**
  - Keep `flattenFields`, `updateFieldById`, etc. in `lib/schema/treeOps.ts`.
  - Any schema migrations must include migration helpers and test coverage.
- **Validation**
  - Define `zod` schemas for both server input and output.
  - Sanitize and normalize results in `lib/server/resultsSanitize.ts`.

## Services and Integrations
- **Client services**: `features/platform/services/*Client.ts`
  - Wrap fetch with consistent error handling.
  - No business mapping in components; use mappers.
- **Server integrations**: `lib/server/*`
  - Isolate providers (e.g., AI, PDFs). Add adapter interfaces for testability.
  - Do not call 3rd-party SDKs directly from routes; go through a thin service.

## Security and Privacy
- Never log secrets or PII. Use redaction helpers.
- Validate and sanitize all inputs; deny by default.
- Restrict file size and type; enforce limits on both client and server.
- Use `Content-Security-Policy` headers where feasible.
- Store secrets only in environment variables; never commit them.

## Error Handling and Observability
- **Client**
  - User-facing errors are friendly and actionable.
  - Track non-fatal errors with analytics only if anonymized.
- **Server**
  - Structure logs with IDs (requestId, jobId).
  - Use levels (debug/info/warn/error) consistently.

## Testing Strategy
- **Unit tests**
  - Pure functions in `lib/*`, mappers, and utilities must have tests.
- **Component tests**
  - Critical UI (builders, panels) with RTL.
- **Integration tests**
  - API routes happy-path + major edge-cases.
- **Performance tests**
  - For large files/images and schema sizes.
- **Test rules**
  - New modules must include tests; bug fixes require regression tests.

## CI/CD and Quality Gates
- CI must run: install, type-check, lint, tests, build.
- Reject PR if:
  - Lint/type errors exist
  - Coverage drops under threshold (set an initial baseline)
  - Bundle size increases beyond budget without approval
- Preview deployments for every PR.

## Linting, Formatting, and Commits
- **Formatting**: Prettier; no manual style bikeshedding.
- **Linting**: ESLint with React/TS rules; import/order enforced.
- **Commit messages**
  - Conventional Commits (`feat:`, `fix:`, `refactor:`, `chore:`, `test:`).
  - Scope by feature (e.g., `feat(platform): ...`).
- **PRs**
  - Small, focused; one logical change-set.
  - Include screenshots for UI changes.
  - Fill template: context, changes, test plan, risks.

## Dependency Management
- Pin versions; rely on lockfile.
- Add new deps only with justification; prefer standard libs/utilities.
- Regularly audit and update; remove unused packages.

## Feature Flags and Migrations
- Gate risky features behind flags.
- Provide data and config migrations with rollback plans.
- Document deprecations with timelines and replacements.

## Documentation
- **Architecture**: `docs/architecture.md` overview with diagrams.
- **Feature READMEs**: Each `features/*` folder has its own README (purpose, public API, examples).
- **API contracts**: Document request/response schemas and error codes.
- **Runbooks**: Operational guides for failures and recovery.

## Performance and UX Budgets
- Initial load: keep critical JS minimal; code-split panels.
- Image uploads: enforce client-side compression; 3MB cap unless explicitly raised.
- Keep interactions <100ms where possible; show progress states for long tasks.

## Accessibility and Internationalization
- Always test keyboard navigation and screen-reader labels.
- Design for LTR/RTL where relevant; keep copy in locale files if/when i18n is introduced.

## Deletion and Refactors
- When deleting/moving code:
  - Update all imports.
  - Keep git history via `git mv` where possible.
  - Add compatibility layers or migration notes if APIs change.

## Definition of Done (DoD)
- Builds, type-checks, and lints clean.
- Unit/integration tests updated and passing.
- No server-only code in client bundles.
- Docs updated (architecture or feature README as applicable).
- Monitoring/logging adjusted if behavior changes.
- Approved by code owners; small PRs preferred.

## Example Folder Contracts
- `features/platform/components/*`: UI only, accepts props; no direct fetches.
- `features/platform/hooks/*`: Encapsulated state; may call client services.
- `features/platform/services/*`: Fetch calls and client-side mapping.
- `lib/server/*`: Node-only logic; tested and imported by routes.
- `app/api/*/route.ts`: Validate, delegate, serialize response.

If you want, I can generate initial `docs/architecture.md` and a `CONTRIBUTING.md` based on these rules, plus ESLint/Prettier configs to enforce them.