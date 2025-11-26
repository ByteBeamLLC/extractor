
-- Enable UUID extension if not enabled
create extension if not exists "uuid-ossp";

-- Chats table
create table if not exists copilot_chats (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  title text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Messages table
create table if not exists copilot_messages (
  id uuid default gen_random_uuid() primary key,
  chat_id uuid references copilot_chats on delete cascade not null,
  role text not null check (role in ('user', 'assistant')),
  content text,
  tool_calls jsonb,
  tool_results jsonb,
  created_at timestamptz default now()
);

-- RLS Policies (Optional but recommended)
alter table copilot_chats enable row level security;
alter table copilot_messages enable row level security;

create policy "Users can view their own chats"
  on copilot_chats for select
  using (auth.uid() = user_id);

create policy "Users can insert their own chats"
  on copilot_chats for insert
  with check (auth.uid() = user_id);

create policy "Users can view messages of their chats"
  on copilot_messages for select
  using (
    exists (
      select 1 from copilot_chats
      where copilot_chats.id = copilot_messages.chat_id
      and copilot_chats.user_id = auth.uid()
    )
  );

create policy "Users can insert messages to their chats"
  on copilot_messages for insert
  with check (
    exists (
      select 1 from copilot_chats
      where copilot_chats.id = copilot_messages.chat_id
      and copilot_chats.user_id = auth.uid()
    )
  );
