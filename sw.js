// Service worker: offline-capable app shell. Supabase and every other origin are never touched.
//
// HOW TO RELEASE: whenever any file in SHELL below changes (or a file is added/removed), bump CACHE_VERSION.
// A new version installs, takes over immediately (skipWaiting + clients.claim) and the activate step deletes
// every older "daily-cost-*" cache. Requests are network-first, so online users never get stale files even if
// you forget the bump; the version only controls what is precached for offline use.
// tests/check.mjs fails if a js/*.js module is missing from SHELL.
const CACHE_VERSION = 'v1';
const CACHE = `daily-cost-${CACHE_VERSION}`;

const SHELL = [
  './',
  'index.html',
  'css/style.css',
  'js/app.js',
  'js/dates.js',
  'js/expenses.js',
  'js/i18n.js',
  'js/icons.js',
  'js/income.js',
  'js/money.js',
  'js/supabaseClient.js',
  'js/validate.js',
  'js/vendor/supabase-js-2.119.0.js',
  'manifest.webmanifest',
  'icon.svg',
  'icons/icon-180.png',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'icons/icon-maskable-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE)
      // cache: 'reload' bypasses the HTTP cache so a new version never precaches old files.
      .then((cache) => cache.addAll(SHELL.map((u) => new Request(u, { cache: 'reload' }))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('daily-cost-') && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // Supabase, fonts, etc.: straight to the network

  // Network-first for everything same-origin: online users always get the deployed HTML and JS together
  // (never new HTML with old JS); the cache is only the offline fallback.
  const key = req.mode === 'navigate' ? 'index.html' : req;
  event.respondWith(
    fetch(req).then((res) => {
      if (res.ok && res.type === 'basic') { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(key, copy)); }
      return res;
    }).catch(() => caches.match(key).then((hit) => hit || Response.error()))
  );
});
