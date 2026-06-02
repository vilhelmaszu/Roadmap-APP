# 09 — PWA (Progressive Web App)

PWA is what makes the deployed website installable on your phone home screen
and runnable offline.

## What "PWA" actually requires

Three things, none optional:

1. **HTTPS** — Cloudflare provides this automatically
2. **Web app manifest** — a JSON file describing the app's name, icons, color theme
3. **Service worker** — a JS script that runs in the browser's background,
   serving cached assets even when offline

If all three are present, Chrome/Edge offer an "Install" option. We surface
this as an explicit button in Settings via
[`src/services/install.ts`](../src/services/install.ts).

## The manifest

[`public/manifest.webmanifest`](../public/manifest.webmanifest):

```json
{
  "name": "Roadmap",
  "short_name": "Roadmap",
  "description": "Local-first gamified goal & roadmap tracker.",
  "start_url": "/",
  "scope": "/",
  "display": "standalone",
  "orientation": "portrait",
  "background_color": "#0F1115",
  "theme_color": "#0F1115",
  "icons": [
    { "src": "/icon-192.png", "sizes": "192x192", "type": "image/png", "purpose": "any" },
    { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "any" },
    { "src": "/icon-512-maskable.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
  ]
}
```

Key fields:

- `display: standalone` — launched app has no browser chrome (URL bar,
  back/forward buttons). Looks like a native app.
- `start_url: "/"` — when you launch from the home screen icon, you land at /
- `icons[purpose: any]` — used as the actual icon
- `icons[purpose: maskable]` — Android's adaptive icon system applies a
  shape mask (circle, squircle, etc); maskable icons have safe padding so
  the corners don't get cropped

The manifest is wired into the page via `_layout.tsx`:

```tsx
if (!document.querySelector('link[rel="manifest"]')) {
  const link = document.createElement('link');
  link.rel = 'manifest';
  link.href = '/manifest.webmanifest';
  document.head.appendChild(link);
}
```

## The service worker — `public/sw.js`

A tiny JS file the browser runs in the background. Once installed it
intercepts every network request the page makes. Our strategy depends on
what kind of request:

| Request type | Strategy | Why |
|---|---|---|
| **HTML navigations** (`/`, any route) | **Network-first** | Fresh deploys need to deliver the new HTML so users get the new bundle hash inside it. Falls back to cached HTML when offline. |
| **manifest.webmanifest** | Network-first | Install metadata should stay current. |
| **Hashed static assets** (`/_expo/static/js/...`, images) | **Cache-first** | Filenames contain content hashes; a cached copy is guaranteed to still be valid. Different content → different URL. |
| **Cross-origin** (Supabase API, fonts CDN) | Skip — pass to network | Sync requests must always hit live cloud; we don't cache them. |

This split is **critical**. The original SW was cache-first for everything,
which permanently stuck installed users on whatever index.html they first
saw — pointing at an old hashed bundle URL that no longer existed. Fresh
deploys never reached their PWA. The network-first split for navigations
fixes that for good.

### Code

```js
const CACHE_VERSION = 'roadmap-v5';
const APP_SHELL = ['/', '/manifest.webmanifest'];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_VERSION).then((cache) =>
    cache.addAll(APP_SHELL).catch(() => undefined)));
  self.skipWaiting();   // activate immediately, don't wait for tabs to close
});

self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys().then((keys) =>
    Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k)))));
  self.clients.claim();   // take control of any open pages immediately
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;   // skip cross-origin

  const isNavigation = req.mode === 'navigate' || req.destination === 'document';
  const isManifest = url.pathname === '/manifest.webmanifest';
  if (isNavigation || isManifest) {
    event.respondWith(networkFirst(req));
    return;
  }
  event.respondWith(cacheFirst(req));
});
```

### What this gets you

- **Fresh deploys actually reach the installed PWA** — network-first HTML
  fetches the new index.html (pointing at new hashed bundle) the moment the
  user opens the app while online
- **Offline app shell** — when offline, networkFirst falls back to cached
  HTML; static assets serve from cache
- **Instant warm starts** — cached hashed bundles serve in <50ms

### The big gotcha — `CACHE_VERSION` bumps

Even with network-first navigation, you should still bump `CACHE_VERSION`
on each release for two reasons:

1. The `activate` event uses it to evict old caches (otherwise old hashed
   bundles pile up forever)
2. It changes the SW file content, which Chrome detects and uses to install
   the new SW

**Rule: bump `CACHE_VERSION` in `public/sw.js` on every release that ships
JS changes.** We've gone through `v1` → `v2` → `v3` → `v4` → `v5`. Each
bump matched a deploy.

To force-update a stuck user (PC): tell them DevTools → Application →
Service Workers → Unregister → Storage → Clear site data → reload.
To force-update a stuck installed PWA on Android: long-press app icon →
App info → Storage → Clear data → relaunch (you'll be signed out).

The new **Restart button in the sidebar** (`src/components/Sidebar.tsx`)
calls `navigator.serviceWorker.getRegistration().then(reg => reg?.update())`
before `location.reload()`, so most updates land without manual intervention.

## The install flow

[`src/services/install.ts`](../src/services/install.ts) captures Chrome's
`beforeinstallprompt` event the moment it fires:

```ts
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  emit();   // notify React listeners
});
```

The event fires once per page load, on browsers that decide the PWA is
installable. We `preventDefault` to keep the prompt usable later, store it
in a module-level variable, and wake any React components subscribed.

The Settings → Install card (`InstallCard` in `src/app/settings.tsx`) calls
`triggerInstall()` when the user clicks the button, which calls
`deferredPrompt.prompt()` to show Chrome's native install dialog.

### What makes a PWA "installable" in Chrome's eyes

Chrome's heuristics check:

- Valid manifest with name, icons (at least 192 + 512), start_url, display
- A registered service worker with a fetch handler
- Served over HTTPS (or localhost)
- Site engagement signal (you've visited the page recently)

Localhost in dev rarely qualifies (engagement signal is fresh on each
restart). The Cloudflare-deployed URL qualifies almost immediately after
first visit.

### iOS Safari

Doesn't fire `beforeinstallprompt`. Doesn't support `triggerInstall()` at
all. Users have to manually do **Share → Add to Home Screen**. The
InstallCard detects iOS via user-agent and shows those 3 steps as
instructions instead of a button.

## The Restart button in the Sidebar

A small refresh icon next to the ROADMAP % footer (sidebar bottom). On the
narrow icon-rail sidebar (mobile) it's the same icon below the %. Tapping it:

1. Asks the current SW to `.update()` — if a newer SW exists at the URL,
   it installs in the background
2. Calls `window.location.reload()` — reloads the page, which (with the
   new SW network-first strategy) gets the freshest HTML and bundle

It **does not** delete any data. No sign-out, no cache wipe, no state reset.
Same effect as Ctrl+R in a regular browser tab. Exists because the
standalone PWA hides the browser's own reload button.

Code lives in [`src/components/Sidebar.tsx`](../src/components/Sidebar.tsx) →
`RestartButton`.

## Icons

Generated from `assets/images/icon.png` using sharp during setup:

```js
sharp('assets/images/icon.png').resize(192,192).png().toFile('public/icon-192.png')
sharp('assets/images/icon.png').resize(512,512).png().toFile('public/icon-512.png')
sharp('assets/images/icon.png').resize(384,384)
  .extend({top:64,bottom:64,left:64,right:64,background:'#0F1115'})
  .png().toFile('public/icon-512-maskable.png')
```

The maskable variant is the 384x384 icon centered in a 512x512 canvas with
64px of background padding on each side, so Android's mask system can
crop the edges into a circle / squircle / whatever without cutting into
the icon's design.
