-- Add enriching_fields column to track waterfall enrichment progress
-- This column holds an array of field IDs currently being enriched,
-- allowing the UI to show real-time loading indicators per field.

ALTER TABLE parser_processed_documents
ADD COLUMN IF NOT EXISTS enriching_fields jsonb DEFAULT NULL;

COMMENT ON COLUMN parser_processed_documents.enriching_fields
IS 'Array of field IDs currently being enriched by waterfall transformations. NULL when no enrichment is in progress.';
