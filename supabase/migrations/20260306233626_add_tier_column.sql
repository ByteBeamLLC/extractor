-- Add tier column to extractor_subscriptions
-- Run this in your Supabase SQL Editor

ALTER TABLE public.extractor_subscriptions
  ADD COLUMN IF NOT EXISTS tier TEXT NOT NULL DEFAULT 'free'
  CHECK (tier IN ('free', 'starter', 'growth', 'pro', 'business'));

-- Update defaults for free tier (30 pages, 3 parsers)
ALTER TABLE public.extractor_subscriptions
  ALTER COLUMN credits_free SET DEFAULT 30;

ALTER TABLE public.extractor_subscriptions
  ALTER COLUMN max_parsers SET DEFAULT 3;

-- Update the auto-create trigger to use new defaults
CREATE OR REPLACE FUNCTION public.ensure_extractor_subscription()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.extractor_subscriptions (user_id, tier, credits_free, max_parsers)
  VALUES (NEW.user_id, 'free', 30, 3)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
