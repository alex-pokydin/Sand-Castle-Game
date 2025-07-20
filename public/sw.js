// Service Worker for Sand Castle Game PWA
const CACHE_NAME = 'sand-castle-game-v1.0.0';
const STATIC_CACHE = 'sand-castle-static-v1.0.0';
const DYNAMIC_CACHE = 'sand-castle-dynamic-v1.0.0';

// Files to cache for offline functionality
const STATIC_FILES = [
  '/',
  '/index.html',
  '/manifest.json',
  '/assets/castle-parts.svg',
  '/assets/sounds/effects/drop.wav',
  '/assets/sounds/effects/place-good.wav',
  '/assets/sounds/effects/place-perfect.wav',
  '/assets/sounds/effects/wobble.wav',
  '/assets/sounds/effects/collapse.wav',
  '/assets/sounds/effects/level-complete.wav',
  '/assets/sounds/music/beach-ambient.mp3'
];

// Install event - cache static files
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('Service Worker: Caching static files');
        return cache.addAll(STATIC_FILES);
      })
      .then(() => {
        console.log('Service Worker: Static files cached');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('Service Worker: Error caching static files:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
              console.log('Service Worker: Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('Service Worker: Activated');
        return self.clients.claim();
      })
  );
});

// Fetch event - serve from cache or network
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Handle different types of requests
  if (url.pathname === '/' || url.pathname === '/index.html') {
    // Main page - try cache first, then network
    event.respondWith(
      caches.match(request)
        .then((response) => {
          if (response) {
            return response;
          }
          return fetch(request)
            .then((fetchResponse) => {
              // Cache the response for future use
              const responseClone = fetchResponse.clone();
              caches.open(DYNAMIC_CACHE)
                .then((cache) => {
                  cache.put(request, responseClone);
                });
              return fetchResponse;
            });
        })
    );
  } else if (url.pathname.startsWith('/assets/')) {
    // Assets - cache first strategy
    event.respondWith(
      caches.match(request)
        .then((response) => {
          if (response) {
            return response;
          }
          return fetch(request)
            .then((fetchResponse) => {
              // Cache successful responses
              if (fetchResponse.status === 200) {
                const responseClone = fetchResponse.clone();
                caches.open(STATIC_CACHE)
                  .then((cache) => {
                    cache.put(request, responseClone);
                  });
              }
              return fetchResponse;
            })
            .catch(() => {
              // Return fallback for failed asset requests
              if (url.pathname.includes('.wav') || url.pathname.includes('.mp3')) {
                return new Response('', { status: 404 });
              }
            });
        })
    );
  } else {
    // Other requests - network first, cache fallback
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache successful responses
          if (response.status === 200) {
            const responseClone = response.clone();
            caches.open(DYNAMIC_CACHE)
              .then((cache) => {
                cache.put(request, responseClone);
              });
          }
          return response;
        })
        .catch(() => {
          return caches.match(request);
        })
    );
  }
});

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('Service Worker: Background sync triggered:', event.tag);
  
  if (event.tag === 'background-sync') {
    event.waitUntil(
      // Handle any background sync tasks
      Promise.resolve()
    );
  }
});

// Push notification handling
self.addEventListener('push', (event) => {
  console.log('Service Worker: Push notification received');
  
  const options = {
    body: event.data ? event.data.text() : 'New castle challenge available!',
    icon: '/assets/icons/icon-192x192.png',
    badge: '/assets/icons/icon-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'play',
        title: 'Play Now',
        icon: '/assets/icons/play-icon-96x96.png'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/assets/icons/close-icon-96x96.png'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification('Sand Castle Game', options)
  );
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  console.log('Service Worker: Notification clicked:', event.action);
  
  event.notification.close();
  
  if (event.action === 'play') {
    event.waitUntil(
      clients.openWindow('/?action=play')
    );
  }
});

// Message handling from main thread
self.addEventListener('message', (event) => {
  console.log('Service Worker: Message received:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CACHE_GAME_DATA') {
    event.waitUntil(
      caches.open(DYNAMIC_CACHE)
        .then((cache) => {
          return cache.put('/game-data', new Response(JSON.stringify(event.data.data)));
        })
    );
  }
});

// Error handling
self.addEventListener('error', (event) => {
  console.error('Service Worker: Error:', event.error);
});

// Unhandled rejection handling
self.addEventListener('unhandledrejection', (event) => {
  console.error('Service Worker: Unhandled rejection:', event.reason);
}); 