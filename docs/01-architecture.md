# 01 — Architecture

## What the app is

Roadmap is a personal goal & roadmap tracker. You write your long-term vision,
break it down into projects, projects into phases, phases into sub-tasks. The
app tracks your XP, streaks, and achievements as you complete things. Designed
to feel like a tier-1 product, not a hobbyist tool.

It runs on:

- **Web** (PC + phone Chrome) — primary platform right now
- **Mobile** (iOS + Android via Expo) — same codebase, ready to ship to stores later
- **PWA** — install from Chrome to phone home screen, behaves like a real app

## The tech stack (and why each piece)

| Layer | Tech | Why |
|---|---|---|
| UI framework | **React Native** + **Expo SDK 56** | One codebase, web + iOS + Android |
| Routing | **expo-router** (file-based) | A `src/app/foo.tsx` file → a `/foo` route |
| State | **Zustand 5** + persist middleware | Tiny, no boilerplate, persists to AsyncStorage |
| Local storage | **AsyncStorage** | Works the same on web (localStorage-backed) and mobile |
| Auth + cloud sync | **Supabase** (Postgres + Auth + Realtime) | Free tier, Row-Level Security, realtime channels |
| Hosting | **Cloudflare Pages** | Free, fast, Git-connected auto-deploys |
| Animations | **Reanimated 4** + **Gesture Handler** | Drag, terrarium walkers, confetti |
| Icons | **react-native-svg** + **Ionicons** | Single icon set used everywhere |

## Directory layout

```
src/
  app/                       file-based routes (expo-router)
    _layout.tsx              providers, sidebar, account chip, install + sync hooks
    index.tsx                Dashboard (Home)
    roadmap.tsx              Roadmap screen (paired with /goals)
    goals.tsx                Goals screen
    growth.tsx               Growth (paired with /insights)
    insights.tsx
    terrarium.tsx            (paired with /achievements)
    achievements.tsx
    notes.tsx
    archive.tsx
    settings.tsx             All settings + Account + Install + Language + Reset
  components/                shared UI
    AccountChip.tsx          Top-right sign-in / signed-in chip (every screen)
    Sidebar.tsx              Left rail nav, responsive width
    SideGoals.tsx            The compact quick-task block on Home + Roadmap
    NoteModal.tsx            Full-screen notepad view for reading + editing notes
                             (with anchored close button, vault encrypt/decrypt)
    NoteNameModal.tsx        "Name your note" prompt before creation
    VaultUnlockModal.tsx     Passphrase prompt for encrypted notes
    InlineProjectDropdown.tsx Active-project switcher
    PlanPoints.tsx           Checkbox list for vision plan points + goal points
    GoalItem.tsx             Goal row used on /goals
    DraggableList.tsx        Reanimated drag-to-reorder
    Calendar.tsx, FullCalendar.tsx
    Creature.tsx, Terrarium.tsx
    Confetti.tsx, CelebrationOverlay.tsx
    ConfirmModal.tsx
    ui.tsx                   AppText, Card, ProgressBar, SectionHeader, useWide, etc.
  domain/
    types.ts                 All TypeScript types (Goal, Note, Project, Vision...)
    logic.ts                 Pure helpers (XP/level math, sortByOrder, computeHabit, etc.)
    seed.ts                  The morimake roadmap content + 6 seeded notes
  store/
    store.ts                 Zustand store + persist + migrate + every action
    hooks.ts                 useActiveProject, useActiveGoals, useActiveNotes, useSideGoals
  services/
    supabase.ts              Singleton Supabase client; reads EXPO_PUBLIC_* env
    auth.ts                  signInWithGoogle, signOut, useAuthUser
    sync.ts                  Full sync layer — push, pull, realtime, lifecycle,
                             tombstones, forceSync, visibility refresh
    install.ts               PWA `beforeinstallprompt` capture + trigger
    vault.ts                 Web Crypto API encryption for secure notes
    notifications.ts         expo-notifications wrapper (web no-op)
  theme/
    themes.ts                25 color palettes (all unlocked)
    design.ts                Newspaper + Cyber design presets
    ThemeProvider.tsx        Merges theme + design, exports useTheme()
  i18n/
    index.ts                 en + lt key-based UI translations + I18nProvider
    seedI18n.ts              Lithuanian for every seeded goal, note, vision, project name
public/                      Static assets served by Expo's web export
  manifest.webmanifest       PWA manifest (name, icons, theme color, display: standalone)
  sw.js                      Service worker — app shell cache for offline + install
  icon-192.png, icon-512.png, icon-512-maskable.png
supabase/
  schema.sql                 DDL for projects, goals, notes, goal_sets, profiles + RLS + triggers
docs/                        This documentation
```

## The "one screen" mental model

Every screen has the same shell rendered by [`src/app/_layout.tsx`](../src/app/_layout.tsx):

```
+-----------------------------------------------+
| Sidebar |              Content                |  ← AccountChip (top right)
|  Home   |  [whatever route is active]         |
|  Roadmap|                                     |
|  Goals  |                                     |
|  ...    |                                     |
+-----------------------------------------------+
```

The Sidebar is `src/components/Sidebar.tsx`. The content area is whatever
`<Slot />` (expo-router) decides to render based on the URL. The AccountChip is
absolutely positioned in the content area, top-right, on every route.

## Where state lives

Three persistence layers:

1. **In-memory Zustand store** (`src/store/store.ts`) — the live state your UI reads from
2. **AsyncStorage** — Zustand's persist middleware mirrors state under key `roadmap.store.v2`. On web this is `localStorage`; on mobile it's the platform's secure storage. Survives reloads.
3. **Supabase Postgres** — when you sign in, the sync layer mirrors your store into your account's cloud tables and pulls updates from any other device

The Zustand store is the source of truth for UI. AsyncStorage is the durable
local copy. Supabase is the durable shared-across-devices copy.

See [07-sync-explained.md](./07-sync-explained.md) for how those three layers
stay in lockstep.

## What runs at app start

[`src/app/_layout.tsx`](../src/app/_layout.tsx) `useEffect` runs once:

1. `configureNotifications()` — sets up Android channels, no-op on web
2. `attachAuthListener()` — registers `supabase.auth.onAuthStateChange` so
   sign-in/out triggers sync (which also wires the visibility refresh)
3. `attachInstallListener()` — captures Chrome's `beforeinstallprompt`
   event the moment it fires
4. PWA wiring — injects `<link rel="manifest">`, `<meta name="theme-color">`,
   registers `/sw.js`

All four are idempotent (safe to call repeatedly). All are web/native-aware
(no-op when the platform makes them irrelevant).

## Mobile responsiveness

`useWide()` ([`src/components/ui.tsx`](../src/components/ui.tsx)) returns
`true` when `useWindowDimensions().width >= 900`. Used throughout the app
to switch layouts:

- **Sidebar** — full 232px wide nav with labels (wide) vs 72px icon-rail (mobile)
- **AccountChip** — name + chevron + avatar (wide) vs avatar-only (mobile)
- **Dashboard top stats** — single row (wide) vs 2×2 grid (mobile)
- **Roadmap / Insights cards** — 2-column row (wide) vs stacked (mobile)
- **Note modal** — same notepad layout, but the close X is anchored to
  the corner so a long title can't push it off-screen

The `RestartButton` in the sidebar footer compacts to icon-only when
the sidebar collapses to the icon rail.
