import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import test from "node:test"
import vm from "node:vm"

const root = path.resolve(import.meta.dirname, "..", "..")
const sw = fs.readFileSync(path.join(root, "public/sw.js"), "utf8")
const layout = fs.readFileSync(path.join(root, "src/app/layout.tsx"), "utf8")
const register = fs.readFileSync(path.join(root, "src/components/pwa-register.tsx"), "utf8")
const pwaE2e = fs.readFileSync(path.join(root, "tests/e2e/pwa-offline.mjs"), "utf8")
const harness = fs.readFileSync(path.join(root, "tests/e2e/harness.mjs"), "utf8")
const webPackage = fs.readFileSync(path.join(root, "package.json"), "utf8")

test("PWA registers a production service worker and exposes install metadata", () => {
  assert.match(layout, /manifest:\s*"\/manifest\.webmanifest"/)
  assert.match(layout, /appleWebApp:\s*\{/)
  assert.match(layout, /themeColor:\s*"#ffb7b2"/)
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
  assert.match(register, /const enableTestUpdateEvent = process\.env\.NODE_ENV !== "production"/)
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

test("PWA registration lets offline links fall back to document navigation", () => {
  assert.match(register, /function getOfflineNavigationAnchor\(event: MouseEvent\)/)
  assert.match(register, /event\.button !== 0/)
  assert.match(register, /event\.metaKey \|\| event\.ctrlKey \|\| event\.shiftKey \|\| event\.altKey/)
  assert.match(register, /closest<HTMLAnchorElement>\("a\[href\]"\)/)
  assert.match(register, /anchor\.hasAttribute\("download"\)/)
  assert.match(register, /anchor\.target && anchor\.target !== "_self"/)
  assert.match(register, /url\.origin !== window\.location\.origin/)
  assert.match(register, /if \(navigator\.onLine\) return/)
  assert.match(register, /document\.addEventListener\("click", onOfflineLinkClick, true\)/)
  assert.match(register, /document\.removeEventListener\("click", onOfflineLinkClick, true\)/)
  assert.match(register, /event\.preventDefault\(\)/)
  assert.match(register, /event\.stopPropagation\(\)/)
  assert.match(register, /window\.location\.assign\(anchor\.href\)/)
})

test("service worker caches static assets and visited navigation pages without learning state", () => {
  assert.match(sw, /const CACHE_VERSION = "v\d+"/)
  assert.match(sw, /const STATIC_CACHE_NAME = `yasashi-static-\$\{CACHE_VERSION\}`/)
  assert.match(sw, /const NAVIGATION_CACHE_NAME = `yasashi-navigation-\$\{CACHE_VERSION\}`/)
  assert.match(sw, /const OFFLINE_FALLBACK_URL = "\/offline\.html"/)
  assert.match(sw, /const CORE_STATIC_ASSETS = \[/)
  assert.match(sw, /cache\.addAll\(CORE_STATIC_ASSETS\)/)
  assert.match(sw, /Promise\.allSettled/)
  assert.match(sw, /filter\(\(asset\) => !CORE_STATIC_ASSETS\.includes\(asset\)\)/)
  assert.match(sw, /map\(\(asset\) => cache\.add\(asset\)\)/)
  assert.doesNotMatch(sw, /cache\.addAll\(STATIC_ASSETS\)/)
  assert.match(sw, /self\.addEventListener\("message"/)
  assert.match(sw, /event\.data\?\.type === "SKIP_WAITING"/)
  assert.match(sw, /\/brand\/logo-mark\.svg/)
  assert.match(sw, /\/brand\/logo-wordmark\.svg/)
  assert.match(sw, /\/assets\/kana\/kana-seion\.webp/)
  assert.match(sw, /\/assets\/kana\/kana-all@2x\.webp/)
  assert.match(sw, /\/assets\/textures\/paper-washi-tile\.png/)
  assert.match(sw, /\/assets\/vocab-categories\/greetings\.webp/)
  assert.match(sw, /const requestUrl = new URL\(request\.url\)/)
  assert.match(sw, /requestUrl\.origin !== self\.location\.origin/)
  assert.match(sw, /request\.method !== "GET"/)
  assert.match(sw, /request\.mode === "navigate"/)
  assert.match(sw, /networkFirstNavigation\(request\)/)
  assert.match(sw, /async function tryCachePut\(cache, request, response\)/)
  assert.match(sw, /await cache\.put\(request, response\)/)
  assert.match(sw, /Cache writes are best effort and must not block a valid network response/)
  assert.match(sw, /await tryCachePut\(cache, request, response\.clone\(\)\)/)
  assert.match(sw, /cache\.match\(request\)/)
  assert.match(sw, /const staticCached = await caches\.match\(request\)/)
  assert.match(sw, /if \(staticCached\) return staticCached/)
  assert.match(sw, /caches\.match\(OFFLINE_FALLBACK_URL\)/)
  assert.match(sw, /cacheFirstStaticAsset\(request, requestUrl\)/)
  assert.match(sw, /request\.destination === "image"/)
  assert.match(sw, /request\.destination === "style"/)
  assert.match(sw, /request\.destination === "script"/)
  assert.match(sw, /requestUrl\.pathname\.startsWith\("\/animcjk\/"\)/)
  assert.match(sw, /requestUrl\.pathname\.endsWith\("\.svg"\)/)
  assert.match(sw, /await tryCachePut\(cache, request, copy\)/)
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
  assert.match(harness, /const releaseBuildLock = await acquireBuildLock\(\{ label: "pwa production e2e" \}\)/)
  assert.match(harness, /controller\.holdRelease\(releaseBuildLock\)/)
  assert.match(harness, /runNextBuildSync/)
  assert.match(harness, /spawnSync\(process\.execPath, \[nextCli, "build"\]/)
  assert.doesNotMatch(harness, /spawnSync\("cmd\.exe", \["\/d", "\/s", "\/c"/)
  assert.match(harness, /export const nextCli = path\.join\(appDir, "node_modules", "next", "dist", "bin", "next"\)/)
  assert.match(harness, /controller\.spawn\(process\.execPath, \[nextCli, "start", "--hostname", "127\.0\.0\.1", "--port"/)
  assert.match(pwaE2e, /navigator\.serviceWorker\.ready/)
  assert.match(pwaE2e, /context\.setOffline\(true\)/)
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
  assert.match(pwaE2e, /context\.route\(fallbackUrl, \(route\) => route\.abort\("failed"\)\)/)
  assert.match(pwaE2e, /page\.goto\(fallbackUrl/)
  assert.match(pwaE2e, /navigation failures should render the offline fallback/)
  assert.match(pwaE2e, /yasashi\.learning\.profile\.v1/)
  assert.match(pwaE2e, /offline fallback must not overwrite local learning state/)
})
