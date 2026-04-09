-- Email continuation tokens: magic-link-style auto-auth for notification emails.
--
-- When a user receives a "your document is ready" email, the CTA link carries
-- an opaque token. The /auth/email-continue route consumes the token (single-use,
-- atomic UPDATE), creates a Supabase session server-side, and redirects the user
-- to the document. No password or OAuth prompt needed.
--
-- Same security model as bridge_sessions: SHA-256 hashed at rest, single-use
-- via atomic UPDATE WHERE consumed_at IS NULL, 7-day TTL.

CREATE TABLE public.email_continuation_tokens (
  token_hash  text        PRIMARY KEY,  -- SHA-256 hex of the raw ect_ token
  user_id     uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  purpose     text        NOT NULL DEFAULT 'extraction_ready',
  target_url  text        NOT NULL,
  nid         text,                      -- notification_emails.nid for attribution
  created_at  timestamptz NOT NULL DEFAULT now(),
  expires_at  timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  consumed_at timestamptz,
  consumed_by uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
  consumer_ip text,
  consumer_ua text
);

-- Cleanup cron uses this to find expired unconsumed tokens.
CREATE INDEX email_continuation_tokens_expires_at_idx
  ON public.email_continuation_tokens (expires_at)
  WHERE consumed_at IS NULL;

-- RLS enabled, no client-facing policies. All access via service role.
ALTER TABLE public.email_continuation_tokens ENABLE ROW LEVEL SECURITY;
