// service-worker.js

const CACHE_NAME = 'nothing-reminder-v2';
// List the core assets your app needs to function offline. 
// Add all your CSS, JS, and asset files here.
const urlsToCache = [
  './',
  './index.html',
  './manifest.json',
  // You must include the assets referenced in your HTML
  'assets/icon.png', 
  // Example if you have separate CSS/JS files:
  // './style.css', 
  // './app.js', 
];

// 1. Installation: Cache essential files
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Install: Caching app shell');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache).catch((error) => {
        // Log any errors during caching (e.g., if a file is missing)
        console.error('Failed to cache files:', error);
      });
    })
  );
  // Forces the new Service Worker to activate immediately
  self.skipWaiting(); 
});

// 2. Activation: Clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activate: Cleaning old caches');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // Delete any cache that is NOT the current one (CACHE_NAME)
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  // Immediately take control of any pages that might be currently open
  return self.clients.claim(); 
});

// 3. Fetch: Strategy is "Cache, then Network Fallback" (for offline support)
self.addEventListener('fetch', (event) => {
  // Only handle GET requests and skip cross-origin requests 
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

// --- 4. Detailed Push Notification Logic (For Mobile Background Notifications) ---

self.addEventListener('push', (event) => {
    // NOTE: This logic requires an external service (like a backend server) 
    // to send a structured JSON payload to the device.
    const data = event.data ? event.data.json() : {};
    
    // Default notification if the payload is empty or generic
    let title = 'Nothing Reminder App Notification';
    let options = {
        body: 'You have new activity. Open the app for details.',
        icon: 'assets/icon.png',
        tag: 'general-app-notification', 
        badge: 'assets/icon.png'
    };

    // Process the detailed payload for your 4 notification types
    if (data.type) {
        switch (data.type) {
            case 'REMINDER_DUE':
                title = `⏰ REMINDER DUE: ${data.title}`;
                // This body shows the detail, matching your desktop experience
                options.body = data.details || "A reminder is due or expired. Check your list!";
                options.tag = 'reminder-notification'; 
                break;
            
            case 'BUDGET_OVERVIEW':
                title = `💰 Budget Alert: ${data.title}`;
                // Requires costPerDay and daysLeft in the payload
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

            default:
                // For any other general notification data
                title = data.title || title;
                options.body = data.body || options.body;
        }
    }

    // Show the detailed notification using the generated title/options
    event.waitUntil(
        self.registration.showNotification(title, options)
    );
});

// 5. Notification Click: Handle user interaction
self.addEventListener('notificationclick', (event) => {
    console.log('[Service Worker] Notification click received.');
    event.notification.close();

    // The code to open or focus the app window
    event.waitUntil(
        clients.matchAll({ type: 'window' }).then((clientList) => {
            const appUrl = new URL('/', self.location.origin).href;
            
            for (const client of clientList) {
                // If a client window is already open, focus it
                if (client.url.startsWith(appUrl) && 'focus' in client) {
                    return client.focus();
                }
            }
            // If the app is not open, open a new window
            if (clients.openWindow) {
                return clients.openWindow('/');
            }
        })
    );
});
