-- Supabase Realtime requires REPLICA IDENTITY FULL for UPDATE/DELETE filters to work.
-- Without this, the filter `parser_id=eq.X` only matches INSERT events.
ALTER TABLE parser_processed_documents REPLICA IDENTITY FULL;
