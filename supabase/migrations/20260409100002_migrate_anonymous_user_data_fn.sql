-- Transactional migration of anonymous user data to a newly authenticated user.
--
-- Replaces the JS sequential UPDATEs in the Google OAuth callback with a
-- single Postgres function that runs atomically. If any step fails, the
-- entire migration rolls back — no half-migrated state.
--
-- CRITICAL: includes subscription tier promotion (anonymous → free) for
-- OAuth converts. The existing promote_anonymous_to_free_on_signup trigger
-- on auth.users only fires when is_anonymous flips FALSE, which happens on
-- email/password signup. For Google OAuth, the anonymous user is DELETED
-- (not updated), so the trigger never fires. This function fills that gap.

CREATE OR REPLACE FUNCTION public.migrate_anonymous_user_data(
  p_anon_user_id uuid,
  p_new_user_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_counts jsonb := '{}';
  v_cnt int;
BEGIN
  -- 1. Parsers (child documents follow via parser_id FK but also have user_id)
  UPDATE parsers SET user_id = p_new_user_id WHERE user_id = p_anon_user_id;
  GET DIAGNOSTICS v_cnt = ROW_COUNT;
  v_counts := v_counts || jsonb_build_object('parsers', v_cnt);

  -- 2. Processed documents (own user_id column)
  UPDATE parser_processed_documents SET user_id = p_new_user_id WHERE user_id = p_anon_user_id;
  GET DIAGNOSTICS v_cnt = ROW_COUNT;
  v_counts := v_counts || jsonb_build_object('parser_processed_documents', v_cnt);

  -- 3. Extraction jobs
  UPDATE extraction_jobs SET user_id = p_new_user_id WHERE user_id = p_anon_user_id;
  GET DIAGNOSTICS v_cnt = ROW_COUNT;
  v_counts := v_counts || jsonb_build_object('extraction_jobs', v_cnt);

  -- 4. Subscription: promote anonymous → free with fresh 30-day quota.
  --    This is the fix for the OAuth tier promotion bug — the DB trigger
  --    only fires on email/password path (is_anonymous flip), not on
  --    Google OAuth where the anon user gets deleted.
  UPDATE extractor_subscriptions
  SET
    user_id = p_new_user_id,
    tier = CASE WHEN tier = 'anonymous' THEN 'free' ELSE tier END,
    credits_free = CASE WHEN tier = 'anonymous' THEN 30 ELSE credits_free END,
    max_parsers = CASE WHEN tier = 'anonymous' THEN 3 ELSE max_parsers END,
    credits_used = CASE WHEN tier = 'anonymous' THEN 0 ELSE credits_used END,
    credits_reset_at = CASE WHEN tier = 'anonymous' THEN now() + interval '30 days' ELSE credits_reset_at END,
    updated_at = now()
  WHERE user_id = p_anon_user_id;
  GET DIAGNOSTICS v_cnt = ROW_COUNT;
  v_counts := v_counts || jsonb_build_object('extractor_subscriptions', v_cnt);

  -- 5. Credit wallets
  UPDATE credit_wallets SET user_id = p_new_user_id WHERE user_id = p_anon_user_id;
  GET DIAGNOSTICS v_cnt = ROW_COUNT;
  v_counts := v_counts || jsonb_build_object('credit_wallets', v_cnt);

  -- 6. Billing events
  UPDATE billing_events SET user_id = p_new_user_id WHERE user_id = p_anon_user_id;
  GET DIAGNOSTICS v_cnt = ROW_COUNT;
  v_counts := v_counts || jsonb_build_object('billing_events', v_cnt);

  -- 7. Notification emails (may have pending jobs for this anon user)
  UPDATE notification_emails SET user_id = p_new_user_id WHERE user_id = p_anon_user_id;
  GET DIAGNOSTICS v_cnt = ROW_COUNT;
  v_counts := v_counts || jsonb_build_object('notification_emails', v_cnt);

  -- 8. Guest session: mark as converted
  UPDATE guest_sessions
  SET
    converted_to_user_id = p_new_user_id,
    converted_at = now()
  WHERE session_token = p_anon_user_id::text;
  GET DIAGNOSTICS v_cnt = ROW_COUNT;
  v_counts := v_counts || jsonb_build_object('guest_sessions', v_cnt);

  -- 9. Log the tier promotion as a billing adjustment (matches existing trigger behavior)
  IF EXISTS (
    SELECT 1 FROM extractor_subscriptions
    WHERE user_id = p_new_user_id AND tier = 'free'
  ) THEN
    INSERT INTO billing_events (user_id, event_type, pages, credits_used_after, credits_free_at_time, reason)
    VALUES (p_new_user_id, 'adjustment', 0, 0, 30, 'anonymous_to_free_oauth_migration');
  END IF;

  RETURN v_counts;
END;
$$;
