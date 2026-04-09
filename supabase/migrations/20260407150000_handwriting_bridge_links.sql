-- Link rows in handwriting_uploads to the parser + processed_document they were
-- converted into via the handwriting → chat bridge. Used for funnel analysis
-- (which uploads turned into bridge sessions, which sessions converted to signup)
-- and to power "show the original image" in the in-app document preview.
--
-- Both columns are nullable: most handwriting uploads never go through the bridge.

alter table public.handwriting_uploads
  add column linked_parser_id uuid references public.parsers(id) on delete set null,
  add column linked_document_id uuid references public.parser_processed_documents(id) on delete set null;

create index if not exists handwriting_uploads_linked_document_id_idx
  on public.handwriting_uploads (linked_document_id)
  where linked_document_id is not null;
