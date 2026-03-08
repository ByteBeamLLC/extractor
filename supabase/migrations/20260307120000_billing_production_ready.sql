-- 1. Webhook idempotency table: prevent duplicate event processing
CREATE TABLE IF NOT EXISTS stripe_webhook_events (
  id TEXT PRIMARY KEY,               -- Stripe event ID (evt_...)
  event_type TEXT NOT NULL,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Auto-cleanup: remove events older than 7 days (Stripe retries within 3 days max)
CREATE INDEX IF NOT EXISTS idx_stripe_webhook_events_processed_at
  ON stripe_webhook_events (processed_at);

-- 2. Atomic credit deduction function (prevents race conditions)
-- Usage: SELECT * FROM deduct_credits('user-uuid', 1);
-- Returns the updated row if deduction succeeded, empty if insufficient credits.
CREATE OR REPLACE FUNCTION deduct_credits(
  p_user_id UUID,
  p_pages INT DEFAULT 1
)
RETURNS TABLE (
  id UUID,
  credits_used INT,
  credits_free INT,
  remaining INT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  UPDATE extractor_subscriptions
  SET
    credits_used = extractor_subscriptions.credits_used + p_pages,
    updated_at = now()
  WHERE extractor_subscriptions.user_id = p_user_id
    AND extractor_subscriptions.credits_used + p_pages <= extractor_subscriptions.credits_free
  RETURNING
    extractor_subscriptions.id,
    extractor_subscriptions.credits_used,
    extractor_subscriptions.credits_free,
    extractor_subscriptions.credits_free - extractor_subscriptions.credits_used AS remaining;
END;
$$;

-- 3. Atomic credit reset function (for billing period resets)
CREATE OR REPLACE FUNCTION reset_credits_if_due(
  p_user_id UUID
)
RETURNS TABLE (
  was_reset BOOLEAN,
  credits_free INT,
  credits_used INT
)
LANGUAGE plpgsql
AS $$
DECLARE
  v_sub RECORD;
BEGIN
  SELECT * INTO v_sub
  FROM extractor_subscriptions es
  WHERE es.user_id = p_user_id
  FOR UPDATE;  -- Row lock to prevent concurrent resets

  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 0, 0;
    RETURN;
  END IF;

  IF v_sub.credits_reset_at <= now() THEN
    UPDATE extractor_subscriptions
    SET
      credits_used = 0,
      credits_reset_at = now() + INTERVAL '30 days',
      updated_at = now()
    WHERE extractor_subscriptions.user_id = p_user_id;

    RETURN QUERY SELECT true, v_sub.credits_free, 0;
  ELSE
    RETURN QUERY SELECT false, v_sub.credits_free, v_sub.credits_used;
  END IF;
END;
$$;

-- 4. Cleanup function for old webhook events (run via cron or manually)
CREATE OR REPLACE FUNCTION cleanup_old_webhook_events()
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM stripe_webhook_events
  WHERE processed_at < now() - INTERVAL '7 days';
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;
