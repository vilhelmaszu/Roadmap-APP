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

## The four lifecycle events

Sync is event-driven. Four moments matter:

### Event 1: App loads (signed in already)

1. `_layout.tsx` `useEffect` calls `attachAuthListener()`
2. `attachAuthListener` first runs `sb.auth.getUser()` — Supabase reads the
   token from AsyncStorage; if valid, returns the user
3. If user is non-null → `startSync(userId)` fires
4. `startSync` does this in order:
   - `pullAll(userId)` — fetches all 5 tables for this user from Supabase
   - For each table: if cloud has rows, use them; if cloud is empty, keep
     whatever local has (preserve-on-empty — see "Why this matters" below)
   - Pushes the merged state back up so any per-table gaps in cloud get
     filled
   - `startRealtime(userId)` — subscribes to a websocket per table
   - `startStoreWatcher()` — subscribes to Zustand changes so future edits
     trigger pushes

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
   POST /rest/v1/goals
   { id: 'xyz', title: 'Post on IG...', user_id: 'abc-123', ... }
                                        ─────────────►
                                        Supabase Postgres
                                        INSERT INTO goals (...)
                                        VALUES (...);

                                        Postgres trigger sets
                                        updated_at = now()

                                        Supabase Realtime
                                        broadcasts row-change
                                                                  ─────────────►
                                                                  Realtime channel `sync:goals`
                                                                  filter: user_id=eq.abc-123
                                                                  fires onChange callback

                                                                  Our handler calls pullAll(userId)

                                                                  Pull fetches all goals for user
                                                                  Gets 128 goals (was 127)

                                                                  Calls useStore.setState({
                                                                    goals: [...all 128 goals],
                                                                    ...
                                                                  })

                                                                  Zustand notifies subscribers

                                                                  React components re-render

                                                                  Dashboard shows "Post on IG..."
                                                                  in the SIDE GOALS list
```

End-to-end time on a healthy connection: ~1–3 seconds.

## Why "preserve on empty" matters (the bug we hit)

When sync first launched, the goals table in Supabase was missing the `side`
column. Every push attempt to upsert goals returned 400 from Postgres. We
swallowed the error.

What happened next:

1. PC signed in. pullAll ran. Cloud had projects + notes (from earlier
   pushes that didn't include `side` in the row), but 0 goals (because
   upserts had been failing).
2. Old pullAll code did:
   `useStore.setState({ goals: [], projects: [...], notes: [...] })`
3. PC's local 127 goals from the seed were WIPED — replaced by empty cloud.
4. Phone signed in. Pulled the same: 0 goals.
5. User: "where are my goals?"

The fix in two parts:

**Part 1: preserve local on empty (per-table)**

```ts
goals: goals.length > 0 ? goals : s.goals,
```

If cloud returned 0 goals but local has goals (from seed or any source),
keep the local goals.

**Part 2: always push after pull**

```ts
await pullAll(userId);
await pushAll();  // <-- this is new
```

Old code only pushed if cloud was 100% empty. New code always pushes after
pull, so per-table gaps (like "cloud has notes but no goals") get filled
from local data.

Together these two changes make sync resilient to partial-cloud states.

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
- Onboarding state (`onboarded`) — synced via profile but doesn't reset
  the overlay if you re-sign in elsewhere
- Notifications scheduling state — device-specific, can't be synced

## What could go wrong, and how you'd know

Every Supabase call now goes through a `check()` wrapper:

```ts
async function check(label, p) {
  const { error } = await p;
  if (error) console.error(`[sync] ${label} failed:`, error.message);
}
```

So if anything breaks (missing column, RLS reject, network error), you see
a red line in DevTools console starting with `[sync]`. Future debugging is
just "open DevTools console after the broken action".

## Files that drive this

- [`src/services/sync.ts`](../src/services/sync.ts) — every word above lives in this file
- [`src/services/supabase.ts`](../src/services/supabase.ts) — the client construction
- [`src/services/auth.ts`](../src/services/auth.ts) — sign-in / sign-out + auth state hook
- [`src/app/_layout.tsx`](../src/app/_layout.tsx) — calls `attachAuthListener()` once at boot
- [`supabase/schema.sql`](../supabase/schema.sql) — the table shapes + RLS policies that make this safe
