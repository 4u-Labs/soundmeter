const CACHE_NAME = 'sound-meter-v1.3.1';
const ASSETS = [
    './',
    './index.php',
    './style.css',
    './app.js',
    './manifest.json',
    './icon-192.png',
    './icon-512.png',
    './favicon.png',
    './apple-touch-icon.png'
];

// Install Service Worker and cache assets immediately
self.addEventListener('install', (e) => {
    self.skipWaiting();
    e.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS);
        })
    );
});

// Activate Service Worker and clean old caches immediately
self.addEventListener('activate', (e) => {
    e.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.map((key) => {
                    if (key !== CACHE_NAME) {
                        return caches.delete(key);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// Pure Network-First strategy per 4U.IA standard with offline fallback
self.addEventListener('fetch', (e) => {
    if (e.request.method !== 'GET') return;

    // Do not cache API or external CDN calls with opaque responses
    if (!e.request.url.startsWith(self.location.origin)) {
        return;
    }

    e.respondWith(
        fetch(e.request)
            .then((networkResponse) => {
                if (networkResponse && networkResponse.status === 200) {
                    const responseClone = networkResponse.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(e.request, responseClone);
                    });
                }
                return networkResponse;
            })
            .catch(() => {
                return caches.match(e.request, { ignoreSearch: true });
            })
    );
});
