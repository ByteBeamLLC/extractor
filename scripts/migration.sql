-- ============================================================
-- Parsli - Database Migration
-- Run this in your Supabase SQL Editor to set up all tables
-- ============================================================

-- 1. Parsers (core entity)
CREATE TABLE IF NOT EXISTS public.parsers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,

  -- Schema definition (SchemaField[] JSON)
  fields JSONB NOT NULL DEFAULT '[]'::jsonb,

  -- Extraction configuration
  extraction_mode TEXT NOT NULL DEFAULT 'ai' CHECK (extraction_mode IN ('ai', 'template', 'hybrid')),
  extraction_prompt_override TEXT,

  -- Inbound channels
  inbound_email TEXT UNIQUE,
  inbound_webhook_token TEXT UNIQUE,

  -- Status & stats
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'archived')),
  document_count INTEGER NOT NULL DEFAULT 0,
  last_processed_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.parsers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own parsers" ON public.parsers
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_parsers_user_id ON public.parsers(user_id);
CREATE INDEX IF NOT EXISTS idx_parsers_inbound_email ON public.parsers(inbound_email);
CREATE INDEX IF NOT EXISTS idx_parsers_inbound_webhook ON public.parsers(inbound_webhook_token);


-- 2. Parser Integrations
CREATE TABLE IF NOT EXISTS public.parser_integrations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  parser_id UUID NOT NULL REFERENCES public.parsers(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  type TEXT NOT NULL CHECK (type IN ('webhook', 'google_sheets', 'zapier', 'make', 'power_automate', 'email_notification', 'gmail_inbox')),
  name TEXT NOT NULL,

  config JSONB NOT NULL DEFAULT '{}'::jsonb,

  is_active BOOLEAN NOT NULL DEFAULT true,
  last_triggered_at TIMESTAMPTZ,
  last_error TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.parser_integrations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own integrations" ON public.parser_integrations
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_parser_integrations_parser_id ON public.parser_integrations(parser_id);


-- 3. Parser API Keys
CREATE TABLE IF NOT EXISTS public.parser_api_keys (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  parser_id UUID NOT NULL REFERENCES public.parsers(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Default',

  key_hash TEXT NOT NULL,
  key_prefix TEXT NOT NULL,

  permissions TEXT[] NOT NULL DEFAULT ARRAY['extract'],
  rate_limit_per_minute INTEGER DEFAULT 60,

  last_used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.parser_api_keys ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own API keys" ON public.parser_api_keys
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_parser_api_keys_key_hash ON public.parser_api_keys(key_hash);
CREATE INDEX IF NOT EXISTS idx_parser_api_keys_parser_id ON public.parser_api_keys(parser_id);


-- 4. Processed Documents (30-day TTL)
CREATE TABLE IF NOT EXISTS public.parser_processed_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  parser_id UUID NOT NULL REFERENCES public.parsers(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  source_type TEXT NOT NULL CHECK (source_type IN ('upload', 'email', 'api', 'webhook', 'zapier', 'gmail')),
  file_name TEXT NOT NULL,
  mime_type TEXT,
  file_size BIGINT,
  page_count INTEGER DEFAULT 1,

  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'error')),
  error_message TEXT,
  results JSONB,
  confidence JSONB,

  integration_status JSONB DEFAULT '{}'::jsonb,

  credits_used INTEGER NOT NULL DEFAULT 0,

  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days')
);

ALTER TABLE public.parser_processed_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own processed docs" ON public.parser_processed_documents
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_ppd_parser_id ON public.parser_processed_documents(parser_id);
CREATE INDEX IF NOT EXISTS idx_ppd_status ON public.parser_processed_documents(status);
CREATE INDEX IF NOT EXISTS idx_ppd_created_at ON public.parser_processed_documents(created_at);


-- 5. Subscriptions (credit/usage tracking)
CREATE TABLE IF NOT EXISTS public.extractor_subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,

  credits_free INTEGER NOT NULL DEFAULT 50,
  credits_used INTEGER NOT NULL DEFAULT 0,
  credits_reset_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '30 days'),

  max_parsers INTEGER NOT NULL DEFAULT 5,
  api_access BOOLEAN NOT NULL DEFAULT true,

  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.extractor_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own subscription" ON public.extractor_subscriptions
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);


-- 6. Gmail Processed Messages (deduplication for Gmail polling)
CREATE TABLE IF NOT EXISTS public.gmail_processed_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  integration_id UUID NOT NULL REFERENCES public.parser_integrations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  gmail_message_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(integration_id, gmail_message_id)
);

ALTER TABLE public.gmail_processed_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own gmail messages" ON public.gmail_processed_messages
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_gmail_messages_integration ON public.gmail_processed_messages(integration_id);
CREATE INDEX IF NOT EXISTS idx_gmail_messages_message_id ON public.gmail_processed_messages(gmail_message_id);


-- 7. Auto-create subscription on first parser creation
CREATE OR REPLACE FUNCTION public.ensure_extractor_subscription()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.extractor_subscriptions (user_id)
  VALUES (NEW.user_id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_ensure_extractor_subscription
  AFTER INSERT ON public.parsers
  FOR EACH ROW
  EXECUTE FUNCTION public.ensure_extractor_subscription();
