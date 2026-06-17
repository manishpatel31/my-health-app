// VitalGreen service worker — offline app shell + runtime caching
const CACHE = 'vitalgreen-v5';
const BASE = new URL('./', self.location).pathname; // works under any subpath (e.g. GitHub Pages)

const SHELL = [
  'index.html',
  'css/style.css',
  'js/app.js',
  'js/storage.js',
  'manifest.json',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'pages/calories.html',
  'pages/weight.html',
  'pages/walk.html',
  'pages/insights.html',
  'pages/tips.html',
  'pages/coach.html',
].map(p => BASE + p);

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // Never cache API calls (GitHub Gist / Groq) — always go to network
  if (url.hostname.includes('api.github.com') || url.hostname.includes('api.groq.com')) return;

  // Navigations: network-first, fall back to cache (offline)
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req).then(res => { caches.open(CACHE).then(c => c.put(req, res.clone())); return res; })
        .catch(() => caches.match(req).then(r => r || caches.match(BASE + 'index.html')))
    );
    return;
  }

  // Everything else: cache-first, then network (and cache it)
  e.respondWith(
    caches.match(req).then(cached => cached || fetch(req).then(res => {
      if (res.ok && (url.origin === self.location.origin || url.hostname.includes('cdn'))) {
        const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy));
      }
      return res;
    }).catch(() => cached))
  );
});

// Allow the page to trigger local notifications via the SW (more reliable on mobile)
self.addEventListener('message', e => {
  if (e.data && e.data.type === 'notify') {
    self.registration.showNotification(e.data.title || 'VitalGreen', {
      body: e.data.body || '', icon: BASE + 'icons/icon-192.png', badge: BASE + 'icons/icon-192.png',
      tag: e.data.tag || 'vg', renotify: true,
    });
  }
});
