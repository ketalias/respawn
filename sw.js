// RESPAWN service worker — offline shell. Bump VERSION on every deploy.
const VERSION = 'respawn-v2.1';
const SHELL = [
  './', 'index.html', 'manifest.webmanifest', 'css/style.css',
  'js/app.js', 'js/game.js', 'js/data.js', 'js/ui.js', 'js/scene.js', 'js/sprite.js', 'js/money.js', 'js/mind.js', 'js/drill.js',
  'fonts/ps2p-latin.woff2', 'fonts/ps2p-cyr.woff2', 'fonts/tiny5-latin.woff2', 'fonts/tiny5-cyr.woff2',
  'icons/icon-192.png', 'icons/icon-512.png',
];

self.addEventListener('install', e => e.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())));
self.addEventListener('activate', e => e.waitUntil(
  caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim())
));

// same-origin GET: network first (so updates land immediately), cache when offline
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  e.respondWith(
    fetch(req).then(res => {
      if (res.ok) { const copy = res.clone(); caches.open(VERSION).then(c => c.put(req, copy)); }
      return res;
    }).catch(() => caches.match(req, { ignoreSearch: true }).then(hit => hit || caches.match('index.html')))
  );
});
