/*
 * Apolaki Solar Platform - Service Worker
 * PRD 9: Web Push Notifications for Messaging
 */

// Cache version — bump to force old SW to clear
const CACHE_VERSION = 'v3'

// Handle messages from the app (e.g. skipWaiting, ping)
self.addEventListener('message', function(event) {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
  // Always respond so the message channel closes cleanly
  if (event.ports && event.ports[0]) {
    event.ports[0].postMessage({ received: true })
  }
})

// Activate immediately and claim clients so the new SW takes over
self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_VERSION)
          .map(key => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  )
})

self.addEventListener('push', function(event) {
  if (!event.data) return

  try {
    const data = event.data.json()
    const options = {
      body: data.body || 'You have a new message in Apolaki.',
      icon: '/philippines.svg', // Use existing local SVG logo
      badge: '/philippines.svg',
      data: {
        url: data.url || '/messaging',
        conversationId: data.conversationId
      },
      tag: data.conversationId ? `msg-${data.conversationId}` : 'apolaki-notification',
      renotify: true
    }

    event.waitUntil(
      self.registration.showNotification(data.title || 'New Message', options)
    )
  } catch (err) {
    console.error('Error processing push event:', err)
  }
})

self.addEventListener('notificationclick', function(event) {
  event.notification.close()

  const urlToOpen = new URL(event.notification.data.url, self.location.origin).href

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i]
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus()
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen)
      }
    })
  )
})
