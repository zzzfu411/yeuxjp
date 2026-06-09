import assert from "node:assert/strict"
import {
  createServerController,
  importPlaywrightOrSkip,
  isE2ERequired,
  startProductionServer,
} from "./harness.mjs"

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

let browser = null
let failure = null

try {
  const { chromium } = await importPlaywrightOrSkip({
    required: pwaE2ERequired,
    label: "PWA E2E",
    skipMessage: "PWA E2E skipped: Playwright is not installed. Run `npm run e2e:pwa:required --prefix web` when browser dependencies are available.",
    errorMessage: "PWA E2E requires Playwright. Install browser dependencies or set E2E_BASE_URL and run in an environment with Playwright available.",
  })
  await ensureProductionServer()
  browser = await chromium.launch({ headless: true })
  const context = await browser.newContext()
  const page = await context.newPage()

  await page.goto(baseUrl, { waitUntil: "networkidle" })
  await waitForServiceWorker(page)

  const visitedLessonUrl = `${baseUrl}/learn/day-1-a-row-hello`
  await page.goto(visitedLessonUrl, { waitUntil: "networkidle" })
  await assert.doesNotReject(
    page.getByTestId("lesson-next").waitFor({ state: "visible", timeout: 10_000 }),
    "lesson page should load before offline cache verification"
  )

  const sentinel = JSON.stringify({ pwaOfflineSmoke: true, savedAt: 123 })
  await page.evaluate((value) => {
    localStorage.setItem("yasashi.learning.lessons.v1", value)
  }, sentinel)

  await context.setOffline(true)
  await page.goto(visitedLessonUrl, { waitUntil: "domcontentloaded" })
  assert.ok(await page.getByTestId("lesson-next").isVisible(), "offline navigation cache should serve a visited lesson page")

  await page.goto(`${baseUrl}/offline-smoke-${Date.now()}`, { waitUntil: "domcontentloaded" })
  assert.ok(await page.getByText("当前离线").isVisible(), "navigation failures should render the offline fallback")

  const persisted = await page.evaluate(() => localStorage.getItem("yasashi.learning.lessons.v1"))
  assert.equal(persisted, sentinel, "offline fallback must not overwrite local learning state")

  await context.setOffline(false)
  console.log(`PWA offline E2E checks passed at ${baseUrl}`)
} catch (error) {
  console.error(serverController.output)
  failure = error
} finally {
  await browser?.close()
  serverController.stop()
}

if (failure) {
  console.error(failure)
  process.exit(1)
}
