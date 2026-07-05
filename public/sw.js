const CACHE_VERSION = "v7";
const STATIC_CACHE_NAME = `yasashi-static-${CACHE_VERSION}`;
const NAVIGATION_CACHE_NAME = `yasashi-navigation-${CACHE_VERSION}`;
const APP_CACHE_PREFIXES = ["yasashi-static-", "yasashi-navigation-"];
const OFFLINE_FALLBACK_URL = "/offline.html";
const NAVIGATION_CACHE_MAX_ENTRIES = 40;

const CORE_STATIC_ASSETS = [
  "/",
  OFFLINE_FALLBACK_URL,
  "/manifest.webmanifest"
];

const STATIC_ASSETS = [
  ...CORE_STATIC_ASSETS,
  "/favicon.ico",
  "/apple-touch-icon.png",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/brand/logo-mark.svg",
  "/brand/logo-wordmark.svg",
  "/assets/hero/hero-watercolor.webp",
  "/assets/hero/hero-watercolor@2x.webp",
  "/assets/hero/hero-watercolor-dark.webp",
  "/assets/hero/hero-watercolor-dark@2x.webp",
  "/assets/kana/kana-seion.webp",
  "/assets/kana/kana-seion@2x.webp",
  "/assets/kana/kana-dakuon.webp",
  "/assets/kana/kana-dakuon@2x.webp",
  "/assets/kana/kana-yoon.webp",
  "/assets/kana/kana-yoon@2x.webp",
  "/assets/kana/kana-sokuon.webp",
  "/assets/kana/kana-sokuon@2x.webp",
  "/assets/kana/kana-all.webp",
  "/assets/kana/kana-all@2x.webp",
  "/assets/states/state-empty.webp",
  "/assets/states/state-empty@2x.webp",
  "/assets/states/state-complete.webp",
  "/assets/states/state-complete@2x.webp",
  "/assets/review/review-streak.webp",
  "/assets/review/review-streak@2x.webp",
  "/assets/textures/paper-washi-tile.png",
  "/assets/vocab-categories/greetings.webp",
  "/assets/vocab-categories/food.webp",
  "/assets/vocab-categories/nature.webp",
  "/assets/vocab-categories/daily.webp",
  "/assets/vocab-categories/numbers.webp"
];

const CACHEABLE_STATIC_PATH_PREFIXES = [
  "/_next/static/",
  "/_next/image",
  "/assets/",
  "/icons/",
  "/brand/"
];

const CACHEABLE_STATIC_EXACT_PATHS = new Set([
  "/manifest.webmanifest",
  "/favicon.ico",
  "/apple-touch-icon.png"
]);

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE_NAME)
      .then((cache) => cache.addAll(CORE_STATIC_ASSETS).then(() => cache))
      .then((cache) => Promise.allSettled(
        STATIC_ASSETS
          .filter((asset) => !CORE_STATIC_ASSETS.includes(asset))
          .map((asset) => cache.add(asset))
      ))
  );
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

function isOutdatedAppCache(cacheName) {
  return APP_CACHE_PREFIXES.some((prefix) => cacheName.startsWith(prefix)) &&
    cacheName !== STATIC_CACHE_NAME &&
    cacheName !== NAVIGATION_CACHE_NAME;
}

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(
        keys
          .filter(isOutdatedAppCache)
          .map((key) => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

async function tryCachePut(cache, request, response) {
  try {
    await cache.put(request, response);
  } catch {
    // Cache writes are best effort and must not block a valid network response.
  }
}

function isCacheableStaticAsset(request, requestUrl) {
  const isAnimCjkSvg = requestUrl.pathname.startsWith("/animcjk/") && requestUrl.pathname.endsWith(".svg");
  const isAllowedPath = CACHEABLE_STATIC_EXACT_PATHS.has(requestUrl.pathname) ||
    CACHEABLE_STATIC_PATH_PREFIXES.some((prefix) => requestUrl.pathname.startsWith(prefix)) ||
    isAnimCjkSvg;
  return isAllowedPath && (
    request.destination === "image" ||
    request.destination === "style" ||
    request.destination === "script" ||
    requestUrl.pathname === "/manifest.webmanifest" ||
    isAnimCjkSvg
  );
}

function getCanonicalNavigationUrl(requestUrl) {
  if (!requestUrl.search && !requestUrl.hash) return null;
  return new URL(requestUrl.pathname, self.location.origin).href;
}

async function matchCachedNavigation(cache, request, requestUrl) {
  const cached = await cache.match(request);
  if (cached) return cached;

  const canonicalUrl = getCanonicalNavigationUrl(requestUrl);
  if (!canonicalUrl) return null;

  return cache.match(canonicalUrl);
}

async function cacheNavigationResponse(cache, request, requestUrl, response) {
  await tryCachePut(cache, request, response.clone());

  const canonicalUrl = getCanonicalNavigationUrl(requestUrl);
  if (canonicalUrl) {
    await tryCachePut(cache, canonicalUrl, response.clone());
  }

  await trimNavigationCache(cache);
}

async function trimNavigationCache(cache) {
  try {
    const keys = await cache.keys();
    const overflow = keys.length - NAVIGATION_CACHE_MAX_ENTRIES;
    if (overflow <= 0) return;
    await Promise.all(keys.slice(0, overflow).map((request) => cache.delete(request)));
  } catch {
    // Cache pruning is best effort; navigation should still succeed.
  }
}

async function matchNavigationFallback(cache, staticCache, request, requestUrl) {
  const cached = await matchCachedNavigation(cache, request, requestUrl);
  if (cached) return cached;
  const staticCached = await matchCachedNavigation(staticCache, request, requestUrl);
  if (staticCached) return staticCached;
  return staticCache.match(OFFLINE_FALLBACK_URL);
}

async function networkFirstNavigation(request) {
  const cache = await caches.open(NAVIGATION_CACHE_NAME);
  const staticCache = await caches.open(STATIC_CACHE_NAME);
  const requestUrl = new URL(request.url);

  try {
    const response = await fetch(request);
    if (response.ok && response.type === "basic") {
      await cacheNavigationResponse(cache, request, requestUrl, response);
    }
    if (response.status >= 500) {
      const fallback = await matchNavigationFallback(cache, staticCache, request, requestUrl);
      if (fallback) return fallback;
    }
    return response;
  } catch {
    return matchNavigationFallback(cache, staticCache, request, requestUrl);
  }
}

async function refreshStaticAssetCache(request, requestUrl) {
  if (!isCacheableStaticAsset(request, requestUrl)) return;

  try {
    const response = await fetch(request, { cache: "no-cache" });
    if (!response.ok) return;
    const cache = await caches.open(STATIC_CACHE_NAME);
    await tryCachePut(cache, request, response.clone());
  } catch {
    // Static asset refresh is best effort so cached assets remain usable offline.
  }
}

async function cacheFirstStaticAsset(request, requestUrl, event) {
  if (!isCacheableStaticAsset(request, requestUrl)) {
    return fetch(request);
  }

  const cache = await caches.open(STATIC_CACHE_NAME);
  const cached = await cache.match(request);
  if (cached) {
    event.waitUntil(refreshStaticAssetCache(request, requestUrl));
    return cached;
  }

  const response = await fetch(request);
  if (response.ok) {
    await tryCachePut(cache, request, response.clone());
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

  event.respondWith(cacheFirstStaticAsset(request, requestUrl, event).catch(() => Response.error()));
});
