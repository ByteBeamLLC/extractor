-- Enable pg_net for async HTTP requests from PostgreSQL
-- pg_net allows triggers to fire background HTTP calls without blocking the transaction.
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Trigger function: fires an async HTTP POST to the extraction worker
-- when a new document is inserted with status = 'processing'.
--
-- The worker URL and secret are stored in Supabase Vault.
-- To configure (run once in SQL editor, NOT in a migration):
--
--   SELECT vault.create_secret('https://app.parsli.co/api/internal/process-document', 'extraction_worker_url');
--   SELECT vault.create_secret('<your-secret>', 'extraction_worker_secret');
--
CREATE OR REPLACE FUNCTION public.trigger_extraction_worker()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, net, vault
AS $$
DECLARE
  worker_url text;
  worker_secret text;
BEGIN
  -- Read configuration from vault
  SELECT decrypted_secret INTO worker_url
    FROM vault.decrypted_secrets WHERE name = 'extraction_worker_url';

  SELECT decrypted_secret INTO worker_secret
    FROM vault.decrypted_secrets WHERE name = 'extraction_worker_secret';

  IF worker_url IS NULL OR worker_secret IS NULL THEN
    RAISE WARNING '[extraction-trigger] Worker URL or secret not configured in vault — skipping';
    RETURN NEW;
  END IF;

  -- Fire async HTTP POST (returns immediately, does not block the INSERT)
  PERFORM net.http_post(
    url     := worker_url,
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer ' || worker_secret
    ),
    body    := jsonb_build_object(
      'document_id', NEW.id::text
    )
  );

  RETURN NEW;
END;
$$;

-- Trigger: fires AFTER INSERT when a document enters "processing" status.
-- Uses WHEN clause so the function is only invoked for relevant rows.
CREATE TRIGGER on_document_needs_extraction
  AFTER INSERT ON public.parser_processed_documents
  FOR EACH ROW
  WHEN (NEW.status = 'processing')
  EXECUTE FUNCTION public.trigger_extraction_worker();
