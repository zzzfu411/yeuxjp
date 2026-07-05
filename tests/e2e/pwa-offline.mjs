import assert from "node:assert/strict"
import {
  createServerController,
  importPlaywrightOrSkip,
  isE2ERequired,
  skipOptionalPlaywrightRuntimeError,
  startProductionServer,
} from "./harness.mjs"
import { seedReviewState, seionHiraganaToRomaji } from "./browser-fixtures.mjs"
import { managedLearningBackupKeys } from "./storage-keys.mjs"

const port = Number(process.env.E2E_PWA_PORT ?? 3220)
let baseUrl = process.env.E2E_BASE_URL ?? `http://127.0.0.1:${port}`
const pwaE2ERequired = isE2ERequired("E2E_PWA_REQUIRED")
const serverController = createServerController()
const KANA_A = String.fromCodePoint(0x3042)
const KATAKANA_KYA = String.fromCodePoint(0x30ad, 0x30e3)
const KONNICHIWA = String.fromCodePoint(0x3053, 0x3093, 0x306b, 0x3061, 0x306f)
const YAKUSOKU_KANJI = String.fromCodePoint(0x7d04, 0x675f)
const YAKUSOKU_KANA = String.fromCodePoint(0x3084, 0x304f, 0x305d, 0x304f)
const SHIRU = String.fromCodePoint(0x77e5, 0x308b)
const WAKARU = String.fromCodePoint(0x5206, 0x304b, 0x308b)
const SHIRU_EXAMPLE = String.fromCodePoint(0x4f4f, 0x6240, 0x3092, 0x77e5, 0x3063, 0x3066, 0x3044, 0x308b, 0x3002)
const PRAGMATICS_MORNING_TITLE = String.fromCodePoint(0x65e9, 0x5b89)
const OHAYOU_GOZAIMASU = String.fromCodePoint(0x304a, 0x306f, 0x3088, 0x3046, 0x3054, 0x3056, 0x3044, 0x307e, 0x3059, 0x3002)
const GRAMMAR_DOJO = "Grammar Dojo"
const OFFLINE_FALLBACK_TEXT = String.fromCodePoint(0x5f53, 0x524d, 0x79bb, 0x7ebf)
const OFFLINE_HOME_LINK_TEXT = String.fromCodePoint(0x56de, 0x5230, 0x9996, 0x9875)
const semanticsItemId = "s-shiru-wakaru"
const semanticsDetailPath = `/semantics/${semanticsItemId}`
const pragmaticsItemId = "p-aisatsu-morning"
const pragmaticsDetailPath = `/pragmatics/${pragmaticsItemId}`

async function ensureProductionServer() {
  baseUrl = await startProductionServer({
    baseUrl,
    port,
    controller: serverController,
    label: "pwa production e2e",
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

async function assertLocatorIncludes(locator, expected, message) {
  const text = await locator.innerText()
  assert.ok(text.includes(expected), `${message}; got ${JSON.stringify(text)}`)
}

async function assertBodyIncludes(page, expected, message) {
  await assertLocatorIncludes(page.locator("body"), expected, message)
}

async function assertBodyExcludes(page, expected, message) {
  const text = await page.locator("body").innerText()
  assert.ok(!text.includes(expected), `${message}; got ${JSON.stringify(text)}`)
}

async function assertKnownHiraganaRomajiQuestion(page, message) {
  await page.getByTestId("quiz-question-text").waitFor({ state: "visible", timeout: 10_000 })
  const quizPrompt = (await page.getByTestId("quiz-question-text").innerText()).trim()
  const expectedAnswer = seionHiraganaToRomaji[quizPrompt]
  assert.ok(expectedAnswer, `${message}: quiz prompt should be a known seion kana, got ${quizPrompt}`)
  const hasExpectedOption = await page.locator('[data-testid^="quiz-answer-option-"]').evaluateAll(
    (buttons, expected) => buttons.some((button) => button.textContent?.trim() === expected),
    expectedAnswer
  )
  assert.ok(hasExpectedOption, `${message}: quiz options should include ${expectedAnswer}`)
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
  await assertLocatorIncludes(page.getByTestId("kana-card-a"), KANA_A, "online kana prewarm should load real kana content")
  await assertLocatorIncludes(page.getByTestId("kana-card-a"), "a", "online kana prewarm should load romaji content")

  await page.goto(`${baseUrl}/vocabulary?level=daily`, { waitUntil: "networkidle" })
  await page.getByTestId("vocabulary-search").waitFor({ state: "visible", timeout: 10_000 })
  await page.getByText(YAKUSOKU_KANJI).first().waitFor({ state: "visible", timeout: 10_000 })
  await assertBodyIncludes(page, YAKUSOKU_KANA, "online vocabulary prewarm should load daily vocabulary details")

  await page.goto(`${baseUrl}/quiz?mode=hiragana-romaji`, { waitUntil: "networkidle" })
  await assertKnownHiraganaRomajiQuestion(page, "online quiz prewarm should load a real question")

  await seedReviewState(page, baseUrl)
  await page.goto(`${baseUrl}/review`, { waitUntil: "networkidle" })
  await page.getByTestId("review-due-state").waitFor({ state: "visible", timeout: 10_000 })
  await page.getByTestId("review-today-due").waitFor({ state: "visible", timeout: 10_000 })
  assert.ok(await page.getByTestId("review-start-kana").isEnabled(), "online review prewarm should load due local review state")

  await page.goto(`${baseUrl}/path`, { waitUntil: "networkidle" })
  await page.getByTestId("path-next-learning").waitFor({ state: "visible", timeout: 10_000 })

  await page.goto(`${baseUrl}/grammar?level=N5`, { waitUntil: "networkidle" })
  await page.getByTestId("grammar-point-n5-wa").waitFor({ state: "visible", timeout: 10_000 })
  await assertBodyIncludes(page, GRAMMAR_DOJO, "online grammar prewarm should load the grammar reference")

  await page.goto(`${baseUrl}/semantics`, { waitUntil: "networkidle" })
  await page.goto(`${baseUrl}${semanticsDetailPath}`, { waitUntil: "networkidle" })
  await page.waitForURL(new RegExp(`${semanticsDetailPath.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`))
  await assertBodyIncludes(page, SHIRU, "online semantics prewarm should load the fixed detail page")
  await assertBodyIncludes(page, WAKARU, "online semantics prewarm should load the comparison term")
  await assertBodyIncludes(page, SHIRU_EXAMPLE, "online semantics prewarm should load example sentences")

  await page.goto(`${baseUrl}/pragmatics`, { waitUntil: "networkidle" })
  await page.goto(`${baseUrl}${pragmaticsDetailPath}`, { waitUntil: "networkidle" })
  await page.waitForURL(new RegExp(`${pragmaticsDetailPath.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`))
  await assertBodyIncludes(page, PRAGMATICS_MORNING_TITLE, "online pragmatics prewarm should load the fixed detail page")
  await assertBodyIncludes(page, OHAYOU_GOZAIMASU, "online pragmatics prewarm should load example responses")
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
  await assertBodyExcludes(page, OFFLINE_FALLBACK_TEXT, "offline home should render the cached app shell instead of fallback copy")

  await page.getByTestId("home-start-learning").click()
  await page.waitForURL(/\/learn\/day-1-a-row-hello/)
  assert.ok(await page.getByTestId("lesson-next").isVisible(), "offline client-side links should fall back to document navigation for cached pages")
  await assertBodyIncludes(page, KONNICHIWA, "offline client-side lesson navigation should render lesson content")
  await assertBodyExcludes(page, OFFLINE_FALLBACK_TEXT, "offline client-side lesson navigation should not render the fallback page")

  await page.goto(baseUrl, { waitUntil: "domcontentloaded" })
  await page.goto(visitedLessonUrl, { waitUntil: "domcontentloaded" })
  assert.ok(await page.getByTestId("lesson-next").isVisible(), "offline navigation cache should serve a visited lesson page")
  await assertBodyIncludes(page, KONNICHIWA, "offline visited lesson page should render cached lesson content")
  const offlineAnimCjkSvg = await page.evaluate(async (path) => {
    const response = await fetch(path)
    return {
      ok: response.ok,
      body: await response.text(),
    }
  }, animCjkPath)
  assert.equal(offlineAnimCjkSvg.ok, true, "offline cache should serve a visited AnimCJK SVG")
  assert.match(offlineAnimCjkSvg.body, /<svg/i, "offline AnimCJK response should remain an SVG")
  assert.match(offlineAnimCjkSvg.body, /viewBox="0 0 1024 1024"/i, "offline AnimCJK response should be the expected glyph SVG")

  await page.goto(`${baseUrl}/kana?mode=katakana&set=yoon`, { waitUntil: "domcontentloaded" })
  await page.getByTestId("kana-card-kya").waitFor({ state: "visible", timeout: 10_000 })
  assert.ok(await page.getByTestId("kana-card-kya").isVisible(), "offline canonical navigation should serve a cached kana query route")
  await assertLocatorIncludes(page.getByTestId("kana-card-kya"), KATAKANA_KYA, "offline kana query should render katakana yoon content")
  await assertLocatorIncludes(page.getByTestId("kana-card-kya"), "kya", "offline kana query should render romaji content")

  await page.goto(`${baseUrl}/vocabulary?level=daily`, { waitUntil: "domcontentloaded" })
  await page.getByTestId("vocabulary-search").waitFor({ state: "visible", timeout: 10_000 })
  assert.ok(await page.getByTestId("vocabulary-search").isVisible(), "offline canonical navigation should serve a cached vocabulary query route")
  await page.getByText(YAKUSOKU_KANJI).first().waitFor({ state: "visible", timeout: 10_000 })
  await assertBodyIncludes(page, YAKUSOKU_KANA, "offline vocabulary query should render daily vocabulary content")

  await page.goto(`${baseUrl}/quiz?mode=hiragana-romaji`, { waitUntil: "domcontentloaded" })
  await page.getByTestId("quiz-score").waitFor({ state: "visible", timeout: 10_000 })
  assert.ok(await page.getByTestId("quiz-score").isVisible(), "offline canonical navigation should serve a cached quiz query route")
  await assertKnownHiraganaRomajiQuestion(page, "offline quiz query should render a real question")

  await page.goto(`${baseUrl}/path`, { waitUntil: "domcontentloaded" })
  await page.getByTestId("path-next-learning").waitFor({ state: "visible", timeout: 10_000 })
  assert.ok(await page.getByTestId("path-next-learning").isVisible(), "offline path page should render the cached learning path")
  await assertBodyExcludes(page, OFFLINE_FALLBACK_TEXT, "offline path page should not render the fallback page")

  await page.goto(`${baseUrl}/grammar?level=N5`, { waitUntil: "domcontentloaded" })
  await page.getByTestId("grammar-point-n5-wa").waitFor({ state: "visible", timeout: 10_000 })
  await assertBodyIncludes(page, GRAMMAR_DOJO, "offline grammar query should render the cached grammar reference")
  await assertBodyExcludes(page, OFFLINE_FALLBACK_TEXT, "offline grammar query should not render the fallback page")

  await page.goto(`${baseUrl}/review`, { waitUntil: "domcontentloaded" })
  await page.getByTestId("review-due-state").waitFor({ state: "visible", timeout: 10_000 })
  await page.getByTestId("review-today-due").waitFor({ state: "visible", timeout: 10_000 })
  assert.ok(await page.getByTestId("review-start-kana").isEnabled(), "offline review page should render due local review state")
  await page.getByTestId("review-start-kana").click()
  await page.getByTestId("review-answer-a").waitFor({ state: "visible", timeout: 10_000 })
  assert.ok(await page.getByTestId("review-answer-a").isVisible(), "offline review session should render the seeded kana answer")

  await page.goto(`${baseUrl}/semantics?item=${semanticsItemId}`, { waitUntil: "domcontentloaded" })
  await page.waitForURL(new RegExp(`${semanticsDetailPath.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`))
  assert.ok(page.url().endsWith(semanticsDetailPath), "offline legacy semantics query should document-navigate to the cached static detail route")
  await assertBodyIncludes(page, SHIRU, "offline semantics query should render the cached detail term")
  await assertBodyIncludes(page, WAKARU, "offline semantics query should render the cached comparison term")
  await assertBodyIncludes(page, SHIRU_EXAMPLE, "offline semantics query should render cached example sentences")

  await page.goto(`${baseUrl}${pragmaticsDetailPath}`, { waitUntil: "domcontentloaded" })
  assert.ok(page.url().endsWith(pragmaticsDetailPath), "offline pragmatics detail should stay on the cached static detail route")
  await assertBodyIncludes(page, PRAGMATICS_MORNING_TITLE, "offline pragmatics detail should render the cached title")
  await assertBodyIncludes(page, OHAYOU_GOZAIMASU, "offline pragmatics detail should render cached example responses")
  await assertBodyExcludes(page, OFFLINE_FALLBACK_TEXT, "offline pragmatics detail should not render the fallback page")

  const realOfflineFallbackUrl = `${baseUrl}/offline-unvisited-${Date.now()}`
  const abortRealOfflineFallback = (route) => route.abort("failed")
  await context.route(realOfflineFallbackUrl, abortRealOfflineFallback)
  await page.goto(realOfflineFallbackUrl, { waitUntil: "domcontentloaded" })
  await assertBodyIncludes(page, OFFLINE_FALLBACK_TEXT, "real offline unvisited pages should render the offline fallback")
  await page.getByRole("link", { name: OFFLINE_HOME_LINK_TEXT }).click()
  await page.getByTestId("home-start-learning").waitFor({ state: "visible", timeout: 10_000 })
  assert.equal(page.url(), `${baseUrl}/`, "offline fallback home link should navigate to the cached app shell")
  await assertBodyExcludes(page, OFFLINE_FALLBACK_TEXT, "offline fallback home link should restore the cached home app shell")
  await context.unroute(realOfflineFallbackUrl, abortRealOfflineFallback)

  await context.setOffline(false)
  await page.goto(baseUrl, { waitUntil: "domcontentloaded" })
  const knownRouteAbortUrl = `${baseUrl}/learn/day-1-a-row-hello`
  const abortKnownRoute = (route) => route.abort("failed")
  await context.route(knownRouteAbortUrl, abortKnownRoute)
  await page.getByTestId("home-start-learning").click()
  await page.waitForURL(/\/learn\/day-1-a-row-hello/)
  assert.ok(await page.getByTestId("lesson-next").isVisible(), "service-worker-controlled online links should use document navigation and recover from a cached page")
  await context.unroute(knownRouteAbortUrl, abortKnownRoute)

  const learningStateSentinel = Object.fromEntries(
    managedLearningBackupKeys.map((key, index) => [
      key,
      JSON.stringify({ key, index, preservedBy: "pwa-offline-fallback" }),
    ])
  )
  await page.evaluate((entries) => {
    for (const [key, value] of Object.entries(entries)) {
      localStorage.setItem(key, value)
    }
  }, learningStateSentinel)

  const fallbackUrl = `${baseUrl}/offline-smoke-${Date.now()}`
  await context.route(fallbackUrl, (route) => route.abort("failed"))
  await page.goto(fallbackUrl, { waitUntil: "domcontentloaded" })
  assert.match(await page.locator("body").innerText(), /当前离线/, "navigation failures should render the offline fallback")

  const persistedLearningState = await page.evaluate((keys) => {
    return Object.fromEntries(keys.map((key) => [key, localStorage.getItem(key)]))
  }, managedLearningBackupKeys)
  assert.deepEqual(
    persistedLearningState,
    learningStateSentinel,
    "offline fallback must not overwrite any managed local learning state"
  )
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
