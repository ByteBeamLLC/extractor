-- Allow "anonymous" as a valid tier for guest users (5 pages/day, no signup)
ALTER TABLE public.extractor_subscriptions
  DROP CONSTRAINT IF EXISTS extractor_subscriptions_tier_check;

ALTER TABLE public.extractor_subscriptions
  ADD CONSTRAINT extractor_subscriptions_tier_check
  CHECK (tier IN ('anonymous', 'free', 'starter', 'growth', 'pro', 'business'));
