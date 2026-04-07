-- ─── Web Push subscriptions (Phase 2 of two-stage notifications) ───
--
-- One row per (user, browser) endpoint. Push is opt-in via the settings
-- toggle, so the related `notification_push_enabled` column on
-- `extractor_subscriptions` defaults to FALSE (vs email which defaults
-- to TRUE).
--
-- The `nid` ledger lives on `notification_emails` (Phase 1) and is
-- shared across both channels: a click on the push notification updates
-- `push_clicked_at` via /api/notifications/click, which the email cron
-- checks before sending the t+5min follow-up.

CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  -- Endpoint URL the browser asks us to POST to. Globally unique per
  -- browser+account so we can dedupe re-subscriptions and clean up stale
  -- ones returned by the push service.
  endpoint      TEXT NOT NULL UNIQUE,
  p256dh        TEXT NOT NULL,
  auth          TEXT NOT NULL,
  user_agent    TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- Bumped each time we successfully deliver, useful for pruning dormant subs.
  last_used_at  TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user
  ON public.push_subscriptions (user_id);

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own push subscriptions"
  ON public.push_subscriptions;
CREATE POLICY "Users can view their own push subscriptions"
  ON public.push_subscriptions FOR SELECT
  USING (auth.uid() = user_id);

-- Push is opt-in: default FALSE. The settings toggle, after a successful
-- PushManager.subscribe(), flips this to TRUE.
ALTER TABLE public.extractor_subscriptions
  ADD COLUMN IF NOT EXISTS notification_push_enabled BOOLEAN NOT NULL DEFAULT false;
