// service-worker.js

// --- Caching Strategy ---
const CACHE_NAME = 'nothing-reminder-cache-v1';
// List of files to pre-cache on install
const urlsToCache = [
    './',
    './index.html',
    'assets/icon.png', // Assuming this path is correct for your app's icon
    'manifest.json'
    // Add other essential static assets (CSS, JS if they were separate files) here
];

self.addEventListener('install', (event) => {
    // Perform installation steps
    console.log('[Service Worker] Install');
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('[Service Worker] Caching app shell');
            return cache.addAll(urlsToCache);
        })
    );
});

self.addEventListener('activate', (event) => {
    // Claim control of clients immediately on activation
    console.log('[Service Worker] Activate');
    event.waitUntil(self.clients.claim());
});

// --- Fetch Strategy (Serve cached content first, fall back to network) ---
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request).then((response) => {
            // Cache hit - return response
            if (response) {
                return response;
            }
            // Not in cache - fetch from network
            return fetch(event.request);
        })
    );
});


// --- Push Notification Logic (Detailed Mobile Notifications) ---

self.addEventListener('push', (event) => {
    console.log('[Service Worker] Push Received');
    
    // 1. Get the payload (detailed data) from the server/push provider
    const data = event.data ? event.data.json() : {};
    
    // Fallback/Default settings
    let title = 'Nothing Reminder App Notification';
    let options = {
        body: 'You have new activity. Open the app for details.',
        icon: 'assets/icon.png',
        badge: 'assets/icon.png',
        data: {
            urlToOpen: '/' // Default page to open on click
        }
    };

    // 2. Process the push payload for detailed notifications
    if (data.type) {
        switch (data.type) {
            case 'REMINDER_DUE':
                title = `⏰ REMINDER DUE/EXPIRED: ${data.title}`;
                options.body = data.details || `Expires on: ${data.endDate}`;
                options.tag = 'reminder-notification';
                options.renotify = true; // Ensures OS shows a new notification even if one exists with the same tag
                break;
            
            case 'BUDGET_OVERVIEW':
                title = `💰 Budget Alert: ${data.title}`;
                options.body = `Daily limit: ₹${data.costPerDay} | Days Left: ${data.daysLeft}`;
                options.tag = 'budget-notification';
                options.renotify = true;
                break;
                
            case 'CHECKLIST_OPEN':
                title = `✒ Checklist: ${data.title} is Open`;
                options.body = data.details || 'Time to complete your tasks!';
                options.tag = 'checklist-notification';
                options.renotify = true;
                break;
                
            case 'NOTE_UPDATE':
                title = `📝 Note Updated/Reminder: ${data.title}`;
                options.body = data.details || 'Check the recent changes to your note.';
                options.tag = 'note-notification';
                options.renotify = true;
                break;

            default:
                // Use generic data if type is unknown
                title = data.title || title;
                options.body = data.body || options.body;
        }
    }

    // 3. Show the detailed notification
    event.waitUntil(
        self.registration.showNotification(title, options)
    );
});

// --- Notification Click Handling ---
self.addEventListener('notificationclick', (event) => {
    console.log('[Service Worker] Notification click received');
    event.notification.close();

    const urlToOpen = event.notification.data ? event.notification.data.urlToOpen : '/';

    // Open the app or focus the existing tab when the user clicks the notification
    event.waitUntil(
        clients.matchAll({ type: 'window' }).then((clientList) => {
            // Try to find an existing client (tab) that is already open
            for (const client of clientList) {
                if (client.url.includes(urlToOpen) && 'focus' in client) {
                    return client.focus();
                }
            }
            // If no window is open, open a new one
            if (clients.openWindow) {
                return clients.openWindow(urlToOpen);
            }
        })
    );
});
