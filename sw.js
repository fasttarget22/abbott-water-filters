var CACHE_NAME = 'awf-v4';
var FILES_TO_CACHE = [
  '/index.html',
  '/shop.html',
  '/staff.html',
  '/step1-login.html',
  '/step2-manager-dashboard.html',
  '/step3-technician-dashboard.html',
  '/step4-sales-dashboard.html',
  '/supabase-config.js',
  '/invoice.js',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png'
];

self.addEventListener('install', function(evt) {
  evt.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(FILES_TO_CACHE);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', function(evt) {
  evt.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(key) { return key !== CACHE_NAME; })
            .map(function(key) { return caches.delete(key); })
      );
    })
  );
  self.clients.claim();
});

// Network-first: try network, fall back to cache
self.addEventListener('fetch', function(evt) {
  // Only handle GET requests for same-origin resources
  if (evt.request.method !== 'GET') return;
  evt.respondWith(
    fetch(evt.request).then(function(response) {
      var clone = response.clone();
      caches.open(CACHE_NAME).then(function(cache) {
        cache.put(evt.request, clone);
      });
      return response;
    }).catch(function() {
      return caches.match(evt.request);
    })
  );
});
