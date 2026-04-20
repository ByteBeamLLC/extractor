-- Allow 'quickbooks' as a parser_integrations.type.
-- The column is a CHECK constraint (not an enum), so we drop and re-add the
-- check including the new value. All previously-supported types are preserved.
ALTER TABLE parser_integrations
  DROP CONSTRAINT IF EXISTS parser_integrations_type_check;

ALTER TABLE parser_integrations
  ADD CONSTRAINT parser_integrations_type_check
  CHECK (type IN (
    'webhook',
    'google_sheets',
    'google_docs',
    'zapier',
    'make',
    'power_automate',
    'email_notification',
    'gmail_inbox',
    'quickbooks'
  ));
