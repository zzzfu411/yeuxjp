const CACHE_VERSION = "v8";
const SHELL_CACHE_NAME = `yasashi-shell-${CACHE_VERSION}`;
const NAVIGATION_CACHE_NAME = `yasashi-navigation-${CACHE_VERSION}`;
const RUNTIME_CACHE_NAME = `yasashi-runtime-${CACHE_VERSION}`;
const APP_CACHE_PREFIXES = [
  "yasashi-static-",
  "yasashi-shell-",
  "yasashi-navigation-",
  "yasashi-runtime-"
];
const CURRENT_APP_CACHE_NAMES = new Set([
  SHELL_CACHE_NAME,
  NAVIGATION_CACHE_NAME,
  RUNTIME_CACHE_NAME
]);
const OFFLINE_FALLBACK_URL = "/offline.html";
const NAVIGATION_CACHE_MAX_ENTRIES = 40;
const NAVIGATION_NETWORK_TIMEOUT_MS = 4_000;
const RUNTIME_CACHE_MAX_ENTRIES = 64;
const MAX_WARM_URLS = 128;

const CORE_SHELL_ASSETS = [
  "/",
  OFFLINE_FALLBACK_URL,
  "/manifest.webmanifest"
];

const RUNTIME_ASSETS = [
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

const SHELL_ASSET_PATHS = new Set(CORE_SHELL_ASSETS);
const RUNTIME_ASSET_PATHS = new Set(RUNTIME_ASSETS);
const RUNTIME_PATH_PREFIXES = [
  "/_next/image",
  "/animcjk/",
  "/assets/",
  "/brand/",
  "/icons/"
];

self.addEventListener("install", (event) => {
  event.waitUntil(Promise.all([
    caches.open(SHELL_CACHE_NAME).then((cache) => cache.addAll(CORE_SHELL_ASSETS)),
    caches.open(RUNTIME_CACHE_NAME).then((cache) => Promise.allSettled(
      RUNTIME_ASSETS.map((asset) => cache.add(asset))
    ))
  ]));
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") {
    self.skipWaiting();
    return;
  }

  if (event.data?.type !== "WARM_CURRENT_PAGE") return;

  const warmPromise = warmCurrentPageAssets(event.data.urls).then((result) => {
    event.ports?.[0]?.postMessage({ type: "CURRENT_PAGE_WARMED", ...result });
  });
  event.waitUntil(warmPromise);
});

function isOutdatedAppCache(cacheName) {
  return APP_CACHE_PREFIXES.some((prefix) => cacheName.startsWith(prefix)) &&
    !CURRENT_APP_CACHE_NAMES.has(cacheName);
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
    return true;
  } catch {
    // Cache writes are best effort and must not block a valid network response.
    return false;
  }
}

function isNextStaticAsset(requestUrl) {
  return requestUrl.pathname.startsWith("/_next/static/");
}

function isRuntimeAssetPath(requestUrl) {
  return RUNTIME_ASSET_PATHS.has(requestUrl.pathname) ||
    RUNTIME_PATH_PREFIXES.some((prefix) => requestUrl.pathname.startsWith(prefix));
}

function getAssetCacheName(request, requestUrl) {
  if (SHELL_ASSET_PATHS.has(requestUrl.pathname) || isNextStaticAsset(requestUrl)) {
    return SHELL_CACHE_NAME;
  }

  if (!isRuntimeAssetPath(requestUrl)) return null;

  const isAnimCjkSvg = requestUrl.pathname.startsWith("/animcjk/") &&
    requestUrl.pathname.endsWith(".svg");
  if (RUNTIME_ASSET_PATHS.has(requestUrl.pathname) || isAnimCjkSvg || request.destination === "image") {
    return RUNTIME_CACHE_NAME;
  }

  return null;
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

function isPrecachedRuntimeRequest(request) {
  try {
    return RUNTIME_ASSET_PATHS.has(new URL(request.url).pathname);
  } catch {
    return false;
  }
}

async function trimRuntimeCache(cache) {
  try {
    const keys = await cache.keys();
    const overflow = keys.length - RUNTIME_CACHE_MAX_ENTRIES;
    if (overflow <= 0) return;

    const removable = keys.filter((request) => !isPrecachedRuntimeRequest(request));
    await Promise.all(removable.slice(0, overflow).map((request) => cache.delete(request)));
  } catch {
    // Runtime media pruning is best effort and never touches the app shell cache.
  }
}

async function cacheAssetResponse(cacheName, request, response) {
  const cache = await caches.open(cacheName);
  await tryCachePut(cache, request, response);
  if (cacheName === RUNTIME_CACHE_NAME) await trimRuntimeCache(cache);
}

async function matchNavigationFallback(cache, shellCache, request, requestUrl) {
  const cached = await matchCachedNavigation(cache, request, requestUrl);
  if (cached) return cached;
  const shellCached = await matchCachedNavigation(shellCache, request, requestUrl);
  if (shellCached) return shellCached;
  return shellCache.match(OFFLINE_FALLBACK_URL);
}

async function fetchNavigationWithTimeout(request) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), NAVIGATION_NETWORK_TIMEOUT_MS);
  try {
    return await fetch(request, { signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

async function networkFirstNavigation(request) {
  const cache = await caches.open(NAVIGATION_CACHE_NAME);
  const shellCache = await caches.open(SHELL_CACHE_NAME);
  const requestUrl = new URL(request.url);

  try {
    const response = await fetchNavigationWithTimeout(request);
    if (response.ok && response.type === "basic") {
      await cacheNavigationResponse(cache, request, requestUrl, response);
    }
    if (response.status >= 500) {
      const fallback = await matchNavigationFallback(cache, shellCache, request, requestUrl);
      if (fallback) return fallback;
    }
    return response;
  } catch {
    return matchNavigationFallback(cache, shellCache, request, requestUrl);
  }
}

async function cacheFirstAsset(request, requestUrl) {
  const cacheName = getAssetCacheName(request, requestUrl);
  if (!cacheName) return fetch(request);

  const cache = await caches.open(cacheName);
  const cached = await cache.match(request, { ignoreVary: true });
  if (cached) return cached;

  const response = await fetch(request);
  if (response.ok) {
    await cacheAssetResponse(cacheName, request, response.clone());
  }

  return response;
}

function getWarmCacheName(requestUrl) {
  if (SHELL_ASSET_PATHS.has(requestUrl.pathname) || isNextStaticAsset(requestUrl)) {
    return SHELL_CACHE_NAME;
  }
  if (isRuntimeAssetPath(requestUrl)) return RUNTIME_CACHE_NAME;
  return null;
}

async function warmCurrentPageAssets(urls) {
  const cachedUrls = [];
  const failedUrls = [];
  const candidates = Array.isArray(urls) ? Array.from(new Set(urls)).slice(0, MAX_WARM_URLS) : [];

  for (const candidate of candidates) {
    try {
      const requestUrl = new URL(candidate, self.location.origin);
      const cacheName = requestUrl.origin === self.location.origin
        ? getWarmCacheName(requestUrl)
        : null;
      if (!cacheName) {
        failedUrls.push(String(candidate));
        continue;
      }

      const response = await fetch(requestUrl.href, {
        cache: "reload",
        credentials: "same-origin"
      });
      if (!response.ok) {
        failedUrls.push(requestUrl.href);
        continue;
      }

      const cache = await caches.open(cacheName);
      const cached = await tryCachePut(cache, requestUrl.href, response.clone());
      if (!cached) {
        failedUrls.push(requestUrl.href);
        continue;
      }
      if (cacheName === RUNTIME_CACHE_NAME) await trimRuntimeCache(cache);
      cachedUrls.push(requestUrl.href);
    } catch {
      failedUrls.push(String(candidate));
    }
  }

  return { cachedUrls, failedUrls };
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

  event.respondWith(cacheFirstAsset(request, requestUrl).catch(() => Response.error()));
});
