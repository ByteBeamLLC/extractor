-- Add columns to knowledge_documents
alter table public.knowledge_documents
add column if not exists content text,
add column if not exists storage_path text,
add column if not exists mime_type text;

-- Create storage bucket for knowledge assets
insert into storage.buckets (id, name, public)
values ('knowledge_assets', 'knowledge_assets', true)
on conflict (id) do nothing;

-- Storage policies
create policy "Authenticated users can upload knowledge assets"
on storage.objects for insert
to authenticated
with check ( bucket_id = 'knowledge_assets' );

create policy "Authenticated users can view knowledge assets"
on storage.objects for select
to authenticated
using ( bucket_id = 'knowledge_assets' );

create policy "Authenticated users can update knowledge assets"
on storage.objects for update
to authenticated
using ( bucket_id = 'knowledge_assets' );

create policy "Authenticated users can delete knowledge assets"
on storage.objects for delete
to authenticated
using ( bucket_id = 'knowledge_assets' );
