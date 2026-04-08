-- Enable Supabase Realtime for extractor_subscriptions so the UI can receive
-- instant updates when credits are deducted, tiers change (Stripe webhook),
-- or notification preferences toggle.
--
-- REPLICA IDENTITY FULL is required so Realtime delivers UPDATE payloads with
-- the full row (including unchanged columns like credits_free) and so filter
-- predicates on non-PK columns work. This is the same pattern applied to
-- parser_processed_documents in 20260402130000.
--
-- RLS on extractor_subscriptions (auth.uid() = user_id) is already enforced
-- by Realtime, so each client only receives changes to its own row.
ALTER TABLE public.extractor_subscriptions REPLICA IDENTITY FULL;

ALTER PUBLICATION supabase_realtime ADD TABLE public.extractor_subscriptions;
