import { spawn, spawnSync } from "node:child_process"
import assert from "node:assert/strict"
import { fileURLToPath } from "node:url"
import {
  appHealthRoutes,
  canServeRoutes,
  pageLooksLikeYasashi,
  waitForServer,
} from "./app-health.mjs"

const port = Number(process.env.E2E_PORT ?? 3210)
let baseUrl = process.env.E2E_BASE_URL ?? `http://127.0.0.1:${port}`
const routes = appHealthRoutes

const appDir = fileURLToPath(new URL("../..", import.meta.url))

let output = ""
let server = null

function stopServer() {
  if (!server?.pid) return

  if (process.platform === "win32") {
    spawnSync("taskkill", ["/pid", String(server.pid), "/t", "/f"], { stdio: "ignore" })
    return
  }

  server.kill("SIGTERM")
}

let failure = null

try {
  const candidates = [
    process.env.E2E_BASE_URL,
    process.env.E2E_PORT ? baseUrl : "http://127.0.0.1:3000",
    baseUrl,
  ].filter(Boolean)
  const uniqueCandidates = Array.from(new Set(candidates))
  let reusedExistingServer = false

  for (const candidate of uniqueCandidates) {
    if (await canServeRoutes(candidate)) {
      baseUrl = candidate
      reusedExistingServer = true
      break
    }
  }

  if (!reusedExistingServer) {
    const command =
      process.platform === "win32"
        ? `npm.cmd run dev -- --hostname 127.0.0.1 --port ${port}`
        : "npm"
    const args =
      process.platform === "win32"
        ? []
        : ["run", "dev", "--", "--hostname", "127.0.0.1", "--port", String(port)]

    server = spawn(command, args, {
      cwd: appDir,
      stdio: "pipe",
      shell: process.platform === "win32",
      env: {
        ...process.env,
        NEXT_TELEMETRY_DISABLED: "1",
      },
    })

    server.stdout.on("data", (chunk) => {
      output += chunk.toString()
    })
    server.stderr.on("data", (chunk) => {
      output += chunk.toString()
    })

    await waitForServer(baseUrl)
  }

  for (const route of routes) {
    const response = await fetch(`${baseUrl}${route}`)
    assert.equal(response.status, 200, `${route} should return 200`)
    const html = await response.text()
    assert.equal(pageLooksLikeYasashi(html), true, `${route} should return a Next.js page`)
  }

  console.log(`HTTP smoke checks passed for ${routes.length} routes at ${baseUrl}`)
} catch (error) {
  console.error(output)
  failure = error
} finally {
  stopServer()
  server?.stdout.destroy()
  server?.stderr.destroy()
}

if (failure) {
  console.error(failure)
  process.exit(1)
} else {
  process.exit(0)
}
