# Roadmap Goal App — Architecture

A local-first, gamified roadmap and goal tracker. Mobile + web from one codebase. All data lives on-device; no backend.

## 1. Stack

- **Expo SDK 56** + **React Native 0.85.3** + **React 19.2.3** + **TypeScript 6** (strict)
- **expo-router** (file-based, screens in `src/app/`, web build is static)
- **Zustand 5** + **persist** middleware backed by **@react-native-async-storage/async-storage**
- **react-native-reanimated 4.3.1** + **react-native-gesture-handler** (drag, terrarium walkers, confetti)
- **react-native-svg** (progress rings, alien creatures)
- **@expo/vector-icons** (Ionicons) — single icon set used everywhere
- **expo-haptics** (mobile feedback)
- **expo-notifications** (scheduled local reminders — device only)

Path alias `@/*` → `./src/*` (in `tsconfig.json`). Never use relative paths past one directory.

## 2. Directory layout

```
src/
  app/                file-based routes (expo-router)
    _layout.tsx       providers + sidebar shell
    index.tsx         Dashboard (Home)
    roadmap.tsx       Roadmap (paired with /goals via SubTabs)
    goals.tsx
    growth.tsx        (paired with /insights)
    insights.tsx
    terrarium.tsx     (paired with /achievements)
    achievements.tsx
    notes.tsx
    archive.tsx
    settings.tsx
  components/         shared UI
    ui.tsx            Screen, AppText, Card, ProgressBar, SectionHeader,
                      CheckBox, IconButton, Pill, useWide()
    Sidebar.tsx       left-rail nav (responsive: 232px wide / 72px icon-rail)
    SubTabs.tsx       in-page pill switcher between paired routes
    Calendar.tsx      month calendar
    FullCalendar.tsx  12-month modal with selection animation
    GoalItem.tsx      goal row used on /goals
    PlanPoints.tsx    checklist subcomponent
    DraggableList.tsx Reanimated-powered drag-to-reorder
    NoteModal.tsx     shared note editor (used by /notes and Roadmap)
    ConfirmModal.tsx  reusable destructive-action dialog
    OnboardingOverlay.tsx
    CelebrationOverlay.tsx + Confetti.tsx
    ProgressRing.tsx
    Creature.tsx      procedural alien-head SVG (tier-driven)
    Terrarium.tsx     habitat with wandering walkers
    InlineProjectDropdown.tsx  active-project switcher on Roadmap
  domain/
    types.ts          all domain types (Goal, Vision, Project, Note, ...)
    logic.ts          pure helpers (XP, levels, ranks, achievements,
                      creatures, quests, habits, insights, formatters)
    seed.ts           initial empty state (clear-slate)
  store/
    store.ts          Zustand store + persist + migration
    hooks.ts          useActiveProject / useActiveGoals / useActiveNotes
                      (memoized — do NOT call useStore(s=>s.goals.filter(...)))
  services/
    notifications.ts  expo-notifications wrapper (web no-op)
  theme/
    themes.ts         15 color palettes (some achievement-locked)
    design.ts         design presets (Newspaper, Cyber)
    ThemeProvider.tsx merges theme + design; design.enforcedColors override theme
  i18n/
    index.ts          en/lt translations + I18nProvider + useT()
```

## 3. Domain model

Source of truth: `src/domain/types.ts`.

- **Project** — a workspace. Owns a `Vision`. Goals and notes belong to it via `projectId`. There is always at least one project; the default is created on first load.
- **Vision** — `{ title, why, targetYear, indefinite?, points }`. When `indefinite` is true, target year is hidden from the UI ("Ongoing").
- **Goal** — a task. Has `timeframe` (`daily|weekly|monthly|yearly|none`), `category`, optional `setId`, optional `parentId` (for sub-tasks), optional `recurrence`, `dependsOn[]`, `reminders[]`, `points[]` (plan points), `order`, `habitId`, `frozen`, `done`, `doneAt`, `missedAt`, `archived`.
- **Note** — `{ title, body, projectId? }`. Notes without `projectId` are **global** (visible from every project).
- **GoalSet** — global library of sets (Health, Skills, Marketing, …). Shared across projects.
- **Profile** — `{ name, xp, streakDays, bestStreak, lastActiveDate?, freezeTokens, stats }`. Stats counters: daily/weekly/monthly/yearly/missed. `'none'` goals don't bump stats.
- **Project / global scoping** — see Section 5.

## 4. State (`src/store/store.ts`)

Zustand store, persisted to AsyncStorage under key `roadmap.store.v2` (version 2). `partialize` lists what gets saved; `migrate` backfills new fields.

### Active project + vision mirror

`state.projects: Project[]` is canonical. `state.activeProjectId` points at the current one. **`state.vision` is a mirror** of the active project's vision so legacy `useStore(s => s.vision)` readers still work — every action that mutates the vision uses the `withVision(s, vision)` helper, which writes BOTH the mirror and the project entry.

### Reading goals / notes — use the hooks

Don't filter inside `useStore` — Zustand's `getSnapshot` will see a fresh array reference each render and throw `getSnapshot should be cached to avoid an infinite loop`. Use the memoized selectors from `src/store/hooks.ts`:

```ts
import { useActiveGoals, useActiveNotes, useActiveProject } from '@/store/hooks';
```

### Progress engine

`applyProgress(state, opts)` is the funnel for completion side-effects:
- bumps `xp` by `opts.xpDelta`
- bumps `stats[opts.statBump]` (skipped if `statBump === 'none'`)
- updates streak if `opts.positive`
- grants a freeze token per new level
- detects newly-earned achievements (badge popup) and level-ups (level popup)

`celebrations` (`lastLevelUp`, `lastBadgeId`) feed `CelebrationOverlay`. Clear via `clearCelebrations()`.

### Reset surface

- `clearArchive()` — drops archived goals (current project, but action is global; consumers filter)
- `resetRoadmap()` — empties the active project's vision (keeps year/indefinite)
- `startFresh()` — wipes goals + progress (XP/level/streaks/quests); keeps name, themes, sets, notes
- `resetAll()` — full wipe back to `initial`

All four are gated behind `ConfirmModal` in the UI.

## 5. Projects (workspaces)

Each project is a sealed unit for goals, notes, and vision; XP/achievements/quests/creatures/sets are global. Switch via the **inline dropdown at the top of /roadmap**.

What changes when you switch projects:
- `useActiveGoals()` returns only that project's goals
- `useActiveNotes()` returns project + global notes for that workspace
- `state.vision` re-mirrors to that project's vision
- Sidebar progress footer (`ROADMAP n%`) updates

What does NOT change: profile, sets, themes, design, language, quests, achievements.

## 6. Routing & screens

File-based via expo-router; `src/app/<name>.tsx` becomes route `/name`. Sidebar groups related screens; secondary screens swap via `SubTabs`:

| Sidebar tab  | SubTabs pair      |
|--------------|-------------------|
| Home (`/`)   | —                 |
| Roadmap      | Roadmap · Goals   |
| Growth       | Growth · Insights |
| Terrarium    | Terrarium · Achievements |
| Notes        | —                 |
| Archive      | —                 |
| Settings     | —                 |

Sub-tabs are simple pill buttons that `router.push()` between paired routes. The Sidebar highlights the parent for any path in its `alts[]`.

## 7. Themes vs designs

Two orthogonal axes:

1. **Color theme** — 15 palettes in `src/theme/themes.ts` (Midnight, Aurora, Crimson, …). Some are achievement-locked (`theme.unlock`). User picks one in Settings → Theme.
2. **Design preset** — typography, density, radius, borders, glow in `src/theme/design.ts`. Two presets: **Newspaper** (default — uppercase headers, hard corners, editorial weight) and **Cyber** (cyberpunk terminal — monospace, neon glow, cyan corner brackets, `> TITLE_` headers, `[ BRACKETED ]` sections, terminal status bar). Picked in Settings → Design.

### Color enforcement

A design can lock its own palette via `design.enforcedColors: ThemeColors`. Cyber does this. When set:
- `ThemeProvider` returns the enforced colors instead of the user's theme
- Settings hides the Theme card (`{design.enforcedColors ? null : <ThemeCard/>}`)

### How presets flow into components

Every UI primitive in `components/ui.tsx` reads `useTheme()` and pulls `design.*` for shape/typography. Card has terminal-style corner brackets when `design.terminal`. AppText applies `MONO_FAMILY` when `design.monoFont`. Screen header renders `> TITLE_` when `design.terminal`. New components should keep doing the same — never hardcode radius/weight; use `design.*`.

## 8. Internationalization

`src/i18n/index.ts` provides:
- `I18nProvider` (mounted in `_layout.tsx`)
- `useT()` — returns `t(key, vars?)`
- `useI18n()` — returns `{ lang, setLang, t }`

Languages: `en` (canonical) and `lt`. Missing `lt` keys fall back to `en`. Toggle in Settings → Language. Persisted to AsyncStorage under `roadmap.lang`.

Coverage is currently nav + screen titles + common buttons + key Settings/Roadmap/Notes strings. **Many deep-screen strings are still hardcoded English.** Adding a new translatable string: add the key to BOTH the `en` table and the `lt` table, then use `t('your.key')` in the component.

## 9. Notifications

`src/services/notifications.ts` wraps expo-notifications. **Web is a no-op** — actual OS push fires only on a device build. The reminder UI + scheduling data model are fully testable in the preview; just don't expect a banner.

Per-goal reminders live on `Goal.reminders[]`. `syncReminders(goal)` cancels every previous scheduled notification for the goal and re-schedules the enabled ones. Trigger type derives from recurrence: DAILY/WEEKLY/MONTHLY repeating, or DATE for one-offs. Android channel set up once in `requestPermission`.

## 10. Persistence model

AsyncStorage under `roadmap.store.v2`. On web that's IndexedDB DB `RKStorage` (NOT localStorage — `localStorage.clear()` does nothing here).

`migrate(persisted)` runs on load and backfills:
- new fields on existing goals/notes
- wraps pre-projects data into a Default project
- ensures vision mirror matches active project
- defaults onboarded → true for existing users

To force-reseed the preview: delete the `RKStorage` IndexedDB DB and reload.

## 11. Gamification

Pure functions in `src/domain/logic.ts`:

- **XP / Levels** — `xpForLevel(level) = round(50 * level^1.6)`. `levelFromXp(xp)` returns `{ level, intoLevel, span, progress }`.
- **Ranks** — `rankForLevel(level)` → Novice / Apprentice / Adept / Strategist / Expert / Master / Grandmaster / Visionary / Legend.
- **Achievements** — tiered. Categories: daily/weekly/monthly/yearly counts, streak length, level milestones. Built from `Profile.stats` via `buildAchievements(profile)`.
- **Creatures** — alien heads tied to specific achievement ids; `buildCreatures(profile)` returns earned/locked list. SVG rendered by `Creature` (tier drives complexity: eyes, antennae, horns, fangs, crest).
- **Daily quests** — `dailyQuests(dateKey)` deterministically picks 3 from a pool. State holds `questDate` + `claimedQuests[]`; `syncQuests()` rolls over at midnight. Claiming awards XP.
- **Habits** — recurring goals form a lineage via `habitId`. `computeHabit(allGoals, habitId)` derives current/best streak + consistency. **Freeze tokens** (earned per level-up) can shield a missed occurrence; `useFreeze(occurrenceId)` spends one.

## 12. Preview & verification

Web preview via `.claude/launch.json` config name `"web"` on port 8081. Use `mcp__Claude_Preview__*`.

### Tips that will save hours

- **Always type-check** with `npx tsc --noEmit` after a batch of edits. tsc is the ground truth — trust its exit code over Metro log tails.
- **Animations look frozen via `preview_eval`.** The headless Chromium throttles `requestAnimationFrame` to zero when the target isn't painting. Reanimated walkers, confetti, drag-to-reorder, the FullCalendar select pop — all of these work correctly but appear static through eval. Verify mount + computed `matrix(...)` transforms; trust mobile/focused-tab for the actual motion.
- **Viewport often collapses to ~6px wide on first load.** `preview_resize(width=1280, height=800)` fixes it. If the layout chain looks crushed, this is why.
- **Restart the preview after `npx expo install <module>`.** Metro caches the module map at start; new packages are invisible until restart. Symptom: blank page across all routes with `Unable to resolve module ...` in `preview_logs`.
- **`onLayout` is flaky on web after route swaps.** If you need a measured size, also use a `ref` + `node.measure()` retry loop (~10 × 120ms). See `Terrarium.tsx` for the pattern.
- **Memoize derived array selectors.** `useStore(s => s.goals.filter(...))` causes `getSnapshot should be cached to avoid an infinite loop`. Always split into raw selector + `useMemo`, as in `src/store/hooks.ts`.
- **`preview_eval` `String.includes` is case-sensitive.** Newspaper uppercases titles; probe with `/notes/i`.
- **Preview MCP `eval` occasionally wedges** with `Inspected target navigated or closed` even though the page is fine. A `preview_stop` + `preview_start` gives a fresh attachable target.

### Verification check (post-edit)

1. `npx tsc --noEmit` → expect `EXIT: 0`
2. `preview_resize` to 1280×800 if you need to read layout
3. `preview_console_logs` filtered to `error`
4. `preview_eval` for `document.body.innerText` shape of the route in question

## 13. Adding a new screen

1. Create `src/app/<name>.tsx`. Default-export a component returning a `<Screen title="…" subtitle="…">…</Screen>`.
2. Add to `Sidebar.tsx` `NAV` (icon name from Ionicons).
3. If paired with another screen, add a `SubTab` entry in `components/SubTabs.tsx` and render `<SubTabs tabs={...} />` at the top of the body.
4. Read data through `useActiveGoals` / `useActiveNotes` / `useStore` — NEVER raw `s.goals.filter(...)`.
5. Use `Card` / `AppText` / `SectionHeader` so the design preset reaches your screen.
6. For destructive actions, wire through `ConfirmModal`.
7. For modals: centered popup pattern (max-width card on a dimmed `Pressable` backdrop). Avoid full-screen `<Modal>` unless the content truly fills it.

## 14. Adding a new persisted field

1. Add to the relevant type in `src/domain/types.ts`.
2. Add to `partialize` in `store.ts` if it should survive reload.
3. Add a backfill in `migrate(persisted)` for users with existing data.
4. Set a sensible default in `initial` (and seed if needed).

## 15. Known caveats

- **Vision edit popup** keeps draft state across opens — open it twice without saving and you'll see your last typed values. Acceptable; tracked.
- **Reminders don't fire on web.** Documented in `notifications.ts`.
- **Sets are global, notes per-project (or global), goals per-project.** Don't confuse these scopes.
- **Storage is per-device.** Use Settings → Backup & restore (JSON export/import) to move data between installs.
- **Translations are partial.** Default screens are translatable; deeper popups still English. Extend coverage as you touch screens.

## 16. House style

- Comments explain **why**, not what. No emojis in code or UI strings.
- Section dividers in long files: `// --- Name ---------------------------------------------`.
- Strict TypeScript — no `any` unless interfacing with an external lib.
- Component files are PascalCase, hook files are lowercase. No barrel `index.ts` re-exports.
- Always co-locate a feature's types in `domain/types.ts` even if only used by one screen — keeps the domain catalog complete.
