// Service Worker for Native Background Notifications & Web Push
const CACHE_NAME = 'ptm-sw-v2';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Handle incoming Web Push even when the browser or website is completely closed
self.addEventListener('push', (event) => {
  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data = { message: event.data.text() };
    }
  }

  const title = data.title || (data.priority === 'urgent' ? '🚨 Urgent Office Alert' : '📢 Announcement from Admin');
  const message = data.message || 'You have received an official team alert.';
  const targetUrl = data.url || '/';

  const options = {
    body: message,
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    vibrate: data.priority === 'urgent' ? [400, 150, 400, 150, 600] : [200, 100, 200, 100, 200],
    sound: '/sounds/notification.mp3',
    tag: data.id || 'ptm-alert-' + Date.now(),
    renotify: true,
    requireInteraction: true,
    data: {
      url: targetUrl,
      alertId: data.id,
      timestamp: Date.now(),
    },
    actions: [
      { action: 'open', title: 'Open App' },
      { action: 'dismiss', title: 'Dismiss' },
    ],
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Notification Click Handler - Focus existing app window or open a new window
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'dismiss') {
    return;
  }

  const targetUrl = (event.notification.data && event.notification.data.url) || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url && 'focus' in client) {
          if ('navigate' in client && client.url.indexOf(targetUrl) === -1) {
            client.navigate(targetUrl);
          }
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});

// Direct background sync fallback check
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'check-alerts') {
    event.waitUntil(checkUnreadAlertsFromCloud());
  }
});

async function checkUnreadAlertsFromCloud() {
  try {
    const supabaseUrl = 'https://zqkxzvmfiuqcxwqhpldf.supabase.co';
    const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpxa3h6dm1maXVxY3h3cWhwbGRmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE5NTgzMjcsImV4cCI6MjEwNzUzNDMyN30.EPUbgimgroe1_ULsKBK7S2j4KSG4DZxTsowA8IXxCHw';

    const res = await fetch(`${supabaseUrl}/rest/v1/office_rules?category=eq.Broadcast Alert&order=created_at.desc&limit=1`, {
      headers: {
        'apikey': anonKey,
        'Authorization': `Bearer ${anonKey}`,
      },
    });

    if (!res.ok) return;
    const items = await res.json();
    if (!items || items.length === 0) return;

    const latest = items[0];
    if (!latest.description) return;
    const alertData = JSON.parse(latest.description);

    // Only show if alert is under 15 minutes old
    const alertTime = new Date(alertData.createdAt || latest.created_at).getTime();
    if (Date.now() - alertTime > 15 * 60 * 1000) return;

    // Check if recently shown in cache
    const cache = await caches.open(CACHE_NAME);
    const cacheKey = `alert_${latest.id}`;
    const cached = await cache.match(cacheKey);
    if (cached) return;

    await cache.put(cacheKey, new Response('shown'));

    await self.registration.showNotification(alertData.title || 'Official Office Alert', {
      body: alertData.message || 'You have an unread team announcement.',
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      vibrate: [300, 100, 300, 100, 300],
      sound: '/sounds/notification.mp3',
      tag: latest.id,
      renotify: true,
      data: { url: alertData.targetType === 'individual' ? '/member' : '/' },
    });
  } catch (e) {
    // silent fallback
  }
}
