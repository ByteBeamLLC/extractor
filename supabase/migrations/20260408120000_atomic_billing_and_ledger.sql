-- Phase 2 + Phase 5a: atomic reserve/refund billing + billing_events ledger
--
-- This migration introduces the production billing primitives:
--
-- 1. `billing_events` append-only ledger — every credit movement (reserve,
--    refund, reset) writes a row. This is the audit trail we need to detect
--    drift between extractor_subscriptions.credits_used and the sum of
--    committed reservations.
--
--    NOTE: we use `billing_events` (not `usage_events`) because `usage_events`
--    already exists in this DB as a legacy analytics event table with a
--    completely different schema.
--
-- 2. `first_doc_used_at` column on extractor_subscriptions — single source
--    of truth for whether a user has consumed their first-document-free
--    allowance. Replaces the race-prone `count(parser_processed_documents)`
--    heuristic that lived in both the gate and the worker.
--
-- 3. `refunded_at` column on parser_processed_documents — idempotency marker
--    so refund_credits is safe to call multiple times.
--
-- 4. `reserve_credits(user_id, pages, document_id, allow_first_doc_free)`
--    RPC — atomically checks eligibility, deducts credits, marks
--    first_doc_used_at if applicable, and writes a billing_events row.
--    Replaces the race-able checkCredits → deductCredits two-step.
--
-- 5. `refund_credits(user_id, document_id, pages)` RPC — idempotent refund
--    for failed extractions. Keyed by document_id so pg_net retries can't
--    double-refund.
--
-- 6. `reset_credits_if_due` RPC — fixed to respect tier-specific reset
--    intervals (1 day for anonymous, 30 days for everyone else). Removes
--    the workaround in lib/extractor/billing/credits.ts that had to bypass
--    the old RPC for anonymous users.
--
-- After this migration: billing is atomic, auditable, and safe for
-- concurrent uploads. The worker and gate both call the same RPCs; there
-- is exactly one place where credits are decided.

-- ─── 1. Billing events ledger ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.billing_events (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  document_id UUID REFERENCES public.parser_processed_documents(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL CHECK (
    event_type IN (
      'reserve',
      'reserve_first_doc_free',
      'refund',
      'reset',
      'adjustment'
    )
  ),
  pages INT NOT NULL,
  credits_used_after INT NOT NULL,
  credits_free_at_time INT NOT NULL,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_billing_events_user_created
  ON public.billing_events (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_billing_events_document
  ON public.billing_events (document_id)
  WHERE document_id IS NOT NULL;

-- RLS: users can read their own events, nothing else.
ALTER TABLE public.billing_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "billing_events_select_own" ON public.billing_events;
CREATE POLICY "billing_events_select_own"
  ON public.billing_events
  FOR SELECT
  USING (auth.uid() = user_id);

-- No insert/update/delete policy — writes happen exclusively inside
-- SECURITY DEFINER RPCs (reserve_credits, refund_credits, reset_credits_if_due).

-- ─── 2. extractor_subscriptions: first-doc flag ───────────────────────────

ALTER TABLE public.extractor_subscriptions
  ADD COLUMN IF NOT EXISTS first_doc_used_at TIMESTAMPTZ;

COMMENT ON COLUMN public.extractor_subscriptions.first_doc_used_at IS
  'Set when the user consumes their first-document-free allowance. NULL means they are still eligible. Single source of truth — replaces the race-prone count(parser_processed_documents) heuristic.';

-- ─── 3. parser_processed_documents: refund idempotency ────────────────────

ALTER TABLE public.parser_processed_documents
  ADD COLUMN IF NOT EXISTS refunded_at TIMESTAMPTZ;

COMMENT ON COLUMN public.parser_processed_documents.refunded_at IS
  'Set when credits for this document were refunded (e.g., extraction failed). Used by refund_credits() for idempotency — safe to retry.';

-- ─── 4. reserve_credits RPC ───────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.reserve_credits(
  p_user_id UUID,
  p_pages INT,
  p_document_id UUID,
  p_allow_first_doc_free BOOLEAN DEFAULT TRUE
)
RETURNS TABLE (
  reserved BOOLEAN,
  pages_charged INT,
  first_doc_free BOOLEAN,
  remaining INT,
  reason TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sub public.extractor_subscriptions;
  v_charge INT;
  v_is_first_doc BOOLEAN := FALSE;
  v_reset_interval INTERVAL;
  v_new_used INT;
BEGIN
  -- Lock the subscription row for the duration of the transaction.
  -- Any concurrent reserve/refund/reset for the same user serializes here.
  SELECT * INTO v_sub
  FROM public.extractor_subscriptions
  WHERE user_id = p_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE, 0, FALSE, 0, 'no_subscription'::TEXT;
    RETURN;
  END IF;

  -- Reset credits if the billing period has elapsed (inside the lock).
  -- Anonymous users reset daily; everyone else resets every 30 days.
  v_reset_interval := CASE
    WHEN v_sub.tier = 'anonymous' THEN INTERVAL '1 day'
    ELSE INTERVAL '30 days'
  END;

  IF v_sub.credits_reset_at <= now() THEN
    UPDATE public.extractor_subscriptions
    SET credits_used = 0,
        credits_reset_at = now() + v_reset_interval,
        updated_at = now()
    WHERE user_id = p_user_id;

    INSERT INTO public.billing_events (
      user_id, event_type, pages, credits_used_after, credits_free_at_time, reason
    ) VALUES (
      p_user_id, 'reset', 0, 0, v_sub.credits_free, 'period_elapsed'
    );

    -- Refresh the local copy so subsequent checks see the reset.
    v_sub.credits_used := 0;
    v_sub.credits_reset_at := now() + v_reset_interval;
  END IF;

  -- First-document-free eligibility.
  -- Single source of truth: extractor_subscriptions.first_doc_used_at.
  -- Max 100 pages so a malicious user can't claim a 500-page freebie.
  IF p_allow_first_doc_free
     AND v_sub.first_doc_used_at IS NULL
     AND p_pages <= 100 THEN
    v_is_first_doc := TRUE;
    v_charge := 0;
  ELSE
    v_charge := p_pages;
  END IF;

  -- Quota check.
  IF v_sub.credits_used + v_charge > v_sub.credits_free THEN
    RETURN QUERY SELECT
      FALSE,
      0,
      FALSE,
      GREATEST(v_sub.credits_free - v_sub.credits_used, 0),
      CASE
        WHEN v_sub.tier = 'anonymous' THEN 'anonymous_quota_exceeded'::TEXT
        ELSE 'quota_exceeded'::TEXT
      END;
    RETURN;
  END IF;

  v_new_used := v_sub.credits_used + v_charge;

  -- Atomic deduction + first_doc_used_at flip.
  UPDATE public.extractor_subscriptions
  SET credits_used = v_new_used,
      first_doc_used_at = CASE
        WHEN v_is_first_doc THEN now()
        ELSE first_doc_used_at
      END,
      updated_at = now()
  WHERE user_id = p_user_id;

  -- Ledger entry.
  INSERT INTO public.billing_events (
    user_id,
    document_id,
    event_type,
    pages,
    credits_used_after,
    credits_free_at_time,
    reason
  ) VALUES (
    p_user_id,
    p_document_id,
    CASE WHEN v_is_first_doc THEN 'reserve_first_doc_free' ELSE 'reserve' END,
    v_charge,
    v_new_used,
    v_sub.credits_free,
    CASE WHEN v_is_first_doc THEN 'first_document_free' ELSE 'reserved' END
  );

  RETURN QUERY SELECT
    TRUE,
    v_charge,
    v_is_first_doc,
    v_sub.credits_free - v_new_used,
    CASE WHEN v_is_first_doc THEN 'first_document_free'::TEXT ELSE 'reserved'::TEXT END;
END;
$$;

GRANT EXECUTE ON FUNCTION public.reserve_credits(UUID, INT, UUID, BOOLEAN) TO authenticated, anon, service_role;

-- ─── 5. refund_credits RPC ────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.refund_credits(
  p_user_id UUID,
  p_document_id UUID,
  p_pages INT
)
RETURNS TABLE (
  refunded BOOLEAN,
  remaining INT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_refund_rows INT;
  v_sub public.extractor_subscriptions;
BEGIN
  -- Lock the subscription row up-front so concurrent refund/reserve
  -- serialize and we always see a consistent view.
  SELECT * INTO v_sub
  FROM public.extractor_subscriptions
  WHERE user_id = p_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE, 0;
    RETURN;
  END IF;

  -- Idempotency guard: only refund if the doc hasn't already been refunded.
  UPDATE public.parser_processed_documents
  SET refunded_at = now()
  WHERE id = p_document_id
    AND refunded_at IS NULL;

  GET DIAGNOSTICS v_refund_rows = ROW_COUNT;

  IF v_refund_rows = 0 THEN
    -- Already refunded, or doc doesn't exist. No-op.
    RETURN QUERY SELECT FALSE, v_sub.credits_free - v_sub.credits_used;
    RETURN;
  END IF;

  -- Zero-page reservations (first-doc-free) still mark the doc as refunded
  -- but don't change credits_used. We log a zero-page refund for auditing.
  IF p_pages <= 0 THEN
    INSERT INTO public.billing_events (
      user_id, document_id, event_type, pages,
      credits_used_after, credits_free_at_time, reason
    ) VALUES (
      p_user_id, p_document_id, 'refund', 0,
      v_sub.credits_used, v_sub.credits_free, 'refund_zero_pages'
    );

    RETURN QUERY SELECT TRUE, v_sub.credits_free - v_sub.credits_used;
    RETURN;
  END IF;

  -- Decrement credits_used, clamped at zero so a wrong refund amount
  -- never produces a negative balance.
  UPDATE public.extractor_subscriptions
  SET credits_used = GREATEST(0, credits_used - p_pages),
      updated_at = now()
  WHERE user_id = p_user_id
  RETURNING * INTO v_sub;

  INSERT INTO public.billing_events (
    user_id, document_id, event_type, pages,
    credits_used_after, credits_free_at_time, reason
  ) VALUES (
    p_user_id, p_document_id, 'refund', p_pages,
    v_sub.credits_used, v_sub.credits_free, 'extraction_failed'
  );

  RETURN QUERY SELECT TRUE, v_sub.credits_free - v_sub.credits_used;
END;
$$;

GRANT EXECUTE ON FUNCTION public.refund_credits(UUID, UUID, INT) TO authenticated, anon, service_role;

-- ─── 6. Fixed reset_credits_if_due (tier-aware) ───────────────────────────

CREATE OR REPLACE FUNCTION public.reset_credits_if_due(
  p_user_id UUID
)
RETURNS TABLE (
  was_reset BOOLEAN,
  credits_free INT,
  credits_used INT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sub public.extractor_subscriptions;
  v_interval INTERVAL;
BEGIN
  SELECT * INTO v_sub
  FROM public.extractor_subscriptions es
  WHERE es.user_id = p_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE, 0, 0;
    RETURN;
  END IF;

  v_interval := CASE
    WHEN v_sub.tier = 'anonymous' THEN INTERVAL '1 day'
    ELSE INTERVAL '30 days'
  END;

  IF v_sub.credits_reset_at <= now() THEN
    UPDATE public.extractor_subscriptions
    SET credits_used = 0,
        credits_reset_at = now() + v_interval,
        updated_at = now()
    WHERE user_id = p_user_id;

    INSERT INTO public.billing_events (
      user_id, event_type, pages, credits_used_after, credits_free_at_time, reason
    ) VALUES (
      p_user_id, 'reset', 0, 0, v_sub.credits_free, 'period_elapsed'
    );

    RETURN QUERY SELECT TRUE, v_sub.credits_free, 0;
  ELSE
    RETURN QUERY SELECT FALSE, v_sub.credits_free, v_sub.credits_used;
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.reset_credits_if_due(UUID) TO authenticated, anon, service_role;

-- ─── 7. Backfill first_doc_used_at ────────────────────────────────────────

-- Any user who already has at least one processed document has already
-- consumed their first-doc-free allowance. Set first_doc_used_at to the
-- earliest such document's creation time so they can't re-claim the
-- freebie after this migration runs.
UPDATE public.extractor_subscriptions es
SET first_doc_used_at = sub.first_doc_at
FROM (
  SELECT user_id, MIN(created_at) AS first_doc_at
  FROM public.parser_processed_documents
  WHERE status IN ('completed', 'error', 'processing')
  GROUP BY user_id
) AS sub
WHERE es.user_id = sub.user_id
  AND es.first_doc_used_at IS NULL;
