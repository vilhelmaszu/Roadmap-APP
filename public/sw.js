// Roadmap PWA service worker — gives the app offline shell + installability,
// while still letting new deploys reach the user automatically.
//
// Strategy by request type:
//   - HTML navigation (the app shell at `/` and any route):
//       NETWORK-FIRST. Fresh deploys deliver the new HTML (with the new
//       bundle hash inside) immediately. Fall back to cached HTML when
//       offline so the app still launches.
//   - Hashed static assets (JS bundles, images, fonts at /_expo/static/...):
//       CACHE-FIRST. Filenames contain content hashes, so a cached copy is
//       guaranteed to still be valid. Different content → different URL.
//   - manifest.webmanifest:
//       NETWORK-FIRST so install metadata stays current.
//   - Cross-origin (Supabase API, etc.):
//       Skipped entirely — let the page handle them.
//
// Bumping CACHE_VERSION evicts every old cache on activate, so old stuck
// users get cleared out the next time their SW updates.

const CACHE_VERSION = 'roadmap-v5';
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
  // Skip cross-origin (Supabase API, Google fonts, etc.) — let the page handle.
  if (url.origin !== self.location.origin) return;

  // Network-first for HTML navigations + the manifest.
  const isNavigation = req.mode === 'navigate' || req.destination === 'document';
  const isManifest = url.pathname === '/manifest.webmanifest';
  if (isNavigation || isManifest) {
    event.respondWith(networkFirst(req));
    return;
  }

  // Cache-first for everything else (hashed JS bundles, images, fonts, sw.js).
  event.respondWith(cacheFirst(req));
});

async function networkFirst(req) {
  try {
    const res = await fetch(req);
    if (res.ok && (res.type === 'basic' || res.type === 'default')) {
      const copy = res.clone();
      caches.open(CACHE_VERSION).then((c) => c.put(req, copy)).catch(() => undefined);
    }
    return res;
  } catch {
    const cached = await caches.match(req);
    if (cached) return cached;
    if (req.mode === 'navigate') {
      const root = await caches.match('/');
      if (root) return root;
    }
    return Response.error();
  }
}

async function cacheFirst(req) {
  const cached = await caches.match(req);
  if (cached) return cached;
  try {
    const res = await fetch(req);
    if (res.ok && (res.type === 'basic' || res.type === 'default')) {
      const copy = res.clone();
      caches.open(CACHE_VERSION).then((c) => c.put(req, copy)).catch(() => undefined);
    }
    return res;
  } catch {
    return Response.error();
  }
}
