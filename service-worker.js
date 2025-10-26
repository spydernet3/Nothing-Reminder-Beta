// service-worker.js

const CACHE_NAME = 'pwa-assistant-cache-v1';
const urlsToCache = [
    '/',
    'index.html',
    'manifest.json',
    // Add all critical assets here for offline use
    // Since this is a simple example, we only cache the core files.
];

// Install event: Caches essential files for offline use
self.addEventListener('install', event => {
    console.log('Service Worker: Install event triggered.');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Service Worker: Caching essential files.');
                return cache.addAll(urlsToCache).catch(err => {
                    console.error('Failed to cache resources:', err);
                });
            })
    );
    self.skipWaiting(); // Forces the new service worker to activate immediately
});

// Activate event: Cleans up old caches
self.addEventListener('activate', event => {
    console.log('Service Worker: Activate event triggered.');
    const cacheWhitelist = [CACHE_NAME];
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheWhitelist.indexOf(cacheName) === -1) {
                        console.log('Service Worker: Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    // claim clients immediately to start serving files without page refresh
    event.waitUntil(clients.claim()); 
});

// Fetch event: Serves files from cache first, then falls back to network
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
            .catch(error => {
                console.error('Fetching failed:', error);
                // Can return an offline page here if desired
                // return caches.match('/offline.html');
            })
    );
});
