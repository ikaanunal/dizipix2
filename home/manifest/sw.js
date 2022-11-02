self.addEventListener('install', function(event) {
    event.waitUntil(
        caches.open("_cache").then(function(cache) {
            return cache.addAll(
                ['./', './assets']
            );
        })
    );
})
self.addEventListener('activate', evt => {
})
self.addEventListener('fetch', function(event) {
    event.respondWith(fetch(event.request));
})
        