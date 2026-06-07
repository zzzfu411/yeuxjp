import { spawn, spawnSync } from "node:child_process"
import assert from "node:assert/strict"
import { fileURLToPath } from "node:url"

const port = Number(process.env.E2E_PORT ?? 3210)
let baseUrl = process.env.E2E_BASE_URL ?? `http://127.0.0.1:${port}`

async function importPlaywright() {
  try {
    return await import("playwright")
  } catch (error) {
    console.error("Browser E2E requires Playwright. Install browser dependencies or set E2E_BASE_URL and run in an environment with Playwright available.")
    console.error(error instanceof Error ? error.message : String(error))
    process.exit(2)
  }
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function canReach(url) {
  try {
    const response = await fetch(url)
    return response.ok
  } catch {
    return false
  }
}

async function waitForServer(url) {
  const deadline = Date.now() + 60_000
  while (Date.now() < deadline) {
    if (await canReach(url)) return
    await wait(500)
  }
  throw new Error(`Timed out waiting for ${url}`)
}

const appDir = fileURLToPath(new URL("../..", import.meta.url))
let server = null
let output = ""

function stopServer() {
  if (!server?.pid) return
  if (process.platform === "win32") {
    spawnSync("taskkill", ["/pid", String(server.pid), "/t", "/f"], { stdio: "ignore" })
    return
  }
  server.kill("SIGTERM")
}

async function ensureServer() {
  const candidates = [
    process.env.E2E_BASE_URL,
    process.env.E2E_PORT ? baseUrl : "http://127.0.0.1:3000",
    baseUrl,
  ].filter(Boolean)

  for (const candidate of Array.from(new Set(candidates))) {
    if (await canReach(candidate)) {
      baseUrl = candidate
      return
    }
  }

  const command = process.platform === "win32" ? `npm.cmd run dev -- --hostname 127.0.0.1 --port ${port}` : "npm"
  const args = process.platform === "win32" ? [] : ["run", "dev", "--", "--hostname", "127.0.0.1", "--port", String(port)]
  server = spawn(command, args, {
    cwd: appDir,
    stdio: "pipe",
    shell: process.platform === "win32",
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

async function seedReviewState(page) {
  await page.goto(baseUrl, { waitUntil: "networkidle" })
  await page.evaluate(() => {
    const now = Date.now()
    localStorage.setItem(
      "yasashi.srs.kana.v1",
      JSON.stringify({ a: { box: 1, dueAt: now - 1, createdAt: now - 1000, right: 0, wrong: 0 } })
    )
  })
}

let browser = null
let failure = null

try {
  const { chromium } = await importPlaywright()
  await ensureServer()
  browser = await chromium.launch({ headless: true })
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })

  await page.goto(baseUrl, { waitUntil: "networkidle" })
  await assert.doesNotReject(() => page.getByRole("link", { name: /开始今日学习/ }).click())
  await page.waitForURL(/\/learn\//)
  await page.getByRole("button", { name: /继续/ }).click()
  await page.getByRole("button", { name: "a" }).click()
  assert.ok(await page.getByText(/答对了|再看一眼/).isVisible())

  await page.goto(`${baseUrl}/kana`, { waitUntil: "networkidle" })
  await page.getByRole("button", { name: /打开 あ/ }).click()
  await page.getByRole("button", { name: /笔顺/ }).click()
  assert.ok(await page.getByLabel(/笔顺：a|Stroke order/).isVisible())

  await page.goto(`${baseUrl}/vocabulary`, { waitUntil: "networkidle" })
  await page.getByPlaceholder("搜索单词...").fill("みず")
  assert.ok(await page.getByText("みず").first().isVisible())

  await page.goto(`${baseUrl}/quiz`, { waitUntil: "networkidle" })
  await page.getByText("基础假名").click()
  await page.waitForSelector("button")
  assert.ok(await page.getByText(/得分:/).isVisible())

  await seedReviewState(page)
  await page.goto(`${baseUrl}/review`, { waitUntil: "networkidle" })
  await page.getByRole("button", { name: "开始" }).first().click()
  assert.ok(await page.getByText(/剩余:|今日剩余:/).isVisible())

  console.log(`Browser E2E checks passed at ${baseUrl}`)
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
