self.addEventListener('install', event => {
  event.waitUntil(
    caches.open('pwa-cache').then(cache => {
      return cache.addAll(['./', './index.html']);
    })
  );
});

// service-worker.js

self.addEventListener('push', (event) => {
    // 1. Get the payload (detailed reminder data) from the server or simulated push
    const data = event.data ? event.data.json() : {};
    
    // Fallback title for a generic push or aggregation
    let title = 'Nothing Reminder App Notification';
    let options = {
        body: 'You have new activity. Open the app for details.',
        icon: 'assets/icon.png'
    };

    // 2. Process the push payload for detailed notifications
    if (data.type) {
        switch (data.type) {
            case 'REMINDER_DUE':
                // This payload comes from your backend/simulated trigger
                title = `⏰ REMINDER EXPIRED/DUE: ${data.title}`;
                options.body = data.details; // e.g., "End date: 24/10/2025"
                options.tag = 'reminder-notification'; // Group notifications by type
                options.badge = 'assets/icon.png';
                break;
            
            case 'BUDGET_OVERVIEW':
                title = `💰 Budget Alert: ${data.title}`;
                options.body = `Daily limit: ₹${data.costPerDay} | Days Left: ${data.daysLeft}`;
                options.tag = 'budget-notification';
                break;
                
            case 'CHECKLIST_OPEN':
                title = `✒ Checklist: ${data.title} is Open`;
                options.body = data.details;
                options.tag = 'checklist-notification';
                break;
                
            case 'NOTE_UPDATE':
                title = `📝 Note Updated/Reminder: ${data.title}`;
                options.body = data.details;
                options.tag = 'note-notification';
                break;

            default:
                // For any other general notification
                title = data.title || title;
                options.body = data.body || options.body;
        }
    }

    // 3. Show the detailed notification
    event.waitUntil(
        self.registration.showNotification(title, options)
    );
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    // Open the app when the user clicks the notification
    event.waitUntil(
        clients.matchAll({ type: 'window' }).then((clientList) => {
            for (const client of clientList) {
                if (client.url.includes('index.html') && 'focus' in client) {
                    return client.focus();
                }
            }
            // If no window is open, open a new one
            if (clients.openWindow) {
                return clients.openWindow('/');
            }
        })
    );
});
