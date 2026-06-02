# 03 — The Seed (your morimake roadmap)

The "seed" is the content that ships with a fresh install. Open the app on a
brand-new browser, and before signing in you'll see all of this populated as
local data — 6 projects, 127 goals, 6 notes — straight from
[`src/domain/seed.ts`](../src/domain/seed.ts).

## What's in the seed

The seed is the morimake.com 5-year roadmap we built together on 2026-06-01.

| Project | Vision | Goals | Year |
|---|---|---|---|
| **P1 — Marketing Suite App** | Ship a one-app campaign engine replacing HighLevel | 34 | 2028 |
| **P2 — morimake.com Brand** | Tier-1 tech first impression: 3 cinematic landing pages + daily content engine | 36 | 2027 |
| **P3 — Email Outreach Engine** | Daily outbound machine → 2–5 booked calls/week | 12 | 2027 |
| **P4 — Learning Track** | Senior-level marketing, sales, communication, applied AI | 21 | 2027 |
| **P5 — News Telegram Bot** | Curated daily news digest to my phone | 9 | 2027 |
| **P6 — Program Portfolio** | Ship 10–50 small programs over 2 years | 7 | 2028 |

Each project has its own Vision (with plan points), its own set of phase
"parent" goals, and sub-tasks nested under each phase.

## The structure inside a project

Take P1 as an example:

```
Vision: Ship the Marketing Suite — a one-app campaign engine
  └─ 7 plan points (Competitor research locked, Architecture signed off, ...)

Phase 1.1 — Competitor & feature research  (monthly)
  ├─ Tear down HighLevel
  ├─ Tear down Jasper / Buffer / Hootsuite / Ocoya / Predis.ai
  ├─ Write "what we do differently" one-pager
  └─ Lock MVP cut

Phase 1.2 — Architecture plan  (monthly, finish BEFORE any code)
  ├─ Domain model
  ├─ Avatar schema
  ├─ Integration list + auth model
  ├─ Stack decision
  └─ Full ERD + system diagram signed off

Phase 1.3 — Avatar generator module  (yearly)
  ├─ Avatar form
  ├─ Where the avatar hangs out — digital channels
  ├─ Where the avatar hangs out — physical/offline
  ├─ Claude enrichment
  ├─ Save/version/clone avatars
  └─ Avatar → campaign brief generator

...etc through Phase 1.7
```

Phase parents appear in the top-level goals list grouped by timeframe.
Sub-tasks nest inside the parent's detail popup.

## Stable IDs

Every seed goal has a deterministic id like `p1-3-1b` (Project 1, Phase 3,
subtask 1, variant b). This matters because:

- The Lithuanian translation map keys off these IDs (sort of — see below)
- The seed notes reference goal ranges
- Reseeds keep the same IDs so any in-app references survive a reseed

## Recurring goals in the seed

15 of the 127 goals are recurring (have `recurrence: 'daily' | 'weekly' | 'monthly'`):

- `p2-4-2` Post on at least one channel — **daily**
- `p2-4-3` 1 long-form video or carousel — **weekly**
- `p3-2-1` Send 5–10 personalized emails — **daily**
- `p3-2-2` Log + classify replies — **daily**
- `p4-1-5` 1 chapter + 1-page synthesis — **weekly**
- `p4-3-4` 200-word writing rep — **daily**
- `p6-2-1` Ship 1 small program — **monthly**
- …and 8 more

Marking a recurring goal done auto-archives the current occurrence and
creates the next one. See the habit lineage logic in `computeHabit()`
([`src/domain/logic.ts`](../src/domain/logic.ts)).

## The 6 seeded notes

`seedNotes` contains one Note per project — a markdown-ish full breakdown of
that project's vision + every phase + every sub-task. Titles look like:

- "P1 — Marketing Suite App — full breakdown"
- "P2 — morimake.com Brand & Web Presence — full breakdown"
- etc.

These exist so you can reread the whole roadmap as a single text doc and
edit it freely (in the app's Notes screen). Editing a seeded note doesn't
mutate the seed file — it just edits the live store row.

## Lithuanian translations

The seed content lives in English. We added a parallel translation map in
[`src/i18n/seedI18n.ts`](../src/i18n/seedI18n.ts) — a `Record<string, string>`
keyed by **English string**, valued by Lithuanian translation.

Example entries:

```ts
'Phase 1.1 — Competitor & feature research': '1.1 etapas — Konkurentų ir funkcijų tyrimas',
'Tear down HighLevel: pricing, feature map, gaps': 'Išanalizuoti HighLevel: kainos, funkcijos, spragos',
'Ship the Marketing Suite — a one-app campaign engine': 'Sukurti rinkodaros sistemą — vieną programą kampanijoms valdyti',
```

The helper `tSeed(text, lang)` looks up the English string in the map when
`lang === 'lt'`:

```ts
export function tSeed(s: string | undefined, lang: Lang): string {
  if (!s) return s ?? '';
  if (lang !== 'lt') return s;
  if (lt[s]) return lt[s];
  // Multi-line content (note bodies): translate line by line.
  if (s.includes('\n')) {
    return s.split('\n').map((line) => {
      const trimmed = line.replace(/^- /, '');
      if (lt[trimmed]) return line.startsWith('- ') ? `- ${lt[trimmed]}` : lt[trimmed];
      return line;
    }).join('\n');
  }
  return s;
}
```

### What gets translated

Every render site that displays user-content from the seed wraps it in `tSeed(...)`:

- `goal.title` — in [`components/GoalItem.tsx`](../src/components/GoalItem.tsx), [`app/goals.tsx`](../src/app/goals.tsx), [`app/index.tsx`](../src/app/index.tsx), [`app/archive.tsx`](../src/app/archive.tsx), [`app/roadmap.tsx`](../src/app/roadmap.tsx)
- `vision.title` + `vision.why` — in [`app/roadmap.tsx`](../src/app/roadmap.tsx)
- `vision.points[].text` — in [`components/PlanPoints.tsx`](../src/components/PlanPoints.tsx)
- `project.name` — in [`components/InlineProjectDropdown.tsx`](../src/components/InlineProjectDropdown.tsx), [`components/ProjectSwitcher.tsx`](../src/components/ProjectSwitcher.tsx), [`app/settings.tsx`](../src/app/settings.tsx), [`app/notes.tsx`](../src/app/notes.tsx)
- `note.title` + `note.body` — in [`app/notes.tsx`](../src/app/notes.tsx), [`app/roadmap.tsx`](../src/app/roadmap.tsx)

### Why translation falls through on user-edited text

The lookup is **by exact English string match**. If you edit a seeded goal's
title, the new text isn't in the map → `tSeed` returns it as-is. So your edit
shows verbatim in both EN and LT modes. This is the right behavior — the user
shouldn't lose their edits to a translation system.

If you want a goal in Lithuanian after editing it, you re-type it in
Lithuanian.

### Adding new translations later

Any time you add new seeded content (goals, notes, etc.), add the matching
Lithuanian to `seedI18n.ts`. The format is:

```ts
'English seed string verbatim': 'Lietuviškas vertimas',
```

UI chrome translations (button labels, screen titles, etc.) go in a separate
file — [`src/i18n/index.ts`](../src/i18n/index.ts) — and are keyed differently
(by symbolic key like `nav.home`, used with `useT()`).

## The seed is NOT the cloud truth

After you sign in:

1. Sync layer pulls your Supabase data
2. Your cloud data replaces the local seed (mostly — see preserve-on-empty in
   [07-sync-explained.md](./07-sync-explained.md))
3. From then on, your cloud is the source of truth

The seed is just the starting kit for fresh installs. It also gets uploaded
to Supabase on your first sign-in if the cloud is empty (one-time migration).
