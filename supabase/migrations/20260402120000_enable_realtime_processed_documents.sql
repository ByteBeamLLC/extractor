-- Enable Supabase Realtime on parser_processed_documents
-- so the UI can receive instant status updates when extraction completes
ALTER PUBLICATION supabase_realtime ADD TABLE parser_processed_documents;
