// service-worker.js

const CACHE_NAME = 'nothing-reminder-v2';
// List the core assets your app needs to function offline. 
// Ensure all linked files (CSS, JS, assets/icon.png, manifest.json) are here.
const urlsToCache = [
  './',
  './index.html',
  './manifest.json',
  'assets/icon.png', 
  // Add any other files like './style.css', './app.js', etc.
];

// 1. Installation: Cache essential files
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Install: Caching app shell');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache).catch((error) => {
        console.error('Failed to cache files:', error);
      });
    })
  );
  self.skipWaiting(); 
});

// 2. Activation: Clean up old caches (Good Practice)
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activate: Cleaning old caches');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  return self.clients.claim(); 
});

// 3. Fetch: Cache, then Network Fallback (Your original logic, expanded for robustness)
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET' || !event.request.url.startsWith(self.location.origin)) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((response) => {
      if (response) {
        return response;
      }
      return fetch(event.request);
    })
  );
});

// --- 4. Detailed Push Notification Logic (NEW - REQUIRED FOR MOBILE ALERTS) ---

self.addEventListener('push', (event) => {
    // This function receives the push message from the server/service.
    const data = event.data ? event.data.json() : {};
    
    let title = 'Nothing Reminder App Notification';
    let options = {
        body: 'You have new activity. Open the app for details.',
        icon: 'assets/icon.png',
        tag: 'general-app-notification', 
        badge: 'assets/icon.png'
    };

    // The logic to generate your 4 detailed notifications
    if (data.type) {
        switch (data.type) {
            case 'REMINDER_DUE':
                title = `⏰ REMINDER DUE: ${data.title}`;
                options.body = data.details || "A reminder is due or expired. Check your list!";
                options.tag = 'reminder-notification'; 
                break;
            
            case 'BUDGET_OVERVIEW':
                title = `💰 Budget Alert: ${data.title}`;
                options.body = `Daily limit: ₹${data.costPerDay} | Days Left: ${data.daysLeft}`;
                options.tag = 'budget-notification';
                break;
                
            case 'CHECKLIST_OPEN':
                title = `✒ Checklist: ${data.title} is Open`;
                options.body = data.details || "You have an open checklist waiting for completion.";
                options.tag = 'checklist-notification';
                break;
                
            case 'NOTE_UPDATE':
                title = `📝 Note Reminder: ${data.title}`;
                options.body = data.details || "A note with a set reminder has triggered.";
                options.tag = 'note-notification';
                break;
        }
    }

    // Show the detailed notification
    event.waitUntil(
        self.registration.showNotification(title, options)
    );
});

// 5. Notification Click Handler (NEW - REQUIRED FOR UX)
self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    // Opens or focuses the app window when the notification is tapped
    event.waitUntil(
        clients.matchAll({ type: 'window' }).then((clientList) => {
            const appUrl = new URL('/', self.location.origin).href;
            
            for (const client of clientList) {
                if (client.url.startsWith(appUrl) && 'focus' in client) {
                    return client.focus();
                }
            }
            if (clients.openWindow) {
                return clients.openWindow('/');
            }
        })
    );
});
