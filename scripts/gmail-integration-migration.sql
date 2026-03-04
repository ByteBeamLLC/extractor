-- Gmail Integration Migration
-- Run this in Supabase SQL Editor

-- 1. Update the type CHECK constraint on parser_integrations to include gmail_inbox
ALTER TABLE public.parser_integrations
  DROP CONSTRAINT IF EXISTS parser_integrations_type_check;

ALTER TABLE public.parser_integrations
  ADD CONSTRAINT parser_integrations_type_check
  CHECK (type IN (
    'webhook', 'google_sheets', 'zapier', 'make', 'power_automate',
    'email_notification', 'gmail_inbox'
  ));

-- 2. Update source_type CHECK on parser_processed_documents to include gmail
ALTER TABLE public.parser_processed_documents
  DROP CONSTRAINT IF EXISTS parser_processed_documents_source_type_check;

ALTER TABLE public.parser_processed_documents
  ADD CONSTRAINT parser_processed_documents_source_type_check
  CHECK (source_type IN ('upload', 'email', 'api', 'webhook', 'zapier', 'gmail'));

-- 3. Create gmail_processed_messages table for idempotency tracking
CREATE TABLE IF NOT EXISTS public.gmail_processed_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  integration_id UUID NOT NULL REFERENCES public.parser_integrations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  gmail_message_id TEXT NOT NULL,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(integration_id, gmail_message_id)
);

ALTER TABLE public.gmail_processed_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own gmail messages"
  ON public.gmail_processed_messages
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_gmail_processed_integration
  ON public.gmail_processed_messages(integration_id);
