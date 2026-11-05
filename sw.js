/**
 * VLAN Defense & Memory Crisis - Service Worker
 * Offline Caching for Computer Science Lab Sessions
 */

const CACHE_NAME = "vlan-memory-crisis-v1";
const ASSETS_TO_CACHE = [
    "./",
    "./index.html",
    "./vlan-defense.html",
    "./memory-crisis.html",
    "./lab-guide.html",
    "./manifest.json",
    "./css/style.css",
    "./js/supabase-config.js",
    "./js/audio.js",
    "./js/vlan-3d.js",
    "./js/vlan-game.js",
    "./js/memory-3d.js",
    "./js/memory-game.js",
    "https://cdn.tailwindcss.com",
    "https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js",
    "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"
];

self.addEventListener("install", (e) => {
    e.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log("⚡ Caching Network & Cloud Lab Simulator Assets");
            return cache.addAll(ASSETS_TO_CACHE).catch(err => console.warn("Caching fallback:", err));
        })
    );
    self.skipWaiting();
});

self.addEventListener("activate", (e) => {
    e.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
            );
        })
    );
    self.clients.claim();
});

self.addEventListener("fetch", (e) => {
    if (e.request.method !== "GET" || e.request.url.includes("supabase.co")) return;

    e.respondWith(
        caches.match(e.request).then((cachedResponse) => {
            if (cachedResponse) return cachedResponse;
            return fetch(e.request).then((networkResponse) => {
                if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== "basic") {
                    return networkResponse;
                }
                const responseToCache = networkResponse.clone();
                caches.open(CACHE_NAME).then((cache) => {
                    cache.put(e.request, responseToCache);
                });
                return networkResponse;
            }).catch(() => {
                if (e.request.headers.get("accept").includes("text/html")) {
                    return caches.match("./index.html");
                }
            });
        })
    );
});
