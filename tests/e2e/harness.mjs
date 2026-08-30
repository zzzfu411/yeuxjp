import { spawn, spawnSync } from "node:child_process"
import fs from "node:fs"
import net from "node:net"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { acquireBuildLock } from "../../scripts/build-lock.mjs"
import { canServeRoutes, waitForServer } from "./app-health.mjs"

export const appDir = fileURLToPath(new URL("../..", import.meta.url))

export const nextCli = path.join(appDir, "node_modules", "next", "dist", "bin", "next")
const nextDevLockPath = path.join(appDir, ".next", "dev", "lock")
const productionBuildIdPath = path.join(appDir, ".next", "BUILD_ID")

function runNextBuildSync() {
  const env = { ...process.env, NEXT_TELEMETRY_DISABLED: "1" }
  return spawnSync(process.execPath, [nextCli, "build"], {
    cwd: appDir,
    stdio: "inherit",
    env,
  })
}

function canBindPort(port) {
  return new Promise((resolve) => {
    const server = net.createServer()
    server.once("error", () => resolve(false))
    server.once("listening", () => {
      server.close(() => resolve(true))
    })
    server.listen(port, "127.0.0.1")
  })
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function waitForProcessExit(child, timeoutMs = 5_000) {
  if (!child || child.exitCode !== null || child.signalCode !== null) return Promise.resolve()

  return new Promise((resolve) => {
    const finish = () => {
      clearTimeout(timeout)
      child.off("exit", finish)
      child.off("close", finish)
      resolve()
    }
    const timeout = setTimeout(finish, timeoutMs)
    child.once("exit", finish)
    child.once("close", finish)
  })
}

async function waitForNextDevLockRelease({ timeoutMs = 15_000, pollMs = 250 } = {}) {
  const deadline = Date.now() + timeoutMs

  while (fs.existsSync(nextDevLockPath)) {
    if (Date.now() > deadline) {
      throw new Error(`Timed out waiting for stale Next.js dev lock at ${nextDevLockPath}`)
    }
    await sleep(pollMs)
  }
}

export async function findAvailablePort(preferredPort, { maxAttempts = 20 } = {}) {
  for (let offset = 0; offset < maxAttempts; offset += 1) {
    const candidate = preferredPort + offset
    if (await canBindPort(candidate)) return candidate
  }
  throw new Error(`No available E2E port found from ${preferredPort}`)
}

export function isE2ERequired(envName) {
  return process.argv.includes("--required") || process.env[envName] === "1"
}

export async function importPlaywrightOrSkip({
  required,
  label,
  skipMessage,
  errorMessage,
}) {
  try {
    return await import("playwright")
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    const missingPlaywright =
      message.includes("Cannot find package 'playwright'") ||
      message.includes('Cannot find package "playwright"')

    if (!required && missingPlaywright) {
      console.warn(skipMessage)
      process.exit(0)
    }

    console.error(errorMessage ?? `${label} requires Playwright.`)
    console.error(message)
    process.exit(2)
  }
}

export function skipOptionalPlaywrightRuntimeError({
  error,
  required,
  skipMessage,
}) {
  if (required) return false

  const message = error instanceof Error ? error.message : String(error)
  const missingBrowser =
    message.includes("Executable doesn't exist") ||
    message.includes("Please run the following command to download new browsers") ||
    message.includes("playwright install")

  if (!missingBrowser) return false

  console.warn(skipMessage)
  return true
}

function formatPageUrl(page) {
  try {
    return page.url() || "about:blank"
  } catch {
    return "unknown page"
  }
}

function formatError(error) {
  if (error instanceof Error) return error.stack ?? error.message
  return String(error)
}

function formatRequestFailure(request) {
  const failure = request.failure()?.errorText ?? "unknown failure"
  return `${request.method()} ${request.url()} (${request.resourceType()}): ${failure}`
}

export function isExpectedBrowserRequestAbort(request) {
  if (request.failure()?.errorText !== "net::ERR_ABORTED") return false

  const requestUrl = new URL(request.url())
  const isNextRscPrefetch = request.resourceType() === "fetch" && requestUrl.searchParams.has("_rsc")
  const isAnimCjkProbe =
    request.method() === "HEAD" &&
    request.resourceType() === "fetch" &&
    requestUrl.pathname.startsWith("/animcjk/") &&
    requestUrl.pathname.endsWith(".svg")
  const isNextStaticChunk =
    request.method() === "GET" &&
    request.resourceType() === "script" &&
    requestUrl.pathname.startsWith("/_next/static/chunks/")
  // Next.js dev servers inject their own dev-overlay font; navigating away
  // mid-load aborts the request. Not part of the application shell.
  const isNextDevFont =
    request.method() === "GET" &&
    request.resourceType() === "font" &&
    requestUrl.pathname.startsWith("/__nextjs_font/")
  // Paper UI loads LXGW via Next static media; navigating away mid-load aborts it.
  const isNextStaticFont =
    request.method() === "GET" &&
    request.resourceType() === "font" &&
    requestUrl.pathname.startsWith("/_next/static/media/") &&
    (requestUrl.pathname.endsWith(".woff2") || requestUrl.pathname.endsWith(".woff"))
  // Paper restyle also self-hosts public fonts (lxgw, caveat, ma-shan-zheng).
  // Navigating away mid-load aborts those GETs the same way as Next media fonts.
  const isPublicPaperFont =
    request.method() === "GET" &&
    request.resourceType() === "font" &&
    requestUrl.pathname.startsWith("/fonts/") &&
    (requestUrl.pathname.endsWith(".woff2") || requestUrl.pathname.endsWith(".woff"))
  // Decorative paper state images abort when the review flow navigates away.
  const isNextOptimizedImage =
    request.method() === "GET" &&
    request.resourceType() === "image" &&
    requestUrl.pathname === "/_next/image"

  return isNextRscPrefetch || isAnimCjkProbe || isNextStaticChunk || isNextDevFont || isNextStaticFont || isPublicPaperFont || isNextOptimizedImage
}

export function createPageIssueCollector({
  label = "Browser E2E",
  allowConsoleMessage = () => false,
  allowRequestFailure = () => false,
} = {}) {
  const issues = []
  const attachedPages = new WeakSet()
  const attachedContexts = new WeakSet()

  function recordIssue(kind, detail) {
    issues.push(`[${kind}] ${detail}`)
  }

  function attachPage(page) {
    if (!page || attachedPages.has(page)) return
    attachedPages.add(page)

    page.on("pageerror", (error) => {
      recordIssue("pageerror", `${formatPageUrl(page)}\n${formatError(error)}`)
    })

    page.on("console", (message) => {
      if (message.type() !== "error") return
      if (allowConsoleMessage(message, page)) return
      recordIssue("console.error", `${formatPageUrl(page)}\n${message.text()}`)
    })

    page.on("requestfailed", (request) => {
      if (allowRequestFailure(request, page)) return
      recordIssue("requestfailed", `${formatPageUrl(page)}\n${formatRequestFailure(request)}`)
    })
  }

  function attachContext(context) {
    if (!context || attachedContexts.has(context)) return
    attachedContexts.add(context)
    context.on("page", attachPage)
    for (const page of context.pages()) attachPage(page)
  }

  function assertNoIssues() {
    if (!issues.length) return
    const details = issues.map((issue, index) => `${index + 1}. ${issue}`).join("\n")
    const error = new Error(`${label} captured ${issues.length} unexpected browser issue(s):\n${details}`)
    error.name = "PageIssueCollectorError"
    throw error
  }

  function appendToError(error) {
    if (!issues.length) return error
    if (error instanceof Error && error.name === "PageIssueCollectorError") return error
    const details = issues.map((issue, index) => `${index + 1}. ${issue}`).join("\n")
    const merged = new Error(`${formatError(error)}\n\n${label} also captured ${issues.length} browser issue(s):\n${details}`)
    merged.name = "PageIssueCollectorError"
    return merged
  }

  return {
    issues,
    attachContext,
    attachPage,
    appendToError,
    assertNoIssues,
  }
}

export function createServerController() {
  let server = null
  let output = ""
  let release = null

  return {
    get server() {
      return server
    },
    get output() {
      return output
    },
    spawn(command, args, options) {
      server = spawn(command, args, options)
      server.stdout.on("data", (chunk) => {
        output += chunk.toString()
      })
      server.stderr.on("data", (chunk) => {
        output += chunk.toString()
      })
      return server
    },
    holdRelease(callback) {
      release = callback
    },
    async stop() {
      const runningServer = server
      if (server?.pid) {
        if (process.platform === "win32") {
          spawnSync("taskkill", ["/pid", String(server.pid), "/t", "/f"], { stdio: "ignore" })
        } else {
          server.kill("SIGTERM")
        }
        await waitForProcessExit(runningServer)
      }
      server?.stdout.destroy()
      server?.stderr.destroy()
      server = null
      release?.()
      release = null
    },
  }
}

export async function reuseOrStartDevServer({ baseUrl, port, controller }) {
  const candidates = [
    process.env.E2E_BASE_URL,
    process.env.E2E_PORT ? baseUrl : "http://127.0.0.1:3000",
    baseUrl,
  ].filter(Boolean)

  for (const candidate of Array.from(new Set(candidates))) {
    if (await canServeRoutes(candidate)) return candidate
  }

  const selectedPort = await findAvailablePort(port)
  const selectedBaseUrl = `http://127.0.0.1:${selectedPort}`
  await waitForNextDevLockRelease()
  controller.spawn(process.execPath, [nextCli, "dev", "--hostname", "127.0.0.1", "--port", String(selectedPort)], {
    cwd: appDir,
    stdio: "pipe",
    env: { ...process.env, NEXT_TELEMETRY_DISABLED: "1" },
  })
  await waitForServer(selectedBaseUrl)
  return selectedBaseUrl
}

export function runBuildIfNeeded(label = "production E2E") {
  const result = runNextBuildSync()
  if (result.status !== 0) {
    const detail = result.error ? `: ${result.error.message}` : ""
    throw new Error(`Production build failed before ${label}${detail}`)
  }
}

function requireProductionBuild(label) {
  if (fs.existsSync(productionBuildIdPath)) return
  throw new Error(`Missing production build before ${label}. Run \`npm run build\` first.`)
}

async function launchProductionServer({ port, controller }) {
  const selectedPort = await findAvailablePort(port)
  const selectedBaseUrl = `http://127.0.0.1:${selectedPort}`
  controller.spawn(process.execPath, [nextCli, "start", "--hostname", "127.0.0.1", "--port", String(selectedPort)], {
    cwd: appDir,
    stdio: "pipe",
    env: { ...process.env, NEXT_TELEMETRY_DISABLED: "1" },
  })
  await waitForServer(selectedBaseUrl)
  return selectedBaseUrl
}

export async function startBuiltProductionServer({ port, controller, label = "production smoke" }) {
  const releaseBuildLock = await acquireBuildLock({ label })
  controller.holdRelease(releaseBuildLock)
  requireProductionBuild(label)
  return launchProductionServer({ port, controller })
}

export async function startProductionServer({ baseUrl, port, controller, label = "production E2E" }) {
  if (process.env.E2E_BASE_URL && await canServeRoutes(baseUrl)) return baseUrl

  const releaseBuildLock = await acquireBuildLock({ label })
  controller.holdRelease(releaseBuildLock)
  runBuildIfNeeded(label)
  return launchProductionServer({ port, controller })
}

export async function readJsonStorage(page, key) {
  return page.evaluate((storageKey) => {
    const raw = localStorage.getItem(storageKey)
    return raw ? JSON.parse(raw) : null
  }, key)
}

export async function rapidClick(locator, count = 2) {
  await locator.evaluate((element, repeat) => {
    for (let index = 0; index < repeat; index += 1) {
      element.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, view: window }))
    }
  }, count)
}
