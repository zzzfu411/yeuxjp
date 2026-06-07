const CACHE_NAME = "yasashi-static-v1";

const STATIC_ASSETS = [
  "/",
  "/offline.html",
  "/manifest.webmanifest",
  "/favicon.ico",
  "/apple-touch-icon.png",
  "/assets/hero/hero-watercolor.webp",
  "/assets/hero/hero-watercolor-dark.webp",
  "/assets/states/state-empty.webp",
  "/assets/states/state-complete.webp",
  "/assets/review/review-streak.webp"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;

  if (request.method !== "GET") return;
  if (!request.url.startsWith(self.location.origin)) return;

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;

      return fetch(request)
        .then((response) => {
          const copy = response.clone();
          const isAnimCjkSvg = new URL(request.url).pathname.startsWith("/animcjk/") && request.url.endsWith(".svg");
          const isStaticAsset =
            request.destination === "image" ||
            request.destination === "style" ||
            request.destination === "script" ||
            isAnimCjkSvg;

          if (response.ok && isStaticAsset) {
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(() => {
          if (request.mode === "navigate") return caches.match("/offline.html");
          return Response.error();
        });
    })
  );
});
