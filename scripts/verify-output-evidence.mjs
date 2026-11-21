import assert from "node:assert/strict"
import { chromium } from "playwright"
import { loadTsModule } from "../tests/unit/load-ts-module.mjs"
const { STORAGE_KEYS } = await loadTsModule("src/lib/storage-keys.ts")
const base = process.env.E2E_BASE_URL ?? "http://127.0.0.1:3218"
const browser = await chromium.launch({ headless: true })
try {
  const page = await browser.newPage({ serviceWorkers: "block" })
  await page.goto(base, { waitUntil: "networkidle" })
  await page.evaluate(key => localStorage.setItem(key, JSON.stringify({ legacy: {
    itemId: "legacy", itemType: "grammar", recognition: 0, listening: 0, meaning: 0, recall: 0,
    production: 100, attempts: 6, correct: 6, assessedModes: ["production"], updatedAt: 100,
  } })), STORAGE_KEYS.ITEM_PROGRESS)
  await page.goto(`${base}/path`, { waitUntil: "networkidle" })
  await page.getByTestId("path-progress-details").locator("summary").click()
  assert.match(await page.getByText("独立输入表现", { exact: true }).locator("..").innerText(), /尚未测试/)
  await page.goto(`${base}/quiz?mode=verb-conjugation`, { waitUntil: "networkidle" })
  await page.locator('[data-testid^="quiz-answer-option-"]').first().click()
  await page.getByTestId("quiz-answer-feedback").waitFor()
  const result = await page.evaluate(key => JSON.parse(localStorage.getItem(key)).at(-1), STORAGE_KEYS.PRACTICE_RESULTS)
  assert.equal(result.mode, "recognition")
  assert.equal(result.responseFormat, "choice")
  await page.goto(`${base}/path`, { waitUntil: "networkidle" })
  await page.getByTestId("path-progress-details").locator("summary").click()
  assert.match(await page.getByText("独立输入表现", { exact: true }).locator("..").innerText(), /尚未测试/)
  const legacy = await page.evaluate(key => JSON.parse(localStorage.getItem(key)).legacy, STORAGE_KEYS.ITEM_PROGRESS)
  assert.equal(legacy.production, 100)
  assert.equal(legacy.attempts, 6)
  console.log("Output evidence UI passed: legacy scores retained, choice recorded as recognition, independent output remains untested.")
} finally { await browser.close() }
