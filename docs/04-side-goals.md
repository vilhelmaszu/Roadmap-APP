# 04 — Side Goals

Side goals are global quick-tasks that live outside any project. Think "post
on IG today", "workout Friday", "buy groceries" — things that don't belong
in your morimake roadmap but you still want a one-tap done/missed tracker for.

## Where they show

On both [`/`](../src/app/index.tsx) (Dashboard) and [`/roadmap`](../src/app/roadmap.tsx),
right above the project content. Same component, both pages:

```tsx
import { SideGoals } from '@/components/SideGoals';
// ...
<SideGoals />
```

## What the block looks like

```
+------------------------------------------------+
| SIDE GOALS               [3 done] [1 BS'd]     |
| Quick tasks not tied to any project...         |
|                                                |
|  Post on IG today    Jun 2  daily  [✓] [✗]    |
|  Workout Friday      Jun 5  weekly [✓] [✗]    |
|  Buy groceries                     [✓] [✗]    |
|                                                |
|  [ Add a side goal... ]                  [Add] |
+------------------------------------------------+
```

- Quick-add input at the bottom → Enter or "Add" → new side goal with
  `timeframe: 'daily'`, `date: today`, `category: 'Side'`, `side: true`
- ✓ (green check) → marks done → +XP, +1 to "done" lifetime count
- ✗ (red X) → marks missed → -XP refund + 1 to "BS'd" lifetime count
- Tap the title → small edit popup: change date, recurrence, reminders, or delete

## The `side: true` flag

A side goal is just a regular Goal row with `side: true` and no `projectId`.
This combination is what makes them:

- Global (visible from every project — they don't filter by `projectId`)
- Excluded from the regular Goals screen (won't clutter project planning)

See [`src/store/hooks.ts`](../src/store/hooks.ts):

```ts
// Regular goals — exclude side goals so they don't clutter project lists
export function useActiveGoals() {
  return useMemo(
    () => goals.filter((g) => !g.side && (!g.projectId || g.projectId === activeProjectId)),
    [goals, activeProjectId],
  );
}

// Side goals — exactly the ones useActiveGoals filters out
export function useSideGoals() {
  return useMemo(() => goals.filter((g) => g.side && !g.archived), [goals]);
}
```

## The lifetime counters

The header chips show:

```
[N done] [N BS'd]
```

These count ALL lifetime side goals — including archived occurrences of
recurring side goals. So if you've completed your "daily IG post" 23 times
and skipped it 4 times, you'd see `23 done · 4 BS'd`.

The computation is direct (no separate stats stored):

```ts
const lifetimeSide = allGoals.filter((g) => g.side);
const kept = lifetimeSide.filter((g) => g.done).length;
const bsd = lifetimeSide.filter((g) => g.missedAt).length;
```

## Edit popup

Tap a side goal's title to open the small popup. It exposes:

- **Date** — Today / Tomorrow / None presets + a raw `YYYY-MM-DD` text input
- **Repeat** — One-off / Daily / Weekly / Monthly pills
- **Reminders** — preset chips at 08:00 / 12:00 / 18:00 / 21:00

Reminders fire as scheduled local notifications on a device build. Web is a
no-op (the `expo-notifications` package can't deliver browser pushes from a
PWA without server infrastructure).

## Why "BS'd it"

The label is intentional — your daily/weekly habit goals are commitments you
made to yourself, and "missed" is too soft. Naming it "BS'd it" forces
honesty about whether you followed through. The button's red color
reinforces it.

The behavior is identical to `toggleGoalMissed`: missedAt timestamp set,
lifetime missed counter bumped, XP from any previous "done" is refunded.

## Does it sync?

Yes. Side goals are normal Goal rows so they go through the same sync layer
(see [07-sync-explained.md](./07-sync-explained.md)). The `side` column was
added to the Supabase `goals` table — if you ever rebuild your Supabase
project, run this:

```sql
alter table public.goals add column if not exists side boolean default false;
```

It's included in [`supabase/schema.sql`](../supabase/schema.sql) already.
