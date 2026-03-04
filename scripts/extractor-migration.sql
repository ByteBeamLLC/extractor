-- ============================================================
-- Bytebeam Extractor - Database Migration
-- Creates tables for the Parseur-like extraction SaaS
-- ============================================================

-- 1. Parsers (core entity — equivalent to Parseur "mailbox")
CREATE TABLE IF NOT EXISTS public.parsers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,

  -- Schema definition (reuses SchemaField[] format from lib/schema.ts)
  fields JSONB NOT NULL DEFAULT '[]'::jsonb,

  -- Extraction configuration
  extraction_mode TEXT NOT NULL DEFAULT 'ai' CHECK (extraction_mode IN ('ai', 'template', 'hybrid')),
  extraction_prompt_override TEXT,

  -- Inbound channels
  inbound_email TEXT UNIQUE, -- e.g. abc123@parse.extractor.domain.com (for future email forwarding)
  inbound_webhook_token TEXT UNIQUE, -- unique token for receiving docs via webhook URL

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


-- 2. Parser Integrations (webhook, Google Sheets, Zapier, Make, Power Automate)
CREATE TABLE IF NOT EXISTS public.parser_integrations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  parser_id UUID NOT NULL REFERENCES public.parsers(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  type TEXT NOT NULL CHECK (type IN ('webhook', 'google_sheets', 'zapier', 'make', 'power_automate', 'email_notification')),
  name TEXT NOT NULL,

  -- Configuration varies by type (JSONB):
  -- webhook: { url, method, headers, auth_type, auth_token, retry_count }
  -- google_sheets: { feed_url_token }
  -- zapier/make/power_automate: { webhook_url }
  -- email_notification: { email, include_results }
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


-- 3. Parser API Keys (for programmatic access via public API)
CREATE TABLE IF NOT EXISTS public.parser_api_keys (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  parser_id UUID NOT NULL REFERENCES public.parsers(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Default',

  -- Security: only store hash, show plain key once at creation
  key_hash TEXT NOT NULL, -- SHA-256 hash
  key_prefix TEXT NOT NULL, -- First 8 chars for display (e.g. "ext_abc1...")

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


-- 4. Processed Documents (transient log — 30-day TTL, not long-term storage)
CREATE TABLE IF NOT EXISTS public.parser_processed_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  parser_id UUID NOT NULL REFERENCES public.parsers(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Document metadata
  source_type TEXT NOT NULL CHECK (source_type IN ('upload', 'email', 'api', 'webhook', 'zapier')),
  file_name TEXT NOT NULL,
  mime_type TEXT,
  file_size BIGINT,
  page_count INTEGER DEFAULT 1,

  -- Processing
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'error')),
  error_message TEXT,
  results JSONB,
  confidence JSONB,

  -- Integration delivery status
  -- { "integration_id": { "status": "delivered", "delivered_at": "...", "error": null } }
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


-- 5. Extractor Subscriptions (credit/usage tracking)
CREATE TABLE IF NOT EXISTS public.extractor_subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Credit system (per-page)
  credits_free INTEGER NOT NULL DEFAULT 50, -- free pages per month
  credits_used INTEGER NOT NULL DEFAULT 0,
  credits_reset_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '30 days'),

  -- Limits
  max_parsers INTEGER NOT NULL DEFAULT 5,
  api_access BOOLEAN NOT NULL DEFAULT true,

  -- Stripe (for future billing)
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.extractor_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own subscription" ON public.extractor_subscriptions
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);


-- 6. Function to auto-create subscription on first parser creation
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
