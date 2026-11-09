// EVID-DGC service worker (S11: field-ready PWA).
//
// Two caches: the app shell (field capture page, icons, manifest) is
// cache-first so the field tool opens with no connectivity at all; GET API
// responses (case list etc.) are network-first with a cache fallback so a
// previously synced case picker still works offline. Non-GET API calls
// (uploads, writes) always go to the network - when offline they fail fast
// and the page's IndexedDB queue (in field-capture.html) holds the evidence
// until connectivity returns. iOS Safari has no Background Sync, so queue
// draining is driven by the page (online event + interval), not the SW.

const SHELL_CACHE = 'eviddgc-shell-v1';
const API_CACHE = 'eviddgc-api-v1';

const PRECACHE = [
  '/field-capture.html',
  '/manifest.webmanifest',
  '/icon-192.png',
  '/icon-512.png',
  '/icon-maskable-192.png',
  '/icon-maskable-512.png',
  '/apple-touch-icon.png',
  '/favicon.png',
  '/logo-32x32.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) => cache.addAll(PRECACHE)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => ![SHELL_CACHE, API_CACHE].includes(k)).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return; // writes/uploads: network only
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // never touch cross-origin

  if (url.pathname.startsWith('/api/')) {
    // network-first with cache fallback for read APIs
    event.respondWith(
      fetch(req)
        .then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(API_CACHE).then((cache) => cache.put(req, copy));
          }
          return res;
        })
        .catch(async () => {
          const cached = await caches.match(req);
          if (cached) return cached;
          return new Response(JSON.stringify({ success: false, error: 'You are offline and this data was never synced.', offline: true }), {
            status: 503,
            headers: { 'Content-Type': 'application/json' },
          });
        })
    );
    return;
  }

  // static shell: cache-first, then network (and keep the runtime copy)
  event.respondWith(
    caches.match(req).then((cached) => {
      const network = fetch(req)
        .then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(SHELL_CACHE).then((cache) => cache.put(req, copy));
          }
          return res;
        })
        .catch(() => null);
      if (cached) return cached;
      return network.then((res) => {
        if (res) return res;
        if (req.mode === 'navigate') return caches.match('/field-capture.html');
        return Response.error();
      });
    })
  );
});
