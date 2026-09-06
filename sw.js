const CACHE = 'ledger-v4';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  'https://unpkg.com/react@18/umd/react.production.min.js',
  'https://unpkg.com/react-dom@18/umd/react-dom.production.min.js',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).catch(() => {}));
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
  );
  self.clients.claim();
});

// The app itself (the HTML document) goes network-first, so a new build shows up on the
// next launch instead of a stale copy. Everything else stays cache-first for offline speed.
function isAppShell(request) {
  if (request.mode === 'navigate') return true;
  const url = new URL(request.url);
  return url.origin === self.location.origin && (url.pathname.endsWith('/') || url.pathname.endsWith('/index.html'));
}

self.addEventListener('fetch', (e) => {
  const store = (res) => {
    if (res && res.status === 200) {
      const clone = res.clone();
      caches.open(CACHE).then((c) => c.put(e.request, clone));
    }
    return res;
  };
  if (isAppShell(e.request)) {
    e.respondWith(fetch(e.request).then(store).catch(() => caches.match(e.request).then((c) => c || caches.match('./index.html'))));
    return;
  }
  e.respondWith(
    caches.match(e.request).then((cached) => {
      const fetchPromise = fetch(e.request).then(store).catch(() => cached);
      return cached || fetchPromise;
    })
  );
});
