// Roadmap PWA service worker — minimal cache for offline shell + installability.
//
// Strategy:
//   - Precache nothing aggressively (Expo's hashed bundle names change on every
//     build, so a precache list would go stale fast).
//   - At runtime: cache-first for navigation requests + static assets so the
//     app shell loads offline. Network-first for everything else so Supabase
//     API calls still hit the network.
//   - Bumping CACHE_VERSION on each release invalidates old caches.

// Bump this on each release so old cached bundles get evicted and the new
// build actually reaches users. (Forgetting to bump leaves users on a stale
// bundle indefinitely because the fetch handler is cache-first.)
const CACHE_VERSION = 'roadmap-v4';
const APP_SHELL = ['/', '/manifest.webmanifest'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => cache.addAll(APP_SHELL).catch(() => undefined)),
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k))),
    ),
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  // Skip cross-origin (Supabase API, Google fonts, etc.) — network-only.
  if (url.origin !== self.location.origin) return;

  // Cache-first for navigation + same-origin static assets.
  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req)
        .then((res) => {
          // Only cache successful, complete responses.
          if (res.ok && (res.type === 'basic' || res.type === 'default')) {
            const copy = res.clone();
            caches.open(CACHE_VERSION).then((c) => c.put(req, copy)).catch(() => undefined);
          }
          return res;
        })
        .catch(() => {
          // Offline navigation → fall back to cached root.
          if (req.mode === 'navigate') return caches.match('/');
          return Response.error();
        });
    }),
  );
});
