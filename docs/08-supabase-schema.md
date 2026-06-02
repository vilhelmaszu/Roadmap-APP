# 08 — Supabase Schema

The complete DDL lives in [`supabase/schema.sql`](../supabase/schema.sql).
This doc explains it.

## Five tables

| Table | What it stores | Primary key |
|---|---|---|
| `profiles` | One row per user — name, XP, streak, freeze tokens, stats, settings | `user_id` |
| `projects` | Workspaces — one or more per user | `(user_id, id)` |
| `goals` | All goals (including side goals and sub-tasks) | `(user_id, id)` |
| `notes` | Project + global notes | `(user_id, id)` |
| `goal_sets` | User-defined goal categories | `(user_id, id)` |

Every table except `profiles` uses a **composite primary key** of
`(user_id, id)`. This is intentional — it lets the same `id` string exist
across different users without collision (e.g. every user can have a
project with id `p1`), and it makes Row-Level Security policies trivial.

## Row-Level Security (RLS)

Every table has RLS enabled with a single policy:

```sql
create policy "goals owner" on public.goals
  for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
```

`auth.uid()` is a Supabase function that returns the authenticated user's
UUID from the JWT in the request's Authorization header. The policy says:

- **`using (user_id = auth.uid())`** — you can SELECT/UPDATE/DELETE rows
  where `user_id` matches your authenticated user id
- **`with check (user_id = auth.uid())`** — you can INSERT/UPDATE to set
  `user_id` to your authenticated user id but not anyone else's

Effect: every user only sees and modifies their own rows. Two users sharing
the same browser, same Supabase project, but signed in separately, see
completely different data.

## How RLS interacts with the anon key

The anon key (in your `.env`) is **public by design**. It's bundled into the
client and shipped to every visitor. Security doesn't come from hiding it —
it comes from RLS:

- Without a signed-in user, `auth.uid()` is NULL
- The policy `user_id = auth.uid()` becomes `user_id = NULL`
- That matches no rows → unauthenticated users can read 0 rows from any table
- Anyone trying to scrape your data with just the anon key gets nothing

The anon key only grants the right to **try** the auth flow. Once you sign
in, the JWT in subsequent requests proves who you are and RLS scopes
everything to your rows.

The `service_role` key (also visible in Supabase dashboard but NEVER pasted
into the app) bypasses RLS. It's for server-side admin work only.

## Auto-updated `updated_at`

Each table has an `updated_at` timestamptz column with a trigger:

```sql
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger goals_touch before update on public.goals
  for each row execute function public.touch_updated_at();
```

Whenever a row is UPDATEd, the trigger sets `updated_at = now()`. This gives
the sync layer a clean "what's changed since timestamp X" signal if we ever
want to optimize beyond full-table reconcile.

## Per-table columns

### `profiles`
```sql
user_id            uuid primary key references auth.users(id) on delete cascade
name               text default ''
xp                 int not null default 0
streak_days        int not null default 0
best_streak        int not null default 0
last_active_date   date
freeze_tokens      int not null default 0
stats              jsonb default '{"daily":0,...}'  -- per-timeframe counters
active_project_id  text
onboarded          boolean
quest_date         date
claimed_quests     text[]
updated_at         timestamptz
```

### `projects`
```sql
id          text
user_id     uuid references auth.users(id) on delete cascade
name        text
color       text
icon        text
vision      jsonb        -- the full Vision object (title, why, points, year)
created_at  timestamptz
updated_at  timestamptz
primary key (user_id, id)
```

### `goals` (the biggest one)
```sql
id           text
user_id      uuid references auth.users(id) on delete cascade
project_id   text
title        text not null
notes        text
timeframe    text not null     -- 'daily' | 'weekly' | 'monthly' | 'yearly' | 'none'
category     text not null
set_id       text
parent_id    text
color        text
date         date
priority     text
estimate_min int
depends_on   text[]
recurrence   text              -- 'none' | 'daily' | 'weekly' | 'monthly'
reminders    jsonb             -- Reminder[]
"order"      bigint            -- quoted (SQL reserved word); bigint because
                               -- order: -Date.now() overflows int4 (2.1B max)
habit_id     text
frozen       boolean
done         boolean not null
done_at      timestamptz
missed_at    timestamptz
points       jsonb default '[]'   -- PlanPoint[]
created_at   timestamptz
updated_at   timestamptz
archived     boolean
side         boolean default false   -- side goal flag (see 04-side-goals.md)
primary key (user_id, id)
```

Two columns with histories worth noting:

- **`"order"` is bigint, not int.** The store sets `order: -Date.now()`
  (a "newest on top" hack producing 13-digit negatives). That overflows
  int4 — Postgres rejected every goal upsert with `value "-1780409525388"
  is out of range for type integer`. Bigint can hold ~9 quintillion.
  Backfill ALTER included in schema.sql.
- **`side` was added after the initial schema.** Same pattern as `secure`
  in notes — a missing column makes every upsert 400 and silently breaks
  sync. Both backfill ALTERs live at the bottom of the table block.

The `"order"` column name needs double-quoting in SQL because `order`
is a reserved word.

### `notes`
```sql
id          text
user_id     uuid references auth.users(id) on delete cascade
project_id  text                 -- null = global note
title       text not null
body        text not null default ''     -- encrypted envelope when secure=true
secure      boolean default false        -- encrypted via Web Crypto (see vault doc)
created_at  timestamptz
updated_at  timestamptz
primary key (user_id, id)
```

The `secure` column was added after the vault feature shipped. If you're
re-running schema.sql on an existing project, the additive ALTER at the
bottom of the table block handles the upgrade.

### `goal_sets`
```sql
id          text
user_id     uuid references auth.users(id) on delete cascade
name        text not null
color       text not null
icon        text not null
created_at  timestamptz
primary key (user_id, id)
```

## ON DELETE CASCADE

All foreign keys to `auth.users(id)` use `ON DELETE CASCADE`. So if you ever
delete your auth user (via Supabase dashboard), all your projects/goals/notes
delete along with it. No orphan rows.

## Indexes

The sync layer hits per-user queries constantly, so we have these covering
indexes:

```sql
create index if not exists projects_user_idx on public.projects(user_id);
create index if not exists goals_user_idx    on public.goals(user_id);
create index if not exists goals_project_idx on public.goals(user_id, project_id);
create index if not exists notes_user_idx    on public.notes(user_id);
create index if not exists sets_user_idx     on public.goal_sets(user_id);
```

At your scale these are overkill (Postgres would seq-scan a few hundred rows
fine) but they're free insurance for when the table grows.

## Idempotency

The whole schema.sql is `if not exists` / `drop policy if exists` / etc.
You can re-run it any time without errors. Adding a new column?  Just append
`alter table ... add column if not exists ...` to the script and run it
again. Safe.
