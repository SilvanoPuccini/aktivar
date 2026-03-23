// Aktivar Push Notifications Service Worker

const CACHE_NAME = 'aktivar-notifications-v1';

// Handle push events from the server
self.addEventListener('push', (event) => {
  let data = {
    title: 'Aktivar',
    body: 'Tienes una nueva notificación',
    icon: '/favicon.svg',
    badge: '/favicon.svg',
    url: '/',
  };

  if (event.data) {
    try {
      const payload = event.data.json();
      data = {
        title: payload.title || data.title,
        body: payload.body || data.body,
        icon: payload.icon || data.icon,
        badge: payload.badge || data.badge,
        url: payload.url || data.url,
      };
    } catch {
      // If JSON parsing fails, use the text
      data.body = event.data.text() || data.body;
    }
  }

  const options = {
    body: data.body,
    icon: data.icon,
    badge: data.badge,
    vibrate: [100, 50, 100],
    data: {
      url: data.url,
      dateOfArrival: Date.now(),
    },
    actions: [
      {
        action: 'open',
        title: 'Ver',
      },
      {
        action: 'dismiss',
        title: 'Cerrar',
      },
    ],
    tag: 'aktivar-notification',
    renotify: true,
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});

// Handle notification click events
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const action = event.action;
  const notificationData = event.notification.data;

  if (action === 'dismiss') {
    return;
  }

  // Open the relevant page when the notification is clicked
  const targetUrl = notificationData?.url || '/';

  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // If there's already a window open, navigate it
        for (const client of clientList) {
          if ('focus' in client) {
            client.focus();
            client.navigate(targetUrl);
            return;
          }
        }
        // Otherwise open a new window
        if (self.clients.openWindow) {
          return self.clients.openWindow(targetUrl);
        }
      })
  );
});

// Handle notification close events (for analytics)
self.addEventListener('notificationclose', (event) => {
  // Could send analytics data here
  console.log('[SW] Notification closed:', event.notification.tag);
});

// Service worker install
self.addEventListener('install', () => {
  self.skipWaiting();
});

// Service worker activate
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      )
    )
  );
  self.clients.claim();
});
