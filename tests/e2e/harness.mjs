import { spawn, spawnSync } from "node:child_process"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { canServeRoutes, waitForServer } from "./app-health.mjs"

export const appDir = fileURLToPath(new URL("../..", import.meta.url))

export function npmCommand() {
  return process.platform === "win32" ? "npm.cmd" : "npm"
}

function runNpmScriptSync(args) {
  const env = { ...process.env, NEXT_TELEMETRY_DISABLED: "1" }
  if (process.platform === "win32") {
    return spawnSync("cmd.exe", ["/d", "/s", "/c", ["npm.cmd", ...args].join(" ")], {
      cwd: appDir,
      stdio: "inherit",
      env,
    })
  }

  return spawnSync("npm", args, {
    cwd: appDir,
    stdio: "inherit",
    env,
  })
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
    stop() {
      if (server?.pid) {
        if (process.platform === "win32") {
          spawnSync("taskkill", ["/pid", String(server.pid), "/t", "/f"], { stdio: "ignore" })
        } else {
          server.kill("SIGTERM")
        }
      }
      server?.stdout.destroy()
      server?.stderr.destroy()
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

  const command = process.platform === "win32" ? `npm.cmd run dev -- --hostname 127.0.0.1 --port ${port}` : "npm"
  const args = process.platform === "win32" ? [] : ["run", "dev", "--", "--hostname", "127.0.0.1", "--port", String(port)]
  controller.spawn(command, args, {
    cwd: appDir,
    stdio: "pipe",
    shell: process.platform === "win32",
    env: { ...process.env, NEXT_TELEMETRY_DISABLED: "1" },
  })
  await waitForServer(baseUrl)
  return baseUrl
}

export function runBuildIfNeeded() {
  if (process.env.E2E_BASE_URL) return
  const result = runNpmScriptSync(["run", "build"])
  if (result.status !== 0) {
    const detail = result.error ? `: ${result.error.message}` : ""
    throw new Error(`Production build failed before PWA E2E${detail}`)
  }
}

export async function startProductionServer({ baseUrl, port, controller }) {
  if (process.env.E2E_BASE_URL && await canServeRoutes(baseUrl)) return baseUrl

  runBuildIfNeeded()
  const nextCli = path.join(appDir, "node_modules", "next", "dist", "bin", "next")
  controller.spawn(process.execPath, [nextCli, "start", "--hostname", "127.0.0.1", "--port", String(port)], {
    cwd: appDir,
    stdio: "pipe",
    env: { ...process.env, NEXT_TELEMETRY_DISABLED: "1" },
  })
  await waitForServer(baseUrl)
  return baseUrl
}

export async function readJsonStorage(page, key) {
  return page.evaluate((storageKey) => {
    const raw = localStorage.getItem(storageKey)
    return raw ? JSON.parse(raw) : null
  }, key)
}
