/* English Daily - офлайн-кэш. При обновлении файлов увеличь версию. */
const CACHE = "eng-v3";
const FILES = [
  ".", "index.html", "manifest.webmanifest", "icon.svg",
  "js/core.js", "js/modules.js",
  "data/words.js", "data/words-biz.js", "data/words-lexis.js",
  "data/reading.js", "data/grammar.js", "data/writing.js", "data/speaking.js"
];
self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((keys) =>
    Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
  ).then(() => self.clients.claim()));
});
self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  e.respondWith(
    fetch(e.request).then((res) => {
      const copy = res.clone();
      caches.open(CACHE).then((c) => c.put(e.request, copy)).catch(() => {});
      return res;
    }).catch(() => caches.match(e.request, { ignoreSearch: true }))
  );
});
