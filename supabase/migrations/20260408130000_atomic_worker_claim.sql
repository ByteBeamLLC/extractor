-- Phase 3: atomic worker claim for parser_processed_documents
--
-- Prior to this migration, the worker loaded the doc with a plain SELECT
-- filtered by `status = 'processing'`. Nothing prevented two invocations
-- (e.g. a pg_net retry, or a manual trigger replay) from both succeeding
-- past the SELECT and running extraction twice — costing us Gemini spend
-- and potentially double-charging the user.
--
-- The fix is to claim atomically: replace the SELECT with an UPDATE that
-- sets `claimed_at` and `claimed_by` only when the row is still
-- `processing` AND not yet claimed, and returns the row only if that
-- update matched. A second invocation sees 0 rows and skips cleanly.
--
-- Columns:
--   claimed_at   — timestamp of the first successful claim
--   claimed_by   — UUID of the worker invocation (for debugging)
--
-- Indexed partial so the stuck-doc cleanup cron (Phase 5b) can efficiently
-- find rows that have been claimed but never completed.

ALTER TABLE public.parser_processed_documents
  ADD COLUMN IF NOT EXISTS claimed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS claimed_by TEXT;

COMMENT ON COLUMN public.parser_processed_documents.claimed_at IS
  'Timestamp when a worker claimed this row for processing. Set atomically by the worker via UPDATE … WHERE claimed_at IS NULL. Prevents double-extraction from pg_net retries.';

COMMENT ON COLUMN public.parser_processed_documents.claimed_by IS
  'UUID of the worker invocation that claimed this row. Used for debugging stuck extractions.';

-- Partial index: rows that were claimed but not yet marked complete/error.
-- Used by the stuck-doc cleanup cron to quickly find zombies.
CREATE INDEX IF NOT EXISTS idx_processed_docs_stuck
  ON public.parser_processed_documents (claimed_at)
  WHERE status = 'processing' AND claimed_at IS NOT NULL;
