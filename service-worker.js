// -------- Service Worker for Full Offline Support --------
const CACHE_NAME = "spydernet-app-v13.5.5";
const FILES_TO_CACHE = [
  "/", 
  "/index.html",
  "/manifest.json",
  "/assets/icon.png",
  // Add all your feature JS/CSS/HTML paths here:
];

// INSTALL EVENT – cache files during first load
self.addEventListener("install", event => {
  console.log("[ServiceWorker] Install");
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log("[ServiceWorker] Pre-caching files");
        return cache.addAll(FILES_TO_CACHE);
      })
      .then(() => self.skipWaiting())
  );
});

// ACTIVATE EVENT – clear old caches
self.addEventListener("activate", event => {
  console.log("[ServiceWorker] Activate");
  event.waitUntil(
    caches.keys().then(keyList => {
      return Promise.all(
        keyList.map(key => {
          if (key !== CACHE_NAME) {
            console.log("[ServiceWorker] Removing old cache", key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// FETCH EVENT – serve files offline
self.addEventListener("fetch", event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      if (response) {
        // File found in cache – serve it offline
        return response;
      }
      // Otherwise, try fetching from network
      return fetch(event.request).catch(() => {
        // If network fails, show fallback page if available
        if (event.request.mode === "navigate") {
          return caches.match("/index.html");
        }
      });
    })
  );
});
