# 10 — Cloudflare Deployment

How the static export gets from GitHub to your live URL at
`https://roadmap-app.vilhelmas-zu.workers.dev`.

## How the build works

The deployed site is a static export of the Expo app:

```
git push origin main
        ↓
GitHub receives commits
        ↓
Cloudflare webhook fires (auto-deploy is enabled)
        ↓
Cloudflare runner spins up a container
        ↓
Container runs: npx expo export -p web
        ↓
Output directory: dist/
        ↓
Cloudflare uploads dist/ contents to its CDN
        ↓
Cloudflare DNS routes roadmap-app.vilhelmas-zu.workers.dev
to the CDN edge → users get cached responses worldwide
```

No server-side rendering. No backend. Just static files served from the
edge.

## What `expo export -p web` produces

Inside `dist/`:

```
dist/
  index.html                                  the main page; loads the JS bundle
  _expo/static/js/web/entry-<hash>.js         the entire app bundle (~10 MB dev, smaller in prod)
  _expo/static/media/<hash>.png               images
  manifest.webmanifest                        copied from public/
  sw.js                                       copied from public/
  icon-192.png / icon-512.png / ...           copied from public/
```

Filenames are content-hashed so cache busting works cleanly when the
content changes.

## Cloudflare configuration (set once)

In the Cloudflare dashboard for your `roadmap-app` project:

### Build configuration
- **Build command**: `npx expo export -p web`
- **Build output directory**: `dist`
- **Root directory**: blank
- **Production branch**: `main`

### Build environment variables (CRITICAL — these get baked into the bundle at build time)

| Variable | Value |
|---|---|
| `EXPO_PUBLIC_SUPABASE_URL` | `https://fvgqgptarhdluhkkpcjg.supabase.co` |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | the long `eyJhbGc…` string from your local `.env` |

⚠️ Important: env vars added AFTER a deploy don't apply to it. You must
**Retry deployment** on a build after setting env vars, or push a new
commit to trigger a fresh build with the vars.

The `EXPO_PUBLIC_` prefix is non-negotiable — Expo only exposes vars with
that prefix to client-side code.

## Where the env vars actually go

Inside the deployed JS bundle, `process.env.EXPO_PUBLIC_SUPABASE_URL` is
literally string-replaced at build time with the value you set in
Cloudflare. So the bundle contains the URL verbatim. You can verify by
running:

```bash
curl -sL https://roadmap-app.vilhelmas-zu.workers.dev/_expo/static/js/web/entry-*.js \
  | grep -c "fvgqgptarhdluhkkpcjg"
```

If this returns `0`, your Cloudflare build is missing the env vars. Set
them in the dashboard and re-deploy.

## Auto-deploy lifecycle

Once Git is connected:

1. You push a commit to `main`
2. GitHub sends a webhook to Cloudflare
3. Cloudflare clones your repo at that commit, runs the build command,
   uploads `dist/`
4. **A unique preview URL** is generated for that deploy (e.g.
   `abc12345.roadmap-app.pages.dev`)
5. Production URL `roadmap-app.vilhelmas-zu.workers.dev` updates to point
   at the new deploy
6. The Deployments tab shows the new build with status

Total time: ~2 minutes for a small change.

## Rollback

In the Cloudflare dashboard → Deployments tab → find an older successful
deploy → click ⋯ → **Rollback to this deployment**. Production URL switches
back to that old build's assets in seconds.

## Cache layers (and why they bite)

There are TWO cache layers between you and a fresh deploy:

1. **Cloudflare's CDN cache** — automatically invalidates on each successful
   deploy. You don't manage this.
2. **The user's browser service worker cache** — does NOT auto-invalidate.
   This is the one that bit us yesterday. See [09-pwa.md](./09-pwa.md) for
   the `CACHE_VERSION` bump rule.

## Worker vs Pages

In June 2026 Cloudflare merged Pages into the Workers product. Your project
shows up under "Workers & Pages" → the project type is "Worker with static
assets". Functionally identical to old Pages for our purposes (static
hosting + Git integration), but the dashboard layout changed:

- **Environment variables for the BUILD** live under Settings → Build →
  Variables (this is what you need)
- "Variables and Secrets" at the Worker level is for **runtime** vars —
  static-asset workers can't use these and the panel shows "Variables
  cannot be added to a Worker that only has static assets"

## Adding a custom domain (future)

If you ever buy a domain (e.g. `roadmap.morimake.com`):

1. Cloudflare dashboard → project → **Custom domains** → Add a custom domain
2. Enter the domain → Cloudflare gives you a CNAME record to add at your
   domain's DNS provider
3. After DNS propagates (5 min to a few hours), the custom domain serves
   your app

The OAuth whitelists (Supabase + Google Cloud Console) need updating too —
add the new domain to Supabase's Redirect URLs and Google's Authorized
JavaScript origins.

## Failed builds — where to look

Deployments tab → click the failed deploy → **Logs** tab → scroll the
build output. Usually the failure is one of:

- `npx expo export -p web` exit code != 0 — TS error or bundling failure;
  fix locally with `npx tsc --noEmit`
- Missing env var — Supabase URL is undefined at runtime; check the build
  vars are still set
- Network blip during clone or npm install — just hit **Retry deployment**

## Cost

Free, while you stay under Cloudflare Pages' generous limits:

- Unlimited bandwidth
- 500 builds per month
- 100 custom domains

You'll never hit these as a solo user.
