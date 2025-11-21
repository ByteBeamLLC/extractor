-- Create knowledge_bases table (folders)
create table public.knowledge_bases (
  id uuid not null default gen_random_uuid (),
  created_at timestamp with time zone not null default now(),
  name text not null,
  parent_id uuid null,
  user_id uuid not null default auth.uid (),
  constraint knowledge_bases_pkey primary key (id),
  constraint knowledge_bases_parent_id_fkey foreign key (parent_id) references knowledge_bases (id) on delete cascade
) tablespace pg_default;

-- Create knowledge_documents table (files/links)
create table public.knowledge_documents (
  id uuid not null default gen_random_uuid (),
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  name text not null,
  type text not null check (type in ('file', 'link')),
  status text not null default 'pending' check (status in ('indexed', 'processing', 'error', 'pending')),
  ai_status text not null default 'analyzing' check (ai_status in ('grounded', 'analyzing', 'ready')),
  size text null,
  url text null, -- For links or file storage path
  knowledge_base_id uuid null, -- Optional folder association
  user_id uuid not null default auth.uid (),
  constraint knowledge_documents_pkey primary key (id),
  constraint knowledge_documents_knowledge_base_id_fkey foreign key (knowledge_base_id) references knowledge_bases (id) on delete set null
) tablespace pg_default;

-- Enable RLS
alter table public.knowledge_bases enable row level security;
alter table public.knowledge_documents enable row level security;

-- Policies for knowledge_bases
create policy "Users can view their own knowledge bases" on public.knowledge_bases
  for select using (auth.uid() = user_id);

create policy "Users can insert their own knowledge bases" on public.knowledge_bases
  for insert with check (auth.uid() = user_id);

create policy "Users can update their own knowledge bases" on public.knowledge_bases
  for update using (auth.uid() = user_id);

create policy "Users can delete their own knowledge bases" on public.knowledge_bases
  for delete using (auth.uid() = user_id);

-- Policies for knowledge_documents
create policy "Users can view their own knowledge documents" on public.knowledge_documents
  for select using (auth.uid() = user_id);

create policy "Users can insert their own knowledge documents" on public.knowledge_documents
  for insert with check (auth.uid() = user_id);

create policy "Users can update their own knowledge documents" on public.knowledge_documents
  for update using (auth.uid() = user_id);

create policy "Users can delete their own knowledge documents" on public.knowledge_documents
  for delete using (auth.uid() = user_id);
