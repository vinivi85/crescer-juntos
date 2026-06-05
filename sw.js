const CACHE_NAME = 'crescer-juntos-v2';
const ASSETS = [
  '/crescer-juntos/',
  '/crescer-juntos/index.html',
  '/crescer-juntos/manifest.json',
  '/crescer-juntos/icons/icon-192.png',
  '/crescer-juntos/icons/icon-512.png',
  'https://fonts.googleapis.com/css2?family=Nunito:wght@300;400;500;600;700;800;900&family=Playfair+Display:ital,wght@0,500;1,400&display=swap'
];

// Install — cache all assets
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

// Activate — remove old caches
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Fetch — cache first for assets, network first for API
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // Always network for Anthropic API
  if (url.hostname === 'api.anthropic.com') {
    e.respondWith(fetch(e.request).catch(() => new Response('{"error":"offline"}', {headers:{'Content-Type':'application/json'}})));
    return;
  }

  // Cache first for everything else
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(response => {
        if (response && response.status === 200 && response.type !== 'opaque') {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
        }
        return response;
      }).catch(() => caches.match('/crescer-juntos/'));
    })
  );
});

// Background sync for offline logs
self.addEventListener('sync', e => {
  if (e.tag === 'sync-logs') {
    e.waitUntil(syncPendingLogs());
  }
});

async function syncPendingLogs() {
  // Future: sync logs saved offline to a backend
  console.log('[SW] Syncing pending logs...');
}
