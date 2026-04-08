-- Phase 4: promote anonymous → free tier automatically on signup
--
-- Before this migration, when a guest converted to a signed-up user:
--   - auth.users.is_anonymous flipped from TRUE to FALSE
--   - but extractor_subscriptions.tier stayed 'anonymous' (5 pages/day)
--
-- The converted user silently kept the guest quota forever, which
-- bricked the signup funnel. Client-side code in ParserListPage and
-- credits.ts attempted to fix this but only covered the WRONG direction
-- (free → anonymous for incorrectly-tagged rows).
--
-- Fix: a DB trigger on auth.users. AFTER UPDATE, if is_anonymous flipped
-- from TRUE to FALSE, bump the extractor_subscriptions row from
-- tier='anonymous' to tier='free' with fresh 30-day quota. Runs as
-- SECURITY DEFINER so it can read/write regardless of caller.
--
-- Includes a one-shot backfill that repairs any currently-stuck users.

-- ─── 1. Trigger function ──────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.promote_anonymous_to_free_on_signup()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Fire only on the specific transition: anonymous → signed up.
  IF OLD.is_anonymous = TRUE AND NEW.is_anonymous = FALSE THEN
    UPDATE public.extractor_subscriptions
    SET
      tier = 'free',
      credits_free = 30,
      max_parsers = 3,
      credits_used = 0,
      credits_reset_at = now() + INTERVAL '30 days',
      updated_at = now()
    WHERE user_id = NEW.id
      AND tier = 'anonymous';

    -- Log the promotion as an adjustment event so billing_events has a
    -- complete record of the credit state at the transition moment.
    IF FOUND THEN
      INSERT INTO public.billing_events (
        user_id, event_type, pages, credits_used_after, credits_free_at_time, reason
      ) VALUES (
        NEW.id, 'adjustment', 0, 0, 30, 'anonymous_to_free_signup'
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- ─── 2. Trigger ───────────────────────────────────────────────────────────

DROP TRIGGER IF EXISTS promote_anonymous_to_free_trigger ON auth.users;

CREATE TRIGGER promote_anonymous_to_free_trigger
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.promote_anonymous_to_free_on_signup();

-- ─── 3. Backfill currently-stuck users ───────────────────────────────────

-- Any user who is no longer anonymous but still sits on the 'anonymous'
-- subscription tier needs immediate remediation. This also handles users
-- who converted before the trigger existed.
UPDATE public.extractor_subscriptions es
SET
  tier = 'free',
  credits_free = 30,
  max_parsers = 3,
  credits_used = 0,
  credits_reset_at = now() + INTERVAL '30 days',
  updated_at = now()
FROM auth.users au
WHERE au.id = es.user_id
  AND au.is_anonymous = FALSE
  AND es.tier = 'anonymous';

-- Log backfill events so the ledger reflects every state change.
INSERT INTO public.billing_events (
  user_id, event_type, pages, credits_used_after, credits_free_at_time, reason
)
SELECT
  es.user_id, 'adjustment', 0, 0, 30, 'anonymous_to_free_backfill'
FROM public.extractor_subscriptions es
JOIN auth.users au ON au.id = es.user_id
WHERE au.is_anonymous = FALSE
  AND es.tier = 'free'
  AND es.updated_at >= now() - INTERVAL '10 seconds';
