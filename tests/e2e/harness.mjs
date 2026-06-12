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

export function runBuildIfNeeded() {
  if (process.env.E2E_BASE_URL) return
  const result = runNextBuildSync()
  if (result.status !== 0) {
    const detail = result.error ? `: ${result.error.message}` : ""
    throw new Error(`Production build failed before PWA E2E${detail}`)
  }
}

export async function startProductionServer({ baseUrl, port, controller }) {
  if (process.env.E2E_BASE_URL && await canServeRoutes(baseUrl)) return baseUrl

  const releaseBuildLock = await acquireBuildLock({ label: "pwa production e2e" })
  controller.holdRelease(releaseBuildLock)
  runBuildIfNeeded()
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

export async function readJsonStorage(page, key) {
  return page.evaluate((storageKey) => {
    const raw = localStorage.getItem(storageKey)
    return raw ? JSON.parse(raw) : null
  }, key)
}
