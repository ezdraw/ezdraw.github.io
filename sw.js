// A version number is useful for managing updates.
// If you change any of the precached assets, you should change the version number.
const CACHE_NAME = 'ez-draw-cache-v1';

// A list of all the files that make up the "app shell" - the minimal resources needed for the app to work.
const PRECACHE_ASSETS = [
    '/', // This caches the root HTML file
    'native.js',
    'ez.png',
    'manifest.webmanifest',
    'draw.html',
    'ez-512x512.png'
];

/**
 * The 'install' event listener.
 * This is fired when the service worker is first installed.
 * We use this opportunity to open a cache and add our app shell files to it.
 */
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Service Worker: Caching App Shell');
                return cache.addAll(PRECACHE_ASSETS);
            })
            .catch(error => {
                console.error('Failed to cache app shell:', error);
            })
    );
});

/**
 * The 'activate' event listener.
 * This is fired after the service worker is installed and ready to take control.
 * We use this to clean up any old caches that are no longer needed,
 * which is important when you release a new version of the service worker.
 */
self.addEventListener('activate', event => {
    // This ensures that the newly activated service worker takes control of the page immediately.
    event.waitUntil(self.clients.claim());

    // Clean up old caches
    const cacheWhitelist = [CACHE_NAME];
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    // If a cache is not in our whitelist, we delete it.
                    if (cacheWhitelist.indexOf(cacheName) === -1) {
                        console.log('Service Worker: Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});


/**
 * The 'fetch' event listener.
 * This is fired every time the app makes a network request (e.g., for a page, script, image, etc.).
 * We can intercept these requests and respond with a cached version if one is available.
 */
self.addEventListener('fetch', event => {
    // We only want to handle GET requests.
    if (event.request.method !== 'GET') {
        return;
    }

    // This is a "Cache, falling back to network" strategy.
    // It's great for offline-first apps.
    event.respondWith(
        caches.match(event.request)
            .then(cachedResponse => {
                // If we found a match in the cache, return it.
                if (cachedResponse) {
                    return cachedResponse;
                }

                // If no match was found, fetch it from the network.
                return fetch(event.request).then(
                    networkResponse => {
                        // Check if we received a valid response.
                        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
                            return networkResponse;
                        }

                        // IMPORTANT: Clone the response. A response is a stream
                        // and because we want the browser to consume the response
                        // as well as the cache consuming the response, we need
                        // to clone it so we have two streams.
                        const responseToCache = networkResponse.clone();

                        caches.open(CACHE_NAME)
                            .then(cache => {
                                // Add the new response to the cache for next time.
                                cache.put(event.request, responseToCache);
                            });

                        return networkResponse;
                    }
                ).catch(error => {
                    console.log('Fetch failed; returning offline page instead.', error);
                    // You could optionally return a fallback offline page here if the fetch fails.
                    // For example: return caches.match('/offline.html');
                });
            })
    );
});
