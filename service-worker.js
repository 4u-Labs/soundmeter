const CACHE_NAME = 'sound-meter-v1.2.1';
const ASSETS = [
    './',
    './index.php',
    './style.css',
    './app.js',
    './manifest.json',
    './icon-192.png',
    './icon-512.png'
];

// Install Service Worker and cache assets
self.addEventListener('install', (e) => {
    e.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS);
        }).then(() => self.skipWaiting())
    );
});

// Activate Service Worker and clean old caches
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

// Fetch cache or network
self.addEventListener('fetch', (e) => {
    e.respondWith(
        caches.match(e.request, { ignoreSearch: true }).then((cachedResponse) => {
            if (cachedResponse) {
                return cachedResponse;
            }
            return fetch(e.request);
        })
    );
});
