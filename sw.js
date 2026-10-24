const CACHE = "odv-v3";
const FILES = ["/", "/manifest.webmanifest", "/icon-192.png", "/icon-512.png"];
self.addEventListener("install", e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting())); });
self.addEventListener("activate", e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener("fetch", e => {
  const u = new URL(e.request.url);
  if (e.request.method !== "GET" || u.origin !== location.origin) return;
  e.respondWith(fetch(e.request).then(r => { const copy = r.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); return r; }).catch(() => caches.match(e.request, { ignoreSearch: true })));
});
/* Alertas: aviso flotante + vibración */
self.addEventListener("push", e => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch (err) { d = { body: e.data ? e.data.text() : "" }; }
  const title = d.title || "Ópticas del Valle";
  e.waitUntil(self.registration.showNotification(title, {
    body: d.body || "Tienes una nueva respuesta.",
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    tag: d.tag || "odv",
    renotify: true,
    silent: false,
    requireInteraction: false,
    vibrate: [200, 100, 200, 100, 300],
    data: { url: d.url || "/" }
  }));
});
self.addEventListener("notificationclick", e => {
  e.notification.close();
  const url = (e.notification.data && e.notification.data.url) || "/";
  const tab = (url.split("#")[1]) || "";
  e.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(cs => {
    for (const c of cs) { if ("focus" in c) { c.postMessage({ tipo: "abrir", tab }); return c.focus(); } }
    return self.clients.openWindow(url);
  }));
});
