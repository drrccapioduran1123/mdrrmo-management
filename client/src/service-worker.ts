/// <reference lib="webworker" />
declare const self: ServiceWorkerGlobalScope;

const CACHE_NAME = 'mdrrmo-v1';
const RUNTIME_CACHE = 'mdrrmo-runtime';
const API_CACHE = 'mdrrmo-api';

// Cache files to be included during build
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
];

// Install event - cache static assets
self.addEventListener('install', (event: ExtendableEvent) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch(() => {
        // Silently fail if assets aren't available yet (build process)
        return Promise.resolve();
      });
    }).then(() => {
      return self.skipWaiting();
    })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event: ExtendableEvent) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE && cacheName !== API_CACHE) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});

// Fetch event - implement caching strategy
self.addEventListener('fetch', (event: FetchEvent) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // API requests - network first, cache as fallback
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Clone the response before caching
          const cloneResponse = response.clone();
          caches.open(API_CACHE).then((cache) => {
            cache.put(request, cloneResponse);
          });
          return response;
        })
        .catch(() => {
          return caches.match(request).then((cached) => {
            if (cached) {
              return cached;
            }
            // Return offline response if no cache
            return new Response(
              JSON.stringify({ error: 'Offline - cached data not available' }),
              { status: 503, statusText: 'Service Unavailable' }
            );
          });
        })
    );
    return;
  }

  // Static assets - cache first, network as fallback
  if (
    url.pathname.match(/\.(js|css|png|jpg|jpeg|gif|svg|woff|woff2|eot|ttf|otf)$/i) ||
    url.pathname === '/' ||
    url.pathname === '/index.html'
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) {
          return cached;
        }
        return fetch(request)
          .then((response) => {
            // Cache successful responses
            if (response && response.status === 200) {
              const cloneResponse = response.clone();
              caches.open(RUNTIME_CACHE).then((cache) => {
                cache.put(request, cloneResponse);
              });
            }
            return response;
          })
          .catch(() => {
            // Return offline page for navigation requests
            if (request.mode === 'navigate') {
              return caches.match('/index.html').then((cached) => {
                if (cached) {
                  return cached;
                }
                return new Response(
                  'Offline - Application shell not available',
                  { status: 503, statusText: 'Service Unavailable' }
                );
              });
            }
            return new Response(
              'Resource not available offline',
              { status: 503, statusText: 'Service Unavailable' }
            );
          });
      })
    );
    return;
  }

  // Default - network first with timeout
  event.respondWith(
    Promise.race([
      fetch(request),
      new Promise<Response>((_, reject) =>
        setTimeout(() => reject(new Error('Network timeout')), 5000)
      ),
    ]).catch(() => {
      return caches.match(request).then((cached) => {
        if (cached) {
          return cached;
        }
        return new Response(
          'Resource not available',
          { status: 503, statusText: 'Service Unavailable' }
        );
      });
    })
  );
});

// Handle messages from clients
self.addEventListener('message', (event: ExtendableMessageEvent) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data && event.data.type === 'CLEAR_CACHE') {
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => caches.delete(cacheName))
      );
    }).then(() => {
      event.ports[0].postMessage({ cleared: true });
    });
  }

  if (event.data && event.data.type === 'GET_CACHE_SIZE') {
    let totalSize = 0;
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) =>
          caches.open(cacheName).then((cache) =>
            cache.keys().then((requests) =>
              Promise.all(
                requests.map((request) =>
                  cache.match(request).then((response) => {
                    if (response) {
                      totalSize += response.headers.get('content-length')
                        ? parseInt(response.headers.get('content-length')!)
                        : 0;
                    }
                  })
                )
              )
            )
          )
        )
      );
    }).then(() => {
      event.ports[0].postMessage({ size: totalSize });
    });
  }
});

export {};
