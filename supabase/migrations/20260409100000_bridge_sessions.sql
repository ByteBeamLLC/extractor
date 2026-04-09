-- Bridge sessions: opaque server-side handoff tokens for cross-subdomain auth.
--
-- When a marketing-side anonymous user (parsli.co) wants to continue in the
-- authenticated app (app.parsli.co), a bridge session is created with the
-- user's parser, document, and chat payload. The raw token is passed through
-- the OAuth state parameter. After authentication, the app consumes the
-- session (single-use, atomic UPDATE) and hydrates the UI.
--
-- Account migrations: audit log for anonymous-to-permanent user data moves.
-- One row per migration attempt, success or failure. Used for debugging and
-- compliance (which anon user's data ended up under which permanent user).

-- ─── 1. bridge_sessions ─────────────────────────────────────────────────────

CREATE TABLE public.bridge_sessions (
  token_hash  text        PRIMARY KEY,  -- SHA-256 hex of the raw bsn_ token
  source      text        NOT NULL DEFAULT 'hwt_bridge',
  anon_user_id uuid       NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  parser_id   uuid        REFERENCES public.parsers(id) ON DELETE SET NULL,
  document_id uuid        REFERENCES public.parser_processed_documents(id) ON DELETE SET NULL,
  payload     jsonb       NOT NULL DEFAULT '{}',
  created_at  timestamptz NOT NULL DEFAULT now(),
  expires_at  timestamptz NOT NULL DEFAULT (now() + interval '30 minutes'),
  consumed_at timestamptz,
  consumed_by_user uuid   REFERENCES auth.users(id) ON DELETE SET NULL,
  consumer_ip text,
  consumer_ua text
);

-- Cleanup cron uses this to find expired unconsumed sessions.
CREATE INDEX bridge_sessions_expires_at_idx
  ON public.bridge_sessions (expires_at)
  WHERE consumed_at IS NULL;

-- RLS enabled, no client-facing policies. All access via service role.
ALTER TABLE public.bridge_sessions ENABLE ROW LEVEL SECURITY;

-- ─── 2. account_migrations ──────────────────────────────────────────────────

CREATE TABLE public.account_migrations (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  anon_user_id  uuid        NOT NULL,
  new_user_id   uuid        NOT NULL,
  source        text        NOT NULL DEFAULT 'google_oauth',
  row_counts    jsonb       NOT NULL DEFAULT '{}',
  success       boolean     NOT NULL DEFAULT false,
  error_message text,
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- Query by either side of the migration for debugging.
CREATE INDEX account_migrations_anon_user_id_idx
  ON public.account_migrations (anon_user_id);
CREATE INDEX account_migrations_new_user_id_idx
  ON public.account_migrations (new_user_id);

ALTER TABLE public.account_migrations ENABLE ROW LEVEL SECURITY;
