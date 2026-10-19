const CACHE = 'blyart-v1';
const STATIC = [
  '/',
  '/index.html',
  '/css/app.css',
  '/js/api.js',
  '/js/auth.js',
  '/js/ojt.js',
  '/js/repairs.js',
  '/js/barcode.js',
  '/js/app.js',
  '/manifest.json',
];

// Install — pre-cache static shell
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(STATIC))
  );
  self.skipWaiting();
});

// Activate — clean old caches
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch — network-first for API, cache-first for static
self.addEventListener('fetch', (e) => {
  if (e.request.url.includes('/api/')) {
    // API: network only (no caching sensitive data)
    e.respondWith(fetch(e.request).catch(() =>
      new Response(JSON.stringify({ success: false, message: 'You are offline' }), {
        headers: { 'Content-Type': 'application/json' },
      })
    ));
    return;
  }
  // Static: cache-first, fallback to network
  e.respondWith(
    caches.match(e.request).then((cached) => cached || fetch(e.request))
  );
});
