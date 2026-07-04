import assert from "node:assert/strict"
import {
  createServerController,
  importPlaywrightOrSkip,
  isE2ERequired,
  skipOptionalPlaywrightRuntimeError,
  startProductionServer,
} from "./harness.mjs"
import { E2E_STORAGE_KEYS } from "./storage-keys.mjs"

const port = Number(process.env.E2E_PWA_PORT ?? 3220)
let baseUrl = process.env.E2E_BASE_URL ?? `http://127.0.0.1:${port}`
const pwaE2ERequired = isE2ERequired("E2E_PWA_REQUIRED")
const serverController = createServerController()

async function ensureProductionServer() {
  baseUrl = await startProductionServer({
    baseUrl,
    port,
    controller: serverController,
  })
}

async function waitForServiceWorker(page) {
  await page.evaluate(async () => {
    if (!("serviceWorker" in navigator)) throw new Error("Service workers are unavailable")
    await navigator.serviceWorker.ready
    if (navigator.serviceWorker.controller) return
    await new Promise((resolve, reject) => {
      const timeout = window.setTimeout(() => reject(new Error("Timed out waiting for service worker control")), 10_000)
      navigator.serviceWorker.addEventListener(
        "controllerchange",
        () => {
          window.clearTimeout(timeout)
          resolve(undefined)
        },
        { once: true }
      )
    })
  })
}

async function disableHttpCache(context, page) {
  const cdp = await context.newCDPSession(page)
  await cdp.send("Network.enable")
  await cdp.send("Network.setCacheDisabled", { cacheDisabled: true })
  return cdp
}

async function assertServiceWorkerStaticCache(page) {
  const cacheState = await page.evaluate(async () => {
    const names = await caches.keys()
    const staticCacheName = names.find((name) => name.startsWith("yasashi-static-"))
    if (!staticCacheName) return { staticCacheName: null, nextStaticUrls: [] }

    const cache = await caches.open(staticCacheName)
    const keys = await cache.keys()
    const nextStaticUrls = keys
      .map((request) => request.url)
      .filter((url) => url.includes("/_next/static/"))

    return { staticCacheName, nextStaticUrls }
  })

  assert.ok(cacheState.staticCacheName, "service worker should create the Yasashi static cache")
  assert.ok(cacheState.nextStaticUrls.length > 0, "service worker static cache should contain Next static assets")
}

let browser = null
let context = null
let failure = null

try {
  const { chromium } = await importPlaywrightOrSkip({
    required: pwaE2ERequired,
    label: "PWA E2E",
    skipMessage: "PWA E2E skipped: Playwright is not installed. Run `npm ci --prefix web`, then `npm run e2e:install --prefix web` before the required PWA E2E.",
    errorMessage: "PWA E2E requires Playwright. Run `npm ci --prefix web`, then `npm run e2e:install --prefix web`, or set E2E_BASE_URL and run in an environment with Playwright available.",
  })
  await ensureProductionServer()
  browser = await chromium.launch({ headless: true })
  context = await browser.newContext()
  const page = await context.newPage()
  const cdp = await disableHttpCache(context, page)

  await page.goto(baseUrl, { waitUntil: "networkidle" })
  await waitForServiceWorker(page)
  await page.reload({ waitUntil: "networkidle" })
  await waitForServiceWorker(page)
  await assertServiceWorkerStaticCache(page)

  await page.goto(`${baseUrl}/kana`, { waitUntil: "networkidle" })
  await page.getByTestId("kana-card-a").waitFor({ state: "visible", timeout: 10_000 })
  await page.goto(`${baseUrl}/vocabulary`, { waitUntil: "networkidle" })
  await page.getByTestId("vocabulary-search").waitFor({ state: "visible", timeout: 10_000 })
  await page.goto(`${baseUrl}/quiz`, { waitUntil: "networkidle" })
  await page.getByTestId("quiz-mode-hiragana-romaji").waitFor({ state: "visible", timeout: 10_000 })
  await page.goto(`${baseUrl}/semantics`, { waitUntil: "networkidle" })
  const firstSemanticsHref = await page.locator('a[href^="/semantics/"]').first().getAttribute("href")
  assert.ok(firstSemanticsHref, "semantics page should expose at least one static detail link")
  const semanticsItemId = firstSemanticsHref.split("/").pop()
  await page.goto(`${baseUrl}${firstSemanticsHref}`, { waitUntil: "networkidle" })
  await page.waitForURL(new RegExp(`${firstSemanticsHref.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`))
  await page.goto(baseUrl, { waitUntil: "networkidle" })

  const visitedLessonUrl = `${baseUrl}/learn/day-1-a-row-hello`
  await page.getByTestId("home-start-learning").click()
  await page.waitForURL(/\/learn\/day-1-a-row-hello/)
  await assert.doesNotReject(
    page.getByTestId("lesson-next").waitFor({ state: "visible", timeout: 10_000 }),
    "lesson page reached through the app link should load before offline cache verification"
  )
  const animCjkPath = "/animcjk/kana/12354.svg"
  const onlineAnimCjkSvg = await page.evaluate(async (path) => {
    const response = await fetch(path)
    return {
      ok: response.ok,
      body: await response.text(),
    }
  }, animCjkPath)
  assert.equal(onlineAnimCjkSvg.ok, true, "AnimCJK SVG should load online before offline cache verification")
  assert.match(onlineAnimCjkSvg.body, /<svg/i, "AnimCJK online response should be an SVG")

  await context.setOffline(true)
  await page.goto(baseUrl, { waitUntil: "domcontentloaded" })
  assert.ok(await page.getByTestId("home-start-learning").isVisible(), "offline static cache should serve the app home page")

  await page.getByTestId("home-start-learning").click()
  await page.waitForURL(/\/learn\/day-1-a-row-hello/)
  assert.ok(await page.getByTestId("lesson-next").isVisible(), "offline client-side links should fall back to document navigation for cached pages")

  await page.goto(baseUrl, { waitUntil: "domcontentloaded" })
  await page.goto(visitedLessonUrl, { waitUntil: "domcontentloaded" })
  assert.ok(await page.getByTestId("lesson-next").isVisible(), "offline navigation cache should serve a visited lesson page")
  const offlineAnimCjkSvg = await page.evaluate(async (path) => {
    const response = await fetch(path)
    return {
      ok: response.ok,
      body: await response.text(),
    }
  }, animCjkPath)
  assert.equal(offlineAnimCjkSvg.ok, true, "offline cache should serve a visited AnimCJK SVG")
  assert.match(offlineAnimCjkSvg.body, /<svg/i, "offline AnimCJK response should remain an SVG")

  await page.goto(`${baseUrl}/kana?mode=katakana&set=yoon`, { waitUntil: "domcontentloaded" })
  await page.getByTestId("kana-card-kya").waitFor({ state: "visible", timeout: 10_000 })
  assert.ok(await page.getByTestId("kana-card-kya").isVisible(), "offline canonical navigation should serve a cached kana query route")

  await page.goto(`${baseUrl}/vocabulary?level=daily`, { waitUntil: "domcontentloaded" })
  await page.getByTestId("vocabulary-search").waitFor({ state: "visible", timeout: 10_000 })
  assert.ok(await page.getByTestId("vocabulary-search").isVisible(), "offline canonical navigation should serve a cached vocabulary query route")

  await page.goto(`${baseUrl}/quiz?mode=hiragana-romaji`, { waitUntil: "domcontentloaded" })
  await page.getByTestId("quiz-score").waitFor({ state: "visible", timeout: 10_000 })
  assert.ok(await page.getByTestId("quiz-score").isVisible(), "offline canonical navigation should serve a cached quiz query route")

  await page.goto(`${baseUrl}/semantics?item=${semanticsItemId}`, { waitUntil: "domcontentloaded" })
  await page.waitForURL(new RegExp(`${firstSemanticsHref.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`))
  assert.ok(page.url().endsWith(firstSemanticsHref), "offline legacy semantics query should document-navigate to the cached static detail route")

  const sentinel = JSON.stringify({ goal: "balanced", dailyMinutes: 15, startedAt: 123, updatedAt: 123 })
  await page.evaluate(({ key, value }) => {
    localStorage.setItem(key, value)
  }, { key: E2E_STORAGE_KEYS.USER_PROFILE, value: sentinel })

  await context.setOffline(false)
  await page.goto(baseUrl, { waitUntil: "domcontentloaded" })
  const knownRouteAbortUrl = `${baseUrl}/learn/day-1-a-row-hello`
  const abortKnownRoute = (route) => route.abort("failed")
  await context.route(knownRouteAbortUrl, abortKnownRoute)
  await page.getByTestId("home-start-learning").click()
  await page.waitForURL(/\/learn\/day-1-a-row-hello/)
  assert.ok(await page.getByTestId("lesson-next").isVisible(), "service-worker-controlled online links should use document navigation and recover from a cached page")
  await context.unroute(knownRouteAbortUrl, abortKnownRoute)

  const fallbackUrl = `${baseUrl}/offline-smoke-${Date.now()}`
  await context.route(fallbackUrl, (route) => route.abort("failed"))
  await page.goto(fallbackUrl, { waitUntil: "domcontentloaded" })
  assert.match(await page.locator("body").innerText(), /当前离线/, "navigation failures should render the offline fallback")

  const persisted = await page.evaluate((key) => localStorage.getItem(key), E2E_STORAGE_KEYS.USER_PROFILE)
  assert.equal(persisted, sentinel, "offline fallback must not overwrite local learning state")
  await cdp.detach()

  console.log(`PWA offline E2E checks passed at ${baseUrl}`)
} catch (error) {
  if (
    skipOptionalPlaywrightRuntimeError({
      error,
      required: pwaE2ERequired,
      skipMessage:
        "PWA E2E skipped: Playwright browser binaries are not installed. Run `npm run e2e:install --prefix web` or use `npm run e2e:pwa:required --prefix web` in a provisioned environment.",
    })
  ) {
    failure = null
  } else {
    console.error(serverController.output)
    failure = error
  }
} finally {
  await context?.close()
  await browser?.close()
  await serverController.stop()
}

if (failure) {
  console.error(failure)
  process.exit(1)
} else {
  process.exit(0)
}
