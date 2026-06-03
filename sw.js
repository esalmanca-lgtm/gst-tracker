const CACHE_NAME = "gst-tracker-cache-v1";
const ASSETS = [
  "./index.html",
  "./manifest.json",
  "./icon.svg"
];

// Install Event - Cache assets
self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("[Service Worker] Caching App Shell Assets");
      return cache.addAll(ASSETS);
    }).catch(err => {
      console.error("[Service Worker] Cache open failed:", err);
    })
  );
  self.skipWaiting();
});

// Activate Event - Clean up old caches
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log("[Service Worker] Removing Old Cache:", key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch Event - Serve from Cache, Fallback to Network (Stale-While-Revalidate)
self.addEventListener("fetch", (e) => {
  // Only intercept GET requests originating from our origin
  if (e.request.method !== "GET" || !e.request.url.startsWith(self.location.origin)) {
    return;
  }

  e.respondWith(
    caches.match(e.request).then((cachedResponse) => {
      const fetchPromise = fetch(e.request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(e.request, responseClone);
          });
        }
        return networkResponse;
      }).catch((err) => {
        console.log("[Service Worker] Network request failed (offline):", err);
      });

      return cachedResponse || fetchPromise;
    })
  );
});
