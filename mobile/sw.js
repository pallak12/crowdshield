// mobile/sw.js - Service Worker for PWA
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open('crowdshield-v1').then(cache => {
            return cache.addAll([
                '/',
                '/index.html',
                '/styles.css',
                '/app.js',
                '/icon-192.png',
                '/icon-512.png'
            ]);
        })
    );
});

// Handle push notifications
self.addEventListener('push', event => {
    const data = event.data.json();
    const options = {
        body: data.message,
        icon: '/icon-192.png',
        badge: '/badge-icon.png',
        vibrate: [200, 100, 200],
        data: {
            url: data.url || '/'
        }
    };
    event.waitUntil(
        self.registration.showNotification(data.title, options)
    );
});
