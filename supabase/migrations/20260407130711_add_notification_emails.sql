-- ─── Two-stage extraction-ready re-engagement: email infrastructure ───
--
-- Tracks scheduled re-engagement emails fired ~5 minutes after a document
-- finishes extraction, gated on the user not having clicked an earlier
-- push notification (Phase 2) or returned via email link.
--
-- Phase 1 only inserts/sends email rows. Phase 2 (push) will reuse the
-- same `nid` and `push_clicked_at` column for cross-channel dedupe.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.notification_emails (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  document_id     UUID NOT NULL REFERENCES public.parser_processed_documents(id) ON DELETE CASCADE,
  parser_id       UUID NOT NULL REFERENCES public.parsers(id) ON DELETE CASCADE,
  -- Shared attribution id carried in both push payload AND email link
  -- (?nid=<id>) so click attribution can flip the matching row regardless
  -- of which channel the user actually returned through.
  nid             UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  scheduled_for   TIMESTAMPTZ NOT NULL,
  status          TEXT NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending', 'sent', 'suppressed', 'failed')),
  -- Drives template selection: warmer copy + inline preview for the user's
  -- first ever successful extraction, terse one-liner for repeats.
  is_first_value  BOOLEAN NOT NULL DEFAULT false,
  -- Dedupe markers — set by /api/notifications/click when the user
  -- returns via push or email respectively. Cron checks `push_clicked_at`
  -- before sending the email.
  push_clicked_at  TIMESTAMPTZ,
  email_clicked_at TIMESTAMPTZ,
  sent_at         TIMESTAMPTZ,
  error_message   TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Partial index for the cron worker — only scans rows it actually needs.
CREATE INDEX IF NOT EXISTS idx_notification_emails_due
  ON public.notification_emails (scheduled_for)
  WHERE status = 'pending';

-- Lookup index for the click attribution endpoint.
CREATE INDEX IF NOT EXISTS idx_notification_emails_nid
  ON public.notification_emails (nid);

-- ─── RLS ───
-- Service role bypasses RLS, so the worker, cron, and click endpoint
-- (which all use service role) work without policies. Users only need
-- read access to their own rows in case we surface notification history.
ALTER TABLE public.notification_emails ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own notification emails"
  ON public.notification_emails;
CREATE POLICY "Users can view their own notification emails"
  ON public.notification_emails FOR SELECT
  USING (auth.uid() = user_id);

-- ─── User preferences + timezone on extractor_subscriptions ───
-- Default ON: re-engagement is the whole point of the feature, and the
-- contrarian advice from research says first-value email is the highest
-- leverage transactional message we can send.
ALTER TABLE public.extractor_subscriptions
  ADD COLUMN IF NOT EXISTS notification_email_enabled BOOLEAN NOT NULL DEFAULT true;

-- IANA timezone identifier (e.g. "America/New_York"). Captured from
-- Intl.DateTimeFormat().resolvedOptions().timeZone on first app load.
-- Used by the cron to defer 22:00–07:00 local quiet hours to 08:00 local.
ALTER TABLE public.extractor_subscriptions
  ADD COLUMN IF NOT EXISTS timezone TEXT NOT NULL DEFAULT 'UTC';
