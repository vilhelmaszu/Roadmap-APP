-- Roadmap Goal App — Supabase schema (Phase A)
--
-- Run this once in the SQL editor of your Supabase project.
-- Every row carries a user_id; Row-Level Security pins each user to their own
-- data so multiple accounts can coexist safely.

-- =============================================================================
-- TABLES
-- =============================================================================

create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  name text default '',
  xp int not null default 0,
  streak_days int not null default 0,
  best_streak int not null default 0,
  last_active_date date,
  freeze_tokens int not null default 0,
  stats jsonb not null default '{"daily":0,"weekly":0,"monthly":0,"yearly":0,"missed":0}'::jsonb,
  active_project_id text,
  onboarded boolean not null default false,
  quest_date date,
  claimed_quests text[] not null default '{}',
  updated_at timestamptz not null default now()
);

create table if not exists public.projects (
  id text not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  color text not null,
  icon text not null,
  vision jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, id)
);

create table if not exists public.goals (
  id text not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  project_id text,
  title text not null,
  notes text,
  timeframe text not null,
  category text not null,
  set_id text,
  parent_id text,
  color text,
  date date,
  priority text,
  estimate_min int,
  depends_on text[],
  recurrence text,
  reminders jsonb,
  "order" int,
  habit_id text,
  frozen boolean default false,
  done boolean not null default false,
  done_at timestamptz,
  missed_at timestamptz,
  points jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived boolean default false,
  side boolean default false,
  primary key (user_id, id)
);

-- Existing installs (schema.sql was run before `side` was added) — additive backfill.
alter table public.goals add column if not exists side boolean default false;

create table if not exists public.notes (
  id text not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  project_id text,
  title text not null,
  body text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, id)
);

create table if not exists public.goal_sets (
  id text not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  color text not null,
  icon text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, id)
);

-- =============================================================================
-- INDEXES — for the common per-user lookups we'll do during sync
-- =============================================================================

create index if not exists projects_user_idx on public.projects(user_id);
create index if not exists goals_user_idx    on public.goals(user_id);
create index if not exists goals_project_idx on public.goals(user_id, project_id);
create index if not exists notes_user_idx    on public.notes(user_id);
create index if not exists sets_user_idx     on public.goal_sets(user_id);

-- =============================================================================
-- ROW-LEVEL SECURITY — each user can only see/touch their own rows
-- =============================================================================

alter table public.profiles  enable row level security;
alter table public.projects  enable row level security;
alter table public.goals     enable row level security;
alter table public.notes     enable row level security;
alter table public.goal_sets enable row level security;

-- Policy template: owner = auth.uid(). Drop+recreate keeps the script idempotent.

drop policy if exists "profiles owner" on public.profiles;
create policy "profiles owner" on public.profiles
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "projects owner" on public.projects;
create policy "projects owner" on public.projects
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "goals owner" on public.goals;
create policy "goals owner" on public.goals
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "notes owner" on public.notes;
create policy "notes owner" on public.notes
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "sets owner" on public.goal_sets;
create policy "sets owner" on public.goal_sets
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- =============================================================================
-- updated_at trigger — auto-touch on UPDATE so the sync layer can do "pull
-- changes since timestamp X" cleanly.
-- =============================================================================

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists profiles_touch on public.profiles;
create trigger profiles_touch before update on public.profiles
  for each row execute function public.touch_updated_at();

drop trigger if exists projects_touch on public.projects;
create trigger projects_touch before update on public.projects
  for each row execute function public.touch_updated_at();

drop trigger if exists goals_touch on public.goals;
create trigger goals_touch before update on public.goals
  for each row execute function public.touch_updated_at();

drop trigger if exists notes_touch on public.notes;
create trigger notes_touch before update on public.notes
  for each row execute function public.touch_updated_at();
