// scripts/precache.mjs replaces f50abacd4166 and the file list after every build, so each deploy ships a
// new worker that downloads the whole app up front and the app opens with no connection at all.
// This site shares its origin with other GitHub Pages projects, so the worker only ever touches its
// own scope and its own caches (the 365-hard- prefix).
const PREFIX = '365-hard-';
const CACHE = `${PREFIX}f50abacd4166`;
const FILES = JSON.parse("[\"/365-hard-site/__next.__PAGE__.txt\",\"/365-hard-site/__next._full.txt\",\"/365-hard-site/__next._head.txt\",\"/365-hard-site/__next._index.txt\",\"/365-hard-site/__next._tree.txt\",\"/365-hard-site/_next/static/EBfUbWDSU-8h8EEm_ww9j/_buildManifest.js\",\"/365-hard-site/_next/static/EBfUbWDSU-8h8EEm_ww9j/_clientMiddlewareManifest.json\",\"/365-hard-site/_next/static/EBfUbWDSU-8h8EEm_ww9j/_ssgManifest.js\",\"/365-hard-site/_next/static/chunks/63e48f214d64b2c6.js\",\"/365-hard-site/_next/static/chunks/778e4a4c0d7a64a2.js\",\"/365-hard-site/_next/static/chunks/82abf2d65f5428ae.js\",\"/365-hard-site/_next/static/chunks/a6dad97d9634a72d.js\",\"/365-hard-site/_next/static/chunks/aade72b73e1af1bf.js\",\"/365-hard-site/_next/static/chunks/cf5d970c69445c7a.js\",\"/365-hard-site/_next/static/chunks/d2be314c3ece3fbe.js\",\"/365-hard-site/_next/static/chunks/dbf96e558536a6c0.js\",\"/365-hard-site/_next/static/chunks/e81990b10794a8dd.js\",\"/365-hard-site/_next/static/chunks/f2f58a7e93290fbb.js\",\"/365-hard-site/_next/static/chunks/ff1a16fafef87110.js\",\"/365-hard-site/_next/static/chunks/ff4b105fd8c4f5e1.css\",\"/365-hard-site/_next/static/chunks/turbopack-e48bb2bb5e1465ee.js\",\"/365-hard-site/_next/static/media/apple-icon.51031716.png\",\"/365-hard-site/_next/static/media/icon.981b3427.png\",\"/365-hard-site/apple-icon.png\",\"/365-hard-site/icon.png\",\"/365-hard-site/\",\"/365-hard-site/index.txt\",\"/365-hard-site/manifest.webmanifest\",\"/365-hard-site/plan/__next._full.txt\",\"/365-hard-site/plan/__next._head.txt\",\"/365-hard-site/plan/__next._index.txt\",\"/365-hard-site/plan/__next._tree.txt\",\"/365-hard-site/plan/__next.plan.txt\",\"/365-hard-site/plan/__next.plan/__PAGE__.txt\",\"/365-hard-site/plan/\",\"/365-hard-site/plan/index.txt\",\"/365-hard-site/year/__next._full.txt\",\"/365-hard-site/year/__next._head.txt\",\"/365-hard-site/year/__next._index.txt\",\"/365-hard-site/year/__next._tree.txt\",\"/365-hard-site/year/__next.year.txt\",\"/365-hard-site/year/__next.year/__PAGE__.txt\",\"/365-hard-site/year/\",\"/365-hard-site/year/index.txt\"]");

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(FILES.map((url) => new Request(url, { cache: 'reload' }))))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key.startsWith(PREFIX) && key !== CACHE).map((key) => caches.delete(key))),
      )
      .then(() => self.clients.claim()),
  );
});

const cached = (request) => caches.open(CACHE).then((cache) => cache.match(request, { ignoreSearch: true }));

const remember = (request) => (response) => {
  if (response.ok && !response.redirected) {
    const copy = response.clone();
    const url = new URL(request.url);
    caches.open(CACHE).then((cache) => cache.put(url.origin + url.pathname, copy));
  }
  return response;
};

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  if (new URL(request.url).origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    // Pages are revalidated every time. GitHub Pages lets browsers reuse a page for 10 minutes, which could
    // pair an old page with files a newer deploy has already removed. A 304 keeps this cheap.
    event.respondWith(
      fetch(request.url, { cache: 'no-cache', redirect: 'manual' })
        .then(remember(request))
        .catch(() => cached(request).then((page) => page ?? cached(self.registration.scope))),
    );
    return;
  }

  event.respondWith(cached(request).then((hit) => hit ?? fetch(request).then(remember(request))));
});
