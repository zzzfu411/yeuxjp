import { spawn, spawnSync } from "node:child_process"
import assert from "node:assert/strict"
import { fileURLToPath } from "node:url"
import { canServeRoutes, waitForServer } from "./app-health.mjs"

const port = Number(process.env.E2E_PWA_PORT ?? 3220)
let baseUrl = process.env.E2E_BASE_URL ?? `http://127.0.0.1:${port}`
const pwaE2ERequired = process.argv.includes("--required") || process.env.E2E_PWA_REQUIRED === "1"
const appDir = fileURLToPath(new URL("../..", import.meta.url))

function isMissingPlaywright(error) {
  const message = error instanceof Error ? error.message : String(error)
  return message.includes("Cannot find package 'playwright'") || message.includes('Cannot find package "playwright"')
}

async function importPlaywright() {
  try {
    return await import("playwright")
  } catch (error) {
    if (!pwaE2ERequired && isMissingPlaywright(error)) {
      console.warn("PWA E2E skipped: Playwright is not installed. Run `npm run e2e:pwa:required --prefix web` when browser dependencies are available.")
      process.exit(0)
    }
    console.error("PWA E2E requires Playwright. Install browser dependencies or set E2E_BASE_URL and run in an environment with Playwright available.")
    console.error(error instanceof Error ? error.message : String(error))
    process.exit(2)
  }
}

let server = null
let output = ""

function npmCommand() {
  return process.platform === "win32" ? "npm.cmd" : "npm"
}

function stopServer() {
  if (!server?.pid) return
  if (process.platform === "win32") {
    spawnSync("taskkill", ["/pid", String(server.pid), "/t", "/f"], { stdio: "ignore" })
    return
  }
  server.kill("SIGTERM")
}

function runBuildIfNeeded() {
  if (process.env.E2E_BASE_URL) return
  const result = spawnSync(npmCommand(), ["run", "build"], {
    cwd: appDir,
    stdio: "inherit",
    env: { ...process.env, NEXT_TELEMETRY_DISABLED: "1" },
  })
  if (result.status !== 0) {
    throw new Error("Production build failed before PWA E2E")
  }
}

async function ensureProductionServer() {
  if (process.env.E2E_BASE_URL && await canServeRoutes(baseUrl)) return

  runBuildIfNeeded()
  server = spawn(npmCommand(), ["run", "start", "--", "--hostname", "127.0.0.1", "--port", String(port)], {
    cwd: appDir,
    stdio: "pipe",
    env: { ...process.env, NEXT_TELEMETRY_DISABLED: "1" },
  })
  server.stdout.on("data", (chunk) => {
    output += chunk.toString()
  })
  server.stderr.on("data", (chunk) => {
    output += chunk.toString()
  })
  await waitForServer(baseUrl)
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
  const { chromium } = await importPlaywright()
  await ensureProductionServer()
  browser = await chromium.launch({ headless: true })
  const context = await browser.newContext()
  const page = await context.newPage()

  await page.goto(baseUrl, { waitUntil: "networkidle" })
  await waitForServiceWorker(page)

  const sentinel = JSON.stringify({ pwaOfflineSmoke: true, savedAt: 123 })
  await page.evaluate((value) => {
    localStorage.setItem("yasashi.learning.lessons.v1", value)
  }, sentinel)

  await context.setOffline(true)
  await page.goto(`${baseUrl}/offline-smoke-${Date.now()}`, { waitUntil: "domcontentloaded" })
  assert.ok(await page.getByText("当前离线").isVisible(), "navigation failures should render the offline fallback")

  const persisted = await page.evaluate(() => localStorage.getItem("yasashi.learning.lessons.v1"))
  assert.equal(persisted, sentinel, "offline fallback must not overwrite local learning state")

  await context.setOffline(false)
  console.log(`PWA offline E2E checks passed at ${baseUrl}`)
} catch (error) {
  console.error(output)
  failure = error
} finally {
  await browser?.close()
  stopServer()
  server?.stdout.destroy()
  server?.stderr.destroy()
}

if (failure) {
  console.error(failure)
  process.exit(1)
}
