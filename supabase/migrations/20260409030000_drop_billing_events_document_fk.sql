-- Drop the FK from billing_events.document_id → parser_processed_documents.id
--
-- Root cause of navcourse@gmail.com's "temporary error" bug: the extract
-- route generates a docId, calls reserve_credits (which inserts into
-- billing_events with that docId), but the parser_processed_documents row
-- doesn't exist yet — it gets inserted AFTER reserve_credits succeeds.
-- The FK rejects the billing_events INSERT, the RPC throws, the user
-- gets a 402 "temporary error", and the extraction never runs.
--
-- Every extraction since Phase 2 deployed has been hitting this.
--
-- Fix: drop the FK. The billing_events table is an append-only audit
-- ledger. Its document_id column is for traceability, not enforcement.
-- The reconciliation cron handles integrity detection. The user_id FK
-- stays (user rows always exist before any billing operation).
--
-- The column and its partial index (idx_billing_events_document) are
-- preserved — only the constraint is removed.

ALTER TABLE public.billing_events
  DROP CONSTRAINT billing_events_document_id_fkey;
