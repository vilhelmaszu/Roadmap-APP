# Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v56.0.0/ before writing any code.

# Session start defaults

At the start of every session in this repo:

1. Call `mcp__Claude_Preview__preview_start` with name `"web"` (config in `.claude/launch.json`). The Expo web bundler serves the app at http://localhost:8081. Restart after `expo install <pkg>` or `seed.ts` changes.
2. Treat the user's live Chrome tab at http://localhost:8081 as the canonical edit target. The user keeps it open across sessions. Drive it via the `mcp__Claude_in_Chrome__*` tools when verification or in-app edits are needed — do not ask the user to paste DevTools commands when a tool can do it.
3. AsyncStorage on Expo SDK 56 RN-web persists to `localStorage` under key `roadmap.store.v2` (NOT the older `RKStorage` IndexedDB). To re-seed: `localStorage.removeItem('roadmap.store.v2'); location.reload();`.
4. The seed in `src/domain/seed.ts` is the morimake.com 6-project roadmap (P1 Marketing Suite App, P2 morimake.com Brand, P3 Email Outreach Engine, P4 Learning Track, P5 News Telegram Bot, P6 Program Portfolio). Active project on first load: P1. Roadmap structure changes go in `seed.ts`; user-visible state changes go through Zustand store actions.
