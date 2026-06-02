# 09 — PWA (Progressive Web App)

PWA is what makes the deployed website installable on your phone home screen
and runnable offline.

## What "PWA" actually requires

Three things, none optional:

1. **HTTPS** — Cloudflare provides this automatically
2. **Web app manifest** — a JSON file describing the app's name, icons, color theme
3. **Service worker** — a JS script that runs in the browser's background,
   serving cached assets even when offline

If all three are present, Chrome/Edge offer an "Install" option. We give
this a button in Settings via [`src/services/install.ts`](../src/services/install.ts).

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

## The service worker

[`public/sw.js`](../public/sw.js).

The service worker is a tiny JS file the browser runs in the background.
Once installed it intercepts every network request the page makes. Ours
uses a cache-first strategy for same-origin assets so the app shell loads
instantly even offline.

```js
const CACHE_VERSION = 'roadmap-v2';

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_VERSION).then((cache) =>
    cache.addAll(['/', '/manifest.webmanifest']).catch(() => undefined)));
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
  if (url.origin !== self.location.origin) return;  // skip cross-origin (Supabase API, fonts)

  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req).then((res) => {
        if (res.ok && (res.type === 'basic' || res.type === 'default')) {
          const copy = res.clone();
          caches.open(CACHE_VERSION).then((c) => c.put(req, copy)).catch(() => undefined);
        }
        return res;
      }).catch(() => {
        if (req.mode === 'navigate') return caches.match('/');
        return Response.error();
      });
    })
  );
});
```

### What this gets you

- **Offline app shell** — the HTML, JS, CSS, icons are cached after first
  load. Lose connectivity → app still launches, still navigates between
  screens, still works with local data.
- **Instant cold-starts** — even with connectivity, cached assets serve
  in <50ms.
- **Network for API** — Supabase calls go straight to network (cross-origin
  is skipped by the fetch handler) so they always hit the live cloud.

### The big gotcha — cache invalidation

Cache-first means once a JS bundle is cached, the browser serves it forever
until the SW updates AND `CACHE_VERSION` changes. If you ship new code but
don't bump the version, users stay on the old bundle indefinitely.

**Rule: bump `CACHE_VERSION` in `public/sw.js` on every release that ships
JS changes.** We hit this exact bug — user saw fixes deployed to Cloudflare
but their browser kept serving the old cached version until we bumped from
`roadmap-v1` to `roadmap-v2`.

To force-update a stuck user: tell them DevTools → Application →
Service Workers → Unregister → Storage → Clear site data → reload.

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

The Settings `InstallCard` calls `triggerInstall()` when the user clicks
the button, which calls `deferredPrompt.prompt()` to show Chrome's
native install dialog.

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
