self.addEventListener('install', event => {
  console.log('[SW] Installed');
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  console.log('[SW] Activated');
  return self.clients.claim();
});

// Notification Click Handling
self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
      if (clientList.length > 0) {
        clientList[0].focus();
      } else {
        clients.openWindow('./index.html');
      }
    })
  );
});
function getMoonPhaseSW() {
    const now = new Date();
    const synodicMonth = 29.53058867;
    const knownNewMoon = new Date("2000-01-06T18:14:00Z").getTime();

    const daysSince = (now - knownNewMoon) / (1000 * 60 * 60 * 24);
    const phase = daysSince % synodicMonth;

    if (phase < 1.5) return "amavasai";         // 🌑
    if (phase > 13.5 && phase < 16.0) return "pournami"; // 🌕

    return "normal";
}
