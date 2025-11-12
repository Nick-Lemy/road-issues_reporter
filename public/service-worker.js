// Service Worker for Dryvupp PWA
const CACHE_VERSION = 'v2.0.0'; // Increment this to force cache refresh
const CACHE_NAME = `dryvupp-${CACHE_VERSION}`;
const urlsToCache = [
    '/',
    '/index.html',
    '/manifest.json',
];

// Install event - cache essential files
self.addEventListener('install', (event) => {
    console.log('[Service Worker] Installing version:', CACHE_VERSION);
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[Service Worker] Caching app shell');
                return cache.addAll(urlsToCache);
            })
            .then(() => {
                console.log('[Service Worker] Skip waiting - activate immediately');
                return self.skipWaiting();
            })
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    console.log('[Service Worker] Activating version:', CACHE_VERSION);
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
        }).then(() => {
            console.log('[Service Worker] Claiming clients');
            return self.clients.claim();
        }).then(() => {
            // Notify all clients about the update
            return self.clients.matchAll().then((clients) => {
                clients.forEach((client) => {
                    client.postMessage({
                        type: 'CACHE_UPDATED',
                        version: CACHE_VERSION
                    });
                });
            });
        })
    );
});

// Fetch event - Network first, then cache for API calls, Cache first for static assets
self.addEventListener('fetch', (event) => {
    // Skip cross-origin requests
    if (!event.request.url.startsWith(self.location.origin)) {
        return;
    }

    // For HTML requests, use network first strategy to get updates
    if (event.request.mode === 'navigate' || event.request.destination === 'document') {
        event.respondWith(
            fetch(event.request)
                .then((response) => {
                    // Clone and cache the response
                    const responseToCache = response.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, responseToCache);
                    });
                    return response;
                })
                .catch(() => {
                    // Fallback to cache if network fails
                    return caches.match(event.request);
                })
        );
        return;
    }

    // For other requests, use cache first strategy
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                // Cache hit - return response
                if (response) {
                    return response;
                }

                // Clone the request
                const fetchRequest = event.request.clone();

                return fetch(fetchRequest).then((response) => {
                    // Check if valid response
                    if (!response || response.status !== 200 || response.type !== 'basic') {
                        return response;
                    }

                    // Clone the response
                    const responseToCache = response.clone();

                    // Cache the new response
                    caches.open(CACHE_NAME)
                        .then((cache) => {
                            cache.put(event.request, responseToCache);
                        });

                    return response;
                }).catch(() => {
                    // Return offline page or cached response
                    return caches.match('/index.html');
                });
            })
    );
});

// Push notification event
self.addEventListener('push', (event) => {
    console.log('[Service Worker] Push received:', event);

    const options = {
        body: event.data ? event.data.text() : 'New road update available',
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-72x72.png',
        vibrate: [200, 100, 200],
        tag: 'road-update',
        requireInteraction: false,
    };

    event.waitUntil(
        self.registration.showNotification('Dryvupp Update', options)
    );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
    console.log('[Service Worker] Notification clicked:', event);
    event.notification.close();

    event.waitUntil(
        self.clients.openWindow('/')
    );
});
