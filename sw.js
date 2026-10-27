const CACHE_NAME = 'srinivasnexus-v3';
const CORE_ASSETS = [
  '/',
  '/index.html',
  '/style.css',
  '/script.js',
  '/manifest.json',
  '/icon.svg',
  '/admin.html',
  '/admin.css',
  '/admin.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(CORE_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  
  // Ignore non-GET requests or Firestore API calls
  if (req.method !== 'GET' || req.url.includes('firestore.googleapis.com')) {
    return;
  }

  event.respondWith(
    caches.match(req).then((cachedResp) => {
      const fetchPromise = fetch(req)
        .then((networkResp) => {
          if (networkResp && networkResp.status === 200 && networkResp.type === 'basic') {
            const respClone = networkResp.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(req, respClone);
            });
          }
          return networkResp;
        })
        .catch(() => {
          // If network fails, cachedResp handles it
          return cachedResp;
        });

      return cachedResp || fetchPromise;
    })
  );
});

