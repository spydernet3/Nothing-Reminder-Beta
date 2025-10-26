// service-worker.js

const CACHE_NAME = 'app-pwa-cache-v1';
const urlsToCache = [
    '/',
    'index.html',
    'manifest.json',
    // IMPORTANT: Add all paths to your assets (CSS, JS, images, icons) here
    'assets/icon.png', 
    'styles.css',
    // ... other files
];

// Install event: Caches essential files for offline use
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Service Worker: Caching essential files.');
                return cache.addAll(urlsToCache);
            })
    );
    self.skipWaiting(); // Forces the new service worker to activate immediately
});

// Activate event: Cleans up old caches
self.addEventListener('activate', event => {
    const cacheWhitelist = [CACHE_NAME];
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheWhitelist.indexOf(cacheName) === -1) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    event.waitUntil(clients.claim()); // Allows the SW to take control of the page immediately
});

// Fetch event: Serves files from cache first
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // Cache hit - return cached response
                if (response) {
                    return response;
                }
                // Fallback to network
                return fetch(event.request);
            })
    );
});
