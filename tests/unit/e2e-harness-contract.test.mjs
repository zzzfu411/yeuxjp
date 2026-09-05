import assert from "node:assert/strict"
import { EventEmitter } from "node:events"
import fs from "node:fs"
import path from "node:path"
import test from "node:test"

import { createPageIssueCollector, isExpectedBrowserRequestAbort } from "../e2e/harness.mjs"

const root = path.resolve(import.meta.dirname, "..", "..")
const workspacePackagePath = path.join(root, "..", "package.json")
const rootPackage = fs.existsSync(workspacePackagePath)
  ? fs.readFileSync(workspacePackagePath, "utf8")
  : null
const webPackage = fs.readFileSync(path.join(root, "package.json"), "utf8")
const rootPackageJson = rootPackage ? JSON.parse(rootPackage) : null
const webPackageJson = JSON.parse(webPackage)
const harness = fs.readFileSync(path.join(root, "tests/e2e/harness.mjs"), "utf8")
const smoke = fs.readFileSync(path.join(root, "tests/e2e/smoke.mjs"), "utf8")

test("E2E harness owns shared Playwright optional dependency handling", () => {
  assert.match(harness, /export async function importPlaywrightOrSkip/)
  assert.match(harness, /await import\("playwright"\)/)
  assert.match(harness, /Cannot find package 'playwright'/)
  assert.match(harness, /process\.exit\(0\)/)
  assert.match(harness, /process\.exit\(2\)/)
  assert.match(harness, /export function skipOptionalPlaywrightRuntimeError/)
  assert.match(harness, /Executable doesn't exist/)
  assert.match(harness, /playwright install/)
  assert.match(harness, /if \(required\) return false/)
})

test("E2E harness collects browser runtime issues", () => {
  class FakePage extends EventEmitter {
    constructor(url) {
      super()
      this.currentUrl = url
    }

    url() {
      return this.currentUrl
    }
  }

  const page = new FakePage("http://127.0.0.1:3210/quiz")
  const collector = createPageIssueCollector({ label: "Unit E2E" })
  collector.attachPage(page)
  collector.attachPage(page)

  page.emit("console", { type: () => "error", text: () => "Unexpected console failure" })
  page.emit("pageerror", new Error("Unexpected page failure"))
  page.emit("requestfailed", {
    method: () => "GET",
    url: () => "http://127.0.0.1:3210/_next/static/chunk.js",
    resourceType: () => "script",
    failure: () => ({ errorText: "net::ERR_FAILED" }),
  })

  assert.equal(collector.issues.length, 3)
  assert.throws(
    () => collector.assertNoIssues(),
    /Unit E2E captured 3 unexpected browser issue\(s\):[\s\S]*console\.error[\s\S]*pageerror[\s\S]*requestfailed/
  )
  assert.match(
    collector.appendToError(new Error("Primary assertion failed")).message,
    /Primary assertion failed[\s\S]*Unit E2E also captured 3 browser issue\(s\)/
  )
})

test("E2E harness issue collector supports context pages and allowlists", () => {
  class FakePage extends EventEmitter {
    constructor(url) {
      super()
      this.currentUrl = url
    }

    url() {
      return this.currentUrl
    }
  }

  class FakeContext extends EventEmitter {
    constructor(pages) {
      super()
      this.currentPages = pages
    }

    pages() {
      return this.currentPages
    }
  }

  const existingPage = new FakePage("http://127.0.0.1:3220/")
  const newPage = new FakePage("http://127.0.0.1:3220/offline-smoke")
  const context = new FakeContext([existingPage])
  const collector = createPageIssueCollector({
    allowConsoleMessage: (message) => message.text().includes("Failed to load resource"),
    allowRequestFailure: (request) => request.url().includes("/offline-smoke"),
  })

  collector.attachContext(context)
  context.emit("page", newPage)
  existingPage.emit("console", { type: () => "warning", text: () => "Allowed warning" })
  newPage.emit("console", { type: () => "error", text: () => "Failed to load resource: net::ERR_FAILED" })
  newPage.emit("requestfailed", {
    method: () => "GET",
    url: () => "http://127.0.0.1:3220/offline-smoke",
    resourceType: () => "document",
    failure: () => ({ errorText: "net::ERR_FAILED" }),
  })

  assert.deepEqual(collector.issues, [])
  assert.doesNotThrow(() => collector.assertNoIssues())
})

test("E2E harness only treats known browser request aborts as benign", () => {
  const makeRequest = ({ url, method = "GET", resourceType = "fetch", errorText = "net::ERR_ABORTED" }) => ({
    method: () => method,
    url: () => url,
    resourceType: () => resourceType,
    failure: () => ({ errorText }),
  })

  assert.equal(
    isExpectedBrowserRequestAbort(makeRequest({ url: "http://127.0.0.1:3210/review?_rsc=abc" })),
    true
  )
  assert.equal(
    isExpectedBrowserRequestAbort(makeRequest({ url: "http://127.0.0.1:3210/animcjk/kana/12354.svg", method: "HEAD" })),
    true
  )
  assert.equal(
    isExpectedBrowserRequestAbort(makeRequest({
      url: "http://127.0.0.1:3210/_next/static/chunks/app.js",
      resourceType: "script",
    })),
    true
  )
  assert.equal(
    isExpectedBrowserRequestAbort(makeRequest({ url: "http://127.0.0.1:3210/_next/static/app.js", resourceType: "script" })),
    false
  )
  assert.equal(
    isExpectedBrowserRequestAbort(makeRequest({
      url: "http://127.0.0.1:3210/_next/static/media/lxgwwenkaiscreen-subset-104.eb8cabd2.woff2",
      resourceType: "font",
    })),
    true
  )
  assert.equal(
    isExpectedBrowserRequestAbort(makeRequest({
      url: "http://127.0.0.1:3210/fonts/ma-shan-zheng/ma-shan-zheng-chinese-simplified-400-normal.woff2",
      resourceType: "font",
    })),
    true
  )
  assert.equal(
    isExpectedBrowserRequestAbort(makeRequest({
      url: "http://127.0.0.1:3210/fonts/lxgw/files/lxgwwenkaiscreen.woff2",
      resourceType: "font",
    })),
    true
  )
  assert.equal(
    isExpectedBrowserRequestAbort(makeRequest({
      url: "http://127.0.0.1:3210/fonts/caveat/caveat-latin-400-normal.woff2",
      resourceType: "font",
    })),
    true
  )
  assert.equal(
    isExpectedBrowserRequestAbort(makeRequest({
      url: "http://127.0.0.1:3210/fonts/ma-shan-zheng/ma-shan-zheng-chinese-simplified-400-normal.woff2",
      resourceType: "font",
      errorText: "net::ERR_FAILED",
    })),
    false
  )
  assert.equal(
    isExpectedBrowserRequestAbort(makeRequest({
      url: "http://127.0.0.1:3210/fonts/ma-shan-zheng/ma-shan-zheng-chinese-simplified-400-normal.woff2",
      resourceType: "script",
    })),
    false
  )
  assert.equal(
    isExpectedBrowserRequestAbort(makeRequest({
      url: "http://127.0.0.1:3210/_next/image?url=%2Fassets%2Fstates%2Fstate-complete.webp&w=384&q=75",
      resourceType: "image",
    })),
    true
  )
  assert.equal(
    isExpectedBrowserRequestAbort(makeRequest({ url: "http://127.0.0.1:3210/review?_rsc=abc", errorText: "net::ERR_FAILED" })),
    false
  )
})

test("E2E harness owns server lifecycle and storage helpers", () => {
  const buildScript = fs.readFileSync(path.join(root, "scripts/build.mjs"), "utf8")
  const buildLock = fs.readFileSync(path.join(root, "scripts/build-lock.mjs"), "utf8")
  const runBuildIfNeededBody = harness.match(/export function runBuildIfNeeded[\s\S]*?\n}\n\nexport async function startProductionServer/)?.[0] ?? ""
  const startProductionServerBody = harness.match(/export async function startProductionServer[\s\S]*?\n}\n\nexport async function readJsonStorage/)?.[0] ?? ""

  assert.match(harness, /export function createServerController/)
  assert.match(harness, /spawnSync\("taskkill"/)
  assert.match(harness, /async stop\(\)/)
  assert.match(harness, /await waitForProcessExit\(runningServer\)/)
  assert.match(harness, /export async function reuseOrStartDevServer/)
  assert.match(harness, /await waitForNextDevLockRelease\(\)/)
  assert.match(harness, /export async function startBuiltProductionServer/)
  assert.match(harness, /const productionBuildIdPath = path\.join\(appDir, "\.next", "BUILD_ID"\)/)
  assert.match(harness, /Missing production build before \$\{label\}/)
  assert.match(harness, /export async function startProductionServer/)
  assert.match(harness, /import fs from "node:fs"/)
  assert.match(harness, /import net from "node:net"/)
  assert.match(harness, /export async function findAvailablePort/)
  assert.match(harness, /const selectedPort = await findAvailablePort\(port\)/)
  assert.match(harness, /const selectedBaseUrl = `http:\/\/127\.0\.0\.1:\$\{selectedPort\}`/)
  assert.match(harness, /import \{ acquireBuildLock \} from "\.\.\/\.\.\/scripts\/build-lock\.mjs"/)
  assert.match(harness, /export const nextCli = path\.join\(appDir, "node_modules", "next", "dist", "bin", "next"\)/)
  assert.match(harness, /function runNextBuildSync/)
  assert.match(harness, /spawnSync\(process\.execPath, \[nextCli, "build"\]/)
  assert.match(harness, /controller\.spawn\(process\.execPath, \[nextCli, "dev", "--hostname", "127\.0\.0\.1", "--port"/)
  assert.doesNotMatch(harness, /spawnSync\("cmd\.exe", \["\/d", "\/s", "\/c"/)
  assert.doesNotMatch(harness, /npm\.cmd run dev/)
  assert.match(harness, /export async function startProductionServer\(\{ baseUrl, port, controller, label = "production E2E" \}\)/)
  assert.match(startProductionServerBody, /if \(process\.env\.E2E_BASE_URL && await canServeRoutes\(baseUrl\)\) return baseUrl/)
  assert.match(harness, /const releaseBuildLock = await acquireBuildLock\(\{ label \}\)/)
  assert.match(harness, /controller\.holdRelease\(releaseBuildLock\)/)
  assert.match(harness, /runBuildIfNeeded\(label\)/)
  assert.doesNotMatch(runBuildIfNeededBody, /E2E_BASE_URL/)
  assert.match(harness, /controller\.spawn\(process\.execPath, \[nextCli, "start", "--hostname", "127\.0\.0\.1", "--port"/)
  assert.match(harness, /export async function readJsonStorage/)
  assert.match(harness, /export async function rapidClick/)
  assert.match(harness, /dispatchEvent\(new MouseEvent\("click"/)
  assert.match(buildScript, /withBuildLock/)
  assert.match(buildScript, /nextCli/)
  assert.match(buildLock, /export async function acquireBuildLock/)
  assert.match(buildLock, /defaultBuildLockDir/)
})

test("optional browser E2E scripts skip missing Playwright browser binaries", () => {
  const browser = fs.readFileSync(path.join(root, "tests/e2e/browser.mjs"), "utf8")
  const pwa = fs.readFileSync(path.join(root, "tests/e2e/pwa-offline.mjs"), "utf8")

  for (const source of [browser, pwa]) {
    assert.match(source, /skipOptionalPlaywrightRuntimeError/)
    assert.match(source, /browser binaries are not installed/)
    assert.match(source, /npm run e2e:install --prefix web/)
    assert.match(source, /failure = null/)
  }
})

test("browser-backed E2E scripts fail on unexpected page issues", () => {
  const browser = fs.readFileSync(path.join(root, "tests/e2e/browser.mjs"), "utf8")
  const pwa = fs.readFileSync(path.join(root, "tests/e2e/pwa-offline.mjs"), "utf8")
  const mobile = fs.readFileSync(path.join(root, "tests/e2e/browser-flow-mobile.mjs"), "utf8")

  assert.match(harness, /export function isExpectedBrowserRequestAbort/)
  assert.match(harness, /requestUrl\.searchParams\.has\("_rsc"\)/)
  assert.match(harness, /requestUrl\.pathname\.startsWith\("\/animcjk\/"\)/)
  assert.match(harness, /requestUrl\.pathname\.startsWith\("\/_next\/static\/chunks\/"\)/)
  assert.match(browser, /allowRequestFailure: isExpectedBrowserRequestAbort/)
  assert.match(
    pwa,
    /isExpectedBrowserRequestAbort\(request\)[\s\S]*allowedRouteAbortUrls\.has\(request\.url\(\)\)[\s\S]*isIntentionalOfflineRscFailure\(request\)/
  )
  assert.match(pwa, /let allowOfflineResourceFailures = false/)
  assert.match(pwa, /function isIntentionalOfflineRscFailure\(request\)/)
  assert.match(pwa, /requestUrl\.searchParams\.has\("_rsc"\)/)
  assert.match(pwa, /allowOfflineResourceFailures = true/)
  assert.match(pwa, /allowOfflineResourceFailures = false/)
  assert.match(pwa, /message\.location\(\)\.url/)
  assert.match(pwa, /allowedRouteAbortUrls\.has\(locationUrl\)/)
  assert.match(pwa, /if \(allowOfflineResourceFailures\) return true/)
  assert.match(pwa, /message\.text\(\)\.includes\(url\)/)
  assert.match(browser, /issueCollector\?\.appendToError\(error\) \?\? error/)
  assert.match(pwa, /issueCollector\?\.appendToError\(error\) \?\? error/)

  for (const source of [browser, pwa]) {
    assert.match(source, /createPageIssueCollector/)
    assert.match(source, /issueCollector\.attachContext\(context\)/)
    assert.match(source, /issueCollector\.attachPage\(page\)/)
    assert.match(source, /issueCollector\.assertNoIssues\(\)/)
  }

  assert.match(browser, /verifyMobileSmoke\(browser, baseUrl, issueCollector\)/)
  assert.match(mobile, /issueCollector\?\.attachContext\(mobileContext\)/)
  assert.match(mobile, /issueCollector\?\.attachPage\(mobilePage\)/)
  assert.match(pwa, /allowedRouteAbortUrls\.add\(realOfflineFallbackUrl\)/)
  assert.match(pwa, /allowedRouteAbortUrls\.add\(knownRouteAbortUrl\)/)
  assert.match(pwa, /allowedRouteAbortUrls\.add\(fallbackUrl\)/)
})

test("browser-backed E2E scripts exit explicitly after cleanup", () => {
  const browser = fs.readFileSync(path.join(root, "tests/e2e/browser.mjs"), "utf8")
  const pwa = fs.readFileSync(path.join(root, "tests/e2e/pwa-offline.mjs"), "utf8")

  for (const source of [browser, pwa]) {
    assert.match(source, /process\.exit\(1\)/)
    assert.match(source, /process\.exit\(0\)/)
  }
  assert.match(pwa, /await context\?\.close\(\)/)
})

test("HTTP smoke verifies the existing production build through the shared E2E server harness", () => {
  assert.match(smoke, /createServerController/)
  assert.match(smoke, /startBuiltProductionServer/)
  assert.match(smoke, /label: "HTTP production smoke"/)
  assert.match(smoke, /await serverController\.stop\(\)/)
  assert.doesNotMatch(smoke, /reuseOrStartDevServer/)
  assert.doesNotMatch(smoke, /E2E_BASE_URL/)
  assert.doesNotMatch(smoke, /from "node:child_process"/)
  assert.doesNotMatch(smoke, /spawnSync\("taskkill"/)
  assert.doesNotMatch(smoke, /waitForServer/)
})

test("root check command forwards to the app quality gate", () => {
  if (!rootPackage) return

  assert.match(rootPackage, /"check": "npm run check --prefix web"/)
  assert.match(rootPackage, /"check:release": "npm run check:release --prefix web"/)
})

test("root package remains a dependency-free forwarding entrypoint", () => {
  if (!rootPackageJson) return

  assert.deepEqual(rootPackageJson.dependencies ?? {}, {})
  assert.deepEqual(rootPackageJson.devDependencies ?? {}, {})
  assert.equal(rootPackageJson.scripts["validate:data"], "npm run validate:data --prefix web")
  assert.equal(rootPackageJson.scripts.check, "npm run check --prefix web")
  assert.equal(rootPackageJson.scripts["check:release"], "npm run check:release --prefix web")
  assert.equal(rootPackageJson.scripts["e2e"], "npm run e2e --prefix web")
  assert.equal(rootPackageJson.scripts["e2e:install"], "npm run e2e:install --prefix web")
  assert.equal(rootPackageJson.scripts["e2e:install:ci"], "npm run e2e:install:ci --prefix web")
  assert.equal(rootPackageJson.scripts["e2e:browser"], "npm run e2e:browser --prefix web")
  assert.equal(rootPackageJson.scripts["e2e:browser:required"], "npm run e2e:browser:required --prefix web")
  assert.equal(rootPackageJson.scripts["e2e:pwa"], "npm run e2e:pwa --prefix web")
  assert.equal(rootPackageJson.scripts["e2e:pwa:required"], "npm run e2e:pwa:required --prefix web")
  assert.equal(rootPackageJson.scripts["download:kana:animcjk"], "node scripts/download-animcjk-kana.mjs")
  assert.notEqual(rootPackageJson.scripts["validate:data"], webPackageJson.scripts["validate:data"])
})

test("app-local check command matches the root quality gate", () => {
  assert.match(webPackage, /"validate:data": "node scripts\/generate-learning-index\.mjs --check && node scripts\/validate-data\.mjs"/)
  assert.equal(webPackageJson.scripts.build, "node scripts/build.mjs")
  assert.match(webPackage, /"check": "npm run validate:data && npm run lint && npm run test && npm run build && npm run e2e"/)
  assert.match(webPackage, /"check:release": "npm run check && npm run e2e:browser:required && npm run e2e:pwa:required"/)
  assert.match(webPackage, /"e2e:install": "playwright install chromium"/)
  assert.match(webPackage, /"e2e:install:ci": "playwright install --with-deps chromium"/)
  assert.match(webPackage, /"playwright": "\^1\.60\.0"/)
})

test("app-local lint command scans source-owned code instead of generated assets", () => {
  assert.equal(webPackageJson.scripts.lint, "eslint src scripts tests")
  assert.doesNotMatch(webPackageJson.scripts.lint, /eslint\s*$/)
  assert.doesNotMatch(webPackageJson.scripts.lint, /\bpublic\b/)
  assert.doesNotMatch(webPackageJson.scripts.lint, /\.git/)
})

test("E2E gate contracts support app-only CI checkouts", () => {
  assert.equal(webPackageJson.scripts.check, "npm run validate:data && npm run lint && npm run test && npm run build && npm run e2e")
  assert.equal(webPackageJson.scripts["check:release"], "npm run check && npm run e2e:browser:required && npm run e2e:pwa:required")
})
