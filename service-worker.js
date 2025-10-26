// service-worker.js

const CACHE_NAME = 'nothing-reminder-v1';
// List the core assets your app needs to function offline
const urlsToCache = [
  './',
  './index.html',
  './manifest.json',
  // You should add all your CSS, JS, and image assets here:
  'assets/icon.png',
  // Add any other files like 'style.css', 'app.js', etc.
];

// 1. Installation: Cache the essential assets
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Install');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Caching app shell');
      return cache.addAll(urlsToCache);
    })
  );
  self.skipWaiting(); // Forces the waiting service worker to become the active service worker
});

// 2. Activation: Clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activate');
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
  return self.clients.claim(); // Immediately take control of clients
});

// 3. Fetch: Serve content from cache first, then fall back to network
self.addEventListener('fetch', (event) => {
  // Only handle GET requests and skip cross-origin requests for simplicity
  if (event.request.method !== 'GET' || !event.request.url.startsWith(self.location.origin)) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((response) => {
      // Return cached response if found
      if (response) {
        return response;
      }

      // Fall back to network
      return fetch(event.request);
    })
  );
});

// --- Detailed Push Notification Logic (For Background Notifications) ---

self.addEventListener('push', (event) => {
    // 1. Get the payload (detailed notification data)
    // NOTE: This requires a backend server or push service to send the data.
    const data = event.data ? event.data.json() : {};
    
    // Default notification if no specific payload is received
    let title = 'Nothing Reminder App Notification';
    let options = {
        body: 'You have new activity. Open the app for details.',
        icon: 'assets/icon.png',
        tag: 'general-app-notification', // Helps group generic notifications
        badge: 'assets/icon.png'
    };

    // 2. Process the push payload for detailed notifications
    if (data.type) {
        switch (data.type) {
            case 'REMINDER_DUE':
                title = `⏰ REMINDER DUE: ${data.title}`;
                // data.details should contain specific info like due date
                options.body = data.details || "A reminder is due or expired. Check your list!";
                options.tag = 'reminder-notification'; 
                break;
            
            case 'BUDGET_OVERVIEW':
                title = `💰 Budget Alert: ${data.title}`;
                // data.costPerDay and data.daysLeft must be sent in the payload
                options.body = `Daily limit: ₹${data.costPerDay} | Days Left: ${data.daysLeft}`;
                options.tag = 'budget-notification';
                break;
                
            case 'CHECKLIST_OPEN':
                title = `✒ Checklist: ${data.title} is Open`;
                options.body = data.details || "You have an open checklist waiting for completion.";
                options.tag = 'checklist-notification';
                break;
                
            case 'NOTE_UPDATE':
                title = `📝 Note Updated/Reminder: ${data.title}`;
                options.body = data.details || "A note with a set reminder has been updated.";
                options.tag = 'note-notification';
                break;

            default:
                // Use custom title/body if provided in the data
                title = data.title || title;
                options.body = data.body || options.body;
        }
    }

    // 3. Show the detailed notification
    event.waitUntil(
        self.registration.showNotification(title, options)
    );
});

// 4. Notification Click: Handle user interaction
self.addEventListener('notificationclick', (event) => {
    console.log('[Service Worker] Notification click received.');
    event.notification.close();

    // Open the app when the user clicks the notification
    event.waitUntil(
        clients.matchAll({ type: 'window' }).then((clientList) => {
            for (const client of clientList) {
                // Check if the app is already open
                if (client.url.includes('index.html') && 'focus' in client) {
                    return client.focus();
                }
            }
            // If no window is open, open a new one to the app's root
            if (clients.openWindow) {
                return clients.openWindow('/');
            }
        })
    );
});
