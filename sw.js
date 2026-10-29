/* Forged in Exile service worker: makes the game playable offline.
   Bump VERSION whenever index.html changes so players get the update. */
const VERSION = "forged-v25";
const CORE = ["./", "./index.html", "./book2.html", "./book3.html", "./transfer.html", "./manifest.webmanifest",
  "./icons/icon-192.png", "./icons/icon-512.png", "./icons/icon-maskable-512.png", "./icons/apple-touch-icon.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  // the game page: network first so updates arrive, cache as fallback when offline
  if (req.mode === "navigate") {
    const page = /book2\.html$/.test(url.pathname) ? "./book2.html" : /book3\.html$/.test(url.pathname) ? "./book3.html" : "./index.html";
    e.respondWith(fetch(req).then(r => { const copy = r.clone(); caches.open(VERSION).then(c => c.put(page, copy)); return r; })
      .catch(() => caches.match(page)));
    return;
  }
  // fonts and icons: cache first, then save anything new
  e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(r => {
    if (r && (r.ok || r.type === "opaque") && (url.origin === location.origin || /fonts\.(googleapis|gstatic)\.com$/.test(url.hostname))) {
      const copy = r.clone(); caches.open(VERSION).then(c => c.put(req, copy));
    }
    return r;
  })));
});
