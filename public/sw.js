const STATIC_CACHE_NAME = "yasashi-static-v3";
const NAVIGATION_CACHE_NAME = "yasashi-navigation-v1";
const OFFLINE_FALLBACK_URL = "/offline.html";

const STATIC_ASSETS = [
  "/",
  OFFLINE_FALLBACK_URL,
  "/manifest.webmanifest",
  "/favicon.ico",
  "/apple-touch-icon.png",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/assets/hero/hero-watercolor.webp",
  "/assets/hero/hero-watercolor-dark.webp",
  "/assets/states/state-empty.webp",
  "/assets/states/state-complete.webp",
  "/assets/review/review-streak.webp"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE_NAME)
      .then((cache) => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(
        keys
          .filter((key) => key !== STATIC_CACHE_NAME && key !== NAVIGATION_CACHE_NAME)
          .map((key) => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

async function networkFirstNavigation(request) {
  const cache = await caches.open(NAVIGATION_CACHE_NAME);

  try {
    const response = await fetch(request);
    if (response.ok && response.type === "basic") {
      await cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await cache.match(request);
    if (cached) return cached;
    return caches.match(OFFLINE_FALLBACK_URL);
  }
}

async function cacheFirstStaticAsset(request, requestUrl) {
  const cached = await caches.match(request);
  if (cached) return cached;

  const response = await fetch(request);
  const copy = response.clone();
  const isAnimCjkSvg = requestUrl.pathname.startsWith("/animcjk/") && requestUrl.pathname.endsWith(".svg");
  const isStaticAsset =
    request.destination === "image" ||
    request.destination === "style" ||
    request.destination === "script" ||
    isAnimCjkSvg;

  if (response.ok && isStaticAsset) {
    const cache = await caches.open(STATIC_CACHE_NAME);
    await cache.put(request, copy);
  }

  return response;
}

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const requestUrl = new URL(request.url);

  if (request.method !== "GET") return;
  if (requestUrl.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith(networkFirstNavigation(request));
    return;
  }

  event.respondWith(cacheFirstStaticAsset(request, requestUrl).catch(() => Response.error()));
});
