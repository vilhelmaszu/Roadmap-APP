# Roadmap App — Documentation

Everything we built, explained. Pick a topic.

## Read first

- [**01-architecture.md**](./01-architecture.md) — what the app is, the tech stack, how the pieces fit
- [**02-data-model.md**](./02-data-model.md) — projects, goals, notes, profile, vision — every type and how they relate
- [**03-the-seed.md**](./03-the-seed.md) — the morimake roadmap that ships with a fresh install, and the Lithuanian translation system

## Features

- [**04-side-goals.md**](./04-side-goals.md) — the quick-task block on Home + Roadmap with did/BS'd buttons
- [**05-secure-vault.md**](./05-secure-vault.md) — encrypted notes for API keys and other secrets

## Cloud + cross-device

- [**06-auth.md**](./06-auth.md) — sign-in flow with Google + Supabase
- [**07-sync-explained.md**](./07-sync-explained.md) — **the big one** — exactly how a change on your phone lands on your PC, step by step
- [**08-supabase-schema.md**](./08-supabase-schema.md) — what tables exist, how row-level security keeps your data yours

## Deploy + install

- [**09-pwa.md**](./09-pwa.md) — manifest, service worker, install flow
- [**10-cloudflare-deploy.md**](./10-cloudflare-deploy.md) — how Cloudflare Pages builds and serves the app

## Big-picture learning

- [**11-autonomous-agents.md**](./11-autonomous-agents.md) — what agents are, what they do, where they live, examples for morimake

## Conventions

Files are numbered for reading order — start at 01 if you've never opened the
project. Each doc is self-contained: you can read any one without the others.

If a doc references code, the path is a clickable link to the file in the repo.
