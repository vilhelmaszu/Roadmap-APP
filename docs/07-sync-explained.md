# 07 — Sync Explained (the big one)

How a change made on your phone shows up on your PC, end to end. This is the
doc to read if you want to understand the cloud sync system you built.

All the code being described lives in
[`src/services/sync.ts`](../src/services/sync.ts).

## Mental model

Three layers, three different concerns:

```
┌──────────────────────────────────────────────────────────┐
│  UI (React components)                                   │
│  reads state via useStore(...) and useActive* hooks      │
└──────────────────────────────────────────────────────────┘
                          ▲
                          │  (re-renders on change)
                          ▼
┌──────────────────────────────────────────────────────────┐
│  Zustand store (src/store/store.ts)                      │
│  in-memory live state, source of truth for the UI         │
└──────────────────────────────────────────────────────────┘
                ▲                       │
                │   (rehydrate on load) │   (persist on change)
                │                       ▼
        ┌───────────────────────────────────────────┐
        │  AsyncStorage / localStorage              │
        │  key: 'roadmap.store.v2'                  │
        │  survives reloads, per-device             │
        └───────────────────────────────────────────┘
                ▲                       │
                │  (pull on sign-in)    │   (push on change, debounced)
                │                       ▼
┌──────────────────────────────────────────────────────────┐
│  Supabase Postgres (cloud, per-user via RLS)             │
│  the SHARED source of truth across devices               │
└──────────────────────────────────────────────────────────┘
                ▲                       │
                │  (initiated via OAuth)│   (push from any device → realtime broadcast)
                │                       ▼
                Realtime channel — websocket, pushes "row changed"
                events to every other device subscribed for this user
```

The Zustand store is what the UI reads. AsyncStorage is the durable
single-device backup. Supabase is the durable cross-device backup AND the
broadcast channel.

## The state that drives sync

Three persisted fields on the Zustand state (`src/store/store.ts`) carry the
information the sync layer needs to do its job correctly:

```ts
type State = {
  // ... the usual data ...
  lastSyncAt: number;                          // ms timestamp of last successful pull
  tombstones: {
    goals: string[];
    notes: string[];
    projects: string[];
    sets: string[];
  };
};
```

- **`lastSyncAt`** — set to `Date.now()` after every successful pull. Used by
  the merge to decide whether a local-only row is "pending push" (created
  after the last pull) or "cloud-deleted" (existed at last pull, gone now).
  `0` means "never synced on this device" → falls back to preserve-all
  semantics so a brand-new install doesn't lose its seed data.
- **`tombstones`** — per-table list of row IDs that the user deleted locally.
  Persisted so a delete survives a tab close before the push had time to
  fire. Cleared after a successful `pushAll` (the deletes have now reached
  cloud).

## The five lifecycle events

Sync is event-driven. Five moments matter:

### Event 1: App loads (signed in already)

1. `_layout.tsx` `useEffect` calls `attachAuthListener()` once at boot
2. `attachAuthListener` first runs `sb.auth.getUser()` — Supabase reads the
   token from AsyncStorage; if valid, returns the user
3. If user is non-null → `startSync(userId)` fires
4. `startSync` does this in order:
   - `pullAll(userId)` — fetches all 5 tables for this user from Supabase
     and merges with local using `mergePull`
   - `pushAll()` — uploads the merged state back to cloud so cross-device
     gaps fill in (e.g. cloud was missing data because a prior push failed)
   - `startRealtime(userId)` — subscribes to a websocket per table
   - `startStoreWatcher()` — subscribes to Zustand changes so future edits
     trigger pushes
   - `attachVisibilityRefresh()` — wires a `visibilitychange` + `focus`
     listener that re-pulls when the tab comes back into focus (essential
     for mobile Chrome where backgrounded tabs lose their websocket)

### Event 2: User clicks "Sign in with Google" (was signed out)

Same as Event 1 — `onAuthStateChange` fires with the new session, our auth
listener calls `startSync(userId)`, the lifecycle above runs.

### Event 3: User edits something locally

1. UI calls a Zustand action like `toggleGoalDone(id)` or `addNote('project', 'Title')`
2. Zustand updates its state
3. `useStore.subscribe` fires our `startStoreWatcher` callback with the new state
4. Watcher computes a JSON snapshot, compares to previous snapshot
5. If different → `schedulePush()` queues a `pushAll()` 600ms later
6. If the user makes another change within 600ms, the timer resets — so
   rapid typing in a note doesn't fire 50 requests
7. After 600ms idle, `pushAll()` fires — full reconcile per table:
   - Upsert all current local rows into Supabase (creates or updates them)
   - Delete any Supabase rows whose ids aren't in local (so deletes propagate)
   - Clear `tombstones` (the rows we tombstoned are gone from cloud now too)
8. Supabase Postgres processes the upserts and deletes
9. Supabase's Realtime engine emits row-change events on the channel for this user
10. Every other connected device subscribed to this user's channel receives
    the change → calls `pullAll()` → updates local store → UI re-renders

### Event 4: User signs out

1. `signOut()` → `supabase.auth.signOut()`
2. `onAuthStateChange('SIGNED_OUT', null)` fires
3. Auth listener calls `stopSync()`
4. `stopSync`:
   - Unsubscribes the store watcher FIRST (so the reset below doesn't push)
   - Unsubscribes all realtime channels
   - Clears the debounce timer
   - Calls `useStore.getState().resetAll()` — wipes local state to initial
5. UI re-renders with empty data; chip flips to "Sign in with Google"

### Event 5: User taps "Sync now" in Settings → Account

1. `forceSync()` runs (exported from `sync.ts`)
2. Clears any pending debounce timer
3. Calls `pushAll()` immediately — uploads any local changes that hadn't pushed yet
4. Then calls `pullAll(currentUserId)` — gets the freshest cloud state
5. The button (`SyncButton` in `settings.tsx`) subscribes to `onSyncStatus`
   and shows "Syncing…" while running, "Retry sync" on error

This is the escape hatch when something feels off — stale data, suspected
missed realtime event, deletes that didn't propagate within a few seconds.

## The merge — `mergePull(cloud, local, lastSyncAt, tombstones)`

The heart of sync correctness. Lives in `src/services/sync.ts`. Each pull
runs it per table. Three steps:

```ts
function mergePull<T extends { id: string; createdAt: number }>(
  cloud: T[],
  local: T[],
  lastSyncAt: number,
  tombstones: string[],
): T[] {
  // 1. Drop cloud rows whose IDs are tombstoned — we deleted them locally,
  //    cloud just hasn't caught up yet. Without this, the next pull would
  //    resurrect a deleted row that the (not-yet-flushed) push would
  //    otherwise have removed.
  const ts = new Set(tombstones);
  const cloudFiltered = cloud.filter((x) => !ts.has(x.id));

  // 2. First-ever sync (lastSyncAt = 0) → preserve all local rows. Avoids
  //    wiping a fresh install's seed on its first cloud query.
  if (cloudFiltered.length === 0 && lastSyncAt === 0) return local;

  // 3. For each local row not in the (filtered) cloud:
  //      createdAt > lastSyncAt → added locally since our last pull → pending push, KEEP
  //      createdAt ≤ lastSyncAt → existed at last pull, gone now → cloud deleted it, DROP
  //    First-ever pull (lastSyncAt = 0) → keep everything.
  const cloudIds = new Set(cloudFiltered.map((x) => x.id));
  const localOnly = local.filter((x) => !cloudIds.has(x.id));
  const pendingPush = lastSyncAt === 0
    ? localOnly
    : localOnly.filter((x) => x.createdAt > lastSyncAt);

  return [...cloudFiltered, ...pendingPush];
}
```

The three rules together give us:
- **Cross-device propagation** — cloud rows always come through
- **Pending-push survival** — a row you added but reloaded before push fired
  doesn't get wiped on the next pull
- **Cross-device deletes** — a row another device deleted gets cleaned up
  locally on the next pull
- **Locally-staged deletes** — a delete you made but couldn't push (offline,
  tab closed) survives reload via tombstones, and the next push reconciles
  cloud

## A concrete walkthrough: edit on phone → see on PC

You add a side goal "Post on IG today" on your phone, then walk to your PC.
Here's what happens, step by tiny step:

```
PHONE (Chrome PWA)                  CLOUD (Supabase)              PC (Chrome browser, signed in, idle)
─────────────────────────────────   ──────────────────            ─────────────────────────────────────

1. You type "Post on IG today"
   and tap Add

2. UI calls addGoal({
     title: "Post on IG today",
     side: true,
     timeframe: 'daily',
     date: '2026-06-02',
   })

3. Zustand state updates:
   state.goals now has 1 more entry

4. Zustand subscribe fires our
   store watcher; snapshot diff
   detects change

5. schedulePush() queues pushAll()
   for +600ms

6. After 600ms idle, pushAll() runs:
   POST /rest/v1/goals (upsert all)
   DELETE /rest/v1/goals?id=not.in.(...)
                                        ─────────────►
                                        Supabase Postgres
                                        INSERT INTO goals (...);
                                        Postgres trigger touches updated_at.

                                        Supabase Realtime
                                        broadcasts the row-change
                                                                  ─────────────►
                                                                  Realtime channel `sync:goals`
                                                                  filter: user_id=eq.abc-123 fires.
                                                                  Handler calls pullAll(userId).

                                                                  pullAll fetches every goal for user;
                                                                  finds the new row + 127 others.

                                                                  mergePull(
                                                                    cloud=[128 goals incl. new],
                                                                    local=[127 prior goals],
                                                                    lastSyncAt=T_last,
                                                                    tombstones=[]
                                                                  ) → [128 goals]

                                                                  useStore.setState({ goals, lastSyncAt: pullStartedAt })

                                                                  React re-renders; Dashboard's
                                                                  SIDE GOALS list shows the new entry.
```

End-to-end time on a healthy connection: ~1–3 seconds.

## A concrete walkthrough: delete on phone with no connection

This is the tombstone scenario that broke before — and now works:

```
PHONE                               CLOUD                         PC
─────────────────────────────────   ──────────────────            ─────────────────────────────────────

1. You tap trash on goal G.
   deleteGoal(G_id) action runs.
   state.goals filter removes G.
   tombstones.goals: ['G_id']

2. schedulePush queues 600ms timer.

3. You close the PWA tab IMMEDIATELY
   (within 600ms). Timer canceled.
   Push never fires.
                                        Cloud still has G.

4. You re-open the PWA later.
   persist hydrates state:
     goals: [...without G],
     tombstones.goals: ['G_id'],
     lastSyncAt: T_prior_pull.

5. startSync runs:
   pullAll → cloud still has G.
   mergePull filters G out via tombstone.
   merged.goals = [...without G].
   state.goals stays clean.

6. pushAll fires:
   upsert all current local goals
   delete-not-in removes G from cloud.
   tombstones cleared.
                                        Cloud now without G.
                                        Realtime broadcasts.
                                                                  ─────────────►
                                                                  PC's realtime fires pullAll.
                                                                  PC's local goals minus G now
                                                                  (createdAt < lastSyncAt, not in cloud → drop).
```

## Why the visibility refresh matters

Mobile browsers (especially Chrome's PWA standalone) pause backgrounded
tabs aggressively. The realtime websocket disconnects within seconds of
the tab leaving the foreground. When the user comes back, no event arrives
to tell our code "you missed changes."

`attachVisibilityRefresh()` listens for `document.visibilitychange` (state
→ 'visible') and `window.focus`, and calls `pullAll(currentUserId)` on
either. Result: switching to the Roadmap tab triggers a fresh pull within
a second of focus.

## Why full-table reconcile and not row-by-row diffs

Each push uploads the **entire current local table**, not just the changed
rows. The schema's primary key is `(user_id, id)`, and Supabase upsert
behavior is "insert or replace by primary key". So:

- Adding a row → upsert inserts it
- Editing a row → upsert overwrites it (matches by id)
- Deleting a row → it's no longer in the upsert list → the trailing
  `DELETE WHERE id NOT IN (...)` removes it from cloud

This is simpler than tracking dirty rows and works fine at this scale
(hundreds of rows, kilobyte payloads). When you have 10k+ rows it would
get expensive, but you're nowhere near that.

Each push fires roughly 10 HTTP requests (2 per table for upsert + delete).
The 600ms debounce batches rapid edits so typing in a note doesn't spam.

## Realtime details

Each table gets its own `supabase.channel('sync:<table>')` subscription
with a postgres_changes filter for the current user:

```ts
sb.channel(`sync:${table}`).on(
  'postgres_changes',
  { event: '*', schema: 'public', table, filter: `user_id=eq.${uid}` },
  () => { void pullAll(uid); }   // any change → re-pull all data
).subscribe();
```

When the row change fires, we re-pull everything (cheap at our scale) rather
than try to apply a delta. Result: every device stays in sync ~2-3 seconds
after any change anywhere.

The `pulling = true` flag prevents a self-feedback loop — if we're applying
a pulled change, the resulting state change shouldn't fire a push.

## Conflict resolution

Two devices edit the same row at roughly the same time. What happens?

- Both upsert with their own `updated_at` timestamp (auto-set by Postgres trigger)
- Whichever upsert hits Postgres last wins (last write wins)
- Realtime broadcasts the winner to everyone
- Both devices end up agreeing on the winner

This is fine for solo use. If two people were editing the same goal at the
same time on different devices, the loser would silently lose their edit.
Not a problem in your situation.

## What's NOT synced

- Theme + design preference — local to each device on purpose (you might
  want dark on phone, light on PC)
- Language preference (`roadmap.lang`) — also local
- Vault passphrase — by design, only ever in memory of the current tab
- Notifications scheduling state — device-specific, can't be synced

## What could go wrong, and how you'd know

Every Supabase call now goes through a `check()` wrapper:

```ts
async function check(label, p) {
  const { error } = await p;
  if (error) console.error(`[sync] ${label} failed:`, error.message);
}
```

So if anything breaks (missing column, RLS reject, network error, integer
overflow), you see a red line in DevTools console starting with `[sync]`.

Two real failures we hit + fixed during initial setup:
- `value "-1780409525388" is out of range for type integer` →
  `goals.order` was `int4`, we set it to `-Date.now()` which overflows.
  Fix: `alter table public.goals alter column "order" type bigint`.
- `column goals.side does not exist` → schema.sql was run before we added
  the `side` column. Fix: `alter table public.goals add column if not
  exists side boolean default false`.

Both ALTERs are in [`supabase/schema.sql`](../supabase/schema.sql) for
fresh installs.

## Files that drive this

- [`src/services/sync.ts`](../src/services/sync.ts) — every word above
  lives in this file
- [`src/services/supabase.ts`](../src/services/supabase.ts) — the client
  construction
- [`src/services/auth.ts`](../src/services/auth.ts) — sign-in / sign-out
  + auth state hook
- [`src/store/store.ts`](../src/store/store.ts) — the `lastSyncAt`,
  `tombstones` state + every delete action that populates tombstones
- [`src/app/_layout.tsx`](../src/app/_layout.tsx) — calls
  `attachAuthListener()` once at boot
- [`src/app/settings.tsx`](../src/app/settings.tsx) — `SyncButton` →
  `forceSync()` wired to the "Sync now" UI
- [`supabase/schema.sql`](../supabase/schema.sql) — the table shapes + RLS
  policies that make this safe
