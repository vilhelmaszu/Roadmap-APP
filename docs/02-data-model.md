# 02 — Data Model

Everything below lives in [`src/domain/types.ts`](../src/domain/types.ts).
Read that file alongside this doc — it's the source of truth.

## The big five

```
Project (workspace)
  ├─ owns one Vision
  ├─ owns N Goals  (via goal.projectId === project.id)
  └─ owns N Notes  (via note.projectId === project.id)

Goal
  ├─ may have a parent Goal (nesting via parentId)
  ├─ may have plan points (sub-checklist via points[])
  ├─ may recur (recurrence: daily/weekly/monthly)
  └─ tracked by Profile.stats (lifetime counters)

Note
  ├─ may be project-scoped (projectId set) or global (projectId undefined)
  └─ holds title + body (free-form text)

Profile
  └─ one per user — name, XP, streak, freeze tokens, lifetime stats

GoalSet
  └─ global, shared across projects — like categories
```

## Project

```ts
type Project = {
  id: string;
  name: string;
  color: string;
  icon: string;          // Ionicons name
  vision: Vision;
  createdAt: number;
};
```

There's always at least one project. Switching projects is purely a UI
concern — `state.activeProjectId` points at the current one, and the goals
+ notes views filter to it. XP, achievements, and themes are global, not
per-project.

## Vision

```ts
type Vision = {
  id: string;
  title: string;
  why: string;
  targetYear: number;
  indefinite?: boolean;  // hides target year, shows "Ongoing"
  points: PlanPoint[];   // checklist of milestones
};
```

A Vision is the long-term goal of a Project. The Roadmap screen renders it
prominently with checkable plan points. Completing a plan point gives XP.

## Goal

```ts
type Goal = {
  id: string;
  title: string;
  notes?: string;             // freeform body, edited in the goal detail popup
  timeframe: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'none';
  category: string;
  projectId?: string;         // owning workspace; undefined = side goal (global)
  setId?: string;             // optional GoalSet membership
  parentId?: string;          // set on sub-goals; nests under parent
  color?: string;
  date?: string;              // YYYY-MM-DD for calendar
  priority?: 'low' | 'medium' | 'high';
  estimateMin?: number;
  dependsOn?: string[];       // goal ids that must complete first
  recurrence?: 'none' | 'daily' | 'weekly' | 'monthly';
  reminders?: Reminder[];     // scheduled local notifications (device only)
  order?: number;             // manual sort order within its list
  habitId?: string;           // links recurring occurrences into one lineage
  frozen?: boolean;           // missed but shielded by a streak-freeze token
  done: boolean;
  doneAt?: number;
  missedAt?: number;
  points: PlanPoint[];        // sub-checklist
  createdAt: number;
  archived?: boolean;
  side?: boolean;             // see Side Goals doc
};
```

### Important fields explained

- **`timeframe`** drives both the XP awarded (`TIMEFRAME_XP` in logic.ts) and
  which lifetime counter increments (`Profile.stats.daily` etc).
- **`recurrence`** + **`habitId`** — when you mark a recurring goal done, the
  current occurrence is archived and a new one auto-created for the next
  period. All occurrences share a `habitId` so we can compute streak +
  consistency for the lineage.
- **`parentId`** — sub-goals are real Goal rows that nest under another. The
  /goals top-level list filters them out (`!g.parentId`), the parent's
  detail popup shows them.
- **`points`** is a different concept from `parentId`. Points are inline
  checkboxes on the goal itself. Sub-goals are full Goal rows.
- **`side`** — see [04-side-goals.md](./04-side-goals.md).

## Note

```ts
type Note = {
  id: string;
  title: string;
  body: string;
  projectId?: string;   // undefined = global, visible everywhere
  createdAt: number;
  updatedAt: number;
};
```

A Note is plain text. Two scopes:

- **Project notes** — stamped with `projectId`; only visible when that project is active
- **Global notes** — `projectId` undefined; visible regardless of active project

The Notes screen has a chip filter row showing both. The Roadmap screen shows
the active project's notes inline (top right card).

## GoalSet

```ts
type GoalSet = {
  id: string;
  name: string;
  color: string;
  icon: string;
  createdAt: number;
};
```

Global, shared across every project. Used for grouping goals into named
buckets like "Health", "Marketing", "Learning". Goals reference them by
`setId`.

## Profile

```ts
type Profile = {
  name: string;
  xp: number;
  streakDays: number;
  bestStreak: number;
  lastActiveDate?: string;   // YYYY-MM-DD
  freezeTokens: number;      // earned per level-up; spend to shield a missed habit
  stats: {
    daily: number;
    weekly: number;
    monthly: number;
    yearly: number;
    missed: number;          // lifetime missed-goal count
  };
};
```

One Profile per user. XP determines level (`xpForLevel(level) = 50·level^1.6`),
level determines rank (Novice → Apprentice → … → Legend), and `stats` feed
achievements + creatures.

## PlanPoint + Reminder

```ts
type PlanPoint = {
  id: string;
  text: string;
  done: boolean;
};

type Reminder = {
  id: string;
  hour: number;        // 0-23
  minute: number;
  enabled: boolean;
  notificationId?: string;  // OS-scheduled handle, used to cancel/reschedule
};
```

PlanPoints are sub-checkboxes on a Goal or Vision. Reminders are scheduled
local notifications — they only fire on a real device build; web is a no-op.

## State shape

The full Zustand state ([`src/store/store.ts`](../src/store/store.ts)):

```ts
{
  projects: Project[];
  activeProjectId: string;
  vision: Vision;            // mirror of the active project's vision (legacy)
  goals: Goal[];
  notes: Note[];
  sets: GoalSet[];
  profile: Profile;
  questDate: string;         // YYYY-MM-DD that the current daily quests belong to
  claimedQuests: string[];   // ids of quests already claimed today
  onboarded: boolean;
  lastLevelUp: number | null;    // celebration trigger
  lastBadgeId: string | null;    // celebration trigger
}
```

Actions all live on the same store object — see the `Actions` type in
store.ts for the full list (`addGoal`, `toggleGoalDone`, `addNote`,
`updateVision`, etc.).

## Reading data correctly

NEVER do:

```ts
useStore((s) => s.goals.filter((g) => g.projectId === active));
```

That returns a fresh array reference every render and Zustand's `getSnapshot`
throws an infinite-loop warning. Instead use the memoized hooks:

```ts
import { useActiveGoals, useActiveNotes, useActiveProject, useSideGoals } from '@/store/hooks';
```

These wrap `useMemo` around the filter so the array reference is stable.
