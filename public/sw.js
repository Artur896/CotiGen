const CACHE = 'cotigen-v3';
const PRECACHE = ['/', '/materiales', '/catalogo', '/editor'];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(PRECACHE).catch(() => {}))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  if (e.request.url.includes('/api/')) return;
  e.respondWith(
    fetch(e.request)
      .then((res) => {
        const clone = res.clone();
        caches.open(CACHE).then((c) => c.put(e.request, clone));
        return res;
      })
      .catch(() => caches.match(e.request).then((r) => r ?? Response.error()))
  );
});

// ── Web Push ──────────────────────────────────────────────
self.addEventListener('push', (e) => {
  let payload = { titulo: 'CotiGen', cuerpo: '', url: '/' };
  try { payload = { ...payload, ...e.data.json() }; } catch {}

  e.waitUntil(
    self.registration.showNotification(payload.titulo, {
      body: payload.cuerpo,
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      vibrate: [150, 50, 150],
      data: { url: payload.url },
    })
  );
});

self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  const url = e.notification.data?.url ?? '/';
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      const existing = list.find((c) => c.url.includes(self.location.origin));
      if (existing) return existing.focus().then((c) => c.navigate(url));
      return clients.openWindow(url);
    })
  );
});
