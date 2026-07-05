import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import test from "node:test"
import vm from "node:vm"

const root = path.resolve(import.meta.dirname, "..", "..")
const sw = fs.readFileSync(path.join(root, "public/sw.js"), "utf8")
const layout = fs.readFileSync(path.join(root, "src/app/layout.tsx"), "utf8")
const register = fs.readFileSync(path.join(root, "src/components/pwa-register.tsx"), "utf8")
const pwaNavigation = fs.readFileSync(path.join(root, "src/lib/pwa-navigation.ts"), "utf8")
const pwaE2e = fs.readFileSync(path.join(root, "tests/e2e/pwa-offline.mjs"), "utf8")
const offlineHtml = fs.readFileSync(path.join(root, "public/offline.html"), "utf8")
const harness = fs.readFileSync(path.join(root, "tests/e2e/harness.mjs"), "utf8")
const webPackage = fs.readFileSync(path.join(root, "package.json"), "utf8")

test("PWA registers a production service worker and exposes install metadata", () => {
  assert.match(layout, /manifest:\s*"\/manifest\.webmanifest"/)
  assert.match(layout, /appleWebApp:\s*\{/)
  assert.match(layout, /themeColor:\s*"#ffb7b2"/)
  assert.match(layout, /import \{ PwaRegister \} from "@\/components\/pwa-register"/)
  assert.match(layout, /<PwaRegister \/>/)
  assert.match(register, /process\.env\.NODE_ENV !== "production"/)
  assert.match(register, /navigator\.serviceWorker\.register\("\/sw\.js"\)/)
})

test("PWA registration surfaces service worker updates without forcing a reload", () => {
  assert.match(register, /useState/)
  assert.match(register, /useRef/)
  assert.match(register, /waitingRegistrationRef/)
  assert.match(register, /refreshAfterControllerChangeRef/)
  assert.match(register, /registration\.waiting/)
  assert.match(register, /updatefound/)
  assert.match(register, /worker\.state === "installed"/)
  assert.match(register, /controllerchange/)
  assert.match(register, /hasExistingController/)
  assert.match(register, /export const PWA_UPDATE_READY_EVENT = "yasashi:pwa-update-ready"/)
  assert.match(register, /type PwaUpdateReadyEventDetail/)
  assert.match(register, /event instanceof CustomEvent/)
  assert.match(register, /CustomEvent<PwaUpdateReadyEventDetail>/)
  assert.match(register, /type PwaTestWindow = Window/)
  assert.match(register, /__yasashiEnablePwaUpdateTestEvent/)
  assert.match(register, /const enableTestUpdateEvent = process\.env\.NODE_ENV !== "production"[\s\S]*__yasashiEnablePwaUpdateTestEvent/)
  assert.match(register, /window\.addEventListener\(PWA_UPDATE_READY_EVENT, onUpdateReadyEvent\)/)
  assert.match(register, /window\.removeEventListener\(PWA_UPDATE_READY_EVENT, onUpdateReadyEvent\)/)
  assert.match(register, /navigator\.serviceWorker\.removeEventListener\("controllerchange", onControllerChange\)/)
  assert.match(register, /data-testid="pwa-update-banner"/)
  assert.match(register, /role="region"/)
  assert.match(register, /aria-label="应用更新"/)
  assert.match(register, /data-testid="pwa-update-refresh"/)
  assert.match(register, /新版本已准备好/)
  assert.match(register, /刷新后可同步最新离线文件/)
  assert.match(register, /关闭更新提示/)
  assert.doesNotMatch(register, /New version ready/)
  assert.doesNotMatch(register, /Refresh to keep offline files in sync/)
  assert.match(register, /window\.location\.reload\(\)/)
  assert.match(register, /waitingWorker\.postMessage\(\{ type: "SKIP_WAITING" \}\)/)
  assert.match(register, /refreshAfterControllerChangeRef\.current = true/)
  assert.match(register, /data-testid="pwa-update-dismiss"/)
  assert.doesNotMatch(register, /skipWaiting\(\)/)
})

test("PWA registration lets offline or service-worker-controlled links fall back to document navigation", () => {
  assert.match(register, /function getOfflineNavigationAnchor\(event: MouseEvent\)/)
  assert.match(register, /closest<HTMLAnchorElement>\("a\[href\]"\)/)
  assert.match(register, /shouldUsePwaDocumentNavigation\(\{/)
  assert.match(register, /hasDownload: anchor\.hasAttribute\("download"\)/)
  assert.doesNotMatch(register, /if \(navigator\.onLine\) return/)
  assert.match(register, /isOnline: navigator\.onLine/)
  assert.match(register, /hasServiceWorkerController: Boolean\(navigator\.serviceWorker\.controller\)/)
  assert.match(register, /document\.addEventListener\("click", onOfflineLinkClick, true\)/)
  assert.match(register, /document\.removeEventListener\("click", onOfflineLinkClick, true\)/)
  assert.match(register, /event\.preventDefault\(\)/)
  assert.match(register, /event\.stopPropagation\(\)/)
  assert.match(register, /window\.location\.assign\(anchor\.href\)/)
  assert.match(pwaNavigation, /export function shouldUseDocumentNavigationOffline/)
  assert.match(pwaNavigation, /export function shouldUsePwaDocumentNavigation/)
  assert.match(pwaNavigation, /export function shouldUsePwaDocumentNavigationForHref/)
  assert.match(pwaNavigation, /hasServiceWorkerController/)
  assert.match(pwaNavigation, /!isOnline \|\| hasServiceWorkerController/)
  assert.match(pwaNavigation, /event\.button !== 0/)
  assert.match(pwaNavigation, /event\.metaKey \|\| event\.ctrlKey \|\| event\.shiftKey \|\| event\.altKey/)
  assert.match(pwaNavigation, /anchor\.hasDownload/)
  assert.match(pwaNavigation, /anchor\.target && anchor\.target !== "_self"/)
  assert.match(pwaNavigation, /url\.origin !== currentLocation\.origin/)
  assert.match(pwaNavigation, /url\.pathname === currentLocation\.pathname && url\.search === currentLocation\.search && url\.hash/)
})

test("service worker caches static assets and visited navigation pages without learning state", () => {
  assert.match(sw, /const CACHE_VERSION = "v\d+"/)
  assert.match(sw, /const STATIC_CACHE_NAME = `yasashi-static-\$\{CACHE_VERSION\}`/)
  assert.match(sw, /const NAVIGATION_CACHE_NAME = `yasashi-navigation-\$\{CACHE_VERSION\}`/)
  assert.match(sw, /const APP_CACHE_PREFIXES = \["yasashi-static-", "yasashi-navigation-"\]/)
  assert.match(sw, /const OFFLINE_FALLBACK_URL = "\/offline\.html"/)
  assert.match(sw, /const NAVIGATION_CACHE_MAX_ENTRIES = 40/)
  assert.match(sw, /const STATIC_CACHE_MAX_ENTRIES = 160/)
  assert.match(sw, /const CORE_STATIC_ASSETS = \[/)
  assert.match(sw, /cache\.addAll\(CORE_STATIC_ASSETS\)/)
  assert.match(sw, /Promise\.allSettled/)
  assert.match(sw, /filter\(\(asset\) => !CORE_STATIC_ASSETS\.includes\(asset\)\)/)
  assert.match(sw, /map\(\(asset\) => cache\.add\(asset\)\)/)
  assert.doesNotMatch(sw, /cache\.addAll\(STATIC_ASSETS\)/)
  assert.match(sw, /self\.addEventListener\("message"/)
  assert.match(sw, /event\.data\?\.type === "SKIP_WAITING"/)
  assert.match(sw, /function isOutdatedAppCache\(cacheName\)/)
  assert.match(sw, /APP_CACHE_PREFIXES\.some\(\(prefix\) => cacheName\.startsWith\(prefix\)\)/)
  assert.match(sw, /\.filter\(isOutdatedAppCache\)/)
  assert.match(sw, /\/brand\/logo-mark\.svg/)
  assert.match(sw, /\/brand\/logo-wordmark\.svg/)
  assert.match(sw, /\/assets\/kana\/kana-seion\.webp/)
  assert.match(sw, /\/assets\/kana\/kana-all@2x\.webp/)
  assert.match(sw, /\/assets\/textures\/paper-washi-tile\.png/)
  assert.match(sw, /\/assets\/vocab-categories\/greetings\.webp/)
  assert.match(sw, /const STATIC_ASSET_PATHS = new Set\(STATIC_ASSETS\)/)
  assert.match(sw, /const requestUrl = new URL\(request\.url\)/)
  assert.match(sw, /requestUrl\.origin !== self\.location\.origin/)
  assert.match(sw, /request\.method !== "GET"/)
  assert.match(sw, /request\.mode === "navigate"/)
  assert.match(sw, /networkFirstNavigation\(request\)/)
  assert.match(sw, /async function tryCachePut\(cache, request, response\)/)
  assert.match(sw, /await cache\.put\(request, response\)/)
  assert.match(sw, /Cache writes are best effort and must not block a valid network response/)
  assert.match(sw, /await tryCachePut\(cache, request, response\.clone\(\)\)/)
  assert.match(sw, /await trimNavigationCache\(cache\)/)
  assert.match(sw, /async function trimNavigationCache\(cache\)/)
  assert.match(sw, /const keys = await cache\.keys\(\)/)
  assert.match(sw, /keys\.length - NAVIGATION_CACHE_MAX_ENTRIES/)
  assert.match(sw, /cache\.delete\(request\)/)
  assert.match(sw, /function isPrecachedStaticRequest\(request\)/)
  assert.match(sw, /STATIC_ASSET_PATHS\.has\(new URL\(request\.url\)\.pathname\)/)
  assert.match(sw, /async function trimStaticAssetCache\(cache\)/)
  assert.match(sw, /keys\.length - STATIC_CACHE_MAX_ENTRIES/)
  assert.match(sw, /keys\.filter\(\(request\) => !isPrecachedStaticRequest\(request\)\)/)
  assert.match(sw, /async function cacheStaticAssetResponse\(cache, request, response\)/)
  assert.match(sw, /await trimStaticAssetCache\(cache\)/)
  assert.match(sw, /cache\.match\(request\)/)
  assert.match(sw, /function getCanonicalNavigationUrl\(requestUrl\)/)
  assert.match(sw, /return new URL\(requestUrl\.pathname, self\.location\.origin\)\.href/)
  assert.match(sw, /async function matchCachedNavigation\(cache, request, requestUrl\)/)
  assert.match(sw, /cache\.match\(canonicalUrl\)/)
  assert.match(sw, /async function matchNavigationFallback\(cache, staticCache, request, requestUrl\)/)
  assert.match(sw, /const cached = await matchCachedNavigation\(cache, request, requestUrl\)/)
  assert.match(sw, /const staticCached = await matchCachedNavigation\(staticCache, request, requestUrl\)/)
  assert.match(sw, /if \(staticCached\) return staticCached/)
  assert.match(sw, /staticCache\.match\(OFFLINE_FALLBACK_URL\)/)
  assert.match(sw, /response\.status >= 500/)
  assert.match(sw, /const fallback = await matchNavigationFallback\(cache, staticCache, request, requestUrl\)/)
  assert.match(sw, /function isCacheableStaticAsset\(request, requestUrl\)/)
  assert.match(sw, /const CACHEABLE_STATIC_PATH_PREFIXES = \[/)
  assert.match(sw, /"\/_next\/static\/"/)
  assert.match(sw, /"\/_next\/image"/)
  assert.match(sw, /"\/assets\/"/)
  assert.match(sw, /"\/icons\/"/)
  assert.match(sw, /"\/brand\/"/)
  assert.match(sw, /const CACHEABLE_STATIC_EXACT_PATHS = new Set/)
  assert.match(sw, /CACHEABLE_STATIC_PATH_PREFIXES\.some/)
  assert.match(sw, /if \(!isCacheableStaticAsset\(request, requestUrl\)\) \{/)
  assert.match(sw, /return fetch\(request\)/)
  assert.match(sw, /async function refreshStaticAssetCache\(request, requestUrl\)/)
  assert.match(sw, /fetch\(request, \{ cache: "no-cache" \}\)/)
  assert.match(sw, /cacheFirstStaticAsset\(request, requestUrl, event\)/)
  assert.match(sw, /event\.waitUntil\(refreshStaticAssetCache\(request, requestUrl\)\)/)
  assert.match(sw, /request\.destination === "image"/)
  assert.match(sw, /request\.destination === "style"/)
  assert.match(sw, /request\.destination === "script"/)
  assert.match(sw, /requestUrl\.pathname\.startsWith\("\/animcjk\/"\)/)
  assert.match(sw, /requestUrl\.pathname\.endsWith\("\.svg"\)/)
  assert.match(sw, /await cacheStaticAssetResponse\(cache, request, response\.clone\(\)\)/)
  assert.doesNotMatch(sw, /localStorage/)
  assert.doesNotMatch(sw, /yasashi\.learning/)
  assert.doesNotMatch(sw, /yasashi\.srs/)
  assert.doesNotMatch(sw, /yasashi\.mistakes/)
})

test("service worker install tolerates non-critical static asset failures", async () => {
  const addCalls = []
  let installHandler = null
  let messageHandler = null
  let skipWaitingCalled = false
  const cache = {
    async addAll(assets) {
      addCalls.push({ type: "addAll", assets })
    },
    async add(asset) {
      addCalls.push({ type: "add", assets: [asset] })
      if (asset === "/favicon.ico") throw new Error("simulated optional asset failure")
    },
  }
  const sandbox = {
    caches: {
      async open() {
        return cache
      },
    },
    self: {
      location: { origin: "https://example.test" },
      addEventListener(type, handler) {
        if (type === "install") installHandler = handler
        if (type === "message") messageHandler = handler
      },
      skipWaiting() {
        skipWaitingCalled = true
      },
    },
    URL,
    Response,
    Promise,
  }
  sandbox.globalThis = sandbox

  vm.runInNewContext(sw, sandbox)
  assert.equal(typeof installHandler, "function")

  let installPromise = null
  installHandler({
    waitUntil(promise) {
      installPromise = promise
    },
  })

  await installPromise
  const coreAdd = addCalls.find((call) => call.type === "addAll")
  assert.deepEqual(Array.from(coreAdd?.assets ?? []), ["/", "/offline.html", "/manifest.webmanifest"])
  assert.ok(addCalls.some((call) => call.type === "add" && call.assets.includes("/favicon.ico")))
  assert.equal(skipWaitingCalled, false)
  assert.equal(typeof messageHandler, "function")
  messageHandler({ data: { type: "SKIP_WAITING" } })
  assert.equal(skipWaitingCalled, true)
})

test("service worker activation removes only outdated app-owned caches", async () => {
  let activateHandler = null
  let clientsClaimed = false
  const deleted = []
  const sandbox = {
    caches: {
      async keys() {
        return [
          "yasashi-static-v7",
          "yasashi-navigation-v7",
          "yasashi-static-v6",
          "yasashi-navigation-v6",
          "yasashi-static-v4",
          "yasashi-navigation-v4",
          "third-party-cache",
          "workbox-precache-v1",
        ]
      },
      async delete(key) {
        deleted.push(key)
        return true
      },
    },
    self: {
      location: { origin: "https://example.test" },
      clients: {
        async claim() {
          clientsClaimed = true
        },
      },
      addEventListener(type, handler) {
        if (type === "activate") activateHandler = handler
      },
      skipWaiting() {},
    },
    URL,
    Response,
    Promise,
  }
  sandbox.globalThis = sandbox

  vm.runInNewContext(sw, sandbox)
  assert.equal(typeof activateHandler, "function")

  let activatePromise = null
  activateHandler({
    waitUntil(promise) {
      activatePromise = promise
    },
  })

  await activatePromise
  assert.deepEqual(deleted.sort(), ["yasashi-navigation-v4", "yasashi-navigation-v6", "yasashi-static-v4", "yasashi-static-v6"])
  assert.equal(clientsClaimed, true)
})

test("service worker navigation fallback ignores preserved non-app caches", async () => {
  let fetchHandler = null
  const navigationEntries = new Map([
    ["https://example.test/kana", new Response("current app page", { status: 200 })],
  ])
  const staticEntries = new Map([
    ["https://example.test/offline.html", new Response("offline fallback", { status: 200 })],
  ])
  const preservedEntries = new Map([
    ["https://example.test/kana", new Response("stale preserved page", { status: 200 })],
    ["https://example.test/offline.html", new Response("stale preserved fallback", { status: 200 })],
  ])
  const sandbox = {
    caches: {
      async open(name) {
        return {
          async match(request) {
            const url = typeof request === "string" ? request : request.url
            const absoluteUrl = url.startsWith("/") ? `https://example.test${url}` : url
            if (name === "yasashi-navigation-v7") return navigationEntries.get(absoluteUrl) ?? navigationEntries.get(url) ?? null
            if (name === "yasashi-static-v7") return staticEntries.get(absoluteUrl) ?? staticEntries.get(url) ?? null
            return preservedEntries.get(absoluteUrl) ?? preservedEntries.get(url) ?? null
          },
          async put() {},
        }
      },
    },
    async fetch() {
      throw new Error("offline")
    },
    self: {
      location: { origin: "https://example.test" },
      addEventListener(type, handler) {
        if (type === "fetch") fetchHandler = handler
      },
      skipWaiting() {},
      clients: { claim() {} },
    },
    URL,
    Response,
    Promise,
  }
  sandbox.globalThis = sandbox

  vm.runInNewContext(sw, sandbox)
  assert.equal(typeof fetchHandler, "function")

  let responded = null
  fetchHandler({
    request: {
      method: "GET",
      mode: "navigate",
      destination: "document",
      url: "https://example.test/kana",
    },
    respondWith(promise) {
      responded = promise
    },
    waitUntil() {},
  })

  assert.equal(await (await responded).text(), "current app page")

  navigationEntries.clear()
  responded = null
  fetchHandler({
    request: {
      method: "GET",
      mode: "navigate",
      destination: "document",
      url: "https://example.test/kana",
    },
    respondWith(promise) {
      responded = promise
    },
    waitUntil() {},
  })

  assert.equal(await (await responded).text(), "offline fallback")
})

test("service worker navigation fallback canonicalizes query URLs before offline fallback", async () => {
  let fetchHandler = null
  const navigationEntries = new Map([
    ["https://example.test/semantics", new Response("cached semantics page", { status: 200 })],
  ])
  const staticEntries = new Map([
    ["https://example.test/vocabulary", new Response("cached vocabulary shell", { status: 200 })],
    ["https://example.test/offline.html", new Response("offline fallback", { status: 200 })],
  ])
  const sandbox = {
    caches: {
      async open(name) {
        return {
          async match(request) {
            const url = typeof request === "string" ? request : request.url
            const absoluteUrl = url.startsWith("/") ? `https://example.test${url}` : url
            if (name === "yasashi-navigation-v7") return navigationEntries.get(absoluteUrl) ?? navigationEntries.get(url) ?? null
            if (name === "yasashi-static-v7") return staticEntries.get(absoluteUrl) ?? staticEntries.get(url) ?? null
            return null
          },
          async put() {},
        }
      },
    },
    async fetch() {
      throw new Error("offline")
    },
    self: {
      location: { origin: "https://example.test" },
      addEventListener(type, handler) {
        if (type === "fetch") fetchHandler = handler
      },
      skipWaiting() {},
      clients: { claim() {} },
    },
    URL,
    Response,
    Promise,
  }
  sandbox.globalThis = sandbox

  vm.runInNewContext(sw, sandbox)
  assert.equal(typeof fetchHandler, "function")

  async function navigate(url) {
    let responded = null
    fetchHandler({
      request: {
        method: "GET",
        mode: "navigate",
        destination: "document",
        url,
      },
      respondWith(promise) {
        responded = promise
      },
      waitUntil() {},
    })

    return (await responded).text()
  }

  assert.equal(
    await navigate("https://example.test/semantics?item=aru-iru"),
    "cached semantics page"
  )
  assert.equal(
    await navigate("https://example.test/vocabulary?level=daily"),
    "cached vocabulary shell"
  )
  assert.equal(
    await navigate("https://example.test/unvisited?x=1"),
    "offline fallback"
  )
})

test("service worker navigation fallback serves cached pages for server errors but preserves 404s", async () => {
  let fetchHandler = null
  let responseMode = "server-error"
  const navigationEntries = new Map([
    ["https://example.test/learn/day-1-a-row-hello", new Response("cached lesson page", { status: 200 })],
  ])
  const staticEntries = new Map([
    ["https://example.test/offline.html", new Response("offline fallback", { status: 200 })],
  ])
  const sandbox = {
    caches: {
      async open(name) {
        return {
          async match(request) {
            const url = typeof request === "string" ? request : request.url
            const absoluteUrl = url.startsWith("/") ? `https://example.test${url}` : url
            if (name === "yasashi-navigation-v7") return navigationEntries.get(absoluteUrl) ?? navigationEntries.get(url) ?? null
            if (name === "yasashi-static-v7") return staticEntries.get(absoluteUrl) ?? staticEntries.get(url) ?? null
            return null
          },
          async put() {},
        }
      },
    },
    async fetch() {
      if (responseMode === "server-error") return new Response("server unavailable", { status: 503 })
      return new Response("not found", { status: 404 })
    },
    self: {
      location: { origin: "https://example.test" },
      addEventListener(type, handler) {
        if (type === "fetch") fetchHandler = handler
      },
      skipWaiting() {},
      clients: { claim() {} },
    },
    URL,
    Response,
    Promise,
  }
  sandbox.globalThis = sandbox

  vm.runInNewContext(sw, sandbox)
  assert.equal(typeof fetchHandler, "function")

  async function navigate(url) {
    let responded = null
    fetchHandler({
      request: {
        method: "GET",
        mode: "navigate",
        destination: "document",
        url,
      },
      respondWith(promise) {
        responded = promise
      },
      waitUntil() {},
    })

    return (await responded).text()
  }

  assert.equal(
    await navigate("https://example.test/learn/day-1-a-row-hello?from=home"),
    "cached lesson page"
  )

  responseMode = "not-found"
  assert.equal(
    await navigate("https://example.test/learn/day-1-a-row-hello?from=home"),
    "not found"
  )
})

test("service worker trims old navigation cache entries after caching visited pages", async () => {
  let fetchHandler = null
  const putCalls = []
  const deleted = []
  const navigationRequests = Array.from({ length: 42 }, (_, index) => ({
    url: `https://example.test/old-${index}`,
  }))
  const sandbox = {
    caches: {
      async open(name) {
        return {
          async match() {
            return null
          },
          async put(request) {
            putCalls.push({ cache: name, url: request.url })
          },
          async keys() {
            return navigationRequests
          },
          async delete(request) {
            deleted.push(request.url)
            return true
          },
        }
      },
    },
    async fetch() {
      const response = new Response("fresh page", { status: 200 })
      Object.defineProperty(response, "type", { value: "basic" })
      return response
    },
    self: {
      location: { origin: "https://example.test" },
      addEventListener(type, handler) {
        if (type === "fetch") fetchHandler = handler
      },
      skipWaiting() {},
      clients: { claim() {} },
    },
    URL,
    Response,
    Promise,
  }
  sandbox.globalThis = sandbox

  vm.runInNewContext(sw, sandbox)
  assert.equal(typeof fetchHandler, "function")

  let responded = null
  fetchHandler({
    request: {
      method: "GET",
      mode: "navigate",
      destination: "document",
      url: "https://example.test/new-page",
    },
    respondWith(promise) {
      responded = promise
    },
    waitUntil() {},
  })

  assert.equal(await (await responded).text(), "fresh page")
  assert.deepEqual(putCalls, [{ cache: "yasashi-navigation-v7", url: "https://example.test/new-page" }])
  assert.deepEqual(deleted, ["https://example.test/old-0", "https://example.test/old-1"])
})

test("service worker trims runtime static cache entries without deleting precached assets", async () => {
  let fetchHandler = null
  const putCalls = []
  const deleted = []
  const protectedRequest = { url: "https://example.test/offline.html" }
  const runtimeRequests = Array.from({ length: 162 }, (_, index) => ({
    url: `https://example.test/_next/static/old-${index}.js`,
  }))
  const sandbox = {
    caches: {
      async open(name) {
        return {
          async match() {
            return null
          },
          async put(request) {
            putCalls.push({ cache: name, url: request.url })
          },
          async keys() {
            return [protectedRequest, ...runtimeRequests]
          },
          async delete(request) {
            deleted.push(request.url)
            return true
          },
        }
      },
    },
    async fetch() {
      return new Response("fresh chunk", { status: 200 })
    },
    self: {
      location: { origin: "https://example.test" },
      addEventListener(type, handler) {
        if (type === "fetch") fetchHandler = handler
      },
      skipWaiting() {},
      clients: { claim() {} },
    },
    URL,
    Response,
    Promise,
  }
  sandbox.globalThis = sandbox

  vm.runInNewContext(sw, sandbox)
  assert.equal(typeof fetchHandler, "function")

  let responded = null
  fetchHandler({
    request: {
      method: "GET",
      mode: "no-cors",
      destination: "script",
      url: "https://example.test/_next/static/new-chunk.js",
    },
    respondWith(promise) {
      responded = promise
    },
    waitUntil() {},
  })

  assert.equal(await (await responded).text(), "fresh chunk")
  assert.deepEqual(putCalls, [{ cache: "yasashi-static-v7", url: "https://example.test/_next/static/new-chunk.js" }])
  assert.deepEqual(deleted, [
    "https://example.test/_next/static/old-0.js",
    "https://example.test/_next/static/old-1.js",
    "https://example.test/_next/static/old-2.js",
  ])
  assert.equal(deleted.includes("https://example.test/offline.html"), false)
})

test("service worker serves cached static assets while refreshing them in the background", async () => {
  let fetchHandler = null
  const currentStaticEntries = new Map([
    ["https://example.test/icons/icon-192.png", new Response("current icon", { status: 200 })],
  ])
  const preservedEntries = new Map([
    ["https://example.test/icons/icon-192.png", new Response("stale preserved icon", { status: 200 })],
  ])
  const putCalls = []
  const fetchCalls = []
  const sandbox = {
    caches: {
      async open(name) {
        return {
          async match(request) {
            if (name === "yasashi-static-v7") return currentStaticEntries.get(request.url) ?? null
            return preservedEntries.get(request.url) ?? null
          },
          async put(request, response) {
            putCalls.push({ cache: name, url: request.url })
            if (name === "yasashi-static-v7") currentStaticEntries.set(request.url, response)
            else preservedEntries.set(request.url, response)
          },
        }
      },
    },
    async fetch(request, init) {
      fetchCalls.push({ url: request.url, cache: init?.cache })
      return new Response("new icon", { status: 200 })
    },
    self: {
      location: { origin: "https://example.test" },
      addEventListener(type, handler) {
        if (type === "fetch") fetchHandler = handler
      },
      skipWaiting() {},
      clients: { claim() {} },
    },
    URL,
    Response,
    Promise,
  }
  sandbox.globalThis = sandbox

  vm.runInNewContext(sw, sandbox)
  assert.equal(typeof fetchHandler, "function")

  let responded = null
  const waitUntilPromises = []
  fetchHandler({
    request: {
      method: "GET",
      mode: "no-cors",
      destination: "image",
      url: "https://example.test/icons/icon-192.png",
    },
    respondWith(promise) {
      responded = promise
    },
    waitUntil(promise) {
      waitUntilPromises.push(promise)
    },
  })

  assert.equal(await (await responded).text(), "current icon")
  await Promise.all(waitUntilPromises)
  assert.deepEqual(fetchCalls, [{ url: "https://example.test/icons/icon-192.png", cache: "no-cache" }])
  assert.deepEqual(putCalls, [{ cache: "yasashi-static-v7", url: "https://example.test/icons/icon-192.png" }])
  assert.equal(await currentStaticEntries.get("https://example.test/icons/icon-192.png").text(), "new icon")
  assert.equal(await preservedEntries.get("https://example.test/icons/icon-192.png").text(), "stale preserved icon")
})

test("service worker caches only allowlisted static assets", async () => {
  let fetchHandler = null
  const putCalls = []
  const fetchCalls = []
  const sandbox = {
    caches: {
      async open(name) {
        return {
          async match() {
            return null
          },
          async put(request) {
            putCalls.push({ cache: name, url: request.url })
          },
        }
      },
    },
    async fetch(request) {
      fetchCalls.push(request.url)
      return new Response(`network:${request.url}`, { status: 200 })
    },
    self: {
      location: { origin: "https://example.test" },
      addEventListener(type, handler) {
        if (type === "fetch") fetchHandler = handler
      },
      skipWaiting() {},
      clients: { claim() {} },
    },
    URL,
    Response,
    Promise,
  }
  sandbox.globalThis = sandbox

  vm.runInNewContext(sw, sandbox)
  assert.equal(typeof fetchHandler, "function")

  async function requestAsset(url, destination) {
    let responded = null
    fetchHandler({
      request: {
        method: "GET",
        mode: "no-cors",
        destination,
        url,
      },
      respondWith(promise) {
        responded = promise
      },
      waitUntil() {},
    })

    return (await responded).text()
  }

  assert.equal(await requestAsset("https://example.test/assets/kana/kana-seion.webp", "image"), "network:https://example.test/assets/kana/kana-seion.webp")
  assert.equal(await requestAsset("https://example.test/uploads/large.png", "image"), "network:https://example.test/uploads/large.png")
  assert.equal(await requestAsset("https://example.test/api/file.js", "script"), "network:https://example.test/api/file.js")

  assert.deepEqual(fetchCalls, [
    "https://example.test/assets/kana/kana-seion.webp",
    "https://example.test/uploads/large.png",
    "https://example.test/api/file.js",
  ])
  assert.deepEqual(putCalls, [{ cache: "yasashi-static-v7", url: "https://example.test/assets/kana/kana-seion.webp" }])
})

test("PWA offline E2E verifies visited-page cache, fallback, and local state preservation", () => {
  assert.match(webPackage, /"e2e:pwa": "node tests\/e2e\/pwa-offline\.mjs"/)
  assert.match(webPackage, /"e2e:pwa:required": "node tests\/e2e\/pwa-offline\.mjs --required"/)
  assert.match(pwaE2e, /isE2ERequired\("E2E_PWA_REQUIRED"\)/)
  assert.match(pwaE2e, /importPlaywrightOrSkip/)
  assert.match(pwaE2e, /skipOptionalPlaywrightRuntimeError/)
  assert.match(harness, /process\.argv\.includes\("--required"\)/)
  assert.match(harness, /process\.env\[envName\] === "1"/)
  assert.match(pwaE2e, /PWA E2E skipped: Playwright is not installed/)
  assert.match(pwaE2e, /PWA E2E skipped: Playwright browser binaries are not installed/)
  assert.match(webPackage, /"e2e:install": "playwright install chromium"/)
  assert.match(harness, /const releaseBuildLock = await acquireBuildLock\(\{ label \}\)/)
  assert.match(pwaE2e, /label: "pwa production e2e"/)
  assert.match(harness, /controller\.holdRelease\(releaseBuildLock\)/)
  assert.match(harness, /runNextBuildSync/)
  assert.match(harness, /spawnSync\(process\.execPath, \[nextCli, "build"\]/)
  assert.doesNotMatch(harness, /spawnSync\("cmd\.exe", \["\/d", "\/s", "\/c"/)
  assert.match(harness, /export const nextCli = path\.join\(appDir, "node_modules", "next", "dist", "bin", "next"\)/)
  assert.match(harness, /controller\.spawn\(process\.execPath, \[nextCli, "start", "--hostname", "127\.0\.0\.1", "--port"/)
  assert.match(pwaE2e, /navigator\.serviceWorker\.ready/)
  assert.match(pwaE2e, /async function disableHttpCache\(context, page\)/)
  assert.match(pwaE2e, /context\.newCDPSession\(page\)/)
  assert.match(pwaE2e, /Network\.setCacheDisabled/)
  assert.match(pwaE2e, /page\.reload\(\{ waitUntil: "networkidle" \}\)/)
  assert.match(pwaE2e, /async function assertServiceWorkerStaticCache\(page\)/)
  assert.match(pwaE2e, /caches\.keys\(\)/)
  assert.match(pwaE2e, /name\.startsWith\("yasashi-static-"\)/)
  assert.match(pwaE2e, /\/_next\/static\//)
  assert.match(pwaE2e, /service worker static cache should contain Next static assets/)
  assert.match(pwaE2e, /\/kana/)
  assert.match(pwaE2e, /kana-card-a/)
  assert.match(pwaE2e, /\/vocabulary/)
  assert.match(pwaE2e, /vocabulary-search/)
  assert.match(pwaE2e, /\/quiz\?mode=hiragana-romaji/)
  assert.match(pwaE2e, /online quiz prewarm should load a real question/)
  assert.match(pwaE2e, /\/semantics/)
  assert.match(pwaE2e, /semanticsDetailPath/)
  assert.match(pwaE2e, /\/pragmatics/)
  assert.match(pwaE2e, /pragmaticsDetailPath/)
  assert.doesNotMatch(pwaE2e, /a\[href\^="\/semantics\/"\]/)
  assert.match(pwaE2e, /context\.setOffline\(true\)/)
  assert.match(offlineHtml, /<a href="\/">回到首页<\/a>/)
  assert.match(pwaE2e, /\/learn\/day-1-a-row-hello/)
  assert.match(pwaE2e, /page\.getByTestId\("home-start-learning"\)\.click\(\)/)
  assert.match(pwaE2e, /lesson page reached through the app link should load before offline cache verification/)
  assert.doesNotMatch(pwaE2e, /page\.goto\(visitedLessonUrl, \{ waitUntil: "networkidle" \}\)/)
  assert.match(pwaE2e, /lesson-next/)
  assert.match(pwaE2e, /offline navigation cache should serve a visited lesson page/)
  assert.match(pwaE2e, /\/animcjk\/kana\/12354\.svg/)
  assert.match(pwaE2e, /AnimCJK SVG should load online before offline cache verification/)
  assert.match(pwaE2e, /home-start-learning/)
  assert.match(pwaE2e, /offline static cache should serve the app home page/)
  assert.match(pwaE2e, /page\.waitForURL\(\/\\\/learn\\\/day-1-a-row-hello\/\)/)
  assert.match(pwaE2e, /offline client-side links should fall back to document navigation for cached pages/)
  assert.match(pwaE2e, /offline cache should serve a visited AnimCJK SVG/)
  assert.match(pwaE2e, /offline AnimCJK response should remain an SVG/)
  assert.match(pwaE2e, /\/kana\?mode=katakana&set=yoon/)
  assert.match(pwaE2e, /offline canonical navigation should serve a cached kana query route/)
  assert.match(pwaE2e, /\/vocabulary\?level=daily/)
  assert.match(pwaE2e, /offline canonical navigation should serve a cached vocabulary query route/)
  assert.match(pwaE2e, /\/quiz\?mode=hiragana-romaji/)
  assert.match(pwaE2e, /offline canonical navigation should serve a cached quiz query route/)
  assert.match(pwaE2e, /\/semantics\?item=\$\{semanticsItemId\}/)
  assert.match(pwaE2e, /offline legacy semantics query should document-navigate to the cached static detail route/)
  assert.match(pwaE2e, /offline pragmatics detail should stay on the cached static detail route/)
  assert.match(pwaE2e, /realOfflineFallbackUrl/)
  assert.match(pwaE2e, /abortRealOfflineFallback/)
  assert.match(pwaE2e, /context\.route\(realOfflineFallbackUrl, abortRealOfflineFallback\)/)
  assert.match(pwaE2e, /real offline unvisited pages should render the offline fallback/)
  assert.match(pwaE2e, /getByRole\("link", \{ name: OFFLINE_HOME_LINK_TEXT \}\)\.click\(\)/)
  assert.match(pwaE2e, /offline fallback home link should navigate to the cached app shell/)
  assert.match(pwaE2e, /offline fallback home link should restore the cached home app shell/)
  assert.match(pwaE2e, /context\.unroute\(realOfflineFallbackUrl, abortRealOfflineFallback\)/)
  assert.match(pwaE2e, /const knownRouteAbortUrl = `\$\{baseUrl\}\/learn\/day-1-a-row-hello`/)
  assert.match(pwaE2e, /context\.route\(knownRouteAbortUrl, abortKnownRoute\)/)
  assert.match(pwaE2e, /context\.unroute\(knownRouteAbortUrl, abortKnownRoute\)/)
  assert.match(pwaE2e, /service-worker-controlled online links should use document navigation and recover from a cached page/)
  assert.match(pwaE2e, /context\.route\(fallbackUrl, \(route\) => route\.abort\("failed"\)\)/)
  assert.match(pwaE2e, /page\.goto\(fallbackUrl/)
  assert.match(pwaE2e, /navigation failures should render the offline fallback/)
  assert.match(pwaE2e, /E2E_STORAGE_KEYS\.USER_PROFILE/)
  assert.match(pwaE2e, /offline fallback must not overwrite local learning state/)
})

test("PWA offline E2E asserts cached learning content, not just route shells", () => {
  assert.match(pwaE2e, /seionHiraganaToRomaji/)
  assert.match(pwaE2e, /KANA_A/)
  assert.match(pwaE2e, /KATAKANA_KYA/)
  assert.match(pwaE2e, /KONNICHIWA/)
  assert.match(pwaE2e, /YAKUSOKU_KANJI/)
  assert.match(pwaE2e, /YAKUSOKU_KANA/)
  assert.match(pwaE2e, /SHIRU_EXAMPLE/)
  assert.match(pwaE2e, /PRAGMATICS_MORNING_TITLE/)
  assert.match(pwaE2e, /OHAYOU_GOZAIMASU/)
  assert.match(pwaE2e, /OFFLINE_FALLBACK_TEXT/)
  assert.match(pwaE2e, /quiz-question-text/)
  assert.match(pwaE2e, /quiz-answer-option-/)
  assert.match(pwaE2e, /assertKnownHiraganaRomajiQuestion/)
  assert.match(pwaE2e, /online vocabulary prewarm should load daily vocabulary details/)
  assert.match(pwaE2e, /offline vocabulary query should render daily vocabulary content/)
  assert.match(pwaE2e, /offline quiz query should render a real question/)
  assert.match(pwaE2e, /offline semantics query should render cached example sentences/)
  assert.match(pwaE2e, /offline pragmatics detail should render cached example responses/)
  assert.match(pwaE2e, /offline client-side lesson navigation should render lesson content/)
  assert.match(pwaE2e, /offline home should render the cached app shell instead of fallback copy/)
  assert.match(pwaE2e, /viewBox="0 0 1024 1024"/)
})
