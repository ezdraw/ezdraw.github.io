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
    'ez-512x512.png',
    'offline.html' // Added offline fallback page
];

/**
 * The 'install' event listener.
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
 */
self.addEventListener('activate', event => {
    event.waitUntil(self.clients.claim());

    const cacheWhitelist = [CACHE_NAME];
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
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
 */
self.addEventListener('fetch', event => {
    if (event.request.method !== 'GET') {
        return;
    }

    event.respondWith(
        caches.match(event.request)
            .then(cachedResponse => {
                if (cachedResponse) {
                    return cachedResponse;
                }

                return fetch(event.request).then(
                    networkResponse => {
                        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
                            return networkResponse;
                        }

                        const responseToCache = networkResponse.clone();

                        caches.open(CACHE_NAME)
                            .then(cache => {
                                cache.put(event.request, responseToCache);
                            });

                        return networkResponse;
                    }
                ).catch(error => {
                    console.log('Fetch failed; returning offline page instead.', error);
                    // If the fetch fails, return the offline page from the cache.
                    return caches.match('offline.html');
                });
            })
    );
});
