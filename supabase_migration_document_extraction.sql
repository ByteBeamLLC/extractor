-- Create document_extraction_folders table
create table public.document_extraction_folders (
  id uuid not null default gen_random_uuid(),
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  name text not null,
  parent_id uuid null,
  user_id uuid not null default auth.uid(),
  constraint document_extraction_folders_pkey primary key (id),
  constraint document_extraction_folders_parent_id_fkey foreign key (parent_id) references document_extraction_folders (id) on delete cascade,
  constraint document_extraction_folders_user_id_fkey foreign key (user_id) references auth.users (id) on delete cascade
) tablespace pg_default;

-- Create document_extraction_files table
create table public.document_extraction_files (
  id uuid not null default gen_random_uuid(),
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  name text not null,
  folder_id uuid null,
  user_id uuid not null default auth.uid(),
  file_url text not null,
  mime_type text,
  file_size bigint,
  extraction_status text not null default 'pending' check (extraction_status in ('pending', 'processing', 'completed', 'error')),
  layout_data jsonb,
  extracted_text jsonb,
  error_message text,
  constraint document_extraction_files_pkey primary key (id),
  constraint document_extraction_files_folder_id_fkey foreign key (folder_id) references document_extraction_folders (id) on delete set null,
  constraint document_extraction_files_user_id_fkey foreign key (user_id) references auth.users (id) on delete cascade
) tablespace pg_default;

-- Enable RLS
alter table public.document_extraction_folders enable row level security;
alter table public.document_extraction_files enable row level security;

-- Policies for document_extraction_folders
create policy "Users can view their own document extraction folders" on public.document_extraction_folders
  for select using (auth.uid() = user_id);

create policy "Users can insert their own document extraction folders" on public.document_extraction_folders
  for insert with check (auth.uid() = user_id);

create policy "Users can update their own document extraction folders" on public.document_extraction_folders
  for update using (auth.uid() = user_id);

create policy "Users can delete their own document extraction folders" on public.document_extraction_folders
  for delete using (auth.uid() = user_id);

-- Policies for document_extraction_files
create policy "Users can view their own document extraction files" on public.document_extraction_files
  for select using (auth.uid() = user_id);

create policy "Users can insert their own document extraction files" on public.document_extraction_files
  for insert with check (auth.uid() = user_id);

create policy "Users can update their own document extraction files" on public.document_extraction_files
  for update using (auth.uid() = user_id);

create policy "Users can delete their own document extraction files" on public.document_extraction_files
  for delete using (auth.uid() = user_id);

-- Create indexes for performance
create index if not exists document_extraction_folders_user_id_idx on public.document_extraction_folders (user_id);
create index if not exists document_extraction_folders_parent_id_idx on public.document_extraction_folders (parent_id);
create index if not exists document_extraction_files_user_id_idx on public.document_extraction_files (user_id);
create index if not exists document_extraction_files_folder_id_idx on public.document_extraction_files (folder_id);
create index if not exists document_extraction_files_extraction_status_idx on public.document_extraction_files (extraction_status);

-- Create storage bucket for document extraction files
insert into storage.buckets (id, name, public)
values ('document-extraction', 'document-extraction', true)
on conflict (id) do nothing;

-- Storage policies for document-extraction bucket
create policy "Authenticated users can upload document extraction files"
on storage.objects for insert
to authenticated
with check ( bucket_id = 'document-extraction' );

create policy "Authenticated users can view document extraction files"
on storage.objects for select
to authenticated
using ( bucket_id = 'document-extraction' );

create policy "Authenticated users can update document extraction files"
on storage.objects for update
to authenticated
using ( bucket_id = 'document-extraction' );

create policy "Authenticated users can delete document extraction files"
on storage.objects for delete
to authenticated
using ( bucket_id = 'document-extraction' );

