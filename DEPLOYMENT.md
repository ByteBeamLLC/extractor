Deployment to Vercel

Environment variables (set for Production and Preview):

- GOOGLE_GENERATIVE_AI_API_KEY: Google Generative AI API key.
- GOOGLE_SHEETS_WEBAPP_URL: Google Apps Script Web App endpoint for contact form.
- GOOGLE_SHEETS_SECRET: Optional secret used by your Apps Script.
- NEXT_PUBLIC_BOOKING_URL: Public scheduler URL for the Contact dialog.
- NEXT_PUBLIC_SUPABASE_URL: Supabase project URL (Project Settings → API).
- NEXT_PUBLIC_SUPABASE_ANON_KEY: Supabase anon key (public client).
- SUPABASE_SERVICE_ROLE_KEY (optional, server-only): needed only if you later add admin automation or background jobs that bypass Row Level Security.

Supabase setup:

1. Create a Supabase project and enable email auth (Settings → Auth → Providers).
2. Run the following SQL (via SQL Editor) to create the tables used by the app:

   ```sql
   create table if not exists profiles (
     id uuid primary key references auth.users on delete cascade,
     full_name text,
     avatar_url text,
     created_at timestamptz default now(),
     updated_at timestamptz default now()
   );

   create table if not exists schemas (
     id uuid primary key default gen_random_uuid(),
     user_id uuid not null references auth.users on delete cascade,
     name text not null,
     fields jsonb default '[]'::jsonb,
     template_id text,
     visual_groups jsonb,
     created_at timestamptz default now(),
     updated_at timestamptz default now()
   );

   create table if not exists extraction_jobs (
     id uuid primary key default gen_random_uuid(),
     schema_id uuid not null references schemas(id) on delete cascade,
     user_id uuid not null references auth.users on delete cascade,
     file_name text not null,
     status text not null default 'pending',
     results jsonb,
     agent_type text,
     created_at timestamptz default now(),
     completed_at timestamptz
   );
   ```

3. Enable Row-Level Security and add policies so users can only read/write their own rows:

   ```sql
   alter table schemas enable row level security;
   alter table extraction_jobs enable row level security;
   alter table profiles enable row level security;

   create policy "Schemas are user-scoped"
     on schemas for all
     using (auth.uid() = user_id)
     with check (auth.uid() = user_id);

   create policy "Jobs are user-scoped"
     on extraction_jobs for all
     using (auth.uid() = user_id)
     with check (auth.uid() = user_id);

   create policy "Profiles are user-scoped"
     on profiles for all
     using (auth.uid() = id)
     with check (auth.uid() = id);
   ```

4. Optional: configure email templates in Supabase Auth to match Bytebeam branding.

Build & framework:

- Framework preset: Next.js
- Build command: next build (default)
- Output: Automatic

Functions (vercel.json):

- api/** functions are configured to run up to 60s with 1024MB memory. Adjust as needed for your plan.

Security headers:

- next.config.mjs adds standard security headers (HSTS, X-Frame-Options, etc.).

Global error handling:

- app/error.tsx and app/not-found.tsx show friendly messages for failures and 404s.

Local development:

1. Copy .env.example to .env and fill values.
2. npm install
3. npm run dev

Notes:

- Do not commit real secrets. .env* is already ignored by .gitignore.
- Client code reads NEXT_PUBLIC_* at build time; ensure it’s set in Vercel before building.
