-- Add extraction_type column to parsers table
-- "fields" = current behavior (schema-driven extraction)
-- "full_content" = extract all content from the document (no predefined schema)
ALTER TABLE parsers
  ADD COLUMN IF NOT EXISTS extraction_type text NOT NULL DEFAULT 'fields'
  CHECK (extraction_type IN ('fields', 'full_content'));

-- Add google_docs to the allowed integration types
ALTER TABLE parser_integrations
  DROP CONSTRAINT IF EXISTS parser_integrations_type_check;

ALTER TABLE parser_integrations
  ADD CONSTRAINT parser_integrations_type_check
  CHECK (type IN ('webhook', 'google_sheets', 'google_docs', 'zapier', 'make', 'power_automate', 'email_notification', 'gmail_inbox'));
