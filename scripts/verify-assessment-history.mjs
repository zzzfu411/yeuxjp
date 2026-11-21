import assert from "node:assert/strict"
import { chromium } from "playwright"
import { loadTsModule } from "../tests/unit/load-ts-module.mjs"
const { STORAGE_KEYS } = await loadTsModule("src/lib/storage-keys.ts")
const { CURRENT_ASSESSMENT_REVISION } = await loadTsModule("src/lib/assessment-evidence.ts")
const { grammarData } = await loadTsModule("src/data/grammar-data.ts")
const point = Object.values(grammarData).flat().find(p => p.id === "n3-you-ni")
const base = process.env.E2E_BASE_URL ?? "http://127.0.0.1:3218"
const browser = await chromium.launch({ headless: true })
try {
  const page = await browser.newPage({ serviceWorkers: "block" })
  const errors = []
  page.on("pageerror", e => errors.push(e.message))
  await page.goto(base, { waitUntil: "networkidle" })
  await page.evaluate(key => localStorage.setItem(key, JSON.stringify({ "n3-you-ni": {
    itemId: "n3-you-ni", itemType: "grammar", recognition: 100, listening: 0, meaning: 0, recall: 0, production: 0,
    assessedModes: ["recognition"], attempts: 6, correct: 6, updatedAt: 10,
  } })), STORAGE_KEYS.ITEM_PROGRESS)
  await page.goto(`${base}/path`, { waitUntil: "networkidle" })
  await page.getByTestId("path-progress-details").locator("summary").click()
  await page.getByTestId("assessment-retest-notice").waitFor()
  await page.goto(`${base}/grammar?level=N3&item=n3-you-ni`, { waitUntil: "networkidle" })
  await page.getByTestId("grammar-practice-start").click()
  await page.locator('[data-testid^="grammar-practice-answer-"]').filter({ hasText: point.practiceTemplates[0].answer }).click()
  await page.getByTestId("grammar-practice-feedback").waitFor()
  await page.waitForFunction(key => JSON.parse(localStorage.getItem(key))["n3-you-ni"].assessmentEvidence?.recognition?.attempts === 1, STORAGE_KEYS.ITEM_PROGRESS)
  const stored = await page.evaluate(keys => ({ item: JSON.parse(localStorage.getItem(keys.ITEM_PROGRESS))["n3-you-ni"],
    result: JSON.parse(localStorage.getItem(keys.PRACTICE_RESULTS)).at(-1) }), STORAGE_KEYS)
  assert.equal(stored.item.recognition, 100)
  assert.deepEqual(stored.item.assessmentEvidence.recognition, { score: 18, attempts: 1, correct: 1 })
  assert.equal(stored.result.assessmentRevision, CURRENT_ASSESSMENT_REVISION)
  await page.goto(`${base}/path`, { waitUntil: "networkidle" })
  await page.getByTestId("path-progress-details").locator("summary").click()
  assert.equal(await page.getByTestId("assessment-retest-notice").count(), 0)
  assert.match(await page.getByText("已测能力均分", { exact: true }).locator("..").innerText(), /18%/)
  assert.deepEqual(errors, [])
  console.log("Historical evidence UI passed: affected legacy score excluded, new answer measured independently, raw 100 retained after reload.")
} finally { await browser.close() }
